import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

export async function listUsuarios() {
  const result = await pool.query(
    'SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at DESC',
  );
  return result.rows;
}

export async function updateUsuario(id: number, fields: { nombre?: string; rol?: 'turista' | 'admin' }) {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return undefined;

  const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
  const values: unknown[] = keys.map((key) => fields[key]);
  values.push(id);

  const result = await pool.query(
    `UPDATE usuarios SET ${setClauses.join(', ')} WHERE id = $${values.length}
     RETURNING id, nombre, email, rol, created_at`,
    values,
  );
  return result.rows[0];
}

export async function deleteUsuario(id: number) {
  const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email', [id]);
  return result.rows[0];
}

export async function configureAdmin(nombre: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
     SET nombre = EXCLUDED.nombre, password_hash = EXCLUDED.password_hash, rol = 'admin'
     RETURNING id, nombre, email, rol`,
    [nombre, email, passwordHash],
  );
  return result.rows[0];
}
