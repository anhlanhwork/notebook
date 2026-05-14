import React, { useState, useEffect, useRef } from 'react';
import { BPMNFlow } from './bpmn.jsx';
import { ERDModels } from './erd.jsx';

export const FEATURE_TABS = [
  { key: "models",       label: "Models",             icon: "ti-table" },
  { key: "flows",        label: "Luồng xử lý",        icon: "ti-git-branch" },
  { key: "details",      label: "Tính năng chi tiết", icon: "ti-list-details" },
  { key: "integrations", label: "Tích hợp",           icon: "ti-plug-connected" },
  { key: "cases",        label: "Case khách hàng",     icon: "ti-bug" },
  { key: "notes",        label: "Ghi chú",            icon: "ti-notes" }
];

export const MODULE_ICONS_MAP = {
  sale: "ti-shopping-cart", purchase: "ti-shopping-bag", stock: "ti-package",
  account: "ti-calculator", crm: "ti-users", hr: "ti-id-badge"
};

const DIRECTIONS = [
  { v: "in",   l: "Đầu vào",   icon: "ti-arrow-down-right", color: "var(--success)", bg: "var(--success-bg)" },
  { v: "out",  l: "Đầu ra",    icon: "ti-arrow-up-right",   color: "#b8861e",        bg: "var(--warn-bg)" },
  { v: "bidi", l: "Hai chiều", icon: "ti-arrows-exchange",  color: "var(--blue)",    bg: "var(--blue-bg)" }
];

const BLOCK_ICONS = [
  { v: "ti-target",      l: "Mục đích" }, { v: "ti-list-numbers", l: "Thao tác" },
  { v: "ti-gavel",       l: "Quy tắc" },  { v: "ti-shield-lock",  l: "Quyền" },
  { v: "ti-magic",       l: "Wizard" },   { v: "ti-hash",         l: "Số/Sequence" },
  { v: "ti-route",       l: "Tùy chọn" }, { v: "ti-plug",         l: "Tích hợp" },
  { v: "ti-dashboard",   l: "Dashboard" },{ v: "ti-receipt-2",    l: "Hóa đơn" },
  { v: "ti-info-circle", l: "Thông tin" },{ v: "ti-bulb",         l: "Ghi nhớ" }
];

/* ══════════════════════════════════════════════════════════════
   DETAIL BLOCKS — Rich text blocks with icon + title + toolbar
   ══════════════════════════════════════════════════════════════ */
const TEXT_COLORS = ["#111827","#DC2626","#D97706","#16A34A","#2563EB","#7C3AED","#9CA3AF"];
const HL_COLORS   = ["transparent","#FEF08A","#BBF7D0","#BFDBFE","#F5D0FE","#FECAca"];

