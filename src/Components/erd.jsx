import React, { useState, useRef, useEffect } from 'react';

/* ════════════════════════════════════════════════════════════
   CONSTANTS & UTILS
   ════════════════════════════════════════════════════════════ */
const ERD_CARD_W = 290;
const ERD_FIELD_H = 26;
const ERD_HEAD_H  = 36;

/**
 * Xác định icon hiển thị cho các loại quan hệ dữ liệu
 */
export function relIcon(type) {
  if (type?.startsWith("Many2one"))  return "M2o";
  if (type?.startsWith("One2many"))  return "O2m";
  if (type?.startsWith("Many2many")) return "M2m";
  return null;
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT: ERDModels
   ════════════════════════════════════════════════════════════ */
export function ERDModels({ models, setModels, accent = "#5BAA50" }) {
  const cards = models.cards || [];
  const [drag, setDrag] = useState(null);
  const wrapRef = useRef(null);

  // Tính toán kích thước canvas dựa trên vị trí các card
  const maxX = Math.max(...cards.map(c => c.x + ERD_CARD_W), 800);
  const maxY = Math.max(...cards.map(c => c.y + ERD_HEAD_H + (c.fields.length * ERD_FIELD_H) + 20), 400);
  const W = maxX + 100;
  const H = maxY + 100;

  /* ════════════════ INTERACTION LOGIC ════════════════ */
  
  function onMouseDownCard(e, c) {
    // Không cho phép drag khi đang tương tác với input hoặc nút bấm
    if (e.target.closest(".erd-field") || e.target.closest(".erd-add-field") || e.target.closest(".erd-del")) return;
    
    const rect = wrapRef.current.getBoundingClientRect();
    setDrag({ 
      id: c.id, 
      offX: e.clientX - rect.left - c.x, 
      offY: e.clientY - rect.top - c.y 
    });
  }

  function onMouseMove(e) {
    if (!drag) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - drag.offX);
    const y = Math.max(0, e.clientY - rect.top - drag.offY);
    
    // Snap to grid (5px)
    setModels({
      ...models,
      cards: cards.map(c => c.id === drag.id ? { ...c, x: Math.round(x/5)*5, y: Math.round(y/5)*5 } : c)
    });
  }

  function onMouseUp() { 
    setDrag(null); 
  }

  /* ════════════════ DATA UPDATES ════════════════ */

  function updField(cid, idx, key, val) {
    setModels({
      ...models,
      cards: cards.map(c => c.id !== cid ? c : { 
        ...c, 
        fields: c.fields.map((f, i) => i === idx ? { ...f, [key]: val } : f) 
      })
    });
  }

  function delField(cid, idx) {
    setModels({
      ...models,
      cards: cards.map(c => c.id !== cid ? c : { ...c, fields: c.fields.filter((_, i) => i !== idx) })
    });
  }

  function addField(cid) {
    setModels({
      ...models,
      cards: cards.map(c => c.id !== cid ? c : { 
        ...c, 
        fields: [...c.fields, { name: "new_field", type: "Char", desc: "" }] 
      })
    });
  }

  function updCardName(cid, val) {
    setModels({ ...models, cards: cards.map(c => c.id === cid ? { ...c, name: val } : c) });
  }

  function delCard(cid) {
    if (!window.confirm("Xóa model này và các liên kết liên quan?")) return;
    setModels({
      ...models,
      cards: cards.filter(c => c.id !== cid).map(c => ({
        ...c,
        fields: c.fields.map(f => f.relTo === cid ? { ...f, relTo: undefined } : f)
      }))
    });
  }

  function addCard() {
    const id = "m_" + Math.random().toString(36).slice(2, 6);
    const rightmost = cards.length > 0 ? Math.max(...cards.map(c => c.x)) : 0;
    setModels({
      ...models,
      cards: [...cards, {
        id, name: "new.model", x: rightmost + 320, y: 30, color: accent,
        fields: [{ name: "name", type: "Char", desc: "", req: true }]
      }]
    });
  }

  /* ════════════════ LINE CALCULATIONS ════════════════ */
  const lines = [];
  cards.forEach(c => {
    c.fields.forEach((f, idx) => {
      if (!f.relTo) return;
      const target = cards.find(t => t.id === f.relTo);
      if (!target) return;

      const fromX = c.x + ERD_CARD_W;
      const fromY = c.y + ERD_HEAD_H + idx * ERD_FIELD_H + ERD_FIELD_H / 2;
      const toX   = target.x;
      const toY   = target.y + ERD_HEAD_H / 2;
      
      const goingLeft = toX < fromX;
      const sx = goingLeft ? c.x : fromX;
      
      lines.push({ sx, sy: fromY, tx: toX, ty: toY, type: f.type });
    });
  });

  return (
    <div className="erd-wrap">
      <div className="erd-toolbar">
        <button className="bpmn-add" onClick={addCard}><i className="ti ti-plus"></i> Thêm model</button>
        <div className="erd-legend">
          <span className="erd-leg-pill m2o">M2o</span> Many2one
          <span className="erd-leg-pill o2m">O2m</span> One2many
          <span className="erd-leg-pill m2m">M2m</span> Many2many
        </div>
        <span className="bpmn-help">Kéo header để di chuyển · Click field để sửa</span>
      </div>

      <div className="erd-canvas-wrap" 
           ref={wrapRef} 
           onMouseMove={onMouseMove} 
           onMouseUp={onMouseUp} 
           onMouseLeave={onMouseUp}>
        
        <svg className="erd-svg" width={W} height={H}>
          <defs>
            <marker id="erd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill="#999" />
            </marker>
            <pattern id="erd-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.6" fill="#ddd" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#erd-grid)" />

          {lines.map((ln, i) => {
            const dx = ln.tx - ln.sx;
            const c1x = ln.sx + (dx > 0 ? 60 : -60);
            const c2x = ln.tx - (dx > 0 ? 60 : -60);
            const d = `M${ln.sx},${ln.sy} C${c1x},${ln.sy} ${c2x},${ln.ty} ${ln.tx},${ln.ty}`;
            
            // Màu sắc đường kẻ dựa trên loại quan hệ
            const color = ln.type?.includes("One2many") ? "#378ADD" 
                        : ln.type?.includes("Many2many") ? "#8a3361" 
                        : "#1F6B40";
            
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={color} strokeWidth="1.5" markerEnd="url(#erd-arrow)" opacity="0.7" />
                <circle cx={ln.sx} cy={ln.sy} r="3" fill={color} />
              </g>
            );
          })}
        </svg>

        {cards.map(c => (
          <div key={c.id} className="erd-card" style={{ left: c.x, top: c.y, width: ERD_CARD_W }}>
            <div className="erd-card-head" 
                 style={{ background: c.color, cursor: drag?.id === c.id ? "grabbing" : "grab" }}
                 onMouseDown={(e) => onMouseDownCard(e, c)}>
              <i className="ti ti-table"></i>
              <input
                className="erd-card-name"
                value={c.name}
                onChange={(e) => updCardName(c.id, e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
              />
              <button className="erd-del" onClick={() => delCard(c.id)} title="Xóa model">
                <i className="ti ti-trash"></i>
              </button>
            </div>
            
            <div className="erd-fields">
              {c.fields.map((f, i) => (
                <div key={i} className="erd-field" style={{ height: ERD_FIELD_H }}>
                  <input className="erd-f-name" value={f.name} placeholder="field_name"
                         onChange={(e) => updField(c.id, i, "name", e.target.value)} />
                  <input className="erd-f-type" value={f.type} placeholder="Char"
                         onChange={(e) => updField(c.id, i, "type", e.target.value)} />
                  
                  {relIcon(f.type) && (
                    <span className={`erd-rel-chip rel-${relIcon(f.type)}`}>{relIcon(f.type)}</span>
                  )}
                  
                  <input className="erd-f-desc" value={f.desc} placeholder="Mô tả..."
                         onChange={(e) => updField(c.id, i, "desc", e.target.value)} />
                  
                  {f.req && <span className="erd-req">*</span>}
                  <button className="erd-f-del" onClick={() => delField(c.id, i)}><i className="ti ti-x"></i></button>
                </div>
              ))}
              <button className="erd-add-field" onClick={() => addField(c.id)}>
                <i className="ti ti-plus"></i> Thêm trường
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}