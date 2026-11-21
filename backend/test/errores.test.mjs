import test from 'node:test';
import assert from 'node:assert/strict';
import { globalErrorHandler, sendServerError } from '../dist/middleware/errorHandler.js';

// Respuesta mínima de Express para capturar el código y el cuerpo.
const fakeRes = () => {
  const res = { statusCode: 0, body: undefined, headersSent: false };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
};
const silenciar = (fn) => { const original = console.error; console.error = () => {}; try { fn(); } finally { console.error = original; } };

test('un error inesperado responde 500 sin exponer detalles', () => {
  const res = fakeRes();
  silenciar(() => sendServerError(res, new TypeError('Cannot read properties of undefined'), 'prueba', 'No se pudo consultar PostgreSQL'));
  assert.equal(res.statusCode, 500);
  assert.doesNotMatch(res.body.error, /postgres|undefined|TypeError/i);
});

test('PostgreSQL caído responde 503', () => {
  for (const error of [{ code: 'ECONNREFUSED' }, { code: '57P01' }, new Error('Connection terminated unexpectedly')]) {
    const res = fakeRes();
    silenciar(() => sendServerError(res, error, 'prueba'));
    assert.equal(res.statusCode, 503);
  }
});

test('un JSON malformado responde 400 en JSON, sin stack trace', () => {
  const error = Object.assign(new SyntaxError('Unexpected end of JSON input'), { type: 'entity.parse.failed', status: 400 });
  const res = fakeRes();
  globalErrorHandler(error, {}, res, () => {});
  assert.equal(res.statusCode, 400);
  assert.equal(typeof res.body.error, 'string');
  assert.doesNotMatch(JSON.stringify(res.body), /at |node_modules|SyntaxError/);
});

test('un error no controlado en una ruta responde 500 en JSON', () => {
  const res = fakeRes();
  silenciar(() => globalErrorHandler(new Error('fallo interno'), {}, res, () => {}));
  assert.equal(res.statusCode, 500);
  assert.doesNotMatch(res.body.error, /fallo interno/);
});
