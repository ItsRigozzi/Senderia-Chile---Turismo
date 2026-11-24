import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonLoading
} from '@ionic/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getApiErrorBody, getApiErrorMessage } from '../services/apiError';
import BrandLink from '../components/BrandLink';
import PasswordInput from '../components/PasswordInput';
import { validarContrasenaNueva, validarCorreo } from '../utils/validacionFormulario';

const Registro: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const handleRegister = async () => {
    const nombreLimpio = nombre.trim();
    const errorValidacion =
      (!nombreLimpio ? 'Ingresa tu nombre completo.' : '')
      || (nombreLimpio.length < 2 ? 'El nombre debe tener al menos 2 letras.' : '')
      || validarCorreo(email)
      || validarContrasenaNueva(password, confirmPassword);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(nombre, email, password);
      navigate('/verificar-correo', {
        replace: true,
        state: {
          email: email.trim().toLowerCase(),
          from: (location.state as { from?: unknown } | null)?.from,
          notice: 'Te enviamos un código de 6 dígitos. Revisa también la carpeta de spam.',
        },
      });
    } catch (err: unknown) {
      const response = getApiErrorBody(err);
      if (response?.code === 'EMAIL_SEND_FAILED' && response.email) {
        navigate('/verificar-correo', {
          replace: true,
          state: {
            email: response.email,
            from: (location.state as { from?: unknown } | null)?.from,
            error: 'La cuenta se creó, pero el envío del correo falló. Revisa el SMTP e intenta reenviar el código.',
          },
        });
        return;
      }
      if (response?.detalles) {
        const detalles = response.detalles;
        const mensajes = Object.values(detalles).flat().join('. ');
        setError(mensajes || 'Datos inválidos');
      } else {
        const msg = getApiErrorMessage(err, 'No se pudo crear la cuenta. Intenta nuevamente.');
        setError(msg);
      }
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
              <h1>Crear Cuenta</h1>
              <p>Únete para guardar destinos favoritos y planificar tus rutas</p>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form noValidate onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
              <div className="input-group">
                <label className="input-label">
                  Nombre completo <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu Nombre y Apellido"
                  required
                />
              </div>

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
                  placeholder="Mínimo 8 caracteres, con letras y números"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Confirmar contraseña <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="custom-primary-btn"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                type="button"
                className="custom-ghost-btn"
                onClick={() => navigate('/login', { state: { from: (location.state as { from?: unknown } | null)?.from } })}
              >
                ¿Ya tienes una cuenta? Inicia sesión aquí
              </button>
            </div>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Creando cuenta..." />
      </IonContent>
    </IonPage>
  );
};

export default Registro;
