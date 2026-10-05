# Senderia Chile — Frontend

Interfaz web y móvil construida con Ionic, React y TypeScript. La aplicación consume la API REST del proyecto; el estado técnico de la API solo se muestra en la interfaz de administración.

## Requisitos

- Node.js 20.19 o posterior y npm.
- Backend Senderia activo en `http://localhost:3000/api`, o una URL configurada con `VITE_API_URL`.

## Instalación y ejecución

Desde la raíz del repositorio:

```powershell
cd frontend
npm install
npm.cmd run dev
```

También se puede iniciar con `ionic.cmd serve`. Abre la URL local que aparezca en la terminal. Crea `frontend/.env.local` desde `.env.example` solo si la API no está en la dirección local por defecto.

## Funciones conectadas

- Explorar y filtrar destinos leídos desde la API.
- Consultar el detalle de cada destino.
- Registrar turistas e iniciar/cerrar sesión con JWT.
- Guardar y quitar destinos favoritos.
- Restringir rutas y acciones administrativas por rol.
- Crear, editar y eliminar destinos desde el panel de administración.

## Requerimientos y diseño

La planificación, los requerimientos funcionales y no funcionales, los flujos de usuario y los wireframes están en [`web y movil/planificacion_senderia_chile.md`](../web%20y%20movil/planificacion_senderia_chile.md) y en las carpetas de pantallas web y móvil.

## Imágenes

Las fotografías de muestra corresponden a sus destinos y sus autores/licencias están en [`public/images/destinos/CREDITOS.md`](public/images/destinos/CREDITOS.md).
