import React, { useState, useRef, useEffect } from 'react'; //

/* BPMN-style flow diagram.
   Editable: click a node to rename. Add task / gateway / event from toolbar.
   Edges: drag from a node's right port to another node to connect.
   Layout: nodes have explicit x/y from the data; user can drag them.
*/

const NODE_W = 130;
const NODE_H = 56;
const GATE   = 60;   // gateway diamond size
const EVENT  = 36;   // start/end circle diameter

// shape geometry helpers (center + half-extents)
function nodeBox(n) {
  if (n.type === "task") {
    return { cx: n.x + NODE_W / 2, cy: n.y + NODE_H / 2, w: NODE_W, h: NODE_H, shape: "rect" };
  }
  if (n.type === "gateway") {
    return { cx: n.x + GATE / 2, cy: n.y + GATE / 2, w: GATE, h: GATE, shape: "diamond" };
  }
  return { cx: n.x + EVENT / 2, cy: n.y + EVENT / 2, w: EVENT, h: EVENT, shape: "circle" };
}

function edgePoint(box, tx, ty) {
  const dx = tx - box.cx, dy = ty - box.cy;
  if (box.shape === "circle") {
    const r = box.w / 2;
    const m = Math.hypot(dx, dy) || 1;
    return { x: box.cx + dx / m * r, y: box.cy + dy / m * r };
  }
  if (box.shape === "diamond") {
    const r = box.w / 2;
    const m = Math.abs(dx) + Math.abs(dy) || 1;
    return { x: box.cx + dx / m * r, y: box.cy + dy / m * r };
  }
  const hw = box.w / 2, hh = box.h / 2;
  const adx = Math.abs(dx) || 0.001, ady = Math.abs(dy) || 0.001;
  const sx = hw / adx, sy = hh / ady;
  const s = Math.min(sx, sy);
  return { x: box.cx + dx * s, y: box.cy + dy * s };
}

