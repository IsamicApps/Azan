import React from 'react';
import ReactDOM from 'react-dom/client';
import TvApp from './TvApp';
import { registerServiceWorker } from '../shared/utils/serviceWorker';
import '../shared/index.css';
import './tv.css';

registerServiceWorker('../sw.js', '../');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <TvApp />
  </React.StrictMode>
);
