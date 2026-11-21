# API REST — Sendería Chile

Documentación de cada endpoint: acceso, cuerpo, respuesta exitosa y errores posibles.
Se genera a partir de la colección Postman [`postman/Senderia-API.postman_collection.json`](postman/Senderia-API.postman_collection.json), que además **prueba** cada caso descrito aquí (164 aserciones).

**URL base:** `http://localhost:3000/api` · **Formato:** JSON (salvo los archivos de imagen) · **Rutas protegidas:** encabezado `Authorization: Bearer <JWT>`

## Convenciones

| Código | Significado |
|---|---|
| 200 / 201 | Operación correcta / recurso creado |
| 400 | Datos inválidos. Si el error viene de la validación, `detalles` indica el problema por campo |
| 401 | Sin token, token inválido o expirado (24 h), o la contraseña cambió después de emitirlo |
| 403 | Rol insuficiente, o correo sin verificar al iniciar sesión (`EMAIL_NOT_VERIFIED`) |
| 404 | Recurso o ruta inexistente |
| 409 | Conflicto: duplicado, recurso en uso o ya procesado |
| 413 | Imagen de más de 5 MB |
| 429 | Demasiados intentos (login o códigos por correo) |
| 500 | Error interno inesperado (nunca expone detalles internos) |
| 502 / 503 | Servicio externo o PostgreSQL no disponible |

Todo error responde `{ "error": "mensaje" }` y, cuando aplica, un `code` estable (por ejemplo `EMAIL_NOT_VERIFIED`) para que el frontend reaccione.

## Índice de endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Comprueba que la API responde y que PostgreSQL está conectado. |
| POST | `/auth/login` | Público | Inicia sesión con correo y contraseña y entrega el JWT de Sendería (expira en 24 h). |
| GET | `/auth/me` | JWT | Devuelve la identidad vigente leída desde PostgreSQL. |
| POST | `/auth/register` | Público | Crea una cuenta turista pendiente de verificación y envía un código de 6 dígitos al correo. Sin Gmail configurado (modo desarrollo), el código aparece en `docker compose logs api`. No inicia sesión todavía. |
| POST | `/auth/verify-email` | Público | Activa la cuenta con el código de 6 dígitos y entrega el JWT. Cada código vence en 10 minutos, es de un solo uso y admite 5 intentos. |
| POST | `/auth/password-reset/request` | Público | Envía un código de recuperación si la cuenta tiene contraseña local. La respuesta es igual exista o no la cuenta, para no revelar qué correos están registrados. Luego se confirma con `POST /auth/password-reset/confirm` `{ email, codigo, password }`. |
| GET | `/categorias` | Público | Lista las categorías ordenadas por nombre. |
| GET | `/categorias/regiones` | Público | Lista las 16 regiones de Chile. |
| POST | `/categorias` | Admin | Crea una categoría. El `slug` solo admite minúsculas, números y guiones. |
| PUT | `/categorias/:id` | Admin | Actualiza uno o más campos de la categoría. |
| POST | `/destinos` | Admin | Crea un destino. Si se omiten ambas coordenadas, se buscan con Geoapify (requiere `GEOAPIFY_API_KEY`). `imagen_url` acepta solo `http(s)://`, `/images/...` o la ruta de una foto aprobada. |
| GET | `/destinos` | Público | Lista los destinos activos. Cada filtro acepta varios valores (`?region=a&region=b`): dentro de un filtro aplica OR y entre filtros AND. El filtrado se hace en PostgreSQL. |
| GET | `/destinos/:id` | Público | Ficha de un destino activo. |
| PUT | `/destinos/:id` | Admin | Actualiza uno o más campos. |
| POST | `/favoritos` | JWT | Guarda un destino en los favoritos del usuario de la sesión. |
| GET | `/favoritos` | JWT | Favoritos del usuario de la sesión, con los datos del destino. |
| DELETE | `/favoritos/:id` | JWT | Quita un favorito propio. |
| POST | `/destinos/:id/opiniones` | JWT | Crea o actualiza la opinión propia (una por usuario y destino). La reseña es opcional. |
| GET | `/destinos/:id/opiniones` | Público | Promedio, cantidad y reseñas del destino. Solo muestra el nombre público del autor (nunca su correo). |
| GET | `/destinos/:id/opinion` | JWT | Opinión propia del usuario de la sesión (o `null`). |
| POST | `/destinos/:id/sugerencias-imagenes` | JWT | Envía una imagen JPG, PNG o WebP (máximo 5 MB) como `multipart/form-data`. El servidor revisa la firma real del archivo. Queda privada hasta que un admin la apruebe. En Postman, el archivo se toma de `fixtures/foto-prueba.png` (configura *Working directory* en `backend/postman` o selecciónalo a mano). |
| GET | `/sugerencias-imagenes` | Admin | Imágenes pendientes de revisión con los datos del destino y del aportante. |
| GET | `/sugerencias-imagenes/:id/archivo` | Admin | Entrega el archivo de forma privada (`Cache-Control: private, no-store`). |
| PATCH | `/sugerencias-imagenes/:id/revision` | Admin | Aprueba o rechaza una imagen pendiente. Si el destino no tenía foto, la aprobada pasa a ser su imagen principal. |
| GET | `/destinos/:id/imagenes-comunidad` | Público | Imágenes aprobadas con el nombre de quien las aportó. |
| GET | `/destinos/:id/imagenes-comunidad/:imagenId/archivo` | Público | Archivo público de una imagen aprobada. |
| GET | `/usuarios` | Admin | Lista las cuentas sin exponer el hash de la contraseña. |
| PATCH | `/usuarios/:id` | Admin | Actualiza nombre y/o rol (`turista` o `admin`). |
| DELETE | `/destinos/:id` | Admin | Quita el destino de la aplicación y conserva el registro en PostgreSQL (`activo = false`). |
| DELETE | `/categorias/:id` | Admin | Elimina una categoría que no tiene destinos activos. Sus destinos ya quitados (y los favoritos, opiniones e imágenes de esos destinos) se eliminan definitivamente con ella. |
| DELETE | `/usuarios/:id` | Admin | Elimina una cuenta y, en cascada, sus favoritos y opiniones. |

