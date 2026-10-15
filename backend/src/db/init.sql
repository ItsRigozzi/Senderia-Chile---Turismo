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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Índices para mejorar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_destinos_categoria ON destinos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_destinos_region ON destinos(region_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_destinos_nombre_region ON destinos(nombre, region_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario ON favoritos(usuario_id);
