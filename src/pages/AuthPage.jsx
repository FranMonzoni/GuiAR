import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function friendlyError(code) {
    const map = {
      'auth/user-not-found':       'No existe una cuenta con ese email.',
      'auth/wrong-password':       'Contraseña incorrecta.',
      'auth/email-already-in-use': 'Ese email ya está registrado.',
      'auth/invalid-email':        'El formato del email no es válido.',
      'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
      'auth/too-many-requests':    'Demasiados intentos. Intentá más tarde.',
      'auth/invalid-credential':   'Email o contraseña incorrectos.'
    };
    return map[code] || 'Ocurrió un error. Intentá de nuevo.';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">📡</span>
          <h1>GuiAR</h1>
          <p className="auth-subtitle">Sistema de localización ESP32</p>
        </div>

        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Iniciar sesión
          </button>
          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              required
            />
          </div>

          {error && <p className="auth-error">⚠️ {error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading
              ? 'Cargando...'
              : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          Los datos de tu ESP32 viajan de forma segura a través del grupo.
        </p>
      </div>
    </div>
  );
}