`POST /auth/verification/resend` `{ email }` reenvía el código de verificación, `POST /auth/password-reset/confirm` `{ email, codigo, password }` cambia la contraseña con el código, y `POST /auth/google` `{ credential }` inicia sesión con Google (requiere `GOOGLE_CLIENT_ID`).

## Detalle por recurso

### Estado y seguridad general

#### `GET /health` — Estado de la API y PostgreSQL

Comprueba que la API responde y que PostgreSQL está conectado.

**Acceso:** Público

**Respuesta exitosa:**
```
200 { "status": "ok", "database": "connected", "timestamp": "2026-11-21T19:34:01.904Z" }
```

**Errores posibles:**
- 503 `{ "status": "degraded", "database": "unavailable" }` si PostgreSQL no responde

**Casos de error probados:**

- **Ruta inexistente responde 404 en JSON** (`GET /ruta-que-no-existe`): Toda ruta desconocida responde JSON, nunca HTML. → 404 `{ "error": "Ruta no encontrada" }`
- **JSON malformado responde 400 sin stack trace** (`POST /auth/login`): El manejador global de errores convierte un cuerpo JSON inválido en un 400 en JSON, sin exponer rutas internas ni el stack trace. → 400 `{ "error": "El cuerpo de la solicitud no es un JSON válido." }`

### Autenticación

#### `POST /auth/login` — Login administrador

Inicia sesión con correo y contraseña y entrega el JWT de Sendería (expira en 24 h).

**Acceso:** Público

**Cuerpo:**
```
{ "email": "admin@senderia.cl", "password": "SenderiaAdmin2026" }
```

**Respuesta exitosa:**
```
200 { "mensaje": "Inicio de sesión exitoso", "usuario": { "id": 1, "nombre": "…", "email": "…", "rol": "admin" }, "token": "eyJ…" }
```

**Errores posibles:**
- 400 datos inválidos (`detalles` por campo)
- 401 credenciales incorrectas
- 403 `EMAIL_NOT_VERIFIED` correo sin verificar
- 429 `LOGIN_ATTEMPTS_EXCEEDED` tras 5 intentos fallidos (bloqueo de 15 min, cabecera `Retry-After`)

#### `POST /auth/login` — Login turista de demostración

Inicia sesión con la cuenta turista ya verificada que crea Docker (`turista@senderia.cl`).

**Acceso:** Público

**Cuerpo:**
```
{ "email": "turista@senderia.cl", "password": "Turista2026" }
```

