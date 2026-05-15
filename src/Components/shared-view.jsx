/* Shared view — rendered when user opens /share/{token} */

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth.jsx';

const STATUS_META = {
  pending:  { label: "Chưa bắt đầu",   color: "var(--text3)",   bg: "var(--bg3)"        },
  studying: { label: "Đang nghiên cứu", color: "var(--warn-bd)", bg: "var(--warn-bg)"    },
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

export function SharedView({ token }) {
  const { user, loading: authLoading, signInGoogle } = useAuth();
  const [share,   setShare]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getDoc(doc(db, "shares", token))
      .then(snap => {
        if (snap.exists()) setShare({ id: snap.id, ...snap.data() });
        else               setError("not-found");
        setLoading(false);
      })
      .catch(() => { setError("error"); setLoading(false); });
  }, [token]);

  if (loading || authLoading) return (
    <div className="shared-state">
      <i className="ti ti-loader-2 spin"></i>
      <p>Đang tải nội dung...</p>
    </div>
  );

  if (error) return (
    <div className="shared-state shared-state--error">
      <i className="ti ti-link-off"></i>
      <h2>Link không hợp lệ</h2>
      <p>{error === "not-found"
        ? "Link chia sẻ này không tồn tại hoặc đã bị xóa."
        : "Không thể tải nội dung. Vui lòng thử lại."}
      </p>
      <a href="/" className="btn-primary">
        <i className="ti ti-home"></i> Về trang chủ
      </a>
    </div>
  );

  /* Editor role yêu cầu đăng nhập */
  const isEditor = share.role === "editor";
  if (isEditor && !user) return (
    <div className="shared-state">
      <div className="shared-login-prompt">
        <i className="ti ti-lock"></i>
        <h2>Yêu cầu đăng nhập</h2>
        <p>Link này được chia sẻ với quyền <b>Chỉnh sửa</b> — bạn cần đăng nhập để xem nội dung.</p>
        <button className="login-btn-google" onClick={signInGoogle}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Đăng nhập với Google
        </button>
      </div>
    </div>
  );

  return (
    <div className="shared-page">
      <div className="shared-topbar">
        <a href="/" className="shared-back">
          <i className="ti ti-arrow-left"></i> Trang chủ
        </a>
        <div className="shared-topbar-right">
          <span className="shared-by">Chia sẻ bởi {share.ownerName || share.ownerEmail}</span>
          <span className={`shared-role-badge shared-role-badge--${share.role}`}>
            <i className={`ti ${share.role === "viewer" ? "ti-eye" : "ti-pencil"}`}></i>
            {share.role === "viewer" ? "Người xem" : "Người chỉnh sửa"}
          </span>
        </div>
      </div>

      {share.type === "notebook"
        ? <SharedNotebookPage notebook={share.snapshot} isEditor={isEditor} />
        : <SharedModulePage   mod={share.snapshot}    isEditor={isEditor} onBack={null} notebookName={null} />
      }
    </div>
  );
}

/* ── Shared Notebook ── */
function SharedNotebookPage({ notebook, isEditor }) {
  const [activeModId, setActiveModId] = useState(null);
  const modules = notebook.modules || [];
  const activeMod = activeModId ? modules.find(m => m.id === activeModId) : null;
  const totalFeatures = modules.reduce((s, m) => s + (m.features?.length || 0), 0);

  if (activeMod) {
    return (
      <SharedModulePage
        mod={activeMod}
        isEditor={isEditor}
        onBack={() => setActiveModId(null)}
        notebookName={notebook.name}
      />
    );
  }

  return (
    <div className="ml-screen">
      <div className="ml-hero" style={{
        background: `radial-gradient(ellipse at 0% 60%, ${notebook.color}28 0%, transparent 55%), linear-gradient(180deg, var(--bg2) 0%, var(--bg3) 100%)`
      }}>
        <div className="ml-hero-inner">
          <div className="ml-header-row">
            <div className="ml-header-hd">
              <div className="ml-header-icon" style={{ background: notebook.color }}>
                <i className={`ti ${notebook.icon || "ti-clipboard-list"}`}></i>
              </div>
              <div>
                <div className="eyebrow">Sổ tay nội bộ</div>
                <h1 className="ml-title">{notebook.name}</h1>
                <p className="ml-sub">
                  {modules.length} module · {totalFeatures} tính năng đã ghi chép
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-grid">
        {modules.length === 0
          ? <div className="shared-empty">Sổ tay chưa có module nào.</div>
          : modules.map(m => (
            <SharedModuleCard key={m.id} module={m} onClick={() => setActiveModId(m.id)} />
          ))
        }
      </div>
    </div>
  );
}

