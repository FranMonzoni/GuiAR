import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import CopyButton from './CopyButton';
import { timeAgo } from '../utils/format';

/** Datos del grupo: código de invitación, ID, clave de cifrado y acciones del owner. */
export default function GroupSettings() {
  const { user } = useAuth();
  const { group, devices, isOwner, regenerateCode, rotateKey, renameGroup, kickMember, unlinkDevice, leaveGroup } = useGroup();
  const myDevice = user ? devices[user.id] : null;
  const enc = group.encryption;
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

  const onRotate = () => {
    if (!confirm('Se genera una clave nueva. Todas las pulseras del grupo tienen que recibirla desde la app. ¿Continuar?')) return;
    act('rotate', rotateKey);
  };

  const onUnlink = () => {
    if (!confirm(`¿Desvincular la pulsera ${myDevice.deviceId}? La próxima pulsera que mande datos desde tu cuenta queda vinculada.`)) return;
    act('unlink', unlinkDevice);
  };

  const onKick = (m) => {
    if (!confirm(`¿Quitar a ${m.displayName} del grupo? Se borran sus ubicaciones y se renueva la clave de cifrado.`)) return;
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
      await renameGroup(name.trim());
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
        {enc && (
          <div className="kv">
            <span>Clave de cifrado ({enc.algorithm}, {enc.encoding}) · versión {enc.keyVersion}</span>
            <div className="kv-value">
              <code className="mono-sm">{showKey ? enc.key : '•'.repeat(16)}</code>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowKey((v) => !v)}>{showKey ? 'Ocultar' : 'Ver'}</button>
              <CopyButton value={enc.key} />
            </div>
          </div>
        )}
        <p className="muted small">
          La clave es secreta y solo la ven los miembros. La app la pasa a cada pulsera para cifrar lo que se mandan por LoRa.
          Se renueva sola cuando alguien sale o es quitado del grupo{enc?.rotatedAt ? ` (última vez ${timeAgo(enc.rotatedAt)})` : ''}.
        </p>
        {isOwner && (
          <button className="btn btn-link small" onClick={onRotate} disabled={busy === 'rotate'}>
            {busy === 'rotate' ? 'Renovando…' : 'Renovar clave ahora'}
          </button>
        )}
      </section>

      <section className="settings-block">
        <h3>Mi pulsera</h3>
        {myDevice ? (
          <>
            <div className="kv">
              <span>ID de la pulsera</span>
              <div className="kv-value">
                <code className="mono-sm">{myDevice.deviceId}</code>
              </div>
            </div>
            <p className="muted small">
              {[myDevice.name, myDevice.firmware && `firmware ${myDevice.firmware}`, myDevice.lastSeenAt && `último dato ${timeAgo(myDevice.lastSeenAt)}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p className="muted small">Cada cuenta puede tener una sola pulsera. Para usar otra, desvinculá esta primero.</p>
            <button className="btn btn-link btn-danger-text small" onClick={onUnlink} disabled={busy === 'unlink'}>
              {busy === 'unlink' ? 'Desvinculando…' : 'Desvincular pulsera'}
            </button>
          </>
        ) : (
          <p className="muted small">
            Sin pulsera vinculada. Se vincula sola cuando la app manda el primer dato con su ID.
          </p>
        )}
      </section>

      <section className="settings-block">
        <div className="row-between">
          <h3>Nombre</h3>
          {isOwner && !editingName && <button className="btn btn-link small" onClick={() => { setName(group.name); setEditingName(true); }}>Editar</button>}
        </div>
        {editingName ? (
          <form className="row" onSubmit={onRename}>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
            <button className="btn btn-primary btn-sm" disabled={busy === 'rename' || !name.trim()}>Guardar</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>Cancelar</button>
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