**Respuesta exitosa:**
```
200 { "mensaje": "Inicio de sesión exitoso", "usuario": { "rol": "turista", … }, "token": "eyJ…" }
```

**Errores posibles:**
- 401 credenciales incorrectas

#### `GET /auth/me` — Usuario de la sesión actual

Devuelve la identidad vigente leída desde PostgreSQL.

**Acceso:** JWT

**Respuesta exitosa:**
```
200 { "usuario": { "id": 1, "nombre": "…", "email": "…", "rol": "admin" } }
```

**Errores posibles:**
- 401 sin token, token inválido/expirado o contraseña cambiada después de emitirlo

#### `POST /auth/register` — Registrar turista temporal

Crea una cuenta turista pendiente de verificación y envía un código de 6 dígitos al correo. Sin Gmail configurado (modo desarrollo), el código aparece en `docker compose logs api`. No inicia sesión todavía.

**Acceso:** Público

**Cuerpo:**
```
{ "nombre": "Ana Pérez", "email": "ana@example.cl", "password": "Clave2026" }
```

**Respuesta exitosa:**
```
201 { "mensaje": "Cuenta creada. Revisa tu correo e ingresa el código para activar la cuenta.", "email": "ana@example.cl" }
```

**Errores posibles:**
- 400 datos inválidos
- 409 `EMAIL_ALREADY_REGISTERED`
- 503 `SMTP_NOT_CONFIGURED` o `EMAIL_SEND_FAILED` si el correo no se puede enviar en producción

#### `POST /auth/verify-email` — Verificar correo con código incorrecto

Activa la cuenta con el código de 6 dígitos y entrega el JWT. Cada código vence en 10 minutos, es de un solo uso y admite 5 intentos.

**Acceso:** Público

**Cuerpo:**
```
{ "email": "ana@example.cl", "codigo": "123456" }
```

**Respuesta exitosa:**
```
200 { "mensaje": "Correo verificado. Tu cuenta ya está activa.", "usuario": { … }, "token": "eyJ…" }
```

**Errores posibles:**
- 400 `INVALID_CODE` código incorrecto o `CODE_NOT_FOUND`
- 409 `EMAIL_ALREADY_VERIFIED`
- 410 `CODE_EXPIRED`
- 429 `CODE_ATTEMPTS_EXCEEDED`

#### `POST /auth/password-reset/request` — Solicitar recuperación de contraseña

Envía un código de recuperación si la cuenta tiene contraseña local. La respuesta es igual exista o no la cuenta, para no revelar qué correos están registrados. Luego se confirma con `POST /auth/password-reset/confirm` `{ email, codigo, password }`.

**Acceso:** Público

**Cuerpo:**
```
{ "email": "turista@senderia.cl" }
```

**Respuesta exitosa:**
```
200 { "mensaje": "Si la cuenta puede recuperar su contraseña, recibirás un código en el correo registrado." }
```

**Errores posibles:**
- 400 correo inválido

**Casos de error probados:**

- **Sesión sin token responde 401** (`GET /auth/me`): Las rutas protegidas exigen `Authorization: Bearer <JWT>`. → 401 `{ "error": "Token de autenticación requerido" }`
- **Token con algoritmo "none" es rechazado** (`GET /auth/me`): La API fija el algoritmo `HS256` al verificar el JWT; un token sin firma no es aceptado. → 401 `{ "error": "Token inválido o expirado" }`
- **Registro rechaza contraseña débil** (`POST /auth/register`): La contraseña debe tener al menos 8 caracteres, con al menos una letra y un número. → 400 `{ "error": "Datos inválidos", "detalles": { "password": ["La contraseña debe incluir al menos un número"] } }`
- **Registro duplicado responde 409** (`POST /auth/register`): Un correo solo puede registrarse una vez. → 409 `{ "error": "El correo ya está registrado", "code": "EMAIL_ALREADY_REGISTERED" }`
- **Login sin verificar el correo responde 403** (`POST /auth/login`): Una cuenta con el correo sin verificar no puede iniciar sesión. → 403 `{ "error": "Verifica tu correo antes de iniciar sesión.", "code": "EMAIL_NOT_VERIFIED" }`
- **Bloqueo tras 5 intentos fallidos de login** (`POST /auth/login`): Antes de esta solicitud se envían 5 intentos fallidos con el mismo correo; el sexto queda bloqueado 15 minutos. → 429 `{ "error": "Demasiados intentos fallidos…", "code": "LOGIN_ATTEMPTS_EXCEEDED" }` con cabecera `Retry-After`

