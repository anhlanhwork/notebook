/* Root App — Auth gate + Firestore sync + routing */

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './sidebar.jsx';
import { Editor } from './editor.jsx';
import HomeScreen from './home.jsx';
import ModuleListScreen from './module-list.jsx';
import { SharedView } from './shared-view.jsx';
import LoginScreen from './login.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakButton } from './tweaks-panel.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { subscribeNotebooks, upsertNotebook, removeNotebook } from '../services/db.js';
import SEED_DATA from '../Scripts/data.js';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "#5BAA50",
  "density": "comfortable"
}/*EDITMODE-END*/;

const LS_KEY     = "notebook_v3";
const LS_KEY_OLD = "odoo18_handbook_v2";

/* Parse current URL into a typed descriptor (no storage reads) */
function parseUrl() {
  const shareMatch = location.pathname.match(/^\/share\/([^/]+)/);
  const nbMatch    = location.pathname.match(/^\/notebook\/([^/]+)/);
  const modMatch   = location.pathname.match(/^\/module\/([^/]+)/);
  if (shareMatch) return { type: 'share',    token: shareMatch[1] };
  if (nbMatch)    return { type: 'notebook', nbId:  nbMatch[1] };
  if (modMatch)   return { type: 'module',   modId: modMatch[1] };
  return { type: 'home' };
}

