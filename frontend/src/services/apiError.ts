import axios from 'axios';

interface ApiErrorBody {
  error?: string;
  code?: string;
  email?: string;
  detalles?: Record<string, string[]>;
}

export const getApiErrorBody = (error: unknown): ApiErrorBody | undefined => {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return undefined;
  const data = error.response?.data;
  // Solo se acepta un cuerpo JSON con forma de objeto (no HTML ni texto).
  return data && typeof data === 'object' ? data : undefined;
};

export const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor. Comprueba tu conexión o que el backend esté activo e intenta nuevamente.';
export const TIMEOUT_ERROR_MESSAGE = 'El servidor tardó demasiado en responder. Intenta nuevamente en unos segundos.';
const SERVER_ERROR_MESSAGE = 'El servidor tuvo un problema al procesar la solicitud. Intenta nuevamente más tarde.';
const UNAVAILABLE_MESSAGE = 'El servicio no está disponible en este momento. Intenta nuevamente en unos minutos.';
const FORBIDDEN_MESSAGE = 'No tienes permisos para realizar esta acción.';
const TOO_MANY_REQUESTS_MESSAGE = 'Demasiados intentos. Espera unos minutos e intenta nuevamente.';

/** Indica si el error se produjo porque no hubo respuesta del servidor (caído, sin red o tiempo agotado). */
export const isNetworkError = (error: unknown): boolean =>
  axios.isAxiosError(error) && !error.response;

/**
 * Devuelve un mensaje claro para mostrar al usuario según el tipo de error:
 * sin conexión, tiempo agotado, 403, 429, 5xx o el mensaje que entregó la API.
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback;

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return TIMEOUT_ERROR_MESSAGE;
  if (!error.response) return NETWORK_ERROR_MESSAGE;

  const { status } = error.response;
  const serverMessage = getApiErrorBody(error)?.error;

  if (status === 403) return serverMessage || FORBIDDEN_MESSAGE;
  if (status === 429) return serverMessage || TOO_MANY_REQUESTS_MESSAGE;
  if (status === 502 || status === 503 || status === 504) return serverMessage || UNAVAILABLE_MESSAGE;
  if (status >= 500) return serverMessage || SERVER_ERROR_MESSAGE;
  return serverMessage || fallback;
};