### Categorías y regiones

#### `GET /categorias` — Listar categorías

Lista las categorías ordenadas por nombre.

**Acceso:** Público

**Respuesta exitosa:**
```
200 { "categorias": [ { "id": 1, "nombre": "Desierto", "slug": "desierto", "descripcion": "…" } ] }
```

#### `GET /categorias/regiones` — Listar regiones

Lista las 16 regiones de Chile.

**Acceso:** Público

**Respuesta exitosa:**
```
200 { "regiones": [ { "id": 1, "nombre": "Antofagasta", "slug": "antofagasta" } ] }
```

#### `POST /categorias` — Crear categoría temporal (admin)

Crea una categoría. El `slug` solo admite minúsculas, números y guiones.

**Acceso:** Admin

**Cuerpo:**
```
{ "nombre": "Miradores", "slug": "miradores", "descripcion": "Opcional" }
```

**Respuesta exitosa:**
```
201 { "mensaje": "Categoría creada exitosamente", "categoria": { "id": 9, "nombre": "Miradores", "slug": "miradores", "descripcion": "…" } }
```

**Errores posibles:**
- 400 datos inválidos
- 401 sin token
- 403 rol no admin
- 409 nombre o slug ya existe

#### `PUT /categorias/:id` — Actualizar categoría (admin)

Actualiza uno o más campos de la categoría.

**Acceso:** Admin

**Cuerpo:**
```
{ "descripcion": "Nuevo texto" }
```

**Respuesta exitosa:**
```
200 { "mensaje": "Categoría actualizada exitosamente", "categoria": { … } }
```

**Errores posibles:**
- 400 sin campos o datos inválidos
- 404 no existe
- 409 nombre o slug repetido

**Casos de error probados:**

- **Categoría duplicada responde 409** (`POST /categorias`): No se permiten nombres ni slugs repetidos. → 409 `{ "error": "Ya existe una categoría con ese nombre o slug" }`
- **Turista no puede crear categorías (403)** (`POST /categorias`): El backend valida el rol en cada ruta administrativa. → 403 rol insuficiente

### Destinos

#### `POST /destinos` — Crear destino temporal (admin)

Crea un destino. Si se omiten ambas coordenadas, se buscan con Geoapify (requiere `GEOAPIFY_API_KEY`). `imagen_url` acepta solo `http(s)://`, `/images/...` o la ruta de una foto aprobada.

**Acceso:** Admin

**Cuerpo:**
```
{ "nombre": "Cerro Santa Lucía", "categoria_id": 5, "region_id": 7, "latitud": -33.44, "longitud": -70.64, "horario": "…", "condiciones_acceso": "…", "imagen_url": "https://…" }
```

**Respuesta exitosa:**
```
201 { "mensaje": "Destino creado exitosamente", "destino": { "id": 500, "nombre": "…", "activo": true, … } }
```

**Errores posibles:**
- 400 datos inválidos o categoría/región inexistente
- 401 sin token
- 403 rol no admin
- 409 nombre repetido en la región
- 422 Geoapify no encontró coordenadas
- 502/503 Geoapify no disponible o no configurado

#### `GET /destinos` — Listar destinos filtrando por categoría y región

Lista los destinos activos. Cada filtro acepta varios valores (`?region=a&region=b`): dentro de un filtro aplica OR y entre filtros AND. El filtrado se hace en PostgreSQL.

**Acceso:** Público

**Respuesta exitosa:**
```
200 { "destinos": [ { "id": 500, "nombre": "…", "categoria_slug": "…", "region_slug": "…", "latitud": -33.45, "longitud": -70.66, … } ], "source": "database" }
```

**Errores posibles:**
- 400 filtro con caracteres no válidos o más de 20 valores

#### `GET /destinos/:id` — Leer destino por ID

Ficha de un destino activo.

**Acceso:** Público

**Respuesta exitosa:**
```
200 { "destino": { "id": 500, "nombre": "…", "categoria_nombre": "…", "region_nombre": "…", … }, "source": "database" }
```

**Errores posibles:**
- 400 ID no válido
- 404 no existe o fue quitado

