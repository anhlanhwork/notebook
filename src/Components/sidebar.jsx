/* Sidebar: top bar of the module + flat list of nav items.
   Per the spec, sub-sections (Models / Luồng / etc.) do NOT appear here —
   they're tabs inside each feature page. */

function Sidebar({ mod, selection, onSelect, onAddFeature, onRenameFeature, onDeleteFeature, onBackToModules }) {
  return (
    <aside className="sb">
      <button className="sb-back" onClick={onBackToModules}>
        <i className="ti ti-arrow-left"></i>
        <span>Tất cả modules</span>
      </button>
      <div className="sb-modhd">
        <div className="sb-modhd-dot" style={{ background: mod.color }}></div>
        <div className="sb-modhd-name">{mod.name}</div>
        <code className="sb-modhd-tech">{mod.tech}</code>
      </div>

      <nav className="sb-nav">
        <div className="sb-section-lbl">Module</div>
        <button
          className={"sb-item" + (selection.type === "overview" ? " active" : "")}
          onClick={() => onSelect({ type: "overview" })}
        >
          <i className="ti ti-layout-board"></i>
          <span>Tổng quan module</span>
        </button>
        <button
          className={"sb-item" + (selection.type === "mainflow" ? " active" : "")}
          onClick={() => onSelect({ type: "mainflow" })}
        >
          <i className="ti ti-git-branch"></i>
          <span>Luồng chính</span>
        </button>

        <div className="sb-section-lbl sb-section-lbl-row">
          <span>Tính năng</span>
          <span className="sb-chip">{mod.features.length}</span>
        </div>

        <div className="sb-features">
          {mod.features.map((f, i) => (
            <div
              key={f.id}
              className={"sb-feat" + (selection.type === "feature" && selection.featId === f.id ? " active" : "")}
              onClick={() => onSelect({ type: "feature", featId: f.id })}
            >
              <span className="sb-feat-num">{i + 1}</span>
              <div className="sb-feat-body">
                <div className="sb-feat-name">{f.name}</div>
                {f.desc && <div className="sb-feat-desc">{f.desc}</div>}
              </div>
              <div className="sb-feat-actions" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => onRenameFeature(f.id)} title="Đổi tên">
                  <i className="ti ti-edit"></i>
                </button>
                <button onClick={() => onDeleteFeature(f.id)} title="Xóa">
                  <i className="ti ti-trash"></i>
                </button>
              </div>
            </div>
          ))}
          <button className="sb-add-feat" onClick={onAddFeature}>
            <i className="ti ti-plus"></i> Thêm tính năng
          </button>
        </div>

        <div className="sb-section-lbl">Khác</div>
        <button className="sb-item sb-item-disabled" disabled>
          <i className="ti ti-history"></i>
          <span>Lịch sử thay đổi</span>
          <span className="sb-soon">sớm</span>
        </button>
        <button className="sb-item sb-item-disabled" disabled>
          <i className="ti ti-share"></i>
          <span>Chia sẻ sổ tay</span>
          <span className="sb-soon">sớm</span>
        </button>
      </nav>

      <div className="sb-footer">
        <div className="sb-foot-line">Odoo 18 · Sổ tay nội bộ</div>
        <div className="sb-foot-line sb-foot-line-sub">Cập nhật lần cuối hôm nay</div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
