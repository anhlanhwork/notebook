import React, { useState, useRef, useEffect } from 'react';
import { showConfirm } from './dialog.jsx';

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

function mkId() { return "m" + Math.random().toString(36).slice(2, 7); }
function cardH(c) { return HEAD_H + COL_HEAD_H + (c.fields?.length || 0) * FIELD_H + ADD_BTN_H; }
function cardW(c) { return c.width || CARD_W_DEF; }

/* ══════════════════════════════════════════════════════════════
   ERDModels
   ══════════════════════════════════════════════════════════════ */
export function ERDModels({ models, setModels, accent = "#5BAA50" }) {
  const cards = models?.cards || [];

  /* ── Visual-only states (local, no stale-closure issue) ── */
  const [dragPos,     setDragPos]     = useState(null); // { id, x, y }
  const [resizeW,     setResizeW]     = useState(null); // { id, w }
  const [colResW,     setColResW]     = useState(null); // { id, col, w }
  const [connectPos,  setConnectPos]  = useState(null); // { fromId, mx, my }
  const [colorPick,   setColorPick]   = useState(null);
  const [selectedArrow,setSelectedArrow]= useState(null);
  const [wrapSize,    setWrapSize]    = useState({ w: 900, h: 500 });

  /* ── Refs (set synchronously, read in global listeners) ── */
  const wrapRef      = useRef(null);
  const dragRef      = useRef(null);   // { id, offX, offY }
  const resizeRef    = useRef(null);   // { id, startX, startW }
  const colResRef    = useRef(null);   // { id, col, startX, startW }
  const connectRef   = useRef(null);   // { fromId, mx, my }
  const modelsRef    = useRef(models);
  const setModsRef   = useRef(setModels);

  useEffect(() => { modelsRef.current  = models;    });
  useEffect(() => { setModsRef.current = setModels; });

  /* ResizeObserver */
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setWrapSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Global window listeners ── */
  useEffect(() => {
    function cvXY(e) {
      const el = wrapRef.current; if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left + el.scrollLeft, y: e.clientY - r.top + el.scrollTop };
    }

    function handleMove(e) {
      const d = dragRef.current, r = resizeRef.current,
            cr = colResRef.current, c = connectRef.current;
      if (d) {
        const { x, y } = cvXY(e);
        setDragPos({ id: d.id, x: Math.max(0, Math.round((x - d.offX) / 5) * 5),
                                y: Math.max(0, Math.round((y - d.offY) / 5) * 5) });
      } else if (r) {
        setResizeW({ id: r.id, w: Math.max(200, Math.round((r.startW + e.clientX - r.startX) / 5) * 5) });
      } else if (cr) {
        setColResW({ id: cr.id, col: cr.col, w: Math.max(40, Math.round(cr.startW + e.clientX - cr.startX)) });
      } else if (c) {
        const { x, y } = cvXY(e);
        const updated = { ...c, mx: x, my: y };
        connectRef.current = updated;
        setConnectPos(updated);
      }
    }

    function handleUp(e) {
      const d = dragRef.current, r = resizeRef.current,
            cr = colResRef.current, c = connectRef.current;
      const m = modelsRef.current;
      const cs = m?.cards || [];

      if (d) {
        const { x, y } = cvXY(e);
        const nx = Math.max(0, Math.round((x - d.offX) / 5) * 5);
        const ny = Math.max(0, Math.round((y - d.offY) / 5) * 5);
        setModsRef.current({ ...m, cards: cs.map(card => card.id === d.id ? { ...card, x: nx, y: ny } : card) });
        dragRef.current = null; setDragPos(null);
      }
      if (r) {
        const nw = Math.max(200, Math.round((r.startW + e.clientX - r.startX) / 5) * 5);
        setModsRef.current({ ...m, cards: cs.map(card => card.id === r.id ? { ...card, width: nw } : card) });
        resizeRef.current = null; setResizeW(null);
      }
      if (cr) {
        const nw = Math.max(40, Math.round(cr.startW + e.clientX - cr.startX));
        setModsRef.current({ ...m, cards: cs.map(card => card.id !== cr.id ? card :
          { ...card, colW: { ...(card.colW || {}), [cr.col]: nw } }) });
        colResRef.current = null; setColResW(null);
      }
      if (c) {
        const { x, y } = cvXY(e);
        const target = cs.find(card =>
          card.id !== c.fromId &&
          x >= card.x && x <= card.x + cardW(card) &&
          y >= card.y && y <= card.y + cardH(card)
        );
        if (target) {
          const src = cs.find(card => card.id === c.fromId);
          if (src) {
            const fname = target.name.split('.').pop() + '_id';
            setModsRef.current({ ...m, cards: cs.map(card => card.id !== c.fromId ? card :
              { ...card, fields: [...(card.fields || []), { name: fname, type: 'Many2one', desc: '', relTo: target.id, req: false }] }) });
          }
        }
        connectRef.current = null; setConnectPos(null);
      }
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup',   handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, []);

  /* ── Display cards override live drag/resize positions ── */
  const displayCards = cards.map(c => {
    if (dragPos?.id  === c.id) return { ...c, x: dragPos.x, y: dragPos.y };
    if (resizeW?.id  === c.id) return { ...c, width: resizeW.w };
    if (colResW?.id  === c.id) return { ...c, colW: { ...(c.colW || {}), [colResW.col]: colResW.w } };
    return c;
  });

  /* SVG size always >= visible area */
  const svgW = Math.max(...displayCards.map(c => c.x + cardW(c) + 100), wrapSize.w);
  const svgH = Math.max(...displayCards.map(c => c.y + cardH(c) + 100), wrapSize.h);

  /* ── Mousedown handlers — set refs synchronously ── */
  function onHeadDown(e, c) {
    if (e.target.closest("input,button,select")) return;
    e.preventDefault();
    const el = wrapRef.current;
    const r  = el.getBoundingClientRect();
    const x  = e.clientX - r.left + el.scrollLeft;
    const y  = e.clientY - r.top  + el.scrollTop;
    dragRef.current = { id: c.id, offX: x - c.x, offY: y - c.y };
  }
  function onCardResizeDown(e, c) {
    e.preventDefault(); e.stopPropagation();
    resizeRef.current = { id: c.id, startX: e.clientX, startW: cardW(c) };
  }
  function onColResDown(e, c, col) {
    e.preventDefault(); e.stopPropagation();
    const startW = col === "name" ? (c.colW?.name || NAME_W_DEF) : (c.colW?.type || TYPE_W_DEF);
    colResRef.current = { id: c.id, col, startX: e.clientX, startW };
  }

  /* ── Generic card updater (for non-drag edits) ── */
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
  async function delCard(cid) {
    if (!await showConfirm("Xóa model này?")) return;
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

  /* ── Relation lines — use displayCards for live positions ── */
  const lines = [];
  displayCards.forEach(src => {
    const sw = cardW(src);
    src.fields.forEach((f, fi) => {
      if (!f.relTo) return;
      const tgt = displayCards.find(c => c.id === f.relTo);
      if (!tgt) return;
      const tw = cardW(tgt);
      const kind = relKind(f.type) || "m2o";
      const color = LINE_COLOR[kind];
      const sx = src.x + sw, sy = src.y + HEAD_H + COL_HEAD_H + fi * FIELD_H + FIELD_H / 2;
      const tx = tgt.x,      ty = tgt.y + HEAD_H / 2;
      let c1x, c2x;
      if (sx <= tx)              { const g = tx - sx;         c1x = sx + g * 0.5;              c2x = tx - g * 0.5; }
      else if (src.x >= tgt.x + tw) { const g = sx - tgt.x - tw; c1x = sx + Math.max(g*0.5,40); c2x = tx - Math.max(g*0.5,40); }
      else                       { c1x = sx + 80; c2x = tx - 80; }
      const midX = (sx + 3*c1x + 3*c2x + tx) / 8, midY = (sy + ty) / 2;
      lines.push({ d: `M${sx},${sy} C${c1x},${sy} ${c2x},${ty} ${tx},${ty}`, sx, sy, midX, midY, color, kind, dashed: kind === "o2m", srcId: src.id, fieldIdx: fi });
    });
  });

  function deleteArrow(srcId, fieldIdx) {
    updField(srcId, fieldIdx, "relTo", undefined);
    setSelectedArrow(null);
  }

  return (
    <div className="erd-wrap">
      <div className="erd-toolbar">
        <button className="erd-add-btn" onClick={addCard}>
          <i className="ti ti-plus"/> Thêm model
        </button>
        <div className="erd-legend">
          <span className="erd-leg-chip chip-m2o">M2o</span> Many2one
          <span className="erd-leg-chip chip-o2m">O2m</span> One2many
          <span className="erd-leg-chip chip-m2m">M2m</span> Many2many
        </div>
        <span className="erd-hint">Kéo header để di chuyển · Kéo → để nối · Click mũi tên để xóa</span>
      </div>

      {/* Canvas — no local mouse handlers, window listeners handle everything */}
      <div className="erd-canvas" ref={wrapRef}>

        {/* SVG: pointer-events:all so arrows are clickable */}
        <svg className="erd-svg" width={svgW} height={svgH} style={{ pointerEvents: 'all' }}>
          <defs>
            <pattern id="erd-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.75" fill="#D1D5DB"/>
            </pattern>
            {Object.entries(LINE_COLOR).map(([k, col]) => (
              <marker key={k} id={`earr-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,1 L9,5 L0,9 Z" fill={col}/>
              </marker>
            ))}
          </defs>
          <rect width={svgW} height={svgH} fill="url(#erd-dots)" onClick={() => setSelectedArrow(null)}/>

          {/* Live connect preview */}
          {connectPos && (() => {
            const src = displayCards.find(c => c.id === connectPos.fromId);
            if (!src) return null;
            const sx = src.x + cardW(src), sy = src.y + HEAD_H / 2;
            const dx = Math.max(30, Math.abs(connectPos.mx - sx) * 0.4);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <path d={`M${sx},${sy} C${sx+dx},${sy} ${connectPos.mx-dx},${connectPos.my} ${connectPos.mx},${connectPos.my}`}
                      fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="5 4"/>
                <circle cx={sx} cy={sy} r="5" fill={accent}/>
                <circle cx={sx} cy={sy} r="3" fill="#fff"/>
              </g>
            );
          })()}

          {lines.map((ln, i) => {
            const isSel = selectedArrow?.srcId === ln.srcId && selectedArrow?.fieldIdx === ln.fieldIdx;
            const lc = isSel ? '#EF4444' : ln.color;
            return (
              <g key={i} style={{ cursor: 'pointer' }}
                 onClick={e => { e.stopPropagation(); setSelectedArrow(isSel ? null : { srcId: ln.srcId, fieldIdx: ln.fieldIdx }); }}>
                <path d={ln.d} fill="none" stroke="transparent" strokeWidth="14"/>
                <path d={ln.d} fill="none" stroke="#fff" strokeWidth={isSel ? 6 : 4} opacity="0.7"/>
                <path d={ln.d} fill="none" stroke={lc} strokeWidth={isSel ? 2.5 : 1.8}
                      strokeDasharray={ln.dashed ? "5,3" : undefined}
                      markerEnd={`url(#earr-${ln.kind})`}/>
                <circle cx={ln.sx} cy={ln.sy} r="4" fill={lc}/>
                <circle cx={ln.sx} cy={ln.sy} r="2.5" fill="#fff"/>
                {isSel && (
                  <g onClick={e => { e.stopPropagation(); deleteArrow(ln.srcId, ln.fieldIdx); }} style={{ cursor: 'pointer' }}>
                    <circle cx={ln.midX} cy={ln.midY} r="10" fill="white" stroke="#EF4444" strokeWidth="1.5"/>
                    <text x={ln.midX} y={ln.midY + 4.5} textAnchor="middle" fontSize="13" fill="#EF4444" fontWeight="700">×</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Model cards — rendered from displayCards for live drag/resize */}
        {displayCards.map(c => {
          const cw = cardW(c);
          const nw = c.colW?.name || NAME_W_DEF;
          const tw = c.colW?.type || TYPE_W_DEF;

          return (
            <div key={c.id} className="erd-card"
                 style={{ left: c.x, top: c.y, width: cw,
                          cursor: dragPos?.id === c.id ? 'grabbing' : undefined }}>

              <div className="erd-card-head" style={{ background: c.color }}
                   onMouseDown={e => onHeadDown(e, c)}>
                <i className="ti ti-table-column" style={{ fontSize:12, opacity:0.85, flexShrink:0 }}/>
                <input className="erd-card-name-input" value={c.name}
                       onChange={e => updCardName(c.id, e.target.value)}
                       onMouseDown={e => e.stopPropagation()}/>

                <button className="erd-color-dot-btn" title="Đổi màu"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); setColorPick(colorPick === c.id ? null : c.id); }}>
                  <span className="erd-color-dot" style={{ background: c.color }}/>
                  <i className="ti ti-palette"/>
                </button>

                {/* Port — set connectRef synchronously */}
                <button className="erd-port-btn" title="Kéo để tạo quan hệ"
                        onMouseDown={e => {
                          e.preventDefault(); e.stopPropagation();
                          const el = wrapRef.current;
                          const r  = el.getBoundingClientRect();
                          const init = { fromId: c.id, mx: e.clientX - r.left + el.scrollLeft, my: e.clientY - r.top + el.scrollTop };
                          connectRef.current = init;
                          setConnectPos(init);
                        }}>
                  <i className="ti ti-arrow-right"/>
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
                  const isRel = REL_TYPES.includes(f.type);
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

                      {isRel ? (
                        <select className="erd-f-rel"
                                value={f.relTo || ""}
                                onChange={e => updField(c.id, fi, "relTo", e.target.value || undefined)}
                                onMouseDown={e => e.stopPropagation()}>
                          <option value="">→ model</option>
                          {cards.filter(x => x.id !== c.id).map(x => (
                            <option key={x.id} value={x.id}>{x.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input className="erd-f-desc" style={{ flex:1, minWidth:0 }}
                               value={f.desc} placeholder="Mô tả"
                               onChange={e => updField(c.id, fi, "desc", e.target.value)}
                               onMouseDown={e => e.stopPropagation()}/>
                      )}

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