#### `PUT /destinos/:id` — Actualizar destino (admin)

Actualiza uno o más campos.

**Acceso:** Admin

**Cuerpo:**
```
{ "horario": "…" }
```

**Respuesta exitosa:**
```
200 { "mensaje": "Destino actualizado exitosamente", "destino": { … } }
```

**Errores posibles:**
- 400 sin campos o datos inválidos
- 404 no existe
- 409 nombre repetido en la región

**Casos de error probados:**

- **imagen_url con javascript: es rechazada** (`POST /destinos`): Se rechazan esquemas peligrosos (`javascript:`, `data:`) en la imagen. → 400 `{ "error": "Datos inválidos", "detalles": { "imagen_url": ["…"] } }`
- **Crear destino sin token (401)** (`POST /destinos`): Crear destinos requiere sesión. → 401 sin token
- **Turista no puede crear destinos (403)** (`POST /destinos`): Crear destinos requiere rol admin. → 403 rol insuficiente
- **Filtro inválido responde 400** (`GET /destinos`): Los filtros deben ser slugs (minúsculas, números y guiones). → 400 `{ "error": "Parámetros de filtro inválidos", … }`
- **ID de destino no válido (400)** (`GET /destinos/no-es-id`): El ID debe ser un entero positivo. → 400 ID no válido
- **Destino inexistente (404)** (`GET /destinos/2147483647`): Un ID que no existe responde 404. → 404 `{ "error": "Destino no encontrado" }`
- **Actualizar sin campos (400)** (`PUT /destinos/:id`): Debe enviarse al menos un campo. → 400 sin campos
- **Categoría con destinos activos no se elimina (409)** (`DELETE /categorias/:id`): Solo cuentan los destinos activos: los destinos ya quitados no impiden eliminar la categoría. → 409 `{ "error": "No se puede eliminar la categoría porque tiene destinos activos asociados", "destinos_asociados": 1 }`

### Favoritos

#### `POST /favoritos` — Agregar favorito

Guarda un destino en los favoritos del usuario de la sesión.

**Acceso:** JWT

**Cuerpo:**
```
{ "destino_id": 500 }
```

**Respuesta exitosa:**
```
201 { "mensaje": "Destino agregado a favoritos", "favorito": { "id": 10, "usuario_id": 2, "destino_id": 500 } }
```

**Errores posibles:**
- 400 destino_id inválido
- 404 destino no existe
- 409 ya está en favoritos

#### `GET /favoritos` — Listar mis favoritos

Favoritos del usuario de la sesión, con los datos del destino.

**Acceso:** JWT

**Respuesta exitosa:**
```
200 { "favoritos": [ { "favorito_id": 10, "id": 500, "nombre": "…", … } ] }
```

#### `DELETE /favoritos/:id` — Quitar favorito

Quita un favorito propio.

**Acceso:** JWT

**Respuesta exitosa:**
```
200 { "mensaje": "Destino eliminado de favoritos" }
```

**Errores posibles:**
- 400 ID inválido
- 404 no existe o pertenece a otro usuario

#### `GET /favoritos` — Confirmar favorito quitado

El favorito ya no aparece.

**Acceso:** JWT

**Respuesta exitosa:**
```
200 { "favoritos": [ … ] }
```

**Casos de error probados:**

- **Listar favoritos sin sesión (401)** (`GET /favoritos`): Favoritos requiere sesión. → 401 sin token
- **Favorito duplicado (409)** (`POST /favoritos`): Un destino solo puede estar una vez en favoritos. → 409 ya está en favoritos

### Opiniones

#### `POST /destinos/:id/opiniones` — Calificar y reseñar un destino

Crea o actualiza la opinión propia (una por usuario y destino). La reseña es opcional.

**Acceso:** JWT

**Cuerpo:**
```
{ "puntuacion": 4, "comentario": "Opcional" }
```

**Respuesta exitosa:**
```
200 { "mensaje": "Tu calificación fue guardada", "opinion": { "id": 7, "puntuacion": 4, "comentario": "…", "created_at": "…", "updated_at": "…" } }
```

**Errores posibles:**
- 400 puntuación o comentario inválido
- 401 sin token
- 404 destino no existe

#### `POST /destinos/:id/opiniones` — Actualizar la misma opinión

Volver a calificar actualiza la opinión existente; no crea una segunda.

**Acceso:** JWT

