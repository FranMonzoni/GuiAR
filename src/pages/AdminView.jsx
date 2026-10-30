import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import AppHeader from '../components/AppHeader';
import { formatDate, formatDateTime, timeAgo } from '../utils/format';
import './AdminView.css';

/**
 * Panel de administración: grupos y usuarios.
 * Por diseño NO muestra ubicaciones ni claves de cifrado (el backend tampoco las envía).
 */

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat__value">{value ?? '—'}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

function GroupDetail({ id, onClose, onDeleted }) {
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.group(id).then((d) => setGroup(d.group)).catch((e) => setError(e.message));
  }, [id]);

  async function remove() {
    if (!confirm(`¿Eliminar "${group.name}"? Los ${group.members.length} miembros quedan sin grupo y se borra su historial.`)) return;
    try {
      await adminApi.deleteGroup(id);
      onDeleted(id);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <aside className="drawer card">
      <div className="row-between">
        <h2>{group?.name || 'Grupo'}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cerrar</button>
      </div>
      {error && <p className="alert alert-error">{error}</p>}
      {!group && !error && <p className="muted">Cargando…</p>}
      {group && (
        <>
          <dl className="detail-list">
            <dt>ID</dt><dd><code className="mono-sm">{group.id}</code></dd>
            <dt>Creado</dt><dd>{formatDateTime(group.createdAt)}</dd>
            <dt>Última actividad</dt><dd>{group.lastActivityAt ? timeAgo(group.lastActivityAt) : 'Nunca'}</dd>
          </dl>
          <h3>Miembros ({group.members.length})</h3>
          <ul className="plain-list">
            {group.members.map((m) => (
              <li key={m.id} className="row-between">
                <span>
                  <span className={`presence ${m.online ? 'is-on' : ''}`} aria-label={m.online ? 'en línea' : 'desconectado'} />
                  {m.displayName} {m.isOwner && <span className="tag">creador</span>}
                  <span className="muted small block">{m.email}</span>
                </span>
                <span className="muted small">{formatDate(m.joinedAt)}</span>
              </li>
            ))}
          </ul>
          <p className="muted small">Las ubicaciones de los grupos son privadas y no se muestran en este panel.</p>
          <button className="btn btn-danger-outline btn-block" onClick={remove}>Eliminar grupo</button>
        </>
      )}
    </aside>
  );
}

