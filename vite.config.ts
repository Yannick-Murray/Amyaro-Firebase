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
  }
})
