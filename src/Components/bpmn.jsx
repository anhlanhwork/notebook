import React, { useState, useRef, useEffect } from 'react';
import { showConfirm, showPrompt } from './dialog.jsx';

/* ── Colors ─────────────────────────────────────────────────────── */
const ACCENT    = '#5BAA50';
const ACCENT_BG = '#EAF4E8';
const AMBER     = '#F59E0B';
const AMBER_BG  = '#FFFBEB';
const BLUE      = '#3B82F6';
const BLUE_BG   = '#EFF6FF';
const RED       = '#EF4444';
const DARK      = '#111827';

/* ── Node geometry ───────────────────────────────────────────────── */
const NODE_W = 140, NODE_H = 56, GATE = 58, EVENT = 38, EVT_R = 19;

/* ── Type classification ─────────────────────────────────────────── */
const EVT_SET  = new Set([
  'start', 'start_timer', 'start_message', 'start_signal', 'start_error',
  'intermediate', 'intermediate_timer', 'intermediate_message', 'intermediate_signal',
  'intermediate_throw', 'intermediate_throw_message', 'intermediate_throw_signal',
  'end', 'end_message', 'end_error', 'end_signal', 'end_terminate',
]);
const GATE_SET = new Set(['gateway', 'gate_parallel', 'gate_inclusive', 'gate_event', 'gate_complex']);

const isEvt  = t => EVT_SET.has(t);
const isGate = t => GATE_SET.has(t);

/* ── Node defaults ────────────────────────────────────────────────── */
const NODE_DEFAULTS = {
  start:                      'Bắt đầu',
  start_timer:                'Hẹn giờ',
  start_message:              'Nhận tin',
  start_signal:               'Tín hiệu',
  start_error:                'Lỗi',
  intermediate:               'Bước chờ',
  intermediate_timer:         'Hẹn giờ',
  intermediate_message:       'Nhận tin',
  intermediate_signal:        'Tín hiệu',
  intermediate_throw:         'Ném sự kiện',
  intermediate_throw_message: 'Gửi tin',
  intermediate_throw_signal:  'Phát tín hiệu',
  end:                        'Kết thúc',
  end_message:                'Gửi tin',
  end_error:                  'Lỗi',
  end_signal:                 'Phát tín hiệu',
  end_terminate:              'Kết thúc!',
  task:                       'Tác vụ',
  user_task:                  'User Task',
  service_task:               'Service',
  script_task:                'Script',
  send_task:                  'Gửi',
  receive_task:               'Nhận',
  subprocess:                 'Quy trình con',
  annotation:                 'Ghi chú',
  gateway:                    'Điều kiện?',
  gate_parallel:              'Song song',
  gate_inclusive:             'Bất kỳ?',
  gate_event:                 'Sự kiện?',
  gate_complex:               'Phức tạp',
};

