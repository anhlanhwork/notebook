import { useState, useRef, useEffect } from 'react';
import { showConfirm } from './dialog.jsx';

const STORAGE_KEY = 'exp_v1';

const EXP_TYPES = {
  lesson:       { label: 'Bài học',       icon: 'ti-bulb',           color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)'  },
  pitfall:      { label: 'Cạm bẫy',       icon: 'ti-alert-triangle', color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.35)'   },
  bestpractice: { label: 'Best Practice',  icon: 'ti-star',           color: '#5BAA50', bg: 'rgba(91,170,80,0.12)',   border: 'rgba(91,170,80,0.35)'   },
  success:      { label: 'Thành công',    icon: 'ti-trophy',          color: '#1D9E75', bg: 'rgba(29,158,117,0.12)',  border: 'rgba(29,158,117,0.35)'  },
};

const EXP_CATS = {
  technical: { label: 'Kỹ thuật',      color: '#378ADD' },
  business:  { label: 'Nghiệp vụ',     color: '#8B5CF6' },
  process:   { label: 'Quy trình',     color: '#F59E0B' },
  customer:  { label: 'Khách hàng',    color: '#EF4444' },
  team:      { label: 'Nhóm làm việc', color: '#1D9E75' },
};

const EXP_IMPACT = {
  low:      { label: 'Thấp',         color: '#9CA3AF' },
  medium:   { label: 'Trung bình',   color: '#3B82F6' },
  high:     { label: 'Cao',          color: '#F59E0B' },
  critical: { label: 'Nghiêm trọng', color: '#EF4444' },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeExp() {
  return {
    id:         'exp_' + Math.random().toString(36).slice(2, 9),
    title:      '',
    type:       'lesson',
    category:   'technical',
    impact:     'medium',
    tags:       [],
    content:    '',
    projectRef: '',
    author:     '',
    createdAt:  today(),
    updatedAt:  today(),
  };
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export function ExperienceScreen({ projects = [] }) {
  const [experiences, setExperiences] = useState(load);
  const [activeId, setActiveId]       = useState(null);
  const [typeFilter, setTypeFilter]   = useState('all');
  const [query, setQuery]             = useState('');
  const [tagInput, setTagInput]       = useState('');
  const edRef = useRef(null);

  const active = experiences.find(e => e.id === activeId) || null;

  function save(next) {
    setExperiences(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addExp() {
    const e = makeExp();
    save([e, ...experiences]);
    setActiveId(e.id);
  }

  function updateExp(id, field, val) {
    save(experiences.map(e => e.id === id ? { ...e, [field]: val, updatedAt: today() } : e));
  }

  async function deleteExp(id) {
    const ok = await showConfirm('Xoá bài học này?');
    if (!ok) return;
    const next = experiences.filter(e => e.id !== id);
    save(next);
    if (activeId === id) setActiveId(next[0]?.id || null);
  }

  const filtered = experiences
    .filter(e => typeFilter === 'all' || e.type === typeFilter)
    .filter(e => {
      if (!query) return true;
      const q = query.toLowerCase();
      return e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q)) ||
        e.projectRef.toLowerCase().includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  useEffect(() => {
    if (!edRef.current || !active) return;
    edRef.current.innerHTML = active.content || '';
  }, [active?.id]);

  function execCmd(cmd, val = null) {
    document.execCommand(cmd, false, val);
    edRef.current?.focus();
  }

  function addTag(e) {
    if (e.key !== 'Enter') return;
    const t = tagInput.trim();
    if (!t || !active) return;
    if (!active.tags.includes(t)) {
      updateExp(active.id, 'tags', [...active.tags, t]);
    }
    setTagInput('');
  }

  function removeTag(t) {
    if (!active) return;
    updateExp(active.id, 'tags', active.tags.filter(x => x !== t));
  }

  const counts = Object.fromEntries(
    Object.keys(EXP_TYPES).map(k => [k, experiences.filter(e => e.type === k).length])
  );

  return (
    <div className="exp-screen">
      <div className="exp-hero">
        <div className="exp-hero-left">
          <span className="exp-hero-eyebrow">Kinh nghiệm & Bài học</span>
          <h1 className="exp-hero-title">Lessons Learned</h1>
          <p className="exp-hero-sub">Ghi lại những bài học, cạm bẫy và thành công từ thực tế dự án.</p>
        </div>
        <div className="exp-hero-right">
          {Object.entries(EXP_TYPES).map(([k, v]) => (
            <div key={k} className="exp-stat-chip" style={{ background: v.bg, border: `1px solid ${v.border}` }}>
              <i className={`ti ${v.icon}`} style={{ color: v.color, fontSize: 15 }}/>
              <span className="exp-stat-count" style={{ color: v.color }}>{counts[k]}</span>
              <span className="exp-stat-label">{v.label}</span>
            </div>
          ))}
          <button className="exp-hero-btn" onClick={addExp}>
            <i className="ti ti-plus"/> Thêm bài học
          </button>
        </div>
      </div>

      <div className="exp-body">
        <aside className="exp-sidebar">
          <div className="exp-sb-head">
            <div className="exp-search-wrap">
              <i className="ti ti-search exp-search-icon"/>
              <input
                className="exp-search"
                placeholder="Tìm kiếm..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button className="exp-add-btn" onClick={addExp} title="Thêm mới">
              <i className="ti ti-plus"/>
            </button>
          </div>

          <div className="exp-type-tabs">
            <button
              className={'exp-type-tab' + (typeFilter === 'all' ? ' exp-type-tab--active' : '')}
              onClick={() => setTypeFilter('all')}
            >
              Tất cả <span className="exp-tab-count">{experiences.length}</span>
            </button>
            {Object.entries(EXP_TYPES).map(([k, v]) => (
              <button
                key={k}
                className={'exp-type-tab' + (typeFilter === k ? ' exp-type-tab--active' : '')}
                style={typeFilter === k ? { color: v.color, borderBottomColor: v.color } : {}}
                onClick={() => setTypeFilter(k)}
              >
                {v.label} <span className="exp-tab-count">{counts[k]}</span>
              </button>
            ))}
          </div>

          <div className="exp-list">
            {filtered.length === 0 && (
              <div className="exp-list-empty">
                <i className="ti ti-mood-empty"/>
                <span>{query || typeFilter !== 'all' ? 'Không tìm thấy kết quả' : 'Chưa có bài học nào.\nBấm + để thêm mới.'}</span>
              </div>
            )}
            {filtered.map(e => {
              const t = EXP_TYPES[e.type];
              const c = EXP_CATS[e.category];
              return (
                <div
                  key={e.id}
                  className={'exp-item' + (activeId === e.id ? ' exp-item--active' : '')}
                  onClick={() => setActiveId(e.id)}
                >
                  <div className="exp-item-dot" style={{ background: t.color }}/>
                  <div className="exp-item-body">
                    <div className="exp-item-title">{e.title || 'Chưa có tiêu đề'}</div>
                    <div className="exp-item-meta">
                      <span className="exp-item-cat" style={{ color: c.color }}>{c.label}</span>
                      <span className="exp-item-date">{fmtDate(e.updatedAt)}</span>
                    </div>
                  </div>
                  <i className={`ti ${t.icon} exp-item-icon`} style={{ color: t.color }}/>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="exp-detail-wrap">
          {!active ? (
            <div className="exp-empty-state">
              <i className="ti ti-notebook exp-empty-icon"/>
              <p>Chọn một bài học hoặc tạo mới</p>
            </div>
          ) : (
            <div className="exp-detail">
              <div className="exp-detail-head">
                <div className="exp-breadcrumb">
                  <span style={{ color: EXP_TYPES[active.type].color }}>{EXP_TYPES[active.type].label}</span>
                  <i className="ti ti-chevron-right" style={{ fontSize: 11, opacity: 0.5 }}/>
                  <span style={{ color: EXP_CATS[active.category].color }}>{EXP_CATS[active.category].label}</span>
                </div>
                <button className="exp-delete-btn" onClick={() => deleteExp(active.id)}>
                  <i className="ti ti-trash"/>
                </button>
              </div>

              <input
                className="exp-title-input"
                value={active.title}
                onChange={e => updateExp(active.id, 'title', e.target.value)}
                placeholder="Tiêu đề bài học..."
              />

              <div className="exp-meta-row">
                <label className="exp-meta-field">
                  <span className="exp-meta-label">Loại</span>
                  <select
                    className="exp-meta-select"
                    value={active.type}
                    style={{ color: EXP_TYPES[active.type].color }}
                    onChange={e => updateExp(active.id, 'type', e.target.value)}
                  >
                    {Object.entries(EXP_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </label>

                <label className="exp-meta-field">
                  <span className="exp-meta-label">Danh mục</span>
                  <select
                    className="exp-meta-select"
                    value={active.category}
                    style={{ color: EXP_CATS[active.category].color }}
                    onChange={e => updateExp(active.id, 'category', e.target.value)}
                  >
                    {Object.entries(EXP_CATS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </label>

                <label className="exp-meta-field">
                  <span className="exp-meta-label">Mức độ</span>
                  <select
                    className="exp-meta-select"
                    value={active.impact}
                    style={{ color: EXP_IMPACT[active.impact].color }}
                    onChange={e => updateExp(active.id, 'impact', e.target.value)}
                  >
                    {Object.entries(EXP_IMPACT).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </label>

                <label className="exp-meta-field">
                  <span className="exp-meta-label">Tác giả</span>
                  <input
                    className="exp-meta-input"
                    value={active.author}
                    placeholder="Tên..."
                    onChange={e => updateExp(active.id, 'author', e.target.value)}
                  />
                </label>

                <label className="exp-meta-field">
                  <span className="exp-meta-label"><i className="ti ti-building" style={{ fontSize: 12 }}/> Dự án</span>
                  <input
                    className="exp-meta-input"
                    value={active.projectRef}
                    placeholder="Tên dự án..."
                    onChange={e => updateExp(active.id, 'projectRef', e.target.value)}
                  />
                </label>

                <div className="exp-meta-field">
                  <span className="exp-meta-label">Ngày tạo</span>
                  <span className="exp-meta-date">{fmtDate(active.createdAt)}</span>
                </div>
              </div>

              <div className="exp-tags-row">
                {active.tags.map(t => (
                  <span key={t} className="exp-tag">
                    {t}
                    <button className="exp-tag-rm" onClick={() => removeTag(t)}>×</button>
                  </span>
                ))}
                <input
                  className="exp-tag-input"
                  placeholder="Thêm tag, Enter để xác nhận"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                />
              </div>

              <div className="exp-toolbar">
                <button className="exp-tb-btn" title="Bold" onMouseDown={e => { e.preventDefault(); execCmd('bold'); }}><b>B</b></button>
                <button className="exp-tb-btn" title="Italic" onMouseDown={e => { e.preventDefault(); execCmd('italic'); }}><i style={{ fontStyle: 'italic' }}>I</i></button>
                <button className="exp-tb-btn" title="Underline" onMouseDown={e => { e.preventDefault(); execCmd('underline'); }}><u>U</u></button>
                <button className="exp-tb-btn" title="Strikethrough" onMouseDown={e => { e.preventDefault(); execCmd('strikeThrough'); }}><s>S</s></button>
                <span className="exp-tb-sep"/>
                <button className="exp-tb-btn" title="Ordered list" onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }}><i className="ti ti-list-numbers"/></button>
                <button className="exp-tb-btn" title="Unordered list" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}><i className="ti ti-list"/></button>
                <span className="exp-tb-sep"/>
                <button className="exp-tb-btn" title="Code block" onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'pre'); }}><i className="ti ti-code"/></button>
              </div>

              <div
                key={active.id}
                ref={edRef}
                className="exp-content"
                contentEditable
                suppressContentEditableWarning
                onInput={() => updateExp(active.id, 'content', edRef.current.innerHTML)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
