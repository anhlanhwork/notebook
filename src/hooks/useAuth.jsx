import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../firebase.js';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = đang kiểm tra

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u || null));
  }, []);

  async function signInGoogle() {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') console.error('Auth error:', e);
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading: user === undefined,
      signInGoogle,
      logout: () => signOut(auth)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
