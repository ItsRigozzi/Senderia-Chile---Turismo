import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonLoading
} from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getApiErrorBody, getApiErrorMessage } from '../services/apiError';
import { getAuthReturnPath } from '../utils/navigation';
import { clearLoginNotice, peekLoginNotice } from '../utils/loginNotice';
import BrandLink from '../components/BrandLink';
import PasswordInput from '../components/PasswordInput';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { validarCorreo } from '../utils/validacionFormulario';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState(
    () => (location.state as { notice?: string } | null)?.notice || peekLoginNotice(),
  );
  const { login, loginWithGoogle } = useAuth();

  // Ionic puede reutilizar esta pantalla ya montada: se actualiza el aviso en cada llegada al login.
  useEffect(() => {
    if (location.pathname !== '/login') return;
    const nuevoAviso = (location.state as { notice?: string } | null)?.notice || peekLoginNotice();
    if (nuevoAviso) setNotice(nuevoAviso);
    clearLoginNotice();
  }, [location.key, location.pathname, location.state]);

  const handleLogin = async () => {
    setVerificationEmail('');
    const errorValidacion = validarCorreo(email) || (!password ? 'Ingresa tu contraseña.' : '');
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      await login(email, password);
      navigate(getAuthReturnPath(location.state, location.search), { replace: true });
    } catch (err: unknown) {
      const response = getApiErrorBody(err);
      if (response?.code === 'EMAIL_NOT_VERIFIED') {
        setVerificationEmail(email.trim().toLowerCase());
      }
      if (response?.detalles) {
        const detalles = response.detalles;
        const mensajes = Object.values(detalles).flat().join('. ');
        setError(mensajes || 'Datos inválidos');
      } else {
        const msg = getApiErrorMessage(err, 'No se pudo iniciar sesión. Intenta nuevamente.');
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setLoading(true);
    setError('');
    setVerificationEmail('');
    try {
      await loginWithGoogle(credential);
      navigate(getAuthReturnPath(location.state, location.search), { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo iniciar sesión con Google. Intenta nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="senderia-navbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
            <BrandLink />
            <button
              onClick={() => navigate('/explorar')}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer' }}
            >
              ← Volver al portal turístico
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: '#0F172A', color: '#fff', marginBottom: 12 }}>
                ▲
              </div>
              <h1>Iniciar Sesión</h1>
              <p>Ingresa tus credenciales para acceder a la plataforma</p>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {notice && <p className="auth-success-message" role="status">{notice}</p>}

            <form noValidate onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="input-group">
                <label className="input-label">
                  Correo electrónico <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  className="input-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  required
                />
                <small>Ejemplo: nombre@gmail.com</small>
              </div>

              <div className="input-group">
                <label className="input-label">
                  Contraseña <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="custom-primary-btn"
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </form>

            {verificationEmail && (
              <button
                type="button"
                className="custom-ghost-btn"
                onClick={() => navigate('/verificar-correo', {
                  state: {
                    email: verificationEmail,
                    from: (location.state as { from?: unknown } | null)?.from,
                  },
                })}
              >
                Verificar correo de {verificationEmail}
              </button>
            )}

            <button
              type="button"
              className="auth-text-link"
              onClick={() => navigate('/recuperar-contrasena')}
            >
              ¿Olvidaste tu contraseña?
            </button>

            <div className="auth-divider"><span>o</span></div>
            <GoogleSignInButton
              onCredential={(credential) => { void handleGoogleCredential(credential); }}
              onError={setError}
            />

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                type="button"
                className="custom-ghost-btn"
                onClick={() => navigate('/registro', { state: { from: (location.state as { from?: unknown } | null)?.from } })}
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
            </div>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Iniciando sesión..." />
      </IonContent>
    </IonPage>
  );
};

export default Login;
