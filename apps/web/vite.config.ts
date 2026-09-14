import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './', // deploy duoc o bat ky subpath nao (GitHub Pages, S3...)
  build: { outDir: 'dist', sourcemap: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon-64.png'],
      manifest: {
        name: 'âm lịch — Lịch Âm Việt Nam',
        short_name: 'âm lịch',
        description:
          'Lịch âm Việt Nam: chuyển đổi dương ↔ âm, can chi, tiết khí, giờ hoàng đạo, ngày lễ. Thuật toán Hồ Ngọc Đức, GMT+7. Chạy được offline.',
        lang: 'vi',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#16161e',
        theme_color: '#16161e',
        categories: ['utilities', 'productivity', 'lifestyle'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Hôm nay', short_name: 'Hôm nay', url: './?view=today' },
          { name: 'Terminal', short_name: 'Terminal', url: './?view=terminal' },
        ],
      },
      workbox: {
        // App tinh toan 100% client-side -> precache het la chay offline that su
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Font Google: dung ban cache, lan sau khong can mang
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