// Xuất component chính để Editor.jsx hoặc App.jsx có thể sử dụng
export function BPMNFlow({ flow, setFlow, accent = "#5BAA50" }) {
  const [editing, setEditing] = useState(null); 
  const [editVal, setEditVal] = useState("");
  const [drag, setDrag] = useState(null);
  const [connect, setConnect] = useState(null); 
  const svgRef = useRef(null);

  const nodes = flow.nodes || [];
  const edges = flow.edges || [];

  const maxX = Math.max(...nodes.map(n => n.x + NODE_W), 800);
  const maxY = Math.max(...nodes.map(n => n.y + NODE_H), 300);
  const W = maxX + 80;
  const H = maxY + 80;

  function startEdit(n) {
    setEditing(n.id);
    setEditVal(n.label);
  }

  function commitEdit() {
    if (!editing) return;
    setFlow({
      ...flow,
      nodes: nodes.map(n => n.id === editing ? { ...n, label: editVal } : n)
    });
    setEditing(null);
  }

  function onMouseDownNode(e, n) {
    if (editing) return;
    if (e.target.dataset.port === "right") return;
    const rect = svgRef.current.getBoundingClientRect();
    const offX = e.clientX - rect.left - n.x;
    const offY = e.clientY - rect.top  - n.y;
    setDrag({ id: n.id, offX, offY });
  }

  function onMouseMove(e) {
    const rect = svgRef.current.getBoundingClientRect();
    if (drag) {
      const x = Math.max(0, e.clientX - rect.left - drag.offX);
      const y = Math.max(0, e.clientY - rect.top  - drag.offY);
      setFlow({
        ...flow,
        nodes: nodes.map(n => n.id === drag.id ? { ...n, x: Math.round(x / 5) * 5, y: Math.round(y / 5) * 5 } : n)
      });
    } else if (connect) {
      setConnect({ ...connect, x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  function onMouseUp(e) {
    if (connect) {
      const rect = svgRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const target = nodes.find(n => {
        const b = nodeBox(n);
        return Math.abs(px - b.cx) < b.w / 2 + 6 && Math.abs(py - b.cy) < b.h / 2 + 6;
      });
      if (target && target.id !== connect.from) {
        const exists = edges.find(e => e.from === connect.from && e.to === target.id);
        if (!exists) {
          setFlow({ ...flow, edges: [...edges, { from: connect.from, to: target.id }] });
        }
      }
      setConnect(null);
    }
    setDrag(null);
  }

  function addNode(type) {
    const id = "n" + Math.random().toString(36).slice(2, 6);
    const right = Math.max(...nodes.map(n => n.x), 0) + 180;
    const n = {
      id, type,
      label: type === "task" ? "Bước mới" : type === "gateway" ? "Điều\nkiện?" : type === "start" ? "Bắt đầu" : "Kết thúc",
      x: right, y: 100
    };
    setFlow({ ...flow, nodes: [...nodes, n] });
  }

  function deleteNode(id) {
    setFlow({
      ...flow,
      nodes: nodes.filter(n => n.id !== id),
      edges: edges.filter(e => e.from !== id && e.to !== id)
    });
  }

  function deleteEdge(idx) {
    setFlow({ ...flow, edges: edges.filter((_, i) => i !== idx) });
  }

  function editEdgeLabel(idx) {
    const cur = edges[idx].label || "";
    const v = prompt("Nhãn cạnh (Có / Không / điều kiện…):", cur);
    if (v === null) return;
    setFlow({ ...flow, edges: edges.map((e, i) => i === idx ? { ...e, label: v } : e) });
  }

  return (
    <div className="bpmn-wrap">
      <div className="bpmn-toolbar">
        <span className="bpmn-tb-label">Thêm:</span>
        <button className="bpmn-add" onClick={() => addNode("start")}><span className="bpmn-add-ico bpmn-add-start"></span>Start</button>
        <button className="bpmn-add" onClick={() => addNode("task")}><span className="bpmn-add-ico bpmn-add-task"></span>Task</button>
        <button className="bpmn-add" onClick={() => addNode("gateway")}><span className="bpmn-add-ico bpmn-add-gw"></span>Gateway</button>
        <button className="bpmn-add" onClick={() => addNode("end")}><span className="bpmn-add-ico bpmn-add-end"></span>End</button>
        <span className="bpmn-help">Kéo để di chuyển · Click để sửa · Kéo port phải → nối</span>
      </div>
      
      <div className="bpmn-canvas-wrap">
        <svg
          ref={svgRef}
          className="bpmn-canvas"
          width={W}
          height={H}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { setDrag(null); setConnect(null); }}
        >
          <defs>
            <marker id="bpmn-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill="var(--text2)" />
            </marker>
            <pattern id="bpmn-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.7" fill="var(--border2)" />
            </pattern>
          </defs>

          <rect width={W} height={H} fill="url(#bpmn-grid)" />

          {edges.map((e, i) => {
            const from = nodes.find(n => n.id === e.from);
            const to   = nodes.find(n => n.id === e.to);
            if (!from || !to) return null;
            const fb = nodeBox(from), tb = nodeBox(to);
            const fp = edgePoint(fb, tb.cx, tb.cy);
            const tp = edgePoint(tb, fb.cx, fb.cy);
            const dx = tp.x - fp.x;
            const c1x = fp.x + Math.max(20, Math.abs(dx) * 0.4);
            const c2x = tp.x - Math.max(20, Math.abs(dx) * 0.4);
            const d = `M${fp.x},${fp.y} C${c1x},${fp.y} ${c2x},${tp.y} ${tp.x},${tp.y}`;
            const mx = (fp.x + tp.x) / 2;
            const my = (fp.y + tp.y) / 2;
            
            return (
              <g key={i} className="bpmn-edge" onClick={() => editEdgeLabel(i)}>
                <path d={d} className="bpmn-edge-hit" />
                <path d={d} fill="none" stroke="var(--text2)" strokeWidth="1.5" markerEnd="url(#bpmn-arrow)" />
                {e.label && (
                  <g>
                    <rect x={mx - (e.label.length * 3.5 + 8)} y={my - 9} width={e.label.length * 7 + 16} height={18} rx="9" fill="var(--bg)" stroke="var(--border2)" strokeWidth="0.5" />
                    <text x={mx} y={my + 3.5} textAnchor="middle" fontSize="10.5" fill="var(--text2)" fontWeight="500">{e.label}</text>
                  </g>
                )}
                <g className="bpmn-edge-del" transform={`translate(${mx + (e.label ? e.label.length * 3.5 + 16 : 6)}, ${my - 9})`} onClick={(ev) => { ev.stopPropagation(); deleteEdge(i); }}>
                  <circle r="6" cx="0" cy="9" fill="var(--bg)" stroke="var(--border2)" strokeWidth="0.5" />
                  <text textAnchor="middle" y="12" fontSize="10" fill="var(--danger)">×</text>
                </g>
              </g>
            );
          })}

          {connect && (() => {
            const from = nodes.find(n => n.id === connect.from);
            if (!from) return null;
            const fb = nodeBox(from);
            const fp = edgePoint(fb, connect.x, connect.y);
            return <line x1={fp.x} y1={fp.y} x2={connect.x} y2={connect.y} stroke={accent} strokeWidth="1.5" strokeDasharray="4 4" pointerEvents="none" />;
          })()}

          {nodes.map(n => {
            const isStart = n.type === "start";
            const isEnd   = n.type === "end";
            const isTask  = n.type === "task";
            const isGate  = n.type === "gateway";

            return (
              <g key={n.id} className={"bpmn-node" + (drag?.id === n.id ? " dragging" : "")} onMouseDown={(e) => onMouseDownNode(e, n)} onDoubleClick={() => startEdit(n)}>
                {isTask && (
                  <>
                    <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx="6" fill="var(--bg)" stroke={accent} strokeWidth="1" />
                    <rect x={n.x} y={n.y} width="4" height={NODE_H} fill={accent} />
                  </>
                )}
                {isGate && (
                  <g transform={`translate(${n.x + GATE/2}, ${n.y + GATE/2})`}>
                    <rect x={-GATE/2} y={-GATE/2} width={GATE} height={GATE} transform="rotate(45)" fill="var(--bg)" stroke="var(--warn-bd)" strokeWidth="1" />
                    <text textAnchor="middle" y="3" fontSize="14" fill="var(--warn-bd)" fontWeight="600">?</text>
                  </g>
                )}
                {(isStart || isEnd) && (
                  <circle cx={n.x + EVENT/2} cy={n.y + EVENT/2} r={EVENT/2} fill="var(--bg)" stroke={isEnd ? "var(--text)" : accent} strokeWidth={isEnd ? 2.5 : 1.5} />
                )}
                {isTask && n.label.split("\n").map((ln, idx) => (
                  <text key={idx} x={n.x + NODE_W/2} y={n.y + NODE_H/2 + (idx - (n.label.split("\n").length - 1) / 2) * 13 + 4} textAnchor="middle" fontSize="11" fill="var(--text)" fontWeight={idx === 0 ? "600" : "400"}>{ln}</text>
                ))}
                {isGate && n.label.split("\n").map((ln, idx) => (
                  <text key={idx} x={n.x + GATE/2} y={n.y + GATE + 13 + idx*12} textAnchor="middle" fontSize="10.5" fill="var(--text2)" fontWeight="500">{ln}</text>
                ))}
                {(isStart || isEnd) && (
                  <text x={n.x + EVENT/2} y={n.y + EVENT + 13} textAnchor="middle" fontSize="10.5" fill="var(--text2)" fontWeight="500">{n.label}</text>
                )}
                <circle cx={n.x + (isTask ? NODE_W : isGate ? GATE : EVENT)} cy={n.y + (isTask ? NODE_H/2 : isGate ? GATE/2 : EVENT/2)} r="4" fill={accent} stroke="var(--bg)" strokeWidth="1" className="bpmn-port" data-port="right" onMouseDown={(e) => { e.stopPropagation(); const rect = svgRef.current.getBoundingClientRect(); setConnect({ from: n.id, x: e.clientX - rect.left, y: e.clientY - rect.top }); }} />
                <g className="bpmn-node-del" transform={`translate(${n.x + (isTask ? NODE_W : isGate ? GATE : EVENT) - 4}, ${n.y - 4})`} onClick={(e) => { e.stopPropagation(); deleteNode(n.id); }}>
                  <circle r="7" fill="var(--bg)" stroke="var(--border2)" strokeWidth="0.5" />
                  <text textAnchor="middle" y="3" fontSize="11" fill="var(--danger)">×</text>
                </g>
              </g>
            );
          })}
        </svg>

        {editing && (() => {
          const n = nodes.find(x => x.id === editing);
          if (!n) return null;
          const isTask = n.type === "task";
          const isGate = n.type === "gateway";
          const w = isTask ? NODE_W : isGate ? 100 : 90;
          return (
            <textarea
              autoFocus
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              className="bpmn-edit"
              style={{ left: n.x + (isTask ? 0 : -10), top: n.y + (isTask ? 6 : GATE + 4), width: w }}
            />
          );
        })()}
      </div>
    </div>
  );
}

// Xóa window.BPMNFlow = BPMNFlow;