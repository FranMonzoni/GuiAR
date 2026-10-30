import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const REQUIRED_ENV = [
  'VITE_API_URL',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

/** En Vercel, frena la build en vez de publicar un sitio que apunta a localhost. */
function checkDeployEnv(mode) {
  const env = { ...loadEnv(mode, process.cwd()), ...process.env }
  const missing = REQUIRED_ENV.filter((key) => !env[key])
  if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`)
  if (!env.VITE_API_URL.startsWith('https://')) throw new Error('VITE_API_URL debe usar https://')
  if (env.VITE_WS_URL && !env.VITE_WS_URL.startsWith('wss://')) throw new Error('VITE_WS_URL debe usar wss://')
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build' && process.env.VERCEL) checkDeployEnv(mode)
  return { plugins: [react()] }
})
