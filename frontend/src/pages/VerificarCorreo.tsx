import React, { useState } from 'react';
import { IonContent, IonHeader, IonLoading, IonPage, IonToolbar } from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import BrandLink from '../components/BrandLink';
import { useAuth } from '../context/useAuth';
import { authService } from '../services/api';
import { getApiErrorBody } from '../services/apiError';
import { getAuthReturnPath } from '../utils/navigation';

const VerificarCorreo: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = location.state as { email?: string; from?: unknown; notice?: string; error?: string } | null;
  const [email, setEmail] = useState(routeState?.email || '');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(routeState?.error || '');
  const [notice, setNotice] = useState(routeState?.notice || 'Ingresa el código de 6 dígitos que enviamos a tu correo.');
  const { verifyEmail } = useAuth();

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyEmail(email.trim(), codigo.trim());
      navigate(getAuthReturnPath(location.state, location.search), { replace: true });
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudo verificar el correo. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authService.resendVerificationCode(email.trim());
      setNotice(response.data.mensaje);
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudo reenviar el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="senderia-navbar">
          <div className="auth-navbar-inner">
            <BrandLink />
            <button type="button" className="auth-back-link" onClick={() => navigate('/explorar')}>← Volver al portal turístico</button>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="auth-container">
          <section className="auth-card">
            <header className="auth-header">
              <div className="auth-brand-mark">▲</div>
              <h1>Verifica tu correo</h1>
              <p>Confirma que puedes recibir mensajes en esta dirección para activar tu cuenta.</p>
            </header>
            {error && <div className="auth-error-message" role="alert">{error}</div>}
            {notice && <p className="auth-success-message" role="status">{notice}</p>}
            <form onSubmit={handleVerify}>
              <div className="input-group">
                <label className="input-label" htmlFor="verification-email">Correo electrónico</label>
                <input id="verification-email" className="input-control" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="verification-code">Código de verificación</label>
                <input id="verification-code" className="input-control auth-code-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={codigo} onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" />
              </div>
              <button className="custom-primary-btn" type="submit" disabled={loading}>{loading ? 'Verificando...' : 'Verificar y activar cuenta'}</button>
            </form>
            <button type="button" className="auth-text-link" onClick={() => { void handleResend(); }} disabled={loading}>Reenviar código</button>
            <button type="button" className="custom-ghost-btn" onClick={() => navigate('/login')}>Volver a iniciar sesión</button>
          </section>
        </div>
        <IonLoading isOpen={loading} message="Procesando..." />
      </IonContent>
    </IonPage>
  );
};

export default VerificarCorreo;
