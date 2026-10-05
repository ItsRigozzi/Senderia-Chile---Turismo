import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema, destinoSchema, createAdminSchema } from '../dist/validators/schemas.js';

test('rechaza registro con email inválido y contraseña corta', () => {
  assert.equal(registerSchema.safeParse({ nombre: 'Ana', email: 'correo', password: '123' }).success, false);
});

test('acepta registro válido de turista', () => {
  assert.equal(registerSchema.safeParse({ nombre: 'Ana Pérez', email: 'ana@example.cl', password: 'clave123' }).success, true);
});

test('valida rangos de coordenadas y relaciones numéricas de destino', () => {
  const destino = { nombre: 'Parque', categoria_id: 1, region_id: 2, latitud: -91, longitud: -70 };
  assert.equal(destinoSchema.safeParse(destino).success, false);
  assert.equal(destinoSchema.safeParse({ ...destino, latitud: -33 }).success, true);
});

test('exige contraseña robusta para crear la cuenta administrativa', () => {
  const admin = { nombre: 'Admin', email: 'admin@example.cl', password: 'corta' };
  assert.equal(createAdminSchema.safeParse(admin).success, false);
  assert.equal(createAdminSchema.safeParse({ ...admin, password: 'una-clave-mas-larga-2026' }).success, true);
});
