import pool from '../config/db.js';

export async function listFavoritos(userId: number) {
  const result = await pool.query(
    `SELECT f.id as favorito_id, f.created_at as guardado_en,
            d.*, c.nombre as categoria_nombre, r.nombre as region_nombre
     FROM favoritos f
     JOIN destinos d ON f.destino_id = d.id
     JOIN categorias c ON d.categoria_id = c.id
     JOIN regiones r ON d.region_id = r.id
     WHERE f.usuario_id = $1
     ORDER BY f.created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function addFavorito(userId: number, destinationId: number) {
  const destination = await pool.query('SELECT id FROM destinos WHERE id = $1', [destinationId]);
  if (destination.rows.length === 0) return { status: 'destination-missing' as const };

  const result = await pool.query(
    'INSERT INTO favoritos (usuario_id, destino_id) VALUES ($1, $2) ON CONFLICT (usuario_id, destino_id) DO NOTHING RETURNING *',
    [userId, destinationId],
  );
  if (result.rows.length === 0) return { status: 'duplicate' as const };
  return { status: 'created' as const, favorito: result.rows[0] };
}

export async function deleteFavorito(userId: number, favoriteId: number) {
  const result = await pool.query(
    'DELETE FROM favoritos WHERE id = $1 AND usuario_id = $2 RETURNING id',
    [favoriteId, userId],
  );
  return result.rows[0];
}
