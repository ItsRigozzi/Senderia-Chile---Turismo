import { describe, expect, it } from 'vitest';
import { getAuthReturnPath } from './navigation';

describe('getAuthReturnPath', () => {
  it('retains the original route and its query after authentication', () => {
    expect(getAuthReturnPath({
      from: { pathname: '/destinos/12', search: '?origen=mapa', hash: '#ficha' },
    }, '')).toBe('/destinos/12?origen=mapa#ficha');
  });

  it('uses a local returnTo URL when the session expired', () => {
    expect(getAuthReturnPath(null, '?returnTo=%2Ffavoritos')).toBe('/favoritos');
  });

  it('rejects external redirects and uses the default route', () => {
    expect(getAuthReturnPath(null, '?returnTo=%2F%2Fevil.example')).toBe('/explorar');
  });

  it('rejects backslash and control-character redirects (open redirect)', () => {
    expect(getAuthReturnPath(null, '?returnTo=%2F%5Cevil.example')).toBe('/explorar');
    expect(getAuthReturnPath(null, '?returnTo=%2F%09%2Fevil.example')).toBe('/explorar');
    expect(getAuthReturnPath(null, '?returnTo=https%3A%2F%2Fevil.example')).toBe('/explorar');
    expect(getAuthReturnPath({ from: { pathname: '/\\evil.example' } }, '')).toBe('/explorar');
    expect(getAuthReturnPath(null, '?returnTo=%2Fdestinos%2F12%3Ftab%3Dmapa')).toBe('/destinos/12?tab=mapa');
  });
});
