import { useState, useEffect, useRef } from 'react';

let _open = null;

export function showConfirm(message, { danger = true } = {}) {
  return new Promise(resolve => {
    _open?.({ type: 'confirm', message, danger, resolve });
  });
}

export function showPrompt(message, defaultValue = '') {
  return new Promise(resolve => {
    _open?.({ type: 'prompt', message, defaultValue, resolve });
  });
}

export function DialogHost() {
  const [dlg, setDlg] = useState(null);
  const inputRef = useRef(null);
  const [inputVal, setInputVal] = useState('');

  _open = (d) => {
    setInputVal(d.defaultValue || '');
    setDlg(d);
  };

  useEffect(() => {
    if (dlg?.type === 'prompt') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [dlg]);

  useEffect(() => {
    if (!dlg) return;
    function onKey(e) {
      if (e.key === 'Escape') close(null);
      if (e.key === 'Enter' && dlg.type === 'prompt') submit();
      if (e.key === 'Enter' && dlg.type === 'confirm') close(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function close(val) {
    dlg?.resolve(val);
    setDlg(null);
  }

  function submit() {
    const v = inputVal.trim();
    close(v || null);
  }

  if (!dlg) return null;

  return (
    <div className="dlg-overlay" onClick={e => e.target === e.currentTarget && close(null)}>
      <div className="dlg-box">
        {dlg.type === 'confirm' && (
          <>
            <div className={`dlg-icon-wrap ${dlg.danger ? 'dlg-icon-wrap--danger' : 'dlg-icon-wrap--warn'}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </div>
            <p className="dlg-msg">{dlg.message}</p>
            <div className="dlg-footer">
              <button className="dlg-btn dlg-btn--cancel" onClick={() => close(false)}>Huỷ</button>
              <button className="dlg-btn dlg-btn--danger" onClick={() => close(true)}>Xoá</button>
            </div>
          </>
        )}
        {dlg.type === 'prompt' && (
          <>
            <p className="dlg-msg">{dlg.message}</p>
            <input
              ref={inputRef}
              className="dlg-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
            <div className="dlg-footer">
              <button className="dlg-btn dlg-btn--cancel" onClick={() => close(null)}>Huỷ</button>
              <button className="dlg-btn dlg-btn--ok" onClick={submit}>OK</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
