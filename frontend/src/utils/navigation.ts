type RouteIntent = {
  pathname?: string;
  search?: string;
  hash?: string;
};

type AuthRouteState = {
  from?: RouteIntent;
} | null;

const isSafeInternalPath = (path: string): boolean => path.startsWith('/') && !path.startsWith('//');

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
