import React, { useState, useMemo, useEffect } from 'react';
import { ProjectDetailScreen } from './project-detail.jsx';
import { toSlug } from './app.jsx';
import { showConfirm } from './dialog.jsx';

const STATUS_META = {
  contract:  { label: 'Ký hợp đồng', cls: 'clt-badge--contract' },
  survey:    { label: 'Khảo sát',    cls: 'clt-badge--survey'   },
  demo:      { label: 'Demo',        cls: 'clt-badge--demo'      },
  golive:    { label: 'Go-live',     cls: 'clt-badge--golive'   },
  operation: { label: 'Vận hành',   cls: 'clt-badge--operation' },
};

const STATUS_FULL = {
  contract:  { label: 'Ký hợp đồng', dot: '#8B5CF6', color: '#7C3AED', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.4)'  },
  survey:    { label: 'Khảo sát',    dot: '#F59E0B', color: '#b8861e', bg: 'rgba(230,168,23,0.12)',  border: 'rgba(230,168,23,0.4)'  },
  demo:      { label: 'Demo',        dot: '#3B82F6', color: '#2563EB', bg: 'rgba(59,130,246,0.12)',   border: 'rgba(59,130,246,0.4)'  },
  golive:    { label: 'Go-live',     dot: '#5BAA50', color: '#5BAA50', bg: 'rgba(91,170,80,0.12)',    border: 'rgba(91,170,80,0.4)'   },
  operation: { label: 'Vận hành',   dot: '#1D9E75', color: '#1D9E75', bg: 'rgba(29,158,117,0.12)',   border: 'rgba(29,158,117,0.4)'  },
};

const FILTER_TABS = [
  { key: 'all',       label: 'Tất cả'   },
  { key: 'survey',    label: 'Khảo sát' },
  { key: 'contract',  label: 'Đã ký'    },
  { key: 'demo',      label: 'Demo'     },
  { key: 'operation', label: 'Vận hành' },
];

const COLOR_OPTS = ['#5BAA50','#1F6B40','#378ADD','#D85A30','#8B5CF6','#F59E0B'];

