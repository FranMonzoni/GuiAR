/** "hace 12 s", "hace 3 min", "hace 2 h", o la fecha si es de otro día. */
export function timeAgo(date, now = Date.now()) {
  if (!date) return 'sin datos';
  const t = new Date(date).getTime();
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 10) return 'ahora';
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(date).toLocaleDateString();
}

export function formatDate(date) {
  return date ? new Date(date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function formatDateTime(date) {
  return date
    ? new Date(date).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';
}

/** Ubicación "vieja": más de 2 minutos sin actualizar. */
export const STALE_MS = 2 * 60 * 1000;
export const isStale = (date, now = Date.now()) => !date || now - new Date(date).getTime() > STALE_MS;

const PALETTE = ['#2563eb', '#db2777', '#059669', '#d97706', '#7c3aed', '#0891b2', '#dc2626', '#4d7c0f'];

/** Color estable por usuario (mismo color en el mapa y en la lista). */
export function colorFor(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function initials(name = '?') {
  const parts = name.trim().split(/\s+/);
  // Por caracteres y no por índice, para no partir un emoji al medio
  const first = (word = '') => [...word][0] || '';
  return ((first(parts[0]) || '?') + first(parts[1])).toUpperCase();
}

/** Distancia en metros entre dos puntos (haversine). */
export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function formatDistance(m) {
  if (m == null) return '';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}
