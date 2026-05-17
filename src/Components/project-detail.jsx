import React, { useState } from 'react';
import { showConfirm } from './dialog.jsx';

const PROJ_STATUS = {
  contract:  { label: 'Ký hợp đồng', dot: '#8B5CF6', color: '#7C3AED', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.4)'  },
  survey:    { label: 'Khảo sát',    dot: '#F59E0B', color: '#b8861e', bg: 'rgba(230,168,23,0.12)',  border: 'rgba(230,168,23,0.4)'  },
  demo:      { label: 'Demo',        dot: '#3B82F6', color: '#2563EB', bg: 'rgba(59,130,246,0.12)',   border: 'rgba(59,130,246,0.4)'  },
  golive:    { label: 'Go-live',     dot: '#5BAA50', color: '#5BAA50', bg: 'rgba(91,170,80,0.12)',    border: 'rgba(91,170,80,0.4)'   },
  operation: { label: 'Vận hành',   dot: '#1D9E75', color: '#1D9E75', bg: 'rgba(29,158,117,0.12)',   border: 'rgba(29,158,117,0.4)'  },
};

const FEAT_STATUS = {
  done:      { label: 'Hoàn thành',      dot: '#5BAA50' },
  deploying: { label: 'Đang triển khai', dot: '#378ADD' },
  studying:  { label: 'Đang nghiên cứu', dot: '#9CA3AF' },
  pending:   { label: 'Chưa bắt đầu',   dot: '#D1D5DB' },
};

const TABS = [
  { key: 'timeline',  icon: 'ti-calendar-event',  label: 'Timeline'  },
  { key: 'features',  icon: 'ti-puzzle',           label: 'Tính năng' },
  { key: 'team',      icon: 'ti-users',            label: 'Nhân sự'   },
  { key: 'docs',      icon: 'ti-file-description', label: 'Tài liệu'  },
  { key: 'changelog', icon: 'ti-history',          label: 'Lịch sử thay đổi' },
  { key: 'notes',     icon: 'ti-notes',            label: 'Ghi chú'   },
];

