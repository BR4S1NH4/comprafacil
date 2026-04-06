import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Use 127.0.0.1 (not localhost) to avoid Windows IPv6 ::1 vs IPv4 mismatch with Node.
  // Dentro do Docker (servico dev), defina no .env: VITE_API_PROXY_TARGET=http://api:3001
  const target = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001'
  const apiProxy = {
    '/api': {
      target,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      watch: { usePolling: true },
      proxy: apiProxy,
    },
    preview: {
      host: true,
      port: 4173,
      proxy: apiProxy,
    },
  }
})
