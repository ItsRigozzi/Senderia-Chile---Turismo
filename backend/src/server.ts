// Punto de entrada: valida la configuración, ejecuta los comandos de consola y levanta el servidor HTTP.
import 'dotenv/config';
import pool from './config/db.js';
import { createApp, resolveAllowedOrigins } from './app.js';
import { createAdminSchema, demoTouristSchema } from './validators/schemas.js';
import { configureAdmin, configureDemoTourist } from './services/usuarios.service.js';
import { isEmailConsoleMode } from './services/email.service.js';

const jwtSecretIsPlaceholder = (value: string | undefined): boolean =>
  !value || value.length < 32 || /^(tu_|cambiar|genera|placeholder)/i.test(value);
if (jwtSecretIsPlaceholder(process.env.JWT_SECRET)) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres aleatorios. Genéralo y configúralo en backend/.env.');
}

// ---- Comandos de consola ----

// npm run admin:create → crea o actualiza la cuenta administradora.
if (process.argv.includes('--create-admin')) {
  const parsed = createAdminSchema.safeParse({
    nombre: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  if (!parsed.success) {
    throw new Error('Defina ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres, con letras y números) para crear administrador.');
  }
  const configuredAdmin = await configureAdmin(parsed.data.nombre, parsed.data.email, parsed.data.password);
  console.log(`Administrador configurado: ${configuredAdmin.email}`);
  await pool.end();
  process.exit(0);
}

// npm run demo:tourist → crea o actualiza una cuenta turista ya verificada para pruebas y demostraciones.
if (process.argv.includes('--create-demo-tourist')) {
  const parsed = demoTouristSchema.safeParse({
    nombre: process.env.DEMO_TOURIST_NAME,
    email: process.env.DEMO_TOURIST_EMAIL,
    password: process.env.DEMO_TOURIST_PASSWORD,
  });
  if (!parsed.success) {
    throw new Error('Defina DEMO_TOURIST_NAME, DEMO_TOURIST_EMAIL y DEMO_TOURIST_PASSWORD (mínimo 8 caracteres, con letras y números).');
  }
  const tourist = await configureDemoTourist(parsed.data.nombre, parsed.data.email, parsed.data.password);
  console.log(tourist
    ? `Turista de demostración configurado: ${tourist.email}`
    : `No se configuró el turista de demostración: ${parsed.data.email} pertenece a un administrador.`);
  await pool.end();
  process.exit(0);
}

// ---- Servidor HTTP ----

const requiredEnv = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) throw new Error(`Faltan variables requeridas: ${missingEnv.join(', ')}`);

const PORT = Number(process.env.PORT || 3000);
// 0.0.0.0 permite conexiones desde fuera del contenedor Docker.
const HOST = process.env.HOST?.trim() || '0.0.0.0';
const allowedOrigins = resolveAllowedOrigins();
const app = createApp(allowedOrigins);

app.listen(PORT, HOST, async () => {
  console.log(`CORS habilitado para: ${allowedOrigins.join(', ')}`);
  if (isEmailConsoleMode()) {
    console.warn('[MODO DESARROLLO] SMTP no configurado: los códigos de verificación y recuperación se mostrarán en esta consola.');
  }
  try {
    await pool.query('SELECT 1');
    console.log(`Servidor Senderia conectado a PostgreSQL en http://localhost:${PORT} (escuchando en ${HOST})`);
  } catch (error) {
    console.error('PostgreSQL no está disponible. Las rutas persistentes responderán 503.', error instanceof Error ? error.message : error);
  }
});
