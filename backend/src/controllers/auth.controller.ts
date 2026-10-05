import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';

const SALT_ROUNDS = 10;

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  return secret;
};

const databaseUnavailable = (res: Response, error?: unknown): void => {
  if (error) console.error('Error de PostgreSQL:', error instanceof Error ? error.message : error);
  res.status(503).json({ error: 'Base de datos no disponible; la autenticación requiere PostgreSQL.' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const { nombre, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const tokenSecret = getJwtSecret();

    try {
      const result = await pool.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol, created_at',
        [nombre, email, passwordHash, 'turista']
      );

      const user = result.rows[0];
      const token = jwt.sign(
        { userId: user.id, email: user.email, rol: user.rol },
        tokenSecret,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
        token,
      });
      return;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        res.status(409).json({ error: 'El email ya está registrado' });
        return;
      }
      databaseUnavailable(res, error);
      return;
    }
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;
    const tokenSecret = getJwtSecret();

    try {
      // Intento en PostgreSQL
      const result = await pool.query(
        'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = $1',
        [email]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
          res.status(401).json({ error: 'Credenciales incorrectas' });
          return;
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email, rol: user.rol },
          tokenSecret,
          { expiresIn: '24h' }
        );

        res.json({
          mensaje: 'Inicio de sesión exitoso',
          usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
          token,
        });
        return;
      }
    } catch (error) {
      databaseUnavailable(res, error);
      return;
    }
    res.status(401).json({ error: 'Credenciales incorrectas' });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1',
      [req.user!.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ usuario: result.rows[0] });
  } catch (error) {
    databaseUnavailable(res, error);
  }
};
