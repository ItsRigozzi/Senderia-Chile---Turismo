import { Request, Response } from 'express';
import pool from '../config/db.js';
import { usuarioUpdateSchema } from '../validators/schemas.js';

export const getUsuarios = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at DESC'
    );
    res.json({ usuarios: result.rows });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const updateUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = usuarioUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const fields = parsed.data;
    const keys = Object.keys(fields) as (keyof typeof fields)[];
    if (keys.length === 0) {
      res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      return;
    }

    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);
    const values = keys.map((key) => fields[key]);
    values.push(id as any);

    const result = await pool.query(
      `UPDATE usuarios SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id, nombre, email, rol, created_at`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ mensaje: 'Usuario actualizado exitosamente', usuario: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    console.error('Error al actualizar usuario:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // No permitir que un admin se elimine a sí mismo
    if (req.user && req.user.userId === parseInt(String(id))) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ mensaje: 'Usuario eliminado exitosamente', usuario: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    console.error('Error al eliminar usuario:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};
