import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage, NETWORK_ERROR_MESSAGE, TIMEOUT_ERROR_MESSAGE } from './apiError';

const config = { headers: new AxiosHeaders() };
const respuesta = (status: number, data: unknown = {}): AxiosResponse =>
  ({ status, statusText: '', data, headers: {}, config } as AxiosResponse);
const errorHttp = (status: number, data?: unknown) =>
  new AxiosError('error', 'ERR_BAD_RESPONSE', config, {}, respuesta(status, data));

describe('getApiErrorMessage', () => {
  it('informa cuando el backend no responde (caído o sin red)', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK', config, {});
    expect(getApiErrorMessage(error, 'Error al iniciar sesión')).toBe(NETWORK_ERROR_MESSAGE);
  });

  it('informa cuando se agota el tiempo de espera', () => {
    const error = new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED', config, {});
    expect(getApiErrorMessage(error, 'x')).toBe(TIMEOUT_ERROR_MESSAGE);
  });

  it('explica la falta de permisos (403)', () => {
    expect(getApiErrorMessage(errorHttp(403), 'x')).toMatch(/permisos/);
    expect(getApiErrorMessage(errorHttp(403, { error: 'Verifica tu correo' }), 'x')).toBe('Verifica tu correo');
  });

  it('explica el exceso de intentos (429)', () => {
    expect(getApiErrorMessage(errorHttp(429), 'x')).toMatch(/Demasiados intentos/);
  });

  it('distingue errores del servidor (500) y servicio no disponible (503)', () => {
    expect(getApiErrorMessage(errorHttp(500), 'x')).toMatch(/servidor tuvo un problema/);
    expect(getApiErrorMessage(errorHttp(503), 'x')).toMatch(/no está disponible/);
  });

  it('usa el mensaje de la API en errores 4xx y, si no hay, el mensaje de respaldo', () => {
    expect(getApiErrorMessage(errorHttp(409, { error: 'El correo ya está registrado' }), 'x')).toBe('El correo ya está registrado');
    expect(getApiErrorMessage(errorHttp(400, '<html>Bad Request</html>'), 'Revisa los datos')).toBe('Revisa los datos');
  });
});
