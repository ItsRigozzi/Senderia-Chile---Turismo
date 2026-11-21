# Sendería Chile — Backend

API REST con Node.js, Express, TypeScript y PostgreSQL. Contiene el servidor, las rutas, la conexión a la base de datos, los archivos SQL, las pruebas y la colección Postman.

- **Documentación de cada endpoint** (acceso, cuerpo, respuesta y errores): [`API.md`](API.md)
- **Colección Postman:** [`postman/Senderia-API.postman_collection.json`](postman/Senderia-API.postman_collection.json)

## Estructura

```text
backend/
├── Dockerfile · docker-start.mjs   # Imagen y arranque en Docker
├── API.md                          # Documentación de endpoints
├── postman/                        # Colección, entorno, imagen de prueba y evidencia
├── scripts/init-db.ps1             # Inicializa PostgreSQL sin Docker
├── test/                           # Pruebas de validación e integración
└── src/
    ├── app.ts                      # Configuración de Express (middlewares, rutas, errores)
    ├── server.ts                   # Variables de entorno, comandos de consola y arranque
    ├── config/                     # Conexión a PostgreSQL y carpeta de imágenes
    ├── controllers/                # Respuestas HTTP
    ├── middleware/                 # JWT, roles, subida de imágenes y manejador global de errores
    ├── routes/                     # Rutas REST
    ├── services/                   # Consultas SQL, correo, Google, límite de intentos
    ├── validators/                 # Validaciones con Zod
    └── db/                         # Archivos SQL (ver abajo)
```

## Base de datos

| Orden | Archivo | Contenido |
|---|---|---|
| 1 | [`src/db/migraciones.sql`](src/db/migraciones.sql) | Actualiza bases creadas con versiones anteriores (columnas nuevas, restricciones y conversión de fechas a `TIMESTAMPTZ`). En una base nueva no hace nada |
| 2 | [`src/db/init.sql`](src/db/init.sql) | Esquema completo: tablas (incluidas las del catálogo SERNATUR), claves primarias y foráneas, restricciones, índices, vista de revisión y triggers |
| 3 | [`src/db/seed.sql`](src/db/seed.sql) | Regiones, categorías y destinos de muestra |
| 4 | [`src/db/sernatur_carga_unica.sql`](src/db/sernatur_carga_unica.sql) | Solo datos: catálogo oficial SERNATUR (4.881 registros, 478 destinos publicados con coordenadas e imágenes con atribución). No crea tablas |

Docker y `scripts/init-db.ps1` ejecutan los cuatro archivos en ese orden. Todos son re-ejecutables: aplicarlos de nuevo no duplica datos ni cambia el esquema.

- **Fechas:** todas las columnas de fecha usan `TIMESTAMPTZ`, que guarda el instante exacto sin ambigüedad de zona horaria.
- **`updated_at` automático:** el trigger `fn_actualizar_updated_at` lo actualiza en `destinos`, `opiniones` y `sernatur_destinos_revision` en cada `UPDATE`, aunque la consulta no lo mencione.

### Actualizar una base existente

Docker ejecuta los archivos SQL solo cuando crea la base por primera vez. Si ya tenías la base de Docker de una versión anterior, elige una opción:

- **Conservar los datos:** con la aplicación levantada, desde la raíz del repositorio (PowerShell):
  ```powershell
  foreach ($f in 'migraciones','init','seed','sernatur_carga_unica') { Get-Content -Raw -Encoding UTF8 "backend\src\db\$f.sql" | docker compose exec -T db psql -v ON_ERROR_STOP=1 -q -U senderia -d senderia }
  ```
- **Empezar desde cero (borra los datos):** `docker compose down -v` y luego `docker compose up --build -d`.

Sin Docker, basta con volver a ejecutar `scripts/init-db.ps1`.

## Ejecutar

### Con Docker (recomendado)

Desde la raíz del repositorio: `docker compose up --build -d`. La guía completa está en el [README principal](../README.md).

Docker crea solo estas cuentas de prueba:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@senderia.cl` | `SenderiaAdmin2026` |
| Turista (correo ya verificado) | `turista@senderia.cl` | `Turista2026` |

### Sin Docker

Requiere Node.js 22.12 o superior y PostgreSQL 14 o superior.

1. Copia `.env.example` como `.env` y completa `DB_*`. En `JWT_SECRET` pon un texto aleatorio de 32 o más caracteres:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Crea la base y carga los datos (desde la raíz del repositorio):
   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\backend\scripts\init-db.ps1
   ```
