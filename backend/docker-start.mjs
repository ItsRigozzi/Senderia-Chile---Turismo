// Arranque de la API dentro de Docker.
// 1. Si no se definió JWT_SECRET, genera uno aleatorio (las sesiones se cierran al reiniciar el contenedor).
// 2. Si se definieron ADMIN_EMAIL y ADMIN_PASSWORD, crea o actualiza la cuenta administradora.
// 3. Si se definieron DEMO_TOURIST_EMAIL y DEMO_TOURIST_PASSWORD, crea o actualiza un turista verificado de demostración.
// 4. Inicia el servidor.
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

if (!process.env.JWT_SECRET?.trim()) {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  console.warn('[docker] JWT_SECRET no definido: se generó uno aleatorio para esta ejecución.');
}

const runCommand = (flag, description) => {
  const result = spawnSync(process.execPath, ['dist/server.js', flag], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error(`[docker] No se pudo configurar ${description} (ver el error anterior).`);
  }
};

if (process.env.ADMIN_EMAIL?.trim() && process.env.ADMIN_PASSWORD?.trim()) {
  runCommand('--create-admin', 'la cuenta administradora');
}

if (process.env.DEMO_TOURIST_EMAIL?.trim() && process.env.DEMO_TOURIST_PASSWORD?.trim()) {
  runCommand('--create-demo-tourist', 'el turista de demostración');
}

await import('./dist/server.js');
