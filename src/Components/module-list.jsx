/* Module list screen — shows all modules inside a notebook. */

import React, { useState } from 'react';
import { ShareModal } from './share-modal.jsx';
import { showConfirm } from './dialog.jsx';

const STATUS_META = {
  pending:  { label: "Chưa bắt đầu",   color: "var(--text3)",   bg: "var(--bg3)"     },
  studying: { label: "Đang nghiên cứu", color: "var(--warn-bd)", bg: "var(--warn-bg)" },
  done:     { label: "Hoàn thành",      color: "var(--success)", bg: "var(--success-bg)" }
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

function ModuleListScreen({ notebook, setNotebook, onOpen, onBack }) {
  const [query,        setQuery]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen,    setModalOpen]   = useState(false);
  const [shareItem,    setShareItem]   = useState(null);
  const [editItem,     setEditItem]    = useState(null);
  const [editDraft,    setEditDraft]   = useState(null);
  const [draft, setDraft] = useState({ name: "", tech: "", color: PRESET_COLORS[0], category: "" });

  const modules = notebook.modules || [];

  const filtered = modules.filter(m => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.tech.toLowerCase().includes(q) ||
           (m.overview?.category || "").toLowerCase().includes(q);
  });

  const counts = {
    all:      modules.length,
    studying: modules.filter(m => m.status === "studying").length,
    done:     modules.filter(m => m.status === "done").length,
    pending:  modules.filter(m => m.status === "pending").length
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
    setNotebook({ ...notebook, modules: [...modules, newMod] });
    setModalOpen(false);
    onOpen(newMod.id);
  }

  async function deleteModule(id, e) {
    e.stopPropagation();
    if (!await showConfirm("Xóa module này khỏi sổ tay?")) return;
    setNotebook({ ...notebook, modules: modules.filter(m => m.id !== id) });
  }

  function openEdit(m, e) {
    e.stopPropagation();
    setEditDraft({
      name: m.name,
      tech: m.tech,
      color: m.color,
      category: m.overview?.category === "—" ? "" : (m.overview?.category || "")
    });
    setEditItem(m);
  }

  function submitEdit() {
    if (!editDraft.name.trim()) return;
    const updated = {
      ...editItem,
      name: editDraft.name.trim(),
      tech: editDraft.tech.trim() || editDraft.name.toLowerCase().replace(/\s+/g, "_"),
      color: editDraft.color,
      updatedAt: new Date().toISOString().slice(0, 10),
      overview: {
        ...editItem.overview,
        category: editDraft.category.trim() || "—"
      }
    };
    setNotebook({ ...notebook, modules: modules.map(m => m.id === updated.id ? updated : m) });
    setEditItem(null);
  }

  const totalFeatures = modules.reduce((s, m) => s + (m.features?.length || 0), 0);

  return (
    <div className="ml-screen">
      <div className="ml-hero">
        <div className="ml-hero-inner">
          <div className="ml-hero-nav">
            <div className="bc-t1">
              <button className="bc-item bc-link" onClick={onBack}>Thư viện sổ tay</button>
              <i className="ti ti-chevron-right bc-sep"></i>
              <span className="bc-item bc-item--active">{notebook.name}</span>
            </div>
          </div>

          <div className="ml-hero-top">
            <div className="ml-hero-left">
              <h1 className="ml-title">
                <span className="ml-title-icon">
                  <i className="ti ti-notebook"></i>
                </span>
                {notebook.name}
              </h1>
              <p className="ml-sub">
                {modules.length} module · {totalFeatures} tính năng đã ghi chép
              </p>
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
      </div>

      <div className="ml-body">
        <div className="ml-grid">
        {filtered.map(m => {
          const icon = MODULE_ICONS[m.tech] || MODULE_ICONS.default;
          const st   = STATUS_META[m.status] || STATUS_META.pending;
          const featCount = m.features?.length || 0;
          const flowCount = (m.mainFlows?.length || 0) +
                            (m.features?.reduce((s, f) => s + (f.flows?.length || 0), 0) || 0);
          return (
            <div key={m.id} className="ml-card" onClick={() => onOpen(m.id)}>
              <div
                className="ml-card-art"
                style={{ background: `linear-gradient(135deg, ${m.color} 0%, ${m.color}cc 100%)` }}
              >
                <i className={"ti " + icon}></i>
                <div className="ml-card-art-deco"></div>
                {m.overview?.category && m.overview.category !== "—" && (
                  <span className="ml-card-art-cat">{m.overview.category.toUpperCase()}</span>
                )}
                <span className="ml-card-art-status" style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>

              <div className="ml-card-body">
                <div className="ml-card-head">
                  <div className="ml-card-name-wrap">
                    <div className="ml-card-name">{m.name}</div>
                    <code className="ml-card-tech">{m.tech}</code>
                  </div>
                  <div className="ml-card-head-actions">
                    <button
                      className={`ml-card-share${m.shareRole && m.shareRole !== "private" ? " shared" : ""}`}
                      onClick={e => { e.stopPropagation(); setShareItem(m); }}
                      title="Chia sẻ module"
                    >
                      <i className={`ti ${m.shareRole === "viewer" ? "ti-eye" : m.shareRole === "editor" ? "ti-users" : "ti-share"}`}></i>
                    </button>
                    <button className="ml-card-edit" onClick={e => openEdit(m, e)} title="Chỉnh sửa module">
                      <i className="ti ti-edit"></i>
                    </button>
                    <button className="ml-card-del" onClick={(e) => deleteModule(m.id, e)} title="Xóa">
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="ml-card-purpose">
                  {m.overview?.purpose || <span className="ml-card-empty">Chưa có mô tả</span>}
                </div>

                <div className="ml-card-stats">
                  <div className="ml-card-stat">
                    <div className="ml-stat-label"><i className="ti ti-puzzle"></i> Tính năng</div>
                    <div className="ml-stat-val"><b>{featCount}</b></div>
                  </div>
                  <div className="ml-card-stat">
                    <div className="ml-stat-label"><i className="ti ti-git-branch"></i> Luồng</div>
                    <div className="ml-stat-val"><b>{flowCount}</b></div>
                  </div>
                  <div className="ml-card-stat">
                    <div className="ml-stat-label"><i className="ti ti-calendar"></i> Cập nhật</div>
                    <div className="ml-stat-val">{m.updatedAt}</div>
                  </div>
                </div>

                <div className="ml-card-cta">
                  <span>Mở module</span>
                  <i className="ti ti-arrow-right"></i>
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
      </div>

      {shareItem && (
        <ShareModal
          item={shareItem}
          type="module"
          onUpdate={updated => {
            setNotebook({ ...notebook, modules: modules.map(m => m.id === updated.id ? updated : m) });
            setShareItem(updated);
          }}
          onClose={() => setShareItem(null)}
        />
      )}

      {editItem && editDraft && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setEditItem(null); }}>
          <div className="modal">
            <div className="modal-head">
              <h3>Chỉnh sửa module</h3>
              <button onClick={() => setEditItem(null)}><i className="ti ti-x"></i></button>
            </div>

            <label className="modal-lbl">Tên hiển thị <span className="req">*</span></label>
            <input
              className="modal-input"
              autoFocus
              value={editDraft.name}
              onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") submitEdit(); }}
            />

            <label className="modal-lbl">Technical name</label>
            <input
              className="modal-input modal-mono"
              value={editDraft.tech}
              placeholder="vd: mrp, project, helpdesk..."
              onChange={e => setEditDraft({ ...editDraft, tech: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") submitEdit(); }}
            />

            <label className="modal-lbl">Danh mục</label>
            <input
              className="modal-input"
              value={editDraft.category}
              placeholder="Sản xuất, Dự án..."
              onChange={e => setEditDraft({ ...editDraft, category: e.target.value })}
            />

            <label className="modal-lbl">Màu nhận diện</label>
            <div className="modal-colors">
              {PRESET_COLORS.map(c => (
                <button key={c}
                        className={"modal-color" + (editDraft.color === c ? " sel" : "")}
                        style={{ background: c }}
                        onClick={() => setEditDraft({ ...editDraft, color: c })}>
                  {editDraft.color === c && <i className="ti ti-check"></i>}
                </button>
              ))}
            </div>

            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setEditItem(null)}>Hủy</button>
              <button className="btn-primary" onClick={submitEdit}>
                <i className="ti ti-check"></i> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ModuleListScreen;
