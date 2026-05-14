import React, { useState, useRef, useEffect } from 'react';

/* ── Palette ─────────────────────────────────────────────────── */
const ACCENT    = '#5BAA50';
const ACCENT_BG = '#EAF4E8';
const ACCENT_HI = '#3D8A34';
const AMBER     = '#F59E0B';
const AMBER_BG  = '#FFFBEB';

/* ── Node geometry ────────────────────────────────────────────── */
const NODE_W = 140, NODE_H = 56, GATE = 58, EVENT = 38;

function mkId() { return 'n' + Math.random().toString(36).slice(2, 7); }

function nodeBox(n) {
  if (n.type === 'task')    return { cx: n.x + NODE_W/2, cy: n.y + NODE_H/2, w: NODE_W, h: NODE_H, s: 'rect'    };
  if (n.type === 'gateway') return { cx: n.x + GATE/2,   cy: n.y + GATE/2,   w: GATE,   h: GATE,   s: 'diamond' };
  return                           { cx: n.x + EVENT/2,  cy: n.y + EVENT/2,  w: EVENT,  h: EVENT,  s: 'circle'  };
}

function edgePt(box, tx, ty) {
  const dx = tx - box.cx, dy = ty - box.cy;
  if (box.s === 'circle')  { const r = box.w/2, m = Math.hypot(dx,dy)||1; return { x: box.cx+dx/m*r, y: box.cy+dy/m*r }; }
  if (box.s === 'diamond') { const r = box.w/2, m = Math.abs(dx)+Math.abs(dy)||1; return { x: box.cx+dx/m*r, y: box.cy+dy/m*r }; }
  const hw = box.w/2, hh = box.h/2, s = Math.min(hw/(Math.abs(dx)||.001), hh/(Math.abs(dy)||.001));
  return { x: box.cx+dx*s, y: box.cy+dy*s };
}

/* ══════════════════════════════════════════════════════════════
   BPMNFlow — single-flow canvas (toolbar + SVG)
   ══════════════════════════════════════════════════════════════ */
