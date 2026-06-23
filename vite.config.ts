import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Service Worker aktualisiert sich automatisch im Hintergrund und wird
      // beim nächsten Start aktiv – Nutzer bekommen so keine veraltete Version.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Amyaro – Einkaufs- & Geschenkelisten',
        short_name: 'Amyaro',
        description: 'Gemeinsame Einkaufs- und Geschenkelisten – auch offline.',
        lang: 'de',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        // Firebase-Vendor-Chunk ist > 2 MB Default-Limit knapp – Limit anheben.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      }
    })
  ],
  
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
