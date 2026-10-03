import React from 'react';
import ReactDOM from 'react-dom/client';
import MobileApp from './MobileApp';
import { registerServiceWorker } from '../shared/utils/serviceWorker';
import { startWidgetSync } from '../shared/utils/nativeBridge';
import '../shared/index.css';

registerServiceWorker('./sw.js');
// In the native app: keep the home-screen widgets on the chosen mosque and language
startWidgetSync();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MobileApp />
  </React.StrictMode>
);
