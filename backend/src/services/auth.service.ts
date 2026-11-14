import pool from '../config/db.js';
import type { PoolClient } from 'pg';

export type AuthAccount = {
  id: number;
  nombre: string;
  email: string;
  password_hash: string | null;
  rol: 'turista' | 'admin';
  created_at?: Date;
  google_sub?: string | null;
  email_verificado?: boolean;
  email_verificado_en?: Date | null;
  password_changed_at?: Date | null;
};

export async function createTouristAccount(
  nombre: string,
  email: string,
  passwordHash: string,
) {
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, email_verificado)
     VALUES ($1, $2, $3, 'turista', FALSE)
     RETURNING id, nombre, email, rol, created_at, email_verificado`,
    [nombre, email.trim().toLowerCase(), passwordHash],
  );
  return result.rows[0];
}

export async function findAccountByEmail(email: string): Promise<AuthAccount | undefined> {
  const result = await pool.query<AuthAccount>(
    `SELECT id, nombre, email, password_hash, google_sub, rol,
            email_verificado, email_verificado_en, password_changed_at
     FROM usuarios WHERE lower(btrim(email)) = $1`,
    [email.trim().toLowerCase()],
  );
  return result.rows[0];
}

export async function findSessionUser(userId: number) {
  const result = await pool.query(
    'SELECT id, nombre, email, rol, email_verificado, created_at FROM usuarios WHERE id = $1',
    [userId],
  );
  return result.rows[0];
}

const googleAccountQuery = `
  SELECT id, nombre, email, password_hash, google_sub, rol,
         email_verificado, email_verificado_en, password_changed_at
  FROM usuarios
`;

async function findGoogleAccount(client: PoolClient, subject: string, email: string): Promise<AuthAccount | undefined> {
  const bySubject = await client.query<AuthAccount>(
    `${googleAccountQuery} WHERE google_sub = $1 FOR UPDATE`,
    [subject],
  );
  if (bySubject.rows[0]) return bySubject.rows[0];

  const byEmail = await client.query<AuthAccount>(
    `${googleAccountQuery} WHERE lower(btrim(email)) = $1 FOR UPDATE`,
    [email],
  );
  return byEmail.rows[0];
}

export async function createOrLinkGoogleTourist(subject: string, email: string, nombre: string): Promise<AuthAccount> {
  const client = await pool.connect();
  const normalizedEmail = email.trim().toLowerCase();
  try {
    await client.query('BEGIN');
    const account = await findGoogleAccount(client, subject, normalizedEmail);

    if (account) {
      if (account.rol !== 'turista') {
        const error = new Error('El acceso con Google solo está disponible para cuentas de turista.') as Error & { code: string };
        error.code = 'GOOGLE_ADMIN_DENIED';
        throw error;
      }
      if (account.google_sub && account.google_sub !== subject) {
        const error = new Error('Este correo ya está vinculado a otra cuenta de Google.') as Error & { code: string };
        error.code = 'GOOGLE_ACCOUNT_CONFLICT';
        throw error;
      }

      const linked = await client.query<AuthAccount>(
        `UPDATE usuarios
         SET google_sub = $2, email_verificado = TRUE,
             email_verificado_en = COALESCE(email_verificado_en, CURRENT_TIMESTAMP)
         WHERE id = $1
         RETURNING id, nombre, email, password_hash, google_sub, rol,
                   email_verificado, email_verificado_en, password_changed_at`,
        [account.id, subject],
      );
      await client.query('COMMIT');
      return linked.rows[0];
    }

    const created = await client.query<AuthAccount>(
      `INSERT INTO usuarios (nombre, email, password_hash, google_sub, email_verificado, email_verificado_en, rol)
       VALUES ($1, $2, NULL, $3, TRUE, CURRENT_TIMESTAMP, 'turista')
       RETURNING id, nombre, email, password_hash, google_sub, rol,
                 email_verificado, email_verificado_en, password_changed_at`,
      [nombre, normalizedEmail, subject],
    );
    await client.query('COMMIT');
    return created.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function markEmailVerified(usuarioId: number, client: PoolClient): Promise<void> {
  const result = await client.query(
    `UPDATE usuarios SET email_verificado = TRUE,
       email_verificado_en = COALESCE(email_verificado_en, CURRENT_TIMESTAMP)
     WHERE id = $1 AND rol = 'turista'`,
    [usuarioId],
  );
  if (result.rowCount !== 1) throw new Error('La cuenta ya no está disponible para verificar.');
}

export async function updateTouristPassword(usuarioId: number, passwordHash: string, client: PoolClient): Promise<void> {
  const result = await client.query(
    `UPDATE usuarios SET password_hash = $2,
       password_changed_at = GREATEST(CURRENT_TIMESTAMP, COALESCE(password_changed_at, '-infinity'::timestamptz) + INTERVAL '1 millisecond')
     WHERE id = $1 AND rol = 'turista'`,
    [usuarioId, passwordHash],
  );
  if (result.rowCount !== 1) throw new Error('La cuenta ya no está disponible para recuperar su contraseña.');
}
