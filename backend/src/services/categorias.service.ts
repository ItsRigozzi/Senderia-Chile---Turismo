import pool from '../config/db.js';
import type { categoriaSchema, categoriaUpdateSchema } from '../validators/schemas.js';
import type { z } from 'zod';

type CategoriaInput = z.infer<typeof categoriaSchema>;
type CategoriaUpdate = z.infer<typeof categoriaUpdateSchema>;

export async function listCategorias() {
  const result = await pool.query('SELECT * FROM categorias ORDER BY nombre ASC');
  return result.rows;
}

export async function listRegiones() {
  const result = await pool.query('SELECT id, nombre, slug FROM regiones ORDER BY nombre ASC');
  return result.rows;
}

export async function createCategoria(data: CategoriaInput) {
  const { nombre, slug, descripcion } = data;
  const existing = await pool.query('SELECT id FROM categorias WHERE nombre = $1 OR slug = $2', [nombre, slug]);
  if (existing.rows.length > 0) return null;

  const result = await pool.query(
    'INSERT INTO categorias (nombre, slug, descripcion) VALUES ($1, $2, $3) RETURNING *',
    [nombre, slug, descripcion || null],
  );
  return result.rows[0];
}

export async function updateCategoria(id: number, fields: CategoriaUpdate) {
  const keys = Object.keys(fields) as (keyof CategoriaUpdate)[];
  if (keys.length === 0) return undefined;

  const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
  const values: unknown[] = keys.map((key) => fields[key]);
  values.push(id);

  const result = await pool.query(
    `UPDATE categorias SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return result.rows[0];
}

export async function deleteCategoria(id: number) {
  const destinations = await pool.query('SELECT COUNT(*) FROM destinos WHERE categoria_id = $1', [id]);
  const associatedCount = Number.parseInt(destinations.rows[0].count, 10);
  if (associatedCount > 0) return { associatedCount };

  const result = await pool.query('DELETE FROM categorias WHERE id = $1 RETURNING id, nombre', [id]);
  return { associatedCount: 0, categoria: result.rows[0] };
}
