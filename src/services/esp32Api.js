/**
 * esp32Api.js - Servicio API de comunicación con ESP32
 * 
 * Este archivo centralizará TODA la comunicación HTTP entre React y el dispositivo ESP32.
 * Actualmente contiene funciones placeholder (stubs) preparadas para la futura implementación.
 * 
 * ARQUITECTURA:
 * Component -> DeviceContext -> esp32Api.js -> fetch() -> ESP32
 */

// TODO: Configurar posteriormente la dirección base del dispositivo ESP32.
// La IP o hostname no debe estar hardcodeada y podrá asignarse dinámicamente durante la vinculación.
export let ESP32_BASE_URL = null;

/**
 * Establece la URL o IP base de la ESP32 para futuras peticiones HTTP.
 * @param {string} ipOrUrl - Dirección IP o hostname de la ESP32 (ej: "192.168.1.50" o "guiar.local")
 */
export function setEsp32BaseUrl(ipOrUrl) {
  if (!ipOrUrl) {
    ESP32_BASE_URL = null;
    return;
  }
  // TODO: Validar formato de IP / URL
  const formatted = ipOrUrl.startsWith('http') ? ipOrUrl : `http://${ipOrUrl}`;
  ESP32_BASE_URL = formatted;
}

/**
 * Obtiene el estado actual del dispositivo ESP32.
 * @returns {Promise<Object>} Promesa con el estado del dispositivo.
 */
export async function getDeviceStatus() {
  // TODO: Implementar posteriormente la solicitud HTTP GET a la ESP32.
  // Ejemplo futuro: fetch(`${ESP32_BASE_URL}/api/status`)
  return Promise.resolve({
    connected: false,
    status: 'disconnected',
    message: 'Servicio en modo placeholder (comunicación HTTP no implementada)'
  });
}

/**
 * Vincula / conecta la aplicación web con la ESP32 especificada por IP.
 * @param {string} ipAddress - Dirección IP ingresada por el usuario.
 * @returns {Promise<Object>} Promesa con el resultado de la conexión.
 */
export async function connectDevice(ipAddress) {
  // TODO: Implementar posteriormente la verificación HTTP de la ESP32.
  // Ejemplo futuro: fetch(`${ESP32_BASE_URL}/api/connect`, { method: 'POST' })
  setEsp32BaseUrl(ipAddress);
  
  return Promise.resolve({
    success: true,
    ip: ipAddress,
    message: `IP ${ipAddress} asignada tentativamente (Placeholder - Sin solicitud de red real)`
  });
}

/**
 * Obtiene información detallada del hardware/firmware de la ESP32.
 * @returns {Promise<Object>} Promesa con la información del dispositivo.
 */
export async function getDeviceInfo() {
  // TODO: Implementar posteriormente la solicitud HTTP GET `/api/info` a la ESP32.
  return Promise.resolve({
    name: 'GuiAR ESP32 Node',
    firmwareVersion: '0.0.0-placeholder',
    macAddress: '00:00:00:00:00:00',
    freeHeap: 0,
    wifiSignal: 0
  });
}

/**
 * Envía el color seleccionado para el aro LED conectado a la ESP32.
 * @param {string} hexColor - Color en formato Hexadecimal (ej: "#ff0055").
 * @returns {Promise<Object>} Promesa confirmando el envío del comando.
 */
export async function setLedColor(hexColor) {
  // TODO: Implementar posteriormente la solicitud HTTP POST/PUT `/api/led` a la ESP32.
  // Ejemplo futuro: fetch(`${ESP32_BASE_URL}/api/led`, { method: 'POST', body: JSON.stringify({ color: hexColor }) })
  return Promise.resolve({
    success: true,
    color: hexColor,
    message: `Color ${hexColor} recibido en servicio (Placeholder)`
  });
}

/**
 * Realiza una prueba de ping/latencia con el dispositivo.
 * @returns {Promise<Object>} Promesa con el diagnóstico de latencia.
 */
export async function pingDevice() {
  // TODO: Implementar posteriormente ping HTTP o Endpoint `/api/ping`.
  return Promise.resolve({
    online: false,
    latencyMs: null,
    timestamp: new Date().toISOString()
  });
}
