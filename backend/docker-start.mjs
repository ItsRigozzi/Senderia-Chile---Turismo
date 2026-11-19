// Arranque de la API dentro de Docker.
// 1. Si no se definió JWT_SECRET, genera uno aleatorio (las sesiones se cierran al reiniciar el contenedor).
// 2. Si se definieron ADMIN_EMAIL y ADMIN_PASSWORD, crea o actualiza la cuenta administradora.
// 3. Inicia el servidor.
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

if (!process.env.JWT_SECRET?.trim()) {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  console.warn('[docker] JWT_SECRET no definido: se generó uno aleatorio para esta ejecución.');
}

if (process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim()) {
  const result = spawnSync(process.execPath, ['dist/index.js', '--create-admin'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error('[docker] No se pudo crear la cuenta administradora (ver el error anterior). Revisa la conexión a la base y ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres).');
  }
}

await import('./dist/index.js');
