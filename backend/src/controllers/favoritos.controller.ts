import { Request, Response } from 'express';
import pool from '../config/db.js';
import { favoritoSchema } from '../validators/schemas.js';

export const getFavoritos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT f.id as favorito_id, f.created_at as guardado_en,
              d.*, c.nombre as categoria_nombre, r.nombre as region_nombre
       FROM favoritos f
       JOIN destinos d ON f.destino_id = d.id
       JOIN categorias c ON d.categoria_id = c.id
       JOIN regiones r ON d.region_id = r.id
       WHERE f.usuario_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ favoritos: result.rows });
  } catch (err) {
    console.error('Error al obtener favoritos:', err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const addFavorito = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parsed = favoritoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const { destino_id } = parsed.data;

    // Verificar que el destino existe
    const destino = await pool.query('SELECT id FROM destinos WHERE id = $1', [destino_id]);
    if (destino.rows.length === 0) {
      res.status(404).json({ error: 'Destino no encontrado' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO favoritos (usuario_id, destino_id) VALUES ($1, $2) ON CONFLICT (usuario_id, destino_id) DO NOTHING RETURNING *',
      [userId, destino_id]
    );

    if (result.rows.length === 0) {
      res.status(409).json({ error: 'El destino ya está en tus favoritos' });
      return;
    }

    res.status(201).json({ mensaje: 'Destino agregado a favoritos', favorito: result.rows[0] });
  } catch (err) {
    console.error('Error al agregar favorito:', err);
    console.error('Error al agregar favorito:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const removeFavorito = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM favoritos WHERE id = $1 AND usuario_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Favorito no encontrado' });
      return;
    }

    res.json({ mensaje: 'Destino eliminado de favoritos' });
  } catch (err) {
    console.error('Error al eliminar favorito:', err);
    console.error('Error al eliminar favorito:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};
