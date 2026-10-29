import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import CopyButton from './CopyButton';

/** Datos del grupo: código de invitación, ID, clave de cifrado y acciones del owner. */
export default function GroupSettings() {
  const { user } = useAuth();
  const { group, isOwner, regenerateCode, renameGroup, kickMember, leaveGroup } = useGroup();
  const [showKey, setShowKey] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  async function act(key, fn) {
    setError('');
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const onRegenerate = () => {
    if (!confirm('El código actual va a dejar de funcionar. Los miembros actuales siguen en el grupo. ¿Generar uno nuevo?')) return;
    act('code', regenerateCode);
  };

  const onKick = (m) => {
    if (!confirm(`¿Quitar a ${m.displayName} del grupo? Se borran sus ubicaciones.`)) return;
    act(`kick-${m.id}`, () => kickMember(m.id));
  };

  const onLeave = () => {
    const alone = group.members.length === 1;
    const msg = alone
      ? 'Sos el único miembro: el grupo se va a eliminar. ¿Continuar?'
      : isOwner
        ? 'Sos el creador: el miembro más antiguo pasa a administrar el grupo. ¿Salir?'
        : '¿Salir del grupo? Se borran tus ubicaciones compartidas.';
    if (confirm(msg)) act('leave', leaveGroup);
  };

  const onRename = (e) => {
    e.preventDefault();
    act('rename', async () => {
      await renameGroup(name);
      setEditingName(false);
    });
  };

  return (
    <div className="settings stack">
      {error && <p className="alert alert-error">{error}</p>}

      <section className="settings-block">
        <h3>Invitar</h3>
        <div className="invite-code">
          <code>{group.inviteCode.replace(/(.{4})/, '$1 ')}</code>
          <CopyButton value={group.inviteCode} />
        </div>
        <p className="muted small">Quien tenga este código puede unirse.</p>
        {isOwner && (
          <button className="btn btn-link small" onClick={onRegenerate} disabled={busy === 'code'}>
            {busy === 'code' ? 'Generando…' : 'Generar código nuevo'}
          </button>
        )}
      </section>

      <section className="settings-block">
        <h3>Datos para la app y la ESP32</h3>
        <div className="kv">
          <span>ID del grupo</span>
          <div className="kv-value">
            <code className="mono-sm">{group.id}</code>
            <CopyButton value={group.id} />
          </div>
        </div>
        <div className="kv">
          <span>Clave de cifrado (AES-256)</span>
          <div className="kv-value">
            <code className="mono-sm">{showKey ? group.encryptionKey : '•'.repeat(16)}</code>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowKey((v) => !v)}>{showKey ? 'Ocultar' : 'Ver'}</button>
            <CopyButton value={group.encryptionKey} />
          </div>
        </div>
        <p className="muted small">
          La clave es secreta y solo la ven los miembros. La usan la app y las GuiAR para cifrar lo que se mandan por LoRa.
        </p>
      </section>

      <section className="settings-block">
        <div className="row-between">
          <h3>Nombre</h3>
          {isOwner && !editingName && <button className="btn btn-link small" onClick={() => setEditingName(true)}>Editar</button>}
        </div>
        {editingName ? (
          <form className="row" onSubmit={onRename}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
            <button className="btn btn-primary btn-sm" disabled={busy === 'rename' || !name.trim()}>Guardar</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingName(false); setName(group.name); }}>Cancelar</button>
          </form>
        ) : (
          <p>{group.name}</p>
        )}
      </section>

      <section className="settings-block">
        <h3>Miembros ({group.members.length})</h3>
        <ul className="plain-list">
          {group.members.map((m) => (
            <li key={m.id} className="row-between">
              <span>
                {m.displayName}{m.id === user?.id && <span className="muted"> (vos)</span>}
                {m.isOwner && <span className="tag">creador</span>}
              </span>
              {isOwner && m.id !== user?.id && (
                <button className="btn btn-link btn-danger-text small" onClick={() => onKick(m)} disabled={busy === `kick-${m.id}`}>
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <button className="btn btn-danger-outline btn-block" onClick={onLeave} disabled={busy === 'leave'}>
        {busy === 'leave' ? 'Saliendo…' : 'Salir del grupo'}
      </button>
    </div>
  );
}
