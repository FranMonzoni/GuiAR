import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import './GroupPanel.css';

export default function GroupPanel({ onGroupUpdate }) {
  const { group, createGroup, joinGroup } = useGroup();
  const { user } = useAuth();

  const [mode, setMode]       = useState(''); // '' | 'create' | 'join'
  const [groupName, setGroupName] = useState('');
  const [joinKey, setJoinKey] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createGroup(groupName.trim());
      if (onGroupUpdate) onGroupUpdate();
      setMode('');
      setGroupName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await joinGroup(joinKey.trim().toUpperCase());
      if (onGroupUpdate) onGroupUpdate();
      setMode('');
      setJoinKey('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyJoinKey() {
    navigator.clipboard.writeText(group.joinKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Si el usuario ya tiene grupo ─────────────────────────────────────────────
  if (group) {
    const isOwner = group.owner?.id === user?.id;

    return (
      <div className="group-panel">
        <div className="group-panel__header">
          <h2>{group.name}</h2>
          <span className="group-badge">{group._count?.members ?? group.members?.length ?? '—'} miembros</span>
        </div>

        <div className="group-info">
          <div className="group-info__row">
            <span className="group-info__label">ID del grupo</span>
            <code className="group-info__value">{group.id}</code>
          </div>

          <div className="group-info__row">
            <span className="group-info__label">Clave de invitación / cifrado</span>
            <div className="joinkey-box">
              <code className="joinkey">{group.joinKey}</code>
              <button className="btn-copy" onClick={copyJoinKey}>
                {copied ? '✅ Copiado' : '📋 Copiar'}
              </button>
            </div>
            <small className="group-info__hint">
              Compartí esta clave para que otros se unan. También es la clave de cifrado de la app ESP32.
            </small>
          </div>

          {isOwner && (
            <div className="group-info__row">
              <span className="group-info__label owner-badge">👑 Sos el administrador del grupo</span>
            </div>
          )}
        </div>

        <h3 className="members-title">Miembros</h3>
        <ul className="members-list">
          {group.members?.map((m) => (
            <li key={m.id} className="member-item">
              <span className="member-avatar">👤</span>
              <span className="member-name">{m.displayName}</span>
              {m.email && <span className="member-email">{m.email}</span>}
              {m.id === group.owner?.id && <span className="member-role">owner</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ── Sin grupo ─────────────────────────────────────────────────────────────────
  return (
    <div className="group-panel">
      {mode === '' && (
        <>
          <h2>Unirse o crear un grupo</h2>
          <p className="group-panel__desc">
            Los grupos conectan a usuarios que comparten dispositivos ESP32.
            La clave del grupo se usa para cifrar los datos en la app.
          </p>
          <div className="group-actions">
            <button className="btn-primary" onClick={() => setMode('create')}>
              ➕ Crear nuevo grupo
            </button>
            <button className="btn-secondary" onClick={() => setMode('join')}>
              🔑 Unirse con clave
            </button>
          </div>
        </>
      )}

      {mode === 'create' && (
        <form onSubmit={handleCreate} className="group-form">
          <h2>Crear grupo</h2>
          <div className="form-group">
            <label>Nombre del grupo</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Equipo Alpha"
              required
            />
          </div>
          {error && <p className="form-error">⚠️ {error}</p>}
          <div className="form-buttons">
            <button type="button" className="btn-ghost" onClick={() => { setMode(''); setError(''); }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando…' : 'Crear grupo'}
            </button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="group-form">
          <h2>Unirse a un grupo</h2>
          <div className="form-group">
            <label>Clave del grupo</label>
            <input
              type="text"
              value={joinKey}
              onChange={(e) => setJoinKey(e.target.value)}
              placeholder="Ej: A3F2B9C1"
              maxLength={8}
              required
            />
          </div>
          {error && <p className="form-error">⚠️ {error}</p>}
          <div className="form-buttons">
            <button type="button" className="btn-ghost" onClick={() => { setMode(''); setError(''); }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Uniéndose…' : 'Unirse'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
