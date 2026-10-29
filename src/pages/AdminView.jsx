import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupService, adminService } from '../services/groupService';
import './AdminView.css';

export default function AdminView() {
  const { token, logout } = useAuth();

  const [groups, setGroups]   = useState([]);
  const [users, setUsers]     = useState([]);
  const [tab, setTab]         = useState('groups'); // 'groups' | 'users'
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [gRes, uRes] = await Promise.all([
        groupService.getAllGroups(token),
        adminService.getAllUsers(token)
      ]);
      setGroups(gRes.groups);
      setUsers(uRes.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (token) loadData(); }, [token]);

  async function handleDeleteGroup(id) {
    if (!confirm('¿Eliminar este grupo y desvincular a todos sus miembros?')) return;
    try {
      await groupService.deleteGroup(token, id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteUser(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await adminService.deleteUser(token, id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="admin-view">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header__brand">
          <span>📡</span>
          <strong>GuiAR</strong>
          <span className="admin-badge">Admin</span>
        </div>
        <button className="btn-ghost" onClick={logout}>Salir</button>
      </header>

      {/* Tabs */}
      <nav className="admin-tabs">
        <button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}>
          👥 Grupos ({groups.length})
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          🧑 Usuarios ({users.length})
        </button>
      </nav>

      <div className="admin-content">
        {loading && <p className="admin-loading">Cargando…</p>}
        {error   && <p className="admin-error">⚠️ {error}</p>}

        {/* ── Grupos ── */}
        {tab === 'groups' && !loading && (
          <>
            <div className="admin-section-header">
              <h2>Grupos creados</h2>
              <button className="btn-ghost btn-sm" onClick={loadData}>🔄 Actualizar</button>
            </div>

            {groups.length === 0 ? (
              <p className="admin-empty">No hay grupos creados todavía.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Clave</th>
                      <th>Owner</th>
                      <th>Miembros</th>
                      <th>Creado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.id}>
                        <td><strong>{g.name}</strong></td>
                        <td><code className="key-code">{g.joinKey}</code></td>
                        <td>{g.owner?.displayName || g.owner?.email || '—'}</td>
                        <td className="td-center">{g._count?.members ?? '—'}</td>
                        <td className="td-muted">{new Date(g.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn-danger-sm"
                            onClick={() => handleDeleteGroup(g.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Usuarios ── */}
        {tab === 'users' && !loading && (
          <>
            <div className="admin-section-header">
              <h2>Usuarios registrados</h2>
              <button className="btn-ghost btn-sm" onClick={loadData}>🔄 Actualizar</button>
            </div>

            {users.length === 0 ? (
              <p className="admin-empty">No hay usuarios registrados todavía.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Grupo</th>
                      <th>Registrado</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.displayName}</strong></td>
                        <td className="td-muted">{u.email || '—'}</td>
                        <td>
                          <span className={`role-badge role-badge--${u.role.toLowerCase()}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.group?.name || <span className="td-muted">Sin grupo</span>}</td>
                        <td className="td-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn-danger-sm"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
