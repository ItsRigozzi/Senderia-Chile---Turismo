# Senderia Chile — Entrega Parcial 2 (Windows / PowerShell)

Aplicación turística Ionic + React conectada a una API REST Node.js + Express + TypeScript y PostgreSQL. La autenticación usa JWT (24 horas), contraseñas bcrypt y control de roles `turista`/`admin`.

## Requisitos

- Node.js 22.12 o posterior y npm ([descarga oficial](https://nodejs.org/en/download/)).
- PostgreSQL 14 o posterior ([instalador para Windows](https://www.postgresql.org/download/windows/)). Anota la contraseña del usuario `postgres` y el puerto asignado durante la instalación.
- PowerShell, incluido en Windows. Puedes usar la terminal integrada de Visual Studio Code

Esta guía está escrita para ejecutar el proyecto en Windows usando PowerShell.

## Preparación local

Sigue estos pasos la primera vez que configures el proyecto en un computador.

### 1. Iniciar PostgreSQL

Inicia el servicio de PostgreSQL. pgAdmin sirve para administrar y comprobar la conexión, pero no necesita permanecer abierto mientras funciona el proyecto. Si hay más de un servidor PostgreSQL instalado, confirma en pgAdmin cuál usarás y su puerto: clic derecho en el servidor → **Properties → Connection → Port**.

### 2. Crear y completar `backend/.env`

Desde la raíz del repositorio, abre PowerShell y copia la plantilla solo si todavía no existe el archivo local:

   ```powershell
   if (-not (Test-Path .\backend\.env)) { Copy-Item .\backend\.env.example .\backend\.env }
   notepad .\backend\.env
   ```

Completa estos valores con la conexión real de PostgreSQL:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=senderia
DB_USER=postgres
DB_PASSWORD=la contraseña que asignaste al usuario de PostgreSQL
JWT_SECRET=un secreto aleatorio de al menos 32 caracteres
DB_SSL=false
```

Usa en `DB_PORT` el puerto del servidor elegido en pgAdmin; puede no ser `5432` si tienes varias versiones instaladas. Si no quieres inventar un secreto puedes genera un secreto JWT con:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado en `JWT_SECRET`. No publiques ni compartas `backend/.env`; Git está configurado para ignorar este archivo. No vuelvas a copiar la plantilla encima de un `.env` que ya contenga tu configuración.

### 3. Crear la base `senderia` en pgAdmin (paso manual)

Este paso permite verificar visualmente en qué servidor quedará la base. El script del siguiente paso también puede crearla automáticamente; si decides omitir este paso, asegúrate de que el usuario de PostgreSQL tenga permiso para crear bases de datos.

1. En pgAdmin, expande **Servers → tu servidor PostgreSQL → Databases**.
2. Haz clic derecho en **Databases → Create → Database…**.
3. Escribe `senderia` en **Database**, selecciona `postgres` como **Owner** y pulsa **Save**.

Si `senderia` ya aparece bajo el servidor correcto, no la crees de nuevo. La base debe estar en el mismo servidor y puerto configurados en `backend/.env`.

### 4. Crear las tablas y cargar datos de ejemplo

El archivo `backend/scripts/init-db.ps1` lee `backend/.env`, comprueba la conexión, crea la base si falta y ejecuta en orden `backend/src/db/init.sql` y `backend/src/db/seed.sql`. `init.sql` crea tablas, claves e índices; `seed.sql` carga regiones, categorías y destinos de muestra. El seed se puede volver a ejecutar.

**Windows (PowerShell):** ejecuta desde la raíz del repositorio:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\backend\scripts\init-db.ps1
```

`-ExecutionPolicy Bypass` se aplica solo a este proceso de PowerShell; no cambia permanentemente la política de Windows. El script intenta localizar `psql` y `createdb` incluidos con PostgreSQL. Si la conexión falla, revisa primero `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_PASSWORD`.

### 5. Instalar dependencias y crear el administrador

En una terminal PowerShell, desde la raíz del repositorio:

```powershell
cd .\backend
npm.cmd install
$env:ADMIN_NAME = 'Administrador Senderia'
$env:ADMIN_EMAIL = 'admin@senderia.cl'
$env:ADMIN_PASSWORD = 'escribe-una-clave-privada-de-12-caracteres-o-mas'
npm.cmd run admin:create
```

La contraseña del administrador debe tener al menos 12 caracteres. `admin:create` crea o actualiza esa cuenta en PostgreSQL. El registro público crea turistas, no administradores. Mantén privada la contraseña.

### 6. Iniciar el backend

Desde la carpeta `backend`, ejecuta y deja abierta la terminal:

```powershell
npm.cmd run dev
```

La API queda en `http://localhost:3000/api`. Puedes comprobar la conexión en `http://localhost:3000/api/health`; debería indicar `database: "connected"`.

### 7. Instalar e iniciar el frontend

Abre una segunda terminal desde la raíz:

```powershell
cd .\frontend
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm.cmd install
```

Para iniciar la interfaz, usa **una** opción:

```powershell
ionic.cmd serve
```

o, si Ionic CLI no está instalado:

```powershell
npm.cmd run dev
```

Abre la dirección que indique la terminal; Vite normalmente usa `http://localhost:5173`. No ejecutes ambas opciones a la vez. El `.env.local` del frontend usa `VITE_API_URL=http://localhost:3000/api`.

### Inicio en sesiones posteriores

No repitas la creación de la base, la inicialización SQL ni `admin:create`, salvo que quieras reiniciar esos datos o cambiar las credenciales. Inicia PostgreSQL y abre dos terminales PowerShell: en `backend/`, `npm.cmd run dev`; en `frontend/`, `ionic.cmd serve` o `npm.cmd run dev` (solo una opción).

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

### Ejemplos de cuerpos y respuestas

Las solicitudes con cuerpo usan `Content-Type: application/json`. Para rutas protegidas, envía `Authorization: Bearer <token>`.

**Registro de turista — `POST /api/auth/register`:**

```json
{
  "nombre": "Turista de prueba",
  "email": "turista@example.test",
  "password": "clave-de-ejemplo"
}
```

Respuesta esperada: `201 Created`, con `mensaje`, `usuario` (`id`, `nombre`, `email`, `rol`) y `token`. Datos inválidos responden `400`; un correo ya registrado responde `409`.

**Inicio de sesión — `POST /api/auth/login`:** recibe `email` y `password`. Responde `200 OK` con `mensaje`, `usuario` y `token`; datos inválidos responden `400` y credenciales incorrectas `401`.

**Crear destino — `POST /api/destinos` (admin):**

```json
{
  "nombre": "Destino de prueba",
  "descripcion": "Descripción del lugar",
  "categoria_id": 1,
  "region_id": 1,
  "latitud": -33.45,
  "longitud": -70.66,
  "horario": "Acceso libre"
}
```

Responde `201 Created` con `mensaje` y el objeto `destino`. Una entrada inválida responde `400`, una solicitud sin sesión `401` y una cuenta sin rol admin `403`. La actualización `PUT /api/destinos/:id` acepta campos parciales, responde `200` y devuelve `404` si no existe el destino.

**Favoritos — rutas que requieren JWT:** `GET /api/favoritos` responde `200` con `{ "favoritos": [...] }`. Para agregar, `POST /api/favoritos` recibe `{ "destino_id": 1 }` y responde `201` con `mensaje` y `favorito`; un ID inválido responde `400`, un destino inexistente `404` y un favorito duplicado `409`. `DELETE /api/favoritos/:id` responde `200`; si ese favorito no existe o no pertenece al usuario, responde `404`. Sin JWT, las rutas protegidas responden `401`.

## Pruebas reproducibles

### Prueba automatizada de integración API/PostgreSQL

Con PostgreSQL y el backend activos, abre una tercera terminal PowerShell. Desde la raíz del repositorio ejecuta:

```powershell
cd .\backend
$env:ADMIN_EMAIL = 'admin@senderia.cl'
$env:ADMIN_PASSWORD = 'tu-contraseña-admin-actual'
npm.cmd run test:api
```

Usa las credenciales locales de un administrador existente. La prueba crea un turista, categoría, destino y favorito temporales; comprueba autenticación, JWT, persistencia PostgreSQL, CRUD, permisos admin/turista y que la API no exponga hashes de contraseña. Al finalizar intenta eliminar los datos temporales. Un resultado exitoso muestra `pass 1`, `fail 0` y `skipped 0`. No compartas la contraseña ni guardes este comando con una contraseña real en el repositorio.

### Pruebas manuales de API con Postman

1. En Postman Desktop, importa `backend/postman/Senderia-EP2.postman_collection.json` desde **Import** o arrastrando el archivo a Postman.
2. Crea y selecciona un Environment local con `adminEmail`, `adminPassword` y `turistaPassword`. El primer par corresponde a un admin ya creado en la base local; `turistaPassword` es una clave temporal de al menos 6 caracteres. La colección genera automáticamente un correo nuevo para el turista de prueba, así que no ingreses `turistaEmail`.
3. Ejecuta la colección completa en orden, con una iteración. Crea un turista y un destino temporales, prueba autenticación, permisos y Favoritos, y al final los elimina. Varias pruebas esperan errores `401`, `403` o `409`; se consideran aprobadas cuando la API rechaza correctamente esas operaciones.
4. Guarda la captura del resumen y el reporte de ejecución en `backend/postman/evidencia/`. Antes de compartir el reporte JSON, comprueba que no incluya contraseñas ni tokens.

### Pruebas de interfaz con Cypress

Las pruebas Cypress usan respuestas simuladas para probar la interfaz; no requieren PostgreSQL ni el backend. En una terminal PowerShell, desde la raíz:

```powershell
cd .\frontend
npm.cmd run dev
```

Deja ese servidor activo en `http://localhost:5173` y ejecuta en una segunda terminal:

```powershell
cd .\frontend
npm.cmd run test.e2e
```

Las pruebas Cypress comprueban explorar/abrir un destino e iniciar sesión/consultar Favoritos. Pasan cuando el resumen muestra `2 passing` y `0 failing`.

### Otras verificaciones

Desde `backend/`:

```powershell
npm.cmd test
npm.cmd run build
```

Desde `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run test.unit -- --run
npm.cmd run build
```

La prueba de integración `npm.cmd run test:api` requiere PostgreSQL, la API y credenciales admin. La prueba Cypress requiere que el servidor Vite esté activo. No es necesario ejecutar PostgreSQL ni el backend para Cypress.

## Estado de dependencias

La última auditoría local redujo las alertas iniciales de dependencias. Quedan tres alertas moderadas asociadas a React Router, que se mantienen pendientes mientras se revisa una actualización compatible con Ionic. No se aplicó `npm audit fix --force` ni se considera que las alertas estén resueltas o que tengan impacto nulo. Revisar nuevamente las dependencias antes de una publicación o despliegue.

## Evidencia de pruebas

- Postman: [`Senderia-EP2-evidencia.png`](backend/postman/evidencia/Senderia-EP2-evidencia.png).
- Integración backend/PostgreSQL: [`Senderia-EP2-test-api-backend.png`](backend/postman/evidencia/Senderia-EP2-test-api-backend.png).

El reporte JSON de Postman está en la misma carpeta de evidencia; revísalo y elimina cualquier contraseña o token antes de subirlo o compartirlo.

## Guía de implementación por rúbrica EP2

- **EP 2.1:** `backend/src/index.ts`, `backend/src/routes/` y `backend/src/controllers/`.
- **EP 2.2:** modelo reproducible `backend/src/db/init.sql`; datos de muestra `backend/src/db/seed.sql`.
- **EP 2.3:** CRUD REST de destinos/categorías y operaciones de usuarios/favoritos descritas arriba.
- **EP 2.4:** `backend/src/middleware/auth.ts`, `backend/src/middleware/roleGuard.ts`, `frontend/src/context/AuthContext.tsx`.
- **EP 2.5:** bcrypt, secreto JWT obligatorio, Zod, consultas parametrizadas y autorización por rol.
- **EP 2.6:** cliente en `frontend/src/services/api.ts`; vistas Ionic conectadas; panel admin CRUD real en `frontend/src/pages/AdminDashboard.tsx`.
- **EP 2.7:** colección Postman con casos funcionales y de error, autenticación, cuerpos de solicitudes y comprobaciones; capturas de ejecución en `backend/postman/evidencia/`.
- **Documentación/gestión:** guía de puesta en marcha y ramas listadas abajo.

## Rama y acceso de evaluación

El repositorio organiza el trabajo en tres ramas: `main` como rama principal de la entrega, `frontend` para la interfaz Ionic/React y su documentación, y `backend` para la API, SQL, colección Postman y evidencia de pruebas. Comprueba que la versión que revisará el profesor esté incorporada en `main` y que las ramas `frontend` y `backend` contengan sus archivos correspondientes.

Las fotografías locales de muestra y sus licencias están documentadas en [`frontend/public/images/destinos/CREDITOS.md`](frontend/public/images/destinos/CREDITOS.md).

La rama principal se puede obtener en otro equipo con:

```powershell
git fetch origin
git switch main
git pull
```

Ingresa la URL del repositorio en la planilla del Aula Virtual y comprueba que el profesor/ayudante tenga acceso. Si el repositorio es privado, agrega a las personas evaluadoras con los permisos que solicite el curso.
