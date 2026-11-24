import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { instalarMensajesValidacion } from './utils/validacionFormulario';

// Mensajes de validación propios en los formularios que usan la validación del navegador.
instalarMensajesValidacion();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);