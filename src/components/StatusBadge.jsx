/**
 * Indicador de estado de conexión.
 * @param {'connected' | 'disconnected' | 'searching' | 'error'} status
 * @param {string} [label] texto opcional (si no, se usa uno por defecto)
 */
const CONFIG = {
  connected: 'Conectado',
  searching: 'Buscando…',
  error: 'Error de conexión',
  disconnected: 'Desconectado'
};

export default function StatusBadge({ status = 'disconnected', label }) {
  const text = label || CONFIG[status] || CONFIG.disconnected;
  return (
    <span className={`status-badge status-${status}`} title={text}>
      <span className="status-dot" aria-hidden="true" />
      <span className="status-badge__label">{text}</span>
    </span>
  );
}
