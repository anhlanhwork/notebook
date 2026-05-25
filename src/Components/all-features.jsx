/* All-features aggregation screen — shows every feature across all notebooks/modules */

import React, { useState, useMemo } from 'react';

function AllFeaturesScreen({ data, onOpenFeature, onBack }) {
  const [query,    setQuery]    = useState('');
  const [nbFilter, setNbFilter] = useState('all');

  /* Flatten all features with notebook + module context */
  const allFeatures = useMemo(() => {
    const result = [];
    for (const nb of data.notebooks || []) {
      for (const mod of nb.modules || []) {
        for (const feat of mod.features || []) {
          result.push({
            ...feat,
            notebookId:    nb.id,
            notebookName:  nb.name,
            notebookColor: nb.color || '#5BAA50',
            moduleId:      mod.id,
            moduleName:    mod.name,
            moduleColor:   mod.color || '#5BAA50',
            moduleStatus:  mod.status,
          });
        }
      }
    }
    return result;
  }, [data]);

  const filtered = useMemo(() => {
    return allFeatures.filter(f => {
      if (nbFilter !== 'all' && f.notebookId !== nbFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return f.name.toLowerCase().includes(q) ||
             (f.desc || '').toLowerCase().includes(q) ||
             f.moduleName.toLowerCase().includes(q) ||
             f.notebookName.toLowerCase().includes(q);
    });
  }, [allFeatures, query, nbFilter]);

  /* Summary stats */
  const totalModels = allFeatures.reduce((s, f) => s + (f.models?.cards?.length || 0), 0);
  const totalFlows  = allFeatures.reduce((s, f) => s + (f.flows?.length || 0), 0);
  const totalInteg  = allFeatures.reduce((s, f) => s + (f.integrations?.length || 0), 0);
  const totalBlocks = allFeatures.reduce((s, f) => s + (f.detailBlocks?.length || 0), 0);

  const notebooks = (data.notebooks || []).filter(nb =>
    allFeatures.some(f => f.notebookId === nb.id)
  );

  return (
    <div className="af-screen">

      {/* ── Hero ── */}
      <div className="af-hero">
        <div className="af-hero-inner">

          {/* Breadcrumb */}
          <div className="af-hero-nav">
            <button className="bc-link af-bc-btn" onClick={onBack}>Thư viện sổ tay</button>
            <i className="ti ti-chevron-right af-bc-sep"/>
            <span className="af-bc-cur">Tổng hợp tính năng</span>
          </div>

          {/* Title */}
          <div className="af-hero-top">
            <div className="af-hero-left">
              <h1 className="af-title">
                <span className="af-title-icon"><i className="ti ti-list-check"/></span>
                Tổng hợp tính năng
              </h1>
              <p className="af-sub">
                {allFeatures.length} tính năng · {data.notebooks?.length || 0} sổ tay
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="af-stats-bar">
            <div className="af-stat-item">
              <b>{allFeatures.length}</b><span>Tính năng</span>
            </div>
            <div className="af-stat-sep"/>
            <div className="af-stat-item">
              <b>{totalModels}</b><span>Models</span>
            </div>
            <div className="af-stat-sep"/>
            <div className="af-stat-item">
              <b>{totalFlows}</b><span>Luồng</span>
            </div>
            <div className="af-stat-sep"/>
            <div className="af-stat-item">
              <b>{totalBlocks}</b><span>Chi tiết</span>
            </div>
            <div className="af-stat-sep"/>
            <div className="af-stat-item">
              <b>{totalInteg}</b><span>Tích hợp</span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="af-toolbar">
            <div className="af-toolbar-left">
              <div className="ml-search af-search">
                <i className="ti ti-search"/>
                <input
                  placeholder="Tìm tính năng, module, mô tả..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                {query && (
                  <button onClick={() => setQuery('')}><i className="ti ti-x"/></button>
                )}
              </div>

              <div className="af-nb-filters">
                <button
                  className={'af-nb-pill' + (nbFilter === 'all' ? ' active' : '')}
                  onClick={() => setNbFilter('all')}
                >
                  Tất cả
                  <span className="ml-filter-count">{allFeatures.length}</span>
                </button>
                {notebooks.map(nb => {
                  const cnt = allFeatures.filter(f => f.notebookId === nb.id).length;
                  return (
                    <button
                      key={nb.id}
                      className={'af-nb-pill' + (nbFilter === nb.id ? ' active' : '')}
                      onClick={() => setNbFilter(nb.id)}
                    >
                      <span className="af-nb-dot" style={{ background: nb.color || '#5BAA50' }}/>
                      {nb.name}
                      <span className="ml-filter-count">{cnt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="af-body">
        <div className="af-table">

          {/* Header */}
          <div className="af-thead">
            <div className="af-tc af-tc-num">#</div>
            <div className="af-tc af-tc-nb">Sổ tay · Module</div>
            <div className="af-tc af-tc-name">Tên tính năng</div>
            <div className="af-tc af-tc-desc">Mô tả</div>
            <div className="af-tc af-tc-cnt" title="Models"><i className="ti ti-table"/></div>
            <div className="af-tc af-tc-cnt" title="Luồng"><i className="ti ti-git-branch"/></div>
            <div className="af-tc af-tc-cnt" title="Chi tiết"><i className="ti ti-list-details"/></div>
            <div className="af-tc af-tc-cnt" title="Tích hợp"><i className="ti ti-plug-connected"/></div>
            <div className="af-tc af-tc-end"/>
          </div>

          {/* Body */}
          {filtered.length === 0 ? (
            <div className="clt-empty">
              <i className="ti ti-puzzle-off"/>
              <p>Không tìm thấy tính năng nào{query ? ` cho "${query}"` : ''}.</p>
            </div>
          ) : (
            filtered.map((f, i) => (
              <div
                key={f.notebookId + '-' + f.moduleId + '-' + f.id}
                className="af-row"
                onClick={() => onOpenFeature(f.moduleId, f.id)}
              >
                <div className="af-tc af-tc-num af-row-num">{i + 1}</div>

                <div className="af-tc af-tc-nb af-row-nb">
                  <span className="af-nb-dot" style={{ background: f.notebookColor }}/>
                  <div className="af-row-nb-text">
                    <div className="af-row-nb-name">{f.notebookName}</div>
                    <div className="af-row-mod-name">{f.moduleName}</div>
                  </div>
                </div>

                <div className="af-tc af-tc-name af-row-feat-name">{f.name}</div>

                <div className="af-tc af-tc-desc af-row-desc">
                  {f.desc || <span className="af-empty-val">—</span>}
                </div>

                <div className="af-tc af-tc-cnt af-row-cnt">
                  <b>{f.models?.cards?.length || 0}</b>
                </div>
                <div className="af-tc af-tc-cnt af-row-cnt">
                  <b>{f.flows?.length || 0}</b>
                </div>
                <div className="af-tc af-tc-cnt af-row-cnt">
                  <b>{f.detailBlocks?.length || 0}</b>
                </div>
                <div className="af-tc af-tc-cnt af-row-cnt">
                  <b>{f.integrations?.length || 0}</b>
                </div>

                <div className="af-tc af-tc-end">
                  <i className="ti ti-chevron-right af-row-chev"/>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AllFeaturesScreen;
