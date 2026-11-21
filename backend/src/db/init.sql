-- =========================================
-- Sendería Chile - Modelo relacional
-- Base de datos: PostgreSQL 14 o superior
--
-- Esquema inicial completo. Solo crea lo que falta (IF NOT EXISTS / OR REPLACE),
-- por lo que se puede ejecutar más de una vez.
-- Las actualizaciones de bases creadas con versiones anteriores están en migraciones.sql.
--
-- Orden de ejecución: migraciones.sql → init.sql → seed.sql → sernatur_carga_unica.sql
-- Todas las fechas usan TIMESTAMPTZ (instante exacto, sin ambigüedad de zona horaria).
-- =========================================

-- ---------- Catálogos ----------

-- Regiones de Chile
CREATE TABLE IF NOT EXISTS regiones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE
);

-- Categorías de destinos
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);

-- ---------- Usuarios y autenticación ----------

-- password_hash es opcional para las cuentas que solo usan Google.
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  google_sub VARCHAR(255),
  email_verificado BOOLEAN NOT NULL DEFAULT TRUE,
  email_verificado_en TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  rol VARCHAR(20) NOT NULL DEFAULT 'turista' CHECK (rol IN ('turista', 'admin')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Códigos de un solo uso para verificar el correo y recuperar la contraseña.
-- Solo se guarda su hash (HMAC), nunca el código legible.
CREATE TABLE IF NOT EXISTS auth_email_codes (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  proposito VARCHAR(24) NOT NULL CHECK (proposito IN ('verificacion', 'recuperacion')),
  codigo_hash VARCHAR(64) NOT NULL,
  expira_at TIMESTAMPTZ NOT NULL,
  intentos SMALLINT NOT NULL DEFAULT 0 CHECK (intentos >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, proposito)
);

-- ---------- Destinos ----------

-- activo = FALSE oculta el destino sin borrar sus datos (borrado lógico).
-- sernatur_cod_atrac e imagen_* conservan el origen SERNATUR y la atribución de la imagen.
CREATE TABLE IF NOT EXISTS destinos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  region_id INTEGER NOT NULL REFERENCES regiones(id),
  latitud DOUBLE PRECISION NOT NULL CONSTRAINT chk_destinos_latitud_rango CHECK (latitud BETWEEN -90 AND 90),
  longitud DOUBLE PRECISION NOT NULL CONSTRAINT chk_destinos_longitud_rango CHECK (longitud BETWEEN -180 AND 180),
  horario VARCHAR(255),
  condiciones_acceso TEXT,
  imagen_url VARCHAR(500),
  imagen_autor TEXT,
  imagen_licencia TEXT,
  imagen_url_licencia TEXT,
  sernatur_cod_atrac TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Favoritos (relación usuario-destino)
CREATE TABLE IF NOT EXISTS favoritos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destino_id INTEGER NOT NULL REFERENCES destinos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, destino_id)
);

-- Una opinión por cuenta y destino; la puntuación es obligatoria y la reseña opcional.
CREATE TABLE IF NOT EXISTS opiniones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destino_id INTEGER NOT NULL REFERENCES destinos(id) ON DELETE CASCADE,
  puntuacion SMALLINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario TEXT CHECK (comentario IS NULL OR char_length(comentario) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, destino_id)
);

