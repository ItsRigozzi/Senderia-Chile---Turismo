import React, { useCallback, useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonSpinner, IonToolbar } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { sugerenciasImagenesService } from '../services/api';
import type { SugerenciaImagenAdmin } from '../services/api';
import { getApiErrorBody } from '../services/apiError';
import { useAuth } from '../context/useAuth';
import BrandLink from '../components/BrandLink';
import AdminSugerenciaImagenCard from '../components/AdminSugerenciaImagenCard';

const AdminSugerenciasImagenes: React.FC = () => {
  const [sugerencias, setSugerencias] = useState<SugerenciaImagenAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const cargarSugerencias = useCallback(async (refresh = false) => {
    setCargando(!refresh);
    setActualizando(refresh);
    setError('');
    try {
      const response = await sugerenciasImagenesService.getPending();
      setSugerencias(response.data.sugerencias || []);
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudieron cargar las imágenes sugeridas.');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => { void cargarSugerencias(); }, [cargarSugerencias]);

  const revisarSugerencia = async (id: number, decision: 'aprobada' | 'rechazada') => {
    setProcesandoId(id);
    setError('');
    setAviso('');
    try {
      const response = await sugerenciasImagenesService.review(id, decision);
      setSugerencias((actuales) => actuales.filter((sugerencia) => sugerencia.id !== id));
      setAviso(response.data?.mensaje || (decision === 'aprobada' ? 'Imagen aprobada y publicada.' : 'Imagen rechazada.'));
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudo guardar la decisión.');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="admin-page-brand"><BrandLink subtitle="Revisión de imágenes" /></div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="admin-layout">
          <aside className="admin-sidebar" aria-label="Navegación de administración">
            <button type="button" className="admin-nav-item" onClick={() => navigate('/admin/dashboard')}>
              ← Destinos
            </button>
            <button type="button" className="admin-nav-item active" aria-current="page">
              Imágenes sugeridas
            </button>
            <button type="button" className="admin-nav-item" onClick={() => navigate('/explorar')}>
              Volver a la aplicación ↗
            </button>
            <button type="button" className="admin-nav-item" onClick={() => { logout(); window.location.replace('/login'); }}>
              Cerrar sesión
            </button>
          </aside>

          <main className="admin-main">
            <div className="admin-header-row admin-suggestions-page-header">
              <div>
                <h1>Imágenes sugeridas</h1>
                <p>Revisa primero los datos del envío y muestra la imagen cuando quieras evaluarla.</p>
              </div>
              <button type="button" onClick={() => void cargarSugerencias(true)} disabled={actualizando}>
                {actualizando ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
            {error && <p role="alert" className="community-images-error">{error}</p>}
            {aviso && <p role="status" className="community-images-success">{aviso}</p>}
            <section className="admin-table-card admin-image-suggestions-section">
              <h2>Pendientes de revisión ({sugerencias.length})</h2>
              {cargando ? <IonSpinner /> : sugerencias.length === 0 ? (
                <p>No hay imágenes pendientes de revisión.</p>
              ) : (
                <div className="admin-image-suggestions-grid">
                  {sugerencias.map((sugerencia) => (
                    <AdminSugerenciaImagenCard
                      key={sugerencia.id}
                      sugerencia={sugerencia}
                      procesando={procesandoId === sugerencia.id}
                      onRevisar={(id, decision) => void revisarSugerencia(id, decision)}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminSugerenciasImagenes;
