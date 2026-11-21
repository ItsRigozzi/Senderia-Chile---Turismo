import React, { useState } from 'react';
import { IonContent, IonHeader, IonLoading, IonPage, IonToolbar } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import BrandLink from '../components/BrandLink';
import PasswordInput from '../components/PasswordInput';
import { authService } from '../services/api';
import { getApiErrorBody, getApiErrorMessage } from '../services/apiError';

const RecuperarContrasena: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await authService.requestPasswordReset(email.trim());
      setNotice(response.data.mensaje);
      setStep('reset');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo solicitar el código.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
      setError('La contraseña debe incluir al menos una letra y un número.');
      return;
    }
    setLoading(true);
    try {
      const response = await authService.completePasswordReset(email.trim(), codigo.trim(), password);
      localStorage.removeItem('senderia_token');
      localStorage.removeItem('senderia_user');
      navigate('/login', { replace: true, state: { notice: response.data.mensaje } });
    } catch (err: unknown) {
      const body = getApiErrorBody(err);
      if (body?.detalles) {
        setError(Object.values(body.detalles).flat().join('. ') || body.error || 'Revisa los datos ingresados.');
      } else {
        setError(getApiErrorMessage(err, 'No se pudo actualizar la contraseña.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authService.requestPasswordReset(email.trim());
      setNotice(response.data.mensaje);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo solicitar otro código.'));
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
              <h1>Recuperar contraseña</h1>
              <p>Te enviaremos un código temporal al correo asociado a tu cuenta.</p>
            </header>
            {error && <div className="auth-error-message" role="alert">{error}</div>}
            {notice && <p className="auth-success-message" role="status">{notice}</p>}

            {step === 'request' ? (
              <form onSubmit={(event) => { void handleRequest(event); }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="reset-email">Correo electrónico</label>
                  <input id="reset-email" className="input-control" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" />
                </div>
                <button className="custom-primary-btn" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar código'}</button>
              </form>
            ) : (
              <form onSubmit={(event) => { void handleReset(event); }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="reset-code">Código de 6 dígitos</label>
                  <input id="reset-code" className="input-control auth-code-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={codigo} onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" />
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="new-password">Nueva contraseña</label>
                  <PasswordInput id="new-password" className="input-control" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required placeholder="Mínimo 8 caracteres" />
                  <small>Debe tener al menos 8 caracteres e incluir al menos una letra y un número.</small>
                </div>
                <div className="input-group">
                  <label className="input-label" htmlFor="confirm-new-password">Confirmar contraseña</label>
                  <PasswordInput id="confirm-new-password" className="input-control" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" required placeholder="Repite la contraseña" />
                </div>
                <button className="custom-primary-btn" type="submit" disabled={loading}>{loading ? 'Actualizando...' : 'Guardar nueva contraseña'}</button>
                <button className="auth-text-link" type="button" onClick={() => { void handleResend(); }} disabled={loading}>Solicitar otro código</button>
              </form>
            )}

            <p className="auth-setup-note">La recuperación por correo es para cuentas con contraseña de Sendería. Si tu cuenta usa solo Google, inicia sesión con Google.</p>
            <button type="button" className="custom-ghost-btn" onClick={() => navigate('/login')}>Volver a iniciar sesión</button>
          </section>
        </div>
        <IonLoading isOpen={loading} message="Procesando..." />
      </IonContent>
    </IonPage>
  );
};

export default RecuperarContrasena;
