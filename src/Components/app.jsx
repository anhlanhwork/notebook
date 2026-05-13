/* Root App — routes between module-list screen and handbook view. */

const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "#5BAA50",
  "density": "comfortable"
}/*EDITMODE-END*/;

const LS_KEY = "odoo18_handbook_v2";

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [data, setData] = useStateApp(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return window.SEED_DATA;
  });
  const [activeModId, setActiveModId] = useStateApp(null); // null = module list screen
  const [selection, setSelection] = useStateApp({ type: "overview" });
  const [saveState, setSaveState] = useStateApp({ kind: "saved", at: nowHHMM() });
  const [toast, setToast] = useStateApp(null);
  const skipDirtyRef = useRefApp(true);

  // theme
  useEffectApp(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.style.setProperty("--blue", tweaks.accent);
    document.documentElement.style.setProperty("--blue-hi", shade(tweaks.accent, -15));
    document.documentElement.style.setProperty("--blue-bg", tint(tweaks.accent, 0.85));
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.accent, tweaks.density]);

  useEffectApp(() => {
    if (skipDirtyRef.current) { skipDirtyRef.current = false; return; }
    setSaveState({ kind: "dirty" });
  }, [data]);

  useEffectApp(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function save() {
    setSaveState({ kind: "saving" });
    setTimeout(() => {
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {}
      setSaveState({ kind: "saved", at: nowHHMM() });
      showToast("Đã lưu mọi thay đổi vào hệ thống!");
    }, 400);
  }
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  const activeMod = activeModId ? data.modules.find(m => m.id === activeModId) : null;

  function setActiveMod(updated) {
    setData({
      ...data,
      modules: data.modules.map(m => m.id === activeModId ? updated : m)
    });
  }
  function openModule(id) {
    setActiveModId(id);
    setSelection({ type: "overview" });
  }
  function backToModules() {
    setActiveModId(null);
  }

  function addFeature() {
    if (!activeMod) return;
    const id = "f_" + Math.random().toString(36).slice(2, 6);
    const name = prompt("Tên tính năng mới:", "Tính năng mới");
    if (!name) return;
    const newF = {
      id, name, desc: "",
      models: { cards: [] },
      flows: [],
      detailBlocks: [],
      integrations: [],
      notes: ""
    };
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

  return (
    <div className="app-root">
      <header className="topbar">
        <button className="tb-brand tb-brand-btn" onClick={backToModules}>
          <i className="ti ti-settings-automation tb-brand-glyph"></i>
          <div className="tb-brand-text">
            <div className="tb-brand-name">Odoo 18</div>
            <div className="tb-brand-sub">System Design Handbook</div>
          </div>
        </button>
        <div className="tb-sep"></div>
        <div className="tb-context">
          <button className="tb-crumb-btn" onClick={backToModules}>
            <i className="ti ti-folders"></i>
            <span>Sổ tay nội bộ</span>
          </button>
          {activeMod && (
            <>
              <i className="ti ti-chevron-right tb-chev"></i>
              <span className="tb-context-active">{activeMod.name}</span>
            </>
          )}
        </div>
        <div className="tb-grow"></div>
        <button className="tb-btn" title="Tìm kiếm">
          <i className="ti ti-search"></i>
          <kbd className="tb-kbd">⌘K</kbd>
        </button>
        <button className="tb-btn" title="Trợ giúp">
          <i className="ti ti-help"></i>
        </button>
        <div className="tb-user">
          <div className="tb-avatar">NL</div>
        </div>
      </header>

      {activeMod ? (
        <div className="app-shell">
          <Sidebar
            mod={activeMod}
            selection={selection}
            onSelect={setSelection}
            onAddFeature={addFeature}
            onRenameFeature={renameFeature}
            onDeleteFeature={deleteFeature}
            onBackToModules={backToModules}
          />
          <Editor
            mod={activeMod}
            setMod={setActiveMod}
            selection={selection}
            accent={tweaks.accent}
            onSave={save}
            saveState={saveState}
            onBackToModules={backToModules}
          />
        </div>
      ) : (
        <div className="app-shell app-shell-list">
          <ModuleListScreen data={data} setData={setData} onOpen={openModule} />
          <div className="app-list-savebar">
            <span className={"save-state save-" + saveState.kind}>
              {saveState.kind === "dirty" && <><i className="ti ti-circle-dot"></i> Có thay đổi chưa lưu</>}
              {saveState.kind === "saved" && <><i className="ti ti-check"></i> Đã lưu lúc {saveState.at}</>}
              {saveState.kind === "saving" && <><i className="ti ti-loader-2 spin"></i> Đang lưu...</>}
            </span>
            <button className="btn-primary" onClick={save}>
              <i className="ti ti-device-floppy"></i> Lưu thay đổi <kbd className="btn-kbd">⌘S</kbd>
            </button>
          </div>
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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
