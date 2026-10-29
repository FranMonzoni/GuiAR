import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import GroupPanel from '../components/GroupPanel';
import StatusBadge from '../components/StatusBadge';
import './UserView.css';

// Fix ícono Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const DEFAULT_CENTER = [-34.6037, -58.3816];

export default function UserView() {
  const { user, logout }                                       = useAuth();
  const { group, groupLoading, memberLocations, wsStatus, fetchGroup } = useGroup();
  const [tab, setTab] = useState('map');

  const locations = Object.entries(memberLocations)
    .filter(([, loc]) => loc.latitude !== null)
    .map(([userId, loc]) => ({ userId, ...loc }));

  const mapCenter = locations.length > 0
    ? [locations[0].latitude, locations[0].longitude]
    : DEFAULT_CENTER;

  const wsStatusBadge =
    wsStatus === 'connected'  ? 'connected'    :
    wsStatus === 'connecting' ? 'searching'    : 'disconnected';

  return (
    <div className="user-view">
      {/* Header */}
      <header className="uv-header">
        <div className="uv-header__brand">
          <span>📡</span>
          <strong>GuiAR</strong>
          {group && <span className="uv-group-name">— {group.name}</span>}
        </div>
        <div className="uv-header__right">
          <StatusBadge status={wsStatusBadge} />
          <span className="uv-email">{user?.email}</span>
          <button className="btn-ghost" onClick={logout}>Salir</button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="uv-tabs">
        <button className={tab === 'map'   ? 'active' : ''} onClick={() => setTab('map')}>🗺️ Mapa</button>
        <button className={tab === 'group' ? 'active' : ''} onClick={() => setTab('group')}>👥 Mi grupo</button>
      </nav>

      {/* Sin grupo */}
      {!group && !groupLoading && (
        <div className="uv-no-group">
          <p>No pertenecés a ningún grupo todavía.</p>
          <button className="btn-primary" onClick={() => setTab('group')}>
            Crear o unirse a un grupo →
          </button>
        </div>
      )}

      {/* Tab Mapa */}
      {tab === 'map' && group && (
        <div className="uv-map-section">
          <div className="uv-map-bar">
            <span className={`ws-dot ws-dot--${wsStatus}`} />
            <span>
              {wsStatus === 'connected'  ? 'En vivo' :
               wsStatus === 'connecting' ? 'Conectando…' : 'Sin conexión en tiempo real'}
            </span>
            <span className="uv-map-bar__members">
              {locations.length} miembro{locations.length !== 1 ? 's' : ''} en el mapa
            </span>
          </div>

          <MapContainer center={mapCenter} zoom={14} className="leaflet-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc) => (
              <Marker key={loc.userId} position={[loc.latitude, loc.longitude]}>
                <Popup>
                  <strong>{loc.displayName}</strong><br />
                  📍 {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}<br />
                  📟 Dispositivo: {loc.deviceId}<br />
                  {loc.battery  != null && <>🔋 Batería: {loc.battery}%<br /></>}
                  {loc.timestamp && <>🕐 {new Date(loc.timestamp).toLocaleTimeString()}</>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {locations.length === 0 && (
            <div className="uv-map-empty">
              <p>Ningún miembro ha enviado su ubicación todavía.</p>
              <small>La ubicación llega desde la app móvil conectada a la ESP32.</small>
            </div>
          )}
        </div>
      )}

      {/* Tab Grupo */}
      {tab === 'group' && (
        <div className="uv-group-tab">
          <GroupPanel onGroupUpdate={fetchGroup} />
        </div>
      )}
    </div>
  );
}
