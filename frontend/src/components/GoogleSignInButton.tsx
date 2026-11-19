import { useEffect, useRef, type FC } from 'react';

type GoogleCredentialResponse = { credential: string };
type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (element: HTMLElement, options: {
        type: 'standard';
        theme: 'outline';
        size: 'large';
        text: 'signin_with';
        shape: 'rectangular';
        width: number;
        locale: 'es';
      }) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}

const GOOGLE_SCRIPT_SELECTOR = 'script[src="https://accounts.google.com/gsi/client"]';

const GoogleSignInButton: FC<GoogleSignInButtonProps> = ({ onCredential, onError }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      const container = buttonRef.current;
      const googleIdentity = window.google;
      if (cancelled || !container || !googleIdentity) return;
      googleIdentity.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onCredentialRef.current(response.credential);
          else onErrorRef.current('Google no devolvió una credencial. Intenta nuevamente.');
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      container.replaceChildren();
      googleIdentity.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: Math.min(360, Math.max(240, Math.floor(container.clientWidth || 360))),
        locale: 'es',
      });
    };

    let script = document.querySelector<HTMLScriptElement>(GOOGLE_SCRIPT_SELECTOR);
    const onLoad = () => renderGoogleButton();
    const onScriptError = () => onErrorRef.current('No se pudo cargar el acceso de Google. Revisa tu conexión.');

    if (window.google) {
      renderGoogleButton();
    } else if (script) {
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onScriptError);
    } else {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onScriptError);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onScriptError);
    };
  }, [clientId]);

  if (!clientId) {
    return <p className="auth-setup-note">Para habilitar Google, configura GOOGLE_CLIENT_ID en el archivo .env (Docker) o VITE_GOOGLE_CLIENT_ID en frontend/.env.local.</p>;
  }

  return <div className="google-signin-container" ref={buttonRef} aria-label="Iniciar sesión con Google" />;
};

export default GoogleSignInButton;