/* ── Palette definition ───────────────────────────────────────────── */
const PALETTE = [
  {
    key: 'events', label: 'Sự kiện',
    items: [
      { type: 'start',                      label: 'Start',    sub: 'None'          },
      { type: 'start_timer',                label: 'Start',    sub: 'Timer'         },
      { type: 'start_message',              label: 'Start',    sub: 'Message'       },
      { type: 'start_signal',               label: 'Start',    sub: 'Signal'        },
      { type: 'start_error',                label: 'Start',    sub: 'Error'         },
      { type: 'intermediate',               label: 'Catch',    sub: 'None'          },
      { type: 'intermediate_timer',         label: 'Catch',    sub: 'Timer'         },
      { type: 'intermediate_message',       label: 'Catch',    sub: 'Message'       },
      { type: 'intermediate_signal',        label: 'Catch',    sub: 'Signal'        },
      { type: 'intermediate_throw',         label: 'Throw',    sub: 'None'          },
      { type: 'intermediate_throw_message', label: 'Throw',    sub: 'Message'       },
      { type: 'intermediate_throw_signal',  label: 'Throw',    sub: 'Signal'        },
      { type: 'end',                        label: 'End',      sub: 'None'          },
      { type: 'end_message',                label: 'End',      sub: 'Message'       },
      { type: 'end_error',                  label: 'End',      sub: 'Error'         },
      { type: 'end_signal',                 label: 'End',      sub: 'Signal'        },
      { type: 'end_terminate',              label: 'End',      sub: 'Terminate'     },
    ],
  },
  {
    key: 'tasks', label: 'Tác vụ',
    items: [
      { type: 'task',         label: 'Abstract',   sub: 'Task'         },
      { type: 'user_task',    label: 'User',       sub: 'Task'         },
      { type: 'service_task', label: 'Service',    sub: 'Task'         },
      { type: 'script_task',  label: 'Script',     sub: 'Task'         },
      { type: 'send_task',    label: 'Send',       sub: 'Task'         },
      { type: 'receive_task', label: 'Receive',    sub: 'Task'         },
      { type: 'subprocess',   label: 'Sub',        sub: 'Process'      },
      { type: 'annotation',   label: 'Text',       sub: 'Annotation'   },
    ],
  },
  {
    key: 'gateways', label: 'Cổng (GW)',
    items: [
      { type: 'gateway',        label: 'XOR',    sub: 'Exclusive'    },
      { type: 'gate_parallel',  label: 'AND',    sub: 'Parallel'     },
      { type: 'gate_inclusive', label: 'OR',     sub: 'Inclusive'    },
      { type: 'gate_event',     label: 'Event',  sub: 'Event-based'  },
      { type: 'gate_complex',   label: 'Cmplx',  sub: 'Complex'      },
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function mkId() { return 'n' + Math.random().toString(36).slice(2, 7); }

function nodeBox(n) {
  if (isGate(n.type))       return { cx: n.x + GATE/2,   cy: n.y + GATE/2,   w: GATE,   h: GATE,   s: 'diamond' };
  if (isEvt(n.type))        return { cx: n.x + EVT_R,    cy: n.y + EVT_R,    w: EVENT,  h: EVENT,  s: 'circle'  };
  if (n.type === 'annotation') return { cx: n.x + NODE_W/2, cy: n.y + NODE_H/2, w: NODE_W, h: NODE_H, s: 'rect' };
  return                          { cx: n.x + NODE_W/2, cy: n.y + NODE_H/2, w: NODE_W, h: NODE_H, s: 'rect'    };
}

function edgePt(box, tx, ty) {
  const dx = tx - box.cx, dy = ty - box.cy;
  if (box.s === 'circle')  { const r = box.w/2, m = Math.hypot(dx,dy)||1; return { x: box.cx+dx/m*r, y: box.cy+dy/m*r }; }
  if (box.s === 'diamond') { const r = box.w/2, m = Math.abs(dx)+Math.abs(dy)||1; return { x: box.cx+dx/m*r, y: box.cy+dy/m*r }; }
  const hw = box.w/2, hh = box.h/2, s = Math.min(hw/(Math.abs(dx)||.001), hh/(Math.abs(dy)||.001));
  return { x: box.cx+dx*s, y: box.cy+dy*s };
}

function portPos(n) {
  if (isEvt(n.type))   return { x: n.x + EVENT,  y: n.y + EVT_R };
  if (isGate(n.type))  return { x: n.x + GATE,   y: n.y + GATE/2 };
  return                      { x: n.x + NODE_W, y: n.y + NODE_H/2 };
}

/* ── Event marker icon helpers ────────────────────────────────────── */
function timerIcon(cx, cy, r, color) {
  const ri = r - 7;
  return (
    <g>
      <circle cx={cx} cy={cy} r={ri} fill="none" stroke={color} strokeWidth="1"/>
      <line x1={cx} y1={cy} x2={cx} y2={cy - ri + 2} stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1={cx} y1={cy} x2={cx + ri - 4} y2={cy + 2} stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="1.5" fill={color}/>
    </g>
  );
}

function messageIcon(cx, cy, r, filled, color) {
  const w = r - 6, h = r - 9;
  return (
    <g>
      <rect x={cx - w} y={cy - h} width={w * 2} height={h * 2} rx="1"
            fill={filled ? color : 'none'} stroke={color} strokeWidth="1.2"/>
      <path d={`M${cx - w},${cy - h} L${cx},${cy + 2} L${cx + w},${cy - h}`}
            fill="none" stroke={filled ? 'white' : color} strokeWidth="1.2"/>
    </g>
  );
}

function signalIcon(cx, cy, r, filled, color) {
  const pts = `${cx},${cy - r + 5} ${cx + r - 6},${cy + r - 7} ${cx - r + 6},${cy + r - 7}`;
  return <polygon points={pts} fill={filled ? color : 'none'} stroke={color} strokeWidth="1.3"/>;
}

function errorIcon(cx, cy, filled, color) {
  const d = `M${cx + 1},${cy - 9} L${cx - 5},${cy + 1} L${cx},${cy - 1} L${cx - 2},${cy + 9} L${cx + 5},${cy} L${cx + 1},${cy + 2} Z`;
  return <path d={d} fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 0 : 1.2}/>;
}

/* ── Event icon selector ──────────────────────────────────────────── */
function getEventIcon(type, cx, cy, r) {
  const isThrow = type.includes('throw');
  const isEnd   = type.startsWith('end');
  const filled  = isThrow || isEnd;

  if (type.includes('timer'))   return timerIcon(cx, cy, r, ACCENT);
  if (type.includes('message')) return messageIcon(cx, cy, r, filled, BLUE);
  if (type.includes('signal'))  return signalIcon(cx, cy, r, filled, BLUE);
  if (type.includes('error'))   return errorIcon(cx, cy, filled, RED);
  if (type === 'end_terminate') return <circle cx={cx} cy={cy} r={r - 7} fill={DARK}/>;
  return null;
}

function evtRingColor(type) {
  if (type.includes('timer'))                return ACCENT;
  if (type.includes('message'))             return BLUE;
  if (type.includes('signal'))              return BLUE;
  if (type.includes('error'))               return RED;
  if (type === 'end_terminate')             return DARK;
  return ACCENT;
}

/* ── SVG node renderers ───────────────────────────────────────────── */
function renderEventSVG(n) {
  const cx = n.x + EVT_R, cy = n.y + EVT_R;
  const isInter = n.type.startsWith('intermediate');
  const isEnd   = n.type.startsWith('end');
  const isThrow = n.type.includes('throw');
  const color   = evtRingColor(n.type);
  const strokeW = isEnd ? 3.5 : 1.75;
  const icon    = getEventIcon(n.type, cx, cy, EVT_R);

  return (
    <g>
      {/* Double ring for intermediate */}
      {isInter && (
        <circle cx={cx} cy={cy} r={EVT_R - 4}
                fill="none" stroke={color} strokeWidth="1.2"/>
      )}
      {/* Throw intermediate: inner ring is filled */}
      {isThrow && !n.type.startsWith('end') && (
        <circle cx={cx} cy={cy} r={EVT_R - 4}
                fill={color} opacity="0.2"/>
      )}
      <circle cx={cx} cy={cy} r={EVT_R}
              fill="white" stroke={color} strokeWidth={strokeW}
              filter="url(#nshadow)"/>
      {icon}
      <text x={cx} y={n.y + EVENT + 17} textAnchor="middle"
            fontSize="10.5" fill="#6B7280" fontWeight="500">{n.label}</text>
    </g>
  );
}

function renderGatewaySVG(n, isSel) {
  const cx = n.x + GATE / 2, cy = n.y + GATE / 2;
  const t = n.type;

  let gColor = AMBER, gBg = AMBER_BG, inner = null;

  if (t === 'gate_parallel') {
    gColor = ACCENT; gBg = ACCENT_BG;
    inner = (
      <g stroke={ACCENT} strokeWidth="3" strokeLinecap="round">
        <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10}/>
        <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy}/>
      </g>
    );
  } else if (t === 'gate_inclusive') {
    gColor = BLUE; gBg = BLUE_BG;
    inner = <circle cx={cx} cy={cy} r="9" fill="none" stroke={BLUE} strokeWidth="2.5"/>;
  } else if (t === 'gate_event') {
    gColor = BLUE; gBg = BLUE_BG;
    const pts = Array.from({ length: 5 }, (_, i) => {
      const a = (i * 72 - 90) * Math.PI / 180;
      return `${cx + 8 * Math.cos(a)},${cy + 8 * Math.sin(a)}`;
    }).join(' ');
    inner = (
      <g>
        <circle cx={cx} cy={cy} r="11" fill="none" stroke={BLUE} strokeWidth="1.2"/>
        <polygon points={pts} fill="none" stroke={BLUE} strokeWidth="1.5"/>
      </g>
    );
  } else if (t === 'gate_complex') {
    gColor = '#8B5CF6'; gBg = 'rgba(139,92,246,0.1)';
    inner = (
      <g stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round">
        <line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy}/>
        <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9}/>
        <line x1={cx - 6.5} y1={cy - 6.5} x2={cx + 6.5} y2={cy + 6.5}/>
        <line x1={cx + 6.5} y1={cy - 6.5} x2={cx - 6.5} y2={cy + 6.5}/>
      </g>
    );
  } else {
    /* XOR default */
    inner = (
      <g stroke={AMBER} strokeWidth="2.8" strokeLinecap="round">
        <line x1={cx - 8} y1={cy - 8} x2={cx + 8} y2={cy + 8}/>
        <line x1={cx + 8} y1={cy - 8} x2={cx - 8} y2={cy + 8}/>
      </g>
    );
  }

  return (
    <g>
      <g transform={`translate(${cx},${cy})`}>
        <rect x={-GATE / 2} y={-GATE / 2} width={GATE} height={GATE}
              transform="rotate(45)" rx="5"
              fill={gBg} stroke={gColor} strokeWidth={isSel ? 2.5 : 1.5}
              filter="url(#nshadow)"/>
      </g>
      {inner}
      <text x={cx} y={n.y + GATE + 17} textAnchor="middle"
            fontSize="10.5" fill="#6B7280" fontWeight="500">{n.label}</text>
    </g>
  );
}

