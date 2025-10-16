import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App.tsx';
import './index.css';

// Register the service worker for caching and offline support
// Service worker registration is temporarily disabled during debugging to avoid cached assets
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').then(registration => {
//       console.log('ServiceWorker registration successful with scope: ', registration.scope);
//     }).catch(registrationError => {
//       console.log('ServiceWorker registration failed: ', registrationError);
//     });
//   });
// }

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
