import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read VITE_* vars from .env so the dev proxy can target the real API.
  const env = loadEnv(mode, '.');
  const apiTarget = env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? '';

  return {
    // Listen on all interfaces (0.0.0.0 + IPv6) so the dev and preview
    // servers are reachable from a phone on the same network — this is a
    // mobile-first app, so testing on a real device is the common case.
    server: {
      host: true,
      // Dev-only CORS workaround. The backend sends no CORS headers
      // (guidelines section 6), so a browser cannot call it cross-origin.
      // Here the browser hits same-origin `/api/*` and Vite proxies it
      // server-side to the real API, where CORS never applies. The
      // production build calls the API directly and still needs the
      // backend CORS fix.
      proxy: apiTarget
        ? {
            '/api': {
              target: apiTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
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
  };
});
