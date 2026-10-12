# Senderia Chile — Backend

API REST construida con Node.js, Express, TypeScript y PostgreSQL. Esta carpeta contiene el servidor, sus rutas/controladores, el esquema SQL, los datos iniciales y la colección Postman.

## Requisitos

- Node.js 22.12 o posterior y npm. Esta versión cumple el requisito de Vite usado por el frontend.
- PostgreSQL 14 o posterior, con el servicio iniciado.
- Windows y PowerShell para ejecutar los comandos de esta guía.

## Configurar base de datos

1. Si aún no existe, copia `.env.example` como `.env` y completa `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` y `DB_SSL`. Define un `JWT_SECRET` aleatorio de al menos 32 caracteres. No sobrescribas un `.env` ya configurado ni lo compartas.
2. El script puede crear la base nombrada en `DB_NAME` si no existe. También puedes crearla manualmente en pgAdmin: **Databases → Create → Database…**, con el mismo nombre y servidor/puerto configurados en `.env`.
3. Desde la raíz del repositorio, inicializa las tablas y los datos:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\backend\scripts\init-db.ps1
   ```

   La excepción de política se aplica solo al proceso iniciado por ese comando. El script lee `.env`, comprueba la conexión, crea la base si hace falta y ejecuta `init.sql` seguido de `seed.sql`. Este último carga regiones, categorías y destinos de muestra y se puede ejecutar repetidamente.

## Crear admin e iniciar

Desde la raíz del repositorio:

```powershell
cd .\backend
$env:ADMIN_NAME = 'Administrador Senderia'
$env:ADMIN_EMAIL = 'admin@senderia.cl'
$env:ADMIN_PASSWORD = 'escribe-una-clave-privada-de-12-caracteres-o-mas'
npm.cmd install
npm.cmd run admin:create
npm.cmd run dev
```

La API queda en `http://localhost:3000/api`. El registro público solo crea turistas. La clave de administrador debe mantenerse privada.

## Pruebas

Desde la raíz del repositorio, ejecuta las pruebas del backend así:

```powershell
cd .\backend
npm.cmd test
```

Este comando compila el backend y ejecuta sus pruebas de validación.

Para la prueba de integración con PostgreSQL, deja PostgreSQL y el backend activos. Abre otra terminal PowerShell desde la raíz del repositorio y ejecuta:

```powershell
cd .\backend
$env:ADMIN_EMAIL = 'admin@senderia.cl'
$env:ADMIN_PASSWORD = 'tu-contraseña-admin-actual'
npm.cmd run test:api
```

Usa las credenciales de un administrador que ya exista en tu base local. No guardes ni compartas la contraseña. La colección Postman está en `backend/postman/Senderia-EP2.postman_collection.json`; la evidencia está en `backend/postman/evidencia/`.

La guía completa de ejecución, endpoints, roles, respuestas y pruebas está en el [README principal del proyecto](../README.md).
