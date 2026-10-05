import { z } from 'zod';

// ---- Auth ----
export const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(150),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const createAdminSchema = z.object({
  nombre: z.string().min(2).max(150),
  email: z.string().email().max(255),
  password: z.string().min(12).max(100),
});

// ---- Destinos ----
export const destinoSchema = z.object({
  nombre: z.string().min(2).max(255),
  descripcion: z.string().optional(),
  categoria_id: z.number().int().positive(),
  region_id: z.number().int().positive(),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
  horario: z.string().max(255).optional(),
  condiciones_acceso: z.string().optional(),
  imagen_url: z.string().url().max(500).optional(),
});

export const destinoUpdateSchema = destinoSchema.partial();

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
