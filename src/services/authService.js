const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const authService = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  register: (username, password, email) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password, email }) }),

  me: (token) =>
    request('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
};
