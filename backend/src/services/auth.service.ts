import pool from '../config/db.js';

export type AuthAccount = {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: 'turista' | 'admin';
  created_at?: Date;
};

export async function createTouristAccount(
  nombre: string,
  email: string,
  passwordHash: string,
) {
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, 'turista')
     RETURNING id, nombre, email, rol, created_at`,
    [nombre, email, passwordHash],
  );
  return result.rows[0];
}

export async function findAccountByEmail(email: string): Promise<AuthAccount | undefined> {
  const result = await pool.query<AuthAccount>(
    'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = $1',
    [email],
  );
  return result.rows[0];
}

export async function findSessionUser(userId: number) {
  const result = await pool.query(
    'SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = $1',
    [userId],
  );
  return result.rows[0];
}
