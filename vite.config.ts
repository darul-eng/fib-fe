import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Nama file diberi versi agar URL berbeda dari sebelumnya — menghindari
      // cache CDN (Cloudflare) lama yang masih menyimpan manifest dengan path ikon lama.
      manifestFilename: 'manifest-v2.webmanifest',
      manifest: {
        name: 'SIAP - Sistem Manajeman Aset, Sarana, dan Prasarana',
        short_name: 'SIAP',
        description: 'Sistem Manajeman Aset, Sarana, dan Prasarana',
        theme_color: '#0E3542',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192-v2.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512-v2.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
      // Proxy /api ke backend saat dev. Pakai 127.0.0.1 (bukan "localhost") karena
      // backend bind ke IPv4 saja — di mesin yang me-resolve "localhost" ke ::1
      // (IPv6) duluan, proxy akan gagal dengan ECONNREFUSED ::1:3000.
      '/api': 'http://127.0.0.1:3000',
      // Proxy /uploads ke backend saat dev (foto aset)
      '/uploads': 'http://127.0.0.1:3000',
    },
  },
  preview: {
    port: 4173,
    // Sama seperti proxy dev di atas — tanpa ini, `vite preview` (build produksi,
    // dipakai untuk uji nyata PWA/service worker) tidak bisa memanggil backend.
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/uploads': 'http://127.0.0.1:3000',
    },
  },
});
