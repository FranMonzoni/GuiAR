import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import AuthPage from './pages/AuthPage';
import UserView from './pages/UserView';
import AdminView from './pages/AdminView';

/**
 * Ruta protegida: redirige a /login si no hay usuario autenticado.
 */
function PrivateRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <div className="app-loading">Cargando…</div>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <div className="app-loading">Cargando…</div>;
  if (firebaseUser) return <Navigate to="/" replace />;
  return children;
}

/**
 * Ruta de admin: solo para usuarios con role "ADMIN".
 */
function AdminRoute({ children }) {
  const { firebaseUser, user, loading } = useAuth();
  if (loading) return <div className="app-loading">Cargando…</div>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <AuthPage />
          </GuestRoute>
        }
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <GroupProvider>
              <UserView />
            </GroupProvider>
          </PrivateRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminView />
          </AdminRoute>
        }
      />

      {/* Ruta fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
