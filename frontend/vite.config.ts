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
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['icc-erp-icc-erp-akypi4-54d8f5-185-164-111-168.sslip.io'],
    // Proxy vers le backend Laravel pour éviter les erreurs CORS en développement.
    // Le navigateur envoie les requêtes au serveur Vite qui les retransmet à Laravel.
    proxy: {
      '/api': {
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