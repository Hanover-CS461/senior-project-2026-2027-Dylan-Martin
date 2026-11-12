import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow importing the shared browser-side crypto/storage code from ../src
      allow: ['..'],
    },
    proxy: {
      // Forward /api requests to the backend
      '/api': {
        target: 'http://localhost:3000', // Backend URL
        changeOrigin: true,              // Modifies the origin header
      },
    },
  },
})
