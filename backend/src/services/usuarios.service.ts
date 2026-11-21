import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import pool from '../config/db.js';

export async function listUsuarios() {
  const result = await pool.query(
    'SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY created_at DESC',
  );
  return result.rows;
}

/**
 * Indica si el cambio dejaría al sistema sin administradores.
 * Bloquea las filas de administradores dentro de la transacción para evitar carreras.
 */
async function wouldRemoveLastAdmin(client: PoolClient, id: number): Promise<boolean> {
  const admins = await client.query<{ id: number }>("SELECT id FROM usuarios WHERE rol = 'admin' FOR UPDATE");
  const targetIsAdmin = admins.rows.some((row) => row.id === id);
  return targetIsAdmin && admins.rows.length <= 1;
}

export async function updateUsuario(id: number, fields: { nombre?: string; rol?: 'turista' | 'admin' }) {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  if (keys.length === 0) return undefined;

  const setClauses = keys.map((key, index) => `${key} = $${index + 1}`);
  const values: unknown[] = keys.map((key) => fields[key]);
  values.push(id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (fields.rol && fields.rol !== 'admin' && await wouldRemoveLastAdmin(client, id)) {
      await client.query('ROLLBACK');
      return 'LAST_ADMIN' as const;
    }
    const result = await client.query(
      `UPDATE usuarios SET ${setClauses.join(', ')} WHERE id = $${values.length}
       RETURNING id, nombre, email, rol, created_at`,
      values,
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteUsuario(id: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (await wouldRemoveLastAdmin(client, id)) {
      await client.query('ROLLBACK');
      return 'LAST_ADMIN' as const;
    }
    const result = await client.query('DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email', [id]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Crea o actualiza una cuenta turista con el correo ya verificado (para demostraciones y pruebas).
 * Nunca modifica una cuenta administradora: si el correo pertenece a un admin, devuelve undefined.
 */
export async function configureDemoTourist(nombre: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, email_verificado, email_verificado_en, password_changed_at, rol)
     VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'turista')
     ON CONFLICT ((lower(btrim(email)))) DO UPDATE
     SET nombre = EXCLUDED.nombre, password_hash = EXCLUDED.password_hash,
         email_verificado = TRUE, email_verificado_en = COALESCE(usuarios.email_verificado_en, CURRENT_TIMESTAMP),
         password_changed_at = CURRENT_TIMESTAMP
     WHERE usuarios.rol = 'turista'
     RETURNING id, nombre, email, rol`,
    [nombre, normalizedEmail, passwordHash],
  );
  return result.rows[0];
}

export async function configureAdmin(nombre: string, email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, google_sub, email_verificado, email_verificado_en, password_changed_at, rol)
     VALUES ($1, $2, $3, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin')
     ON CONFLICT ((lower(btrim(email)))) DO UPDATE
     SET nombre = EXCLUDED.nombre, email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash, google_sub = NULL,
         email_verificado = TRUE, email_verificado_en = CURRENT_TIMESTAMP,
         password_changed_at = CURRENT_TIMESTAMP, rol = 'admin'
     RETURNING id, nombre, email, rol`,
    [nombre, normalizedEmail, passwordHash],
  );
  return result.rows[0];
}
