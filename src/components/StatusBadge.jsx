import React from 'react';

/**
 * StatusBadge Component
 * 
 * Muestra visualmente el estado de conexión del dispositivo ESP32.
 * 
 * Props:
 * @param {'connected' | 'disconnected' | 'searching' | 'error'} status - Estado actual del dispositivo
 */
export default function StatusBadge({ status = 'disconnected' }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return { label: 'Conectado', className: 'status-connected', icon: '●' };
      case 'searching':
        return { label: 'Buscando...', className: 'status-searching', icon: '◌' };
      case 'error':
        return { label: 'Error de conexión', className: 'status-error', icon: '✖' };
      case 'disconnected':
      default:
        return { label: 'Desconectado', className: 'status-disconnected', icon: '○' };
    }
  };

  const { label, className, icon } = getStatusConfig();

  return (
    <span className={`status-badge ${className}`}>
      <span className="status-icon">{icon}</span>
      <span className="status-text">{label}</span>
    </span>
  );
}
