import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../firebase.js';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

/* Chỉ email này mới được đăng nhập */
const ALLOWED_EMAIL = 'anhlanh.work@gmail.com';

function isAllowed(email) {
  return typeof email === 'string' && email.toLowerCase() === ALLOWED_EMAIL;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(undefined);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      if (u && !isAllowed(u.email)) {
        await signOut(auth);
        setUser(null);
        setAuthError('auth/email-not-allowed');
        return;
      }
      setUser(u || null);
    });
  }, []);

  async function signInGoogle() {
    setAuthError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      /* Việc kiểm tra email xảy ra trong onAuthStateChanged ở trên */
    } catch (e) {
      if (e.code === 'auth/popup-closed-by-user') return;
      console.error('Auth error:', e.code, e.message);
      setAuthError(e.code);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading: user === undefined,
      authError,
      signInGoogle,
      logout: () => signOut(auth)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
