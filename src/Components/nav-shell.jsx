import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const NAV_ITEMS = [
  { key: 'dashboard',  icon: 'ti-layout-dashboard', label: 'Điều hành'   },
  { key: 'projects',   icon: 'ti-folder-open',       label: 'Dự án'       },
  { key: 'knowledge',  icon: 'ti-books',              label: 'Tri thức'    },
  { key: 'experience', icon: 'ti-award',              label: 'Kinh nghiệm' },
];

export function NavShell({ navSection, setNavSection, children }) {
  const { user, logout } = useAuth();
  const [expanded,   setExpanded]   = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [popPos,     setPopPos]     = useState(null);

  const avatarMenuRef = useRef(null);
  const avatarBtnRef  = useRef(null);

  const initials = user
    ? (user.displayName || user.email || '?')
        .split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const active = NAV_ITEMS.find(i => i.key === navSection);

  /* Close on outside click */
  useEffect(() => {
    if (!showLogout) return;
    function handler(e) {
      if (
        avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)
      ) {
        setShowLogout(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLogout]);

  function handleAvatarClick() {
    if (!showLogout && avatarBtnRef.current) {
      const r = avatarBtnRef.current.getBoundingClientRect();
      setPopPos({ left: r.left, bottom: window.innerHeight - r.top + 6 });
    }
    setShowLogout(s => !s);
  }

  return (
    <div className="nav-root">

      {/* ── Sidebar ── */}
      <aside className={'nav-sidebar' + (expanded ? ' nav-sidebar--exp' : '')}>

        {/* Top: logo + company + expand/collapse */}
        <div className="nav-sidebar-top">
          <div className="nav-logo-wrap">
            <div className="nav-logo-icon">
              <i className="ti ti-sparkles"/>
            </div>
            {expanded && (
              <div className="nav-logo-text">
                <span className="nav-logo-name">LUMI</span>
                <span className="nav-logo-sub">LUMINA CORE</span>
              </div>
            )}
          </div>
          <button className="nav-expand-btn"
                  onClick={() => setExpanded(e => !e)}
                  title={expanded ? 'Thu gọn' : 'Mở rộng'}>
            <i className={'ti ' + (expanded ? 'ti-chevrons-left' : 'ti-chevrons-right')}/>
          </button>
        </div>

        <nav className="nav-items">
          {NAV_ITEMS.map(item => (
            <button key={item.key}
                    className={'nav-item' + (navSection === item.key ? ' active' : '')}
                    onClick={() => setNavSection(item.key)}
                    title={item.label}>
              <i className={'ti ' + item.icon}/>
              {expanded && <span className="nav-item-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom: settings + avatar */}
        <div className="nav-sidebar-bot">
          <button className="nav-item" title="Cài đặt">
            <i className="ti ti-settings"/>
            {expanded && <span className="nav-item-label">Cài đặt</span>}
          </button>

          <div className="nav-avatar-menu" ref={avatarMenuRef}>
            <button className={'nav-avatar-btn' + (showLogout ? ' active' : '')}
                    ref={avatarBtnRef}
                    onClick={handleAvatarClick}
                    title="Tài khoản">
              {user?.photoURL
                ? <img src={user.photoURL} className="nav-avatar" referrerPolicy="no-referrer" alt=""/>
                : <div className="nav-avatar nav-avatar--init">{initials}</div>
              }
              {expanded && (
                <span className="nav-avatar-label">
                  {(user?.displayName || user?.email || '').split(' ').slice(-1)[0]}
                </span>
              )}
            </button>

            {/* Popup — fixed so it escapes overflow:hidden on sidebar */}
            {showLogout && popPos && (
              <div className="nav-logout-pop"
                   style={{ position: 'fixed', left: popPos.left, bottom: popPos.bottom }}>
                <div className="nav-logout-pop-name">
                  {user?.displayName || user?.email}
                </div>
                <button className="nav-logout-pop-btn"
                        onClick={() => { logout(); setShowLogout(false); }}>
                  <i className="ti ti-logout"/> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="nav-main" data-section={navSection}>
        <header className="nav-header">
          <div className="nav-header-section">{active?.label?.toUpperCase()}</div>

          <div className="nav-header-search">
            <i className="ti ti-search"/>
            <input placeholder="Tìm trong sổ tay..." readOnly/>
          </div>
        </header>

        <main className="nav-content">
          {children}
        </main>
      </div>
    </div>
  );
}