export function BPMNFlow({ flow, setFlow, accent = ACCENT }) {
  const [editing,  setEditing]  = useState(null);
  const [editVal,  setEditVal]  = useState('');
  const [drag,     setDrag]     = useState(null);
  const [connect,  setConnect]  = useState(null);
  const [selected, setSelected] = useState(null); // { kind: 'node'|'edge', id }
  const svgRef  = useRef(null);
  const wrapRef = useRef(null);
  const [wrapSize, setWrapSize] = useState({ w: 900, h: 480 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setWrapSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const nodes = flow.nodes || [];
  const edges = flow.edges || [];
  const W = Math.max(...nodes.map(n => n.x + NODE_W + 100), wrapSize.w);
  const H = Math.max(...nodes.map(n => n.y + NODE_H + 120), wrapSize.h);

  /* ── Edit ── */
  function commitEdit() {
    if (!editing) return;
    setFlow({ ...flow, nodes: nodes.map(n => n.id === editing ? { ...n, label: editVal } : n) });
    setEditing(null);
  }

  /* ── Drag ── */
  function onNodeDown(e, n) {
    if (editing || e.target.dataset.port) return;
    e.preventDefault();
    const r = svgRef.current.getBoundingClientRect();
    setDrag({ id: n.id, offX: e.clientX - r.left - n.x, offY: e.clientY - r.top - n.y });
  }

  function onMove(e) {
    const r = svgRef.current.getBoundingClientRect();
    if (drag) {
      const x = Math.max(0, Math.round((e.clientX - r.left - drag.offX) / 5) * 5);
      const y = Math.max(0, Math.round((e.clientY - r.top  - drag.offY) / 5) * 5);
      setFlow({ ...flow, nodes: nodes.map(n => n.id === drag.id ? { ...n, x, y } : n) });
    } else if (connect) {
      setConnect({ ...connect, mx: e.clientX - r.left, my: e.clientY - r.top });
    }
  }

  function onUp(e) {
    if (connect) {
      const r = svgRef.current.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const target = nodes.find(n => { const b = nodeBox(n); return Math.abs(px-b.cx)<b.w/2+8 && Math.abs(py-b.cy)<b.h/2+8; });
      if (target && target.id !== connect.from && !edges.find(ed => ed.from===connect.from && ed.to===target.id)) {
        setFlow({ ...flow, edges: [...edges, { id: mkId(), from: connect.from, to: target.id, label: '' }] });
      }
      setConnect(null);
    }
    setDrag(null);
  }

  /* ── Node / Edge CRUD ── */
  function addNode(type) {
    const x = nodes.length ? Math.max(...nodes.map(n => n.x)) + 190 : 80;
    const lbl = { start: 'Bắt đầu', task: 'Bước mới', gateway: 'Điều kiện?', end: 'Kết thúc' }[type];
    setFlow({ ...flow, nodes: [...nodes, { id: mkId(), type, label: lbl, x, y: 130 }] });
  }
  function delNode(id) {
    setFlow({ ...flow, nodes: nodes.filter(n=>n.id!==id), edges: edges.filter(e=>e.from!==id&&e.to!==id) });
    if (selected?.id === id) setSelected(null);
  }
  function delEdge(id) {
    setFlow({ ...flow, edges: edges.filter(e=>e.id!==id) });
    if (selected?.id === id) setSelected(null);
  }
  function editEdge(id) {
    const v = prompt('Nhãn cạnh (Có / Không / ...):', edges.find(e=>e.id===id)?.label||'');
    if (v === null) return;
    setFlow({ ...flow, edges: edges.map(e=>e.id===id?{...e,label:v}:e) });
  }

  /* ── Keyboard delete ── */
  function onKeyDown(e) {
    if (editing) return;
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    if (!selected) return;
    e.preventDefault();
    if (selected.kind === 'node') delNode(selected.id);
    if (selected.kind === 'edge') delEdge(selected.id);
  }

  return (
    <div className="bpmn-wrap" tabIndex={0} onKeyDown={onKeyDown} style={{ outline: 'none' }}>

      {/* ── Toolbar ── */}
      <div className="bpmn-toolbar">
        <span className="bpmn-tb-lbl">THÊM:</span>

        <button className="bpmn-add" onClick={() => addNode('start')}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="6" fill="none" stroke={ACCENT} strokeWidth="1.5"/>
          </svg>
          Start
        </button>

        <button className="bpmn-add" onClick={() => addNode('task')}>
          <svg width="16" height="12" viewBox="0 0 16 12">
            <rect x="0.75" y="0.75" width="14.5" height="10.5" rx="2.5" fill="none" stroke={ACCENT} strokeWidth="1.5"/>
          </svg>
          Task
        </button>

        <button className="bpmn-add" onClick={() => addNode('gateway')}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="2" y="2" width="10" height="10" transform="rotate(45 7 7)" rx="1.5" fill="none" stroke={AMBER} strokeWidth="1.5"/>
          </svg>
          Gateway
        </button>

        <button className="bpmn-add" onClick={() => addNode('end')}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="6" fill="none" stroke="#111827" strokeWidth="3"/>
          </svg>
          End
        </button>

        <span className="bpmn-help">Kéo để di chuyển · Click để chọn · Delete để xóa · Kéo port → nối</span>
      </div>

      {/* ── SVG Canvas ── */}
      <div ref={wrapRef} className="bpmn-canvas-wrap"
           onClick={e => e.currentTarget.closest('.bpmn-wrap')?.focus()}>
        <svg ref={svgRef} className="bpmn-svg"
             width={W} height={H}
             onMouseMove={onMove} onMouseUp={onUp}
             onMouseLeave={() => { setDrag(null); setConnect(null); }}>
          <defs>
            <marker id="arr"  viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill="#9CA3AF"/>
            </marker>
            <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r=".9" fill="#D1D5DB"/>
            </pattern>
            <filter id="nshadow" x="-10%" y="-15%" width="120%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity=".07"/>
            </filter>
          </defs>

          {/* Background */}
          <rect width={W} height={H} fill="#F9FAFB"/>
          <rect width={W} height={H} fill="url(#dot-grid)"/>

          {/* ── Edges ── */}
          {edges.map(e => {
            const fn = nodes.find(n=>n.id===e.from), tn = nodes.find(n=>n.id===e.to);
            if (!fn||!tn) return null;
            const fb = nodeBox(fn), tb = nodeBox(tn);
            const fp = edgePt(fb,tb.cx,tb.cy), tp = edgePt(tb,fb.cx,fb.cy);
            const cx = Math.max(30, Math.abs(tp.x-fp.x)*0.45);
            const d  = `M${fp.x},${fp.y} C${fp.x+cx},${fp.y} ${tp.x-cx},${tp.y} ${tp.x},${tp.y}`;
            const mx = (fp.x+tp.x)/2, my = (fp.y+tp.y)/2 - 6;
            const neg  = e.label?.toLowerCase().includes('không') || e.label?.toLowerCase().includes('no');
            const isSel = selected?.kind === 'edge' && selected.id === e.id;
            const edgeColor = isSel ? accent : neg ? '#9CA3AF' : '#6B7280';
            return (
              <g key={e.id} className="bpmn-eg"
                 onClick={ev => { ev.stopPropagation(); setSelected({ kind: 'edge', id: e.id }); }}>
                <path d={d} fill="none" stroke="transparent" strokeWidth="12" style={{cursor:'pointer'}}/>
                <path d={d} fill="none" stroke={edgeColor} strokeWidth={isSel ? 2.5 : 1.5}
                      strokeDasharray={neg&&!isSel?'5 4':'none'} markerEnd="url(#arr)"/>
                {isSel && <path d={d} fill="none" stroke={accent} strokeWidth="6" opacity=".15" pointerEvents="none"/>}
                {e.label && (
                  <g style={{cursor:'pointer'}} onClick={ev=>{ev.stopPropagation();editEdge(e.id);}}>
                    <rect x={mx-e.label.length*3.8-8} y={my-9} width={e.label.length*7.6+16} height={18}
                          rx="9" fill="white" stroke={isSel?accent:'#E5E7EB'} strokeWidth=".75"/>
                    <text x={mx} y={my+4.5} textAnchor="middle" fontSize="10.5" fill="#6B7280" fontWeight="500">{e.label}</text>
                  </g>
                )}
                <g className="bpmn-edel" style={{cursor:'pointer'}} onClick={ev=>{ev.stopPropagation();delEdge(e.id);}}>
                  <circle cx={mx+(e.label?e.label.length*3.8+16:10)} cy={my} r="7"
                          fill="white" stroke="#E5E7EB" strokeWidth=".75"/>
                  <text x={mx+(e.label?e.label.length*3.8+16:10)} y={my+4.5}
                        textAnchor="middle" fontSize="12" fill="#EF4444" fontWeight="600">×</text>
                </g>
              </g>
            );
          })}

          {/* Live connect line */}
          {connect?.mx && (() => {
            const fn = nodes.find(n=>n.id===connect.from); if(!fn) return null;
            const fb = nodeBox(fn), fp = edgePt(fb, connect.mx, connect.my);
            return <line x1={fp.x} y1={fp.y} x2={connect.mx} y2={connect.my}
                         stroke={accent} strokeWidth="1.5" strokeDasharray="5 4" pointerEvents="none"/>;
          })()}

          {/* Deselect on canvas click */}
          <rect width={W} height={H} fill="transparent"
                onClick={() => setSelected(null)} style={{cursor:'default'}}/>

          {/* ── Nodes ── */}
          {nodes.map(n => {
            const isTask=n.type==='task', isGate=n.type==='gateway';
            const isStart=n.type==='start', isEnd=n.type==='end';
            const box = nodeBox(n);
            const portX = n.x + (isTask?NODE_W:isGate?GATE:EVENT);
            const portY = box.cy;
            const isSel = selected?.kind === 'node' && selected.id === n.id;
            return (
              <g key={n.id} className={'bpmn-node'+(drag?.id===n.id?' bpmn-drag':'')}
                 onMouseDown={e=>onNodeDown(e,n)}
                 onClick={e=>{ e.stopPropagation(); setSelected({ kind:'node', id:n.id }); }}
                 onDoubleClick={()=>{setEditing(n.id);setEditVal(n.label);}}>

                {/* Selection ring */}
                {isSel && (
                  isTask
                    ? <rect x={n.x-4} y={n.y-4} width={NODE_W+8} height={NODE_H+8} rx="11"
                            fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 3" opacity=".7"/>
                    : isGate
                    ? <rect x={n.x+GATE/2-GATE/2-6} y={n.y+GATE/2-GATE/2-6}
                            width={GATE+12} height={GATE+12}
                            transform={`rotate(45,${n.x+GATE/2},${n.y+GATE/2})`} rx="7"
                            fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 3" opacity=".7"/>
                    : <circle cx={box.cx} cy={box.cy} r={EVENT/2+6}
                              fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 3" opacity=".7"/>
                )}

                {/* Task */}
                {isTask && (<>
                  <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx="8"
                        fill="white" stroke={isSel?accent:'#5BAA50'} strokeWidth={isSel?2.5:1.5} filter="url(#nshadow)"/>
                  <rect x={n.x} y={n.y} width="5" height={NODE_H} rx="3" fill={accent}/>
                  {n.label.split('\n').map((ln,i,a)=>(
                    <text key={i} x={n.x+NODE_W/2+2} y={n.y+NODE_H/2-(a.length-1)*7+i*14+4}
                          textAnchor="middle" fontSize="11.5" fill="#111827" fontWeight="600">{ln}</text>
                  ))}
                  {n.sub && <text x={n.x+NODE_W/2+2} y={n.y+NODE_H-9}
                                  textAnchor="middle" fontSize="9.5" fill="#9CA3AF">{n.sub}</text>}
                </>)}

                {/* Gateway */}
                {isGate && (<>
                  <g transform={`translate(${n.x+GATE/2},${n.y+GATE/2})`}>
                    <rect x={-GATE/2} y={-GATE/2} width={GATE} height={GATE}
                          transform="rotate(45)" rx="5"
                          fill={AMBER_BG} stroke={AMBER} strokeWidth="1.5" filter="url(#nshadow)"/>
                    <text textAnchor="middle" y="5.5" fontSize="17" fill={AMBER} fontWeight="700">?</text>
                  </g>
                  <text x={n.x+GATE/2} y={n.y+GATE+17} textAnchor="middle"
                        fontSize="10.5" fill="#6B7280" fontWeight="500">{n.label}</text>
                </>)}

                {/* Start */}
                {isStart && (<>
                  <circle cx={box.cx} cy={box.cy} r={EVENT/2}
                          fill="white" stroke={accent} strokeWidth="1.75" filter="url(#nshadow)"/>
                  <text x={box.cx} y={n.y+EVENT+17} textAnchor="middle"
                        fontSize="10.5" fill="#6B7280" fontWeight="500">{n.label}</text>
                </>)}

                {/* End (bulls-eye) */}
                {isEnd && (<>
                  <circle cx={box.cx} cy={box.cy} r={EVENT/2}
                          fill="white" stroke="#111827" strokeWidth="3.5" filter="url(#nshadow)"/>
                  <circle cx={box.cx} cy={box.cy} r={EVENT/2-6} fill="#111827"/>
                  <text x={box.cx} y={n.y+EVENT+17} textAnchor="middle"
                        fontSize="10.5" fill="#6B7280" fontWeight="500">{n.label}</text>
                </>)}

                {/* Right port */}
                <circle cx={portX} cy={portY} r="5"
                        fill={accent} stroke="white" strokeWidth="1.5"
                        style={{cursor:'crosshair'}} data-port="right"
                        onMouseDown={e=>{
                          e.stopPropagation();
                          const r=svgRef.current.getBoundingClientRect();
                          setConnect({from:n.id,mx:e.clientX-r.left,my:e.clientY-r.top});
                        }}/>

                {/* Delete × */}
                <g className="bpmn-ndel" style={{cursor:'pointer'}}
                   onClick={e=>{e.stopPropagation();delNode(n.id);}}>
                  <circle cx={box.cx+box.w/2-1} cy={n.y-1} r="8"
                          fill="white" stroke="#E5E7EB" strokeWidth=".75"/>
                  <text x={box.cx+box.w/2-1} y={n.y+3.5}
                        textAnchor="middle" fontSize="12" fill="#EF4444" fontWeight="700">×</text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Inline rename */}
        {editing && (() => {
          const n = nodes.find(x=>x.id===editing); if(!n) return null;
          const isTask=n.type==='task', isGate=n.type==='gateway';
          return (
            <textarea autoFocus className="bpmn-inline-edit" value={editVal}
              onChange={e=>setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e=>{
                if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();commitEdit();}
                if(e.key==='Escape'){setEditing(null);}
              }}
              style={{
                left:  n.x+(isTask?8:isGate?-16:n.x+EVENT/2-55-n.x),
                top:   n.y+(isTask?8:isGate?GATE+6:EVENT+6),
                width: isTask?NODE_W-16:isGate?112:110,
              }}/>
          );
        })()}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BpmnEditor — multi-flow shell (tabs + canvas + footer)
   ══════════════════════════════════════════════════════════════ */
export default function BpmnEditor({ flows = [], onFlowsChange, onSave, saveState }) {
  const [activeIdx, setActiveIdx] = useState(0);

  function addFlow() {
    const name = prompt('Tên luồng mới:', `Luồng ${flows.length + 1}`);
    if (!name) return;
    const nf = {
      id: mkId(), name,
      nodes: [
        { id: mkId(), type: 'start', label: 'Bắt đầu', x: 60,  y: 140 },
        { id: mkId(), type: 'end',   label: 'Kết thúc', x: 560, y: 140 },
      ],
      edges: []
    };
    onFlowsChange([...flows, nf]);
    setActiveIdx(flows.length);
  }

  function renameFlow(i) {
    const v = prompt('Đổi tên luồng:', flows[i].name);
    if (!v) return;
    onFlowsChange(flows.map((f,j) => j===i ? {...f, name:v} : f));
  }

  function dupFlow(i) {
    const src = flows[i];
    const copy = { ...src, id: mkId(), name: src.name+' (copy)',
                   nodes: src.nodes.map(n=>({...n,id:mkId()})), edges: [] };
    onFlowsChange([...flows, copy]);
    setActiveIdx(flows.length);
  }

  function delFlow(i) {
    if (!confirm(`Xóa luồng "${flows[i].name}"?`)) return;
    const next = flows.filter((_,j) => j!==i);
    onFlowsChange(next);
    setActiveIdx(Math.min(activeIdx, Math.max(0, next.length-1)));
  }

  function updateFlow(updated) {
    onFlowsChange(flows.map((f,i) => i===activeIdx ? updated : f));
  }

  const active = flows[activeIdx] || null;

  return (
    <div className="bpmn-editor">

      {/* ── Tabs ── */}
      <div className="bpmn-tabs">
        <div className="bpmn-tabs-scroll">
          {flows.map((f, i) => (
            <div key={f.id}
                 className={'bpmn-tab'+(i===activeIdx?' active':'')}
                 onClick={()=>setActiveIdx(i)}>
              <span className="bpmn-tab-num">{i+1}</span>
              <span className="bpmn-tab-name">{f.name}</span>
              <span className="bpmn-tab-steps">{(f.nodes||[]).length} bước</span>
              <div className="bpmn-tab-acts" onClick={e=>e.stopPropagation()}>
                <button title="Đổi tên" onClick={()=>renameFlow(i)}>
                  <i className="ti ti-pencil"></i>
                </button>
                <button title="Nhân đôi" onClick={()=>dupFlow(i)}>
                  <i className="ti ti-copy"></i>
                </button>
                <button title="Xóa" className="bpmn-act-del" onClick={()=>delFlow(i)}>
                  <i className="ti ti-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="bpmn-add-flow-btn" onClick={addFlow}>
          <i className="ti ti-plus"></i> Thêm luồng
        </button>
      </div>

      {/* ── Body ── */}
      <div className="bpmn-body">
        {active ? (
          <BPMNFlow flow={active} setFlow={updateFlow} accent={ACCENT}/>
        ) : (
          <div className="bpmn-empty">
            <i className="ti ti-git-branch"></i>
            <p>Chưa có luồng nào. Nhấn "+ Thêm luồng" để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="bpmn-footer">
        {saveState && (
          <span className={'save-state save-'+saveState.kind}>
            {saveState.kind==='saved'  && <><i className="ti ti-check"></i> Đã lưu lúc {saveState.at}</>}
            {saveState.kind==='dirty'  && <><i className="ti ti-circle-dot"></i> Có thay đổi chưa lưu</>}
            {saveState.kind==='saving' && <><i className="ti ti-loader-2 spin"></i> Đang lưu...</>}
          </span>
        )}
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn-ghost">
            <i className="ti ti-download"></i> Xuất
          </button>
          <button className="bpmn-save-btn" onClick={onSave}>
            <i className="ti ti-device-floppy"></i> Lưu thay đổi
            <kbd className="btn-kbd">⌘S</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