**Respuesta exitosa:**
```
200 { "mensaje": "Tu calificación fue guardada", "opinion": { "puntuacion": 5, … } }
```

#### `GET /destinos/:id/opiniones` — Resumen público de opiniones

Promedio, cantidad y reseñas del destino. Solo muestra el nombre público del autor (nunca su correo).

**Acceso:** Público

**Respuesta exitosa:**
```
200 { "calificacion_promedio": 5, "total_opiniones": 1, "opiniones": [ { "id": 7, "puntuacion": 5, "comentario": "…", "autor": "Turista Demo", "created_at": "…", "updated_at": "…" } ] }
```

**Errores posibles:**
- 400 ID inválido
- 404 destino no existe

#### `GET /destinos/:id/opinion` — Mi opinión sobre el destino

Opinión propia del usuario de la sesión (o `null`).

**Acceso:** JWT

**Respuesta exitosa:**
```
200 { "opinion": { "id": 7, "puntuacion": 5, "comentario": "…" } }
```

**Casos de error probados:**

- **Calificar sin sesión (401)** (`POST /destinos/:id/opiniones`): Calificar requiere sesión. → 401 sin token
- **Puntuación fuera de rango (400)** (`POST /destinos/:id/opiniones`): La puntuación es un entero de 1 a 5. → 400 datos inválidos

### Imágenes sugeridas

#### `POST /destinos/:id/sugerencias-imagenes` — Sugerir imagen de un destino

Envía una imagen JPG, PNG o WebP (máximo 5 MB) como `multipart/form-data`. El servidor revisa la firma real del archivo. Queda privada hasta que un admin la apruebe. En Postman, el archivo se toma de `fixtures/foto-prueba.png` (configura *Working directory* en `backend/postman` o selecciónalo a mano).

**Acceso:** JWT

**Cuerpo:**
```
multipart/form-data: imagen=<archivo>, declara_derechos=true, acepta_atribucion=true, comentario=(opcional)
```

**Respuesta exitosa:**
```
201 { "mensaje": "Imagen enviada. Se mostrará públicamente solo si el administrador la aprueba.", "sugerencia": { "id": 3, "estado": "pendiente", … } }
```

**Errores posibles:**
- 400 sin archivo, formato no permitido o firma inválida
- 401 sin token
- 404 destino no existe
- 413 archivo de más de 5 MB

#### `GET /sugerencias-imagenes` — Listar imágenes pendientes (admin)

Imágenes pendientes de revisión con los datos del destino y del aportante.

**Acceso:** Admin

**Respuesta exitosa:**
```
200 { "sugerencias": [ { "id": 3, "destino_id": 500, "destino_nombre": "…", "autor_nombre": "Turista Demo", "mime_type": "image/png", "tamano_bytes": 90, "imagen_url": "/api/sugerencias-imagenes/3/archivo", … } ] }
```

#### `GET /sugerencias-imagenes/:id/archivo` — Ver archivo pendiente (admin)

Entrega el archivo de forma privada (`Cache-Control: private, no-store`).

**Acceso:** Admin

**Respuesta exitosa:**
```
200 (archivo image/png)
```

**Errores posibles:**
- 404 no existe o ya fue revisada

#### `PATCH /sugerencias-imagenes/:id/revision` — Aprobar imagen (admin)

Aprueba o rechaza una imagen pendiente. Si el destino no tenía foto, la aprobada pasa a ser su imagen principal.

**Acceso:** Admin

**Cuerpo:**
```
{ "estado": "aprobada" }   // o "rechazada"
```

**Respuesta exitosa:**
```
200 { "mensaje": "Imagen aprobada y publicada.", "sugerencia": { "id": 3, "estado": "aprobada" } }
```

**Errores posibles:**
- 400 decisión inválida
- 404 no existe
- 409 ya fue revisada

#### `GET /destinos/:id/imagenes-comunidad` — Imágenes aprobadas del destino (público)

Imágenes aprobadas con el nombre de quien las aportó.

**Acceso:** Público

**Respuesta exitosa:**
```
200 { "imagenes": [ { "id": 3, "autor_nombre": "Turista Demo", "comentario": "…", "created_at": "…", "imagen_url": "/api/destinos/500/imagenes-comunidad/3/archivo" } ] }
```

**Errores posibles:**
- 400 ID inválido
- 404 destino no existe

