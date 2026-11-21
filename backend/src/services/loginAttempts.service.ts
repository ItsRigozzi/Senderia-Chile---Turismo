// Limita los intentos fallidos de inicio de sesión para frenar ataques de fuerza bruta.
// Se guarda en memoria: suficiente para una sola instancia de la API.

const MAX_FAILURES_PER_ACCOUNT = 5;   // por combinación IP + correo
const MAX_FAILURES_PER_IP = 100;      // por IP, sin importar el correo (holgado: en Docker todo el equipo comparte IP)
const WINDOW_MS = 15 * 60 * 1000;     // ventana de conteo
const LOCK_MS = 15 * 60 * 1000;       // duración del bloqueo

interface AttemptRecord {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
}

const attempts = new Map<string, AttemptRecord>();

const accountKey = (ip: string, email: string) => `acc:${ip}|${email.trim().toLowerCase()}`;
const ipKey = (ip: string) => `ip:${ip}`;

const getRecord = (key: string, now: number): AttemptRecord | undefined => {
  const record = attempts.get(key);
  if (!record) return undefined;
  const lockExpired = record.lockedUntil <= now;
  const windowExpired = now - record.firstFailureAt > WINDOW_MS;
  if (lockExpired && windowExpired) {
    attempts.delete(key);
    return undefined;
  }
  return record;
};

/** Segundos que faltan para poder reintentar, o 0 si no hay bloqueo. */
export function getLoginLockSeconds(ip: string, email: string, now = Date.now()): number {
  const lockedUntil = Math.max(
    getRecord(accountKey(ip, email), now)?.lockedUntil ?? 0,
    getRecord(ipKey(ip), now)?.lockedUntil ?? 0,
  );
  return lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0;
}

const registerFailure = (key: string, limit: number, now: number) => {
  const record = getRecord(key, now) ?? { failures: 0, firstFailureAt: now, lockedUntil: 0 };
  record.failures += 1;
  if (record.failures >= limit) record.lockedUntil = now + LOCK_MS;
  attempts.set(key, record);
};

export function registerLoginFailure(ip: string, email: string, now = Date.now()): void {
  registerFailure(accountKey(ip, email), MAX_FAILURES_PER_ACCOUNT, now);
  registerFailure(ipKey(ip), MAX_FAILURES_PER_IP, now);
}

/** Un inicio de sesión correcto limpia el contador de esa cuenta. */
export function clearLoginFailures(ip: string, email: string): void {
  attempts.delete(accountKey(ip, email));
}

// Limpieza periódica para que el mapa no crezca indefinidamente.
setInterval(() => {
  const now = Date.now();
  for (const key of attempts.keys()) getRecord(key, now);
}, WINDOW_MS).unref();
