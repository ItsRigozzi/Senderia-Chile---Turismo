import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonItem, IonLabel, IonButton,
  IonSpinner, IonText
} from '@ionic/react';
import { useParams } from 'react-router';
import { destinosService, favoritosService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DestinoFull {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_nombre: string;
  region_nombre: string;
  latitud: number;
  longitud: number;
  horario: string;
  condiciones_acceso: string;
  imagen_url: string | null;
}

const DestinoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [destino, setDestino] = useState<DestinoFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favMsg, setFavMsg] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchDestino = async () => {
      if (!id) return;
      try {
        const response = await destinosService.getById(id);
        if (response.data?.destino) {
          setDestino(response.data.destino);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'No se pudo cargar el destino desde el backend.');
        setLoading(false);
        return;
      }
    };
    fetchDestino();
  }, [id]);

  const handleAddFavorito = async () => {
    if (!destino) return;
    try {
      await favoritosService.add(destino.id);
      setFavMsg('¡Agregado a favoritos!');
    } catch (err: any) {
      setFavMsg(err.response?.data?.error || 'Error al agregar a favoritos');
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !destino) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start"><IonBackButton defaultHref="/explorar" /></IonButtons>
            <IonTitle>Detalle del Destino</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger"><p>{error || 'Destino no encontrado.'}</p></IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="senderia-navbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.location.href = '/explorar'}>
              <span className="brand-badge">▲</span>
              <span style={{ fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>
                Senderia <span style={{ color: '#64748B', fontWeight: 400 }}>Chile</span>
              </span>
            </div>

            <button
              onClick={() => window.location.href = '/explorar'}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
            >
              ← Volver a Explorar Destinos
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="detail-container">
          <div className="breadcrumb">
            Inicio &gt; {destino.region_nombre} &gt; {destino.categoria_nombre} &gt; <strong style={{ color: '#0F172A' }}>{destino.nombre}</strong>
          </div>

          <div className="detail-header">
            <span className="detail-category-badge">{destino.categoria_nombre}</span>
            <h1 className="detail-title">{destino.nombre}</h1>
            <p className="detail-subtitle">{destino.region_nombre}, Chile</p>
            <div style={{ marginTop: '8px', color: '#F59E0B', fontSize: '14px', fontWeight: 600 }}>
              ★★★★★ 4.9 <span style={{ color: '#64748B', fontWeight: 400 }}>(Opiniones verificadas)</span>
            </div>
          </div>

          <div className="detail-grid">
            {/* Columna Izquierda: Imagen y Descripción */}
            <div>
              <img
                src={destino.imagen_url || '/images/destinos/sin-imagen.svg'}
                alt={destino.nombre}
                className="detail-main-img"
                onError={(e) => {
                  if (!e.currentTarget.src.endsWith('/sin-imagen.svg')) {
                    e.currentTarget.src = '/images/destinos/sin-imagen.svg';
                  }
                }}
              />

              <h2 className="detail-section-title">Descripción y Atractivos</h2>
              <p style={{ color: '#334155', lineHeight: '1.7', fontSize: '15px' }}>
                {destino.descripcion}
              </p>

              {destino.condiciones_acceso && (
                <>
                  <h2 className="detail-section-title">Condiciones de Acceso y Recomendaciones</h2>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '8px', color: '#334155', fontSize: '14px', lineHeight: '1.6' }}>
                    {destino.condiciones_acceso}
                  </div>
                </>
              )}
            </div>

            {/* Columna Derecha: Tarjeta Práctica */}
            <div>
              <div className="detail-info-card">
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Ficha Técnica
                </h3>

                <div className="info-item">
                  <span className="info-item-label">Región</span>
                  <span className="info-item-value">{destino.region_nombre}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Categoría</span>
                  <span className="info-item-value">{destino.categoria_nombre}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Coordenadas GPS</span>
                  <span className="info-item-value">{destino.latitud}, {destino.longitud}</span>
                </div>

                {destino.horario && (
                  <div className="info-item">
                    <span className="info-item-label">Horario de Ingreso</span>
                    <span className="info-item-value">{destino.horario}</span>
                  </div>
                )}

                <div style={{ marginTop: '20px' }}>
                  {isAuthenticated ? (
                    <button
                      className="custom-primary-btn"
                      onClick={handleAddFavorito}
                    >
                      ❤️ Guardar en Favoritos
                    </button>
                  ) : (
                    <button
                      className="custom-primary-btn"
                      onClick={() => window.location.href = '/login'}
                    >
                      Inicia sesión para guardar
                    </button>
                  )}

                  {favMsg && (
                    <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: favMsg.includes('!') ? '#15803D' : '#D97706', fontWeight: 600 }}>
                      {favMsg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DestinoDetalle;
