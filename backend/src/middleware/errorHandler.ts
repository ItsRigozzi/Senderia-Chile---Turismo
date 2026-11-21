import type { ErrorRequestHandler, RequestHandler, Response } from 'express';

// Códigos que indican que PostgreSQL no está disponible (no un error de la aplicación).
const DATABASE_UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN',
  '08000', '08001', '08003', '08004', '08006', // connection_exception
  '53300', // too_many_connections
  '57P01', '57P02', '57P03', // admin_shutdown, crash_shutdown, cannot_connect_now
]);

const DATABASE_UNAVAILABLE_MESSAGE = 'La base de datos no está disponible. Intenta nuevamente en unos minutos.';
const INTERNAL_ERROR_MESSAGE = 'Ocurrió un error interno en el servidor. Intenta nuevamente.';

export function isDatabaseUnavailable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof code === 'string' && DATABASE_UNAVAILABLE_CODES.has(code)) return true;
  return typeof message === 'string'
    && /connection terminated|timeout exceeded when trying to connect|connect ECONNREFUSED/i.test(message);
}

/**
 * Responde un error inesperado de un controlador:
 * - 503 si PostgreSQL no está disponible.
 * - 500 para cualquier otro error (sin exponer detalles internos).
 * El detalle solo se registra en la consola del servidor.
 */
export function sendServerError(res: Response, error: unknown, logLabel: string, userMessage?: string): void {
  console.error(logLabel, error instanceof Error ? error.message : error);
  if (res.headersSent) return;
  if (isDatabaseUnavailable(error)) {
    res.status(503).json({ error: DATABASE_UNAVAILABLE_MESSAGE });
    return;
  }
  const safeMessage = userMessage && !/postgres/i.test(userMessage) ? userMessage : INTERNAL_ERROR_MESSAGE;
  res.status(500).json({ error: safeMessage });
}

/** Rutas inexistentes: siempre JSON. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

/**
 * Manejador global de errores (último middleware). Garantiza que la API
 * responda siempre JSON y nunca exponga el stack trace ni rutas internas.
 */
export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const err = error as { type?: string; status?: number; statusCode?: number; message?: string };

  // JSON malformado o cuerpo demasiado grande (body-parser de Express).
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido.' });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: 'El cuerpo de la solicitud es demasiado grande.' });
    return;
  }

  const status = err?.status ?? err?.statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: 'Solicitud inválida.' });
    return;
  }

  sendServerError(res, error, 'Error no controlado:');
};
