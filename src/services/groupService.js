const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function req(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

export const groupService = {
  getMyGroup:      (token)          => req('/api/groups/me', token),
  createGroup:     (token, name)    => req('/api/groups', token, { method: 'POST', body: JSON.stringify({ name }) }),
  joinGroup:       (token, joinKey) => req('/api/groups/join', token, { method: 'POST', body: JSON.stringify({ joinKey }) }),
  getMyLocations:  (token)          => req('/api/groups/me/locations', token),
  getAllGroups:     (token)          => req('/api/groups', token),
  deleteGroup:     (token, id)      => req(`/api/groups/${id}`, token, { method: 'DELETE' }),
  getGroupLocations: (token, id)    => req(`/api/groups/${id}/locations`, token)
};

export const adminService = {
  getAllUsers: (token)     => req('/api/users', token),
  deleteUser:  (token, id) => req(`/api/users/${id}`, token, { method: 'DELETE' })
};
