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
    // Le frontend tourne sur l'hôte. L'API Docker est publiée sur localhost:8000.
    proxy: {
      '/api': {
        target: process.env.BACKEND_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: process.env.BACKEND_PROXY_TARGET || 'http://localhost:8000',
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