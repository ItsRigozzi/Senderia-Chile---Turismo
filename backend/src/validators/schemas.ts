import { z } from 'zod';

export const idParamSchema = z.coerce.number().int().positive().max(2147483647);
const foreignKeyIdSchema = z.number().int().positive().max(2147483647);

// ---- Auth ----
export const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150),
  email: z.string().trim().toLowerCase().email('Email inválido').max(255),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100)
    .regex(/[a-zA-Z0-9]/, 'La contraseña debe incluir al menos una letra o un número'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const createAdminSchema = z.object({
  nombre: z.string().min(2).max(150),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(12).max(100),
});

// ---- Destinos ----
const destinationFieldsSchema = z.object({
  nombre: z.string().min(2).max(255),
  descripcion: z.string().optional(),
  categoria_id: foreignKeyIdSchema,
  region_id: foreignKeyIdSchema,
  // Si faltan las dos coordenadas, el backend las busca por nombre y región.
  latitud: z.number().min(-90).max(90).nullable().optional(),
  longitud: z.number().min(-180).max(180).nullable().optional(),
  horario: z.string().max(255).optional(),
  condiciones_acceso: z.string().optional(),
  imagen_url: z.string().url().max(500).optional(),
});

const validateCoordinatePair = (
  data: { latitud?: number | null; longitud?: number | null },
  context: z.RefinementCtx,
) => {
  const coordinatesAreAbsent = data.latitud == null && data.longitud == null;
  const coordinatesAreComplete = typeof data.latitud === 'number' && typeof data.longitud === 'number';

  if (!coordinatesAreAbsent && !coordinatesAreComplete) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['latitud'],
      message: 'Ingresa latitud y longitud juntas, o deja ambas vacías para buscar por nombre y región.',
    });
  }
};

export const destinoSchema = destinationFieldsSchema.superRefine(validateCoordinatePair);
export const destinoUpdateSchema = destinationFieldsSchema.partial().superRefine(validateCoordinatePair);

// ---- Categorías ----
export const categoriaSchema = z.object({
  nombre: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  descripcion: z.string().optional(),
});

export const categoriaUpdateSchema = categoriaSchema.partial();

// ---- Usuarios (admin update) ----
export const usuarioUpdateSchema = z.object({
  rol: z.enum(['turista', 'admin']).optional(),
  nombre: z.string().min(2).max(150).optional(),
});

// ---- Favoritos ----
export const favoritoSchema = z.object({
  destino_id: z.number().int().positive(),
});
