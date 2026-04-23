import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    outDir: 'dist', // Ensures consistency with the Dockerfile COPY command
    emptyOutDir: true, // Clears the folder before building
  },
  server: {
    host: '0.0.0.0', // Allows the container to be accessed if you run in dev mode
    port: 5173      // Standard Vite port
  }
})