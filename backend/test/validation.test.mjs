import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema, destinoSchema, createAdminSchema, idParamSchema, destinosQuerySchema } from '../dist/validators/schemas.js';

test('rechaza registro con email inválido y contraseña corta', () => {
  assert.equal(registerSchema.safeParse({ nombre: 'Ana', email: 'correo', password: '123' }).success, false);
});

test('acepta registro válido de turista', () => {
  assert.equal(registerSchema.safeParse({ nombre: 'Ana Pérez', email: 'ana@example.cl', password: 'clave123' }).success, true);
});

test('exige que la contraseña tenga al menos una letra y un número', () => {
  const base = { nombre: 'Ana Pérez', email: 'ana@example.cl' };
  assert.equal(registerSchema.safeParse({ ...base, password: 'aaaaaaaa' }).success, false);
  assert.equal(registerSchema.safeParse({ ...base, password: '!!!!!!!!1' }).success, false);
  assert.equal(registerSchema.safeParse({ ...base, password: '12345678' }).success, false);
  assert.equal(registerSchema.safeParse({ ...base, password: 'montaña2026' }).success, true);
});

test('acepta solo imágenes http(s) o rutas locales del catálogo', () => {
  const destino = { nombre: 'Parque', categoria_id: 1, region_id: 2, latitud: -33, longitud: -70 };
  assert.equal(destinoSchema.safeParse({ ...destino, imagen_url: 'javascript:alert(1)' }).success, false);
  assert.equal(destinoSchema.safeParse({ ...destino, imagen_url: 'data:text/html,<script>alert(1)</script>' }).success, false);
  assert.equal(destinoSchema.safeParse({ ...destino, imagen_url: '/images/../../etc/passwd' }).success, false);
  assert.equal(destinoSchema.safeParse({ ...destino, imagen_url: 'https://example.com/foto.jpg' }).success, true);
  assert.equal(destinoSchema.safeParse({ ...destino, imagen_url: '/images/destinos/torres-del-paine.jpg' }).success, true);
  assert.equal(destinoSchema.safeParse({ ...destino, imagen_url: '/api/destinos/12/imagenes-comunidad/3/archivo' }).success, true);
  assert.equal(destinoSchema.safeParse({ ...destino, imagen_url: '/api/usuarios' }).success, false);
});

test('valida rangos de coordenadas y relaciones numéricas de destino', () => {
  const destino = { nombre: 'Parque', categoria_id: 1, region_id: 2, latitud: -91, longitud: -70 };
  assert.equal(destinoSchema.safeParse(destino).success, false);
  assert.equal(destinoSchema.safeParse({ ...destino, latitud: -33 }).success, true);
});

test('acepta solo IDs de ruta enteros y positivos', () => {
  assert.equal(idParamSchema.safeParse('12').success, true);
  assert.equal(idParamSchema.safeParse('0').success, false);
  assert.equal(idParamSchema.safeParse('no-es-id').success, false);
});

test('exige contraseña robusta para crear la cuenta administrativa', () => {
  const admin = { nombre: 'Admin', email: 'admin@example.cl', password: 'corta' };
  assert.equal(createAdminSchema.safeParse(admin).success, false);
  assert.equal(createAdminSchema.safeParse({ ...admin, password: 'una-clave-mas-larga-2026' }).success, true);
});

test('normaliza un único filtro de destinos a una lista', () => {
  const parsed = destinosQuerySchema.safeParse({ categoria: 'lago' });
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, { categoria: ['lago'], region: [] });
});

test('acepta varios valores por filtro y elimina duplicados', () => {
  const parsed = destinosQuerySchema.safeParse({ region: ['valparaiso', 'ohiggins', 'valparaiso'], categoria: 'lago' });
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, { categoria: ['lago'], region: ['valparaiso', 'ohiggins'] });
});

test('rechaza filtros de destinos que no son slugs', () => {
  assert.equal(destinosQuerySchema.safeParse({ region: 'Valparaíso' }).success, false);
  assert.equal(destinosQuerySchema.safeParse({ categoria: ['lago', '<script>'] }).success, false);
  assert.equal(destinosQuerySchema.safeParse({ region: { $ne: 'x' } }).success, false);
});

test('rechaza más de 20 valores en un filtro de destinos', () => {
  const region = Array.from({ length: 21 }, (_, index) => `region-${index}`);
  assert.equal(destinosQuerySchema.safeParse({ region }).success, false);
});
