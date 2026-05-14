import React, { useState, useRef, useEffect } from 'react';

/* ── Constants ─────────────────────────────────────────────── */
const COLOR_PRESETS = [
  "#5BAA50","#1F6B40","#378ADD","#1D4ED8","#7C3AED",
  "#D85A30","#B91C1C","#D97706","#0891B2","#374151",
];

const CARD_W_DEF  = 290;
const HEAD_H      = 36;
const COL_HEAD_H  = 22;
const FIELD_H     = 27;
const ADD_BTN_H   = 32;
const NAME_W_DEF  = 88;
const TYPE_W_DEF  = 72;

const FIELD_TYPES = [
  "Char","Text","Integer","Float","Boolean","Date","Datetime",
  "Selection","Many2one","One2many","Many2many","Binary","Monetary","Html"
];
const REL_TYPES = ["Many2one","One2many","Many2many"];

const LINE_COLOR = { m2o: "#15803D", o2m: "#1D4ED8", m2m: "#7E22CE" };

function relKind(type) {
  if (type === "Many2one")  return "m2o";
  if (type === "One2many")  return "o2m";
  if (type === "Many2many") return "m2m";
  return null;
}
function relChip(type) {
  const k = relKind(type); if (!k) return null;
  return { m2o: { label:"M2o", cls:"chip-m2o" },
           o2m: { label:"O2m", cls:"chip-o2m" },
           m2m: { label:"M2m", cls:"chip-m2m" } }[k];
}
function mkId() { return "m" + Math.random().toString(36).slice(2, 7); }
function cardH(c) { return HEAD_H + COL_HEAD_H + (c.fields?.length || 0) * FIELD_H + ADD_BTN_H; }
function cardW(c) { return c.width || CARD_W_DEF; }

/* ══════════════════════════════════════════════════════════════
   ERDModels
   ══════════════════════════════════════════════════════════════ */
