import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const projectRoot = import.meta.dirname

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  server: {
    port: 3000,
    host: true,
    watch: {
      usePolling: true,
    },
    // Proxy vers le backend Laravel pour éviter les erreurs CORS en développement.
    // Sous Docker, 'backend:8000' est le conteneur Laravel ; en local hors Docker, 'localhost:8000'.
    proxy: {
      '/api': {
        target: process.env.BACKEND_PROXY_TARGET || (process.platform === 'win32' ? 'http://localhost:8000' : 'http://backend:8000'),
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: process.env.BACKEND_PROXY_TARGET || (process.platform === 'win32' ? 'http://localhost:8000' : 'http://backend:8000'),
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    // Les parcours complets enchaînent plusieurs appels simulés, chacun temporisé.
    testTimeout: 20_000,
  },
})