function DetailBlock({ block, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [iconPick, setIconPick] = useState(false);
  const [colorPop, setColorPop] = useState(null); // 'text' | 'hl' | null
  const edRef = useRef(null);

  /* Seed initial content into DOM once per block id */
  useEffect(() => {
    if (edRef.current) edRef.current.innerHTML = block.content || "";
  }, [block.id]); // eslint-disable-line

  function fmt(cmd, val) {
    edRef.current?.focus();
    document.execCommand(cmd, false, val ?? null);
  }

  function onKeyDown(e) {
    if (e.key === "Tab") { e.preventDefault(); fmt(e.shiftKey ? "outdent" : "indent"); }
  }

  /* Close popovers on outside click */
  useEffect(() => {
    if (!colorPop && !iconPick) return;
    function h(e) {
      if (!e.target.closest(".dblk-color-pop") && !e.target.closest(".dblk-tb-color-btn")) setColorPop(null);
      if (!e.target.closest(".dblk-icon-picker") && !e.target.closest(".dblk-icon-btn")) setIconPick(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [colorPop, iconPick]);

  const num = String(index + 1).padStart(2, "0");

  return (
    <div className="dblk">
      {/* ── Block header ── */}
      <div className="dblk-head">
        <span className="dblk-num">{num}</span>

        {/* Icon selector */}
        <div className="dblk-icon-wrap">
          <button className="dblk-icon-btn" onClick={() => setIconPick(p => !p)} title="Chọn icon">
            <i className={"ti " + (block.icon || "ti-target")}/>
          </button>
          {iconPick && (
            <div className="dblk-icon-picker">
              {BLOCK_ICONS.map(ic => (
                <button key={ic.v} title={ic.l}
                        className={"dblk-icon-opt" + (block.icon === ic.v ? " active" : "")}
                        onClick={() => { onUpdate({ icon: ic.v }); setIconPick(false); }}>
                  <i className={"ti " + ic.v}/>
                </button>
              ))}
            </div>
          )}
        </div>

        <input className="dblk-title-input" value={block.title || ""}
               onChange={e => onUpdate({ title: e.target.value })}
               placeholder="Tiêu đề block..."/>

        <div className="dblk-actions">
          <button onClick={onMoveUp}   disabled={index === 0}         title="Lên"><i className="ti ti-arrow-up"/></button>
          <button onClick={onMoveDown} disabled={index === total - 1} title="Xuống"><i className="ti ti-arrow-down"/></button>
          <button onClick={onDelete} className="dblk-del-btn" title="Xóa"><i className="ti ti-trash"/></button>
        </div>
      </div>

      {/* ── Formatting toolbar ── */}
      <div className="dblk-toolbar">
        {/* Text style */}
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("bold")}}        title="Đậm (Ctrl+B)"><strong>B</strong></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("italic")}}      title="Nghiêng (Ctrl+I)"><em>I</em></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("underline")}}   title="Gạch chân (Ctrl+U)"><u>U</u></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("strikeThrough")}} title="Gạch giữa"><s>S</s></button>

        <div className="dblk-tb-sep"/>

        {/* Lists */}
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("insertOrderedList")}}   title="Danh sách có số"><i className="ti ti-list-numbers"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("insertUnorderedList")}} title="Dấu đầu dòng"><i className="ti ti-list"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("indent")}}              title="Thụt vào (Tab)"><i className="ti ti-indent-increase"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("outdent")}}             title="Thụt ra (Shift+Tab)"><i className="ti ti-indent-decrease"/></button>

        <div className="dblk-tb-sep"/>

        {/* Text color */}
        <div className="dblk-tb-color-wrap">
          <button className="dblk-tb-btn dblk-tb-color-btn"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setColorPop(p => p === "text" ? null : "text")}
                  title="Màu chữ">
            <span className="dblk-tb-color-lbl">A</span>
            <span className="dblk-tb-color-bar" style={{ background: "#DC2626" }}/>
          </button>
          {colorPop === "text" && (
            <div className="dblk-color-pop">
              {TEXT_COLORS.map(col => (
                <button key={col} className="dblk-color-sw"
                        style={{ background: col, border: "1.5px solid rgba(0,0,0,0.1)" }}
                        onMouseDown={e => { e.preventDefault(); fmt("foreColor", col); setColorPop(null); }}/>
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="dblk-tb-color-wrap">
          <button className="dblk-tb-btn dblk-tb-color-btn"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setColorPop(p => p === "hl" ? null : "hl")}
                  title="Tô màu nền">
            <i className="ti ti-highlight" style={{ fontSize: 13 }}/>
            <span className="dblk-tb-color-bar" style={{ background: "#FEF08A" }}/>
          </button>
          {colorPop === "hl" && (
            <div className="dblk-color-pop">
              {HL_COLORS.map(col => (
                <button key={col} className="dblk-color-sw"
                        style={{ background: col === "transparent" ? "#fff" : col,
                                 border: "1.5px solid rgba(0,0,0,0.1)" }}
                        onMouseDown={e => {
                          e.preventDefault();
                          fmt("hiliteColor", col === "transparent" ? "transparent" : col);
                          setColorPop(null);
                        }}>
                  {col === "transparent" && <i className="ti ti-x" style={{ fontSize: 9, color: "#999" }}/>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="dblk-tb-sep"/>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("formatBlock","pre")}} title="Code block">
          <i className="ti ti-code"/>
        </button>
      </div>

      {/* ── Rich text area ── */}
      <div ref={edRef}
           className="dblk-editor"
           contentEditable
           suppressContentEditableWarning
           onInput={() => onUpdate({ content: edRef.current.innerHTML })}
           onKeyDown={onKeyDown}
           data-placeholder="Nhập nội dung..."/>
    </div>
  );
}

function DetailBlocksPane({ blocks = [], onChange }) {
  function addBlock() {
    const id = "db_" + Math.random().toString(36).slice(2, 6);
    onChange([...blocks, { id, icon: "ti-target", title: "Block mới", content: "" }]);
  }
  function updBlock(id, patch) { onChange(blocks.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function delBlock(id) {
    if (!confirm("Xóa block này?")) return;
    onChange(blocks.filter(b => b.id !== id));
  }
  function moveBlock(id, dir) {
    const i = blocks.findIndex(b => b.id === id);
    const a = [...blocks]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  }

  return (
    <div className="dblocks-pane">
      {blocks.length === 0 && (
        <div className="dblocks-empty">
          <i className="ti ti-list-details"/>
          <p>Chưa có block nào. Nhấn nút bên dưới để bắt đầu.</p>
        </div>
      )}
      {blocks.map((b, i) => (
        <DetailBlock key={b.id} block={b} index={i} total={blocks.length}
          onUpdate={p => updBlock(b.id, p)}
          onDelete={() => delBlock(b.id)}
          onMoveUp={() => moveBlock(b.id, -1)}
          onMoveDown={() => moveBlock(b.id, 1)}
        />
      ))}
      <button className="dblocks-add-btn" onClick={addBlock}>
        <i className="ti ti-plus"/> Thêm block
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INTEGRATIONS PANE
   ══════════════════════════════════════════════════════════════ */
const INT_ICON_PRESETS = [
  "ti-package","ti-user","ti-calculator","ti-chart-bar","ti-mail","ti-plug",
  "ti-truck","ti-receipt-2","ti-settings","ti-database","ti-building-store","ti-credit-card",
];
const INT_COLOR_PRESETS = ["#5BAA50","#7C3AED","#2563EB","#D97706","#DC2626","#0891B2","#374151","#D85A30"];

function IntCard({ item, onUpdate, onDelete, onMoveUp, onMoveDown, index, total }) {
  const edRef       = useRef(null);
  const [iconPop,  setIconPop]  = useState(false);
  const [colorPop, setColorPop] = useState(false);

  useEffect(() => {
    if (edRef.current) edRef.current.innerHTML = item.content || "";
  }, [item.id]);

  useEffect(() => {
    if (!iconPop && !colorPop) return;
    function h(e) {
      if (!e.target.closest(".int-icon-pop") && !e.target.closest(".int-icon-dot"))  setIconPop(false);
      if (!e.target.closest(".int-color-pop") && !e.target.closest(".int-color-dot")) setColorPop(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [iconPop, colorPop]);

  const dir = DIRECTIONS.find(d => d.v === item.direction) || DIRECTIONS[0];

  return (
    <div className="intc" style={{ borderLeftColor: dir.color }}>
      <div className="intc-head">
        {/* Icon + color pickers */}
        <div style={{ position:"relative", flexShrink:0, display:"flex" }}>
          <button className="intc-icon-btn int-icon-dot"
                  style={{ background: item.color }}
                  onClick={() => { setIconPop(p=>!p); setColorPop(false); }}>
            <i className={"ti " + (item.icon || "ti-plug")} style={{ color:"#fff", fontSize:15 }}/>
          </button>
          {iconPop && (
            <div className="int-icon-pop">
              {INT_ICON_PRESETS.map(ic => (
                <button key={ic} className={"int-icon-opt" + (item.icon===ic?" active":"")}
                        onClick={() => { onUpdate({ icon: ic }); setIconPop(false); }}>
                  <i className={"ti " + ic}/>
                </button>
              ))}
              <div className="int-icon-pop-colors">
                {INT_COLOR_PRESETS.map(col => (
                  <button key={col} className={"int-color-sw" + (item.color===col?" active":"")}
                          style={{ background: col }}
                          onClick={() => { onUpdate({ color: col }); }}/>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Module name */}
        <input className="intc-module-input"
               value={item.module || ""}
               onChange={e => onUpdate({ module: e.target.value })}
               placeholder="module.name"/>

        {/* Direction segmented selector */}
        <div className="intc-dir-group">
          {DIRECTIONS.map(d => (
            <button key={d.v}
                    className={"intc-dir" + (item.direction === d.v ? " active" : "")}
                    style={item.direction === d.v ? { background: d.bg, color: d.color, borderColor: d.color } : {}}
                    onClick={() => onUpdate({ direction: d.v })}>
              <i className={"ti " + d.icon}/> {d.l}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="intc-actions">
          <button onClick={onMoveUp}   disabled={index === 0}         title="Lên"><i className="ti ti-arrow-up"/></button>
          <button onClick={onMoveDown} disabled={index === total - 1} title="Xuống"><i className="ti ti-arrow-down"/></button>
          <button onClick={onDelete} className="intc-del-btn" title="Xóa"><i className="ti ti-trash"/></button>
        </div>
      </div>

      {/* Content area */}
      <div ref={edRef}
           className="intc-editor"
           contentEditable
           suppressContentEditableWarning
           onInput={() => onUpdate({ content: edRef.current.innerHTML })}
           onKeyDown={e => {
             if (e.key === "Tab") { e.preventDefault(); document.execCommand(e.shiftKey ? "outdent" : "indent"); }
           }}
           data-placeholder="Mô tả chi tiết tích hợp..."/>
    </div>
  );
}

function IntegrationsPane({ integrations = [], onChange }) {
  const [filter, setFilter] = useState(null);

  const counts = { in: 0, out: 0, bidi: 0 };
  integrations.forEach(x => { if (counts[x.direction] !== undefined) counts[x.direction]++; });

  function addInt() {
    const id = "int_" + Math.random().toString(36).slice(2, 6);
    onChange([...integrations, { id, module: "module.name", icon: "ti-plug", color: "#374151", direction: "in", content: "" }]);
  }
  function upd(id, patch) { onChange(integrations.map(x => x.id === id ? { ...x, ...patch } : x)); }
  function del(id) { if (!confirm("Xóa tích hợp này?")) return; onChange(integrations.filter(x => x.id !== id)); }
  function move(id, dir) {
    const i = integrations.findIndex(x => x.id === id);
    const a = [...integrations]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  }

  const list = filter ? integrations.filter(x => x.direction === filter) : integrations;

  return (
    <div className="ints-pane">
      {/* Summary + filter bar */}
      <div className="ints-topbar">
        <div className="ints-counts">
          {DIRECTIONS.map(d => (
            <div key={d.v} className="ints-count-chip" style={{ background: d.bg, color: d.color }}>
              <i className={"ti " + d.icon}/> <strong>{counts[d.v]}</strong> {d.l}
            </div>
          ))}
        </div>
        <div className="ints-filter-group">
          {DIRECTIONS.map(d => (
            <button key={d.v}
                    className={"ints-filter-btn" + (filter === d.v ? " active" : "")}
                    style={filter === d.v ? { background: d.bg, color: d.color, borderColor: d.color } : {}}
                    onClick={() => setFilter(filter === d.v ? null : d.v)}>
              <i className={"ti " + d.icon}/> {d.l}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {list.length === 0 && (
        <div className="ints-empty">
          <i className="ti ti-plug-connected"/>
          <p>{filter ? "Không có tích hợp theo bộ lọc này." : "Chưa có tích hợp nào."}</p>
        </div>
      )}
      {list.map((item, i) => {
        const realIdx = integrations.findIndex(x => x.id === item.id);
        return (
          <IntCard key={item.id} item={item} index={realIdx} total={integrations.length}
            onUpdate={p => upd(item.id, p)}
            onDelete={() => del(item.id)}
            onMoveUp={() => move(item.id, -1)}
            onMoveDown={() => move(item.id, 1)}
          />
        );
      })}

      <button className="ints-add-btn" onClick={addInt}>
        <i className="ti ti-plus"/> Thêm tích hợp
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NOTES PANE — full-height rich text with shared toolbar
   ══════════════════════════════════════════════════════════════ */
function NotesPane({ notes = "", onChange }) {
  const edRef      = useRef(null);
  const [colorPop, setColorPop] = useState(null); // 'text' | 'hl' | null

  useEffect(() => {
    if (edRef.current) edRef.current.innerHTML = notes;
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!colorPop) return;
    function h(e) { if (!e.target.closest(".dblk-color-pop") && !e.target.closest(".dblk-tb-color-btn")) setColorPop(null); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [colorPop]);

  function fmt(cmd, val) {
    edRef.current?.focus();
    document.execCommand(cmd, false, val ?? null);
  }

  return (
    <div className="notes-pane">
      {/* Toolbar — identical to detail blocks */}
      <div className="dblk-toolbar notes-toolbar">
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("bold")}}          title="Đậm"><strong>B</strong></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("italic")}}        title="Nghiêng"><em>I</em></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("underline")}}     title="Gạch chân"><u>U</u></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("strikeThrough")}} title="Gạch giữa"><s>S</s></button>
        <div className="dblk-tb-sep"/>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("insertOrderedList")}}   title="Danh sách có số"><i className="ti ti-list-numbers"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("insertUnorderedList")}} title="Dấu đầu dòng"><i className="ti ti-list"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("indent")}}              title="Thụt vào (Tab)"><i className="ti ti-indent-increase"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("outdent")}}             title="Thụt ra (Shift+Tab)"><i className="ti ti-indent-decrease"/></button>
        <div className="dblk-tb-sep"/>
        <div className="dblk-tb-color-wrap">
          <button className="dblk-tb-btn dblk-tb-color-btn" onMouseDown={e=>e.preventDefault()}
                  onClick={() => setColorPop(p => p==="text" ? null : "text")} title="Màu chữ">
            <span className="dblk-tb-color-lbl">A</span>
            <span className="dblk-tb-color-bar" style={{ background:"#DC2626" }}/>
          </button>
          {colorPop === "text" && (
            <div className="dblk-color-pop">
              {TEXT_COLORS.map(col => (
                <button key={col} className="dblk-color-sw"
                        style={{ background: col, border:"1.5px solid rgba(0,0,0,0.1)" }}
                        onMouseDown={e => { e.preventDefault(); fmt("foreColor", col); setColorPop(null); }}/>
              ))}
            </div>
          )}
        </div>
        <div className="dblk-tb-color-wrap">
          <button className="dblk-tb-btn dblk-tb-color-btn" onMouseDown={e=>e.preventDefault()}
                  onClick={() => setColorPop(p => p==="hl" ? null : "hl")} title="Tô màu nền">
            <i className="ti ti-highlight" style={{ fontSize:13 }}/>
            <span className="dblk-tb-color-bar" style={{ background:"#FEF08A" }}/>
          </button>
          {colorPop === "hl" && (
            <div className="dblk-color-pop">
              {HL_COLORS.map(col => (
                <button key={col} className="dblk-color-sw"
                        style={{ background: col==="transparent"?"#fff":col, border:"1.5px solid rgba(0,0,0,0.1)" }}
                        onMouseDown={e => { e.preventDefault(); fmt("hiliteColor", col); setColorPop(null); }}>
                  {col === "transparent" && <i className="ti ti-x" style={{ fontSize:9, color:"#999" }}/>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="dblk-tb-sep"/>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt("formatBlock","pre")}} title="Code block">
          <i className="ti ti-code"/>
        </button>
      </div>

      {/* Editor area */}
      <div ref={edRef}
           className="notes-editor"
           contentEditable
           suppressContentEditableWarning
           onInput={() => onChange(edRef.current.innerHTML)}
           onKeyDown={e => {
             if (e.key === "Tab") { e.preventDefault(); fmt(e.shiftKey ? "outdent" : "indent"); }
           }}
           data-placeholder="Ghi chú, lỗi thường gặp, gotcha..."/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CASES PANE — customer cases with status, images, cause/resolution
   ══════════════════════════════════════════════════════════════ */
const CASE_STATUSES = [
  { v: "new",        l: "Mới",            color: "#DC2626", bg: "#FEE2E2" },
  { v: "processing", l: "Đang xử lý",    color: "#D97706", bg: "#FEF3C7" },
  { v: "resolved",   l: "Đã giải quyết", color: "#16A34A", bg: "#DCFCE7" }
];

function CaseCard({ item, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [open, setOpen] = useState(true);
  const imgInputRef = useRef(null);
  const dropRef     = useRef(null);

  function addImages(files) {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    Promise.all(valid.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = e => res({ id: "img_" + Math.random().toString(36).slice(2, 6), src: e.target.result, name: f.name });
      r.readAsDataURL(f);
    }))).then(imgs => onUpdate({ images: [...(item.images || []), ...imgs] }));
  }

  function onDrop(e) { e.preventDefault(); addImages(e.dataTransfer.files); }

  function onPasteInZone(e) {
    const items = Array.from(e.clipboardData?.items || []).filter(x => x.type.startsWith("image/"));
    if (!items.length) return;
    e.preventDefault();
    addImages(items.map(x => x.getAsFile()));
  }

  return (
    <div className="csc">
      {/* Header */}
      <div className="csc-head">
        <button className="csc-toggle" onClick={() => setOpen(o => !o)}>
          <i className={"ti " + (open ? "ti-chevron-down" : "ti-chevron-right")}/>
        </button>
        <span className="csc-num">#{String(index + 1).padStart(2, "0")}</span>
        <input className="csc-title-input" value={item.title || ""}
               onChange={e => onUpdate({ title: e.target.value })}
               placeholder="Tên case..."/>

        <div className="csc-status-group">
          {CASE_STATUSES.map(s => (
            <button key={s.v}
                    className={"csc-status-btn" + (item.status === s.v ? " active" : "")}
                    style={item.status === s.v ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
                    onClick={() => onUpdate({ status: s.v })}>
              {s.l}
            </button>
          ))}
        </div>

        <div className="csc-actions">
          <button onClick={onMoveUp}   disabled={index === 0}         title="Lên"><i className="ti ti-arrow-up"/></button>
          <button onClick={onMoveDown} disabled={index === total - 1} title="Xuống"><i className="ti ti-arrow-down"/></button>
          <button onClick={onDelete} className="csc-del-btn" title="Xóa"><i className="ti ti-trash"/></button>
        </div>
      </div>

      {open && (
        <div className="csc-body">
          {/* Chat / ticket link */}
          <div className="csc-section">
            <label className="csc-lbl"><i className="ti ti-link"/> Link nhóm chat / ticket</label>
            <input className="csc-input-full" type="url"
                   value={item.chatLink || ""}
                   onChange={e => onUpdate({ chatLink: e.target.value })}
                   placeholder="https://..."/>
          </div>

          {/* Description */}
          <div className="csc-section">
            <label className="csc-lbl">
              <i className="ti ti-align-left"/> Mô tả lỗi <span className="csc-req">*</span>
            </label>
            <textarea className="csc-textarea csc-textarea-lg"
                      value={item.description || ""}
                      onChange={e => onUpdate({ description: e.target.value })}
                      placeholder="Mô tả chi tiết vấn đề, bước tái hiện..."/>
          </div>

          {/* Images */}
          <div className="csc-section">
            <label className="csc-lbl">
              <i className="ti ti-photo"/> Ảnh chụp
              {(item.images || []).length > 0 && <span className="csc-img-count">({item.images.length})</span>}
            </label>
            <div className="csc-drop-zone" ref={dropRef} tabIndex={0}
                 onDrop={onDrop} onDragOver={e => e.preventDefault()}
                 onPaste={onPasteInZone}>
              {(item.images || []).length === 0 ? (
                <div className="csc-drop-hint">
                  <i className="ti ti-upload"/>
                  <span>Kéo & thả ảnh vào đây, hoặc{" "}
                    <button className="csc-drop-link" onClick={() => imgInputRef.current?.click()}>chọn file</button>
                  </span>
                  <small>Click vào vùng này rồi Cmd+V để paste ảnh từ clipboard</small>
                </div>
              ) : (
                <div className="csc-thumbs">
                  {(item.images || []).map(img => (
                    <div key={img.id} className="csc-thumb">
                      <img src={img.src} alt={img.name}/>
                      <button className="csc-thumb-del"
                              onClick={() => onUpdate({ images: item.images.filter(x => x.id !== img.id) })}>
                        <i className="ti ti-x"/>
                      </button>
                    </div>
                  ))}
                  <button className="csc-thumb-add" onClick={() => imgInputRef.current?.click()}>
                    <i className="ti ti-plus"/>
                  </button>
                </div>
              )}
              <input ref={imgInputRef} type="file" accept="image/*" multiple style={{ display:"none" }}
                     onChange={e => { addImages(e.target.files); e.target.value = ""; }}/>
            </div>
          </div>

          {/* Cause + Resolution */}
          <div className="csc-two-col">
            <div className="csc-section">
              <label className="csc-lbl"><i className="ti ti-analyze"/> Nguyên nhân</label>
              <textarea className="csc-textarea"
                        value={item.cause || ""}
                        onChange={e => onUpdate({ cause: e.target.value })}
                        placeholder="Nguyên nhân gốc rễ..."/>
            </div>
            <div className="csc-section">
              <label className="csc-lbl"><i className="ti ti-check"/> Cách xử lý</label>
              <textarea className="csc-textarea"
                        value={item.resolution || ""}
                        onChange={e => onUpdate({ resolution: e.target.value })}
                        placeholder="Giải pháp đã áp dụng..."/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CasesPane({ cases = [], onChange }) {
  const counts = { new: 0, processing: 0, resolved: 0 };
  cases.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });

  function addCase() {
    const id = "cs_" + Math.random().toString(36).slice(2, 6);
    onChange([...cases, { id, title: "Case mới", status: "new", chatLink: "", description: "", images: [], cause: "", resolution: "" }]);
  }
  function upd(id, patch) { onChange(cases.map(c => c.id === id ? { ...c, ...patch } : c)); }
  function del(id) { if (!confirm("Xóa case này?")) return; onChange(cases.filter(c => c.id !== id)); }
  function move(id, dir) {
    const i = cases.findIndex(c => c.id === id);
    const a = [...cases]; const j = i + dir;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; onChange(a);
  }

  return (
    <div className="cases-pane">
      {/* Top bar */}
      <div className="cases-topbar">
        <div className="cases-counts">
          {CASE_STATUSES.map(s => (
            <div key={s.v} className="cases-count-chip" style={{ background: s.bg, color: s.color }}>
              <strong>{counts[s.v]}</strong> {s.l}
            </div>
          ))}
        </div>
        <button className="cases-add-btn" onClick={addCase}>
          <i className="ti ti-plus"/> Thêm case
        </button>
      </div>

      {cases.length === 0 && (
        <div className="cases-empty">
          <i className="ti ti-bug"/>
          <p>Chưa có case nào. Nhấn "+ Thêm case" để bắt đầu.</p>
        </div>
      )}

      <div className="cases-list">
        {cases.map((c, i) => (
          <CaseCard key={c.id} item={c} index={i} total={cases.length}
            onUpdate={p => upd(c.id, p)}
            onDelete={() => del(c.id)}
            onMoveUp={() => move(c.id, -1)}
            onMoveDown={() => move(c.id, 1)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Markdown lite ── */
function MarkdownLite({ text }) {
  const lines = (text || "").split("\n");
  const out = []; let listBuf = [];
  const flushList = () => {
    if (listBuf.length) {
      out.push(<ul key={"ul" + out.length}>{listBuf.map((l, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inlineMd(l) }} />)}</ul>);
      listBuf = [];
    }
  };
  const inlineMd = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
  lines.forEach((l, i) => {
    if (l.startsWith("## ")) { flushList(); out.push(<h4 key={i} className="md-h4">{l.slice(3)}</h4>); }
    else if (l.startsWith("- ")) { listBuf.push(l.slice(2)); }
    else if (/^\d+\.\s/.test(l)) { listBuf.push(l.replace(/^\d+\.\s/, "")); }
    else if (!l.trim()) { flushList(); }
    else { flushList(); out.push(<p key={i} dangerouslySetInnerHTML={{ __html: inlineMd(l) }} />); }
  });
  flushList();
  return <div className="md">{out}</div>;
}

/* ── Breadcrumb ── */
function Breadcrumb({ items }) {
  return (
    <div className="bc">
      {items.map((x, i) => (
        <React.Fragment key={i}>
          {i > 0 && <i className="ti ti-chevron-right bc-sep"></i>}
          {x.onClick ? (
            <button className={"bc-item bc-link" + (i === items.length - 1 ? " bc-active" : "")} onClick={x.onClick}>
              {x.label}
            </button>
          ) : (
            <span className={"bc-item" + (i === items.length - 1 ? " bc-active" : "")}>{x.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── MultiFlowEditor ── */
function MultiFlowEditor({ flows = [], onChange, accent, emptyHint }) {
  const [activeId, setActiveId] = useState(flows[0]?.id || null);
  useEffect(() => {
    if (!flows.find(f => f.id === activeId)) setActiveId(flows[0]?.id || null);
  }, [flows, activeId]);

  const active = flows.find(f => f.id === activeId) || flows[0];

  function addFlow() {
    const name = prompt("Tên luồng mới:", "Luồng " + (flows.length + 1));
    if (!name) return;
    const id = "fl_" + Math.random().toString(36).slice(2, 7);
    onChange([...flows, { id, name, nodes: [], edges: [] }]);
    setActiveId(id);
  }

  function renameFlow(f, e) {
    e.stopPropagation();
    const name = prompt("Đổi tên luồng:", f.name);
    if (!name) return;
    onChange(flows.map(fl => fl.id === f.id ? { ...fl, name } : fl));
  }

  function dupFlow(f, e) {
    e.stopPropagation();
    const copy = {
      ...f,
      id: "fl_" + Math.random().toString(36).slice(2, 7),
      name: f.name + " (copy)",
      nodes: (f.nodes || []).map(n => ({ ...n, id: "n" + Math.random().toString(36).slice(2, 6) })),
      edges: []
    };
    onChange([...flows, copy]);
    setActiveId(copy.id);
  }

  function deleteFlow(f, e) {
    e.stopPropagation();
    if (!confirm(`Xóa luồng "${f.name}"?`)) return;
    const next = flows.filter(fl => fl.id !== f.id);
    onChange(next);
    setActiveId(next[0]?.id || null);
  }

  const updateActiveFlow = (updated) =>
    onChange(flows.map(fl => fl.id === active?.id ? { ...fl, ...updated } : fl));

  const stepCount = (f) => (f.nodes?.length || 0) + (f.edges?.length || 0);

  if (flows.length === 0) {
    return (
      <div className="mf-empty">
        <i className="ti ti-git-branch"></i>
        <h3>Chưa có luồng nào</h3>
        <p>{emptyHint}</p>
        <button className="btn-primary" onClick={addFlow}>
          <i className="ti ti-plus"></i> Thêm luồng đầu tiên
        </button>
      </div>
    );
  }

  return (
    <div className="multiflow">
      <div className="mf-tabs-strip">
        {flows.map((f, i) => (
          <div key={f.id}
               className={"mf-tab" + (f.id === activeId ? " active" : "")}
               onClick={() => setActiveId(f.id)}>
            <span className="mf-tab-num">{i + 1}</span>
            <span className="mf-tab-name">{f.name}</span>
            <span className="mf-tab-meta">{stepCount(f)} bước</span>
            <div className="mf-tab-actions">
              <button title="Đổi tên" onClick={(e) => renameFlow(f, e)}>
                <i className="ti ti-pencil"></i>
              </button>
              <button title="Nhân bản" onClick={(e) => dupFlow(f, e)}>
                <i className="ti ti-copy"></i>
              </button>
              <button title="Xóa" className="mf-tab-del" onClick={(e) => deleteFlow(f, e)}>
                <i className="ti ti-trash"></i>
              </button>
            </div>
          </div>
        ))}
        <button className="mf-tab-add" onClick={addFlow}>
          <i className="ti ti-plus"></i> Thêm luồng
        </button>
      </div>
      {active && <BPMNFlow flow={active} setFlow={updateActiveFlow} accent={accent} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   OVERVIEW PANE — new layout matching design
   ════════════════════════════════════════════════════════════ */

const STATUS_META = {
  pending:  { label: "Chưa bắt đầu",   color: "var(--text3)",   bg: "var(--bg3)",       icon: "ti-circle" },
  studying: { label: "Đang nghiên cứu", color: "var(--success)", bg: "var(--success-bg)", icon: "ti-circle-dot" },
  done:     { label: "Hoàn thành",      color: "var(--blue-hi)", bg: "var(--blue-bg)",    icon: "ti-circle-check" },
};

const MODULE_ICONS = {
  sale: "ti-shopping-cart", purchase: "ti-shopping-bag", stock: "ti-package",
  account: "ti-calculator", crm: "ti-users", hr: "ti-id-badge", default: "ti-cube",
};

function OverviewPane({ mod, setMod }) {
  const ov   = mod.overview || {};
  const st   = STATUS_META[mod.status] || STATUS_META.pending;
  const icon = MODULE_ICONS[mod.tech] || MODULE_ICONS.default;

  /* computed stats */
  const featCount  = mod.features?.length || 0;
  const modelCount = mod.features?.reduce((s, f) => s + (f.models?.cards?.length || 0), 0) || 0;
  const flowCount  = (mod.mainFlows?.length || 0) +
                     (mod.features?.reduce((s, f) => s + (f.flows?.length || 0), 0) || 0);
  const intCount   = mod.features?.reduce((s, f) => s + (f.integrations?.length || 0), 0) || 0;

  function field(key, val) {
    setMod({ ...mod, overview: { ...ov, [key]: val } });
  }
  function setStatus(s) {
    setMod({ ...mod, status: s });
  }

  return (
    <div className="ov-wrap">

      {/* ── Header card ── */}
      <div className="ov-header-card">
        <div className="ov-header-icon" style={{ background: mod.color }}>
          <i className={`ti ${icon}`}></i>
        </div>
        <div className="ov-header-info">
          <div className="ov-header-name-row">
            <span className="ov-header-name">{mod.name}</span>
            <code className="ov-tech">{mod.tech}</code>
            <span className="ov-pill" style={{ background: st.bg, color: st.color }}>
              {st.label}
            </span>
            <span className="ov-version">v{ov.version || "18.0"}</span>
          </div>
        </div>
      </div>

      {/* ── 2-column: info + purpose ── */}
      <div className="ov-cols">
        <div className="ov-card">
          <div className="ov-card-title">Thông tin module</div>
          <div className="ov-fields-list">
            <div className="ov-row">
              <span className="ov-row-lbl">Phiên bản</span>
              <div className="ov-row-val">
                <input className="ov-input" value={ov.version || ""} onChange={e => field("version", e.target.value)} placeholder="18.0" />
              </div>
            </div>
            <div className="ov-row">
              <span className="ov-row-lbl">Danh mục</span>
              <div className="ov-row-val">
                <input className="ov-input" value={ov.category || ""} onChange={e => field("category", e.target.value)} placeholder="vd: Bán hàng" />
              </div>
            </div>
            <div className="ov-row">
              <span className="ov-row-lbl">Depends</span>
              <div className="ov-row-val">
                <input className="ov-input" value={ov.depends || ""} onChange={e => field("depends", e.target.value)} placeholder="base, mail, account..." />
              </div>
            </div>
            <div className="ov-row">
              <span className="ov-row-lbl">Menu</span>
              <div className="ov-row-val">
                <input className="ov-input" value={ov.menu || ""} onChange={e => field("menu", e.target.value)} placeholder="vd: Sales ▸ Orders ▸ Quotations" />
              </div>
            </div>
            <div className="ov-row ov-row-status">
              <span className="ov-row-lbl">Trạng thái</span>
              <div className="ov-row-val">
                <div className="ov-status-group">
                  {Object.entries(STATUS_META).map(([key, s]) => (
                    <button
                      key={key}
                      className={"ov-status-btn" + (mod.status === key ? " ov-status-active" : "")}
                      style={mod.status === key ? { color: s.color, borderColor: s.color, background: s.bg } : {}}
                      onClick={() => setStatus(key)}
                    >
                      <i className={`ti ${s.icon}`}></i>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ov-card ov-card-purpose">
          <div className="ov-card-title">Mục đích / Chức năng chính</div>
          <textarea
            className="ov-purpose-textarea"
            value={ov.purpose || ""}
            onChange={e => field("purpose", e.target.value)}
            placeholder="Mô tả tổng quan về chức năng của module..."
          />
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="ov-stats-row">
        {[
          { num: featCount,  lbl: "Tính năng" },
          { num: modelCount, lbl: "Models" },
          { num: flowCount,  lbl: "Luồng" },
          { num: intCount,   lbl: "Tích hợp" },
        ].map(s => (
          <div key={s.lbl} className="ov-stat-card">
            <div className="ov-stat-num">{s.num}</div>
            <div className="ov-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

    </div>
  );
}

/* ── Feature pane ── */
function tabCount(feature, key) {
  if (key === "models")       return feature.models?.cards?.length || 0;
  if (key === "flows")        return feature.flows?.length || 0;
  if (key === "details")      return feature.detailBlocks?.length || 0;
  if (key === "integrations") return feature.integrations?.length || 0;
  if (key === "cases")        return feature.cases?.length || 0;
  return 0;
}

function FeaturePane({ feature, setFeature, accent }) {
  const [tab, setTab] = useState("models");
  return (
    <div className="feat-pane">
      <div className="feat-tabs">
        {FEATURE_TABS.map(t => {
          const cnt = tabCount(feature, t.key);
          return (
            <button key={t.key} className={"feat-tab" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
              <i className={"ti " + t.icon}></i>
              <span>{t.label}</span>
              {cnt > 0 && <span className="feat-tab-count">{cnt}</span>}
            </button>
          );
        })}
      </div>
      <div className="feat-tab-body">
        {tab === "models"  && <ERDModels models={feature.models} setModels={(m) => setFeature({...feature, models: m})} accent={accent} />}
        {tab === "flows"   && <MultiFlowEditor flows={feature.flows} onChange={(fls) => setFeature({...feature, flows: fls})} accent={accent} />}
        {tab === "details"      && <DetailBlocksPane blocks={feature.detailBlocks || []} onChange={dbs => setFeature({...feature, detailBlocks: dbs})} />}
        {tab === "integrations" && <IntegrationsPane integrations={feature.integrations || []} onChange={ints => setFeature({...feature, integrations: ints})} />}
        {tab === "cases"        && <CasesPane cases={feature.cases || []} onChange={cs => setFeature({...feature, cases: cs})} />}
        {tab === "notes"        && <NotesPane notes={feature.notes || ""} onChange={n => setFeature({...feature, notes: n})} />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN EDITOR
   ════════════════════════════════════════════════════════════ */
export function Editor({ mod, setMod, selection, accent, onSave, saveState, onBackToModules, notebook, onBackToHome }) {
  const f = selection.type === "feature" ? mod.features.find(x => x.id === selection.featId) : null;

  const headerTitle = (() => {
    if (selection.type === "overview") return "Tổng quan module";
    if (selection.type === "mainflow") return "Luồng chính";
    if (selection.type === "feature")  return f ? f.name : "—";
    return "";
  })();

  const bcrumb = [
    { label: "Tất cả sổ tay", onClick: onBackToHome },
    notebook ? { label: notebook.name, onClick: onBackToModules } : null,
    { label: mod.name },
    { label: headerTitle }
  ].filter(Boolean);

  const updateFeature = (featId, updatedFeat) =>
    setMod({ ...mod, features: mod.features.map(x => x.id === featId ? updatedFeat : x) });

  return (
    <div className="ed-col">
      <div className="ed-head">
        <Breadcrumb items={bcrumb} />
        <h1 className="ed-title">{headerTitle}</h1>
      </div>

      <div className="ed-body">
        {selection.type === "overview" && (
          <OverviewPane mod={mod} setMod={setMod} />
        )}
        {selection.type === "mainflow" && (
          <MultiFlowEditor
            flows={mod.mainFlows || []}
            onChange={(fls) => setMod({ ...mod, mainFlows: fls })}
            accent={accent}
            emptyHint="Thêm luồng chính của module."
          />
        )}
        {selection.type === "feature" && f && (
          <FeaturePane
            feature={f}
            setFeature={(nv) => updateFeature(f.id, nv)}
            accent={accent}
          />
        )}
      </div>

      <div className="ed-savebar">
        <span className={"save-state save-" + saveState.kind}>
          {saveState.kind === "dirty"  && <><i className="ti ti-circle-dot"></i> Có thay đổi chưa lưu</>}
          {saveState.kind === "saved"  && <><i className="ti ti-check"></i> Đã lưu lúc {saveState.at}</>}
          {saveState.kind === "saving" && <><i className="ti ti-loader-2 spin"></i> Đang lưu...</>}
        </span>
        <div className="ed-savebar-actions">
          <button className="btn-ghost">
            <i className="ti ti-download"></i> Xuất
          </button>
          <button className="btn-primary" onClick={onSave}>
            <i className="ti ti-device-floppy"></i> Lưu thay đổi <kbd className="btn-kbd">⌘S</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