function makeProject() {
  return {
    id: 'proj_' + Math.random().toString(36).slice(2, 8),
    client: '', industry: '', name: '', status: 'contract',
    startDate: '', endDate: '',
    color: '#5BAA50', description: '',
    tasks: [],
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

function getPct(proj) {
  const done  = proj.tasks?.filter(t => t.done).length || 0;
  const total = proj.tasks?.length || 0;
  return total ? Math.round((done / total) * 100) : (proj.progress || 0);
}

function fmtFullDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}


export function ProjectsScreen({ projects = [], notebooks = [], onUpsert, onRemove, onOpenFeature, onCreateFeature, onCreateModule, initialDetailProjId, onDetailRestored }) {
  const [modal,      setModal]      = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filterTab,  setFilterTab]  = useState('all');
  const [search,     setSearch]     = useState('');
  const [view,       setView]       = useState('grid');
  const [detailProj, setDetailProj] = useState(null);
  const [statusPop,  setStatusPop]  = useState(null);

  function openDetail(proj) {
    setDetailProj(proj);
    history.pushState(null, '', '/projects/' + toSlug(proj.client || proj.name || '') + '-' + proj.id);
  }
  function closeDetail() {
    setDetailProj(null);
    history.pushState(null, '', '/projects');
  }

  /* Sync with browser back button */
  useEffect(() => {
    function handlePop() {
      if (!location.pathname.match(/^\/projects\/[^/]+/)) {
        setDetailProj(null);
      }
    }
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  /* Restore project detail on F5 or returning from feature navigation */
  useEffect(() => {
    if (!initialDetailProjId) return;
    const p = projects.find(p => p.id === initialDetailProjId);
    if (p) { setDetailProj(p); onDetailRestored?.(); }
  }, [initialDetailProjId, projects]);

  const total      = projects.length;
  const activeCnt  = projects.filter(p => ['demo', 'operation', 'golive'].includes(p.status)).length;
  const avgPct     = total ? Math.round(projects.reduce((s, p) => s + getPct(p), 0) / total) : 0;

  /* Close status popover when clicking outside */
  useEffect(() => {
    function handleMouseDown(e) {
      if (!e.target.closest('.clt-status-pop-wrap')) setStatusPop(null);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  function openAdd()      { setModal({ mode: 'add',  form: makeProject()  }); }
  function openEdit(proj) { setModal({ mode: 'edit', form: { ...proj }    }); }
  function setField(k, v) { setModal(m => ({ ...m, form: { ...m.form, [k]: v } })); }

  function saveModal() {
    if (!modal.form.client.trim()) return;
    onUpsert({ ...modal.form, updatedAt: new Date().toISOString().slice(0, 10) });
    setModal(null);
  }
  async function deleteProject(proj) {
    if (!await showConfirm(`Xóa "${proj.client}"?`)) return;
    onRemove(proj.id);
    if (expandedId === proj.id) setExpandedId(null);
  }
  function toggleTask(proj, id) {
    onUpsert({ ...proj, tasks: proj.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t), updatedAt: new Date().toISOString().slice(0, 10) });
  }
  function addTask(proj, name) {
    if (!name.trim()) return;
    const task = { id: 't_' + Math.random().toString(36).slice(2, 8), name: name.trim(), done: false };
    onUpsert({ ...proj, tasks: [...(proj.tasks||[]), task], updatedAt: new Date().toISOString().slice(0, 10) });
  }
  function removeTask(proj, id) {
    onUpsert({ ...proj, tasks: proj.tasks.filter(t => t.id !== id), updatedAt: new Date().toISOString().slice(0, 10) });
  }

  const filtered = useMemo(() => {
    let list = projects;
    if (filterTab !== 'all') list = list.filter(p => p.status === filterTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.client||'').toLowerCase().includes(q) ||
        (p.name||'').toLowerCase().includes(q) ||
        (p.industry||'').toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, filterTab, search]);

  /* Show detail screen if a project is selected */
  if (detailProj) {
    const liveProj = projects.find(p => p.id === detailProj.id) || detailProj;
    return (
      <>
        <ProjectDetailScreen
          proj={liveProj}
          onBack={closeDetail}
          onUpsert={p => { onUpsert(p); setDetailProj(p); }}
          onEdit={() => setModal({ mode: 'edit', form: { ...liveProj } })}
          notebooks={notebooks}
          onOpenFeature={onOpenFeature}
          onCreateFeature={onCreateFeature}
          onCreateModule={onCreateModule}
        />
        {modal && (
          <ProjectModal modal={modal} setField={setField} onSave={saveModal} onClose={() => setModal(null)}/>
        )}
      </>
    );
  }

  return (
    <div className="clt-screen">

      {/* ── Hero ── */}
      <div className="clt-hero-wrap">
      <div className="clt-hero">
        <div className="clt-hero-left">
          <div className="clt-eyebrow">QUẢN LÝ DỰ ÁN</div>
          <h1 className="clt-hero-title">Khách hàng & Dự án</h1>
          <p className="clt-hero-sub">
            Theo dõi tiến độ triển khai, trạng thái, nhân sự và tài liệu của từng dự án khách hàng.
          </p>
          <div className="clt-hero-stats">
            <span><b>{total}</b> khách hàng</span>
            <span className="clt-hero-stats-dot">·</span>
            <span><b>{activeCnt}</b> đang triển khai</span>
            <span className="clt-hero-stats-dot">·</span>
            <span>tiến độ TB <b>{avgPct}%</b></span>
          </div>
        </div>
        <button className="clt-hero-btn" onClick={openAdd}>
          <i className="ti ti-plus"/> Thêm dự án
        </button>
      </div>
      </div>

      {/* ── Filter row ── */}
      <div className="clt-filter-row2">
        <div className="clt-search-bar">
          <i className="ti ti-search"/>
          <input placeholder="Tìm khách hàng, mã, ngành..."
                 value={search}
                 onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="clt-filter-tabs2">
          {FILTER_TABS.map(tab => {
            const cnt = tab.key === 'all' ? total : projects.filter(p => p.status === tab.key).length;
            return (
              <button key={tab.key}
                      className={'clt-filter-tab2' + (filterTab === tab.key ? ' active' : '')}
                      onClick={() => setFilterTab(tab.key)}>
                {tab.label}
                <span className="clt-tab-cnt">{cnt}</span>
              </button>
            );
          })}
        </div>
        <div className="clt-view-toggle">
          <button className={'clt-view-btn' + (view === 'grid' ? ' active' : '')} onClick={() => setView('grid')} title="Dạng lưới">
            <i className="ti ti-layout-grid"/>
          </button>
          <button className={'clt-view-btn' + (view === 'list' ? ' active' : '')} onClick={() => setView('list')} title="Danh sách">
            <i className="ti ti-menu-2"/>
          </button>
        </div>
      </div>

      {/* ── Grid ── */}
      {view === 'grid' && (
        <div className="clt-proj-grid">
          {filtered.length === 0 && (
            <div className="clt-empty" style={{ gridColumn: '1/-1' }}>
              <i className="ti ti-users-group"/>
              <p>{search ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dự án nào.'}</p>
            </div>
          )}
          {filtered.map(proj => (
            <ProjectGridCard
              key={proj.id}
              proj={proj}
              notebooks={notebooks}
              onOpen={openDetail}
              onUpsert={onUpsert}
              statusPop={statusPop}
              setStatusPop={setStatusPop}
            />
          ))}
        </div>
      )}

      {/* ── List ── */}
      {view === 'list' && (
        <div className="clt-list">
          <div className="clt-list-head">
            <div className="clt-lh-col clt-lh2-client">Khách hàng</div>
            <div className="clt-lh-col clt-lh2-status">Trạng thái</div>
            <div className="clt-lh-col clt-lh2-prog">Tiến độ</div>
            <div className="clt-lh-col clt-lh2-date">Bắt đầu</div>
            <div className="clt-lh-col clt-lh2-date">Kết thúc</div>
            <div className="clt-lh-col clt-lh2-pm">PM</div>
            <div className="clt-lh-col clt-lh2-team">Team</div>
            <div className="clt-lh2-end"/>
          </div>

          {filtered.length === 0 && (
            <div className="clt-empty">
              <i className="ti ti-users-group"/>
              <p>{search ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dự án nào.'}</p>
            </div>
          )}
          {filtered.map(proj => {
            const pct     = getPct(proj);
            const sf      = STATUS_FULL[proj.status] || STATUS_FULL.contract;
            const isOpen  = statusPop === proj.id + '_l';
            const members = proj.members || [];
            const shown   = members.slice(0, 3);
            const extra   = members.length - shown.length;
            const code    = proj.code || (proj.client || '').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 4);
            const pmName  = proj.pm || '';

            return (
              <div key={proj.id} className="clt-lrow" onClick={() => openDetail(proj)}>

                {/* Khách hàng */}
                <div className="clt-lrow-client">
                  <div className="clt-lrow-icon" style={{ background: proj.color + '22', color: proj.color }}>
                    <i className="ti ti-building-community"/>
                  </div>
                  <div>
                    <div className="clt-lrow-name">{proj.client || proj.name}</div>
                    {code && <div className="clt-lrow-code">{code}</div>}
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="clt-lh2-status clt-status-pop-wrap"
                     onClick={e => { e.stopPropagation(); setStatusPop(isOpen ? null : proj.id + '_l'); }}>
                  <div className="clt-status-badge" style={{ color: sf.color, background: sf.bg, borderColor: sf.border }}>
                    <span className="clt-status-dot" style={{ background: sf.dot }}/>
                    {sf.label}
                  </div>
                  {isOpen && (
                    <div className="clt-status-pop">
                      {Object.entries(STATUS_FULL).map(([k, v]) => (
                        <button key={k}
                          className={'clt-status-opt' + (proj.status === k ? ' active' : '')}
                          onClick={e => { e.stopPropagation(); onUpsert({ ...proj, status: k, updatedAt: new Date().toISOString().slice(0,10) }); setStatusPop(null); }}>
                          <span className="clt-status-dot" style={{ background: v.dot }}/>
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tiến độ */}
                <div className="clt-lh2-prog clt-lrow-prog">
                  <div className="clt-prog-track">
                    <div className="clt-prog-bar" style={{ width: pct + '%', background: proj.color }}/>
                  </div>
                  <span className="clt-prog-pct">{pct}%</span>
                </div>

                {/* Bắt đầu */}
                <div className="clt-lh2-date clt-lrow-date">
                  {proj.startDate ? fmtFullDate(proj.startDate) : <span className="clt-desc-empty">—</span>}
                </div>

                {/* Kết thúc */}
                <div className="clt-lh2-date clt-lrow-date">
                  {proj.endDate ? fmtFullDate(proj.endDate) : <span className="clt-desc-empty">—</span>}
                </div>

                {/* PM */}
                <div className="clt-lh2-pm clt-lrow-pm">
                  {pmName || <span className="clt-desc-empty">—</span>}
                </div>

                {/* Team */}
                <div className="clt-lh2-team clt-lrow-team">
                  {shown.map((m, i) => {
                    const ini = (m.name || '?').split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase();
                    return (
                      <span key={m.id || i} className="clt-gc-av"
                            style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                            title={m.name}>{ini}</span>
                    );
                  })}
                  {extra > 0 && <span className="clt-lrow-extra">+{extra}</span>}
                </div>

                <i className="ti ti-chevron-right clt-chevron"/>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <ProjectModal modal={modal} setField={setField} onSave={saveModal} onClose={() => setModal(null)}/>
      )}
    </div>
  );
}

/* ── Grid card ── */
const MEMBER_COLORS = ['#378ADD','#5BAA50','#8B5CF6','#F59E0B','#D85A30','#1D9E75'];

function ProjectGridCard({ proj, notebooks = [], onOpen, onUpsert, statusPop, setStatusPop }) {
  const pct     = getPct(proj);
  const sf      = STATUS_FULL[proj.status] || STATUS_FULL.contract;
  const members = proj.members || [];
  const modCnt  = notebooks.filter(nb => nb.projectId === proj.id).length;
  const isStatusOpen = statusPop === proj.id + '_gc';

  function fmtDate(d) {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  const code = proj.code ||
    (proj.client || '').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 4);

  return (
    <div className="clt-gc" onClick={() => onOpen(proj)}>
      <div className="clt-gc-accent" style={{ background: proj.color }}/>
      <div className="clt-gc-body">

        {/* Top: icon + name + status badge */}
        <div className="clt-gc-top">
          <div className="clt-gc-icon" style={{ background: proj.color, color: '#fff' }}>
            <i className="ti ti-building-community"/>
          </div>
          <div className="clt-gc-info">
            <div className="clt-gc-name">{proj.client || proj.name}</div>
            <div className="clt-gc-sub">
              {code}{proj.industry ? ' · ' + proj.industry : ''}
            </div>
          </div>
          <div className="clt-status-pop-wrap" onClick={e => { e.stopPropagation(); setStatusPop(isStatusOpen ? null : proj.id + '_gc'); }}>
            <div className="clt-gc-badge" style={{ color: sf.color, background: sf.bg, borderColor: sf.border }}>
              <span className="clt-status-dot" style={{ background: sf.dot }}/>
              {sf.label}
            </div>
            {isStatusOpen && (
              <div className="clt-status-pop" style={{ right: 0, left: 'auto' }}>
                {Object.entries(STATUS_FULL).map(([k, v]) => (
                  <button key={k}
                    className={'clt-status-opt' + (proj.status === k ? ' active' : '')}
                    onClick={e => { e.stopPropagation(); onUpsert({ ...proj, status: k, updatedAt: new Date().toISOString().slice(0,10) }); setStatusPop(null); }}>
                    <span className="clt-status-dot" style={{ background: v.dot }}/>
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="clt-gc-prog">
          <div className="clt-gc-prog-hd">
            <span>Tiến độ triển khai</span>
            <span><b>{pct}%</b></span>
          </div>
          <div className="clt-gc-track">
            <div className="clt-gc-bar" style={{ width: pct + '%', background: proj.color }}/>
          </div>
        </div>

        {/* Dates */}
        <div className="clt-gc-dates">
          <div className="clt-gc-date-col">
            <div className="clt-gc-date-lbl"><i className="ti ti-calendar-event"/> BẮT ĐẦU</div>
            <div className="clt-gc-date-val">{fmtDate(proj.startDate)}</div>
          </div>
          <div className="clt-gc-date-col">
            <div className="clt-gc-date-lbl"><i className="ti ti-calendar-event"/> KẾT THÚC DỰ KIẾN</div>
            <div className="clt-gc-date-val">{fmtDate(proj.endDate)}</div>
          </div>
        </div>

        {/* Footer: members + module count + detail link */}
        <div className="clt-gc-footer">
          <div className="clt-gc-members">
            {members.slice(0, 4).map((m, i) => {
              const ini = (m.name || '?').split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase() || '?';
              return (
                <span key={m.id || i} className="clt-gc-av" style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }} title={m.name}>
                  {ini}
                </span>
              );
            })}
          </div>
          <div className="clt-gc-mods">
            <i className="ti ti-layout-grid"/>
            {modCnt} module
          </div>
          <button className="clt-gc-detail" onClick={e => { e.stopPropagation(); onOpen(proj); }}>
            Chi tiết <i className="ti ti-arrow-right"/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Kanban board ── */
function KanbanBoard({ projects, search, statusPop, setStatusPop, onOpen, onEdit, onDelete, onUpsert }) {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? projects.filter(p =>
        (p.client||'').toLowerCase().includes(q) ||
        (p.name||'').toLowerCase().includes(q) ||
        (p.industry||'').toLowerCase().includes(q)
      )
    : projects;

  return (
    <div className="kb-board">
      {Object.entries(STATUS_FULL).map(([key, meta]) => {
        const cards = filtered.filter(p => p.status === key);
        return (
          <div key={key} className="kb-col">
            <div className="kb-col-head">
              <span className="kb-col-dot" style={{ background: meta.dot }}/>
              <span className="kb-col-lbl">{meta.label}</span>
              <span className="kb-col-cnt">{cards.length}</span>
            </div>
            <div className="kb-col-body">
              {cards.length === 0
                ? <div className="kb-col-empty">Chưa có dự án</div>
                : cards.map(proj => (
                    <KanbanCard key={proj.id} proj={proj}
                      statusPop={statusPop} setStatusPop={setStatusPop}
                      onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} onUpsert={onUpsert}
                    />
                  ))
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ proj, statusPop, setStatusPop, onOpen, onEdit, onDelete, onUpsert }) {
  const pct  = getPct(proj);
  const sf   = STATUS_FULL[proj.status] || STATUS_FULL.contract;
  const isOpen = statusPop === proj.id + '_kb';
  const members = (proj.members || []).slice(0, 3);

  return (
    <div className="kb-card" onClick={() => onOpen(proj)}>
      <div className="kb-card-accent" style={{ background: proj.color }}/>
      <div className="kb-card-body">
        <div className="kb-card-top">
          <div className="kb-card-icon" style={{ background: proj.color + '22', color: proj.color }}>
            <i className="ti ti-building-community"/>
          </div>
          <div className="kb-card-actions" onClick={e => e.stopPropagation()}>
            <button className="kb-act-btn" onClick={() => onEdit(proj)} title="Chỉnh sửa">
              <i className="ti ti-edit"/>
            </button>
            <button className="kb-act-btn kb-act-btn--del" onClick={() => onDelete(proj)} title="Xóa">
              <i className="ti ti-trash"/>
            </button>
          </div>
        </div>

        <div className="kb-card-name">{proj.client || proj.name}</div>
        {proj.name && proj.client && <div className="kb-card-proj">{proj.name}</div>}

        <div className="kb-card-tags">
          {proj.industry && <span className="kb-tag">{proj.industry}</span>}
          {proj.startDate && (
            <span className="kb-tag kb-tag--date">
              <i className="ti ti-calendar" style={{ fontSize: 10 }}/>
              {proj.startDate.slice(0, 7).replace('-', '/')}
            </span>
          )}
        </div>

        <div className="kb-card-progress">
          <div className="kb-prog-track">
            <div className="kb-prog-bar" style={{ width: pct + '%', background: proj.color }}/>
          </div>
          <span className="kb-prog-pct">{pct}%</span>
        </div>

        <div className="kb-card-footer" onClick={e => e.stopPropagation()}>
          <div className="kb-avatars">
            {members.map((m, i) => {
              const initials = (m.name||'?').split(/\s+/).map(w=>w[0]).slice(-2).join('').toUpperCase()||'?';
              const colors = ['#5BAA50','#378ADD','#8B5CF6','#F59E0B','#EF4444','#1D9E75'];
              return <div key={m.id} className="kb-av" style={{ background: colors[i % colors.length] }} title={m.name}>{initials}</div>;
            })}
          </div>
          <div className="clt-status-pop-wrap" onClick={e => { e.stopPropagation(); setStatusPop(isOpen ? null : proj.id + '_kb'); }}>
            <div className="kb-status-badge" style={{ color: sf.color, background: sf.bg, borderColor: sf.border }}>
              <span className="clt-status-dot" style={{ background: sf.dot }}/>
              {sf.label}
              <i className="ti ti-chevron-down" style={{ fontSize: 9 }}/>
            </div>
            {isOpen && (
              <div className="clt-status-pop" style={{ right: 0, left: 'auto' }}>
                {Object.entries(STATUS_FULL).map(([k, v]) => (
                  <button key={k}
                    className={'clt-status-opt' + (proj.status === k ? ' active' : '')}
                    onClick={e => { e.stopPropagation(); onUpsert({ ...proj, status: k, updatedAt: new Date().toISOString().slice(0,10) }); setStatusPop(null); }}>
                    <span className="clt-status-dot" style={{ background: v.dot }}/>
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Task panel ── */
function TaskPanel({ proj, onToggle, onAdd, onRemove }) {
  const [input, setInput] = useState('');
  function submit() { onAdd(proj, input); setInput(''); }
  const doneCnt  = proj.tasks?.filter(t => t.done).length || 0;
  const totalCnt = proj.tasks?.length || 0;
  return (
    <div className="clt-tasks">
      {proj.description && <p className="clt-task-desc">{proj.description}</p>}
      {(proj.startDate || proj.endDate) && (
        <div className="clt-task-meta"><i className="ti ti-calendar"/>{proj.startDate}{proj.endDate ? ' → ' + proj.endDate : ''}</div>
      )}
      {totalCnt > 0 && <div className="clt-task-meta">Tasks: <strong>{doneCnt}/{totalCnt} hoàn thành</strong></div>}
      <div className="clt-task-list">
        {(proj.tasks||[]).map(t => (
          <label key={t.id} className="clt-task-item">
            <input type="checkbox" checked={t.done} onChange={() => onToggle(proj, t.id)}/>
            <span className={'clt-task-name' + (t.done ? ' done' : '')}>{t.name}</span>
            <button className="clt-task-del" onClick={() => onRemove(proj, t.id)}><i className="ti ti-x"/></button>
          </label>
        ))}
      </div>
      <div className="clt-task-add">
        <input placeholder="Thêm task mới..." value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => { if (e.key === 'Enter') submit(); }}/>
        <button onClick={submit}><i className="ti ti-plus"/></button>
      </div>
    </div>
  );
}

/* ── Add/Edit modal ── */
function ProjectModal({ modal, setField, onSave, onClose }) {
  const f     = modal.form;
  const isAdd = modal.mode === 'add';
  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-modal" onClick={e => e.stopPropagation()}>
        <div className="ps-modal-head">
          <span>{isAdd ? 'Khởi tạo Partner mới' : 'Chỉnh sửa Partner'}</span>
          <button className="ps-modal-close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div className="ps-modal-body">
          <div className="ps-field">
            <label>Tên khách hàng / Đối tác *</label>
            <input placeholder="VinFast, THACO, FPT..." value={f.client} onChange={e => setField('client', e.target.value)}/>
          </div>
          <div className="ps-field-row">
            <div className="ps-field">
              <label>Ngành / Lĩnh vực</label>
              <input placeholder="Automotive, Finance..." value={f.industry||''} onChange={e => setField('industry', e.target.value)}/>
            </div>
            <div className="ps-field">
              <label>Tên dự án</label>
              <input placeholder="ERP Phase 2..." value={f.name||''} onChange={e => setField('name', e.target.value)}/>
            </div>
          </div>
          <div className="ps-field-row">
            <div className="ps-field">
              <label>Trạng thái</label>
              <select value={f.status} onChange={e => setField('status', e.target.value)}>
                <option value="contract">Ký hợp đồng</option>
                <option value="survey">Khảo sát</option>
                <option value="demo">Demo</option>
                <option value="golive">Go-live</option>
                <option value="operation">Vận hành</option>
              </select>
            </div>
            <div className="ps-field">
              <label>Màu đại diện</label>
              <div className="ps-color-row">
                {COLOR_OPTS.map(c => (
                  <button key={c} className={'ps-color-dot' + (f.color === c ? ' active' : '')}
                          style={{ background: c }} onClick={() => setField('color', c)}/>
                ))}
              </div>
            </div>
          </div>
          <div className="ps-field-row">
            <div className="ps-field">
              <label>Ngày bắt đầu</label>
              <input type="date" value={f.startDate||''} onChange={e => setField('startDate', e.target.value)}/>
            </div>
            <div className="ps-field">
              <label>Ngày kết thúc</label>
              <input type="date" value={f.endDate||''} onChange={e => setField('endDate', e.target.value)}/>
            </div>
          </div>
          <div className="ps-field-row">
            <div className="ps-field">
              <label>Project Manager</label>
              <input placeholder="Tên PM..." value={f.pm||''} onChange={e => setField('pm', e.target.value)}/>
            </div>
            <div className="ps-field">
              <label>Modules (phân cách bởi dấu phẩy)</label>
              <input placeholder="Sales, Purchase, Stock..." value={(f.modules||[]).join(', ')}
                     onChange={e => setField('modules', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}/>
            </div>
          </div>
          <div className="ps-field-row">
            <div className="ps-field">
              <label>Người liên hệ</label>
              <input placeholder="Họ và tên..." value={f.contactName||''} onChange={e => setField('contactName', e.target.value)}/>
            </div>
            <div className="ps-field">
              <label>Chức danh</label>
              <input placeholder="IT Director..." value={f.contactTitle||''} onChange={e => setField('contactTitle', e.target.value)}/>
            </div>
          </div>
          <div className="ps-field-row">
            <div className="ps-field">
              <label>Điện thoại</label>
              <input placeholder="0912 345 678" value={f.contactPhone||''} onChange={e => setField('contactPhone', e.target.value)}/>
            </div>
            <div className="ps-field">
              <label>Email</label>
              <input placeholder="name@company.vn" value={f.contactEmail||''} onChange={e => setField('contactEmail', e.target.value)}/>
            </div>
          </div>
          <div className="ps-field">
            <label>Mô tả</label>
            <textarea placeholder="Mô tả về dự án, phạm vi triển khai..." rows={3}
                      value={f.description||''} onChange={e => setField('description', e.target.value)}/>
          </div>
        </div>
        <div className="ps-modal-foot">
          <button className="ps-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="btn-primary" onClick={onSave} disabled={!f.client.trim()}>
            {isAdd ? 'Khởi tạo Partner' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