-- Imágenes aportadas por turistas: privadas hasta que un admin las aprueba.
-- autor_nombre conserva la atribución aunque la cuenta del usuario se elimine.
CREATE TABLE IF NOT EXISTS sugerencias_imagenes (
  id SERIAL PRIMARY KEY,
  destino_id INTEGER NOT NULL REFERENCES destinos(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  autor_nombre VARCHAR(150) NOT NULL,
  archivo_nombre VARCHAR(100) NOT NULL UNIQUE,
  mime_type VARCHAR(30) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  tamano_bytes INTEGER NOT NULL CHECK (tamano_bytes > 0 AND tamano_bytes <= 5242880),
  comentario VARCHAR(500),
  declara_tener_derechos BOOLEAN NOT NULL DEFAULT FALSE,
  acepta_atribucion BOOLEAN NOT NULL DEFAULT FALSE,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revisado_at TIMESTAMPTZ,
  revisado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ---------- Catálogo SERNATUR (datos los carga sernatur_carga_unica.sql) ----------

-- Catastro de atractivos turísticos de SERNATUR (shapefile 2020, Geoportal Chile).
-- Conserva los valores originales; los destinos publicados se copian a public.destinos.
CREATE TABLE IF NOT EXISTS sernatur_atractivos_fuente (
  cod_atrac TEXT PRIMARY KEY,
  jerarquia TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo TEXT NOT NULL,
  subtipo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  region TEXT NOT NULL,
  provincia TEXT NOT NULL,
  comuna TEXT NOT NULL,
  localidad TEXT,
  direccion TEXT,
  telefono TEXT,
  propiedad TEXT,
  administra TEXT,
  distcr TEXT,
  cr TEXT,
  distcc TEXT,
  cc TEXT,
  loc_urbana TEXT,
  estacional TEXT,
  uso_tur TEXT,
  demanda TEXT,
  servicios TEXT,
  cod_reg TEXT,
  cod_prov TEXT,
  cod_com TEXT,
  descripcion TEXT,
  estado TEXT,
  longitud NUMERIC(13,10) NOT NULL,
  latitud NUMERIC(13,10) NOT NULL
);

-- Propuestas de enriquecimiento (Wikipedia/Wikimedia) y revisión de cada atractivo.
CREATE TABLE IF NOT EXISTS sernatur_destinos_revision (
  cod_atrac TEXT PRIMARY KEY REFERENCES sernatur_atractivos_fuente(cod_atrac) ON DELETE CASCADE,
  estado_coincidencia TEXT NOT NULL CHECK (estado_coincidencia IN ('coincidencia_exacta', 'revisar', 'sin_resultado', 'error')),
  puntaje_coincidencia NUMERIC(5,4),
  titulo_wikipedia TEXT,
  url_wikipedia TEXT,
  descripcion_wikipedia TEXT,
  imagen_url TEXT,
  imagen_autor TEXT,
  imagen_licencia TEXT,
  imagen_url_licencia TEXT,
  error TEXT,
  nombre_aprobado TEXT,
  descripcion_aprobada TEXT,
  categoria_id_aprobada INTEGER REFERENCES categorias(id),
  region_id_aprobada INTEGER REFERENCES regiones(id),
  horario_aprobado VARCHAR(255),
  condiciones_acceso_aprobadas TEXT,
  imagen_url_aprobada TEXT,
  imagen_autor_aprobado TEXT,
  imagen_licencia_aprobada TEXT,
  imagen_url_licencia_aprobada TEXT,
  ubicacion_verificada BOOLEAN NOT NULL DEFAULT FALSE,
  imagen_verificada BOOLEAN NOT NULL DEFAULT FALSE,
  estado_revision TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_revision IN ('pendiente', 'aprobado', 'descartado')),
  estado_completitud TEXT NOT NULL DEFAULT 'pendiente',
  observacion_revision TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vista de apoyo para revisar el catálogo SERNATUR junto a sus propuestas.
CREATE OR REPLACE VIEW v_sernatur_destinos_revision AS
SELECT s.cod_atrac, s.nombre, s.region, s.provincia, s.comuna,
       s.localidad, s.direccion, s.telefono, s.propiedad, s.administra,
       s.categoria AS categoria_sernatur, s.tipo AS tipo_sernatur,
       s.subtipo AS subtipo_sernatur, s.servicios, s.estacional,
       s.uso_tur, s.demanda, s.estado AS estado_sernatur,
       s.latitud, s.longitud, s.descripcion AS descripcion_sernatur,
       r.estado_coincidencia, r.puntaje_coincidencia, r.titulo_wikipedia,
       r.url_wikipedia, r.descripcion_wikipedia,
       COALESCE(NULLIF(BTRIM(r.descripcion_aprobada), ''),
                NULLIF(BTRIM(r.descripcion_wikipedia), ''),
                NULLIF(BTRIM(s.descripcion), '')) AS descripcion_candidata,
       r.imagen_url, r.imagen_autor, r.imagen_licencia, r.imagen_url_licencia,
       (r.imagen_url IS NOT NULL AND r.imagen_autor IS NOT NULL
        AND r.imagen_licencia IS NOT NULL AND r.imagen_url_licencia IS NOT NULL)
         AS atribucion_imagen_completa,
       r.categoria_id_aprobada, r.region_id_aprobada,
       r.horario_aprobado, r.condiciones_acceso_aprobadas,
       r.ubicacion_verificada, r.imagen_verificada,
       r.estado_revision, r.observacion_revision, r.error, r.estado_completitud
FROM sernatur_atractivos_fuente AS s
JOIN sernatur_destinos_revision AS r USING (cod_atrac);

-- ---------- updated_at automático ----------

-- Al modificar una fila, PostgreSQL actualiza updated_at aunque la consulta no lo indique.
CREATE OR REPLACE FUNCTION fn_actualizar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_destinos_updated_at
  BEFORE UPDATE ON destinos
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE OR REPLACE TRIGGER trg_opiniones_updated_at
  BEFORE UPDATE ON opiniones
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE OR REPLACE TRIGGER trg_sernatur_destinos_revision_updated_at
  BEFORE UPDATE ON sernatur_destinos_revision
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

-- ---------- Índices ----------

-- Usuarios: búsqueda por cuenta de Google y correo único sin distinguir mayúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_google_sub ON usuarios (google_sub) WHERE google_sub IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_normalizado ON usuarios (lower(btrim(email)));
CREATE INDEX IF NOT EXISTS idx_auth_email_codes_expira ON auth_email_codes (expira_at);

-- Destinos: filtros por categoría y región; nombre único por región; un destino por código SERNATUR.
CREATE INDEX IF NOT EXISTS idx_destinos_categoria ON destinos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_destinos_region ON destinos (region_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_destinos_nombre_region ON destinos (nombre, region_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_destinos_sernatur_cod_atrac ON destinos (sernatur_cod_atrac) WHERE sernatur_cod_atrac IS NOT NULL;

-- Favoritos, opiniones e imágenes aportadas.
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_opiniones_destino ON opiniones (destino_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sugerencias_imagenes_estado ON sugerencias_imagenes (estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sugerencias_imagenes_destino ON sugerencias_imagenes (destino_id, estado, created_at DESC);

-- Catálogo SERNATUR.
CREATE INDEX IF NOT EXISTS idx_sernatur_atractivos_nombre ON sernatur_atractivos_fuente (lower(nombre));
CREATE INDEX IF NOT EXISTS idx_sernatur_atractivos_region_comuna ON sernatur_atractivos_fuente (region, comuna);
CREATE INDEX IF NOT EXISTS idx_sernatur_revision_estado ON sernatur_destinos_revision (estado_coincidencia, estado_revision);
