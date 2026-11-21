# Sendería Chile — Frontend

Aplicación web y móvil construida con Ionic, React y TypeScript. Consume la API REST del backend.

## Ejecutar

### Con Docker (recomendado)

Desde la raíz del repositorio: `docker compose up --build -d` y abre **http://localhost:8100**. La guía completa está en el [README principal](../README.md).

### Sin Docker

Requiere Node.js 22.12 o superior y el backend corriendo en `http://localhost:3000/api`.

```powershell
cd .\frontend
copy .env.example .env.local
npm install
npm run dev
```

Abre la dirección que muestre Vite (normalmente `http://localhost:5173`).

| Variable (`.env.local`) | Para qué |
|---|---|
| `VITE_API_URL` | Dirección de la API (por defecto `http://localhost:3000/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google para el botón "Ingresar con Google" (opcional) |

## Datos

El catálogo viene de PostgreSQL a través de la API: los destinos de muestra (`backend/src/db/seed.sql`) y el catálogo oficial SERNATUR (`backend/src/db/sernatur_carga_unica.sql`, 478 destinos). Docker carga ambos automáticamente.

## Funcionalidades

**Turistas e invitados**
- Explorar destinos en un mapa (Leaflet + OpenStreetMap), buscar y filtrar por región, tipo y reserva previa.
- Ficha de cada destino con mapa, horario, condiciones de acceso, calificaciones e imágenes de la comunidad.
- Registro con verificación del correo por código, inicio de sesión con correo o Google y recuperación de contraseña.
- Favoritos, calificación de 1 a 5 estrellas con reseña, y sugerencia de fotos.

**Administradores** (`/admin`)
- **Destinos:** crear, editar y quitar (borrado lógico).
- **Categorías:** crear, editar y eliminar.
- **Usuarios:** buscar, cambiar el rol, editar el nombre y eliminar. No se puede modificar la cuenta propia ni dejar el sistema sin administradores.
- **Imágenes sugeridas:** revisar, aprobar o rechazar.

## Manejo de errores y sesión

- Las solicitudes tienen un tiempo máximo de 15 segundos (60 s para subir imágenes).
- Los mensajes distinguen servidor caído o sin conexión, tiempo agotado, sin permisos (403), demasiados intentos (429) y errores del servidor (5xx).
- Si la sesión expira (401), la app lleva al login con el aviso "Tu sesión expiró", sin recargar la página, y después vuelve a donde estabas.

## Pruebas

| Comando | Qué hace |
|---|---|
| `npm run test.unit -- --run` | Pruebas unitarias (Vitest) |
| `npm run test.e2e` | Pruebas de interfaz (Cypress; requiere Vite en `localhost:5173`) |
| `npm run lint` | ESLint |
| `npm run build` | Compilación de producción (TypeScript + Vite) |

## Imágenes

Las fotografías de muestra corresponden a sus destinos; autores y licencias en [`public/images/destinos/CREDITOS.md`](public/images/destinos/CREDITOS.md).
