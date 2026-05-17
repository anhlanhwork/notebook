import React, { useState, useRef, useEffect } from 'react';
import { showConfirm } from './dialog.jsx';

/* CasesPane — list of customer-encountered issue cases.
   Per case: title, link nhóm (chat/Slack), mô tả lỗi, ảnh chụp,
   nguyên nhân, cách xử lý. Plus a status pill. */

const CASE_STATUS = [
  { v: "open",         l: "Mới",         color: "var(--danger)",  bg: "var(--danger-bg)" },
  { v: "investigating",l: "Đang xử lý",  color: "var(--warn-bd)", bg: "var(--warn-bg)" },
  { v: "resolved",     l: "Đã giải quyết", color: "var(--success)", bg: "var(--success-bg)" }
];

// Helper để chuyển file ảnh sang chuỗi DataURL
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Component xem ảnh phóng to
function ImageLightbox({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx(i => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIdx(i => Math.min(images.length - 1, i + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <div className="lb-bg" onClick={onClose}>
      <button className="lb-close" onClick={onClose}><i className="ti ti-x"></i></button>
      {idx > 0 && (
        <button className="lb-nav lb-nav-prev" onClick={(e) => { e.stopPropagation(); setIdx(idx - 1); }}>
          <i className="ti ti-chevron-left"></i>
        </button>
      )}
      <img className="lb-img" src={images[idx].url} alt={images[idx].name || ""}
           onClick={e => e.stopPropagation()} />
      {idx < images.length - 1 && (
        <button className="lb-nav lb-nav-next" onClick={(e) => { e.stopPropagation(); setIdx(idx + 1); }}>
          <i className="ti ti-right"></i>
        </button>
      )}
      <div className="lb-counter">{idx + 1} / {images.length}</div>
      {images[idx].name && <div className="lb-name">{images[idx].name}</div>}
    </div>
  );
}

// Component thẻ con cho từng lỗi
function CaseCard({ c, onChange, onDelete, onMoveUp, onMoveDown, index, canMoveUp, canMoveDown }) {
  const [collapsed, setCollapsed] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const fileRef = useRef(null);

  const imgs = c.images || [];

  async function addImages(fileList) {
    const next = [];
    for (const f of Array.from(fileList)) {
      if (!f.type.startsWith("image/")) continue;
      const url = await fileToDataUrl(f);
      next.push({ id: "img_" + Math.random().toString(36).slice(2, 7), name: f.name, url });
    }
    if (next.length) onChange({ ...c, images: [...imgs, ...next] });
  }

  function removeImage(id) {
    onChange({ ...c, images: imgs.filter(i => i.id !== id) });
  }

  return (
    <div className={"case" + (collapsed ? " collapsed" : "")}>
      <div className="case-head">
        <button className="case-toggle" onClick={() => setCollapsed(prev => !prev)}>
          <i className={"ti " + (collapsed ? "ti-chevron-right" : "ti-chevron-down")}></i>
        </button>
        <span className="case-num">#{String(index + 1).padStart(2, "0")}</span>
        <input
          className="case-title"
          value={c.title || ""}
          placeholder="Tên lỗi/tình huống..."
          onChange={e => onChange({ ...c, title: e.target.value })}
        />
        <div className="case-status-group">
          {CASE_STATUS.map(s => (
            <button key={s.v}
                    className={"case-status-btn" + ((c.status || "open") === s.v ? " active" : "")}
                    style={(c.status || "open") === s.v ? { background: s.bg, color: s.color } : null}
                    onClick={() => onChange({ ...c, status: s.v })}>
              {s.l}
            </button>
          ))}
        </div>
        <div className="case-actions">
          <button onClick={onMoveUp} disabled={!canMoveUp} title="Lên"><i className="ti ti-arrow-up"></i></button>
          <button onClick={onMoveDown} disabled={!canMoveDown} title="Xuống"><i className="ti ti-arrow-down"></i></button>
          <button onClick={onDelete} className="dblk-del" title="Xóa"><i className="ti ti-trash"></i></button>
        </div>
      </div>

      {!collapsed && (
        <div className="case-body">
          <div className="case-field">
            <label><i className="ti ti-link"></i> Link nhóm chat / ticket</label>
            <div className="case-link-row">
              <input
                className="case-input"
                value={c.groupLink || ""}
                placeholder="https://..."
                onChange={e => onChange({ ...c, groupLink: e.target.value })}
              />
            </div>
          </div>

          <div className="case-field">
            <label><i className="ti ti-bug"></i> Mô tả lỗi</label>
            <textarea
              className="case-ta"
              value={c.errorDesc || ""}
              onChange={e => onChange({ ...c, errorDesc: e.target.value })}
            />
          </div>

          <div className="case-field">
            <label><i className="ti ti-photo"></i> Ảnh chụp ({imgs.length})</label>
            <div className="case-img-grid">
              {imgs.map((img, i) => (
                <div key={img.id} className="case-img-tile">
                  <img src={img.url} alt={img.name} onClick={() => setLightboxIdx(i)} />
                  <button className="case-img-del" onClick={() => removeImage(img.id)}><i className="ti ti-x"></i></button>
                </div>
              ))}
              <button className="case-img-add" onClick={() => fileRef.current?.click()}>
                <i className="ti ti-photo-plus"></i>
                <span>Thêm ảnh</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                     onChange={e => { addImages(e.target.files); e.target.value = ""; }} />
            </div>
          </div>

          <div className="case-2col">
            <div className="case-field">
              <label><i className="ti ti-zoom-question"></i> Nguyên nhân</label>
              <textarea className="case-ta" value={c.rootCause || ""} onChange={e => onChange({ ...c, rootCause: e.target.value })} />
            </div>
            <div className="case-field">
              <label><i className="ti ti-tool"></i> Cách xử lý</label>
              <textarea className="case-ta" value={c.resolution || ""} onChange={e => onChange({ ...c, resolution: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {lightboxIdx != null && (
        <ImageLightbox images={imgs} startIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  );
}

// Component chính xuất ra cho Editor
export function CasesPane({ cases = [], onChange }) {
  function add() {
    const nc = {
      id: "case_" + Math.random().toString(36).slice(2, 7),
      title: "",
      groupLink: "",
      errorDesc: "",
      images: [],
      rootCause: "",
      resolution: "",
      status: "open"
    };
    onChange([nc, ...cases]);
  }

  function update(id, nv) { onChange(cases.map(c => c.id === id ? nv : c)); }
  async function del(id) { if (await showConfirm("Xóa case này?")) onChange(cases.filter(c => c.id !== id)); }
  function move(idx, dir) {
    const next = [...cases];
    const tmp = next[idx]; next[idx] = next[idx + dir]; next[idx + dir] = tmp;
    onChange(next);
  }

  return (
    <div className="cases">
      <div className="cases-summary">
        {/* Phần thống kê nhanh */}
        <div className="cases-stat">
          <div className="cases-stat-num">{cases.length}</div>
          <div className="cases-stat-lbl">Tổng số Case</div>
        </div>
        <button className="btn-primary" onClick={add}>
          <i className="ti ti-plus"></i> Thêm case mới
        </button>
      </div>

      <div className="cases-list">
        {cases.map((c, i) => (
          <CaseCard
            key={c.id} c={c} index={i}
            onChange={(nv) => update(c.id, nv)}
            onDelete={() => del(c.id)}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            canMoveUp={i > 0}
            canMoveDown={i < cases.length - 1}
          />
        ))}
      </div>
    </div>
  );
}