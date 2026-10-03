import { Request, Response } from 'express';
import pool from '../config/db.js';
import { destinoSchema, destinoUpdateSchema } from '../validators/schemas.js';

export const getDestinos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoria, region } = req.query;
    let query = `
      SELECT d.*, c.nombre as categoria_nombre, c.slug as categoria_slug, 
             r.nombre as region_nombre, r.slug as region_slug
      FROM destinos d
      JOIN categorias c ON d.categoria_id = c.id
      JOIN regiones r ON d.region_id = r.id
    `;
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (categoria) {
      params.push(String(categoria));
      conditions.push(`c.slug = $${params.length}`);
    }
    if (region) {
      params.push(String(region));
      conditions.push(`r.slug = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY d.nombre ASC';

    const result = await pool.query(query, params);
    res.json({ destinos: result.rows, source: 'database' });
  } catch (err) {
    console.error('Error al obtener destinos:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const getDestinoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(
        `SELECT d.*, c.nombre as categoria_nombre, c.slug as categoria_slug,
                r.nombre as region_nombre, r.slug as region_slug
         FROM destinos d
         JOIN categorias c ON d.categoria_id = c.id
         JOIN regiones r ON d.region_id = r.id
         WHERE d.id = $1`,
        [id]
      );
    if (result.rows.length > 0) {
      res.json({ destino: result.rows[0], source: 'database' });
      return;
    }
    res.status(404).json({ error: 'Destino no encontrado' });
  } catch (err) {
    console.error('Error al obtener destino:', err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const createDestino = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = destinoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const { nombre, descripcion, categoria_id, region_id, latitud, longitud, horario, condiciones_acceso, imagen_url } = parsed.data;

    const result = await pool.query(
      `INSERT INTO destinos (nombre, descripcion, categoria_id, region_id, latitud, longitud, horario, condiciones_acceso, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [nombre, descripcion || null, categoria_id, region_id, latitud, longitud, horario || null, condiciones_acceso || null, imagen_url || null]
    );

    res.status(201).json({ mensaje: 'Destino creado exitosamente', destino: result.rows[0] });
  } catch (err) {
    console.error('Error al crear destino:', err);
    console.error('Error al crear destino:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const updateDestino = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parsed = destinoUpdateSchema.safeParse(req.body);
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
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    const values = keys.map((key) => fields[key]);
    values.push(id as any);

    const result = await pool.query(
      `UPDATE destinos SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Destino no encontrado' });
      return;
    }

    res.json({ mensaje: 'Destino actualizado exitosamente', destino: result.rows[0] });
  } catch (err) {
    console.error('Error al actualizar destino:', err);
    console.error('Error al actualizar destino:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const deleteDestino = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM destinos WHERE id = $1 RETURNING id, nombre', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Destino no encontrado' });
      return;
    }

    res.json({ mensaje: 'Destino eliminado exitosamente', destino: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar destino:', err);
    console.error('Error al eliminar destino:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};
