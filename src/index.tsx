import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App.tsx';
import ErrorBoundary from '../components/ErrorBoundary';
import { SchoolContextProvider } from './contexts/SchoolContext';
import './index.css';

// Register the service worker for caching and offline support
// Service worker registration is temporarily disabled during debugging to avoid cached assets
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').then(registration => {
//       // console.log('ServiceWorker registration successful with scope: ', registration.scope);
//     }).catch(registrationError => {
//       // console.log('ServiceWorker registration failed: ', registrationError);
//     });
//   });
// }

// In dev/emulator, aggressively unregister any existing service workers to avoid
// intercepting Vite dev requests (which can cause net::ERR_FAILED and Response errors)
if ('serviceWorker' in navigator) {
  const isDev = (import.meta as any).env?.DEV;
  const isEmu = String((import.meta as any).env?.VITE_USE_FIREBASE_EMULATOR || '').toLowerCase() === 'true';
  if (isDev || isEmu) {
    try {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        if (regs && regs.length) {
          regs.forEach((reg) => reg.unregister().catch(() => {}));
          // eslint-disable-next-line no-console
          // console.log(`[SW] Unregistered ${regs.length} service worker(s) for dev/emulator.`);
        }
      }).catch(() => {});
    } catch {}
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <SchoolContextProvider>
        <App />
      </SchoolContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
