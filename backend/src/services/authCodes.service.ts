import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { PoolClient } from 'pg';
import pool from '../config/db.js';

export type AuthCodePurpose = 'verificacion' | 'recuperacion';
export type AuthCodeOutcome = 'valid' | 'missing' | 'expired' | 'invalid' | 'locked';

const requestedTtl = Number(process.env.AUTH_EMAIL_CODE_TTL_MINUTES || 10);
export const AUTH_EMAIL_CODE_TTL_MINUTES = Number.isFinite(requestedTtl)
  ? Math.max(5, Math.min(30, requestedTtl))
  : 10;

const hashCode = (code: string): string => createHmac('sha256', process.env.JWT_SECRET || 'senderia-dev-invalid')
  .update(code)
  .digest('hex');

export async function discardAuthEmailCode(usuarioId: number, purpose: AuthCodePurpose, code: string): Promise<void> {
  await pool.query(
    'DELETE FROM auth_email_codes WHERE usuario_id = $1 AND proposito = $2 AND codigo_hash = $3',
    [usuarioId, purpose, hashCode(code)],
  );
}

export async function issueAuthEmailCode(
  usuarioId: number,
  purpose: AuthCodePurpose,
): Promise<{ code: string; issued: boolean }> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const result = await pool.query(
    `INSERT INTO auth_email_codes (usuario_id, proposito, codigo_hash, expira_at, intentos)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP + ($4 * INTERVAL '1 minute'), 0)
     ON CONFLICT (usuario_id, proposito) DO UPDATE
       SET codigo_hash = EXCLUDED.codigo_hash,
           expira_at = EXCLUDED.expira_at,
           intentos = 0,
           created_at = CURRENT_TIMESTAMP
       WHERE auth_email_codes.created_at <= CURRENT_TIMESTAMP - INTERVAL '1 minute'
     RETURNING usuario_id`,
    [usuarioId, purpose, hashCode(code), AUTH_EMAIL_CODE_TTL_MINUTES],
  );

  return { code, issued: result.rowCount === 1 };
}

export async function consumeAuthEmailCode(
  usuarioId: number,
  purpose: AuthCodePurpose,
  code: string,
  onValid: (client: PoolClient) => Promise<void>,
): Promise<AuthCodeOutcome> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{
      codigo_hash: string;
      expira_at: Date;
      intentos: number;
    }>(
      `SELECT codigo_hash, expira_at, intentos
       FROM auth_email_codes
       WHERE usuario_id = $1 AND proposito = $2
       FOR UPDATE`,
      [usuarioId, purpose],
    );
    const stored = result.rows[0];

    if (!stored) {
      await client.query('COMMIT');
      return 'missing';
    }

    if (new Date(stored.expira_at).getTime() <= Date.now()) {
      await client.query('DELETE FROM auth_email_codes WHERE usuario_id = $1 AND proposito = $2', [usuarioId, purpose]);
      await client.query('COMMIT');
      return 'expired';
    }

    if (stored.intentos >= 5) {
      await client.query('COMMIT');
      return 'locked';
    }

    const expectedHash = Buffer.from(stored.codigo_hash, 'hex');
    const receivedHash = Buffer.from(hashCode(code), 'hex');
    const matches = expectedHash.length === receivedHash.length && timingSafeEqual(expectedHash, receivedHash);

    if (!matches) {
      const attempts = stored.intentos + 1;
      if (attempts >= 5) {
        await client.query(
          'UPDATE auth_email_codes SET intentos = $3 WHERE usuario_id = $1 AND proposito = $2',
          [usuarioId, purpose, attempts],
        );
        await client.query('COMMIT');
        return 'locked';
      }
      await client.query(
        'UPDATE auth_email_codes SET intentos = $3 WHERE usuario_id = $1 AND proposito = $2',
        [usuarioId, purpose, attempts],
      );
      await client.query('COMMIT');
      return 'invalid';
    }

    await onValid(client);
    await client.query('DELETE FROM auth_email_codes WHERE usuario_id = $1 AND proposito = $2', [usuarioId, purpose]);
    await client.query('COMMIT');
    return 'valid';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
