import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import bcrypt from 'bcryptjs';
import { createAdminSchema } from './validators/schemas.js';
import { randomBytes } from 'node:crypto';

import authRoutes from './routes/auth.routes.js';
import destinosRoutes from './routes/destinos.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import favoritosRoutes from './routes/favoritos.routes.js';

dotenv.config();

if (!process.env.JWT_SECRET && process.argv.includes('--create-admin')) {
  throw new Error('JWT_SECRET debe estar configurado en backend/.env antes de crear el administrador.');
}

const jwtSecretIsPlaceholder = (value: string | undefined): boolean =>
  !value || value.length < 32 || /^(tu_|cambiar|genera|placeholder)/i.test(value);
if (jwtSecretIsPlaceholder(process.env.JWT_SECRET) && process.env.NODE_ENV !== 'test' && !process.argv.includes('--create-admin')) {
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  console.log('JWT_SECRET de desarrollo generado solo para este proceso. Define uno propio en backend/.env para conservar sesiones entre reinicios.');
}

if (process.argv.includes('--create-admin')) {
  const parsed = createAdminSchema.safeParse({
    nombre: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  if (!parsed.success) throw new Error('Defina ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) para crear administrador.');
  const admin = parsed.data;
  const passwordHash = await bcrypt.hash(admin.password, 12);
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, password_hash = EXCLUDED.password_hash, rol = 'admin'
     RETURNING id, nombre, email, rol`,
    [admin.nombre, admin.email, passwordHash],
  );
  console.log(`Administrador configurado: ${result.rows[0].email}`);
  await pool.end();
  process.exit(0);
}

const requiredEnv = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) throw new Error(`Faltan variables requeridas: ${missingEnv.join(', ')}`);
if (jwtSecretIsPlaceholder(process.env.JWT_SECRET)) throw new Error('JWT_SECRET debe tener al menos 32 caracteres y no puede conservar el valor de ejemplo.');

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Middlewares globales
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8100'], // Vite + Ionic dev servers
  credentials: true,
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/destinos', destinosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/favoritos', favoritosRoutes);

// Bienvenida / Raíz API
app.get('/', (_req, res) => {
  res.json({
    mensaje: 'API REST Senderia Chile - Backend activo',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth (login, register, me)',
      destinos: '/api/destinos',
      categorias: '/api/categorias',
      favoritos: '/api/favoritos'
    }
  });
});

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable', timestamp: new Date().toISOString() });
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '127.0.0.1', async () => {
    try {
      await pool.query('SELECT 1');
      console.log(`Servidor Senderia conectado a PostgreSQL en http://localhost:${PORT}`);
    } catch (error) {
      console.error('PostgreSQL no está disponible. Las rutas persistentes responderán 503.', error instanceof Error ? error.message : error);
    }
  });
}

export default app;
