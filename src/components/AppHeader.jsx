import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Encabezado común a la vista de usuario y al panel de administración.
 * `children` se muestra a la derecha (ej: estado de la conexión en vivo).
 */
export default function AppHeader({ subtitle, children }) {
  const { user, firebaseUser, isAdmin, logout } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M12 5.5 15 13h-6z" fill="currentColor" /></svg>
        </span>
        <span className="brand-name">GuiAR</span>
        {subtitle && <span className="brand-sub">{subtitle}</span>}
      </Link>

      <div className="app-header__right">
        {children}
        {isAdmin && (
          <nav className="header-nav">
            <NavLink to="/" end>Mapa</NavLink>
            <NavLink to="/admin">Admin</NavLink>
          </nav>
        )}
        <span className="header-user" title={user?.email || firebaseUser?.email}>
          {user?.displayName || firebaseUser?.email}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Salir</button>
      </div>
    </header>
  );
}
