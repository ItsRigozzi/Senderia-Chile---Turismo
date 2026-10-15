# Senderia Chile — Frontend

Interfaz web y móvil construida con Ionic, React y TypeScript. La aplicación consume la API REST del proyecto; el estado técnico de la API solo se muestra en la interfaz de administración.

## Requisitos

- Node.js 22.12 o posterior y npm.
- Backend Senderia activo en `http://localhost:3000/api`, o una URL configurada con `VITE_API_URL`.

## Instalación y ejecución

Desde la raíz del repositorio:

```powershell
cd .\frontend
npm.cmd install
npm.cmd run dev
```

Abre la URL local que aparezca en la terminal; Vite normalmente usa `http://localhost:5173`. También puedes iniciar la interfaz con `ionic.cmd serve` en lugar de `npm.cmd run dev`. Para cambiar la dirección de la API, copia `.env.example` como `.env.local` y define `VITE_API_URL`; por defecto se usa `http://localhost:3000/api`.

## Funciones conectadas

- Explorar y filtrar destinos leídos desde la API.
- Consultar el detalle de cada destino.
- Registrar turistas e iniciar/cerrar sesión con JWT.
- Guardar y quitar destinos favoritos.
- Restringir rutas y acciones administrativas por rol.
- Crear, editar y eliminar destinos desde el panel de administración.

## Imágenes

Las fotografías de muestra corresponden a sus destinos y sus autores/licencias están en [`public/images/destinos/CREDITOS.md`](public/images/destinos/CREDITOS.md).
