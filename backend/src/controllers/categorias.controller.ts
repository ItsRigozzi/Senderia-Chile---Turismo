import { Request, Response } from 'express';
import pool from '../config/db.js';
import { categoriaSchema, categoriaUpdateSchema } from '../validators/schemas.js';

export const getCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nombre ASC');
    res.json({ categorias: result.rows });
  } catch (err) {
    console.error('Error al obtener categorías:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const getRegiones = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT id, nombre, slug FROM regiones ORDER BY nombre ASC');
    res.json({ regiones: result.rows });
  } catch {
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const createCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = categoriaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const { nombre, slug, descripcion } = parsed.data;

    const existing = await pool.query('SELECT id FROM categorias WHERE nombre = $1 OR slug = $2', [nombre, slug]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Ya existe una categoría con ese nombre o slug' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO categorias (nombre, slug, descripcion) VALUES ($1, $2, $3) RETURNING *',
      [nombre, slug, descripcion || null]
    );

    res.status(201).json({ mensaje: 'Categoría creada exitosamente', categoria: result.rows[0] });
  } catch (err) {
    console.error('Error al crear categoría:', err);
    console.error('Error al crear categoría:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const updateCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = categoriaUpdateSchema.safeParse(req.body);
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
      `UPDATE categorias SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    res.json({ mensaje: 'Categoría actualizada exitosamente', categoria: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
    console.error('Error al actualizar categoría:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const deleteCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar si hay destinos asociados
    const destinos = await pool.query('SELECT COUNT(*) FROM destinos WHERE categoria_id = $1', [id]);
    if (parseInt(destinos.rows[0].count) > 0) {
      res.status(409).json({ 
        error: 'No se puede eliminar la categoría porque tiene destinos asociados',
        destinos_asociados: parseInt(destinos.rows[0].count)
      });
      return;
    }

    const result = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING id, nombre', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }

    res.json({ mensaje: 'Categoría eliminada exitosamente', categoria: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar categoría:', err);
    console.error('Error al eliminar categoría:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};
