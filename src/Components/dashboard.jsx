import React, { useState } from 'react';

const STATUS_FULL = {
  contract:  { label: 'Ký hợp đồng', dot: '#8B5CF6', color: '#7C3AED', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.4)'  },
  survey:    { label: 'Khảo sát',    dot: '#F59E0B', color: '#b8861e', bg: 'rgba(230,168,23,0.12)',  border: 'rgba(230,168,23,0.4)'  },
  demo:      { label: 'Demo',        dot: '#3B82F6', color: '#2563EB', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.4)'  },
  golive:    { label: 'Go-live',     dot: '#5BAA50', color: '#5BAA50', bg: 'rgba(91,170,80,0.12)',   border: 'rgba(91,170,80,0.4)'   },
  operation: { label: 'Vận hành',   dot: '#1D9E75', color: '#1D9E75', bg: 'rgba(29,158,117,0.12)',  border: 'rgba(29,158,117,0.4)'  },
};

function fmtToday() {
  const d = new Date();
  const days = ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
  return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
}

function getPct(proj) {
  const done  = proj.tasks?.filter(t => t.done).length || 0;
  const total = proj.tasks?.length || 0;
  if (total) return Math.round((done / total) * 100);
  if (proj.phases?.length) {
    return Math.round(proj.phases.reduce((s, p) => s + (p.percent || 0), 0) / proj.phases.length);
  }
  return proj.progress || 0;
}

function pad2(n) { return String(n).padStart(2, '0'); }

