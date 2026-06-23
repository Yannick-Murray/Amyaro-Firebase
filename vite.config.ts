import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 🔒 SECURITY: Remove console logs in production build
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  
  define: {
    // Remove debug logs in production
    __DEV__: process.env.NODE_ENV !== 'production'
  },

  build: {
    rollupOptions: {
      output: {
        // Selten ändernde Vendor-Bibliotheken in eigene Chunks auslagern,
        // um das initiale Bundle zu verkleinern und Browser-Caching zu verbessern.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'firebase';
          if (id.includes('/react-router')) return 'react-router';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('/@dnd-kit/')) return 'dnd-kit';
        }
      }
    }
  }
})
