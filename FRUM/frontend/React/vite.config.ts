import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api requests to the backend
      '/api': {
        target: 'http://localhost:3000', // Backend URL
        changeOrigin: true,              // Modifies the origin header
      },
    },
  },
})
