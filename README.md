# GuiAR Web - Estructura Base del Proyecto

**guiar-web** es la interfaz web frontal para el proyecto **GuiAR**, un sistema de navegación asistida y control e interacción con un dispositivo físico basado en microcontrolador **ESP32**.

---

## 🎯 Objetivo del Proyecto

El objetivo principal de esta etapa es proporcionar la **arquitectura inicial, estructura base y organización de carpetas** profesional, modular y escalable para la futura aplicación web de GuiAR.

La aplicación está diseñada siguiendo una estricta separación de responsabilidades para garantizar que la capa de interfaz de usuario nunca interactúe directamente con el dispositivo físico, sino a través de servicios centralizados y manejadores de estado.

---

## 🛠️ Tecnologías Utilizadas

- **React** (v18+)
- **Vite** (Build Tool & Dev Server)
- **JavaScript (ES6+)** (Sin TypeScript)
- **React Router DOM** (Manejo de ruteo y navegación SPA)
- **CSS3 Vanilla** (Variables CSS, Flexbox, Grid)
- **Fetch API** (Preparado para la futura comunicación HTTP/REST)

---

## 📂 Estructura de Carpetas

```text
guiar-web/
│
├── src/
│   ├── assets/              # Archivos estáticos, imágenes, logos e imagotipos
│   │   └── README.md
│   │
│   ├── components/          # Componentes UI reutilizables
│   │   ├── Header.jsx       # Encabezado principal y navegación
│   │   ├── StatusBadge.jsx  # Badge visual para estados de conexión
│   │   └── ColorPicker.jsx  # Selector de color para el aro LED
│   │
│   ├── pages/               # Páginas/vistas principales de la aplicación
│   │   ├── UserView.jsx     # Vista principal de usuario final
│   │   └── AdminView.jsx    # Vista técnica y de diagnóstico
│   │
│   ├── services/            # Capa de comunicación de red
│   │   └── esp32Api.js      # Stubs de API HTTP y endpoints de la ESP32
│   │
│   ├── context/             # Estado global de React
│   │   └── DeviceContext.jsx# Contexto centralizado del dispositivo ESP32
│   │
│   ├── App.jsx              # Ruteo principal y contenedor de la aplicación
│   ├── index.css            # Estilos globales y tokens del sistema de diseño
│   └── main.jsx             # Punto de entrada de la aplicación React
│
├── public/                  # Recursos públicos estáticos servir por servidor web
├── package.json             # Manifiesto de dependencias y scripts npm
├── vite.config.js           # Configuración de Vite
└── README.md                # Documentación del proyecto
```

### Responsabilidad de cada carpeta:

- **`src/services/`**: Centraliza **TODA** la comunicación de red con la ESP32 mediante la Fetch API. Los componentes y páginas nunca realizan `fetch()` directos.
- **`src/context/`**: Actúa como intermediario entre la capa de presentación y la capa de servicios, manteniendo el estado reactivo del dispositivo (`connected`, `deviceIp`, `ledColor`, etc.).
- **`src/components/`**: Bloques visuales modulares y reutilizables sin lógica de negocio.
- **`src/pages/`**: Vistas completas (`UserView`, `AdminView`) que componen la experiencia del usuario o del administrador.

---

## 🏗️ Arquitectura de Comunicación con ESP32

La arquitectura del proyecto exige desacoplamiento total entre la UI y el hardware:

```text
                    React (UI)
                      │
          ┌───────────┴───────────┐
          │                       │
      UserView                AdminView
          │                       │
          └───────────┬───────────┘
                      │
              DeviceContext (Estado)
                      │
                esp32Api.js (Servicio)
                      │
                  HTTP/REST (Fetch API)
                      │
                     ESP32 (Hardware)
```

### Regla fundamental:
NO realizar: `Component -> fetch() -> ESP32`

Forma correcta: `Component -> DeviceContext -> esp32Api.js -> fetch() -> ESP32`

---

## 🚀 Cómo Instalar y Ejecutar

### Requisitos previos
- Node.js (v18 o superior)
- npm

### Pasos de instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/FranMonzoni/GuiAR.git
   cd GuiAR/guiar-web
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir en el navegador:
   Acceder a la URL indicada en la consola (usualmente `http://localhost:5173`).

---

## 📌 Estado Actual del Proyecto

El proyecto se encuentra en la **Fase 1: Construcción de la Arquitectura Inicial**.

- ✅ Proyecto React + Vite estructurado.
- ✅ Ruteo configurado (`/` -> `UserView`, `/admin` -> `AdminView`).
- ✅ Componentes base implementados (`Header`, `StatusBadge`, `ColorPicker`).
- ✅ `DeviceContext` preparado con estado inicial y funciones placeholder.
- ✅ `esp32Api.js` preparado con stubs asíncronos y comentarios `TODO`.
- ⚠️ Deliberadamente no incluye comunicación HTTP real, base de datos, autenticación ni lógica de backend.

---

## 📋 Próximas etapas

- Definir protocolo de comunicación con ESP32.
- Definir endpoints.
- Implementar conexión.
- Implementar vinculación del dispositivo.
- Obtener información de la ESP32.
- Obtener estado de conexión.
- Configurar IP.
- Controlar aro LED.
- Implementar diagnóstico.
- Manejo de errores.
- Persistencia de configuración.
- Implementar funcionalidades de usuario.
- Implementar funcionalidades administrativas.
