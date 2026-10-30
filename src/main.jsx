import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // primero: los CSS de páginas y de Leaflet tienen que poder pisar la base
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