/* Read old localStorage data for one-time migration, then clear it */
function consumeLocalStorage() {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) {
      const d = JSON.parse(s);
      if (d?.notebooks?.length) return d.notebooks;
    }
    const old = localStorage.getItem(LS_KEY_OLD);
    if (old) {
      const o = JSON.parse(old);
      if (o?.modules?.length) {
        return [{
          id: "nb_odoo18", name: "Odoo 18", tech: "odoo18",
          color: "#1F6B40", icon: "ti-settings",
          tags: ["ERP", "Odoo", "Backend"],
          description: "Sổ tay nghiên cứu các module chuẩn của Odoo 18.",
          updatedAt: new Date().toISOString().slice(0, 10),
          modules: o.modules
        }];
      }
    }
  } catch (_) {}
  return null;
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [data,       setData]       = useState({ notebooks: [] });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [screen,     setScreen]     = useState("loading");
  const [activeNbId, setActiveNbId] = useState(null);
  const [activeModId,setActiveModId]= useState(null);
  const [shareToken, setShareToken] = useState(null);
  const [selection,  setSelection]  = useState({ type: "overview" });
  const [saveState,  setSaveState]  = useState({ kind: "saved", at: nowHHMM() });
  const [toast,      setToast]      = useState(null);

  /* Refs to avoid stale-closure issues in async callbacks */
  const dataRef           = useRef(data);
  const isRemoteUpdateRef = useRef(false);
  const skipDirtyRef      = useRef(true);
  const saveTimerRef      = useRef(null);
  const migrationDoneRef  = useRef(false);
  const dataLoadedRef     = useRef(false);   // ref mirror of dataLoaded for async callbacks
  const urlRef            = useRef(parseUrl());

  useEffect(() => { dataRef.current = data; }, [data]);

  /* ── Theme ── */
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.style.setProperty("--blue", tweaks.accent);
    document.documentElement.style.setProperty("--blue-hi", shade(tweaks.accent, -15));
    document.documentElement.style.setProperty("--blue-bg", tint(tweaks.accent, 0.85));
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.accent, tweaks.density]);

  /* ── Keyboard save ── */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ── Auth + Firestore subscription ── */
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      /* Unauthenticated: share routes stay public, everything else → login */
      if (urlRef.current.type === 'share') {
        setShareToken(urlRef.current.token);
        setScreen("share");
      } else {
        setScreen("login");
      }
      return;
    }

    /* User is logged in — subscribe to their notebooks */
    const unsub = subscribeNotebooks(user.uid, async (notebooks) => {
      /* One-time migration: Firestore trống → seed từ localStorage */
      if (!migrationDoneRef.current) {
        migrationDoneRef.current = true;
        if (notebooks.length === 0) {
          const local = consumeLocalStorage();
          const seed  = local || SEED_DATA.notebooks || [];
          if (seed.length > 0) {
            await Promise.all(seed.map(nb => upsertNotebook(user.uid, nb)));
            return; /* snapshot tiếp theo sẽ có dữ liệu */
          }
        }
      }

      /* Mọi snapshot đều cập nhật state */
      isRemoteUpdateRef.current = true;
      setData({ notebooks });

      /* Lần đầu tiên có dữ liệu: resolve URL và đánh dấu loaded */
      if (!dataLoadedRef.current) {
        dataLoadedRef.current = true;
        setDataLoaded(true);
        resolveUrl(notebooks);
      }
    });

    return () => {
      unsub();
      migrationDoneRef.current = false;
    };
  }, [user, authLoading]);

  /* ── Resolve URL after first data load ── */
  function resolveUrl(notebooks) {
    const url = urlRef.current;
    if (url.type === 'share') {
      setShareToken(url.token);
      setScreen("share");
    } else if (url.type === 'notebook') {
      if (notebooks.find(nb => nb.id === url.nbId)) {
        setActiveNbId(url.nbId);
        setScreen("notebook");
      } else {
        setScreen("home");
      }
    } else if (url.type === 'module') {
      const nb = notebooks.find(nb => nb.modules?.some(m => m.id === url.modId));
      if (nb) {
        setActiveNbId(nb.id);
        setActiveModId(url.modId);
        setScreen("handbook");
      } else {
        setScreen("home");
      }
    } else {
      setScreen("home");
    }
  }

  /* ── Dirty detection + debounced auto-save ── */
  useEffect(() => {
    /* Skip updates that originated from Firestore (avoid write-loop) */
    if (isRemoteUpdateRef.current) { isRemoteUpdateRef.current = false; return; }
    if (skipDirtyRef.current)      { skipDirtyRef.current = false; return; }
    if (!dataLoaded) return;

    setSaveState({ kind: "dirty" });

    if (!user) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(save, 2500);
  }, [data]);

  /* ── Save to Firestore ── */
  async function save() {
    if (!user) return;
    clearTimeout(saveTimerRef.current);
    setSaveState({ kind: "saving" });
    try {
      const notebooks = dataRef.current.notebooks;
      await Promise.all(notebooks.map(nb => upsertNotebook(user.uid, nb)));
      setSaveState({ kind: "saved", at: nowHHMM() });
      showToast("Đã đồng bộ lên Firestore!");
      /* Clear localStorage after first successful cloud save */
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_KEY_OLD);
    } catch (err) {
      console.error("Firestore save failed:", err);
      setSaveState({ kind: "dirty" });
      showToast("Lưu thất bại — kiểm tra kết nối mạng");
    }
  }

  /* ── setData wrapper that also removes deleted notebooks from Firestore ── */
  function handleSetData(newData) {
    const deletedIds = data.notebooks
      .filter(nb => !newData.notebooks.some(n => n.id === nb.id))
      .map(nb => nb.id);
    setData(newData);
    if (user && deletedIds.length > 0) {
      deletedIds.forEach(id => removeNotebook(id).catch(console.error));
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  /* ── Derived state ── */
  const activeNotebook = activeNbId
    ? data.notebooks?.find(nb => nb.id === activeNbId)
    : null;
  const activeMod = (activeModId && activeNotebook)
    ? activeNotebook.modules?.find(m => m.id === activeModId)
    : null;

  /* ── Updaters ── */
  function setActiveNotebook(updated) {
    setData({ ...data, notebooks: data.notebooks.map(nb => nb.id === activeNbId ? updated : nb) });
  }
  function setActiveMod(updated) {
    setActiveNotebook({
      ...activeNotebook,
      modules: activeNotebook.modules.map(m => m.id === activeModId ? updated : m)
    });
  }

  /* ── Navigation ── */
  useEffect(() => {
    function onPop() {
      const modM = location.pathname.match(/^\/module\/([^/]+)/);
      const nbM  = location.pathname.match(/^\/notebook\/([^/]+)/);
      if (modM) {
        setActiveModId(modM[1]);
        setScreen("handbook");
        setSelection({ type: "overview" });
      } else if (nbM) {
        setActiveNbId(nbM[1]);
        setActiveModId(null);
        setScreen("notebook");
      } else {
        setActiveNbId(null);
        setActiveModId(null);
        setScreen("home");
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function openNotebook(nbId) {
    history.pushState(null, "", "/notebook/" + nbId);
    setActiveNbId(nbId); setActiveModId(null); setScreen("notebook");
  }
  function openModule(modId) {
    history.pushState(null, "", "/module/" + modId);
    setActiveModId(modId); setScreen("handbook"); setSelection({ type: "overview" });
  }
  function backToNotebook() {
    history.pushState(null, "", "/notebook/" + activeNbId);
    setActiveModId(null); setScreen("notebook");
  }
  function backToHome() {
    history.pushState(null, "", "/");
    setActiveNbId(null); setActiveModId(null); setScreen("home");
  }

  /* ── Feature CRUD ── */
  function addFeature() {
    if (!activeMod) return;
    const id   = "f_" + Math.random().toString(36).slice(2, 6);
    const name = prompt("Tên tính năng mới:", "Tính năng mới");
    if (!name) return;
    const newF = { id, name, desc: "", models: { cards: [] }, flows: [], detailBlocks: [], integrations: [], notes: "" };
    setActiveMod({ ...activeMod, features: [...activeMod.features, newF] });
    setSelection({ type: "feature", featId: id });
  }
  function renameFeature(featId) {
    const f = activeMod?.features.find(x => x.id === featId);
    if (!f) return;
    const name = prompt("Đổi tên tính năng:", f.name);
    if (!name) return;
    setActiveMod({ ...activeMod, features: activeMod.features.map(x => x.id === featId ? { ...x, name } : x) });
  }
  function deleteFeature(featId) {
    if (!confirm("Xóa tính năng này?")) return;
    setActiveMod({ ...activeMod, features: activeMod.features.filter(x => x.id !== featId) });
    if (selection.featId === featId) setSelection({ type: "overview" });
  }

  /* ── Savebar ── */
  const Savebar = () => (
    <div className="app-list-savebar">
      <span className={"save-state save-" + saveState.kind}>
        {saveState.kind === "dirty"  && <><i className="ti ti-circle-dot"></i> Có thay đổi chưa lưu</>}
        {saveState.kind === "saved"  && <><i className="ti ti-check"></i> Đã lưu lúc {saveState.at}</>}
        {saveState.kind === "saving" && <><i className="ti ti-loader-2 spin"></i> Đang lưu...</>}
      </span>
      <button className="btn-primary" onClick={save}>
        <i className="ti ti-device-floppy"></i> Lưu thay đổi <kbd className="btn-kbd">⌘S</kbd>
      </button>
    </div>
  );

  /* ── Auth / loading gates ── */
  if (authLoading || screen === "loading" || (user && !dataLoaded)) {
    return (
      <div className="app-loading">
        <i className="ti ti-loader-2 spin app-loading-icon"></i>
      </div>
    );
  }

  if (!user && screen !== "share") return <LoginScreen />;

  /* ── Main app ── */
  return (
    <div className="app-root">

      {screen === "share" && shareToken ? (
        <SharedView token={shareToken} />

      ) : screen === "handbook" && activeMod ? (
        <div className="app-shell">
          <Sidebar
            mod={activeMod}
            selection={selection}
            onSelect={setSelection}
            onAddFeature={addFeature}
            onRenameFeature={renameFeature}
            onDeleteFeature={deleteFeature}
            onBackToModules={backToNotebook}
          />
          <Editor
            mod={activeMod}
            setMod={setActiveMod}
            selection={selection}
            accent={tweaks.accent}
            onSave={save}
            saveState={saveState}
            onBackToModules={backToNotebook}
            notebook={activeNotebook}
            onBackToHome={backToHome}
          />
        </div>

      ) : screen === "notebook" && activeNotebook ? (
        <div className="app-shell app-shell-list">
          <ModuleListScreen
            notebook={activeNotebook}
            setNotebook={setActiveNotebook}
            onOpen={openModule}
            onBack={backToHome}
          />
          <Savebar />
        </div>

      ) : (
        <div className="app-shell app-shell-list">
          <HomeScreen
            data={data}
            setData={handleSetData}
            onOpen={openNotebook}
          />
          <Savebar />
        </div>
      )}

      {toast && (
        <div className="toast">
          <i className="ti ti-circle-check"></i>
          <span>{toast}</span>
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Giao diện">
          <TweakRadio label="Chế độ"
                      value={tweaks.theme}
                      onChange={(v) => setTweak("theme", v)}
                      options={["light", "dark"]} />
          <TweakColor label="Màu nhấn"
                      value={tweaks.accent}
                      onChange={(v) => setTweak("accent", v)}
                      options={["#5BAA50", "#1F6B40", "#378ADD", "#D85A30"]} />
          <TweakRadio label="Mật độ"
                      value={tweaks.density}
                      onChange={(v) => setTweak("density", v)}
                      options={["comfortable", "compact"]} />
        </TweakSection>
        <TweakSection label="Dữ liệu">
          <TweakButton label="Reset về dữ liệu mẫu" onClick={async () => {
            if (!confirm("Reset toàn bộ về dữ liệu mẫu? Xoá tất cả sổ tay hiện tại.")) return;
            if (!user) return;
            await Promise.all(data.notebooks.map(nb => removeNotebook(nb.id)));
            await Promise.all(SEED_DATA.notebooks.map(nb => upsertNotebook(user.uid, nb)));
          }} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function nowHHMM() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
function shade(hex, percent) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  const f = (n) => Math.max(0, Math.min(255, Math.round(n + (percent / 100) * (percent > 0 ? 255 - n : n))));
  return "#" + [f(r),f(g),f(b)].map(n => n.toString(16).padStart(2,"0")).join("");
}
function tint(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return "#" + [Math.round(r+(255-r)*alpha),Math.round(g+(255-g)*alpha),Math.round(b+(255-b)*alpha)]
    .map(n => n.toString(16).padStart(2,"0")).join("");
}

export default App;
