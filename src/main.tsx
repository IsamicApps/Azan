import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker for offline PWA support safely
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('ServiceWorker registration skipped:', err);
      });
    } catch (e) {
      console.log('ServiceWorker registration error:', e);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
