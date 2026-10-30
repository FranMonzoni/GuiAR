import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { colorFor, initials, isStale, timeAgo } from '../utils/format';

const DEFAULT_CENTER = [-31.4201, -64.1888]; // Córdoba
const DEFAULT_ZOOM = 13;

/** El nombre lo elige cada usuario y `html` de divIcon se inserta sin escapar. */
const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Marcador redondo con iniciales, color del miembro y flecha de rumbo (magnetómetro). */
function memberIcon({ name, color, heading, stale, isMe }) {
  const arrow = heading != null
    ? `<span class="gm-heading" style="transform: rotate(${heading}deg)"><i style="border-bottom-color:${color}"></i></span>`
    : '';
  const cls = ['gm-marker', stale ? 'is-stale' : 'is-live', isMe && 'is-me'].filter(Boolean).join(' ');
  return L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    tooltipAnchor: [0, 22],
    html: `<div class="${cls}" style="--c:${color}">${arrow}<span class="gm-dot">${escapeHtml(initials(name))}</span></div>`
  });
}

/** Encuadra el mapa la primera vez que hay ubicaciones, o cuando cambia `fitKey`. */
function AutoFit({ points, fitKey }) {
  const map = useMap();
  const fittedFor = useRef(null);

  useEffect(() => {
    if (!points.length || fittedFor.current === fitKey) return;
    fittedFor.current = fitKey;
    if (points.length === 1) map.setView(points[0], 17);
    else map.fitBounds(points, { padding: [48, 48], maxZoom: 17 });
  }, [points, fitKey, map]);

  return null;
}

/** Centra el mapa en el miembro elegido desde la lista. */
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 17), { duration: 0.6 });
  }, [target, map]);
  return null;
}

function MemberMarker({ loc, isMe, now }) {
  const stale = isStale(loc.timestamp, now);
  const color = colorFor(loc.userId);
  // `now` cambia cada 5 s: un ícono nuevo reemplazaría el DOM y reiniciaría la animación
  const icon = useMemo(
    () => memberIcon({ name: loc.displayName, color, heading: loc.heading, stale, isMe }),
    [loc.displayName, color, loc.heading, stale, isMe]
  );

  return (
    <Marker position={[loc.latitude, loc.longitude]} icon={icon} zIndexOffset={isMe ? 1000 : 0}>
      <Tooltip direction="bottom" permanent className="gm-label">
        {isMe ? 'Vos' : loc.displayName}
      </Tooltip>
      <Popup>
        <div className="gm-popup">
          <strong>{loc.displayName}</strong>
          <span className="gm-popup__time">{timeAgo(loc.timestamp, now)} · {loc.deviceId}</span>
          <dl>
            <dt>Posición</dt><dd>{loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}</dd>
            {loc.heading != null && <><dt>Rumbo</dt><dd>{Math.round(loc.heading)}°</dd></>}
            {loc.speed != null && <><dt>Velocidad</dt><dd>{(loc.speed * 3.6).toFixed(1)} km/h</dd></>}
            {loc.accuracy != null && <><dt>Precisión</dt><dd>±{Math.round(loc.accuracy)} m</dd></>}
            {loc.satellites != null && <><dt>Satélites</dt><dd>{loc.satellites}</dd></>}
            {loc.battery != null && <><dt>Batería</dt><dd>{Math.round(loc.battery)}%</dd></>}
            {loc.signal != null && <><dt>Señal LoRa</dt><dd>{loc.signal} dBm</dd></>}
          </dl>
        </div>
      </Popup>
    </Marker>
  );
}

export default function GroupMap({ locations, meId, focus, fitKey, now }) {
  const points = useMemo(() => locations.map((l) => [l.latitude, l.longitude]), [locations]);

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="group-map" zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="bottomright" />
      <AutoFit points={points} fitKey={fitKey} />
      <FlyTo target={focus} />

      {locations.map((loc) => (
        <MemberMarker key={loc.userId} loc={loc} isMe={loc.userId === meId} now={now} />
      ))}
    </MapContainer>
  );
}
