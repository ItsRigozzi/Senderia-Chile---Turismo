import pool from '../config/db.js';
import type { destinoSchema, destinoUpdateSchema, destinosQuerySchema } from '../validators/schemas.js';
import type { z } from 'zod';

type DestinoInput = z.infer<typeof destinoSchema>;
type DestinoUpdate = z.infer<typeof destinoUpdateSchema>;
type DestinoFiltros = z.infer<typeof destinosQuerySchema>;
type ResolvedDestinoInput = Omit<DestinoInput, 'latitud' | 'longitud'> & { latitud: number; longitud: number };
export type PersistedDestinoUpdate = Omit<DestinoUpdate, 'latitud' | 'longitud'> & { latitud?: number; longitud?: number };

// Dentro de cada filtro los valores se combinan con OR (ANY) y entre filtros con AND.
export async function listDestinos({ categoria, region }: DestinoFiltros) {
  let query = `
    SELECT d.*, c.nombre as categoria_nombre, c.slug as categoria_slug,
           r.nombre as region_nombre, r.slug as region_slug
    FROM destinos d
    JOIN categorias c ON d.categoria_id = c.id
    JOIN regiones r ON d.region_id = r.id
  `;
  const conditions: string[] = ['d.activo = TRUE'];
  const params: string[][] = [];

  if (categoria.length > 0) {
    params.push(categoria);
    conditions.push(`c.slug = ANY($${params.length}::text[])`);
  }
  if (region.length > 0) {
    params.push(region);
    conditions.push(`r.slug = ANY($${params.length}::text[])`);
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
     WHERE d.id = $1 AND d.activo = TRUE`,
    [id],
  );
  return result.rows[0];
}

export async function findRegionNameById(id: number): Promise<string | undefined> {
  const result = await pool.query('SELECT nombre FROM regiones WHERE id = $1', [id]);
  return result.rows[0]?.nombre;
}

export async function createDestino(data: ResolvedDestinoInput) {
  const { nombre, descripcion, categoria_id, region_id, latitud, longitud, horario, condiciones_acceso, imagen_url } = data;
  const result = await pool.query(
    `INSERT INTO destinos (nombre, descripcion, categoria_id, region_id, latitud, longitud, horario, condiciones_acceso, imagen_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [nombre, descripcion || null, categoria_id, region_id, latitud, longitud, horario || null, condiciones_acceso || null, imagen_url || null],
  );
  return result.rows[0];
}

export async function updateDestino(id: number, fields: PersistedDestinoUpdate) {
  const keys = Object.keys(fields) as (keyof PersistedDestinoUpdate)[];
  if (keys.length === 0) return undefined;

  const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  const values: unknown[] = keys.map((key) => fields[key]);
  values.push(id);

  const result = await pool.query(
    `UPDATE destinos SET ${setClauses.join(', ')} WHERE id = $${values.length} AND activo = TRUE RETURNING *`,
    values,
  );
  return result.rows[0];
}

export async function deleteDestino(id: number) {
  const result = await pool.query(
    'UPDATE destinos SET activo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND activo = TRUE RETURNING id, nombre',
    [id],
  );
  return result.rows[0];
}
