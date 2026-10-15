import pool from '../config/db.js';
import type { destinoSchema, destinoUpdateSchema } from '../validators/schemas.js';
import type { z } from 'zod';

type DestinoInput = z.infer<typeof destinoSchema>;
type DestinoUpdate = z.infer<typeof destinoUpdateSchema>;

export async function listDestinos(categoria?: string, region?: string) {
  let query = `
    SELECT d.*, c.nombre as categoria_nombre, c.slug as categoria_slug,
           r.nombre as region_nombre, r.slug as region_slug
    FROM destinos d
    JOIN categorias c ON d.categoria_id = c.id
    JOIN regiones r ON d.region_id = r.id
  `;
  const conditions: string[] = [];
  const params: string[] = [];

  if (categoria) {
    params.push(categoria);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (region) {
    params.push(region);
    conditions.push(`r.slug = $${params.length}`);
  }
  if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
  query += ' ORDER BY d.nombre ASC';

  const result = await pool.query(query, params);
  return result.rows;
}

export async function findDestinoById(id: number) {
  const result = await pool.query(
    `SELECT d.*, c.nombre as categoria_nombre, c.slug as categoria_slug,
            r.nombre as region_nombre, r.slug as region_slug
     FROM destinos d
     JOIN categorias c ON d.categoria_id = c.id
     JOIN regiones r ON d.region_id = r.id
     WHERE d.id = $1`,
    [id],
  );
  return result.rows[0];
}

export async function createDestino(data: DestinoInput) {
  const { nombre, descripcion, categoria_id, region_id, latitud, longitud, horario, condiciones_acceso, imagen_url } = data;
  const result = await pool.query(
    `INSERT INTO destinos (nombre, descripcion, categoria_id, region_id, latitud, longitud, horario, condiciones_acceso, imagen_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [nombre, descripcion || null, categoria_id, region_id, latitud, longitud, horario || null, condiciones_acceso || null, imagen_url || null],
  );
  return result.rows[0];
}

export async function updateDestino(id: number, fields: DestinoUpdate) {
  const keys = Object.keys(fields) as (keyof DestinoUpdate)[];
  if (keys.length === 0) return undefined;

  const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  const values: unknown[] = keys.map((key) => fields[key]);
  values.push(id);

  const result = await pool.query(
    `UPDATE destinos SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return result.rows[0];
}

export async function deleteDestino(id: number) {
  const result = await pool.query('DELETE FROM destinos WHERE id = $1 RETURNING id, nombre', [id]);
  return result.rows[0];
}