#### `GET /destinos/:id/imagenes-comunidad/:imagenId/archivo` — Archivo de imagen aprobada (público)

Archivo público de una imagen aprobada.

**Acceso:** Público

**Respuesta exitosa:**
```
200 (archivo image/png)
```

**Errores posibles:**
- 404 no existe o no está aprobada

**Casos de error probados:**

- **Sugerir imagen sin aceptar las condiciones (400)** (`POST /destinos/:id/sugerencias-imagenes`): Ambas confirmaciones son obligatorias. → 400 `{ "error": "Debes confirmar que tienes permiso…", "detalles": { … } }`
- **Turista no puede ver pendientes (403)** (`GET /sugerencias-imagenes`): La revisión es solo para administradores. → 403 rol insuficiente
- **Imagen pendiente no es pública (404)** (`GET /destinos/:id/imagenes-comunidad/:imagenId/archivo`): Una imagen pendiente no se entrega por la ruta pública. → 404 `{ "error": "Imagen no encontrada o todavía pendiente de aprobación." }`
- **Revisar una imagen ya revisada (409)** (`PATCH /sugerencias-imagenes/:id/revision`): Solo se pueden revisar imágenes pendientes. → 409 la imagen ya fue revisada

### Usuarios (admin)

#### `GET /usuarios` — Listar usuarios sin hashes

Lista las cuentas sin exponer el hash de la contraseña.

**Acceso:** Admin

**Respuesta exitosa:**
```
200 { "usuarios": [ { "id": 2, "nombre": "…", "email": "…", "rol": "turista", "created_at": "…" } ] }
```

#### `PATCH /usuarios/:id` — Editar nombre de un usuario

Actualiza nombre y/o rol (`turista` o `admin`).

**Acceso:** Admin

**Cuerpo:**
```
{ "nombre": "…", "rol": "admin" }
```

**Respuesta exitosa:**
```
200 { "mensaje": "Usuario actualizado exitosamente", "usuario": { … } }
```

**Errores posibles:**
- 400 datos inválidos o el admin intenta quitarse su propio rol (`SELF_DEMOTION`)
- 404 no existe
- 409 `LAST_ADMIN`: no se puede quitar el rol al último administrador

**Casos de error probados:**

- **Turista no puede listar usuarios (403)** (`GET /usuarios`): La gestión de usuarios es solo para administradores. → 403 rol insuficiente
- **Admin no puede quitarse su propio rol (400)** (`PATCH /usuarios/:id`): Evita que el sistema quede sin administradores por error. → 400 `{ "code": "SELF_DEMOTION" }`
- **Admin no puede eliminarse a sí mismo (400)** (`DELETE /usuarios/:id`): Un administrador no puede eliminar su propia cuenta. → 400 cuenta propia

### Limpieza de datos temporales

#### `DELETE /destinos/:id` — Quitar destino temporal (borrado lógico)

Quita el destino de la aplicación y conserva el registro en PostgreSQL (`activo = false`).

**Acceso:** Admin

**Respuesta exitosa:**
```
200 { "mensaje": "Destino quitado de la aplicación. El registro se conserva en la base de datos.", "destino": { … } }
```

**Errores posibles:**
- 404 no existe

#### `DELETE /categorias/:id` — Eliminar categoría temporal

Elimina una categoría que no tiene destinos activos. Sus destinos ya quitados (y los favoritos, opiniones e imágenes de esos destinos) se eliminan definitivamente con ella.

**Acceso:** Admin

**Respuesta exitosa:**
```
200 { "mensaje": "Categoría eliminada exitosamente", "categoria": { "id": 9, "nombre": "…" }, "destinos_inactivos_eliminados": 1 }
```

**Errores posibles:**
- 404 no existe
- 409 tiene destinos activos

#### `DELETE /usuarios/:id` — Eliminar usuario temporal

Elimina una cuenta y, en cascada, sus favoritos y opiniones.

**Acceso:** Admin

**Respuesta exitosa:**
```
200 { "mensaje": "Usuario eliminado exitosamente", "usuario": { … } }
```

**Errores posibles:**
- 400 cuenta propia
- 404 no existe
- 409 `LAST_ADMIN`

**Casos de error probados:**

- **Destino quitado ya no se lee (404)** (`GET /destinos/:id`): Las rutas públicas solo devuelven destinos activos. → 404 no existe o fue quitado
