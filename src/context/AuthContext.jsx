import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

/**
 * Sesión del usuario.
 *  - firebaseUser: sesión de Firebase (existe apenas inicia sesión)
 *  - user:         usuario del backend (rol, grupo…). Se carga después.
 *  - loading:      true hasta saber si hay sesión y cargar el usuario
 */
export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
      setSyncError(null);
      return data.user;
    } catch (err) {
      setSyncError(err.message);
      return null;
    }
  }, []);

  useEffect(() => {
    // Se carga el usuario del backend ANTES de marcar la sesión como iniciada,
    // así las rutas nunca ven "sesión sí, usuario no" (rol/grupo desconocidos).
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) await refreshUser();
      else setUser(null);
      setFirebaseUser(fbUser);
      setLoading(false);
    });
  }, [refreshUser]);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
      await authApi.updateMe(displayName).then((d) => setUser(d.user)).catch(() => {});
    }
  }

  async function updateName(displayName) {
    const data = await authApi.updateMe(displayName);
    setUser(data.user);
  }

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        syncError,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
        resetPassword,
        refreshUser,
        updateName
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
