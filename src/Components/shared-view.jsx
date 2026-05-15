/* Shared view — rendered when user opens /share/{token} */

import React, { useState, useEffect } from 'react';
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

/* ── Shared Module detail ── */
function SharedModulePage({ mod, isEditor, onBack, notebookName }) {
  const [openFeat, setOpenFeat] = useState(null);
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
            {mod.features.map(f => (
              <div key={f.id} className={`shared-feature${openFeat === f.id ? " open" : ""}`}>
                <button
                  className="shared-feature-head"
                  onClick={() => setOpenFeat(openFeat === f.id ? null : f.id)}
                >
                  <span className="shared-feature-name">{f.name}</span>
                  <span className="shared-feature-counts">
                    {(f.flows?.length || 0) > 0 && (
                      <span><i className="ti ti-git-branch"></i> {f.flows.length} luồng</span>
                    )}
                    {(f.detailBlocks?.length || 0) > 0 && (
                      <span><i className="ti ti-list"></i> {f.detailBlocks.length} chi tiết</span>
                    )}
                  </span>
                  <i className={`ti ${openFeat === f.id ? "ti-chevron-up" : "ti-chevron-down"} shared-feature-chevron`}></i>
                </button>

                {openFeat === f.id && (
                  <div className="shared-feature-body">
                    {f.desc && <div className="shared-feature-desc md" dangerouslySetInnerHTML={{ __html: f.desc }} />}

                    {(f.flows || []).length > 0 && (
                      <div className="shared-feature-section">
                        <div className="shared-feature-section-label">Luồng nghiệp vụ</div>
                        <div className="shared-flows">
                          {f.flows.map((flow, i) => (
                            <div key={i} className="shared-flow">
                              <div className="shared-flow-name">{flow.name}</div>
                              {(flow.steps || []).length > 0 && (
                                <div className="shared-flow-steps">
                                  {flow.steps.map((step, j) => (
                                    <div key={j} className="shared-flow-step">
                                      <span className="shared-flow-step-num">{j + 1}</span>
                                      <span>{typeof step === "string" ? step : step.action || JSON.stringify(step)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(f.detailBlocks || []).length > 0 && (
                      <div className="shared-feature-section">
                        <div className="shared-feature-section-label">Chi tiết bổ sung</div>
                        {f.detailBlocks.map((block, i) => (
                          <div key={i} className="shared-block">
                            {block.title   && <div className="shared-block-title">{block.title}</div>}
                            {block.content && <div className="shared-block-content md" dangerouslySetInnerHTML={{ __html: block.content }} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