export function DashboardScreen({ data, projects = [], onOpenProject, onOpenNotebook, onNavigate }) {
  const [input, setInput] = useState('');
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dash_scratch_v1') || '[]'); }
    catch { return []; }
  });

  /* ── Stats ── */
  const nbCount  = data.notebooks.length;
  const modCount = data.notebooks.reduce((s, nb) => s + (nb.modules?.length || 0), 0);
  const projCount     = projects.length;
  const operationCnt  = projects.filter(p => p.status === 'operation').length;
  const activeCnt     = projects.filter(p => p.status === 'demo' || p.status === 'golive').length;

  /* ── Scratchpad ── */
  function addNote() {
    if (!input.trim()) return;
    const updated = [{ id: Date.now(), text: input.trim() }, ...notes].slice(0, 30);
    setNotes(updated);
    localStorage.setItem('dash_scratch_v1', JSON.stringify(updated));
    setInput('');
  }
  function removeNote(id) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('dash_scratch_v1', JSON.stringify(updated));
  }

  /* ── Data ── */
  const recentProjects = [...projects]
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const recentNbs = [...data.notebooks]
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 6);

  /* ── Status distribution ── */
  const statusDist = Object.entries(STATUS_FULL).map(([key, meta]) => ({
    key, meta, cnt: projects.filter(p => p.status === key).length,
  })).filter(s => s.cnt > 0);

  return (
    <div className="dash-screen">

      {/* ── Hero ── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-eyebrow">Tổng điều hành</div>
          <h1 className="dash-title">Dashboard & Workspace</h1>
          <p className="dash-sub">Trạm kiểm soát lộ trình và trạng thái các dự án đang triển khai.</p>
        </div>
        <div className="dash-hero-date">
          <i className="ti ti-calendar-week"/>
          {fmtToday()}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="dash-stats-row">
        {[
          { icon: 'ti-book-2',           lbl: 'Sổ tay',       val: pad2(nbCount),      sub: `${modCount} modules`,   mod: '' },
          { icon: 'ti-folder-open',      lbl: 'Dự án',        val: pad2(projCount),    sub: 'tổng số',               mod: '--blue' },
          { icon: 'ti-bolt',             lbl: 'Đang triển khai',val: pad2(activeCnt),  sub: 'Demo + Go-live',         mod: '--amber' },
          { icon: 'ti-circle-check',     lbl: 'Vận hành',      val: pad2(operationCnt), sub: 'đang live',             mod: '--green' },
        ].map(s => (
          <div key={s.lbl} className={'dash-stat-card' + (s.mod ? ' dash-stat-card' + s.mod : '')}>
            <div className={'dash-stat-icon dash-stat-icon' + (s.mod || '--default')}>
              <i className={'ti ' + s.icon}/>
            </div>
            <div className="dash-stat-body">
              <div className="dash-stat-val">{s.val}</div>
              <div className="dash-stat-lbl">{s.lbl}</div>
              <div className="dash-stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="dash-main-grid">

        {/* ── Left column ── */}
        <div className="dash-main-left">

          {/* Projects */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div className="dash-card-title">
                <i className="ti ti-building-community"/>
                <span>Dự án đang theo dõi</span>
              </div>
              <span className="dash-card-badge">{projects.length}</span>
            </div>

            {recentProjects.length === 0 ? (
              <div className="dash-card-empty">
                <i className="ti ti-building-off"/>
                <p>Chưa có dự án nào. Vào mục <strong>Dự án</strong> để tạo mới.</p>
              </div>
            ) : (
              <div className="dash-proj-list">
                {recentProjects.map(proj => {
                  const sf  = STATUS_FULL[proj.status] || STATUS_FULL.contract;
                  const pct = getPct(proj);
                  const members = (proj.members || []).slice(0, 3);
                  return (
                    <div key={proj.id} className="dash-proj-row" style={{ cursor: 'pointer' }}
                         onClick={() => onOpenProject?.(proj.id)}>
                      <div className="dash-proj-accent" style={{ background: proj.color }}/>
                      <div className="dash-proj-icon" style={{ background: proj.color + '22', color: proj.color }}>
                        <i className="ti ti-building-community"/>
                      </div>
                      <div className="dash-proj-info">
                        <div className="dash-proj-client">{proj.client || proj.name}</div>
                        {proj.name && proj.client && <div className="dash-proj-name">{proj.name}</div>}
                      </div>
                      <div className="dash-proj-prog">
                        <div className="dash-proj-track">
                          <div className="dash-proj-bar" style={{ width: pct + '%', background: proj.color }}/>
                        </div>
                        <span className="dash-proj-pct">{pct}%</span>
                      </div>
                      <div className="dash-proj-avatars">
                        {members.map((m, i) => {
                          const initials = (m.name||'?').split(/\s+/).map(w=>w[0]).slice(-2).join('').toUpperCase()||'?';
                          const colors = ['#5BAA50','#378ADD','#8B5CF6','#F59E0B','#EF4444'];
                          return <div key={m.id} className="dash-av" style={{ background: colors[i%colors.length] }}>{initials}</div>;
                        })}
                      </div>
                      <div className="dash-status-badge" style={{ color: sf.color, background: sf.bg, borderColor: sf.border }}>
                        <span className="dash-status-dot" style={{ background: sf.dot }}/>
                        {sf.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Status distribution */}
            {statusDist.length > 0 && (
              <div className="dash-status-dist">
                {statusDist.map(({ key, meta, cnt }) => (
                  <div key={key} className="dash-dist-item">
                    <span className="dash-dist-dot" style={{ background: meta.dot }}/>
                    <span className="dash-dist-lbl">{meta.label}</span>
                    <div className="dash-dist-track">
                      <div className="dash-dist-bar" style={{ width: (cnt / projCount * 100) + '%', background: meta.dot }}/>
                    </div>
                    <span className="dash-dist-cnt">{cnt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent notebooks */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div className="dash-card-title">
                <i className="ti ti-book-2"/>
                <span>Sổ tay gần đây</span>
              </div>
              <span className="dash-card-badge">{nbCount}</span>
            </div>
            {recentNbs.length === 0 ? (
              <div className="dash-card-empty">
                <i className="ti ti-book-off"/>
                <p>Chưa có sổ tay nào.</p>
              </div>
            ) : (
              <div className="dash-nb-grid">
                {recentNbs.map(nb => {
                  const modCnt  = nb.modules?.length || 0;
                  const featCnt = nb.modules?.reduce((s, m) =>
                    s + (m.features?.length || 0), 0) || 0;
                  return (
                    <div key={nb.id} className="dash-nb-card" onClick={() => onOpenNotebook?.(nb.id)}>
                      <div className="dash-nb-top" style={{ background: `linear-gradient(135deg, ${nb.color} 0%, ${nb.color}bb 100%)` }}>
                        <i className={`ti ${nb.icon || 'ti-clipboard-list'}`}/>
                      </div>
                      <div className="dash-nb-body">
                        <div className="dash-nb-name">{nb.name}</div>
                        <div className="dash-nb-meta">
                          <span><i className="ti ti-layout-grid"/> {modCnt}</span>
                          <span><i className="ti ti-puzzle"/> {featCnt}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="dash-main-right">

          {/* Scratchpad */}
          <div className="dash-card">
            <div className="dash-card-head">
              <div className="dash-card-title">
                <i className="ti ti-pencil"/>
                <span>Quick Capture</span>
              </div>
              {notes.length > 0 && (
                <button className="dash-card-link" onClick={() => { setNotes([]); localStorage.removeItem('dash_scratch_v1'); }}>
                  Xóa tất cả
                </button>
              )}
            </div>

            <div className="dash-scratch-area">
              <textarea
                className="dash-scratch-input"
                placeholder="Ghi chú nhanh, yêu cầu phát sinh, ý tưởng vụt qua..."
                value={input}
                rows={3}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
              />
              <div className="dash-scratch-hint">
                <span>Enter để thêm · Shift+Enter xuống dòng</span>
                {input.trim() && (
                  <button className="dash-scratch-send" onClick={addNote}>
                    <i className="ti ti-arrow-up"/>
                  </button>
                )}
              </div>
            </div>

            <div className="dash-notes-list">
              {notes.length === 0 && (
                <div className="dash-notes-empty">
                  <i className="ti ti-notes"/> Ghi chú sẽ xuất hiện ở đây
                </div>
              )}
              {notes.map(n => (
                <div key={n.id} className="dash-note-item">
                  <i className="ti ti-circle-dot dash-note-dot"/>
                  <span className="dash-note-text">{n.text}</span>
                  <button className="dash-note-del" onClick={() => removeNote(n.id)} title="Xóa">
                    <i className="ti ti-x"/>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick overview */}
          <div className="dash-card dash-overview-card">
            <div className="dash-card-head">
              <div className="dash-card-title">
                <i className="ti ti-chart-bar"/>
                <span>Tổng quan hệ thống</span>
              </div>
            </div>
            <div className="dash-overview-grid">
              {[
                { icon: 'ti-book-2',             lbl: 'Sổ tay',  val: nbCount,    sec: 'knowledge' },
                { icon: 'ti-layout-grid',         lbl: 'Modules', val: modCount,   sec: 'knowledge' },
                { icon: 'ti-building-community',  lbl: 'Dự án',   val: projCount,  sec: 'projects'  },
                { icon: 'ti-users',               lbl: 'Nhân sự', val: projects.reduce((s, p) => s + (p.members?.length || 0), 0),  sec: 'projects'  },
                { icon: 'ti-history',             lbl: 'Lịch sử', val: projects.reduce((s, p) => s + (p.changelog?.length || 0), 0), sec: 'experience' },
                { icon: 'ti-notes',               lbl: 'Ghi chú', val: projects.reduce((s, p) => s + (p.noteCards?.length || 0), 0), sec: 'projects'  },
              ].map(item => (
                <div key={item.lbl} className="dash-ov-item" style={{ cursor: 'pointer' }}
                     onClick={() => onNavigate?.(item.sec)}>
                  <i className={'ti ' + item.icon + ' dash-ov-icon'}/>
                  <div className="dash-ov-val">{item.val}</div>
                  <div className="dash-ov-lbl">{item.lbl}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