function taskMarkerIcon(type, x, y, accent) {
  const mx = x + 14, my = y + 14;
  if (type === 'user_task') return (
    <g fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="round">
      <circle cx={mx} cy={my - 3} r="4"/>
      <path d={`M${mx - 6},${my + 8} Q${mx - 6},${my + 1} ${mx},${my + 1} Q${mx + 6},${my + 1} ${mx + 6},${my + 8}`}/>
    </g>
  );
  if (type === 'service_task') return (
    <g transform={`translate(${mx},${my})`}>
      <circle r="4" fill="none" stroke={accent} strokeWidth="1.2"/>
      <circle r="2" fill={accent}/>
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
        const rad = a * Math.PI / 180;
        return <circle key={a} cx={Math.cos(rad) * 7} cy={Math.sin(rad) * 7} r="1.5" fill={accent}/>;
      })}
    </g>
  );
  if (type === 'script_task') return (
    <g>
      <rect x={mx - 5} y={my - 7} width="10" height="14" rx="1.5"
            fill="none" stroke={accent} strokeWidth="1.2"/>
      <line x1={mx - 3} y1={my - 3} x2={mx + 3} y2={my - 3} stroke={accent} strokeWidth="1"/>
      <line x1={mx - 3} y1={my}     x2={mx + 3} y2={my}     stroke={accent} strokeWidth="1"/>
      <line x1={mx - 3} y1={my + 3} x2={mx + 3} y2={my + 3} stroke={accent} strokeWidth="1"/>
    </g>
  );
  if (type === 'send_task') return (
    <g>
      <rect x={mx - 7} y={my - 5} width="14" height="10" rx="1" fill={accent}/>
      <path d={`M${mx - 7},${my - 5} L${mx},${my + 2} L${mx + 7},${my - 5}`}
            fill="none" stroke="white" strokeWidth="1.1"/>
    </g>
  );
  if (type === 'receive_task') return (
    <g>
      <rect x={mx - 7} y={my - 5} width="14" height="10" rx="1"
            fill="none" stroke={accent} strokeWidth="1.2"/>
      <path d={`M${mx - 7},${my - 5} L${mx},${my + 2} L${mx + 7},${my - 5}`}
            fill="none" stroke={accent} strokeWidth="1.1"/>
    </g>
  );
  return null;
}

