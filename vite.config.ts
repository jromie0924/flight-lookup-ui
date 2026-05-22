import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  // Listen on all interfaces (0.0.0.0 + IPv6) so the dev server and preview
  // server are reachable from a phone on the same network. This is a
  // mobile-first app, so testing on a real device is the common case.
  server: { host: true },
  preview: { host: true },
  plugins: [
    react(),
    // PWA: web manifest + service worker so the app installs to a phone's
    // home screen. `autoUpdate` keeps installed copies fresh on next visit.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Plane Tracker - Flight Lookup',
        short_name: 'Flight Lookup',
        description: 'Look up flights logged by the plane-tracker-rgb-pi project.',
        theme_color: '#0b3d62',
        background_color: '#0b3d62',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
