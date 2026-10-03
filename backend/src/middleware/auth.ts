import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export interface AuthPayload {
  userId: number;
  email: string;
  rol: string;
}

// Extiende Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }

  const token = header.split(' ')[1];

  let decoded: AuthPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }
  if (!Number.isInteger(decoded.userId) || decoded.userId <= 0) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return;
  }
  try {
    const result = await pool.query('SELECT id, email, rol FROM usuarios WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'La cuenta asociada al token ya no existe' });
      return;
    }
    req.user = { userId: result.rows[0].id, email: result.rows[0].email, rol: result.rows[0].rol };
    next();
  } catch {
    res.status(503).json({ error: 'No se pudo validar la sesión en PostgreSQL' });
  }
};
