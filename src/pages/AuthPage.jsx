import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const FIREBASE_ERRORS = {
  'auth/user-not-found': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ese email ya está registrado.',
  'auth/invalid-email': 'El formato del email no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Probá más tarde.',
  'auth/network-request-failed': 'Sin conexión. Revisá tu internet.'
};

export default function AuthPage() {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function switchMode(next) {
    setMode(next);
    setError('');
    setInfo('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else if (mode === 'register') await register(form.email, form.password, form.name.trim());
      else {
        await resetPassword(form.email);
        setInfo('Si el email está registrado, te llegó un link para elegir una contraseña nueva.');
      }
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-brand">
          <span className="auth-ring" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
          </span>
          <h1>GuiAR</h1>
          <p className="muted">Encontrá a tu grupo, aunque no haya señal.</p>
        </div>

        {mode !== 'reset' && (
          <div className="segmented segmented--full">
            <button className={mode === 'login' ? 'is-active' : ''} onClick={() => switchMode('login')}>Iniciar sesión</button>
            <button className={mode === 'register' ? 'is-active' : ''} onClick={() => switchMode('register')}>Crear cuenta</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack">
          {mode === 'reset' && (
            <div>
              <h2 className="auth-h2">Recuperar contraseña</h2>
              <p className="muted small">Te mandamos un link por email.</p>
            </div>
          )}

          {mode === 'register' && (
            <label className="field">
              <span>Nombre</span>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Cómo te ve tu grupo" maxLength={60} autoComplete="nickname" />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="tu@email.com" autoComplete="email" required />
          </label>

          {mode !== 'reset' && (
            <label className="field">
              <span>Contraseña</span>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Mínimo 6 caracteres"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </label>
          )}

          {error && <p className="alert alert-error">{error}</p>}
          {info && <p className="alert alert-info">{info}</p>}

          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Enviar link'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' && <button className="btn btn-link small" onClick={() => switchMode('reset')}>¿Olvidaste tu contraseña?</button>}
          {mode === 'reset' && <button className="btn btn-link small" onClick={() => switchMode('login')}>← Volver</button>}
        </div>
      </div>
    </div>
  );
}
