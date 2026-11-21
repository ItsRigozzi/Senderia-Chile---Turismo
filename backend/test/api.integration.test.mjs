// Prueba de integración contra la API real (Express + PostgreSQL).
// Requiere la API en ejecución. Por defecto usa las cuentas de demostración que crea Docker;
// se pueden cambiar con ADMIN_EMAIL, ADMIN_PASSWORD, TOURIST_EMAIL y TOURIST_PASSWORD.
// No depende del catálogo SERNATUR: crea sus propios datos temporales y los elimina al final.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000/api';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@senderia.cl';
const adminPassword = process.env.ADMIN_PASSWORD || 'SenderiaAdmin2026';
const touristEmail = process.env.TOURIST_EMAIL || 'turista@senderia.cl';
const touristPassword = process.env.TOURIST_PASSWORD || 'Turista2026';

const request = async (path, { method = 'GET', token, body, rawBody, expected } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined || rawBody !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(rawBody !== undefined ? { body: rawBody } : {}),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    assert.fail(`${method} ${path} no respondió JSON (status ${response.status}): ${text.slice(0, 200)}`);
  }
  if (expected !== undefined) assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  return { response, data };
};

test('integra PostgreSQL, autenticación, roles, CRUD, favoritos y opiniones', async () => {
  const health = await request('/health', { expected: 200 });
  assert.equal(health.data.database, 'connected', 'health debe comprobar PostgreSQL real');

  // ---- Manejo de errores y cabeceras de seguridad ----
  await request('/ruta-que-no-existe', { expected: 404 });
  const malformed = await request('/auth/login', { method: 'POST', rawBody: '{"email": "x",', expected: 400 });
  assert.doesNotMatch(JSON.stringify(malformed.data), /node_modules|at \w+ \(/, 'no debe exponer el stack trace');
  assert.equal(health.response.headers.get('x-powered-by'), null, 'no debe revelar X-Powered-By');
  assert.equal(health.response.headers.get('x-content-type-options'), 'nosniff', 'helmet debe estar activo');
  await request('/destinos/no-es-id', { expected: 400 });
  await request('/destinos?region=Valpara%C3%ADso%21', { expected: 400 });

  // ---- Sesiones ----
  const adminLogin = await request('/auth/login', {
    method: 'POST', body: { email: adminEmail, password: adminPassword }, expected: 200,
  });
  const adminToken = adminLogin.data.token;
  const me = await request('/auth/me', { token: adminToken, expected: 200 });
  assert.equal(me.data.usuario.rol, 'admin');
  const adminId = me.data.usuario.id;

  const touristLogin = await request('/auth/login', {
    method: 'POST', body: { email: touristEmail, password: touristPassword }, expected: 200,
  });
  const touristToken = touristLogin.data.token;
  assert.equal(touristLogin.data.usuario.rol, 'turista');

  const [categories, regions] = await Promise.all([
    request('/categorias', { expected: 200 }), request('/categorias/regiones', { expected: 200 }),
  ]);
  assert.ok(categories.data.categorias.length, 'seed debe cargar categorías');
  assert.ok(regions.data.regiones.length, 'seed debe cargar regiones');
  const region = regions.data.regiones[0];

  const nonce = randomUUID().slice(0, 8);
  let registeredUserId;
  let registeredEmail;
  let categoryId;
  let categorySlug;
  let destinationId;
  let favoriteId;
  const cleanupErrors = [];

  try {
    // ---- Registro con verificación de correo ----
    await request('/auth/register', {
      method: 'POST', body: { nombre: 'Clave débil', email: `debil-${nonce}@example.test`, password: 'aaaaaaaa' }, expected: 400,
    });
    const newEmail = `registro-${nonce}@example.test`;
    registeredEmail = newEmail;
    const register = await request('/auth/register', {
      method: 'POST', body: { nombre: 'Turista de integración', email: newEmail, password: `Prueba${nonce}1` }, expected: 201,
    });
    assert.equal(register.data.token, undefined, 'el registro no inicia sesión hasta verificar el correo');
    const unverified = await request('/auth/login', {
      method: 'POST', body: { email: newEmail, password: `Prueba${nonce}1` }, expected: 403,
    });
    assert.equal(unverified.data.code, 'EMAIL_NOT_VERIFIED');
    await request('/auth/verify-email', { method: 'POST', body: { email: newEmail, codigo: '000000' }, expected: 400 });

    // ---- Roles ----
    await request('/destinos', { method: 'POST', body: {}, expected: 401 });
    await request('/destinos', { method: 'POST', token: touristToken, body: {}, expected: 403 });
    await request(`/usuarios/${adminId}`, { method: 'PATCH', token: adminToken, body: { rol: 'turista' }, expected: 400 });

    // ---- Categoría y destino temporales ----
    categorySlug = `prueba-${nonce}`;
    const createdCategory = await request('/categorias', {
      method: 'POST', token: adminToken,
      body: { nombre: `Categoría prueba ${nonce}`, slug: categorySlug, descripcion: 'Prueba temporal de integración' },
      expected: 201,
    });
    categoryId = createdCategory.data.categoria.id;
    const editedCategory = await request(`/categorias/${categoryId}`, {
      method: 'PUT', token: adminToken, body: { descripcion: 'Categoría editada por la prueba' }, expected: 200,
    });
    assert.equal(editedCategory.data.categoria.descripcion, 'Categoría editada por la prueba');

    await request('/destinos', {
      method: 'POST', token: adminToken,
      body: { nombre: 'Imagen peligrosa', categoria_id: categoryId, region_id: region.id, latitud: -33, longitud: -70, imagen_url: 'javascript:alert(1)' },
      expected: 400,
    });
    const createdDestination = await request('/destinos', {
      method: 'POST', token: adminToken,
      body: {
        nombre: `Destino prueba ${nonce}`, descripcion: 'Prueba temporal de integración',
        categoria_id: categoryId, region_id: region.id, latitud: -33.45, longitud: -70.66, horario: 'Acceso de prueba',
      },
      expected: 201,
    });
    destinationId = createdDestination.data.destino.id;
    await request(`/destinos/${destinationId}`, { method: 'PUT', token: adminToken, body: {}, expected: 400 });
    const readDestination = await request(`/destinos/${destinationId}`, { expected: 200 });
    assert.equal(readDestination.data.source, 'database');

    // Filtro combinado sobre datos propios (no depende de SERNATUR).
    const filtered = await request(`/destinos?categoria=${categorySlug}&region=${region.slug}`, { expected: 200 });
    assert.ok(filtered.data.destinos.some((d) => d.id === destinationId), 'el filtro debe encontrar el destino creado');
    assert.ok(
      filtered.data.destinos.every((d) => d.categoria_slug === categorySlug && d.region_slug === region.slug),
      'el filtro combinado solo debe devolver destinos de esa categoría y región',
    );

    // ---- Favoritos ----
    const favorite = await request('/favoritos', {
      method: 'POST', token: touristToken, body: { destino_id: destinationId }, expected: 201,
    });
    favoriteId = favorite.data.favorito.id;
    await request('/favoritos', { method: 'POST', token: touristToken, body: { destino_id: destinationId }, expected: 409 });
    const favorites = await request('/favoritos', { token: touristToken, expected: 200 });
    assert.ok(favorites.data.favoritos.some((item) => item.favorito_id === favoriteId));
    await request(`/favoritos/${favoriteId}`, { method: 'DELETE', token: touristToken, expected: 200 });
    favoriteId = undefined;

    // ---- Opiniones ----
    await request(`/destinos/${destinationId}/opiniones`, {
      method: 'POST', token: touristToken, body: { puntuacion: 6 }, expected: 400,
    });
    await request(`/destinos/${destinationId}/opiniones`, {
      method: 'POST', token: touristToken, body: { puntuacion: 4, comentario: 'Buena prueba' }, expected: 200,
    });
    const summary = await request(`/destinos/${destinationId}/opiniones`, { expected: 200 });
    assert.equal(summary.data.total_opiniones, 1);
    assert.equal(Number(summary.data.calificacion_promedio), 4);
    const mine = await request(`/destinos/${destinationId}/opinion`, { token: touristToken, expected: 200 });
    assert.equal(mine.data.opinion.puntuacion, 4);

    // ---- Usuarios ----
    const updatedDestination = await request(`/destinos/${destinationId}`, {
      method: 'PUT', token: adminToken, body: { nombre: `Destino editado ${nonce}` }, expected: 200,
    });
    assert.match(updatedDestination.data.destino.nombre, /Destino editado/);
    const users = await request('/usuarios', { token: adminToken, expected: 200 });
    const registered = users.data.usuarios.find((item) => item.email === newEmail);
    assert.ok(registered, 'la cuenta registrada debe existir');
    registeredUserId = registered.id;
    assert.ok(users.data.usuarios.every((item) => !('password_hash' in item)), 'la API no debe exponer hashes');

    // Una categoría con destinos activos no se puede eliminar.
    await request(`/categorias/${categoryId}`, { method: 'DELETE', token: adminToken, expected: 409 });
  } finally {
    // Limpieza: cada error se registra y hace fallar la prueba (no se oculta).
    const cleanup = async (label, path, token, expected = 200) => {
      try {
        const { response, data } = await request(path, { method: 'DELETE', token });
        if (response.status !== expected) cleanupErrors.push(`${label}: ${response.status} ${JSON.stringify(data)}`);
        return data;
      } catch (error) {
        cleanupErrors.push(`${label}: ${error.message}`);
        return undefined;
      }
    };
    if (favoriteId) await cleanup('favorito', `/favoritos/${favoriteId}`, touristToken);
    if (destinationId) await cleanup('destino', `/destinos/${destinationId}`, adminToken);
    if (categoryId) {
      // Al eliminar la categoría también se eliminan sus destinos ya quitados (y sus opiniones y favoritos).
      const deleted = await cleanup('categoría', `/categorias/${categoryId}`, adminToken);
      if (destinationId && deleted && deleted.destinos_inactivos_eliminados !== 1) {
        cleanupErrors.push(`categoría: se esperaba eliminar 1 destino inactivo y se eliminaron ${deleted.destinos_inactivos_eliminados}`);
      }
    }
    if (!registeredUserId && registeredEmail) {
      const users = await request('/usuarios', { token: adminToken }).catch(() => undefined);
      registeredUserId = users?.data?.usuarios?.find((item) => item.email === registeredEmail)?.id;
    }
    if (registeredUserId) await cleanup('usuario registrado', `/usuarios/${registeredUserId}`, adminToken);
    if (cleanupErrors.length) console.error('Errores al limpiar los datos de prueba:', cleanupErrors);
  }

  assert.deepEqual(cleanupErrors, [], 'la limpieza no debe dejar datos huérfanos');
  if (destinationId) await request(`/destinos/${destinationId}`, { expected: 404 });
});
