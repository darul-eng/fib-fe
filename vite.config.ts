import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SIAP - Sistem Manajeman Aset, Sarana, dan Prasarana',
        short_name: 'SIAP',
        description: 'Sistem Manajeman Aset, Sarana, dan Prasarana',
        theme_color: '#0E3542',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Data dari /api bersifat sesi/cookie & harus selalu segar — jangan pernah dicache.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^\/uploads\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'uploads-cache' },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api ke backend saat dev
      '/api': 'http://localhost:3000',
      // Proxy /uploads ke backend saat dev (foto aset)
      '/uploads': 'http://localhost:3000',
    },
  },
});
