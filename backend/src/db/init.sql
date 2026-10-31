-- =========================================
-- Senderia Chile - Modelo Relacional
-- Base de datos: PostgreSQL
-- =========================================

-- Tabla de regiones de Chile
CREATE TABLE IF NOT EXISTS regiones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de categorías de destinos
CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'turista' CHECK (rol IN ('turista', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Los correos no distinguen mayúsculas/minúsculas y se guardan normalizados
-- desde el backend. Esta restricción también protege las cuentas ya existentes.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM usuarios
    GROUP BY lower(btrim(email))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay correos duplicados al ignorar mayúsculas/minúsculas; resuélvelos antes de aplicar el índice.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_normalizado
  ON usuarios (lower(btrim(email)));

-- Tabla de destinos turísticos
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
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- En bases existentes, conserva los destinos y añade un estado para ocultarlos
-- sin borrar sus datos ni los favoritos asociados.
ALTER TABLE public.destinos
  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- Añade las restricciones también a bases existentes creadas por versiones previas del script.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_destinos_latitud_rango'
      AND conrelid = 'public.destinos'::regclass
  ) THEN
    ALTER TABLE public.destinos
      ADD CONSTRAINT chk_destinos_latitud_rango CHECK (latitud BETWEEN -90 AND 90);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_destinos_longitud_rango'
      AND conrelid = 'public.destinos'::regclass
  ) THEN
    ALTER TABLE public.destinos
      ADD CONSTRAINT chk_destinos_longitud_rango CHECK (longitud BETWEEN -180 AND 180);
  END IF;
END $$;

-- Tabla de favoritos (relación usuario-destino)
CREATE TABLE IF NOT EXISTS favoritos (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destino_id INTEGER NOT NULL REFERENCES destinos(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id, destino_id)
);

-- Una opinión por cuenta y destino; la puntuación es requerida y la reseña opcional.
CREATE TABLE IF NOT EXISTS opiniones (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  destino_id INTEGER NOT NULL REFERENCES destinos(id) ON DELETE CASCADE,
  puntuacion SMALLINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario TEXT CHECK (comentario IS NULL OR char_length(comentario) <= 1000),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id, destino_id)
);

-- Las imágenes aportadas por turistas quedan privadas hasta que un admin las aprueba.
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revisado_at TIMESTAMP,
  revisado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Índices para mejorar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_destinos_categoria ON destinos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_destinos_region ON destinos(region_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_destinos_nombre_region ON destinos(nombre, region_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_opiniones_destino ON opiniones(destino_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sugerencias_imagenes_estado ON sugerencias_imagenes(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sugerencias_imagenes_destino ON sugerencias_imagenes(destino_id, estado, created_at DESC);
