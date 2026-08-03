import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vendor deps change far less often than app code. Splitting them
        // into their own chunk means a repeat visitor's browser cache keeps
        // react/supabase-js/sentry across deploys and only re-downloads the
        // (much smaller) app chunk when bingr itself ships a change.
        // Rolldown (this project's Vite 8 build engine) requires a function
        // here, not the classic Rollup object-map form.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@sentry')) return 'sentry'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
  },
})