function renderTaskSVG(n, isSel, accent) {
  const { x, y } = n;
  const isSub  = n.type === 'subprocess';
  const isAnno = n.type === 'annotation';

  if (isAnno) {
    const lines = n.label.split('\n');
    return (
      <g>
        <path d={`M${x + 14},${y} L${x},${y} L${x},${y + NODE_H} L${x + 14},${y + NODE_H}`}
              fill="none" stroke="#9CA3AF" strokeWidth="1.5"/>
        {lines.map((ln, i) => (
          <text key={i} x={x + 20} y={y + 18 + i * 14}
                fontSize="11" fill="#6B7280">{ln}</text>
        ))}
      </g>
    );
  }

  const marker    = taskMarkerIcon(n.type, x, y, accent);
  const hasMarker = !!marker;

  return (
    <g>
      <rect x={x} y={y} width={NODE_W} height={NODE_H} rx="8"
            fill="white"
            stroke={isSel ? accent : isSub ? '#6B7280' : accent}
            strokeWidth={isSel ? 2.5 : isSub ? 2 : 1.5}
            filter="url(#nshadow)"/>
      {!isSub && <rect x={x} y={y} width="5" height={NODE_H} rx="3" fill={accent}/>}
      {marker}
      {n.label.split('\n').map((ln, i, a) => (
        <text key={i}
              x={x + NODE_W / 2 + (hasMarker ? 4 : 0)}
              y={y + NODE_H / 2 - (a.length - 1) * 7 + i * 14 + 4}
              textAnchor="middle" fontSize="11.5" fill={DARK} fontWeight="600">{ln}</text>
      ))}
      {n.sub && (
        <text x={x + NODE_W / 2} y={y + NODE_H - 8}
              textAnchor="middle" fontSize="9.5" fill="#9CA3AF">{n.sub}</text>
      )}
      {isSub && (
        <g>
          <rect x={x + NODE_W / 2 - 9} y={y + NODE_H - 14} width="18" height="13"
                rx="2" fill="white" stroke="#9CA3AF" strokeWidth="1"/>
          <line x1={x + NODE_W / 2} y1={y + NODE_H - 12} x2={x + NODE_W / 2} y2={y + NODE_H - 3}
                stroke="#6B7280" strokeWidth="1.5"/>
          <line x1={x + NODE_W / 2 - 6} y1={y + NODE_H - 7} x2={x + NODE_W / 2 + 6} y2={y + NODE_H - 7}
                stroke="#6B7280" strokeWidth="1.5"/>
        </g>
      )}
    </g>
  );
}

