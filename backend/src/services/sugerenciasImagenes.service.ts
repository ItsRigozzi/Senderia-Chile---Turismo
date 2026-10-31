import pool from '../config/db.js';

export interface SugerenciaImagenInput {
  comentario: string | null;
}

export async function createSuggestion(
  destinationId: number,
  userId: number,
  file: { filename: string; mimetype: string; size: number },
  input: SugerenciaImagenInput,
) {
  const result = await pool.query(
    `INSERT INTO sugerencias_imagenes
       (destino_id, usuario_id, autor_nombre, archivo_nombre, mime_type, tamano_bytes,
        comentario, declara_tener_derechos, acepta_atribucion)
     SELECT d.id, u.id, u.nombre, $3, $4, $5, $6, TRUE, TRUE
     FROM destinos d
     JOIN usuarios u ON u.id = $2
     WHERE d.id = $1 AND d.activo = TRUE
     RETURNING id, destino_id, autor_nombre, comentario, estado, created_at`,
    [destinationId, userId, file.filename, file.mimetype, file.size, input.comentario],
  );
  return result.rows[0];
}

export async function listApprovedImages(destinationId: number) {
  const destination = await pool.query(
    'SELECT id FROM destinos WHERE id = $1 AND activo = TRUE',
    [destinationId],
  );
  if (destination.rows.length === 0) return undefined;

  const result = await pool.query(
    `SELECT id, autor_nombre, comentario, created_at
     FROM sugerencias_imagenes
     WHERE destino_id = $1 AND estado = 'aprobada'
     ORDER BY created_at DESC, id DESC`,
    [destinationId],
  );
  return result.rows;
}

export async function findApprovedImage(destinationId: number, imageId: number) {
  const result = await pool.query(
    `SELECT archivo_nombre, mime_type
     FROM sugerencias_imagenes s
     JOIN destinos d ON d.id = s.destino_id
     WHERE s.id = $2 AND s.destino_id = $1 AND s.estado = 'aprobada' AND d.activo = TRUE`,
    [destinationId, imageId],
  );
  return result.rows[0];
}

export async function listPendingSuggestions() {
  const result = await pool.query(
    `SELECT s.id, s.destino_id, d.nombre AS destino_nombre, r.nombre AS region_nombre,
            c.nombre AS categoria_nombre,
            s.autor_nombre, s.comentario, s.mime_type, s.tamano_bytes, s.created_at
     FROM sugerencias_imagenes s
     JOIN destinos d ON d.id = s.destino_id
     JOIN regiones r ON r.id = d.region_id
     JOIN categorias c ON c.id = d.categoria_id
     WHERE s.estado = 'pendiente' AND d.activo = TRUE
     ORDER BY s.created_at ASC, s.id ASC`,
  );
  return result.rows;
}

export async function findPendingImage(imageId: number) {
  const result = await pool.query(
    `SELECT archivo_nombre, mime_type
     FROM sugerencias_imagenes
     WHERE id = $1 AND estado = 'pendiente'`,
    [imageId],
  );
  return result.rows[0];
}

export async function reviewSuggestion(imageId: number, adminId: number, estado: 'aprobada' | 'rechazada') {
  const result = await pool.query(
    `UPDATE sugerencias_imagenes
     SET estado = $3, revisado_por = $2, revisado_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND estado = 'pendiente'
     RETURNING id, estado`,
    [imageId, adminId, estado],
  );
  if (result.rows[0]) return { result: result.rows[0], alreadyReviewed: false };

  const existing = await pool.query('SELECT id FROM sugerencias_imagenes WHERE id = $1', [imageId]);
  return { result: undefined, alreadyReviewed: existing.rows.length > 0 };
}
