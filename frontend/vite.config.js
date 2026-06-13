import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000, // Adjust the chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Put three.js and react-three packages into a separate chunk
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            // Put other dependencies (axios, socket.io, etc.) into a general vendor chunk
            return 'vendor';
          }
        },
      },
    },
  },
})
