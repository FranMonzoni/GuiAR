import React from 'react';

/**
 * ColorPicker Component
 * 
 * Componente reutilizable para selección de color.
 * Su finalidad futura será controlar el aro LED conectado a la ESP32.
 * 
 * Props:
 * @param {string} color - Color actual en formato Hex (ej: "#ffffff")
 * @param {function} onChange - Callback al cambiar de color (recibe el valor Hex)
 */
export default function ColorPicker({ color = '#ffffff', onChange }) {
  const presetColors = [
    '#ffffff', // Blanco
    '#ff0055', // Magenta / Rojo
    '#00e5ff', // Cyan
    '#76ff03', // Verde Neón
    '#ffc107', // Ámbar
    '#9c27b0'  // Púrpura
  ];

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleSelectPreset = (presetColor) => {
    if (onChange) {
      onChange(presetColor);
    }
  };

  return (
    <div className="color-picker-container">
      <div className="color-picker-header">
        <label htmlFor="led-color-input" className="color-picker-label">
          Color del Aro LED
        </label>
        <span className="color-hex-value">{color}</span>
      </div>

      <div className="color-picker-controls">
        <div 
          className="color-preview-box" 
          style={{ backgroundColor: color }} 
          title="Vista previa del color"
        />
        <input
          id="led-color-input"
          type="color"
          value={color}
          onChange={handleChange}
          className="color-input"
        />
      </div>

      <div className="color-presets">
        <span className="presets-title">Presets:</span>
        <div className="presets-grid">
          {presetColors.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`preset-button ${color === preset ? 'active' : ''}`}
              style={{ backgroundColor: preset }}
              onClick={() => handleSelectPreset(preset)}
              title={`Seleccionar ${preset}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
