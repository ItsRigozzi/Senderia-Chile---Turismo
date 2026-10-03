# Senderia Chile — Entrega Parcial 2

Aplicación turística Ionic + React conectada a una API REST Node.js + Express + TypeScript y PostgreSQL. La autenticación usa JWT (24 horas), contraseñas bcrypt y control de roles `turista`/`admin`.

## Requisitos

- Node.js 20.19+ y npm.
- PostgreSQL 14+ con el servicio iniciado.
- PowerShell en Windows para el script de preparación de base incluido.

## Preparación local

1. Crear la base y el usuario PostgreSQL (o utilizar una instancia propia).
2. Copiar `backend/.env.example` a `backend/.env` y completar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`. Reemplazar el `JWT_SECRET` de ejemplo por uno aleatorio propio de al menos 32 caracteres (por ejemplo, con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Si se deja el valor de ejemplo, al iniciar la API se genera una clave de desarrollo al vuelo; las sesiones dejan de servir al reiniciar. `backend/.env` contiene secretos locales y no se sube a Git.
3. En PowerShell, desde la raíz del repositorio:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   # Editar backend/.env con los datos reales de PostgreSQL
   ./backend/scripts/init-db.ps1
   ```

   El script ejecuta `backend/src/db/init.sql` y luego `backend/src/db/seed.sql`. Los archivos se pueden ejecutar manualmente en ese mismo orden si se usa otro sistema operativo.

4. Crear la primera cuenta administrativa. Define `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` (12 caracteres o más) solo en el entorno local, luego ejecuta:

   ```powershell
   cd backend
   $env:ADMIN_NAME = 'Administrador Senderia'
   $env:ADMIN_EMAIL = 'admin@senderia.cl'
   $env:ADMIN_PASSWORD = 'reemplazar-por-clave-segura'
   npm install
   npm run admin:create
   npm run dev
   ```

   `npm run admin:create` crea o actualiza el admin usando bcrypt. El seed no incluye una cuenta privilegiada ni una contraseña conocida. El registro público solo crea turistas.

5. En otra terminal:

   ```powershell
   cd frontend
   Copy-Item .env.example .env.local
   npm install
   npm run dev
   ```

   Si API no está en `http://localhost:3000/api`, configura `VITE_API_URL` en `frontend/.env.local`. Dirección de desarrollo: `http://localhost:5173`.

## Endpoints

Todas las respuestas usan JSON. Las operaciones administrativas requieren `Authorization: Bearer <token>` de un admin; favoritos requieren usuario autenticado. Las consultas de destinos devuelven `source: "database"` para identificar los registros persistidos.

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| GET | `/api/health` | Público | Estado del servidor |
| POST | `/api/auth/register` | Público | Registrar turista |
| POST | `/api/auth/login` | Público | Iniciar sesión y recibir JWT |
| GET | `/api/auth/me` | JWT | Consultar la identidad vigente desde PostgreSQL |
| GET | `/api/destinos?categoria=<slug>&region=<slug>` | Público | Listar/filtrar destinos |
| GET | `/api/destinos/:id` | Público | Leer destino |
| POST | `/api/destinos` | Admin | Crear destino |
| PUT | `/api/destinos/:id` | Admin | Actualizar destino |
| DELETE | `/api/destinos/:id` | Admin | Eliminar destino |
| GET | `/api/categorias` | Público | Listar categorías |
| GET | `/api/categorias/regiones` | Público | Listar regiones |
| POST/PUT/DELETE | `/api/categorias[/<id>]` | Admin | CRUD de categorías |
| GET/PATCH/DELETE | `/api/usuarios[/<id>]` | Admin | Listar, actualizar rol/nombre y eliminar usuario |
| GET/POST | `/api/favoritos` | JWT | Listar/agregar favoritos propios |
| DELETE | `/api/favoritos/:id` | JWT | Quitar favorito propio |

Validación de entradas con Zod, SQL parametrizado, claves con bcrypt y autorización aplicada también en la API. Si PostgreSQL no está disponible, las rutas persistentes responden `503`; no sustituyen datos reales por datos de muestra.

## Pruebas reproducibles

1. Con PostgreSQL inicializado, una cuenta admin creada y backend activo, configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno y ejecuta desde `backend/` `npm run test:api`. La prueba crea un turista, categoría, destino y favorito temporales; comprueba registro/login, JWT, persistencia PostgreSQL, CRUD, autorización admin/turista y hashes no expuestos; al terminar elimina sus datos temporales.
2. Para una segunda ejecución manual, importa `backend/postman/Senderia-EP2.postman_collection.json` en Postman, configura `adminEmail`, `adminPassword`, `turistaEmail` nuevo y `turistaPassword`, y ejecuta las solicitudes en orden. La colección comprueba health, autenticación, roles y CRUD de destinos.
3. Verifica persistencia en otra conexión PostgreSQL con `SELECT id, nombre FROM destinos ORDER BY id;` y `SELECT id, nombre, email, rol FROM usuarios ORDER BY id;`.
4. Compila ambos proyectos con `npm run build` desde `backend/` y `frontend/`. Ejecuta las validaciones backend con `npm test`; la prueba de UI está disponible con `npm run test.unit -- --run` en frontend. `npm run test:api` ejecuta la integración real y requiere la API, PostgreSQL y credenciales admin.

## Guía de implementación por rúbrica EP2

- **EP 2.1:** `backend/src/index.ts`, `backend/src/routes/` y `backend/src/controllers/`.
- **EP 2.2:** modelo reproducible `backend/src/db/init.sql`; datos de muestra `backend/src/db/seed.sql`.
- **EP 2.3:** CRUD REST de destinos/categorías y operaciones de usuarios/favoritos descritas arriba.
- **EP 2.4:** `backend/src/middleware/auth.ts`, `backend/src/middleware/roleGuard.ts`, `frontend/src/context/AuthContext.tsx`.
- **EP 2.5:** bcrypt, secreto JWT obligatorio, Zod, consultas parametrizadas y autorización por rol.
- **EP 2.6:** cliente en `frontend/src/services/api.ts`; vistas Ionic conectadas; panel admin CRUD real en `frontend/src/pages/AdminDashboard.tsx`.
- **EP 2.7:** colección con asserts Postman en `backend/postman/`, casos esperados en esta guía y build verificable.
- **Documentación/gestión:** guía de puesta en marcha y ramas listadas abajo.

## Rama y acceso de evaluación

La entrega EP2 está publicada en la rama `backend/ep2` del repositorio [Senderia-Chile---Turismo](https://github.com/ItsRigozzi/Senderia-Chile---Turismo/tree/backend/ep2). Para obtenerla en otro equipo:

```powershell
git fetch origin
git switch backend/ep2
git pull
```

Ingresa la URL del repositorio en la planilla del Aula Virtual y comprueba que el profesor/ayudante tenga acceso. Si el repositorio es privado, agrega a las personas evaluadoras con los permisos que solicite el curso.
