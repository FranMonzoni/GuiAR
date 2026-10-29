import React, { createContext, useContext, useState } from 'react';
import * as esp32Api from '../services/esp32Api';

/**
 * DeviceContext - Contexto central de estado para el dispositivo ESP32
 * 
 * Centraliza la información del dispositivo y sirve como intermediario
 * entre la capa visual (páginas y componentes) y el servicio de red (esp32Api.js).
 */
export const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  // Estado básico del dispositivo (mock inicial)
  const [device, setDevice] = useState({
    name: 'GuiAR ESP32',
    ip: null,
    connected: false
  });

  // Estado visual de conexión: 'connected' | 'disconnected' | 'searching' | 'error'
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Dirección IP ingresada para vinculación
  const [deviceIp, setDeviceIp] = useState('');

  // Estado del color del aro LED
  const [ledColor, setLedColorState] = useState('#ffffff');

  // Información extendida para diagnóstico / admin
  const [deviceInfo, setDeviceInfo] = useState(null);

  /**
   * Función placeholder para vincular/conectar la ESP32 por IP.
   */
  const connectDevice = async (ip) => {
    setConnectionStatus('searching');
    setDeviceIp(ip);
    try {
      const result = await esp32Api.connectDevice(ip);
      if (result.success) {
        setDevice(prev => ({ ...prev, ip: ip, connected: false })); // Permanece no conectado de momento
        setConnectionStatus('disconnected'); // Placeholder: no hay conexión real aun
      }
      return result;
    } catch (err) {
      setConnectionStatus('error');
      return { success: false, error: err.message };
    }
  };

  /**
   * Función placeholder para desconectar el dispositivo.
   */
  const disconnectDevice = () => {
    esp32Api.setEsp32BaseUrl(null);
    setDevice(prev => ({ ...prev, ip: null, connected: false }));
    setConnectionStatus('disconnected');
    setDeviceIp('');
  };

  /**
   * Función placeholder para cambiar el color del aro LED.
   */
  const updateLedColor = async (newColor) => {
    setLedColorState(newColor);
    // Delega la futura llamada HTTP al servicio esp32Api
    const response = await esp32Api.setLedColor(newColor);
    return response;
  };

  /**
   * Función placeholder para consultar estado actual desde el servicio.
   */
  const refreshStatus = async () => {
    const statusData = await esp32Api.getDeviceStatus();
    return statusData;
  };

  /**
   * Función placeholder para obtener info del dispositivo.
   */
  const fetchDeviceInfo = async () => {
    const info = await esp32Api.getDeviceInfo();
    setDeviceInfo(info);
    return info;
  };

  /**
   * Función placeholder para prueba de latencia/ping.
   */
  const pingDevice = async () => {
    return await esp32Api.pingDevice();
  };

  const value = {
    device,
    connectionStatus,
    deviceIp,
    ledColor,
    deviceInfo,
    setConnectionStatus, // Permite modificar estado visualmente para pruebas UI
    connectDevice,
    disconnectDevice,
    updateLedColor,
    refreshStatus,
    fetchDeviceInfo,
    pingDevice
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

/**
 * Hook personalizado para consumir el DeviceContext de manera sencilla
 */
export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice debe ser utilizado dentro de un DeviceProvider');
  }
  return context;
}