/* ── Mini palette icons (20×20) ───────────────────────────────────── */
function MiniIcon({ type }) {
  const cx = 10, cy = 10;
  if (isEvt(type)) {
    const isEnd   = type.startsWith('end');
    const isInter = type.startsWith('intermediate');
    const color   = evtRingColor(type);
    const sw      = isEnd ? 3 : 1.5;
    const icon    = getEventIcon(type, cx, cy, 9);
    return (
      <svg width="20" height="20" viewBox="0 0 20 20">
        {isInter && <circle cx={cx} cy={cy} r="7" fill="none" stroke={color} strokeWidth="1"/>}
        <circle cx={cx} cy={cy} r="9" fill="white" stroke={color} strokeWidth={sw}/>
        {icon && React.cloneElement(icon, {})}
      </svg>
    );
  }
  if (isGate(type)) {
    const gColor = type === 'gate_parallel' ? ACCENT : type.includes('inclusive') || type.includes('event') ? BLUE : type === 'gate_complex' ? '#8B5CF6' : AMBER;
    return (
      <svg width="20" height="20" viewBox="0 0 20 20">
        <rect x="4" y="4" width="12" height="12" transform="rotate(45 10 10)" rx="2"
              fill="none" stroke={gColor} strokeWidth="1.5"/>
      </svg>
    );
  }
  if (type === 'annotation') return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path d="M6,3 L3,3 L3,17 L6,17" fill="none" stroke="#9CA3AF" strokeWidth="1.5"/>
      <line x1="6" y1="8"  x2="17" y2="8"  stroke="#9CA3AF" strokeWidth="1"/>
      <line x1="6" y1="12" x2="14" y2="12" stroke="#9CA3AF" strokeWidth="1"/>
    </svg>
  );
  /* task types */
  const color = type === 'subprocess' ? '#6B7280' : ACCENT;
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <rect x="2" y="4" width="16" height="12" rx="3"
            fill="none" stroke={color} strokeWidth="1.5"/>
      {type !== 'subprocess' && <rect x="2" y="4" width="3" height="12" rx="2" fill={color}/>}
    </svg>
  );
}

