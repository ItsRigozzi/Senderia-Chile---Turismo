// Aviso de un solo uso para mostrar en la pantalla de inicio de sesión
// (por ejemplo, "Tu sesión expiró"). Se guarda en sessionStorage para que
// sobreviva a redirecciones encadenadas del router.
const LOGIN_NOTICE_KEY = 'senderia_login_notice';

export const setLoginNotice = (message: string): void => {
  try { sessionStorage.setItem(LOGIN_NOTICE_KEY, message); } catch { /* almacenamiento no disponible */ }
};

export const peekLoginNotice = (): string => {
  try { return sessionStorage.getItem(LOGIN_NOTICE_KEY) || ''; } catch { return ''; }
};

export const clearLoginNotice = (): void => {
  try { sessionStorage.removeItem(LOGIN_NOTICE_KEY); } catch { /* almacenamiento no disponible */ }
};
