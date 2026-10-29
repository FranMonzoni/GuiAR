import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import AuthPage from './pages/AuthPage';
import UserView from './pages/UserView';
import AdminView from './pages/AdminView';

function Loading() {
  return (
    <div className="app-loading">
      <span className="spinner" aria-hidden="true" />
      Cargando…
    </div>
  );
}

/** Requiere sesión iniciada. */
function PrivateRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <Loading />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  return children;
}

/** Solo sin sesión (login/registro). */
function GuestRoute({ children }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <Loading />;
  if (firebaseUser) return <Navigate to="/" replace />;
  return children;
}

/** Solo usuarios con rol ADMIN. */
function AdminRoute({ children }) {
  const { firebaseUser, user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<GuestRoute><AuthPage /></GuestRoute>} />
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
          <Route path="/admin" element={<AdminRoute><AdminView /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