function SharedModuleCard({ module: m, onClick }) {
  const icon = MODULE_ICONS[m.tech] || MODULE_ICONS.default;
  const st = STATUS_META[m.status] || STATUS_META.pending;
  const featCount = m.features?.length || 0;
  const flowCount = (m.mainFlows?.length || 0) +
                    (m.features?.reduce((s, f) => s + (f.flows?.length || 0), 0) || 0);

  return (
    <div className="ml-card" onClick={onClick}>
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
          <span>Xem module</span>
          <i className="ti ti-arrow-right"></i>
        </div>
      </div>
    </div>
  );
}

/* ── Read-only ERD viewer ── */
const ERD_CARD_W  = 290;
const ERD_HEAD_H  = 36;
const ERD_COL_H   = 22;
const ERD_FIELD_H = 27;
const ERD_NAME_W  = 88;
const ERD_TYPE_W  = 72;
const ERD_LINE    = { m2o: "#15803D", o2m: "#1D4ED8", m2m: "#7E22CE" };

function erdKind(type) {
  if (type === "Many2one")  return "m2o";
  if (type === "One2many")  return "o2m";
  if (type === "Many2many") return "m2m";
  return null;
}
function erdChip(type) {
  const k = erdKind(type); if (!k) return null;
  return { m2o:{label:"M2o",cls:"chip-m2o"}, o2m:{label:"O2m",cls:"chip-o2m"}, m2m:{label:"M2m",cls:"chip-m2m"} }[k];
}
function erdCW(c) { return c.width || ERD_CARD_W; }
function erdCH(c) { return ERD_HEAD_H + ERD_COL_H + (c.fields?.length || 0) * ERD_FIELD_H + 8; }

