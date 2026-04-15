import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ===== ACTIVAR PWA - Service Worker para modo offline =====
// Esto permite que la app funcione sin internet y se instale como aplicación nativa
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ PWA Activada - Service Worker registrado:', registration.scope);
      })
      .catch(error => {
        console.log('❌ Error al registrar PWA:', error);
      });
  });
}