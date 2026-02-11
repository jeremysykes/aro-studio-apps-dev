import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createAroApiClient } from './apiClient';
import App from './App';

(window as unknown as { aro: unknown }).aro = createAroApiClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