const CL_TYPES = {
  feature:     { label: 'Tính năng mới', color: '#5BAA50', bg: 'rgba(91,170,80,0.12)'   },
  improvement: { label: 'Cải tiến',      color: '#378ADD', bg: 'rgba(55,138,221,0.12)'  },
  fix:         { label: 'Sửa lỗi',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  config:      { label: 'Cấu hình',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  note:        { label: 'Ghi chú',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
};

const CL_STATUS = {
  draft:    { label: 'Soạn thảo',    color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  review:   { label: 'Đang review',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  approved: { label: 'Đã duyệt',     color: '#5BAA50', bg: 'rgba(91,170,80,0.12)'   },
};

function makeCLEntry(changelog) {
  const now = new Date();
  const last = [...(changelog || [])].sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastVer = last?.version ? parseFloat(last.version) : 0;
  const nextVer = isNaN(lastVer) ? '' : (lastVer + 0.1).toFixed(1);
  return {
    id:        'cl_' + Math.random().toString(36).slice(2, 8),
    date:      now.toISOString().slice(0, 10),
    version:   nextVer,
    type:      'feature',
    status:    'draft',
    author:    '',
    featureId: '',
    title:     '',
    desc:      '',
  };
}

const TL_TYPE = {
  phase:     { label: 'Giai đoạn',      color: 'var(--blue)',   icon: 'ti-layout-rows',    bar: '#5BAA50' },
  milestone: { label: 'Mốc quan trọng', color: 'var(--blue)',   icon: 'ti-flag',           bar: '#1F6B40' },
  event:     { label: 'Sự kiện',        color: 'var(--text2)',  icon: 'ti-circle',         bar: '#9bd28d' },
  doc:       { label: 'Tài liệu',       color: '#7F77DD',       icon: 'ti-file',           bar: '#7F77DD' },
  comment:   { label: 'Bình luận',      color: '#D4537E',       icon: 'ti-message-circle', bar: '#D4537E' },
  future:    { label: 'Dự kiến',        color: 'var(--text3)',  icon: 'ti-clock',          bar: '#9a9a94' },
};

function makeFeat(parentId = null) {
  return {
    id: 'feat_' + Math.random().toString(36).slice(2, 8),
    name: '', status: 'pending', parentId, linkedFeature: null,
  };
}

const MEMBER_TYPE = {
  internal:  { label: 'Nội bộ',   color: '#378ADD', bg: 'rgba(55,138,221,0.12)'  },
  freelance: { label: 'Freelance', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  ctv:       { label: 'CTV',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
};

const PLATFORM = {
  zalo:  { label: 'Zalo',  color: '#0068FF', bg: 'rgba(0,104,255,0.10)'  },
  teams: { label: 'Teams', color: '#6264A7', bg: 'rgba(98,100,167,0.10)' },
  slack: { label: 'Slack', color: '#E01E5A', bg: 'rgba(224,30,90,0.10)'  },
};

function makeMember() {
  return {
    id: 'mem_' + Math.random().toString(36).slice(2, 8),
    name: '', type: 'internal', role: '', projectRole: '',
    phone: '', email: '', supportPlatform: 'zalo', supportLink: '',
  };
}

function makeGroup() {
  return {
    id: 'grp_' + Math.random().toString(36).slice(2, 8),
    name: '', platform: 'zalo', description: '', memberCount: 0, link: '',
  };
}

const DOC_TYPE = {
  design:      { label: 'Thiết kế',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  spec:        { label: 'Đặc tả',    color: '#378ADD', bg: 'rgba(55,138,221,0.12)' },
  requirement: { label: 'Yêu cầu',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  report:      { label: 'Báo cáo',   color: '#5BAA50', bg: 'rgba(91,170,80,0.12)'  },
  other:       { label: 'Khác',      color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
};

function makeDoc(parentId = null) {
  return {
    id: 'doc_' + Math.random().toString(36).slice(2, 8),
    name: '', link: '', type: 'other', notes: '', parentId,
  };
}

const NOTE_COLORS = [
  { key: '',       dot: 'var(--border2)', bg: ''        },
  { key: 'yellow', dot: '#EAB308',        bg: '#FEFCE8' },
  { key: 'green',  dot: '#22C55E',        bg: '#F0FDF4' },
  { key: 'blue',   dot: '#3B82F6',        bg: '#EFF6FF' },
  { key: 'purple', dot: '#8B5CF6',        bg: '#F5F3FF' },
  { key: 'pink',   dot: '#EC4899',        bg: '#FDF2F8' },
  { key: 'orange', dot: '#F97316',        bg: '#FFF7ED' },
];
const NOTE_TEXT_COLORS = ['#111827','#DC2626','#D97706','#16A34A','#2563EB','#7C3AED','#9CA3AF'];
const NOTE_HL_COLORS   = ['transparent','#FEF08A','#BBF7D0','#BFDBFE','#F5D0FE','#FECAca'];

function makeNote() {
  return {
    id:        'note_' + Math.random().toString(36).slice(2, 8),
    title:     'Ghi chú mới',
    content:   '',
    color:     '',
    pinned:    false,
    updatedAt: new Date().toISOString().slice(0, 16),
  };
}

function daysBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000)) + 1;
}

function addDays(s, n) {
  const d = new Date(s);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmt(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y.slice(2)}`;
}

function getDescendants(items, id) {
  const children = items.filter(p => p.parentId === id);
  return [id, ...children.flatMap(c => getDescendants(items, c.id))];
}

export function ProjectDetailScreen({ proj, onBack, onUpsert, onEdit, notebooks, onOpenFeature, onCreateFeature, onCreateModule }) {
  const [tab, setTab] = useState('timeline');
  const [statusPop, setStatusPop] = useState(false);
  const [morePop, setMorePop] = useState(false);
  const meta = PROJ_STATUS[proj.status] || PROJ_STATUS.contract;

  const code = proj.code ||
    (proj.client || '').split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 4);

  const avgPct = (() => {
    const items = proj.timeline || [];
    if (!items.length) return proj.progress || 0;
    return Math.round(items.reduce((s, it) => s + (it.progress || 0), 0) / items.length);
  })();

  React.useEffect(() => {
    if (!statusPop && !morePop) return;
    function h(e) {
      if (!e.target.closest('.pd-status-pop-wrap') && !e.target.closest('.pd-more-wrap')) {
        setStatusPop(false);
        setMorePop(false);
      }
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [statusPop, morePop]);

  function addChangelogForFeature(featureId) {
    const entry = { ...makeCLEntry(proj.changelog), featureId };
    onUpsert({ ...proj, changelog: [entry, ...(proj.changelog || [])], updatedAt: new Date().toISOString().slice(0, 10) });
    setTab('changelog');
  }

  function tabCount(key) {
    if (key === 'features')  return (proj.features  || []).length || null;
    if (key === 'team')      return ((proj.members || []).length + (proj.groups || []).length) || null;
    if (key === 'docs')      return (proj.docs || []).length || null;
    return null;
  }

  return (
    <div className="pd-screen">

      {/* ── Top bar ── */}
      <div className="pd-topbar">
        <button className="pd-back" onClick={onBack}>
          <i className="ti ti-arrow-left"/> Tất cả dự án
        </button>
        <div className="pd-topbar-right">
          {code && <span className="pd-topbar-code">{code}</span>}
          {(code && proj.industry) && <span className="pd-topbar-sep">·</span>}
          {proj.industry && <span>{proj.industry}</span>}
          {(code || proj.industry) && <span className="pd-topbar-sep">·</span>}
          <div className="pd-status-pop-wrap" onClick={e => { e.stopPropagation(); setStatusPop(p => !p); }}>
            <div className="clt-status-badge" style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}>
              <span className="clt-status-dot" style={{ background: meta.dot }}/>
              {meta.label}
            </div>
            {statusPop && (
              <div className="clt-status-pop">
                {Object.entries(PROJ_STATUS).map(([k, v]) => (
                  <button key={k}
                    className={'clt-status-opt' + (proj.status === k ? ' active' : '')}
                    onClick={e => { e.stopPropagation(); onUpsert({ ...proj, status: k }); setStatusPop(false); }}>
                    <span className="clt-status-dot" style={{ background: v.dot }}/>
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="pd-hero">
        <div className="pd-hero-left">
          <div className="pd-hero-icon" style={{ background: proj.color }}>
            <i className="ti ti-building-community"/>
          </div>
          <div className="pd-hero-info">
            <h1 className="pd-hero-name">{proj.client}</h1>
            {(proj.contactName || proj.contactPhone || proj.contactEmail) && (
              <div className="pd-hero-contact">
                {proj.contactName && (
                  <span>
                    <i className="ti ti-user"/>
                    {proj.contactName}{proj.contactTitle ? ' · ' + proj.contactTitle : ''}
                  </span>
                )}
                {proj.contactPhone && (
                  <span><i className="ti ti-phone"/> {proj.contactPhone}</span>
                )}
                {proj.contactEmail && (
                  <span><i className="ti ti-mail"/> {proj.contactEmail}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="pd-hero-right">
          <button className="pd-notebook-btn" onClick={onEdit}>
            <i className="ti ti-notebook"/> Mở sổ tay
          </button>
          <div className="pd-more-wrap">
            <button className="pd-more-btn" onClick={e => { e.stopPropagation(); setMorePop(p => !p); }}>
              <i className="ti ti-dots-vertical"/>
            </button>
            {morePop && (
              <div className="pd-more-pop">
                <button onClick={() => { onEdit(); setMorePop(false); }}>
                  <i className="ti ti-edit"/> Chỉnh sửa thông tin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats card ── */}
      <div className="pd-stats-card">
        <div className="pd-stat">
          <div className="pd-stat-lbl">Tiến độ</div>
          <div className="pd-stat-val">
            <div className="pd-stat-pct-wrap">
              <span className="pd-stat-pct-num">{avgPct}%</span>
              <div className="pd-stat-pct-track">
                <div className="pd-stat-pct-bar" style={{ width: avgPct + '%', background: proj.color }}/>
              </div>
            </div>
          </div>
        </div>
        <div className="pd-stat-div"/>
        <div className="pd-stat">
          <div className="pd-stat-lbl">Bắt đầu</div>
          <div className="pd-stat-val">{fmt(proj.startDate)}</div>
        </div>
        <div className="pd-stat-div"/>
        <div className="pd-stat">
          <div className="pd-stat-lbl">Kết thúc</div>
          <div className="pd-stat-val">{fmt(proj.endDate)}</div>
        </div>
        <div className="pd-stat-div"/>
        <div className="pd-stat">
          <div className="pd-stat-lbl">PM</div>
          <div className="pd-stat-val">{proj.pm || '—'}</div>
        </div>
        {(proj.modules?.length > 0) && (
          <>
            <div className="pd-stat-div"/>
            <div className="pd-stat pd-stat--modules">
              <div className="pd-stat-lbl">Modules</div>
              <div className="pd-stat-modules">
                {proj.modules.map(m => <span key={m} className="pd-module-badge">{m}</span>)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="pd-tabs">
        {TABS.map(t => {
          const cnt = tabCount(t.key);
          return (
            <button key={t.key}
                    className={'pd-tab' + (tab === t.key ? ' active' : '')}
                    onClick={() => setTab(t.key)}>
              <i className={'ti ' + t.icon}/> {t.label}
              {cnt !== null && <span className="pd-tab-count">{cnt}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Body ── */}
      <div className="pd-body">
        {tab === 'timeline'  && <TimelineTab proj={proj} onUpsert={onUpsert}/>}
        {tab === 'features'  && <FeaturesTab proj={proj} onUpsert={onUpsert} notebooks={notebooks}
            onCreateFeature={onCreateFeature} onCreateModule={onCreateModule}
            onAddChangelog={addChangelogForFeature}
            onOpenFeature={(modId, featId) => onOpenFeature?.(modId, featId, proj.id, proj.client)}/>}
        {tab === 'team'      && <TeamTab proj={proj} onUpsert={onUpsert}/>}
        {tab === 'docs'      && <DocsTab proj={proj} onUpsert={onUpsert}/>}
        {tab === 'changelog' && <ChangelogTab proj={proj} onUpsert={onUpsert} onAddEntry={() => {
          const entry = makeCLEntry(proj.changelog);
          onUpsert({ ...proj, changelog: [entry, ...(proj.changelog || [])], updatedAt: new Date().toISOString().slice(0, 10) });
        }}/>}
        {tab === 'notes'     && <NotesTab proj={proj} onUpsert={onUpsert}/>}
        {tab !== 'timeline' && tab !== 'features' && tab !== 'team' && tab !== 'docs' && tab !== 'changelog' && tab !== 'notes' && (
          <div className="pd-empty-tab">
            <i className={'ti ' + TABS.find(t => t.key === tab)?.icon}/>
            <p>Tính năng đang được phát triển</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Timeline tree helpers ── */
function walkUpdate(items, targetId, mutate) {
  return items.map(it => {
    if (it.id === targetId) return mutate(it);
    if (it.children?.length) return { ...it, children: walkUpdate(it.children, targetId, mutate) };
    return it;
  });
}
function walkDelete(items, targetId) {
  return items
    .filter(it => it.id !== targetId)
    .map(it => it.children?.length ? { ...it, children: walkDelete(it.children, targetId) } : it);
}
function walkAddChild(items, parentId, child) {
  return items.map(it => {
    if (it.id === parentId) return { ...it, children: [...(it.children || []), child] };
    if (it.children?.length) return { ...it, children: walkAddChild(it.children, parentId, child) };
    return it;
  });
}
function walkFind(items, id) {
  for (const it of items) {
    if (it.id === id) return it;
    if (it.children?.length) { const f = walkFind(it.children, id); if (f) return f; }
  }
  return null;
}
function collectAllIds(items, out = []) {
  for (const it of items) { out.push(it.id); if (it.children?.length) collectAllIds(it.children, out); }
  return out;
}

/* ── Timeline tab ── */
function TimelineTab({ proj, onUpsert }) {
  const items = proj.timeline || [];
  const [tlView, setTlView] = useState('table');

  function updateItems(next) {
    onUpsert({ ...proj, timeline: next });
  }

  function addPhase() {
    const today = new Date().toISOString().slice(0, 10);
    const id = 'tl_' + Math.random().toString(36).slice(2, 8);
    updateItems([...items, {
      id, title: 'Giai đoạn mới', start: today, end: addDays(today, 14),
      progress: 0, type: 'phase', children: [],
    }]);
  }

  const mainCount  = items.length;
  const childCount = items.reduce((s, i) => s + (i.children?.length || 0), 0);

  return (
    <div className="pd-timeline">
      <div className="pd-tl-bar">
        <div className="pd-tl-bar-left">
          <h3 className="pd-tl-title">Timeline dự án</h3>
          <span className="pd-tl-sub">{mainCount} mốc chính · {childCount} mốc con</span>
        </div>
        <div className="pd-tl-bar-right">
          <div className="tl-view-toggle">
            <button className={tlView === 'table' ? 'active' : ''} onClick={() => setTlView('table')} title="Bảng">
              <i className="ti ti-table"/>
            </button>
            <button className={tlView === 'gantt' ? 'active' : ''} onClick={() => setTlView('gantt')} title="Gantt">
              <i className="ti ti-chart-bar"/>
            </button>
          </div>
          <button className="btn-primary" onClick={addPhase}>
            <i className="ti ti-plus"/> Thêm mốc
          </button>
        </div>
      </div>

      {tlView === 'table'
        ? <TimelineTable items={items} onChange={updateItems}/>
        : <TimelineGantt items={items} onChange={updateItems}/>}
    </div>
  );
}

/* ── Timeline table view ── */
function TimelineTable({ items, onChange }) {
  const [expanded, setExpanded] = useState(() => new Set(collectAllIds(items)));

  function toggle(id) {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  }
  function updateRow(id, key, value) {
    onChange(walkUpdate(items, id, it => ({ ...it, [key]: value })));
  }
  function deleteRow(id, hasChildren) {
    if (!confirm(hasChildren ? 'Xóa mốc này và toàn bộ mốc con bên trong?' : 'Xóa mốc này?')) return;
    onChange(walkDelete(items, id));
  }
  function addChild(parentId) {
    const parent = walkFind(items, parentId);
    const today  = new Date().toISOString().slice(0, 10);
    const id     = 'tl_' + Math.random().toString(36).slice(2, 8);
    onChange(walkAddChild(items, parentId, {
      id, title: 'Mốc mới',
      start: parent?.start || today, end: parent?.end || today,
      progress: 0, type: 'event', children: [],
    }));
    setExpanded(new Set([...expanded, parentId]));
  }

  function renderRow(item, depth) {
    const isOpen     = expanded.has(item.id);
    const childCount = item.children?.length || 0;
    const hasChildren = childCount > 0;
    const rows = [
      <tr key={item.id}
          className={'tl-row ' + (depth === 0 ? 'tl-row-parent' : 'tl-row-child')}>
        <td>
          <div className="tl-name-cell" style={{ paddingLeft: depth * 22 + 'px' }}>
            <button className="tl-toggle" onClick={() => hasChildren && toggle(item.id)} disabled={!hasChildren}>
              {hasChildren
                ? <i className={'ti ' + (isOpen ? 'ti-chevron-down' : 'ti-chevron-right')}/>
                : <i className="ti ti-point" style={{ opacity: 0.2 }}/>}
            </button>
            <i className={'ti ' + (TL_TYPE[item.type]?.icon || 'ti-circle') + ' tl-type-icon'}
               style={{ color: TL_TYPE[item.type]?.color }}/>
            <input className={'tl-name-input' + (depth === 0 ? ' tl-name-parent' : '')}
                   value={item.title}
                   onChange={e => updateRow(item.id, 'title', e.target.value)}/>
            {hasChildren && <span className="tl-child-count">{childCount}</span>}
          </div>
        </td>
        <td>
          <select className="tl-type-select" value={item.type}
                  onChange={e => updateRow(item.id, 'type', e.target.value)}>
            {Object.entries(TL_TYPE).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
        </td>
        <td>
          <input type="date" className="tl-date-input" value={item.start || ''}
                 onChange={e => updateRow(item.id, 'start', e.target.value)}/>
        </td>
        <td>
          <input type="date" className="tl-date-input" value={item.end || ''}
                 onChange={e => updateRow(item.id, 'end', e.target.value)}/>
        </td>
        <td className="tl-duration">
          {daysBetween(item.start, item.end)} <span>ngày</span>
        </td>
        <td>
          <TLProgressCell value={item.progress || 0}
                          onChange={v => updateRow(item.id, 'progress', v)}/>
        </td>
        <td>
          <div className="tl-actions">
            <button onClick={() => addChild(item.id)} title="Thêm mốc con">
              <i className="ti ti-corner-down-right"/>
            </button>
            <button onClick={() => deleteRow(item.id, hasChildren)} title="Xóa" className="tl-action-del">
              <i className="ti ti-trash"/>
            </button>
          </div>
        </td>
      </tr>,
    ];

    if (isOpen && hasChildren) {
      for (const child of item.children) rows.push(...renderRow(child, depth + 1));
      rows.push(
        <tr key={item.id + '_add'} className="tl-row-add">
          <td colSpan="7">
            <div style={{ paddingLeft: ((depth + 1) * 22 + 28) + 'px' }}>
              <button className="tl-add-child" onClick={() => addChild(item.id)}>
                <i className="ti ti-plus"/> Thêm mốc con vào "{item.title}"
              </button>
            </div>
          </td>
        </tr>
      );
    }
    return rows;
  }

  return (
    <div className="tl-table-wrap">
      <table className="tl-table">
        <thead>
          <tr>
            <th style={{ width: '38%' }}>Tên mốc</th>
            <th>Loại</th>
            <th>Bắt đầu</th>
            <th>Kết thúc</th>
            <th style={{ width: '80px', textAlign: 'center' }}>Số ngày</th>
            <th style={{ width: '160px' }}>Tiến độ</th>
            <th style={{ width: '70px' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.flatMap(it => renderRow(it, 0))}
          {items.length === 0 && (
            <tr><td colSpan="7" className="tl-empty">
              Chưa có mốc nào. Bấm "Thêm mốc" để bắt đầu.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TLProgressCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const color = value === 100 ? '#5BAA50' : value > 0 ? '#378ADD' : 'var(--bg3)';
  return (
    <div className="tl-prog-cell">
      <div className="tl-prog-bar">
        <div className="tl-prog-fill" style={{ width: value + '%', background: color }}/>
      </div>
      {editing ? (
        <input type="number" min="0" max="100" className="tl-prog-input"
               autoFocus defaultValue={value}
               onBlur={e => { onChange(Math.max(0, Math.min(100, Number(e.target.value) || 0))); setEditing(false); }}
               onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}/>
      ) : (
        <button className="tl-prog-pct" onClick={() => setEditing(true)}>{value}%</button>
      )}
    </div>
  );
}

/* ── Timeline Gantt view ── */
function TimelineGantt({ items }) {
  const allDates = [];
  function walkDates(its) {
    its.forEach(it => {
      if (it.start) allDates.push(it.start);
      if (it.end)   allDates.push(it.end);
      if (it.children?.length) walkDates(it.children);
    });
  }
  walkDates(items);

  if (allDates.length === 0) {
    return <div className="tl-empty" style={{ padding: 40 }}>Không có mốc nào để hiển thị Gantt.</div>;
  }

  const minDate  = allDates.reduce((a, b) => a < b ? a : b);
  const maxDate  = allDates.reduce((a, b) => a > b ? a : b);
  const start    = addDays(minDate, -3);
  const end      = addDays(maxDate, 3);
  const totalDays = daysBetween(start, end);
  const DAY_W    = 16;
  const NAME_W   = 300;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOff = daysBetween(start, todayStr) - 1;

  const months = [];
  const cur = new Date(start);
  cur.setDate(1);
  while (cur <= new Date(end)) {
    months.push({ label: `Th${cur.getMonth()+1}/${cur.getFullYear()}`, offset: daysBetween(start, cur.toISOString().slice(0,10)) - 1 });
    cur.setMonth(cur.getMonth() + 1);
  }

  function posFor(s, e) {
    return { left: (daysBetween(start, s) - 1) * DAY_W, width: Math.max(DAY_W * 0.6, daysBetween(s, e) * DAY_W) };
  }

  function renderGanttRow(item, depth) {
    const out = [];
    const isMilestone = item.start && item.end && item.start === item.end;
    out.push(
      <div key={item.id}
           className={'tl-gantt-row ' + (depth === 0 ? 'tl-gantt-row-parent' : 'tl-gantt-row-child')}>
        <div className="tl-gantt-name-col" style={{ paddingLeft: 14 + depth * 18 + 'px' }}>
          <i className={'ti ' + (TL_TYPE[item.type]?.icon || 'ti-circle')} style={{ color: TL_TYPE[item.type]?.color }}/>
          <span>{item.title}</span>
        </div>
        <div className="tl-gantt-track">
          {item.start && item.end && (() => {
            const { left, width } = posFor(item.start, item.end);
            const bar = TL_TYPE[item.type]?.bar;
            if (isMilestone) {
              return <div className="tl-gantt-milestone" style={{ left: left + width/2 - 7, background: bar }}/>;
            }
            return (
              <div className={'tl-gantt-bar' + (depth === 0 ? ' tl-gantt-bar-parent' : ' tl-gantt-bar-child')}
                   style={{ left, width, background: depth === 0 ? bar : bar + '33', borderColor: bar }}>
                <div className="tl-gantt-bar-fill" style={{ width: (item.progress||0)+'%', background: bar }}/>
                {width > 30 && <span className="tl-gantt-bar-pct">{item.progress||0}%</span>}
              </div>
            );
          })()}
        </div>
      </div>
    );
    (item.children || []).forEach(ch => out.push(...renderGanttRow(ch, depth + 1)));
    return out;
  }

  return (
    <div className="tl-gantt-wrap">
      <div className="tl-gantt" style={{ '--day-w': DAY_W+'px', '--name-w': NAME_W+'px' }}>
        <div className="tl-gantt-head" style={{ width: NAME_W + totalDays * DAY_W }}>
          <div className="tl-gantt-name-col tl-gantt-head-cell">
            <span className="tl-gantt-head-lbl">Mốc</span>
          </div>
          <div className="tl-gantt-time-head">
            <div className="tl-gantt-months">
              {months.map((m, i) => {
                const next = months[i+1];
                const w = next ? (next.offset - m.offset) * DAY_W : (totalDays - m.offset) * DAY_W;
                return <div key={i} className="tl-gantt-month" style={{ width: w }}>{m.label}</div>;
              })}
            </div>
            <div className="tl-gantt-days" style={{ width: totalDays * DAY_W }}>
              {Array.from({ length: totalDays }).map((_, i) => {
                const d = new Date(addDays(start, i));
                return (
                  <div key={i} className={'tl-gantt-day' + (d.getDay()===0||d.getDay()===6 ? ' weekend' : '') + (d.getDate()===1 ? ' mstart' : '')}>
                    {d.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="tl-gantt-body" style={{ width: NAME_W + totalDays * DAY_W }}>
          {todayOff >= 0 && todayOff <= totalDays && (
            <div className="tl-gantt-today" style={{ left: NAME_W + todayOff * DAY_W + DAY_W/2 }}>
              <span>Hôm nay</span>
            </div>
          )}
          {items.flatMap(it => renderGanttRow(it, 0))}
        </div>
      </div>
      <div className="tl-gantt-legend">
        {Object.entries(TL_TYPE).map(([k, m]) => (
          <span key={k}>
            <span className="tl-gantt-legend-dot" style={{ background: m.bar }}/>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Features tab ── */
function FeaturesTab({ proj, onUpsert, notebooks, onOpenFeature, onCreateFeature, onCreateModule, onAddChangelog }) {
  const features = proj.features || [];
  const [picker, setPicker] = useState(null);

  function save(newFeatures) {
    onUpsert({ ...proj, features: newFeatures, updatedAt: new Date().toISOString().slice(0, 10) });
  }

  function addFeature(parentId = null) { save([...features, makeFeat(parentId)]); }
  function updateFeature(id, field, value) {
    save(features.map(f => f.id === id ? { ...f, [field]: value } : f));
  }
  function removeFeature(id) {
    const toRemove = new Set(getDescendants(features, id));
    save(features.filter(f => !toRemove.has(f.id)));
  }

  function renderRows(parentId, wbsPrefix, depth) {
    return features
      .filter(f => parentId === null ? !f.parentId : f.parentId === parentId)
      .map((feat, i) => {
        const wbs = wbsPrefix ? `${wbsPrefix}.${i + 1}` : String(i + 1);
        return (
          <React.Fragment key={feat.id}>
            <FeatureRow
              feat={feat} wbs={wbs} depth={depth}
              onUpdate={(field, val) => updateFeature(feat.id, field, val)}
              onRemove={() => removeFeature(feat.id)}
              onAddChild={() => addFeature(feat.id)}
              onPickFeature={() => setPicker({ featId: feat.id })}
              onOpenFeature={onOpenFeature}
              onAddChangelog={onAddChangelog}
            />
            {renderRows(feat.id, wbs, depth + 1)}
          </React.Fragment>
        );
      });
  }

  return (
    <div className="pd-features">
      <div className="pd-tl-bar">
        <div className="pd-tl-bar-left">
          <h3 className="pd-tl-title">Phân rã tính năng hệ thống</h3>
        </div>
        <button className="btn-primary" onClick={() => addFeature()}>
          <i className="ti ti-plus"/> Thêm tính năng mẹ
        </button>
      </div>

      {features.length === 0 ? (
        <div className="pd-tl-empty">
          <i className="ti ti-puzzle-off"/>
          <p>Chưa có tính năng nào. Nhấn "Thêm tính năng mẹ" để bắt đầu phân rã.</p>
        </div>
      ) : (
        <div className="pd-tl-wrap">
          <table className="pd-feat-table">
            <thead>
              <tr>
                <th className="pd-th pd-th--wbs">WBS</th>
                <th className="pd-th pd-th--feat-name">Tên tính năng / Nghiệp vụ</th>
                <th className="pd-th pd-th--feat-status">Trạng thái</th>
                <th className="pd-th pd-th--feat-link">Chi tiết tính năng</th>
                <th className="pd-th pd-th--act"></th>
              </tr>
            </thead>
            <tbody>
              {renderRows(null, '', 0)}
            </tbody>
          </table>
          <button className="pd-tl-add-row" onClick={() => addFeature()}>
            <i className="ti ti-plus"/> Thêm tính năng mẹ
          </button>
        </div>
      )}

      {picker && (
        <FeaturePickerModal
          notebooks={notebooks || []}
          onSelect={linked => { updateFeature(picker.featId, 'linkedFeature', linked); setPicker(null); }}
          onCreateFeature={onCreateFeature}
          onCreateModule={onCreateModule}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function FeatureRow({ feat, wbs, depth, onUpdate, onRemove, onAddChild, onPickFeature, onOpenFeature, onAddChangelog }) {
  const st     = FEAT_STATUS[feat.status] || FEAT_STATUS.pending;
  const indent = Math.min(depth * 20, 80);

  return (
    <tr className={'pd-feat-tr' + (depth === 0 ? ' pd-feat-tr--parent' : '')}>
      <td className="pd-td pd-td--wbs">
        <span className="pd-wbs">{wbs}</span>
      </td>
      <td className="pd-td pd-td--feat-name">
        <div className="pd-feat-name-cell">
          {depth > 0 && <span style={{ display: 'inline-block', width: indent + 'px', flexShrink: 0 }}/>}
          <input
            className={'pd-cell-input pd-feat-name-input' + (depth === 0 ? ' pd-feat-name-input--parent' : '')}
            value={feat.name}
            placeholder={depth === 0 ? 'Tên tính năng chính...' : 'Tên nghiệp vụ con...'}
            onChange={e => onUpdate('name', e.target.value)}
          />
          {feat.linkedFeature && (
            <span className="pd-feat-linked-badge">LINKED</span>
          )}
        </div>
      </td>
      <td className="pd-td pd-td--feat-status">
        <div className="pd-feat-status-cell">
          <span className="pd-feat-dot" style={{ background: st.dot }}/>
          <select
            className="pd-feat-status-sel"
            value={feat.status}
            onChange={e => onUpdate('status', e.target.value)}
          >
            {Object.entries(FEAT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </td>
      <td className="pd-td pd-td--feat-link">
        {feat.linkedFeature ? (
          <div className="pd-feat-link-cell">
            <button
              className="pd-feat-link-btn"
              onClick={() => onOpenFeature && onOpenFeature(feat.linkedFeature.moduleId, feat.linkedFeature.featureId)}
              title={`${feat.linkedFeature.notebookName} › ${feat.linkedFeature.moduleName} › ${feat.linkedFeature.featureName}`}
            >
              <span className="pd-feat-link-path">
                <span className="pd-feat-link-seg pd-feat-link-seg--dim">{feat.linkedFeature.notebookName}</span>
                <span className="pd-feat-link-arrow">›</span>
                <span className="pd-feat-link-seg pd-feat-link-seg--dim">{feat.linkedFeature.moduleName}</span>
                <span className="pd-feat-link-arrow">›</span>
                <span className="pd-feat-link-seg">{feat.linkedFeature.featureName}</span>
              </span>
            </button>
            <button
              className="pd-feat-link-clear"
              onClick={() => onUpdate('linkedFeature', null)}
              title="Xóa liên kết"
            >×</button>
          </div>
        ) : (
          <button className="pd-feat-pick-btn" onClick={onPickFeature}>
            Chọn tính năng
          </button>
        )}
      </td>
      <td className="pd-td pd-td--act">
        <button className="pd-act-btn" onClick={onAddChild} title="Thêm nghiệp vụ con">
          <i className="ti ti-git-branch"/>
        </button>
        <button className="pd-act-btn pd-act-btn--cl" onClick={() => onAddChangelog?.(feat.id)} title="Tạo bản ghi lịch sử">
          <i className="ti ti-history"/>
        </button>
        <button className="pd-act-btn pd-act-btn--del" onClick={onRemove} title="Xóa">
          <i className="ti ti-x"/>
        </button>
      </td>
    </tr>
  );
}

/* ── Team tab ── */
function TeamTab({ proj, onUpsert }) {
  const [subTab, setSubTab] = useState('members');

  const members = proj.members    || [];
  const groups  = proj.chatGroups || [];

  function saveMembers(next) {
    onUpsert({ ...proj, members: next, updatedAt: new Date().toISOString().slice(0, 10) });
  }
  function saveGroups(next) {
    onUpsert({ ...proj, chatGroups: next, updatedAt: new Date().toISOString().slice(0, 10) });
  }
  function updateMember(id, field, val) {
    saveMembers(members.map(m => m.id === id ? { ...m, [field]: val } : m));
  }
  function updateGroup(id, field, val) {
    saveGroups(groups.map(g => g.id === id ? { ...g, [field]: val } : g));
  }

  return (
    <div className="pd-team">
      <div className="pd-team-subtabs">
        <button className={'pd-team-subtab' + (subTab === 'members' ? ' active' : '')}
                onClick={() => setSubTab('members')}>
          <i className="ti ti-user-check"/> Nhân sự dự án
          <span className="pd-team-badge">{members.length}</span>
        </button>
        <button className={'pd-team-subtab' + (subTab === 'groups' ? ' active' : '')}
                onClick={() => setSubTab('groups')}>
          <i className="ti ti-message-circle"/> Nhóm chat dự án
          <span className="pd-team-badge">{groups.length}</span>
        </button>
      </div>

      {subTab === 'members' && (
        <div className="pd-team-section">
          <div className="pd-tl-bar">
            <div className="pd-tl-bar-left">
              <h3 className="pd-tl-title">Nhân sự dự án</h3>
              <span className="pd-tl-live"><i className="ti ti-circle-filled"/> {members.length} thành viên</span>
            </div>
            <button className="btn-primary" onClick={() => saveMembers([...members, makeMember()])}>
              <i className="ti ti-user-plus"/> Thêm nhân sự
            </button>
          </div>
          {members.length === 0 ? (
            <div className="pd-tl-empty">
              <i className="ti ti-users-group"/>
              <p>Chưa có nhân sự nào. Nhấn "Thêm nhân sự" để bắt đầu.</p>
            </div>
          ) : (
            <div className="pd-tl-wrap">
              <table className="pd-team-table">
                <thead>
                  <tr>
                    <th className="pd-th pd-th--mem-name">Họ và Tên</th>
                    <th className="pd-th pd-th--mem-type">Phân loại</th>
                    <th className="pd-th pd-th--mem-role">Chức vụ</th>
                    <th className="pd-th pd-th--mem-proj">Vai trò dự án</th>
                    <th className="pd-th pd-th--mem-phone">Số điện thoại</th>
                    <th className="pd-th pd-th--mem-email">Email liên hệ</th>
                    <th className="pd-th pd-th--mem-ch">Kênh hỗ trợ</th>
                    <th className="pd-th pd-th--act"/>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <MemberRow key={m.id} member={m}
                      onUpdate={(f, v) => updateMember(m.id, f, v)}
                      onRemove={() => saveMembers(members.filter(x => x.id !== m.id))}/>
                  ))}
                </tbody>
              </table>
              <button className="pd-tl-add-row" onClick={() => saveMembers([...members, makeMember()])}>
                <i className="ti ti-plus"/> Thêm nhân sự
              </button>
            </div>
          )}
        </div>
      )}

      {subTab === 'groups' && (
        <div className="pd-team-section">
          <div className="pd-tl-bar">
            <div className="pd-tl-bar-left">
              <h3 className="pd-tl-title">Nhóm chat dự án</h3>
              <span className="pd-tl-live"><i className="ti ti-circle-filled"/> {groups.length} nhóm</span>
            </div>
            <button className="btn-primary" onClick={() => saveGroups([...groups, makeGroup()])}>
              <i className="ti ti-plus"/> Tạo nhóm mới
            </button>
          </div>
          {groups.length === 0 ? (
            <div className="pd-tl-empty">
              <i className="ti ti-message-off"/>
              <p>Chưa có nhóm chat nào. Nhấn "Tạo nhóm mới" để bắt đầu.</p>
            </div>
          ) : (
            <div className="pd-tl-wrap">
              <table className="pd-team-table">
                <thead>
                  <tr>
                    <th className="pd-th pd-th--grp-name">Tên nhóm chat</th>
                    <th className="pd-th pd-th--grp-plat">Nền tảng</th>
                    <th className="pd-th pd-th--grp-desc">Mô tả chi tiết</th>
                    <th className="pd-th pd-th--grp-mem">Thành viên</th>
                    <th className="pd-th pd-th--grp-link">Link nhóm chat</th>
                    <th className="pd-th pd-th--act"/>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(g => (
                    <GroupRow key={g.id} group={g}
                      onUpdate={(f, v) => updateGroup(g.id, f, v)}
                      onRemove={() => saveGroups(groups.filter(x => x.id !== g.id))}/>
                  ))}
                </tbody>
              </table>
              <button className="pd-tl-add-row" onClick={() => saveGroups([...groups, makeGroup()])}>
                <i className="ti ti-plus"/> Thêm nhóm chat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, onUpdate, onRemove }) {
  const mt = MEMBER_TYPE[member.type] || MEMBER_TYPE.internal;
  const pl = PLATFORM[member.supportPlatform] || PLATFORM.zalo;
  const raw = member.name?.trim() || '';
  const initials = raw ? raw.split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase() : '?';

  return (
    <tr className="pd-tr">
      <td className="pd-td">
        <div className="pd-mem-name-cell">
          <div className="pd-mem-avatar" style={{ background: mt.bg, color: mt.color }}>{initials}</div>
          <input className="pd-cell-input pd-cell-input--name"
                 value={member.name} placeholder="Họ và tên..."
                 onChange={e => onUpdate('name', e.target.value)}/>
        </div>
      </td>
      <td className="pd-td">
        <select className="pd-team-sel"
                value={member.type}
                style={{ color: mt.color }}
                onChange={e => onUpdate('type', e.target.value)}>
          {Object.entries(MEMBER_TYPE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </td>
      <td className="pd-td">
        <input className="pd-cell-input" value={member.role}
               placeholder="Chức vụ..." onChange={e => onUpdate('role', e.target.value)}/>
      </td>
      <td className="pd-td">
        <input className="pd-cell-input" value={member.projectRole}
               placeholder="Vai trò dự án..." onChange={e => onUpdate('projectRole', e.target.value)}/>
      </td>
      <td className="pd-td">
        <input className="pd-cell-input" value={member.phone}
               placeholder="SĐT..." onChange={e => onUpdate('phone', e.target.value)}/>
      </td>
      <td className="pd-td">
        <input className="pd-cell-input" type="email" value={member.email}
               placeholder="Email..." onChange={e => onUpdate('email', e.target.value)}/>
      </td>
      <td className="pd-td">
        <div className="pd-mem-ch-cell">
          <select className="pd-team-sel pd-team-sel--plat"
                  value={member.supportPlatform}
                  style={{ color: pl.color }}
                  onChange={e => onUpdate('supportPlatform', e.target.value)}>
            {Object.entries(PLATFORM).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {member.supportLink ? (
            <a className="pd-mem-ch-link" href={member.supportLink} target="_blank" rel="noreferrer"
               style={{ color: pl.color, background: pl.bg }}>
              <i className="ti ti-external-link"/>
            </a>
          ) : null}
          <input className="pd-cell-input pd-mem-ch-input" value={member.supportLink}
                 placeholder="Link..." onChange={e => onUpdate('supportLink', e.target.value)}/>
        </div>
      </td>
      <td className="pd-td pd-td--act">
        <button className="pd-act-btn pd-act-btn--del" onClick={onRemove} title="Xóa">
          <i className="ti ti-x"/>
        </button>
      </td>
    </tr>
  );
}

function GroupRow({ group, onUpdate, onRemove }) {
  const pl = PLATFORM[group.platform] || PLATFORM.zalo;
  const initial = (group.name?.trim()?.[0] || '?').toUpperCase();

  return (
    <tr className="pd-tr">
      <td className="pd-td">
        <div className="pd-grp-name-cell">
          <div className="pd-grp-avatar" style={{ background: pl.bg, color: pl.color }}>{initial}</div>
          <input className="pd-cell-input pd-cell-input--name"
                 value={group.name} placeholder="Tên nhóm chat..."
                 onChange={e => onUpdate('name', e.target.value)}/>
        </div>
      </td>
      <td className="pd-td">
        <select className="pd-team-sel"
                value={group.platform}
                style={{ color: pl.color }}
                onChange={e => onUpdate('platform', e.target.value)}>
          {Object.entries(PLATFORM).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </td>
      <td className="pd-td">
        <input className="pd-cell-input" value={group.description}
               placeholder="Mô tả nhóm..." onChange={e => onUpdate('description', e.target.value)}/>
      </td>
      <td className="pd-td">
        <div className="pd-grp-mem-cell">
          <i className="ti ti-users"/>
          <input className="pd-cell-input pd-grp-mem-input" type="number" min="0"
                 value={group.memberCount}
                 onChange={e => onUpdate('memberCount', Math.max(0, +e.target.value))}/>
        </div>
      </td>
      <td className="pd-td">
        <div className="pd-grp-link-cell">
          <input className="pd-cell-input" value={group.link}
                 placeholder="https://..." onChange={e => onUpdate('link', e.target.value)}/>
          {group.link && (
            <a className="pd-grp-link-btn" href={group.link} target="_blank" rel="noreferrer"
               title="Mở nhóm">
              <i className="ti ti-external-link"/>
            </a>
          )}
        </div>
      </td>
      <td className="pd-td pd-td--act">
        <button className="pd-act-btn pd-act-btn--del" onClick={onRemove} title="Xóa">
          <i className="ti ti-x"/>
        </button>
      </td>
    </tr>
  );
}

/* ── Docs tab ── */
function DocsTab({ proj, onUpsert }) {
  const [view, setView] = useState('list'); // 'list' | 'kanban'
  const docs = proj.docs || [];

  function save(next) {
    onUpsert({ ...proj, docs: next, updatedAt: new Date().toISOString().slice(0, 10) });
  }
  function addDoc(parentId = null) { save([...docs, makeDoc(parentId)]); }
  function updateDoc(id, field, val) {
    save(docs.map(d => d.id === id ? { ...d, [field]: val } : d));
  }
  function removeDoc(id) {
    const toRemove = new Set(getDescendants(docs, id));
    save(docs.filter(d => !toRemove.has(d.id)));
  }

  function renderRows(parentId, prefix, depth) {
    return docs
      .filter(d => parentId === null ? !d.parentId : d.parentId === parentId)
      .map((doc, i) => {
        const stt = prefix ? `${prefix}.${i + 1}` : String(i + 1);
        return (
          <React.Fragment key={doc.id}>
            <DocRow
              doc={doc} stt={stt} depth={depth}
              onUpdate={(f, v) => updateDoc(doc.id, f, v)}
              onRemove={() => removeDoc(doc.id)}
              onAddChild={() => addDoc(doc.id)}
            />
            {renderRows(doc.id, stt, depth + 1)}
          </React.Fragment>
        );
      });
  }

  return (
    <div className="pd-docs">
      <div className="pd-tl-bar">
        <div className="pd-tl-bar-left">
          <h3 className="pd-tl-title">Tài liệu dự án</h3>
          <span className="pd-tl-live"><i className="ti ti-circle-filled"/> {docs.length} tài liệu</span>
        </div>
        <div className="pd-docs-actions">
          <div className="pd-docs-view-toggle">
            <button className={'pd-docs-view-btn' + (view === 'list'   ? ' active' : '')} onClick={() => setView('list')}   title="Danh sách"><i className="ti ti-list-details"/></button>
            <button className={'pd-docs-view-btn' + (view === 'kanban' ? ' active' : '')} onClick={() => setView('kanban')} title="Kanban"><i className="ti ti-layout-columns"/></button>
          </div>
          <button className="btn-primary" onClick={() => addDoc()}>
            <i className="ti ti-plus"/> Thêm tài liệu
          </button>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="pd-tl-empty">
          <i className="ti ti-file-off"/>
          <p>Chưa có tài liệu nào. Nhấn "Thêm tài liệu" để bắt đầu.</p>
        </div>
      ) : view === 'list' ? (
        <div className="pd-tl-wrap">
          <table className="pd-tl-table">
            <thead>
              <tr>
                <th className="pd-th pd-th--idx">STT</th>
                <th className="pd-th pd-th--doc-name">Tên tài liệu</th>
                <th className="pd-th pd-th--doc-link">Link</th>
                <th className="pd-th pd-th--doc-type">Loại tài liệu</th>
                <th className="pd-th pd-th--doc-notes">Ghi chú</th>
                <th className="pd-th pd-th--act"/>
              </tr>
            </thead>
            <tbody>{renderRows(null, '', 0)}</tbody>
          </table>
          <button className="pd-tl-add-row" onClick={() => addDoc()}>
            <i className="ti ti-plus"/> Thêm tài liệu
          </button>
        </div>
      ) : (
        /* ── Kanban ── */
        <div className="pd-docs-kanban">
          {Object.entries(DOC_TYPE).map(([key, meta]) => {
            const cards = docs.filter(d => d.type === key);
            return (
              <div key={key} className="pd-docs-col">
                <div className="pd-docs-col-head">
                  <span className="pd-docs-col-dot" style={{ background: meta.color }}/>
                  <span className="pd-docs-col-lbl">{meta.label}</span>
                  <span className="pd-docs-col-cnt">{cards.length}</span>
                </div>
                <div className="pd-docs-col-body">
                  {cards.length === 0
                    ? <div className="pd-docs-col-empty">Trống</div>
                    : cards.map(doc => (
                        <div key={doc.id} className="pd-docs-card">
                          <div className="pd-docs-card-name">
                            {doc.name || <em style={{ color: 'var(--text3)' }}>Chưa đặt tên</em>}
                          </div>
                          {doc.link && (
                            <a className="pd-docs-card-link" href={doc.link} target="_blank" rel="noreferrer">
                              <i className="ti ti-external-link"/> Mở tài liệu
                            </a>
                          )}
                          {doc.notes && (
                            <div className="pd-docs-card-notes">{doc.notes}</div>
                          )}
                          <span className="pd-docs-card-type-badge" style={{ color: meta.color, background: meta.bg }}>
                            {meta.label}
                          </span>
                        </div>
                      ))
                  }
                </div>
                <button className="pd-docs-col-add" onClick={() => {
                  const d = makeDoc(null);
                  save([...docs, { ...d, type: key }]);
                }}>
                  <i className="ti ti-plus"/> Thêm
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocRow({ doc, stt, depth, onUpdate, onRemove, onAddChild }) {
  const dt     = DOC_TYPE[doc.type] || DOC_TYPE.other;
  const indent = Math.min(depth * 16, 64);

  return (
    <tr className={'pd-tr' + (depth > 0 ? ' pd-tr--sub' : '')}>
      <td className="pd-td pd-td--idx">
        <span className="pd-idx">{stt}</span>
      </td>
      <td className="pd-td pd-td--name">
        <div className="pd-name-cell">
          {depth > 0 && <span className="pd-sub-indent" style={{ width: indent + 'px' }}/>}
          <input className="pd-cell-input pd-cell-input--name"
                 value={doc.name}
                 placeholder={depth === 0 ? 'Tên tài liệu...' : 'Tên mục con...'}
                 onChange={e => onUpdate('name', e.target.value)}/>
        </div>
      </td>
      <td className="pd-td pd-td--doc-link">
        <div className="pd-grp-link-cell">
          <input className="pd-cell-input" value={doc.link}
                 placeholder="https://..." onChange={e => onUpdate('link', e.target.value)}/>
          {doc.link && (
            <a className="pd-grp-link-btn" href={doc.link} target="_blank" rel="noreferrer" title="Mở tài liệu">
              <i className="ti ti-external-link"/>
            </a>
          )}
        </div>
      </td>
      <td className="pd-td pd-td--doc-type">
        <div className="pd-feat-status-cell">
          <span className="pd-feat-dot" style={{ background: dt.color }}/>
          <select className="pd-feat-status-sel" value={doc.type}
                  onChange={e => onUpdate('type', e.target.value)}>
            {Object.entries(DOC_TYPE).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </td>
      <td className="pd-td pd-td--doc-notes">
        <input className="pd-cell-input" value={doc.notes}
               placeholder="Ghi chú..." onChange={e => onUpdate('notes', e.target.value)}/>
      </td>
      <td className="pd-td pd-td--act">
        <button className="pd-act-btn" onClick={onAddChild} title="Thêm mục con">
          <i className="ti ti-git-branch"/>
        </button>
        <button className="pd-act-btn pd-act-btn--del" onClick={onRemove} title="Xóa">
          <i className="ti ti-x"/>
        </button>
      </td>
    </tr>
  );
}

function FeaturePickerModal({ notebooks, onSelect, onCreateFeature, onCreateModule, onClose }) {
  const [step,     setStep]     = useState('module'); // 'module' | 'feature'
  const [selMod,   setSelMod]   = useState(null);
  const [search,   setSearch]   = useState('');
  const [creating, setCreating] = useState(false);
  const [newName,  setNewName]  = useState('');
  const [newNbId,  setNewNbId]  = useState(notebooks[0]?.id || '');

  const allModules = notebooks.flatMap(nb =>
    (nb.modules || []).map(m => ({ ...m, notebookId: nb.id, notebookName: nb.name }))
  );

  function goToFeatures(mod) {
    setSelMod(mod);
    setStep('feature');
    setSearch('');
    setCreating(false);
    setNewName('');
  }

  function goBack() {
    setStep('module');
    setSearch('');
    setCreating(false);
    setNewName('');
  }

  function handleCreateModule() {
    if (!newNbId || !newName.trim()) return;
    const result = onCreateModule(newNbId, newName.trim());
    if (result) goToFeatures({ id: result.moduleId, name: result.moduleName, notebookId: result.notebookId, notebookName: result.notebookName, features: [] });
  }

  function handleCreateFeature() {
    if (!newName.trim() || !selMod) return;
    const result = onCreateFeature(selMod.id, newName.trim());
    if (result) onSelect(result);
  }

  /* Always read live features from notebooks so newly created ones appear */
  const liveMod = selMod ? (allModules.find(m => m.id === selMod.id) || selMod) : null;

  const q = search.toLowerCase();

  /* ── Step 1: pick module ── */
  if (step === 'module') {
    const filtered = allModules.filter(m => !q || m.name.toLowerCase().includes(q) || m.notebookName.toLowerCase().includes(q));
    return (
      <div className="ps-overlay" onClick={onClose}>
        <div className="ps-modal pd-fpick-modal" onClick={e => e.stopPropagation()}>
          <div className="ps-modal-head">
            <span>Chọn module</span>
            <button className="ps-modal-close" onClick={onClose}><i className="ti ti-x"/></button>
          </div>
          <div className="pd-fpick-search">
            <i className="ti ti-search"/>
            <input autoFocus placeholder="Tìm module..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <div className="pd-fpick-list">
            {filtered.length === 0
              ? <div className="pd-fpick-empty">Không tìm thấy module</div>
              : filtered.map(m => (
                <button key={m.id} className="pd-fpick-item" onClick={() => goToFeatures(m)}>
                  <div className="pd-fpick-item-name">{m.name}</div>
                  <div className="pd-fpick-item-bc">{m.notebookName} · {m.features?.length || 0} tính năng</div>
                </button>
              ))
            }
          </div>
          <div className="pd-fpick-footer">
            {creating ? (
              <div className="pd-fpick-create-form">
                <div className="pd-fpick-create-lbl">Tạo module mới</div>
                <select className="pd-fpick-sel" value={newNbId} onChange={e => setNewNbId(e.target.value)}>
                  {notebooks.map(nb => <option key={nb.id} value={nb.id}>{nb.name}</option>)}
                </select>
                <div className="pd-fpick-create-row">
                  <input className="pd-fpick-name-input" autoFocus placeholder="Tên module..."
                         value={newName} onChange={e => setNewName(e.target.value)}
                         onKeyDown={e => { if (e.key === 'Enter') handleCreateModule(); }}/>
                  <button className="btn-primary" onClick={handleCreateModule} disabled={!newName.trim()}>Tạo</button>
                  <button className="ps-btn-cancel" onClick={() => { setCreating(false); setNewName(''); }}>Hủy</button>
                </div>
              </div>
            ) : (
              <button className="pd-fpick-add-btn" onClick={() => setCreating(true)}>
                <i className="ti ti-plus"/> Tạo module mới
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Step 2: pick feature ── */
  const features = liveMod?.features || [];
  const filteredFeats = features.filter(f => !q || f.name.toLowerCase().includes(q));

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-modal pd-fpick-modal" onClick={e => e.stopPropagation()}>
        <div className="ps-modal-head">
          <button className="pd-fpick-back" onClick={goBack} title="Quay lại">
            <i className="ti ti-arrow-left"/>
          </button>
          <span>{liveMod?.name}</span>
          <button className="ps-modal-close" onClick={onClose}><i className="ti ti-x"/></button>
        </div>
        <div className="pd-fpick-mod-bc">{liveMod?.notebookName}</div>
        <div className="pd-fpick-search">
          <i className="ti ti-search"/>
          <input autoFocus placeholder="Tìm tính năng..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="pd-fpick-list">
          {filteredFeats.length === 0
            ? <div className="pd-fpick-empty">Chưa có tính năng nào</div>
            : filteredFeats.map(f => (
              <button key={f.id} className="pd-fpick-item" onClick={() => onSelect({
                featureId: f.id, featureName: f.name,
                moduleId: liveMod.id, moduleName: liveMod.name,
                notebookId: liveMod.notebookId, notebookName: liveMod.notebookName,
              })}>
                <div className="pd-fpick-item-name">{f.name}</div>
              </button>
            ))
          }
        </div>
        <div className="pd-fpick-footer">
          {creating ? (
            <div className="pd-fpick-create-form">
              <div className="pd-fpick-create-lbl">Tạo tính năng mới trong <strong>{liveMod?.name}</strong></div>
              <div className="pd-fpick-create-row">
                <input className="pd-fpick-name-input" autoFocus placeholder="Tên tính năng..."
                       value={newName} onChange={e => setNewName(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter') handleCreateFeature(); }}/>
                <button className="btn-primary" onClick={handleCreateFeature} disabled={!newName.trim()}>Tạo & chọn</button>
                <button className="ps-btn-cancel" onClick={() => { setCreating(false); setNewName(''); }}>Hủy</button>
              </div>
            </div>
          ) : (
            <button className="pd-fpick-add-btn" onClick={() => setCreating(true)}>
              <i className="ti ti-plus"/> Tạo tính năng mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Notes tab ── */
function NoteEditor({ note, onUpdate, onDelete }) {
  const edRef    = React.useRef(null);
  const [colorPop, setColorPop] = React.useState(null);

  React.useEffect(() => {
    if (edRef.current) edRef.current.innerHTML = note.content || '';
  }, [note.id]); // eslint-disable-line

  React.useEffect(() => {
    if (!colorPop) return;
    function h(e) {
      if (!e.target.closest('.dblk-color-pop') && !e.target.closest('.dblk-tb-color-btn')) setColorPop(null);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [colorPop]);

  function fmt(cmd, val) { edRef.current?.focus(); document.execCommand(cmd, false, val ?? null); }

  const colorMeta = NOTE_COLORS.find(c => c.key === (note.color || '')) || NOTE_COLORS[0];

  return (
    <div className="pn-editor-panel" style={{ background: colorMeta.bg || 'var(--bg)' }}>
      {/* Title row */}
      <div className="pn-editor-head">
        <input
          className="pn-title-input"
          value={note.title}
          onChange={e => onUpdate('title', e.target.value)}
          placeholder="Tiêu đề..."
        />
        <div className="pn-editor-meta">
          <span className="pn-date"><i className="ti ti-clock"/> {note.updatedAt?.slice(0, 10)}</span>
          {/* Color swatches */}
          <div className="pn-colors">
            {NOTE_COLORS.map(c => (
              <button
                key={c.key}
                className={'pn-color-swatch' + (note.color === c.key ? ' active' : '')}
                style={{ background: c.dot }}
                onClick={() => onUpdate('color', c.key)}
                title={c.key || 'Mặc định'}
              />
            ))}
          </div>
          <button className="pn-pin-btn" onClick={() => onUpdate('pinned', !note.pinned)} title={note.pinned ? 'Bỏ ghim' : 'Ghim'}>
            <i className={'ti ' + (note.pinned ? 'ti-pin-filled' : 'ti-pin')}/>
          </button>
          <button className="pn-del-btn" onClick={onDelete} title="Xóa ghi chú">
            <i className="ti ti-trash"/>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dblk-toolbar pn-toolbar">
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('bold')}}          title="Đậm"><strong>B</strong></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('italic')}}        title="Nghiêng"><em>I</em></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('underline')}}     title="Gạch chân"><u>U</u></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('strikeThrough')}} title="Gạch giữa"><s>S</s></button>
        <div className="dblk-tb-sep"/>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('insertOrderedList')}}   title="Danh sách số"><i className="ti ti-list-numbers"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('insertUnorderedList')}} title="Dấu đầu dòng"><i className="ti ti-list"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('indent')}}              title="Thụt vào"><i className="ti ti-indent-increase"/></button>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('outdent')}}             title="Thụt ra"><i className="ti ti-indent-decrease"/></button>
        <div className="dblk-tb-sep"/>
        <div className="dblk-tb-color-wrap">
          <button className="dblk-tb-btn dblk-tb-color-btn" onMouseDown={e=>e.preventDefault()}
                  onClick={() => setColorPop(p => p==='text' ? null : 'text')} title="Màu chữ">
            <span className="dblk-tb-color-lbl">A</span>
            <span className="dblk-tb-color-bar" style={{ background:'#DC2626' }}/>
          </button>
          {colorPop === 'text' && (
            <div className="dblk-color-pop">
              {NOTE_TEXT_COLORS.map(col => (
                <button key={col} className="dblk-color-sw"
                        style={{ background: col, border: '1.5px solid rgba(0,0,0,0.1)' }}
                        onMouseDown={e => { e.preventDefault(); fmt('foreColor', col); setColorPop(null); }}/>
              ))}
            </div>
          )}
        </div>
        <div className="dblk-tb-color-wrap">
          <button className="dblk-tb-btn dblk-tb-color-btn" onMouseDown={e=>e.preventDefault()}
                  onClick={() => setColorPop(p => p==='hl' ? null : 'hl')} title="Tô nền">
            <i className="ti ti-highlight" style={{ fontSize: 13 }}/>
            <span className="dblk-tb-color-bar" style={{ background:'#FEF08A' }}/>
          </button>
          {colorPop === 'hl' && (
            <div className="dblk-color-pop">
              {NOTE_HL_COLORS.map(col => (
                <button key={col} className="dblk-color-sw"
                        style={{ background: col==='transparent'?'#fff':col, border:'1.5px solid rgba(0,0,0,0.1)' }}
                        onMouseDown={e => { e.preventDefault(); fmt('hiliteColor', col); setColorPop(null); }}>
                  {col === 'transparent' && <i className="ti ti-x" style={{ fontSize: 9, color:'#999' }}/>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="dblk-tb-sep"/>
        <button className="dblk-tb-btn" onMouseDown={e=>{e.preventDefault();fmt('formatBlock','pre')}} title="Code block"><i className="ti ti-code"/></button>
      </div>

      {/* Content area */}
      <div
        key={note.id}
        ref={edRef}
        className="pn-content"
        contentEditable
        suppressContentEditableWarning
        onInput={() => onUpdate('content', edRef.current.innerHTML)}
        onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); fmt(e.shiftKey ? 'outdent' : 'indent'); } }}
        data-placeholder="Bắt đầu viết ghi chú..."
      />
    </div>
  );
}

function NotesTab({ proj, onUpsert }) {
  const notes   = proj.noteCards || [];
  const [activeId,  setActiveId]  = useState(notes[0]?.id || null);
  const [query,     setQuery]     = useState('');

  function save(next) {
    onUpsert({ ...proj, noteCards: next, updatedAt: new Date().toISOString().slice(0, 10) });
  }

  function addNote() {
    const n = makeNote();
    save([n, ...notes]);
    setActiveId(n.id);
  }

  function updateNote(id, field, val) {
    save(notes.map(n => n.id === id
      ? { ...n, [field]: val, updatedAt: new Date().toISOString().slice(0, 16) }
      : n
    ));
  }

  async function deleteNote(id) {
    if (!await showConfirm('Xóa ghi chú này?')) return;
    const next = notes.filter(n => n.id !== id);
    save(next);
    setActiveId(next[0]?.id || null);
  }

  const filtered = notes.filter(n =>
    !query || n.title.toLowerCase().includes(query.toLowerCase()) ||
    n.content.toLowerCase().includes(query.toLowerCase())
  );
  const sorted = [
    ...filtered.filter(n => n.pinned),
    ...filtered.filter(n => !n.pinned),
  ];

  const activeNote = notes.find(n => n.id === activeId) || null;

  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  return (
    <div className="pn-wrap">
      {/* ── Sidebar ── */}
      <div className="pn-sidebar">
        <div className="pn-sidebar-head">
          <div className="pn-search-wrap">
            <i className="ti ti-search pn-search-icon"/>
            <input
              className="pn-search"
              placeholder="Tìm ghi chú..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button className="pn-add-btn" onClick={addNote} title="Thêm ghi chú">
            <i className="ti ti-plus"/>
          </button>
        </div>

        <div className="pn-list">
          {sorted.length === 0 && (
            <div className="pn-list-empty">
              {query ? 'Không tìm thấy ghi chú nào.' : 'Chưa có ghi chú nào.'}
            </div>
          )}
          {sorted.map(n => {
            const cm = NOTE_COLORS.find(c => c.key === (n.color || '')) || NOTE_COLORS[0];
            const preview = stripHtml(n.content).slice(0, 60);
            return (
              <button
                key={n.id}
                className={'pn-item' + (n.id === activeId ? ' active' : '')}
                onClick={() => setActiveId(n.id)}
              >
                <div className="pn-item-top">
                  <span className="pn-item-dot" style={{ background: cm.dot }}/>
                  <span className="pn-item-title">{n.title || 'Không có tiêu đề'}</span>
                  {n.pinned && <i className="ti ti-pin-filled pn-item-pin"/>}
                </div>
                {preview && <div className="pn-item-preview">{preview}</div>}
                <div className="pn-item-date">{n.updatedAt?.slice(0, 10)}</div>
              </button>
            );
          })}
        </div>

        {notes.length > 0 && (
          <div className="pn-sidebar-foot">
            {notes.length} ghi chú
          </div>
        )}
      </div>

      {/* ── Editor area ── */}
      {activeNote ? (
        <NoteEditor
          note={activeNote}
          onUpdate={(field, val) => updateNote(activeId, field, val)}
          onDelete={() => deleteNote(activeId)}
        />
      ) : (
        <div className="pn-editor-empty">
          <i className="ti ti-notes pn-editor-empty-icon"/>
          <p>Chọn một ghi chú hoặc</p>
          <button className="btn-primary" onClick={addNote}>
            <i className="ti ti-plus"/> Tạo ghi chú mới
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Changelog tab ── */
function ChangelogRow({ entry, idx, features, onUpdate, onRemove }) {
  const tm = CL_TYPES[entry.type]    || CL_TYPES.note;
  const sm = CL_STATUS[entry.status] || CL_STATUS.draft;

  function flatFeatures(list, parentId = null, depth = 0) {
    return list
      .filter(f => (f.parentId || null) === parentId)
      .flatMap(f => [
        { id: f.id, label: (depth > 0 ? '↳ '.repeat(depth) : '') + f.name },
        ...flatFeatures(list, f.id, depth + 1),
      ]);
  }
  const flat = flatFeatures(features);

  return (
    <tr className="pd-tr">
      <td className="pd-td pd-td--idx cl-td--stt">
        <span className="pd-idx">{idx + 1}</span>
      </td>
      <td className="pd-td cl-td--ver">
        <input className="pd-cell-input cl-ver-input" value={entry.version}
          onChange={e => onUpdate('version', e.target.value)} placeholder="1.0" />
      </td>
      <td className="pd-td cl-td--date">
        <input className="pd-cell-input pd-cell-input--date" type="date" value={entry.date}
          onChange={e => onUpdate('date', e.target.value)} />
      </td>
      <td className="pd-td cl-td--author">
        <input className="pd-cell-input" value={entry.author}
          onChange={e => onUpdate('author', e.target.value)} placeholder="Người thực hiện" />
      </td>
      <td className="pd-td cl-td--feat">
        <select className="pd-cell-input cl-feat-sel" value={entry.featureId || ''}
          onChange={e => onUpdate('featureId', e.target.value)}>
          <option value="">— Không chọn —</option>
          {flat.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </td>
      <td className="pd-td cl-td--desc">
        <input className="pd-cell-input pd-cell-input--name" value={entry.title}
          onChange={e => onUpdate('title', e.target.value)} placeholder="Nội dung thay đổi..." />
        <input className="pd-cell-input cl-desc-sub" value={entry.desc}
          onChange={e => onUpdate('desc', e.target.value)} placeholder="Chi tiết (tùy chọn)" />
      </td>
      <td className="pd-td cl-td--type">
        <select className="cl-badge-sel" value={entry.type}
          style={{ color: tm.color, background: tm.bg }}
          onChange={e => onUpdate('type', e.target.value)}>
          {Object.entries(CL_TYPES).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </td>
      <td className="pd-td cl-td--status">
        <select className="cl-badge-sel" value={entry.status}
          style={{ color: sm.color, background: sm.bg }}
          onChange={e => onUpdate('status', e.target.value)}>
          {Object.entries(CL_STATUS).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </td>
      <td className="pd-td pd-td--act">
        <button className="pd-act-btn pd-act-btn--del" onClick={onRemove} title="Xóa">
          <i className="ti ti-trash"/>
        </button>
      </td>
    </tr>
  );
}

function ChangelogTab({ proj, onUpsert, onAddEntry }) {
  const changelog = proj.changelog || [];
  const features  = proj.features  || [];
  const entries = [...changelog].sort((a, b) => b.date.localeCompare(a.date));

  function save(next) {
    onUpsert({ ...proj, changelog: next, updatedAt: new Date().toISOString().slice(0, 10) });
  }
  function add() {
    if (onAddEntry) { onAddEntry(); return; }
    save([makeCLEntry(changelog), ...changelog]);
  }
  function upd(id, field, val) {
    save(changelog.map(e => e.id === id ? { ...e, [field]: val } : e));
  }
  async function del(id) {
    if (!await showConfirm('Xóa mục lịch sử này?')) return;
    save(changelog.filter(e => e.id !== id));
  }

  return (
    <div className="cl-wrap">
      <div className="pd-tl-bar">
        <div className="pd-tl-bar-left">
          <h3 className="pd-tl-title">Lịch sử thay đổi dự án</h3>
          {entries.length > 0 && (
            <span className="pd-tl-live"><i className="ti ti-circle-filled"/> {entries.length} bản ghi</span>
          )}
        </div>
        <button className="btn-primary" onClick={add}>
          <i className="ti ti-plus"/> Thêm bản ghi
        </button>
      </div>

      <div className="cl-tl-wrap">
        {entries.length === 0 ? (
          <div className="cl-empty">
            <i className="ti ti-history cl-empty-icon"/>
            <p>Chưa có bản ghi nào.<br/>Nhấn <strong>Thêm bản ghi</strong> hoặc dùng nút <i className="ti ti-history"/> trên mỗi tính năng.</p>
          </div>
        ) : (
          <table className="pd-tl-table">
            <thead>
              <tr>
                <th className="pd-th cl-th--stt">#</th>
                <th className="pd-th cl-th--ver">Phiên bản</th>
                <th className="pd-th cl-th--date">Ngày</th>
                <th className="pd-th cl-th--author">Người thực hiện</th>
                <th className="pd-th cl-th--feat">Tính năng</th>
                <th className="pd-th cl-th--desc">Nội dung thay đổi</th>
                <th className="pd-th cl-th--type">Loại</th>
                <th className="pd-th cl-th--status">Trạng thái</th>
                <th className="pd-th pd-th--act"/>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <ChangelogRow key={e.id} entry={e} idx={i} features={features}
                  onUpdate={(field, val) => upd(e.id, field, val)}
                  onRemove={() => del(e.id)} />
              ))}
            </tbody>
          </table>
        )}
        <button className="pd-tl-add-row" onClick={add}>
          <i className="ti ti-plus"/> Thêm bản ghi
        </button>
      </div>
    </div>
  );
}
