import { useState } from 'react';
import { useGroup } from '../context/GroupContext';

/**
 * Pantalla para quien todavía no tiene grupo: crear uno o unirse con un código.
 * Cada persona puede estar en un solo grupo a la vez.
 */
export default function GroupSetup() {
  const { createGroup, joinGroup } = useGroup();
  const [mode, setMode] = useState('join'); // 'join' | 'create'
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function switchMode(next) {
    setMode(next);
    setValue('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'join') await joinGroup(value);
      else await createGroup(value.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="setup">
      <div className="card setup-card">
        <h1 className="setup-title">Sumate a un grupo</h1>
        <p className="muted">
          Los miembros de un grupo se ven en el mapa y sus GuiAR se apuntan entre sí.
          Podés estar en un solo grupo a la vez.
        </p>

        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={mode === 'join'} className={mode === 'join' ? 'is-active' : ''} onClick={() => switchMode('join')}>
            Tengo un código
          </button>
          <button role="tab" aria-selected={mode === 'create'} className={mode === 'create' ? 'is-active' : ''} onClick={() => switchMode('create')}>
            Crear grupo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          {mode === 'join' ? (
            <label className="field">
              <span>Código de invitación</span>
              <input
                className="input input-code"
                value={value}
                onChange={(e) => setValue(e.target.value.toUpperCase())}
                placeholder="K7P3QX9M"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={12}
                required
                autoFocus
              />
              <small className="muted">Pedíselo a quien creó el grupo.</small>
            </label>
          ) : (
            <label className="field">
              <span>Nombre del grupo</span>
              <input
                className="input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ej: Cosquín Rock 2027"
                maxLength={60}
                required
                autoFocus
              />
              <small className="muted">Vas a recibir un código para invitar al resto.</small>
            </label>
          )}

          {error && <p className="alert alert-error">{error}</p>}

          <button className="btn btn-primary btn-block" disabled={busy || !value.trim()}>
            {busy ? 'Un momento…' : mode === 'join' ? 'Unirme' : 'Crear grupo'}
          </button>
        </form>
      </div>
    </div>
  );
}