function GroupsTab({ onChange }) {
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const lastRequest = useRef(0);

  const load = useCallback(() => {
    const request = ++lastRequest.current;
    adminApi.groups(q)
      .then((d) => { if (request === lastRequest.current) { setGroups(d.groups); setError(''); } })
      .catch((e) => { if (request === lastRequest.current) setError(e.message); });
  }, [q]);
  useEffect(load, [load]);

  function handleDeleted(id) {
    setSelected(null);
    setGroups((gs) => gs.filter((g) => g.id !== id));
    onChange();
  }

  return (
    <div className={`admin-split ${selected ? 'has-drawer' : ''}`}>
      <div className="card table-card">
        <div className="toolbar">
          <input className="input" placeholder="Buscar por nombre, ID o email del creador" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={load}>Actualizar</button>
        </div>
        {error && <p className="alert alert-error">{error}</p>}
        {groups && groups.length === 0 && <p className="empty">{q ? 'Sin resultados.' : 'Todavía no hay grupos.'}</p>}
        {groups && groups.length > 0 && (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr><th>Grupo</th><th>Creador</th><th className="num">Miembros</th><th className="num">En línea</th><th>Actividad</th><th>Creado</th></tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id} className={selected === g.id ? 'is-selected' : ''} onClick={() => setSelected(g.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelected(g.id)}>
                    <td><strong>{g.name}</strong><span className="muted small block mono-sm">{g.id}</span></td>
                    <td data-label="Creador"><span>{g.owner?.displayName}<span className="muted small block">{g.owner?.email}</span></span></td>
                    <td className="num" data-label="Miembros">{g.memberCount}</td>
                    <td className="num" data-label="En línea">{g.onlineCount > 0 ? <span className="pill pill-live">{g.onlineCount}</span> : <span className="muted">0</span>}</td>
                    <td className="muted" data-label="Actividad">{g.lastActivityAt ? timeAgo(g.lastActivityAt) : 'Nunca'}</td>
                    <td className="muted" data-label="Creado">{formatDate(g.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && <GroupDetail key={selected} id={selected} onClose={() => setSelected(null)} onDeleted={handleDeleted} />}
    </div>
  );
}

function UsersTab({ onChange }) {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const q = useDebounced(search);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');

  const lastRequest = useRef(0);

  const load = useCallback(() => {
    const request = ++lastRequest.current;
    adminApi.users(q)
      .then((d) => { if (request === lastRequest.current) { setUsers(d.users); setError(''); } })
      .catch((e) => { if (request === lastRequest.current) setError(e.message); });
  }, [q]);
  useEffect(load, [load]);

  async function toggleRole(u) {
    const role = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(role === 'ADMIN' ? `¿Hacer admin a ${u.email}?` : `¿Quitarle el rol de admin a ${u.email}?`)) return;
    try {
      await adminApi.setRole(u.id, role);
      setUsers((us) => us.map((x) => (x.id === u.id ? { ...x, role } : x)));
      onChange();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(u) {
    if (!confirm(`¿Eliminar la cuenta de ${u.email}? Se borra también en Firebase y no se puede deshacer.`)) return;
    try {
      await adminApi.deleteUser(u.id);
      setUsers((us) => us.filter((x) => x.id !== u.id));
      onChange();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="card table-card">
      <div className="toolbar">
        <input className="input" placeholder="Buscar por nombre o email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-ghost btn-sm" onClick={load}>Actualizar</button>
      </div>
      {error && <p className="alert alert-error">{error}</p>}
      {users && users.length === 0 && <p className="empty">Sin resultados.</p>}
      {users && users.length > 0 && (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Usuario</th><th>Rol</th><th>Grupo</th><th>Registrado</th><th aria-label="Acciones" /></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.displayName}</strong><span className="muted small block">{u.email || '—'}</span></td>
                  <td data-label="Rol"><span className={`pill ${u.role === 'ADMIN' ? 'pill-admin' : ''}`}>{u.role === 'ADMIN' ? 'Admin' : 'Usuario'}</span></td>
                  <td data-label="Grupo">{u.group?.name || <span className="muted">Sin grupo</span>}</td>
                  <td className="muted" data-label="Registrado">{formatDate(u.createdAt)}</td>
                  <td className="actions">
                    {u.id !== me?.id && (
                      <>
                        <button className="btn btn-link small" onClick={() => toggleRole(u)}>{u.role === 'ADMIN' ? 'Quitar admin' : 'Hacer admin'}</button>
                        <button className="btn btn-link btn-danger-text small" onClick={() => remove(u)}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminView() {
  const [tab, setTab] = useState('groups');
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(() => {
    adminApi.stats().then(setStats).catch(() => {});
  }, []);
  useEffect(() => {
    loadStats();
    const id = setInterval(loadStats, 15000);
    return () => clearInterval(id);
  }, [loadStats]);

  return (
    <div className="page">
      <AppHeader subtitle="Administración" />
      <main className="admin">
        <div className="stats">
          <Stat label="Grupos" value={stats?.groups} />
          <Stat label="Usuarios" value={stats?.users} />
          <Stat label="Sin grupo" value={stats?.usersWithoutGroup} />
          <Stat label="Conexiones en vivo" value={stats?.connections} />
        </div>

        <div className="segmented">
          <button className={tab === 'groups' ? 'is-active' : ''} onClick={() => setTab('groups')}>Grupos</button>
          <button className={tab === 'users' ? 'is-active' : ''} onClick={() => setTab('users')}>Usuarios</button>
        </div>

        {tab === 'groups' ? <GroupsTab onChange={loadStats} /> : <UsersTab onChange={loadStats} />}
      </main>
    </div>
  );
}
