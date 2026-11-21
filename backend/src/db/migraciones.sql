-- =========================================
-- Sendería Chile - Migraciones
-- Actualiza bases de datos creadas con versiones anteriores del esquema.
--
-- Orden de ejecución: migraciones.sql → init.sql → seed.sql → sernatur_carga_unica.sql
-- En una base nueva (vacía) no hace nada: cada paso comprueba antes si la tabla existe.
-- Es re-ejecutable: aplicar las migraciones dos veces no cambia el resultado.
-- =========================================

BEGIN;

-- ---- 1. Usuarios: acceso con Google, verificación de correo y recuperación de contraseña ----
-- Las cuentas Google no tienen contraseña local.
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255);
-- Las cuentas existentes se consideran verificadas para que puedan seguir iniciando sesión.
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS email_verificado_en TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- El índice único de correo normalizado (init.sql) falla si hay correos repetidos
-- al ignorar mayúsculas/minúsculas: se avisa antes con un mensaje claro.
-- (Los IF van anidados: PostgreSQL prepara la consulta completa aunque la tabla no exista.)
DO $$
BEGIN
  IF to_regclass('public.usuarios') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.usuarios GROUP BY lower(btrim(email)) HAVING COUNT(*) > 1) THEN
      RAISE EXCEPTION 'Hay correos duplicados al ignorar mayúsculas/minúsculas; resuélvelos antes de aplicar el índice.';
    END IF;
  END IF;
END $$;

-- ---- 2. Destinos: borrado lógico, origen SERNATUR y atribución de imágenes ----
ALTER TABLE IF EXISTS public.destinos ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE IF EXISTS public.destinos ADD COLUMN IF NOT EXISTS sernatur_cod_atrac TEXT;
ALTER TABLE IF EXISTS public.destinos ADD COLUMN IF NOT EXISTS imagen_autor TEXT;
ALTER TABLE IF EXISTS public.destinos ADD COLUMN IF NOT EXISTS imagen_licencia TEXT;
ALTER TABLE IF EXISTS public.destinos ADD COLUMN IF NOT EXISTS imagen_url_licencia TEXT;
ALTER TABLE IF EXISTS public.destinos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Rangos válidos de coordenadas.
DO $$
BEGIN
  IF to_regclass('public.destinos') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_destinos_latitud_rango' AND conrelid = 'public.destinos'::regclass) THEN
    ALTER TABLE public.destinos ADD CONSTRAINT chk_destinos_latitud_rango CHECK (latitud BETWEEN -90 AND 90);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_destinos_longitud_rango' AND conrelid = 'public.destinos'::regclass) THEN
    ALTER TABLE public.destinos ADD CONSTRAINT chk_destinos_longitud_rango CHECK (longitud BETWEEN -180 AND 180);
  END IF;
END $$;

-- ---- 3. Revisión SERNATUR ----
ALTER TABLE IF EXISTS public.sernatur_destinos_revision ADD COLUMN IF NOT EXISTS estado_completitud TEXT NOT NULL DEFAULT 'pendiente';

-- ---- 4. Fechas con zona horaria (TIMESTAMP → TIMESTAMPTZ) ----
-- Los valores existentes se interpretan en la zona horaria del servidor, que es donde
-- CURRENT_TIMESTAMP los generó. Así el instante guardado no cambia.
DO $$
DECLARE
  col RECORD;
BEGIN
  FOR col IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns AS c
    WHERE c.table_schema = 'public'
      AND c.data_type = 'timestamp without time zone'
      AND c.table_name IN ('usuarios', 'destinos', 'favoritos', 'opiniones', 'sugerencias_imagenes', 'auth_email_codes')
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I TYPE TIMESTAMPTZ USING %I AT TIME ZONE current_setting(''TimeZone'')',
      col.table_name, col.column_name, col.column_name
    );
    RAISE NOTICE 'Columna %.% convertida a TIMESTAMPTZ', col.table_name, col.column_name;
  END LOOP;
END $$;

COMMIT;
