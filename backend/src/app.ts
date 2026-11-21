// Configuración de la aplicación Express: middlewares, rutas y manejo de errores.
// No inicia el servidor; eso lo hace server.ts. Así la app se puede reutilizar (por ejemplo, en pruebas).
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pool from './config/db.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import destinosRoutes from './routes/destinos.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import favoritosRoutes from './routes/favoritos.routes.js';
import sugerenciasImagenesRoutes from './routes/sugerenciasImagenes.routes.js';

// localhost y 127.0.0.1 son el mismo equipo, pero el navegador los trata como orígenes distintos.
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:8100', 'http://127.0.0.1:8100',
];

/** Orígenes del frontend autorizados por CORS (CORS_ORIGINS, separados por coma). */
export function resolveAllowedOrigins(value = process.env.CORS_ORIGINS): string[] {
  const origins = value
    ?.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const allowed = origins?.length ? origins : DEFAULT_CORS_ORIGINS;
  if (allowed.includes('*')) {
    throw new Error('CORS_ORIGINS no puede ser "*". Indica los orígenes exactos del frontend, por ejemplo http://localhost:8100.');
  }
  return allowed;
}

export function createApp(allowedOrigins: string[] = resolveAllowedOrigins()) {
  const app = express();

  // No revelar la tecnología del servidor (helmet también la quita; se deja explícito).
  app.disable('x-powered-by');
  // Cabeceras de seguridad HTTP. Se permite que el frontend (otro origen) muestre las imágenes que entrega la API.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));

  // Rutas
  app.use('/api/auth', authRoutes);
  app.use('/api/destinos', destinosRoutes);
  app.use('/api/categorias', categoriasRoutes);
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/favoritos', favoritosRoutes);
  app.use('/api/sugerencias-imagenes', sugerenciasImagenesRoutes);

  // Bienvenida / raíz de la API
  app.get('/', (_req, res) => {
    res.json({
      mensaje: 'API REST Senderia Chile - Backend activo',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth (register, verify-email, login, google, password-reset, me)',
        destinos: '/api/destinos',
        opiniones: '/api/destinos/:id/opiniones',
        sugerencias_imagenes: '/api/destinos/:id/sugerencias-imagenes',
        categorias: '/api/categorias',
        usuarios: '/api/usuarios',
        favoritos: '/api/favoritos',
      },
    });
  });

  // Estado de la API y de PostgreSQL
  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'unavailable', timestamp: new Date().toISOString() });
    }
  });

  // 404 y manejador global de errores: la API responde siempre JSON y nunca expone el stack trace.
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
