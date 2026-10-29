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
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" aria-hidden="true" />
      {label || CONFIG[status] || CONFIG.disconnected}
    </span>
  );
}
