import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    fs: {
      // Allow serving files from the public directory
      strict: false,
      allow: ['..']
    },
    cors: true
  },
  resolve: {
    alias: {}
  },
  publicDir: 'public',
  assetsInclude: ['**/*.svg'],
  build: {
    assetsInlineLimit: 0 // Don't inline SVG files
  }
})
