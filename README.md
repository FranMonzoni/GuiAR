# GuiAR Web

Interfaz web de **GuiAR**: cada persona lleva un dispositivo ESP32 (GPS + magnetómetro + acelerómetro + LoRa) cuyo aro LED apunta hacia los demás miembros de su grupo. La web sirve para:

- Crear una cuenta e iniciar sesión (Firebase Auth).
- Crear un grupo o unirse con un **código de invitación**. Cada persona está en un solo grupo.
- Ver el **mapa en vivo** del grupo: posición, rumbo (magnetómetro), batería, señal LoRa, distancia a vos y hace cuánto reportó cada uno.
- Ver los datos que necesitan la app y la ESP32: **ID del grupo** y **clave de cifrado AES-256** (solo para miembros).
- **Panel de administración** (rol ADMIN): grupos, miembros y usuarios. No muestra ubicaciones.

El backend (API REST + WebSocket) está en [guiar-backend](https://github.com/FranMonzoni/guiar-backend), con la documentación completa del protocolo.

## Puesta en marcha

```bash
npm install
cp .env.example .env    # datos del proyecto de Firebase + URL del backend
npm run dev             # http://localhost:5173
```

Variables:

| Variable | Ejemplo |
|---|---|
| `VITE_API_URL` | `http://localhost:3001` |
| `VITE_WS_URL` | `ws://localhost:3001` (opcional: se deriva de `VITE_API_URL`) |
| `VITE_FIREBASE_*` | Configuración web de Firebase |

## Deploy en Vercel

1. Importar el repo en Vercel. `vercel.json` ya configura la build y redirige las rutas a `index.html`.
2. Cargar en **Settings → Environment Variables** todas las variables de `.env.example`, con `VITE_API_URL` en `https://` y `VITE_WS_URL` en `wss://`. Si falta alguna, o el backend no usa HTTPS, la build falla a propósito.
3. En el backend, agregar el dominio de Vercel a `CORS_ORIGINS`.
4. En Firebase, agregar el dominio en **Authentication → Settings → Authorized domains**.

Las variables `VITE_*` se incorporan al compilar: si se cambia alguna, hay que volver a deployar.

## Estructura

```text
src/
├── App.jsx                  # Rutas: /login, / (mapa y grupo), /admin
├── firebase/firebase.js     # Inicialización de Firebase
├── services/
│   ├── api.js               # TODA la comunicación HTTP con el backend
│   └── esp32Api.js          # Stubs para hablar directo con la ESP32 (futuro)
├── context/
│   ├── AuthContext.jsx      # Sesión + usuario del backend (rol, grupo)
│   ├── GroupContext.jsx     # Grupo, ubicaciones y WebSocket con reconexión
│   └── DeviceContext.jsx    # Estado de la ESP32 (futuro)
├── components/
│   ├── AppHeader.jsx        # Encabezado común
│   ├── GroupMap.jsx         # Mapa Leaflet con marcadores por miembro
│   ├── GroupSetup.jsx       # Crear / unirse a un grupo
│   ├── GroupSettings.jsx    # Código, ID, clave, miembros, salir
│   ├── CopyButton.jsx, StatusBadge.jsx, ColorPicker.jsx
├── pages/
│   ├── AuthPage.jsx         # Login, registro, recuperar contraseña
│   ├── UserView.jsx         # Mapa + lista de miembros
│   └── AdminView.jsx        # Panel de administración
└── utils/format.js          # Fechas relativas, distancias, colores por usuario
```

### Regla de arquitectura

Los componentes nunca hacen `fetch()` ni abren sockets directamente:

```
Componente → Context (AuthContext / GroupContext) → services/api.js → Backend
```

## Estado

- ✅ Login/registro/recuperación de contraseña
- ✅ Grupos con código de invitación, un grupo por persona, salir, expulsar, regenerar código
- ✅ Mapa en vivo por WebSocket con estado inicial, presencia y reconexión automática
- ✅ Panel de administración sin acceso a ubicaciones
- ⏳ App móvil que lee la ESP32 y reporta por WebSocket (ver protocolo en el README del backend)
