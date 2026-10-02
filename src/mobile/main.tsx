import React from 'react';
import ReactDOM from 'react-dom/client';
import MobileApp from './MobileApp';
import { registerServiceWorker } from '../shared/utils/serviceWorker';
import '../shared/index.css';

registerServiceWorker('./sw.js');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MobileApp />
  </React.StrictMode>
);