/* ── Palette dropdown group ────────────────────────────────────────── */
function PaletteGroup({ group, isOpen, onToggle, onClose, onAdd, wrapRef }) {
  return (
    <div className="bpmn-pal-group" ref={wrapRef}>
      <button className={'bpmn-pal-btn' + (isOpen ? ' open' : '')} onClick={() => onToggle()}>
        {group.label}
        <i className={'ti ti-chevron-' + (isOpen ? 'up' : 'down')} style={{ fontSize: 11 }}/>
      </button>
      {isOpen && (
        <div className="bpmn-pal-drop">
          {group.items.map(item => (
            <button key={item.type} className="bpmn-pal-item"
                    onClick={() => { onAdd(item.type); onClose(); }}>
              <MiniIcon type={item.type}/>
              <span className="bpmn-pal-item-text">
                <span className="bpmn-pal-item-lbl">{item.label}</span>
                <span className="bpmn-pal-item-sub">{item.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BPMNFlow — single-flow canvas
   ══════════════════════════════════════════════════════════════ */
export function BPMNFlow({ flow, setFlow, accent = ACCENT }) {
  const [editing,     setEditing]     = useState(null);
  const [editVal,     setEditVal]     = useState('');
  const [dragNodePos, setDragNodePos] = useState(null); // { id, x, y } — live visual override
  const [connect,     setConnect]     = useState(null); // { from, mx, my }
  const [selected,    setSelected]    = useState(null);
  const [openGroup,   setOpenGroup]   = useState(null);
  const svgRef      = useRef(null);
  const wrapRef     = useRef(null);
  const palRefs     = useRef({});
  const dragRef     = useRef(null);   // set synchronously in onNodeDown
  const connectRef  = useRef(null);   // set synchronously in port mousedown
  const flowRef     = useRef(flow);
  const setFlowRef  = useRef(setFlow);
  const [wrapSize, setWrapSize] = useState({ w: 900, h: 480 });

  // Keep refs fresh every render
  useEffect(() => { flowRef.current = flow; });
  useEffect(() => { setFlowRef.current = setFlow; });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setWrapSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  /* Close palette on outside click */
  useEffect(() => {
    if (!openGroup) return;
    function h(e) {
      const el = palRefs.current[openGroup];
      if (el && !el.contains(e.target)) setOpenGroup(null);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openGroup]);

  /* ── Global mouse listeners (set up once, read refs) ── */
  useEffect(() => {
    function handleMove(e) {
      const d = dragRef.current;
      const c = connectRef.current;
      if (!d && !c) return;
      const svg = svgRef.current;
      if (!svg) return;
      const r  = svg.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      if (d) {
        const x = Math.max(0, Math.round((mx - d.offX) / 5) * 5);
        const y = Math.max(0, Math.round((my - d.offY) / 5) * 5);
        setDragNodePos({ id: d.id, x, y }); // real local state setter — no stale closure
      } else {
        const updated = { ...c, mx, my };
        connectRef.current = updated;
        setConnect(updated);
      }
    }

    function handleUp(e) {
      const d = dragRef.current;
      const c = connectRef.current;
      if (d) {
        const svg = svgRef.current;
        if (svg) {
          const r  = svg.getBoundingClientRect();
          const mx = e.clientX - r.left, my = e.clientY - r.top;
          const x  = Math.max(0, Math.round((mx - d.offX) / 5) * 5);
          const y  = Math.max(0, Math.round((my - d.offY) / 5) * 5);
          const fl = flowRef.current;
          setFlowRef.current({ ...fl, nodes: (fl.nodes || []).map(n => n.id === d.id ? { ...n, x, y } : n) });
        }
        dragRef.current = null;
        setDragNodePos(null);
      }
      if (c) {
        const svg = svgRef.current;
        if (svg) {
          const r  = svg.getBoundingClientRect();
          const px = e.clientX - r.left, py = e.clientY - r.top;
          const fl = flowRef.current;
          const ns = fl.nodes || [], es = fl.edges || [];
          const target = ns.find(n => {
            const b = nodeBox(n);
            return Math.abs(px - b.cx) < b.w / 2 + 10 && Math.abs(py - b.cy) < b.h / 2 + 10;
          });
          if (target && target.id !== c.from && !es.find(ed => ed.from === c.from && ed.to === target.id)) {
            setFlowRef.current({ ...fl, edges: [...es, { id: mkId(), from: c.from, to: target.id, label: '' }] });
          }
        }
        connectRef.current = null;
        setConnect(null);
      }
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup',   handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup',   handleUp);
    };
  }, []); // empty deps — only refs inside, always fresh

  const nodes = flow.nodes || [];
  const edges = flow.edges || [];

  // Live-override position while dragging
  const displayNodes = dragNodePos
    ? nodes.map(n => n.id === dragNodePos.id ? { ...n, x: dragNodePos.x, y: dragNodePos.y } : n)
    : nodes;

  const W = Math.max(...displayNodes.map(n => n.x + NODE_W + 120), wrapSize.w);
  const H = Math.max(...displayNodes.map(n => n.y + NODE_H + 120), wrapSize.h);

  /* ── Edit ── */
  function commitEdit() {
    if (!editing) return;
    setFlow({ ...flow, nodes: nodes.map(n => n.id === editing ? { ...n, label: editVal } : n) });
    setEditing(null);
  }

  /* ── onNodeDown — sets dragRef synchronously ── */
  function onNodeDown(e, n) {
    if (editing) return;
    if (e.target.closest('[data-port]')) return;
    e.preventDefault();
    setSelected({ kind: 'node', id: n.id });
    const r = svgRef.current.getBoundingClientRect();
    dragRef.current = { id: n.id, offX: e.clientX - r.left - n.x, offY: e.clientY - r.top - n.y };
  }

  /* ── CRUD ── */
  function addNode(type) {
    const x = nodes.length ? Math.max(...nodes.map(n => n.x)) + 200 : 80;
    const y = nodes.length ? nodes[nodes.length - 1].y : 130;
    setFlow({ ...flow, nodes: [...nodes, { id: mkId(), type, label: NODE_DEFAULTS[type] || 'Node', x, y }] });
  }
  function delNode(id) {
    setFlow({ ...flow, nodes: nodes.filter(n => n.id !== id), edges: edges.filter(e => e.from !== id && e.to !== id) });
    if (selected?.id === id) setSelected(null);
  }
  function delEdge(id) {
    setFlow({ ...flow, edges: edges.filter(e => e.id !== id) });
    if (selected?.id === id) setSelected(null);
  }
  async function editEdge(id) {
    const v = await showPrompt('Nhãn cạnh (Có / Không / ...):', edges.find(e => e.id === id)?.label || '');
    if (v === null) return;
    setFlow({ ...flow, edges: edges.map(e => e.id === id ? { ...e, label: v } : e) });
  }

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

        {PALETTE.map(group => (
          <PaletteGroup
            key={group.key}
            group={group}
            isOpen={openGroup === group.key}
            onToggle={() => setOpenGroup(g => g === group.key ? null : group.key)}
            onClose={() => setOpenGroup(null)}
            onAdd={addNode}
            wrapRef={el => (palRefs.current[group.key] = el)}
          />
        ))}

        <span className="bpmn-help">
          Kéo để di chuyển · Click để chọn · Delete để xóa · Kéo port → nối
        </span>
      </div>

      {/* ── SVG Canvas — no mouse handlers here, window listeners handle drag/connect ── */}
      <div ref={wrapRef} className="bpmn-canvas-wrap"
           onClick={e => e.currentTarget.closest('.bpmn-wrap')?.focus()}>
        <svg ref={svgRef} className="bpmn-svg" width={W} height={H}>
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill="#9CA3AF"/>
            </marker>
            <marker id="arr-sel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill={accent}/>
            </marker>
            <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r=".9" fill="#D1D5DB"/>
            </pattern>
            <filter id="nshadow" x="-10%" y="-15%" width="120%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity=".07"/>
            </filter>
          </defs>

          <rect width={W} height={H} fill="#F9FAFB"/>
          <rect width={W} height={H} fill="url(#dot-grid)"/>

          {/* ── Edges — use displayNodes so edges track dragged node live ── */}
          {edges.map(e => {
            const fn = displayNodes.find(n => n.id === e.from), tn = displayNodes.find(n => n.id === e.to);
            if (!fn || !tn) return null;
            const fb = nodeBox(fn), tb = nodeBox(tn);
            const fp = edgePt(fb, tb.cx, tb.cy), tp = edgePt(tb, fb.cx, fb.cy);
            const cx = Math.max(30, Math.abs(tp.x - fp.x) * 0.45);
            const d  = `M${fp.x},${fp.y} C${fp.x + cx},${fp.y} ${tp.x - cx},${tp.y} ${tp.x},${tp.y}`;
            const mx = (fp.x + tp.x) / 2, my = (fp.y + tp.y) / 2 - 6;
            const neg   = e.label?.toLowerCase().includes('không') || e.label?.toLowerCase().includes('no');
            const isSel = selected?.kind === 'edge' && selected.id === e.id;
            const ec    = isSel ? accent : neg ? '#9CA3AF' : '#6B7280';
            return (
              <g key={e.id} className="bpmn-eg"
                 onClick={ev => { ev.stopPropagation(); setSelected({ kind: 'edge', id: e.id }); }}>
                <path d={d} fill="none" stroke="transparent" strokeWidth="12" style={{ cursor: 'pointer' }}/>
                <path d={d} fill="none" stroke={ec} strokeWidth={isSel ? 2.5 : 1.5}
                      strokeDasharray={neg && !isSel ? '5 4' : 'none'}
                      markerEnd={isSel ? 'url(#arr-sel)' : 'url(#arr)'}/>
                {isSel && <path d={d} fill="none" stroke={accent} strokeWidth="6" opacity=".15" pointerEvents="none"/>}
                {e.label && (
                  <g style={{ cursor: 'pointer' }} onClick={ev => { ev.stopPropagation(); editEdge(e.id); }}>
                    <rect x={mx - e.label.length * 3.8 - 8} y={my - 9} width={e.label.length * 7.6 + 16} height={18}
                          rx="9" fill="white" stroke={isSel ? accent : '#E5E7EB'} strokeWidth=".75"/>
                    <text x={mx} y={my + 4.5} textAnchor="middle" fontSize="10.5" fill="#6B7280" fontWeight="500">
                      {e.label}
                    </text>
                  </g>
                )}
                <g className="bpmn-edel" style={{ cursor: 'pointer' }}
                   onClick={ev => { ev.stopPropagation(); delEdge(e.id); }}>
                  <circle cx={mx + (e.label ? e.label.length * 3.8 + 16 : 10)} cy={my} r="7"
                          fill="white" stroke="#E5E7EB" strokeWidth=".75"/>
                  <text x={mx + (e.label ? e.label.length * 3.8 + 16 : 10)} y={my + 4.5}
                        textAnchor="middle" fontSize="12" fill="#EF4444" fontWeight="600">×</text>
                </g>
              </g>
            );
          })}

          {/* Live connect line — use displayNodes for source position */}
          {connect?.mx && (() => {
            const fn = displayNodes.find(n => n.id === connect.from); if (!fn) return null;
            const fb = nodeBox(fn), fp = edgePt(fb, connect.mx, connect.my);
            return <line x1={fp.x} y1={fp.y} x2={connect.mx} y2={connect.my}
                         stroke={accent} strokeWidth="1.5" strokeDasharray="5 4" pointerEvents="none"/>;
          })()}

          {/* Deselect on canvas click */}
          <rect width={W} height={H} fill="transparent"
                onClick={() => setSelected(null)} style={{ cursor: 'default' }}/>

          {/* ── Nodes — rendered from displayNodes (live drag position) ── */}
          {displayNodes.map(n => {
            const box   = nodeBox(n);
            const isSel = selected?.kind === 'node' && selected.id === n.id;
            const isDragging = dragNodePos?.id === n.id;
            const port  = portPos(n);

            return (
              <g key={n.id} className={'bpmn-node' + (isDragging ? ' bpmn-drag' : '')}
                 onMouseDown={e => onNodeDown(e, n)}
                 onClick={e => { e.stopPropagation(); setSelected({ kind: 'node', id: n.id }); }}
                 onDoubleClick={() => { setEditing(n.id); setEditVal(n.label); }}>

                {/* Selection ring */}
                {isSel && (
                  box.s === 'circle'
                    ? <circle cx={box.cx} cy={box.cy} r={box.w / 2 + 6}
                              fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 3" opacity=".7"/>
                    : box.s === 'diamond'
                    ? <rect x={box.cx - box.w / 2 - 6} y={box.cy - box.h / 2 - 6}
                            width={box.w + 12} height={box.h + 12}
                            transform={`rotate(45,${box.cx},${box.cy})`} rx="7"
                            fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 3" opacity=".7"/>
                    : <rect x={n.x - 4} y={n.y - 4} width={box.w + 8} height={box.h + 8} rx="11"
                            fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 3" opacity=".7"/>
                )}

                {/* Shape */}
                {isEvt(n.type)  && renderEventSVG(n)}
                {isGate(n.type) && renderGatewaySVG(n, isSel)}
                {!isEvt(n.type) && !isGate(n.type) && renderTaskSVG(n, isSel, accent)}

                {/* Right connection port — sets connectRef synchronously */}
                {n.type !== 'annotation' && (
                  <circle cx={port.x} cy={port.y} r="5"
                          fill={accent} stroke="white" strokeWidth="1.5"
                          style={{ cursor: 'crosshair' }} data-port="right"
                          onMouseDown={e => {
                            e.stopPropagation();
                            const r = svgRef.current.getBoundingClientRect();
                            const c = { from: n.id, mx: e.clientX - r.left, my: e.clientY - r.top };
                            connectRef.current = c;
                            setConnect(c);
                          }}/>
                )}

                {/* Delete × */}
                <g className="bpmn-ndel" style={{ cursor: 'pointer' }}
                   onClick={e => { e.stopPropagation(); delNode(n.id); }}>
                  <circle cx={box.cx + box.w / 2 - 1} cy={n.y - 1} r="8"
                          fill="white" stroke="#E5E7EB" strokeWidth=".75"/>
                  <text x={box.cx + box.w / 2 - 1} y={n.y + 3.5}
                        textAnchor="middle" fontSize="12" fill="#EF4444" fontWeight="700">×</text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Inline rename — positioned using displayNodes so textarea follows dragged node */}
        {editing && (() => {
          const n = displayNodes.find(x => x.id === editing); if (!n) return null;
          const isE = isEvt(n.type), isG = isGate(n.type);
          return (
            <textarea autoFocus className="bpmn-inline-edit" value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') { setEditing(null); }
              }}
              style={{
                left:  n.x + (isE ? -24 : isG ? -16 : 8),
                top:   n.y + (isE ? EVENT + 6 : isG ? GATE + 6 : NODE_H + 4),
                width: isE ? 110 : isG ? 112 : NODE_W - 16,
              }}/>
          );
        })()}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BpmnEditor — multi-flow shell
   ══════════════════════════════════════════════════════════════ */
export default function BpmnEditor({ flows = [], onFlowsChange, onSave, saveState }) {
  const [activeIdx, setActiveIdx] = useState(0);

  async function addFlow() {
    const name = await showPrompt('Tên luồng mới:', `Luồng ${flows.length + 1}`);
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

  async function renameFlow(i) {
    const v = await showPrompt('Đổi tên luồng:', flows[i].name);
    if (!v) return;
    onFlowsChange(flows.map((f, j) => j === i ? { ...f, name: v } : f));
  }

  function dupFlow(i) {
    const src  = flows[i];
    const copy = { ...src, id: mkId(), name: src.name + ' (copy)', nodes: src.nodes.map(n => ({ ...n, id: mkId() })), edges: [] };
    onFlowsChange([...flows, copy]);
    setActiveIdx(flows.length);
  }

  async function delFlow(i) {
    if (!await showConfirm(`Xóa luồng "${flows[i].name}"?`)) return;
    const next = flows.filter((_, j) => j !== i);
    onFlowsChange(next);
    setActiveIdx(Math.min(activeIdx, Math.max(0, next.length - 1)));
  }

  function updateFlow(updated) {
    onFlowsChange(flows.map((f, i) => i === activeIdx ? updated : f));
  }

  const active = flows[activeIdx] || null;

  return (
    <div className="bpmn-editor">

      {/* ── Tabs ── */}
      <div className="bpmn-tabs">
        <div className="bpmn-tabs-scroll">
          {flows.map((f, i) => (
            <div key={f.id}
                 className={'bpmn-tab' + (i === activeIdx ? ' active' : '')}
                 onClick={() => setActiveIdx(i)}>
              <span className="bpmn-tab-num">{i + 1}</span>
              <span className="bpmn-tab-name">{f.name}</span>
              <span className="bpmn-tab-steps">{(f.nodes || []).length} bước</span>
              <div className="bpmn-tab-acts" onClick={e => e.stopPropagation()}>
                <button title="Đổi tên" onClick={() => renameFlow(i)}>
                  <i className="ti ti-pencil"/>
                </button>
                <button title="Nhân đôi" onClick={() => dupFlow(i)}>
                  <i className="ti ti-copy"/>
                </button>
                <button title="Xóa" className="bpmn-act-del" onClick={() => delFlow(i)}>
                  <i className="ti ti-trash"/>
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="bpmn-add-flow-btn" onClick={addFlow}>
          <i className="ti ti-plus"/> Thêm luồng
        </button>
      </div>

      {/* ── Body ── */}
      <div className="bpmn-body">
        {active ? (
          <BPMNFlow flow={active} setFlow={updateFlow} accent={ACCENT}/>
        ) : (
          <div className="bpmn-empty">
            <i className="ti ti-git-branch"/>
            <p>Chưa có luồng nào. Nhấn "+ Thêm luồng" để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="bpmn-footer">
        {saveState && (
          <span className={'save-state save-' + saveState.kind}>
            {saveState.kind === 'saved'  && <><i className="ti ti-check"/> Đã lưu lúc {saveState.at}</>}
            {saveState.kind === 'dirty'  && <><i className="ti ti-circle-dot"/> Có thay đổi chưa lưu</>}
            {saveState.kind === 'saving' && <><i className="ti ti-loader-2 spin"/> Đang lưu...</>}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-ghost">
            <i className="ti ti-download"/> Xuất
          </button>
          <button className="bpmn-save-btn" onClick={onSave}>
            <i className="ti ti-device-floppy"/> Lưu thay đổi
            <kbd className="btn-kbd">⌘S</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
