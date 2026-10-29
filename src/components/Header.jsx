import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { useDevice } from '../context/DeviceContext';

/**
 * Header Component
 * 
 * Estructura base del encabezado principal de GuiAR Web.
 * Muestra el logo/nombre, la navegación principal, el estado de conexión
 * e información básica del dispositivo desde el DeviceContext.
 */
export default function Header() {
  const { connectionStatus, device } = useDevice();
  const location = useLocation();

  return (
    <header className="main-header">
      <div className="header-brand">
        <Link to="/" className="brand-logo-link">
          <span className="brand-icon">🧭</span>
          <span className="brand-name">GuiAR</span>
        </Link>
        <span className="brand-subtitle">Navegación Asistida ESP32</span>
      </div>

      <nav className="header-nav">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Usuario
        </Link>
        <Link 
          to="/admin" 
          className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
        >
          Administración
        </Link>
      </nav>

      <div className="header-status">
        <div className="device-info-mini">
          <span className="device-name-mini">{device?.name || 'ESP32'}</span>
          <span className="device-ip-mini">{device?.ip || 'IP no asignada'}</span>
        </div>
        <StatusBadge status={connectionStatus} />
      </div>
    </header>
  );
}
