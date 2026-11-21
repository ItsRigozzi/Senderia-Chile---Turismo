type RouteIntent = {
  pathname?: string;
  search?: string;
  hash?: string;
};

type AuthRouteState = {
  from?: RouteIntent;
} | null;

// Solo rutas internas: deben empezar con una "/" y no pueden contener "\" ni caracteres de control,
// porque el navegador interpreta "/\sitio.com" como "//sitio.com" (redirección abierta).
// eslint-disable-next-line no-control-regex
const isSafeInternalPath = (path: string): boolean => /^\/(?![/\\])/.test(path) && !/[\\\u0000-\u001f\u007f]/.test(path);

export function getAuthReturnPath(state: unknown, search: string, fallback = '/explorar'): string {
  const routeState = state as AuthRouteState;
  const from = routeState?.from;
  const statePath = from?.pathname
    ? `${from.pathname}${from.search || ''}${from.hash || ''}`
    : undefined;
  const queryPath = new URLSearchParams(search).get('returnTo') || undefined;
  const candidate = statePath || queryPath;

  return candidate && isSafeInternalPath(candidate) ? candidate : fallback;
}