export function ERDModels({ models, setModels, accent = "#5BAA50" }) {
  const cards = models?.cards || [];

  const [drag,      setDrag]      = useState(null); // { id, offX, offY }
  const [resize,    setResize]    = useState(null); // card width: { id, startX, startW }
  const [colRes,    setColRes]    = useState(null); // col width: { id, col, startX, startW }
  const [colorPick, setColorPick] = useState(null); // cid — card whose picker is open
  const [wrapSize,  setWrapSize]  = useState({ w: 900, h: 500 });
  const wrapRef = useRef(null);

  /* ResizeObserver — canvas fills parent */
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setWrapSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  /* SVG size always >= visible area */
  const svgW = Math.max(...cards.map(c => c.x + cardW(c) + 100), wrapSize.w);
  const svgH = Math.max(...cards.map(c => c.y + cardH(c) + 100), wrapSize.h);

  /* ── Pointer helpers ── */
  function canvasXY(e) {
    const r  = wrapRef.current.getBoundingClientRect();
    const sl = wrapRef.current.scrollLeft;
    const st = wrapRef.current.scrollTop;
    return { x: e.clientX - r.left + sl, y: e.clientY - r.top + st };
  }

  /* ── Card drag ── */
  function onHeadDown(e, c) {
    if (e.target.closest("input,button,select")) return;
    e.preventDefault();
    const { x, y } = canvasXY(e);
    setDrag({ id: c.id, offX: x - c.x, offY: y - c.y });
  }

  /* ── Card resize (right edge) ── */
  function onCardResizeDown(e, c) {
    e.preventDefault(); e.stopPropagation();
    setResize({ id: c.id, startX: e.clientX, startW: cardW(c) });
  }

  /* ── Column resize (header separator) ── */
  function onColResDown(e, c, col) {
    e.preventDefault(); e.stopPropagation();
    const startW = col === "name"
      ? (c.colW?.name || NAME_W_DEF)
      : (c.colW?.type || TYPE_W_DEF);
    setColRes({ id: c.id, col, startX: e.clientX, startW });
  }

  /* ── mousemove: handles all three drag types ── */
  function onMove(e) {
    if (drag) {
      const { x, y } = canvasXY(e);
      const nx = Math.max(0, Math.round((x - drag.offX) / 5) * 5);
      const ny = Math.max(0, Math.round((y - drag.offY) / 5) * 5);
      upd(drag.id, { x: nx, y: ny });
    } else if (resize) {
      const dx  = e.clientX - resize.startX;
      const nw  = Math.max(200, Math.round((resize.startW + dx) / 5) * 5);
      upd(resize.id, { width: nw });
    } else if (colRes) {
      const dx  = e.clientX - colRes.startX;
      const nw  = Math.max(40, Math.round(colRes.startW + dx));
      const c   = cards.find(c => c.id === colRes.id);
      if (c) upd(colRes.id, { colW: { ...(c.colW || {}), [colRes.col]: nw } });
    }
  }
  function onUp() { setDrag(null); setResize(null); setColRes(null); }

  /* ── Generic card updater ── */
  function upd(cid, patch) {
    setModels({ ...models, cards: cards.map(c => c.id === cid ? { ...c, ...patch } : c) });
  }

  /* ── CRUD ── */
  function addCard() {
    const id  = mkId();
    const rx  = cards.length ? Math.max(...cards.map(c => c.x + cardW(c))) : 40;
    setModels({ ...models, cards: [...cards, {
      id, name: "new.model", color: accent,
      x: rx + 30, y: 40, width: CARD_W_DEF,
      fields: [{ name: "name", type: "Char", desc: "Tên", req: true }]
    }]});
  }
  function delCard(cid) {
    if (!confirm("Xóa model này?")) return;
    setModels({ ...models,
      cards: cards.filter(c => c.id !== cid)
                  .map(c => ({ ...c, fields: c.fields.map(f =>
                    f.relTo === cid ? { ...f, relTo: undefined } : f) }))
    });
  }
  function updCardName(cid, v)  { upd(cid, { name: v }); }
  function updCardColor(cid, v) { upd(cid, { color: v }); }

  /* Close color picker when clicking outside */
  useEffect(() => {
    if (!colorPick) return;
    function onDoc(e) {
      if (!e.target.closest(".erd-color-pop") && !e.target.closest(".erd-color-dot-btn"))
        setColorPick(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [colorPick]);

  function addField(cid) {
    const c = cards.find(c => c.id === cid); if (!c) return;
    upd(cid, { fields: [...c.fields, { name: "new_field", type: "Char", desc: "" }] });
  }
  function updField(cid, idx, key, val) {
    const c = cards.find(c => c.id === cid); if (!c) return;
    upd(cid, { fields: c.fields.map((f, i) => i === idx ? { ...f, [key]: val } : f) });
  }
  function delField(cid, idx) {
    const c = cards.find(c => c.id === cid); if (!c) return;
    upd(cid, { fields: c.fields.filter((_, i) => i !== idx) });
  }
  function toggleReq(cid, idx) {
    const f = cards.find(c => c.id === cid)?.fields[idx];
    if (f) updField(cid, idx, "req", !f.req);
  }

  /* ── Relation line calculations ── */
  const lines = [];
  cards.forEach(src => {
    const sw = cardW(src);
    src.fields.forEach((f, fi) => {
      if (!f.relTo) return;
      const tgt = cards.find(c => c.id === f.relTo);
      if (!tgt) return;
      const tw = cardW(tgt);
      const kind = relKind(f.type) || "m2o";
      const color = LINE_COLOR[kind];

      // Source port: right edge at field row y
      const sx = src.x + sw;
      const sy = src.y + HEAD_H + COL_HEAD_H + fi * FIELD_H + FIELD_H / 2;
      // Target port: left edge at header y
      const tx = tgt.x;
      const ty = tgt.y + HEAD_H / 2;

      let c1x, c2x;
      if (sx <= tx) {                      // source left of target
        const gap = tx - sx;
        c1x = sx + gap * 0.5; c2x = tx - gap * 0.5;
      } else if (src.x >= tgt.x + tw) {    // source right of target
        const gap = sx - tgt.x - tw;
        c1x = sx + Math.max(gap * 0.5, 40);
        c2x = tx - Math.max(gap * 0.5, 40);
      } else {                              // overlapping — route with wide handles
        c1x = sx + 80; c2x = tx - 80;
      }

      const d = `M${sx},${sy} C${c1x},${sy} ${c2x},${ty} ${tx},${ty}`;
      lines.push({ d, sx, sy, color, kind, dashed: kind === "o2m" });
    });
  });

  return (
    <div className="erd-wrap">
      {/* Toolbar */}
      <div className="erd-toolbar">
        <button className="erd-add-btn" onClick={addCard}>
          <i className="ti ti-plus"/> Thêm model
        </button>
        <div className="erd-legend">
          <span className="erd-leg-chip chip-m2o">M2o</span> Many2one
          <span className="erd-leg-chip chip-o2m">O2m</span> One2many
          <span className="erd-leg-chip chip-m2m">M2m</span> Many2many
        </div>
        <span className="erd-hint">Kéo header để di chuyển · Click field để sửa</span>
      </div>

      {/* Canvas */}
      <div className="erd-canvas" ref={wrapRef}
           onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>

        {/* SVG layer: dot-grid + arrows */}
        <svg className="erd-svg" width={svgW} height={svgH}>
          <defs>
            <pattern id="erd-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.75" fill="#D1D5DB"/>
            </pattern>
            {/* Per-color arrowhead markers */}
            {Object.entries(LINE_COLOR).map(([k, col]) => (
              <marker key={k} id={`earr-${k}`}
                      viewBox="0 0 10 10" refX="9" refY="5"
                      markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,1 L9,5 L0,9 Z" fill={col}/>
              </marker>
            ))}
          </defs>
          <rect width={svgW} height={svgH} fill="url(#erd-dots)"/>

          {lines.map((ln, i) => (
            <g key={i}>
              {/* White halo for readability over cards */}
              <path d={ln.d} fill="none" stroke="#fff" strokeWidth="4" opacity="0.7"/>
              <path d={ln.d} fill="none" stroke={ln.color} strokeWidth="1.8"
                    strokeDasharray={ln.dashed ? "5,3" : undefined}
                    markerEnd={`url(#earr-${ln.kind})`}/>
              {/* Source dot */}
              <circle cx={ln.sx} cy={ln.sy} r="4" fill={ln.color}/>
              <circle cx={ln.sx} cy={ln.sy} r="2.5" fill="#fff"/>
            </g>
          ))}
        </svg>

        {/* Model cards */}
        {cards.map(c => {
          const cw   = cardW(c);
          const nw   = c.colW?.name || NAME_W_DEF;
          const tw   = c.colW?.type || TYPE_W_DEF;

          return (
            <div key={c.id} className="erd-card"
                 style={{ left: c.x, top: c.y, width: cw,
                          cursor: drag?.id === c.id ? "grabbing" : undefined }}>

              {/* Header */}
              <div className="erd-card-head" style={{ background: c.color }}
                   onMouseDown={e => onHeadDown(e, c)}>
                <i className="ti ti-table-column" style={{ fontSize:12, opacity:0.85, flexShrink:0 }}/>
                <input className="erd-card-name-input" value={c.name}
                       onChange={e => updCardName(c.id, e.target.value)}
                       onMouseDown={e => e.stopPropagation()}/>

                {/* Color picker trigger */}
                <button className="erd-color-dot-btn" title="Đổi màu"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); setColorPick(colorPick === c.id ? null : c.id); }}>
                  <span className="erd-color-dot" style={{ background: c.color }}/>
                  <i className="ti ti-palette"/>
                </button>

                <button className="erd-head-del" title="Xóa model"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => delCard(c.id)}>
                  <i className="ti ti-trash"/>
                </button>
              </div>

              {/* Color picker popover */}
              {colorPick === c.id && (
                <div className="erd-color-pop" onMouseDown={e => e.stopPropagation()}>
                  <div className="erd-color-swatches">
                    {COLOR_PRESETS.map(col => (
                      <button key={col} className={"erd-color-swatch" + (c.color === col ? " active" : "")}
                              style={{ background: col }}
                              onClick={() => { updCardColor(c.id, col); setColorPick(null); }}/>
                    ))}
                  </div>
                  <label className="erd-color-custom-row">
                    <span>Tuỳ chỉnh</span>
                    <input type="color" value={c.color}
                           onChange={e => updCardColor(c.id, e.target.value)}/>
                  </label>
                </div>
              )}

              {/* Column header row with resize handles */}
              <div className="erd-col-hdr-row">
                <div className="erd-col-hdr" style={{ width: nw }}>
                  <span>Tên trường</span>
                  <div className="erd-col-rsz" onMouseDown={e => onColResDown(e, c, "name")}/>
                </div>
                <div className="erd-col-hdr" style={{ width: tw }}>
                  <span>Kiểu</span>
                  <div className="erd-col-rsz" onMouseDown={e => onColResDown(e, c, "type")}/>
                </div>
                <div className="erd-col-hdr" style={{ flex:1, minWidth:0 }}>
                  <span>Mô tả</span>
                </div>
                <div className="erd-col-hdr" style={{ width:42, flexShrink:0 }}/>
              </div>

              {/* Fields */}
              <div className="erd-fields">
                {c.fields.map((f, fi) => {
                  const chip = relChip(f.type);
                  return (
                    <div key={fi} className="erd-field" style={{ height: FIELD_H }}>

                      <input className="erd-f-name" style={{ width: nw, flexShrink:0 }}
                             value={f.name} placeholder="field_name"
                             onChange={e => updField(c.id, fi, "name", e.target.value)}
                             onMouseDown={e => e.stopPropagation()}/>

                      <select className="erd-f-type" style={{ width: tw, flexShrink:0 }}
                              value={f.type}
                              onChange={e => updField(c.id, fi, "type", e.target.value)}
                              onMouseDown={e => e.stopPropagation()}>
                        {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>

                      {chip && <span className={"erd-rel-chip " + chip.cls}>{chip.label}</span>}

                      {REL_TYPES.includes(f.type) && (
                        <select className="erd-f-rel"
                                value={f.relTo || ""}
                                onChange={e => updField(c.id, fi, "relTo", e.target.value || undefined)}
                                onMouseDown={e => e.stopPropagation()}>
                          <option value="">→ model</option>
                          {cards.filter(x => x.id !== c.id).map(x => (
                            <option key={x.id} value={x.id}>{x.name}</option>
                          ))}
                        </select>
                      )}

                      <input className="erd-f-desc" style={{ flex:1, minWidth:0 }}
                             value={f.desc} placeholder="Mô tả"
                             onChange={e => updField(c.id, fi, "desc", e.target.value)}
                             onMouseDown={e => e.stopPropagation()}/>

                      {/* Required checkbox */}
                      <label className="erd-req-wrap" title="Bắt buộc"
                             onMouseDown={e => e.stopPropagation()}>
                        <input type="checkbox" className="erd-req-chk"
                               checked={!!f.req}
                               onChange={() => toggleReq(c.id, fi)}/>
                        <span className="erd-req-star">*</span>
                      </label>

                      <button className="erd-f-del"
                              onMouseDown={e => e.stopPropagation()}
                              onClick={e => { e.stopPropagation(); delField(c.id, fi); }}>
                        <i className="ti ti-x"/>
                      </button>
                    </div>
                  );
                })}

                <button className="erd-add-field" onClick={() => addField(c.id)}>
                  <i className="ti ti-plus"/> Thêm trường
                </button>
              </div>

              {/* Card right-edge resize handle */}
              <div className="erd-card-rsz" onMouseDown={e => onCardResizeDown(e, c)}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ERDModels;