3. Instala, crea las cuentas de prueba e inicia (en `backend/`):
   ```powershell
   npm install
   $env:ADMIN_NAME='Administrador Senderia'; $env:ADMIN_EMAIL='admin@senderia.cl'; $env:ADMIN_PASSWORD='SenderiaAdmin2026'
   npm run admin:create
   $env:DEMO_TOURIST_NAME='Turista Demo'; $env:DEMO_TOURIST_EMAIL='turista@senderia.cl'; $env:DEMO_TOURIST_PASSWORD='Turista2026'
   npm run demo:tourist
   npm run dev
   ```

La API queda en `http://localhost:3000/api`. Sin `SMTP_USER` ni `SMTP_PASS`, los códigos de verificación y recuperación se muestran en la consola del backend (modo desarrollo; nunca con `NODE_ENV=production`).

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia la API con recarga automática |
| `npm run build` / `npm start` | Compila a `dist/` / inicia la versión compilada |
| `npm run admin:create` | Crea o actualiza el administrador (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) |
| `npm run demo:tourist` | Crea o actualiza un turista verificado (`DEMO_TOURIST_*`) |
| `npm test` | Compila y ejecuta las pruebas de validación |
| `npm run test:api` | Prueba de integración contra la API en ejecución |

## Pruebas

| Prueba | Cómo ejecutarla | Qué cubre |
|---|---|---|
| Validaciones y errores | `npm test` | Contraseñas, imágenes, coordenadas, IDs, filtros y manejador de errores: 500 frente a 503 y JSON malformado (15 pruebas) |
| Integración | `npm run test:api` con la API corriendo | PostgreSQL real, errores en JSON, cabeceras de seguridad, registro con verificación, roles, CRUD de categorías y destinos, filtros, favoritos y opiniones. Crea sus propios datos (no depende de SERNATUR) y falla si la limpieza deja datos huérfanos |
| Postman | Ver abajo | 31 de los 34 endpoints con sus casos de error: 64 solicitudes y 164 aserciones. Quedan fuera reenviar el código, confirmar la recuperación con código e iniciar sesión con Google, porque necesitan un código real del correo o una cuenta de Google; están documentados en `API.md` |

`npm run test:api` usa por defecto las cuentas de Docker; se pueden cambiar con `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `TOURIST_EMAIL`, `TOURIST_PASSWORD` y `API_BASE_URL`.

### Colección Postman

1. Con la API corriendo, importa en Postman [`Senderia-API.postman_collection.json`](postman/Senderia-API.postman_collection.json) y el entorno [`Senderia-local.postman_environment.json`](postman/Senderia-local.postman_environment.json), y selecciona el entorno.
2. En **Settings → General → Working directory** elige la carpeta `backend/postman` (para la imagen de prueba `fixtures/foto-prueba.png`).
3. Ejecuta la colección completa en orden (**Run collection**). Crea datos temporales y los elimina al final.

Sin Postman, desde `backend/postman`:

```bash
npx newman run Senderia-API.postman_collection.json -e Senderia-local.postman_environment.json --working-dir .
```

### Evidencia

- [`postman/evidencia/Senderia-API-newman.png`](postman/evidencia/Senderia-API-newman.png): ejecución de la colección (164/164 aserciones).
- [`postman/evidencia/Senderia-API.newman-resumen.json`](postman/evidencia/Senderia-API.newman-resumen.json): resultado de cada solicitud, sin tokens ni contraseñas.
- [`postman/evidencia/Senderia-pruebas-automaticas.png`](postman/evidencia/Senderia-pruebas-automaticas.png): pruebas de validación, integración y frontend.

## Seguridad

- Contraseñas con bcrypt; mínimo 8 caracteres, con letras y números.
- JWT `HS256` (algoritmo fijo) que expira en 24 horas y se invalida al cambiar la contraseña.
- Roles verificados en el backend; un admin no puede quitarse el rol ni eliminarse, y siempre queda al menos uno.
- Límite de 5 intentos fallidos de login por cuenta (bloqueo de 15 minutos).
- Consultas SQL parametrizadas, validación con Zod e `imagen_url` limitada a `http(s)` o rutas internas.
- `helmet`, sin `X-Powered-By`, CORS solo para los orígenes de `CORS_ORIGINS`.
- Manejador global de errores: la API siempre responde JSON, sin stack trace, con `500` para errores inesperados y `503` si PostgreSQL no está disponible.
