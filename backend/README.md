# Senderia Chile — Backend

API REST construida con Node.js, Express, TypeScript y PostgreSQL. Esta carpeta contiene el servidor, sus rutas/controladores, el esquema SQL, los datos iniciales y la colección Postman.

## Requisitos

- Node.js 20.19 o posterior y npm.
- PostgreSQL 14 o posterior, con el servicio iniciado.
- PowerShell en Windows para el script de inicialización incluido.

## Configurar base de datos

1. Copia `.env.example` como `.env` y completa `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. Define también un `JWT_SECRET` aleatorio de al menos 32 caracteres. No compartas ni subas `.env`.
2. Desde la raíz del repositorio, inicializa el esquema y los datos:

   ```powershell
   ./backend/scripts/init-db.ps1
   ```

   `init.sql` crea tablas, claves foráneas e índices; `seed.sql` carga regiones, categorías y destinos de muestra y se puede ejecutar repetidamente.

## Crear admin e iniciar

Desde la raíz del repositorio:

```powershell
cd backend
$env:ADMIN_NAME = 'Administrador Senderia'
$env:ADMIN_EMAIL = 'admin@senderia.cl'
$env:ADMIN_PASSWORD = 'reemplazar-por-una-clave-privada-de-12-caracteres-o-mas'
npm install
npm run admin:create
npm.cmd run dev
```

La API queda en `http://localhost:3000/api`. El registro público solo crea turistas. La clave de administrador debe mantenerse privada.

## Pruebas

```powershell
npm test
```

Para la prueba real de integración, con PostgreSQL y la API activos, define `ADMIN_EMAIL` y `ADMIN_PASSWORD` en la terminal y ejecuta `npm.cmd run test:api`. La colección Postman está en `postman/Senderia-EP2.postman_collection.json`.

Los endpoints, roles, respuestas y pasos detallados están en el README de la rama integrada del proyecto.
