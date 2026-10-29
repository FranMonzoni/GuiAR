import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null); // usuario Firebase
  const [dbUser, setDbUser]             = useState(null); // usuario en SQLite
  const [token, setToken]               = useState(null); // Firebase ID Token
  const [loading, setLoading]           = useState(true);

  // Observador de estado de Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        // Sincronizar con el backend (crea el usuario en SQLite si no existe)
        await syncWithBackend(idToken);
      } else {
        setFirebaseUser(null);
        setDbUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function syncWithBackend(idToken) {
    try {
      const res = await fetch(`${API}/api/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      }
    } catch (err) {
      console.error('[AuthContext] Error sincronizando con backend:', err);
    }
  }

  /**
   * Obtiene un token fresco (Firebase renueva automáticamente, pero esto fuerza refresh)
   */
  async function getFreshToken() {
    if (!auth.currentUser) return null;
    const idToken = await auth.currentUser.getIdToken(true);
    setToken(idToken);
    return idToken;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    await syncWithBackend(idToken);
    return cred.user;
  }

  async function register(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    await syncWithBackend(idToken);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
    setFirebaseUser(null);
    setDbUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      user: dbUser,       // alias conveniente para la app
      dbUser,
      token,
      loading,
      login,
      register,
      logout,
      getFreshToken,
      syncWithBackend
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
