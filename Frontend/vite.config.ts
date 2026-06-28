import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Backend dev server. Override with VITE_API_TARGET if your API runs elsewhere.
const API_TARGET = process.env.VITE_API_TARGET ?? 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Proxy API + health checks to the Express backend so the browser can use
    // same-origin relative URLs (/api/...) with no CORS configuration.
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
      '/health': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
})
