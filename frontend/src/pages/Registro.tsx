import React, { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonButton, IonItem, IonList, IonText, IonLoading
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Registro: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!nombre || !email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(nombre, email, password);
      navigate('/explorar');
    } catch (err: any) {
      if (err.response?.data?.detalles) {
        const detalles = err.response.data.detalles;
        const mensajes = Object.values(detalles).flat().join('. ');
        setError(mensajes || 'Datos inválidos');
      } else {
        const msg = err.response?.data?.error || 'Error al registrarse';
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
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/explorar')}>
              <span className="brand-badge">▲</span>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>
                Senderia <span style={{ color: '#64748B', fontWeight: 400 }}>Chile</span>
              </span>
            </div>
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

            <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
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
                  placeholder="usuario@dominio.cl"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Contraseña <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="password"
                  className="input-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Confirmar contraseña <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="password"
                  className="input-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
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
                onClick={() => navigate('/login')}
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
