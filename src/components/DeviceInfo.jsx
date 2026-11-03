/**
 * Información de la pulsera de un miembro, armada con la telemetría que manda la app:
 *   - DeviceSummary: dos líneas cortas para la fila de la lista de miembros
 *   - DeviceDetails: todos los sensores, para el panel desplegable
 *
 * La telemetría viene de la pulsera tal cual (esp.telemetry), así que todo se lee
 * de forma defensiva: un sensor o un campo que no llega simplemente no se muestra.
 */
import { timeAgo } from '../utils/format';

const SENSOR_LABELS = {
  identity: 'Identidad',
  gps: 'GPS',
  imu: 'IMU',
  magnetometer: 'Magnetómetro',
  diagnostics: 'Diagnóstico'
};
const SENSOR_ORDER = ['identity', 'gps', 'imu', 'magnetometer', 'diagnostics'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const yesNo = (v) => (v === true ? 'Sí' : v === false ? 'No' : null);
const fmt = (n, d = 1) => (typeof n === 'number' && Number.isFinite(n) ? n.toFixed(d) : null);
const xyz = (arr, d = 2) =>
  Array.isArray(arr) && arr.length === 3 && arr.every((n) => typeof n === 'number')
    ? arr.map((n) => n.toFixed(d)).join(' · ')
    : null;

function duration(s) {
  if (typeof s !== 'number' || !Number.isFinite(s)) return null;
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
  return `${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min`;
}

function sensorsOf(device) {
  const s = device?.telemetry?.sensors;
  return isObj(s) ? s : {};
}

function dataOf(device, key) {
  const sensor = sensorsOf(device)[key];
  return isObj(sensor) && isObj(sensor.data) ? sensor.data : null;
}

/** Estado del GPS para mostrar: { text, tone: 'ok' | 'warn' | 'off' }. */
function gpsStatus(device, loc) {
  const gps = dataOf(device, 'gps');
  const sats = gps?.sats ?? loc?.satellites;
  const fix = gps?.fix ?? loc?.gpsFix;
  if (gps?.connected === false) return { text: 'GPS desconectado', tone: 'off' };
  if (fix === false) return { text: sats != null ? `Sin fix · ${sats} sat` : 'Sin fix', tone: 'warn' };
  if (fix === true || sats != null) return { text: `GPS${sats != null ? ` · ${sats} sat` : ''}`, tone: 'ok' };
  return null;
}

/** Sensores marcados como desactualizados por la app (stale: true). */
function staleSensors(device) {
  return Object.entries(sensorsOf(device))
    .filter(([, s]) => isObj(s) && s.stale === true)
    .map(([k]) => SENSOR_LABELS[k] || k);
}

export function DeviceSummary({ device, loc }) {
  if (!device) return <span className="dev-sum dev-sum--none">Sin pulsera</span>;
  const gps = gpsStatus(device, loc);
  const stale = staleSensors(device);
  const battery = loc?.battery;
  return (
    <span className="dev-sum">
      <span className="dev-sum__name" title={device.deviceId}>
        {device.name || device.deviceId}
        {device.firmware && <span className="dev-sum__fw"> · fw {device.firmware}</span>}
      </span>
      <span className="dev-sum__line">
        {gps && <span className={`dev-pill dev-pill--${gps.tone}`}>{gps.text}</span>}
        {battery != null && <span className="dev-sum__bat">{Math.round(battery)}%</span>}
        {stale.length > 0 && (
          <span className="dev-pill dev-pill--warn" title={`Sin datos nuevos: ${stale.join(', ')}`}>
            {stale.length} sin actualizar
          </span>
        )}
      </span>
    </span>
  );
}

function Rows({ rows }) {
  const visible = rows.filter(([, v]) => v != null && v !== '');
  if (!visible.length) return <p className="muted small">Sin datos.</p>;
  return (
    <dl className="dev-kv">
      {visible.map(([k, v]) => (
        <div key={k} className="dev-kv__row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Filas por sensor conocido; cualquier otro campo se muestra tal cual. */
function sensorRows(key, data) {
  switch (key) {
    case 'identity':
      return [
        ['Nombre', data.name],
        ['ID', data.id],
        ['Firmware', data.fw],
        ['WiFi', yesNo(data.wifi)]
      ];
    case 'gps':
      return [
        ['Conectado', yesNo(data.connected)],
        ['Fix', yesNo(data.fix)],
        ['Satélites', data.sats],
        ['HDOP', fmt(data.hdop)],
        ['Posición', fmt(data.lat, 5) && fmt(data.lon, 5) ? `${fmt(data.lat, 5)}, ${fmt(data.lon, 5)}` : null],
        ['Antigüedad del fix', duration(data.age_s)]
      ];
    case 'imu':
      return [
        ['Aceleración (g)', xyz(data.accel_g)],
        ['Giro (°/s)', xyz(data.gyro_dps, 1)],
        ['Temperatura', fmt(data.temp_c) != null ? `${fmt(data.temp_c)} °C` : null]
      ];
    case 'magnetometer':
      return [
        ['Chip', data.chip],
        ['Crudo x · y · z', xyz(data.raw_xyz, 0)]
      ];
    case 'diagnostics':
      return [
        ['Encendida hace', duration(data.uptime_s)],
        ['Bus I²C', Array.isArray(data.i2c) ? data.i2c.join(', ') || 'ninguno' : null],
        ['Errores', Array.isArray(data.errors) ? (data.errors.length ? data.errors.join(', ') : 'ninguno') : null]
      ];
    default:
      return Object.entries(data).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
  }
}

function SensorCard({ id, sensor }) {
  const data = isObj(sensor?.data) ? sensor.data : null;
  const age = typeof sensor?.ageMs === 'number' ? sensor.ageMs : null;
  return (
    <section className={`dev-sensor ${sensor?.stale ? 'is-stale' : ''}`}>
      <header className="dev-sensor__head">
        <span className={`dev-dot ${sensor?.stale ? 'is-stale' : 'is-ok'}`} aria-hidden="true" />
        <strong>{SENSOR_LABELS[id] || id}</strong>
        <span className={`dev-sensor__state ${sensor?.stale ? 'dev-warn' : 'muted'}`}>
          {sensor?.stale ? 'desactualizado' : 'al día'}
          {age != null && ` · ${age < 1000 ? `${age} ms` : `${(age / 1000).toFixed(1)} s`}`}
        </span>
      </header>
      {data ? <Rows rows={sensorRows(id, data)} /> : <p className="muted small">Sin datos.</p>}
    </section>
  );
}

export function DeviceDetails({ device, now }) {
  if (!device) {
    return (
      <div className="dev-details">
        <p className="muted small">
          Todavía no se vinculó ninguna pulsera. Se vincula sola cuando la app manda el primer dato.
        </p>
      </div>
    );
  }

  const t = isObj(device.telemetry) ? device.telemetry : {};
  const sensors = sensorsOf(device);
  const keys = [...SENSOR_ORDER.filter((k) => k in sensors), ...Object.keys(sensors).filter((k) => !SENSOR_ORDER.includes(k))];

  return (
    <div className="dev-details">
      <Rows
        rows={[
          ['Pulsera', device.deviceId],
          ['Último dato', device.lastSeenAt ? timeAgo(device.lastSeenAt, now) : null],
          ['Conexión', typeof t.transport === 'string' ? t.transport.toUpperCase() : null],
          ['Versión de la app', t.appVersion],
          ['Esquema', t.schemaVersion],
          ['Ubicación simulada', yesNo(t.simulatedLocation)]
        ]}
      />
      {keys.length > 0 ? (
        <div className="dev-sensors">
          {keys.map((k) => <SensorCard key={k} id={k} sensor={sensors[k]} />)}
        </div>
      ) : (
        <p className="muted small">La pulsera todavía no mandó telemetría de sensores.</p>
      )}
    </div>
  );
}
