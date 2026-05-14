/* Root App — routes: Home (notebooks) → ModuleList → Handbook */

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './sidebar.jsx';
import { Editor } from './editor.jsx';
import HomeScreen from './home.jsx';
import ModuleListScreen from './module-list.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakButton } from './tweaks-panel.jsx';
import SEED_DATA from '../Scripts/data.js';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "#5BAA50",
  "density": "comfortable"
}/*EDITMODE-END*/;

const LS_KEY     = "notebook_v3";
const LS_KEY_OLD = "odoo18_handbook_v2";

/* Shared init — reads storage once, resolves URL → state */
const initState = (() => {
  let data;
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) { data = JSON.parse(s); }
    else {
      /* migrate old flat format */
      const old = localStorage.getItem(LS_KEY_OLD);
      if (old) {
        const o = JSON.parse(old);
        if (o?.modules) {
          data = {
            notebooks: [{
              id: "nb_odoo18", name: "Odoo 18", tech: "odoo18",
              color: "#1F6B40", icon: "ti-settings",
              tags: ["ERP", "Odoo", "Backend"],
              description: "Sổ tay nghiên cứu các module chuẩn của Odoo 18.",
              updatedAt: new Date().toISOString().slice(0, 10),
              modules: o.modules
            }]
          };
        }
      }
    }
  } catch (_) {}
  if (!data) data = SEED_DATA;

  const modMatch = location.pathname.match(/^\/module\/([^/]+)/);
  const nbMatch  = location.pathname.match(/^\/notebook\/([^/]+)/);

  let activeNbId = null, activeModId = null, screen = "home";
  if (nbMatch) {
    activeNbId = nbMatch[1];
    screen = "notebook";
  } else if (modMatch) {
    activeModId = modMatch[1];
    const nb = data.notebooks?.find(nb => nb.modules?.some(m => m.id === activeModId));
    if (nb) { activeNbId = nb.id; screen = "handbook"; }
  }

  return { data, activeNbId, activeModId, screen };
})();

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [data,        setData]        = useState(initState.data);
  const [activeNbId,  setActiveNbId]  = useState(initState.activeNbId);
  const [activeModId, setActiveModId] = useState(initState.activeModId);
  const [screen,      setScreen]      = useState(initState.screen);
  const [selection,   setSelection]   = useState({ type: "overview" });
  const [saveState,   setSaveState]   = useState({ kind: "saved", at: nowHHMM() });
  const [toast,       setToast]       = useState(null);
  const skipDirtyRef = useRef(true);

  /* ── theme ── */
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.style.setProperty("--blue", tweaks.accent);
    document.documentElement.style.setProperty("--blue-hi", shade(tweaks.accent, -15));
    document.documentElement.style.setProperty("--blue-bg", tint(tweaks.accent, 0.85));
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.accent, tweaks.density]);

  useEffect(() => {
    if (skipDirtyRef.current) { skipDirtyRef.current = false; return; }
    setSaveState({ kind: "dirty" });
  }, [data]);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function save() {
    setSaveState({ kind: "saving" });
    setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (_) {}
      setSaveState({ kind: "saved", at: nowHHMM() });
      showToast("Đã lưu mọi thay đổi vào hệ thống!");
    }, 400);
  }
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  /* ── Derived ── */
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
    setActiveNbId(nbId);
    setActiveModId(null);
    setScreen("notebook");
  }
  function openModule(modId) {
    history.pushState(null, "", "/module/" + modId);
    setActiveModId(modId);
    setScreen("handbook");
    setSelection({ type: "overview" });
  }
  function backToNotebook() {
    history.pushState(null, "", "/notebook/" + activeNbId);
    setActiveModId(null);
    setScreen("notebook");
  }
  function backToHome() {
    history.pushState(null, "", "/");
    setActiveNbId(null);
    setActiveModId(null);
    setScreen("home");
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

  return (
    <div className="app-root">

      {screen === "handbook" && activeMod ? (
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
            setData={setData}
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
          <TweakButton label="Reset về dữ liệu mẫu" onClick={() => {
            if (!confirm("Reset toàn bộ về dữ liệu mẫu? Mất các thay đổi hiện tại.")) return;
            localStorage.removeItem(LS_KEY);
            location.reload();
          }} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function nowHHMM() {
  const d = new Date();
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
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
  const mix = (c) => Math.round(c + (255 - c) * alpha);
  return "#" + [mix(r),mix(g),mix(b)].map(n => n.toString(16).padStart(2,"0")).join("");
}

export default App;
