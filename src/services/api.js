/**
 * api.js — toda la comunicación HTTP con el backend de GuiAR.
 * Los componentes nunca hacen fetch() directo: usan los contextos, que usan este archivo.
 *
 * El token de Firebase se obtiene en cada request con getIdToken(), que lo
 * renueva solo cuando está por vencer (dura 1 h).
 */
import { auth } from '../firebase/firebase';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');
export const WS_URL = (import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, 'ws')).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function getToken() {
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authenticated) {
    const token = await getToken();
    if (!token) throw new ApiError('Sesión no iniciada.', 401, 'NO_TOKEN');
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.', 0, 'NETWORK');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Error ${res.status}`, res.status, data.code);
  return data;
}

export const authApi = {
  me: () => request('/api/auth/me'),
  updateMe: (displayName) => request('/api/auth/me', { method: 'PATCH', body: { displayName } })
};

export const groupApi = {
  getMine: () => request('/api/groups/me'),
  create: (name) => request('/api/groups', { method: 'POST', body: { name } }),
  join: (code) => request('/api/groups/join', { method: 'POST', body: { code } }),
  rename: (name) => request('/api/groups/me', { method: 'PATCH', body: { name } }),
  leave: () => request('/api/groups/me/leave', { method: 'POST' }),
  regenerateCode: () => request('/api/groups/me/invite-code', { method: 'POST' }),
  kick: (userId) => request(`/api/groups/me/members/${userId}`, { method: 'DELETE' }),
  locations: () => request('/api/groups/me/locations')
};

export const adminApi = {
  stats: () => request('/api/admin/stats'),
  groups: (search = '') => request(`/api/admin/groups?search=${encodeURIComponent(search)}`),
  group: (id) => request(`/api/admin/groups/${id}`),
  deleteGroup: (id) => request(`/api/admin/groups/${id}`, { method: 'DELETE' }),
  users: (search = '') => request(`/api/admin/users?search=${encodeURIComponent(search)}`),
  setRole: (id, role) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: { role } }),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: 'DELETE' })
};
