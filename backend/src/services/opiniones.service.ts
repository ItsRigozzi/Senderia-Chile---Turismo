import pool from '../config/db.js';

export interface OpinionInput {
  puntuacion: number;
  comentario: string | null;
}

export async function listOpiniones(destinoId: number) {
  const destination = await pool.query(
    'SELECT id FROM destinos WHERE id = $1 AND activo = TRUE',
    [destinoId],
  );
  if (destination.rows.length === 0) return undefined;

  const [summary, opinions] = await Promise.all([
    pool.query(
      `SELECT ROUND(AVG(puntuacion)::numeric, 1) AS calificacion_promedio,
              COUNT(*)::integer AS total_opiniones
       FROM opiniones
       WHERE destino_id = $1`,
      [destinoId],
    ),
    pool.query(
      `SELECT o.id, o.puntuacion, o.comentario, o.created_at, o.updated_at,
              u.nombre AS autor
       FROM opiniones o
       JOIN usuarios u ON u.id = o.usuario_id
       WHERE o.destino_id = $1
       ORDER BY o.updated_at DESC, o.id DESC`,
      [destinoId],
    ),
  ]);

  const row = summary.rows[0];
  return {
    calificacion_promedio: row.calificacion_promedio === null
      ? null
      : Number(row.calificacion_promedio),
    total_opiniones: Number(row.total_opiniones),
    opiniones: opinions.rows,
  };
}

export async function findOpinion(destinoId: number, userId: number) {
  const result = await pool.query(
    `SELECT o.id, o.puntuacion, o.comentario, o.created_at, o.updated_at
     FROM opiniones o
     JOIN destinos d ON d.id = o.destino_id
     WHERE o.destino_id = $1 AND o.usuario_id = $2 AND d.activo = TRUE`,
    [destinoId, userId],
  );
  return result.rows[0];
}

export async function saveOpinion(destinoId: number, userId: number, input: OpinionInput) {
  const result = await pool.query(
    `INSERT INTO opiniones (destino_id, usuario_id, puntuacion, comentario)
     SELECT $1, $2, $3, $4
     WHERE EXISTS (SELECT 1 FROM destinos WHERE id = $1 AND activo = TRUE)
     ON CONFLICT (usuario_id, destino_id) DO UPDATE
       SET puntuacion = EXCLUDED.puntuacion,
           comentario = EXCLUDED.comentario,
           updated_at = CURRENT_TIMESTAMP
     RETURNING id, usuario_id, puntuacion, comentario, created_at, updated_at`,
    [destinoId, userId, input.puntuacion, input.comentario],
  );

  const opinion = result.rows[0];
  if (!opinion) return undefined;

  const author = await pool.query('SELECT nombre FROM usuarios WHERE id = $1', [userId]);
  return { ...opinion, autor: author.rows[0]?.nombre };
}