function SharedERDView({ models }) {
  const cards = models?.cards || [];
  const wrapRef = useRef(null);
  const [wrapSize, setWrapSize] = useState({ w: 900, h: 480 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setWrapSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  if (!cards.length) return null;

  const svgW = Math.max(...cards.map(c => c.x + erdCW(c) + 100), wrapSize.w);
  const svgH = Math.max(...cards.map(c => c.y + erdCH(c) + 100), wrapSize.h);

  const lines = [];
  cards.forEach(src => {
    const sw = erdCW(src);
    (src.fields || []).forEach((f, fi) => {
      if (!f.relTo) return;
      const tgt = cards.find(c => c.id === f.relTo); if (!tgt) return;
      const tw = erdCW(tgt);
      const kind = erdKind(f.type) || "m2o";
      const color = ERD_LINE[kind];
      const sx = src.x + sw;
      const sy = src.y + ERD_HEAD_H + ERD_COL_H + fi * ERD_FIELD_H + ERD_FIELD_H / 2;
      const tx = tgt.x;
      const ty = tgt.y + ERD_HEAD_H / 2;
      let c1x, c2x;
      if (sx <= tx) { const g = tx - sx; c1x = sx + g*0.5; c2x = tx - g*0.5; }
      else if (src.x >= tgt.x + tw) { const g = sx - tgt.x - tw; c1x = sx + Math.max(g*0.5,40); c2x = tx - Math.max(g*0.5,40); }
      else { c1x = sx + 80; c2x = tx - 80; }
      lines.push({ d:`M${sx},${sy} C${c1x},${sy} ${c2x},${ty} ${tx},${ty}`, sx, sy, color, kind, dashed: kind==="o2m" });
    });
  });

  return (
    <div className="erd-wrap erd-wrap--readonly">
      <div className="erd-toolbar">
        <div className="erd-legend">
          <span className="erd-leg-chip chip-m2o">M2o</span> Many2one
          <span className="erd-leg-chip chip-o2m">O2m</span> One2many
          <span className="erd-leg-chip chip-m2m">M2m</span> Many2many
        </div>
      </div>
      <div className="erd-canvas" ref={wrapRef}>
        <svg className="erd-svg" width={svgW} height={svgH}>
          <defs>
            <pattern id="erd-dots-ro" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.75" fill="#D1D5DB"/>
            </pattern>
            {Object.entries(ERD_LINE).map(([k, col]) => (
              <marker key={k} id={`earr-ro-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,1 L9,5 L0,9 Z" fill={col}/>
              </marker>
            ))}
          </defs>
          <rect width={svgW} height={svgH} fill="url(#erd-dots-ro)"/>
          {lines.map((ln, i) => (
            <g key={i}>
              <path d={ln.d} fill="none" stroke="#fff" strokeWidth="4" opacity="0.7"/>
              <path d={ln.d} fill="none" stroke={ln.color} strokeWidth="1.8"
                    strokeDasharray={ln.dashed ? "5,3" : undefined}
                    markerEnd={`url(#earr-ro-${ln.kind})`}/>
              <circle cx={ln.sx} cy={ln.sy} r="4" fill={ln.color}/>
              <circle cx={ln.sx} cy={ln.sy} r="2.5" fill="#fff"/>
            </g>
          ))}
        </svg>
        {cards.map(c => {
          const cw = erdCW(c);
          const nw = c.colW?.name || ERD_NAME_W;
          const tw = c.colW?.type || ERD_TYPE_W;
          return (
            <div key={c.id} className="erd-card" style={{ left: c.x, top: c.y, width: cw, cursor: "default" }}>
              <div className="erd-card-head" style={{ background: c.color }}>
                <i className="ti ti-table-column" style={{ fontSize:12, opacity:0.85, flexShrink:0 }}/>
                <span style={{ flex:1, fontWeight:600, fontSize:13, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", padding:"0 4px" }}>{c.name}</span>
              </div>
              <div className="erd-col-hdr-row">
                <div className="erd-col-hdr" style={{ width: nw }}><span>TÊN TRƯỜNG</span></div>
                <div className="erd-col-hdr" style={{ width: tw }}><span>KIỂU</span></div>
                <div className="erd-col-hdr" style={{ flex:1, minWidth:0 }}><span>MÔ TẢ</span></div>
                <div className="erd-col-hdr" style={{ width:20, flexShrink:0 }}/>
              </div>
              <div className="erd-fields">
                {(c.fields || []).map((f, fi) => {
                  const chip = erdChip(f.type);
                  return (
                    <div key={fi} className="erd-field" style={{ height: ERD_FIELD_H }}>
                      <span style={{ width:nw, flexShrink:0, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", padding:"0 4px" }}>{f.name}</span>
                      <span style={{ width:tw, flexShrink:0, fontSize:11, color:"var(--text2)", padding:"0 2px" }}>{f.type}</span>
                      {chip && <span className={"erd-rel-chip " + chip.cls}>{chip.label}</span>}
                      <span style={{ flex:1, minWidth:0, fontSize:12, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", padding:"0 4px" }}>{f.desc}</span>
                      {f.req && <span style={{ color:"#DC2626", fontSize:13, fontWeight:700, paddingRight:4 }}>*</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Read-only BPMN viewer ── */
const BPMN_NODE_W = 140, BPMN_NODE_H = 56, BPMN_GATE = 58, BPMN_EVENT = 38;
const BPMN_ACCENT = '#5BAA50', BPMN_AMBER = '#F59E0B', BPMN_AMBER_BG = '#FFFBEB';

function bpmnBox(n) {
  if (n.type === 'task')    return { cx: n.x+BPMN_NODE_W/2, cy: n.y+BPMN_NODE_H/2, w: BPMN_NODE_W, h: BPMN_NODE_H };
  if (n.type === 'gateway') return { cx: n.x+BPMN_GATE/2,   cy: n.y+BPMN_GATE/2,   w: BPMN_GATE,   h: BPMN_GATE   };
  return                          { cx: n.x+BPMN_EVENT/2,  cy: n.y+BPMN_EVENT/2,  w: BPMN_EVENT,  h: BPMN_EVENT  };
}
function bpmnEdgePt(box, tx, ty) {
  const dx = tx-box.cx, dy = ty-box.cy;
  const hw = box.w/2, hh = box.h/2;
  const s = Math.min(hw/(Math.abs(dx)||.001), hh/(Math.abs(dy)||.001));
  return { x: box.cx+dx*s, y: box.cy+dy*s };
}

function SharedBPMNView({ flows = [] }) {
  const [activeId, setActiveId] = useState(flows[0]?.id || null);
  const wrapRef = useRef(null);
  const [wrapSize, setWrapSize] = useState({ w: 700, h: 360 });

  useEffect(() => {
    if (flows.length && !flows.find(f => f.id === activeId)) setActiveId(flows[0].id);
  }, [flows, activeId]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setWrapSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  if (!flows.length) return null;
  const flow  = flows.find(f => f.id === activeId) || flows[0];
  const nodes = flow.nodes || [];
  const edges = flow.edges || [];
  const W = nodes.length ? Math.max(...nodes.map(n => n.x + BPMN_NODE_W + 120), wrapSize.w) : wrapSize.w;
  const H = nodes.length ? Math.max(...nodes.map(n => n.y + BPMN_NODE_H + 120), wrapSize.h) : wrapSize.h;

  return (
    <div className="shared-bpmn">
      {flows.length > 1 && (
        <div className="shared-bpmn-tabs">
          {flows.map(f => (
            <button key={f.id} className={"shared-bpmn-tab" + (f.id === flow.id ? " active" : "")} onClick={() => setActiveId(f.id)}>
              <i className="ti ti-git-branch"></i>{f.name}
            </button>
          ))}
        </div>
      )}
      {flows.length === 1 && <div className="shared-bpmn-title"><i className="ti ti-git-branch"></i>{flows[0].name}</div>}

      <div className="shared-bpmn-canvas" ref={wrapRef}>
        {!nodes.length
          ? <div className="shared-empty">Luồng chưa có bước nào.</div>
          : (
            <svg width={W} height={H}>
              <defs>
                <marker id="bpmn-arr-ro" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,1 L9,5 L0,9 Z" fill="#9CA3AF"/>
                </marker>
                <pattern id="bpmn-dots-ro" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r=".9" fill="#D1D5DB"/>
                </pattern>
                <filter id="bpmn-sh-ro" x="-10%" y="-15%" width="120%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity=".07"/>
                </filter>
              </defs>
              <rect width={W} height={H} fill="#F9FAFB"/>
              <rect width={W} height={H} fill="url(#bpmn-dots-ro)"/>

              {edges.map(e => {
                const fn = nodes.find(n => n.id===e.from), tn = nodes.find(n => n.id===e.to);
                if (!fn || !tn) return null;
                const fp = bpmnEdgePt(bpmnBox(fn), bpmnBox(tn).cx, bpmnBox(tn).cy);
                const tp = bpmnEdgePt(bpmnBox(tn), bpmnBox(fn).cx, bpmnBox(fn).cy);
                const cx = Math.max(30, Math.abs(tp.x-fp.x)*0.45);
                const d  = `M${fp.x},${fp.y} C${fp.x+cx},${fp.y} ${tp.x-cx},${tp.y} ${tp.x},${tp.y}`;
                const mx = (fp.x+tp.x)/2, my = (fp.y+tp.y)/2-6;
                const neg = e.label?.toLowerCase().includes('không') || e.label?.toLowerCase().includes('no');
                return (
                  <g key={e.id}>
                    <path d={d} fill="none" stroke={neg?'#9CA3AF':'#6B7280'} strokeWidth="1.5"
                          strokeDasharray={neg?'5 4':undefined} markerEnd="url(#bpmn-arr-ro)"/>
                    {e.label && (
                      <g>
                        <rect x={mx-e.label.length*3.8-8} y={my-9} width={e.label.length*7.6+16} height={18}
                              rx="9" fill="white" stroke="#E5E7EB" strokeWidth=".75"/>
                        <text x={mx} y={my+4.5} textAnchor="middle" fontSize="10.5" fill="#6B7280" fontWeight="500">{e.label}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {nodes.map(n => {
                const box = bpmnBox(n);
                return (
                  <g key={n.id}>
                    {n.type==='task' && (<>
                      <rect x={n.x} y={n.y} width={BPMN_NODE_W} height={BPMN_NODE_H} rx="8"
                            fill="white" stroke={BPMN_ACCENT} strokeWidth="1.5" filter="url(#bpmn-sh-ro)"/>
                      <rect x={n.x} y={n.y} width="5" height={BPMN_NODE_H} rx="3" fill={BPMN_ACCENT}/>
                      {(n.label||'').split('\n').map((ln,i,a)=>(
                        <text key={i} x={n.x+BPMN_NODE_W/2+2} y={n.y+BPMN_NODE_H/2-(a.length-1)*7+i*14+4}
                              textAnchor="middle" fontSize="11.5" fill="#111827" fontWeight="600">{ln}</text>
                      ))}
                      {n.sub && <text x={n.x+BPMN_NODE_W/2+2} y={n.y+BPMN_NODE_H-9}
                                      textAnchor="middle" fontSize="9.5" fill="#9CA3AF">{n.sub}</text>}
                    </>)}
                    {n.type==='gateway' && (<>
                      <g transform={`translate(${n.x+BPMN_GATE/2},${n.y+BPMN_GATE/2})`}>
                        <rect x={-BPMN_GATE/2} y={-BPMN_GATE/2} width={BPMN_GATE} height={BPMN_GATE}
                              transform="rotate(45)" rx="5" fill={BPMN_AMBER_BG} stroke={BPMN_AMBER} strokeWidth="1.5" filter="url(#bpmn-sh-ro)"/>
                        <text textAnchor="middle" y="5.5" fontSize="17" fill={BPMN_AMBER} fontWeight="700">?</text>
                      </g>
                      <text x={n.x+BPMN_GATE/2} y={n.y+BPMN_GATE+17} textAnchor="middle" fontSize="10.5" fill="#6B7280" fontWeight="500">{n.label}</text>
                    </>)}
                    {n.type==='start' && (<>
                      <circle cx={box.cx} cy={box.cy} r={BPMN_EVENT/2} fill="white" stroke={BPMN_ACCENT} strokeWidth="1.75" filter="url(#bpmn-sh-ro)"/>
                      <text x={box.cx} y={n.y+BPMN_EVENT+17} textAnchor="middle" fontSize="10.5" fill="#6B7280" fontWeight="500">{n.label}</text>
                    </>)}
                    {n.type==='end' && (<>
                      <circle cx={box.cx} cy={box.cy} r={BPMN_EVENT/2} fill="white" stroke="#111827" strokeWidth="3.5" filter="url(#bpmn-sh-ro)"/>
                      <circle cx={box.cx} cy={box.cy} r={BPMN_EVENT/2-6} fill="#111827"/>
                      <text x={box.cx} y={n.y+BPMN_EVENT+17} textAnchor="middle" fontSize="10.5" fill="#6B7280" fontWeight="500">{n.label}</text>
                    </>)}
                  </g>
                );
              })}
            </svg>
          )
        }
      </div>
    </div>
  );
}

/* ── Shared Module detail ── */
function SharedModulePage({ mod, isEditor, onBack, notebookName }) {
  const [openFeat, setOpenFeat] = useState(null);
  const [featTabs, setFeatTabs] = useState({});
  function getFeatTab(fid) { return featTabs[fid] || "models"; }
  function setFeatTab(fid, tab) { setFeatTabs(prev => ({ ...prev, [fid]: tab })); }
  const st = STATUS_META[mod.status] || STATUS_META.pending;

  return (
    <div className="ml-screen">
      {onBack && (
        <div className="ml-hero" style={{ background: `radial-gradient(ellipse at 0% 60%, ${mod.color}28 0%, transparent 55%), linear-gradient(180deg, var(--bg2) 0%, var(--bg3) 100%)` }}>
          <div className="ml-hero-inner">
            <button className="ml-back" onClick={onBack}>
              <i className="ti ti-arrow-left"></i>
              {notebookName ? `Sổ tay: ${notebookName}` : "Quay lại"}
            </button>
          </div>
        </div>
      )}
      <div className="shared-module-detail">

      <div className="shared-module-detail-title">
        <div className="shared-module-detail-name-row">
          <h1>{mod.name}</h1>
          <span className="ml-card-pill" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
        <code className="ml-card-tech">{mod.tech}</code>
        {isEditor && (
          <div className="shared-editor-notice">
            <i className="ti ti-pencil"></i>
            Bạn có quyền chỉnh sửa — nội dung hiển thị theo bản chia sẻ gần nhất
          </div>
        )}
      </div>

      {/* Overview */}
      {mod.overview && (
        <div className="shared-section">
          <h2 className="shared-section-title">Tổng quan</h2>
          <div className="shared-overview-grid">
            {mod.overview.version && (
              <div className="shared-ov-item">
                <span className="shared-ov-label">Phiên bản</span>
                <span>{mod.overview.version}</span>
              </div>
            )}
            {mod.overview.category && mod.overview.category !== "—" && (
              <div className="shared-ov-item">
                <span className="shared-ov-label">Danh mục</span>
                <span>{mod.overview.category}</span>
              </div>
            )}
            {mod.overview.depends && (
              <div className="shared-ov-item">
                <span className="shared-ov-label">Phụ thuộc</span>
                <code style={{ fontSize: 12 }}>{mod.overview.depends}</code>
              </div>
            )}
            {mod.overview.menu && (
              <div className="shared-ov-item">
                <span className="shared-ov-label">Menu</span>
                <span>{mod.overview.menu}</span>
              </div>
            )}
            {mod.overview.purpose && (
              <div className="shared-ov-item shared-ov-item--full">
                <span className="shared-ov-label">Mô tả mục đích</span>
                <span>{mod.overview.purpose}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features */}
      {(mod.features || []).length > 0 && (
        <div className="shared-section">
          <h2 className="shared-section-title">Tính năng ({mod.features.length})</h2>
          <div className="shared-features">
            {mod.features.map(f => {
              const modelCount  = f.models?.cards?.length  || 0;
              const flowCount   = f.flows?.length           || 0;
              const detailCount = f.detailBlocks?.length    || 0;
              const tabs = [
                { key:"models",  icon:"ti-table",        label:"Models",             count: modelCount  },
                { key:"flows",   icon:"ti-git-branch",   label:"Luồng xử lý",        count: flowCount   },
                { key:"details", icon:"ti-list-details", label:"Tính năng chi tiết", count: detailCount },
              ].filter(t => t.count > 0);
              const curTab = getFeatTab(f.id) || tabs[0]?.key;

              return (
                <div key={f.id} className={`shared-feature${openFeat === f.id ? " open" : ""}`}>
                  <button
                    className="shared-feature-head"
                    onClick={() => setOpenFeat(openFeat === f.id ? null : f.id)}
                  >
                    <span className="shared-feature-name">{f.name}</span>
                    <span className="shared-feature-counts">
                      {modelCount  > 0 && <span><i className="ti ti-table"></i> {modelCount} model</span>}
                      {flowCount   > 0 && <span><i className="ti ti-git-branch"></i> {flowCount} luồng</span>}
                      {detailCount > 0 && <span><i className="ti ti-list-details"></i> {detailCount} chi tiết</span>}
                    </span>
                    <i className={`ti ${openFeat === f.id ? "ti-chevron-up" : "ti-chevron-down"} shared-feature-chevron`}></i>
                  </button>

                  {openFeat === f.id && (
                    <div className="shared-feature-body">
                      {f.desc && <div className="shared-feature-desc md" dangerouslySetInnerHTML={{ __html: f.desc }} />}

                      {tabs.length > 0 && (
                        <>
                          <div className="shared-feat-tabs">
                            {tabs.map(t => (
                              <button
                                key={t.key}
                                className={"shared-feat-tab" + (curTab === t.key ? " active" : "")}
                                onClick={() => setFeatTab(f.id, t.key)}
                              >
                                <i className={"ti " + t.icon}></i>
                                {t.label}
                                <span className="shared-feat-tab-count">{t.count}</span>
                              </button>
                            ))}
                          </div>

                          {curTab === "models" && modelCount > 0 && (
                            <div className="shared-tab-content">
                              <SharedERDView models={f.models} />
                            </div>
                          )}
                          {curTab === "flows" && flowCount > 0 && (
                            <div className="shared-tab-content">
                              <SharedBPMNView flows={f.flows} />
                            </div>
                          )}
                          {curTab === "details" && detailCount > 0 && (
                            <div className="shared-tab-content">
                              {f.detailBlocks.map((block, i) => (
                                <div key={i} className="shared-block">
                                  {block.icon && <div className="shared-block-icon"><i className={"ti " + block.icon}></i></div>}
                                  {block.title   && <div className="shared-block-title">{block.title}</div>}
                                  {block.content && <div className="shared-block-content md" dangerouslySetInnerHTML={{ __html: block.content }} />}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(mod.features || []).length === 0 && (
        <div className="shared-empty">Module chưa có tính năng nào được ghi chép.</div>
      )}
    </div>
    </div>
  );
}

export default SharedView;
