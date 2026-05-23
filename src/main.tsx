import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Reload as soon as a new service worker takes control so installed PWAs
// can't get pinned to a stale bundle (e.g. the pre-API-key build).
registerSW({ immediate: true, onNeedRefresh: () => location.reload() });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
