# Sendería Chile — Entrega Parcial 3

**Asignatura:** INF3245-1 — Ingeniería Web y Móvil
**Entrega:** Entrega 3

Sendería Chile es una aplicación web construida con Ionic y React para explorar destinos turísticos de Chile. Las personas pueden buscar destinos, revisar su información, guardar favoritos y compartir calificaciones y reseñas; el equipo administrador puede mantener el catálogo desde un panel conectado al backend y PostgreSQL.

---

## Cómo ejecutar el proyecto

### 1. Instalar Docker Desktop (solo la primera vez)

1. Descarga Docker Desktop: <https://www.docker.com/products/docker-desktop/>
   - Windows con procesador Intel o AMD: **AMD64**.
   - Windows con procesador ARM (Snapdragon): **ARM64**.
2. Ejecuta el instalador. Si pregunta el tipo de instalación, elige **All-users installation**.
3. Reinicia el computador.
4. Abre Docker Desktop y espera a que abajo a la izquierda diga **Engine running**.

Si Docker muestra un error:

| Mensaje | Solución |
|---|---|
| `Virtual Machine Platform` o `WSL not installed` | Abre **Terminal (Administrador)**, ejecuta `wsl --install` y reinicia. |
| `WSL needs to be updated` | En **Terminal (Administrador)** ejecuta `wsl --update` y reinicia. |
| `Virtualization is disabled in firmware` | Reinicia y entra a la BIOS (**Supr** o **F2**). Activa **SVM Mode** (AMD) o **Intel Virtualization Technology** (Intel). Guarda con **F10**. |

### 2. Descargar el proyecto

```bash
git clone https://github.com/ItsRigozzi/Senderia-Chile---Turismo.git
```

```bash
cd Senderia-Chile---Turismo
```

Sin Git: en GitHub, **Code → Download ZIP**, descomprime y abre una terminal dentro de la carpeta.

### 3. Iniciar

Con Docker Desktop abierto, en la carpeta del proyecto:

```bash
docker compose up --build -d
```

La primera vez tarda unos minutos. Comprueba que los 3 servicios digan `healthy`:

```bash
docker compose ps
```

### 4. Abrir la aplicación

| Servicio | Dirección |
|---|---|
| Aplicación | <http://localhost:8100> |
| API | <http://localhost:3000/api> |
| Estado de la API | <http://localhost:3000/api/health> |

### 5. Cuentas

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@senderia.cl` | `SenderiaAdmin2026` |
| Turista | Crear en **Registrarse** | Mínimo 8 caracteres |

### 6. Código de verificación (registro y recuperación de contraseña)

Sin Gmail configurado, el código de 6 dígitos no llega al correo; aparece en los mensajes de la API:

```bash
docker compose logs api
```

Busca la línea:

```text
[MODO DESARROLLO] Código de verificación de correo para tu@correo.cl: 123456
```

Escribe ese código en la aplicación.

### 7. Detener

| Acción | Comando |
|---|---|
| Detener (conserva los datos) | `docker compose down` |
| Detener y borrar la base de datos | `docker compose down -v` |
| Volver a iniciar | `docker compose up -d` |

---

## Configuración opcional (Google y Gmail)

No es necesaria para usar la aplicación.

1. En la carpeta del proyecto, copia `.env.example` y renombra la copia como `.env`.
2. Completa solo lo que quieras activar:

```env
# Ingresar con Google
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com

# Envío real de códigos por Gmail
SMTP_USER=tu.correo@gmail.com
SMTP_PASS=contrasenadeaplicacion
SMTP_FROM=Sendería Chile <tu.correo@gmail.com>
```

3. Reinicia:

```bash
docker compose up --build -d
```

**Obtener `GOOGLE_CLIENT_ID`:**

1. Entra a <https://console.cloud.google.com/auth/clients> y crea un proyecto si lo pide.
2. **Create client** → **Web application**.
3. En **Authorized JavaScript origins** agrega `http://localhost:8100`.
4. **Create** y copia el **Client ID**.
5. Si la app queda en modo **Testing**, agrega las cuentas que podrán entrar en <https://console.cloud.google.com/auth/audience> → **Test users**.

**Obtener `SMTP_PASS` (contraseña de aplicación de Gmail):**

1. Activa la verificación en 2 pasos: <https://myaccount.google.com/signinoptions/twosv>
2. Entra a <https://myaccount.google.com/apppasswords>, escribe `Senderia` y presiona **Crear**.
3. Copia la clave de 16 letras sin espacios.

El archivo `.env` no se sube a GitHub.

---

## Problemas comunes

| Problema | Solución |
|---|---|
| `docker` no se reconoce | Abre Docker Desktop y usa una terminal nueva. |
| Puerto 8100, 3000 o 5433 ocupado | En `.env` cambia `WEB_HOST_PORT`, `API_HOST_PORT` o `DB_HOST_PORT`. |
| Un servicio no queda `healthy` | Revisa `docker compose logs` y luego `docker compose down -v` y `docker compose up --build -d`. |
| No llega el código | Míralo con `docker compose logs api`. |
| No aparece el botón de Google | Falta `GOOGLE_CLIENT_ID` en `.env`. |
