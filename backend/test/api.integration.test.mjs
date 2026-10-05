import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
const credentialsAvailable = Boolean(adminEmail && adminPassword);

test('integra PostgreSQL, autenticación, roles, CRUD y favoritos', { skip: !credentialsAvailable }, async () => {
  const request = async (path, { method = 'GET', token, body, expected } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (expected !== undefined) assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
    return { response, data };
  };

  const health = await request('/health', { expected: 200 });
  assert.equal(health.data.database, 'connected', 'health debe comprobar PostgreSQL real');

  const adminLogin = await request('/auth/login', {
    method: 'POST', body: { email: adminEmail, password: adminPassword }, expected: 200,
  });
  const adminToken = adminLogin.data.token;
  assert.ok(adminToken);
  const me = await request('/auth/me', { token: adminToken, expected: 200 });
  assert.equal(me.data.usuario.rol, 'admin');

  const [categories, regions] = await Promise.all([
    request('/categorias', { expected: 200 }), request('/categorias/regiones', { expected: 200 }),
  ]);
  assert.ok(categories.data.categorias.length, 'seed debe cargar categorías');
  assert.ok(regions.data.regiones.length, 'seed debe cargar regiones');

  const nonce = randomUUID();
  const touristEmail = `ep2-${nonce}@example.test`;
  const touristPassword = `EP2-${nonce}-Tourist!`;
  let touristToken;
  let touristId;
  let categoryId;
  let destinationId;
  let favoriteId;

  try {
    const register = await request('/auth/register', {
      method: 'POST', body: { nombre: 'Turista de integración', email: touristEmail, password: touristPassword }, expected: 201,
    });
    touristToken = register.data.token;
    touristId = register.data.usuario.id;
    assert.ok(touristToken);

    await request('/destinos', { method: 'POST', body: {}, expected: 401 });
    await request('/destinos', { method: 'POST', token: touristToken, body: {}, expected: 403 });

    const createdCategory = await request('/categorias', {
      method: 'POST', token: adminToken,
      body: { nombre: `Categoría EP2 ${nonce.slice(0, 8)}`, slug: `ep2-${nonce.slice(0, 12)}`, descripcion: 'Prueba temporal de integración' },
      expected: 201,
    });
    categoryId = createdCategory.data.categoria.id;
    const editedCategory = await request(`/categorias/${categoryId}`, {
      method: 'PUT', token: adminToken, body: { descripcion: 'Categoría editada por la prueba' }, expected: 200,
    });
    assert.equal(editedCategory.data.categoria.descripcion, 'Categoría editada por la prueba');

    const createdDestination = await request('/destinos', {
      method: 'POST', token: adminToken,
      body: {
        nombre: `Destino EP2 ${nonce.slice(0, 8)}`, descripcion: 'Prueba temporal de integración',
        categoria_id: categoryId, region_id: regions.data.regiones[0].id,
        latitud: -33.45, longitud: -70.66, horario: 'Acceso de prueba',
      },
      expected: 201,
    });
    destinationId = createdDestination.data.destino.id;
    const readDestination = await request(`/destinos/${destinationId}`, { expected: 200 });
    assert.equal(readDestination.data.source, 'database');
    const list = await request('/destinos', { expected: 200 });
    assert.ok(list.data.destinos.some((destination) => destination.id === destinationId));

    const favorite = await request('/favoritos', {
      method: 'POST', token: touristToken, body: { destino_id: destinationId }, expected: 201,
    });
    favoriteId = favorite.data.favorito.id;
    const favorites = await request('/favoritos', { token: touristToken, expected: 200 });
    assert.ok(favorites.data.favoritos.some((item) => item.favorito_id === favoriteId));
    await request(`/favoritos/${favoriteId}`, { method: 'DELETE', token: touristToken, expected: 200 });
    favoriteId = undefined;

    const updatedDestination = await request(`/destinos/${destinationId}`, {
      method: 'PUT', token: adminToken, body: { nombre: `Destino editado ${nonce.slice(0, 8)}` }, expected: 200,
    });
    assert.match(updatedDestination.data.destino.nombre, /Destino editado/);

    const users = await request('/usuarios', { token: adminToken, expected: 200 });
    const user = users.data.usuarios.find((item) => item.id === touristId);
    assert.ok(user);
    assert.equal('password_hash' in user, false, 'la API no debe exponer hashes');
  } finally {
    if (favoriteId && touristToken) await request(`/favoritos/${favoriteId}`, { method: 'DELETE', token: touristToken }).catch(() => {});
    if (destinationId) await request(`/destinos/${destinationId}`, { method: 'DELETE', token: adminToken }).catch(() => {});
    if (categoryId) await request(`/categorias/${categoryId}`, { method: 'DELETE', token: adminToken }).catch(() => {});
    if (touristId) await request(`/usuarios/${touristId}`, { method: 'DELETE', token: adminToken }).catch(() => {});
  }
});
