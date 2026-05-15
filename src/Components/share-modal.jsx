/* Share modal — 3 roles: private / viewer / editor */

import React, { useState } from 'react';
import { db } from '../../firebase.js';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth.jsx';

const ROLE_CONFIG = [
  {
    id: "private",
    icon: "ti-lock",
    label: "Cá nhân",
    desc: "Chỉ bạn mới có thể xem và chỉnh sửa"
  },
  {
    id: "viewer",
    icon: "ti-eye",
    label: "Người xem",
    desc: "Người có link có thể xem, không thể chỉnh sửa"
  },
  {
    id: "editor",
    icon: "ti-pencil",
    label: "Người chỉnh sửa",
    desc: "Người có link có thể xem và chỉnh sửa nội dung"
  }
];

function genToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function ShareModal({ item, type, onUpdate, onClose }) {
  const { user, signInGoogle } = useAuth();
  const [role, setRole]     = useState(item.shareRole || "private");
  const [token, setToken]   = useState(item.shareToken || null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = token ? `${window.location.origin}/share/${token}` : null;

  async function applyRole(newRole) {
    if (newRole === role) return;

    if (newRole !== "private" && !user) {
      await signInGoogle();
      return;
    }

    setSaving(true);
    try {
      if (newRole === "private") {
        if (token) await deleteDoc(doc(db, "shares", token));
        setToken(null);
        setRole("private");
        onUpdate({ ...item, shareRole: "private", shareToken: null });
      } else {
        const newToken = token || genToken();
        await setDoc(doc(db, "shares", newToken), {
          type,
          role: newRole,
          ownerId:   user.uid,
          ownerEmail: user.email,
          ownerName:  user.displayName || user.email,
          title:    item.name,
          snapshot: item,
          updatedAt: serverTimestamp(),
          ...(token ? {} : { createdAt: serverTimestamp() })
        }, { merge: true });
        setToken(newToken);
        setRole(newRole);
        onUpdate({ ...item, shareRole: newRole, shareToken: newToken });
      }
    } catch (e) {
      console.error("Share error:", e);
    }
    setSaving(false);
  }

  async function refreshSnapshot() {
    if (!token || !user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "shares", token), {
        snapshot: item,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const typeLabel = type === "notebook" ? "sổ tay" : "module";

  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal share-modal">
        <div className="modal-head">
          <h3><i className="ti ti-share"></i> Chia sẻ {typeLabel}</h3>
          <button onClick={onClose}><i className="ti ti-x"></i></button>
        </div>

        <div className="share-item-name">
          <i className={`ti ${type === "notebook" ? "ti-book" : "ti-cube"}`}></i>
          <span>{item.name}</span>
        </div>

        <div className="share-label-row">
          <span className="share-label">Quyền truy cập</span>
          {!user && (
            <span className="share-login-hint">
              <i className="ti ti-alert-circle"></i> Cần đăng nhập để chia sẻ
            </span>
          )}
        </div>

        <div className="share-roles">
          {ROLE_CONFIG.map(r => (
            <button
              key={r.id}
              className={`share-role${role === r.id ? " active" : ""}${saving ? " disabled" : ""}`}
              onClick={() => applyRole(r.id)}
              disabled={saving}
            >
              <div className={`share-role-icon share-role-icon--${r.id}`}>
                <i className={`ti ${r.icon}`}></i>
              </div>
              <div className="share-role-text">
                <div className="share-role-label">{r.label}</div>
                <div className="share-role-desc">{r.desc}</div>
              </div>
              {role === r.id && <i className="ti ti-check share-role-check"></i>}
            </button>
          ))}
        </div>

        {role !== "private" && user && (
          <div className="share-link-section">
            {saving ? (
              <div className="share-saving">
                <i className="ti ti-loader-2 spin"></i> Đang lưu...
              </div>
            ) : shareUrl ? (
              <>
                <span className="share-label">Link chia sẻ</span>
                <div className="share-link-row">
                  <input
                    className="share-link-input"
                    readOnly
                    value={shareUrl}
                    onClick={e => e.target.select()}
                  />
                  <button
                    className={`share-copy-btn${copied ? " copied" : ""}`}
                    onClick={copyLink}
                  >
                    <i className={`ti ${copied ? "ti-check" : "ti-copy"}`}></i>
                    {copied ? "Đã sao chép" : "Sao chép"}
                  </button>
                </div>
                <div className="share-link-actions">
                  <div className="share-link-hint">
                    <i className="ti ti-info-circle"></i>
                    {role === "viewer"
                      ? "Người có link chỉ có thể xem, không thể sửa"
                      : "Người có link có thể xem và chỉnh sửa nội dung"}
                  </div>
                  <button className="share-refresh-btn" onClick={refreshSnapshot} disabled={saving}>
                    <i className="ti ti-refresh"></i> Cập nhật nội dung
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {role !== "private" && !user && (
          <div className="share-need-login">
            <p>Đăng nhập để tạo và quản lý link chia sẻ</p>
            <button className="btn-primary" onClick={signInGoogle}>
              <i className="ti ti-brand-google"></i> Đăng nhập với Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
