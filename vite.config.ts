import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA sudah disiapkan sejak awal (fitur MVP). Ikon bisa ditambah nanti di /public.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SIAF - Inventaris Aset Fakultas',
        short_name: 'SIAF',
        description: 'Sistem Inventaris Aset Fakultas',
        theme_color: '#0E3542',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api ke backend saat dev
      '/api': 'http://localhost:3000',
    },
  },
});
