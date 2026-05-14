/* Home screen — shows notebooks. Click → ModuleList. Add → modal. */

import React, { useState } from 'react';

const PRESET_COLORS = [
  "#5BAA50", "#1F6B40", "#378ADD", "#BA7517",
  "#D85A30", "#7F77DD", "#D4537E", "#1D9E75", "#E24B4A"
];

const NOTEBOOK_ICONS = [
  "ti-clipboard-list", "ti-book",        "ti-folder",    "ti-settings",
  "ti-clipboard",      "ti-bookmark",    "ti-history",   "ti-bolt",
  "ti-flag",           "ti-link",        "ti-cpu",       "ti-shield",
];

function HomeScreen({ data, setData, onOpen }) {
  const [query,     setQuery]  = useState("");
  const [modalOpen, setModal]  = useState(false);
  const [draft, setDraft] = useState({
    name: "", description: "", tags: "", color: PRESET_COLORS[0], icon: NOTEBOOK_ICONS[0]
  });

  /* ── Stats ── */
  const totalModules  = data.notebooks.reduce((s, nb) => s + (nb.modules?.length || 0), 0);
  const totalFeatures = data.notebooks.reduce((s, nb) =>
    s + (nb.modules?.reduce((ms, m) =>
      ms + (m.features?.reduce((fs, f) =>
        fs + (f.flows?.length || 0) + (f.detailBlocks?.length || 0), 0) || 0), 0) || 0), 0);

  /* ── Filter ── */
  const displayed = query
    ? data.notebooks.filter(nb => {
        const q = query.toLowerCase();
        return nb.name.toLowerCase().includes(q) ||
               (nb.description || "").toLowerCase().includes(q) ||
               (nb.tags || []).some(t => t.toLowerCase().includes(q));
      })
    : data.notebooks;

  function deleteNotebook(id, e) {
    e.stopPropagation();
    if (!confirm("Xóa sổ tay này?")) return;
    setData({ ...data, notebooks: data.notebooks.filter(nb => nb.id !== id) });
  }

  function openModal() {
    setDraft({ name: "", description: "", tags: "", color: PRESET_COLORS[0], icon: NOTEBOOK_ICONS[0] });
    setModal(true);
  }

  function submitAdd() {
    if (!draft.name.trim()) return;
    const tags = draft.tags.split(",").map(t => t.trim()).filter(Boolean);
    const newNb = {
      id: "nb_" + Math.random().toString(36).slice(2, 7),
      name: draft.name.trim(),
      tech: draft.name.trim().toLowerCase().replace(/\s+/g, "_"),
      color: draft.color,
      icon: draft.icon,
      tags,
      description: draft.description.trim(),
      updatedAt: new Date().toISOString().slice(0, 10),
      modules: []
    };
    setData({ ...data, notebooks: [...data.notebooks, newNb] });
    setModal(false);
    onOpen(newNb.id);
  }

  return (
    <div className="home-screen">

      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="home-hero-inner">
          <div className="eyebrow">Sổ tay nội bộ</div>
          <h1 className="home-title">Thư viện sổ tay</h1>
          <p className="home-sub">
            Tài liệu nghiên cứu chia theo nhóm chủ đề. Mỗi sổ tay — mỗi module chứa nhiều
            tính năng, luồng, models và case khách hàng.
          </p>
          <div className="home-hero-stats">
            <span><b>{data.notebooks.length}</b> sổ tay</span>
            <span className="home-stats-dot">·</span>
            <span><b>{totalModules}</b> modules</span>
            <span className="home-stats-dot">·</span>
            <span><b>{totalFeatures}</b> tính năng đã ghi chép</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="home-body">
        <div className="home-toolbar">
          <div className="home-search ml-search">
            <i className="ti ti-search"></i>
            <input
              placeholder="Tìm sổ tay, mô tả, tag..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && <button onClick={() => setQuery("")}><i className="ti ti-x"></i></button>}
          </div>
          <button className="btn-primary" onClick={openModal}>
            <i className="ti ti-plus"></i> Tạo sổ tay mới
          </button>
        </div>

        {displayed.length > 0 ? (
          <div className="home-grid">
            {displayed.map(nb => {
              const modCount  = nb.modules?.length || 0;
              const featCount = nb.modules?.reduce((s, m) =>
                s + (m.features?.reduce((fs, f) =>
                  fs + (f.flows?.length || 0) + (f.detailBlocks?.length || 0), 0) || 0), 0) || 0;
              const doneCnt  = nb.modules?.filter(m => m.status === "done").length    || 0;
              const studyCnt = nb.modules?.filter(m => m.status === "studying").length || 0;

              return (
                <div key={nb.id} className="home-card" onClick={() => onOpen(nb.id)}>
                  <div
                    className="home-card-art"
                    style={{ background: `linear-gradient(135deg, ${nb.color} 0%, ${nb.color}bb 100%)` }}
                  >
                    <i className={`ti ${nb.icon || "ti-clipboard-list"}`}></i>
                    <div className="home-card-art-deco"></div>
                  </div>

                  <div className="home-card-body">
                    <div className="home-card-row">
                      <h3 className="home-card-name">{nb.name}</h3>
                      <button
                        className="home-card-del"
                        onClick={(e) => deleteNotebook(nb.id, e)}
                        title="Xóa sổ tay"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </div>

                    <div className="home-tags">
                      {(nb.tags || []).map(t => <span key={t} className="home-tag">{t}</span>)}
                    </div>

                    <p className={"home-card-desc" + (!nb.description ? " home-card-empty" : "")}>
                      {nb.description || "Chưa có mô tả"}
                    </p>

                    <div className="home-card-stats">
                      <div className="home-stat">
                        <i className="ti ti-layout-grid"></i>
                        <span><b>{modCount}</b> module</span>
                      </div>
                      <div className="home-stat">
                        <i className="ti ti-puzzle"></i>
                        <span><b>{featCount}</b> tính năng</span>
                      </div>
                      <div className="home-stat">
                        <i className="ti ti-calendar"></i>
                        <span>{nb.updatedAt}</span>
                      </div>
                    </div>

                    <div className="home-card-status">
                      {doneCnt > 0 && (
                        <span className="hcs-done">
                          <i className="ti ti-circle-check"></i> {doneCnt} hoàn thành
                        </span>
                      )}
                      {studyCnt > 0 && (
                        <span className="hcs-study">
                          <i className="ti ti-loader"></i> {studyCnt} đang nghiên cứu
                        </span>
                      )}
                      {doneCnt === 0 && studyCnt === 0 && (
                        <span className="hcs-empty">
                          <i className="ti ti-circle"></i> Chưa có module
                        </span>
                      )}
                    </div>

                    <div className="home-card-cta">
                      <span>Mở sổ tay</span>
                      <i className="ti ti-arrow-right"></i>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add card */}
            <div className="home-card home-card-add" onClick={openModal}>
              <div className="home-add-inner">
                <i className="ti ti-plus"></i>
                <div className="home-add-label">Tạo sổ tay mới</div>
                <div className="home-add-sub">
                  Nhóm các module liên quan vào cùng một sổ tay
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="home-no-results">
            <i className="ti ti-search-off"></i>
            <p>Không tìm thấy sổ tay nào phù hợp với "{query}"</p>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="modal modal-wide">
            <div className="modal-head">
              <h3>Tạo sổ tay mới</h3>
              <button onClick={() => setModal(false)}><i className="ti ti-x"></i></button>
            </div>

            <label className="modal-lbl">Tên sổ tay <span className="req">*</span></label>
            <input
              className="modal-input"
              autoFocus
              value={draft.name}
              placeholder="vd: SAP B1, Salesforce, Quy trình kế toán..."
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={e => { if (e.key === "Enter") submitAdd(); }}
            />

            <label className="modal-lbl">Mô tả ngắn</label>
            <textarea
              className="modal-input modal-textarea"
              value={draft.description}
              placeholder="Sổ tay này dùng để..."
              onChange={e => setDraft({ ...draft, description: e.target.value })}
            />

            <label className="modal-lbl">Tags (cách nhau bằng dấu phẩy)</label>
            <input
              className="modal-input"
              value={draft.tags}
              placeholder="ERP, Backend, API..."
              onChange={e => setDraft({ ...draft, tags: e.target.value })}
            />

            <div className="modal-two">
              <div>
                <label className="modal-lbl">Màu</label>
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
              </div>
              <div>
                <label className="modal-lbl">Icon</label>
                <div className="modal-icons">
                  {NOTEBOOK_ICONS.map(ic => (
                    <button key={ic}
                            className={"modal-icon" + (draft.icon === ic ? " sel" : "")}
                            onClick={() => setDraft({ ...draft, icon: ic })}>
                      <i className={`ti ${ic}`}></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={submitAdd}>
                <i className="ti ti-plus"></i> Tạo sổ tay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;
