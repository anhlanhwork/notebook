/* Module list screen — grid of module cards.
   Click a card to open that module's handbook.
   Add new module via modal. */

const { useState: useStateML } = React;

const STATUS_META = {
  pending:  { label: "Chưa bắt đầu",   color: "var(--text3)",  bg: "var(--bg3)" },
  studying: { label: "Đang nghiên cứu", color: "var(--warn-bd)", bg: "var(--warn-bg)" },
  done:     { label: "Hoàn thành",     color: "var(--success)", bg: "var(--success-bg)" }
};

const MODULE_ICONS = {
  sale:     "ti-shopping-cart",
  purchase: "ti-shopping-bag",
  stock:    "ti-package",
  account:  "ti-calculator",
  crm:      "ti-users",
  hr:       "ti-id-badge",
  default:  "ti-cube"
};

const PRESET_COLORS = [
  "#5BAA50", "#1F6B40", "#378ADD", "#BA7517",
  "#D85A30", "#7F77DD", "#D4537E", "#1D9E75", "#E24B4A"
];

function ModuleListScreen({ data, setData, onOpen }) {
  const [query, setQuery] = useStateML("");
  const [statusFilter, setStatusFilter] = useStateML("all");
  const [modalOpen, setModalOpen] = useStateML(false);
  const [draft, setDraft] = useStateML({ name: "", tech: "", color: PRESET_COLORS[0], category: "" });

  const filtered = data.modules.filter(m => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.tech.toLowerCase().includes(q) ||
           (m.overview?.category || "").toLowerCase().includes(q);
  });

  const counts = {
    all:       data.modules.length,
    studying:  data.modules.filter(m => m.status === "studying").length,
    done:      data.modules.filter(m => m.status === "done").length,
    pending:   data.modules.filter(m => m.status === "pending").length
  };

  function openAddModal() {
    setDraft({ name: "", tech: "", color: PRESET_COLORS[0], category: "" });
    setModalOpen(true);
  }

  function submitAdd() {
    if (!draft.name.trim()) return;
    const tech = draft.tech.trim() || draft.name.toLowerCase().replace(/\s+/g, "_");
    const newMod = {
      id: "mod_" + Math.random().toString(36).slice(2, 7),
      name: draft.name.trim(),
      tech, color: draft.color, status: "pending",
      updatedAt: new Date().toISOString().slice(0, 10),
      overview: {
        version: "18.0", category: draft.category.trim() || "—",
        depends: "base, mail", menu: "", purpose: ""
      },
      mainFlows: [],
      features: []
    };
    setData({ ...data, modules: [...data.modules, newMod] });
    setModalOpen(false);
    onOpen(newMod.id);
  }

  function deleteModule(id, e) {
    e.stopPropagation();
    if (!confirm("Xóa module này khỏi sổ tay?")) return;
    setData({ ...data, modules: data.modules.filter(m => m.id !== id) });
  }

  return (
    <div className="ml-screen">
      <div className="ml-header">
        <div className="ml-header-row">
          <div>
            <div className="eyebrow">Sổ tay nội bộ</div>
            <h1 className="ml-title">Tất cả modules</h1>
            <p className="ml-sub">{data.modules.length} module · {data.modules.reduce((s, m) => s + (m.features?.length || 0), 0)} tính năng đã ghi chép</p>
          </div>
          <button className="btn-primary" onClick={openAddModal}>
            <i className="ti ti-plus"></i> Thêm module
          </button>
        </div>

        <div className="ml-toolbar">
          <div className="ml-search">
            <i className="ti ti-search"></i>
            <input
              placeholder="Tìm module, technical name, danh mục..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && <button onClick={() => setQuery("")}><i className="ti ti-x"></i></button>}
          </div>
          <div className="ml-filters">
            {[
              ["all",      "Tất cả"],
              ["studying", "Đang ng/c"],
              ["done",     "Hoàn thành"],
              ["pending",  "Chưa bắt đầu"]
            ].map(([k, l]) => (
              <button key={k}
                      className={"ml-filter" + (statusFilter === k ? " active" : "")}
                      onClick={() => setStatusFilter(k)}>
                {l}
                <span className="ml-filter-count">{counts[k]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ml-grid">
        {filtered.map(m => {
          const icon = MODULE_ICONS[m.tech] || MODULE_ICONS.default;
          const st = STATUS_META[m.status] || STATUS_META.pending;
          const featCount = m.features?.length || 0;
          const flowCount = (m.mainFlows?.length || 0) +
                            (m.features?.reduce((s, f) => s + (f.flows?.length || 0), 0) || 0);
          return (
            <div key={m.id} className="ml-card" onClick={() => onOpen(m.id)}>
              <div className="ml-card-bar" style={{ background: m.color }}></div>
              <div className="ml-card-body">
                <div className="ml-card-head">
                  <div className="ml-card-icon" style={{ background: m.color }}>
                    <i className={"ti " + icon}></i>
                  </div>
                  <div className="ml-card-name-wrap">
                    <div className="ml-card-name">{m.name}</div>
                    <code className="ml-card-tech">{m.tech}</code>
                  </div>
                  <button className="ml-card-del" onClick={(e) => deleteModule(m.id, e)} title="Xóa">
                    <i className="ti ti-trash"></i>
                  </button>
                </div>

                <div className="ml-card-purpose">
                  {m.overview?.purpose || <span className="ml-card-empty">Chưa có mô tả</span>}
                </div>

                <div className="ml-card-stats">
                  <div className="ml-card-stat">
                    <i className="ti ti-puzzle"></i>
                    <span><b>{featCount}</b> tính năng</span>
                  </div>
                  <div className="ml-card-stat">
                    <i className="ti ti-git-branch"></i>
                    <span><b>{flowCount}</b> luồng</span>
                  </div>
                  <div className="ml-card-stat">
                    <i className="ti ti-calendar"></i>
                    <span>{m.updatedAt}</span>
                  </div>
                </div>

                <div className="ml-card-foot">
                  <span className="ml-card-pill" style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  <span className="ml-card-cat">{m.overview?.category || "—"}</span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="ml-card ml-card-add" onClick={openAddModal}>
          <div className="ml-add-inner">
            <i className="ti ti-plus"></i>
            <div className="ml-add-label">Thêm module mới</div>
            <div className="ml-add-sub">Bắt đầu ghi chép một module Odoo mới</div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal">
            <div className="modal-head">
              <h3>Thêm module mới</h3>
              <button onClick={() => setModalOpen(false)}><i className="ti ti-x"></i></button>
            </div>

            <label className="modal-lbl">Tên hiển thị <span className="req">*</span></label>
            <input
              className="modal-input"
              autoFocus
              value={draft.name}
              placeholder="vd: Manufacturing, Project, Helpdesk..."
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") submitAdd(); }}
            />

            <label className="modal-lbl">Technical name</label>
            <input
              className="modal-input modal-mono"
              value={draft.tech}
              placeholder="vd: mrp, project, helpdesk..."
              onChange={e => setDraft({ ...draft, tech: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") submitAdd(); }}
            />

            <label className="modal-lbl">Danh mục</label>
            <input
              className="modal-input"
              value={draft.category}
              placeholder="Sản xuất, Dự án..."
              onChange={e => setDraft({ ...draft, category: e.target.value })}
            />

            <label className="modal-lbl">Màu nhận diện</label>
            <div className="modal-colors">
              {PRESET_COLORS.map(c => (
                <button key={c}
                        className={"modal-color" + (draft.color === c ? " sel" : "")}
                        style={{ background: c }}
                        onClick={() => setDraft({ ...draft, color: c })}>
                  {draft.color === c && <i className="ti ti-check"></i>}
                </button>
              ))}
            </div>

            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setModalOpen(false)}>Hủy</button>
              <button className="btn-primary" onClick={submitAdd}>
                <i className="ti ti-plus"></i> Thêm module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.ModuleListScreen = ModuleListScreen;
