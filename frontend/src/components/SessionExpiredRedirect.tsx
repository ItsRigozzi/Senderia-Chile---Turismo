import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SESSION_EXPIRED_EVENT, type SessionExpiredDetail } from '../services/api';
import { setLoginNotice } from '../utils/loginNotice';

const SESSION_EXPIRED_NOTICE = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';

/**
 * Cuando la API informa que la sesión expiró (401), lleva al usuario al login
 * con la navegación del router, sin recargar toda la aplicación.
 * Debe ubicarse dentro del router.
 */
const SessionExpiredRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const { returnTo } = (event as CustomEvent<SessionExpiredDetail>).detail ?? { returnTo: '' };
      if (!returnTo) return; // Ya está en una pantalla de autenticación.
      // El aviso se guarda aparte porque una ruta protegida también puede redirigir al login.
      setLoginNotice(SESSION_EXPIRED_NOTICE);
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, {
        replace: true,
        state: { notice: SESSION_EXPIRED_NOTICE },
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate]);

  return null;
};

export default SessionExpiredRedirect;
