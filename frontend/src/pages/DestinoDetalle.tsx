import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonContent,
  IonButtons, IonBackButton,
  IonSpinner, IonText
} from '@ionic/react';
import { useNavigate, useParams } from 'react-router-dom';
import { destinosService, favoritosService } from '../services/api';
import { useAuth } from '../context/useAuth';
import { getApiErrorBody } from '../services/apiError';
import BrandLink from '../components/BrandLink';

const MapaDestinos = lazy(() => import('../components/MapaDestinos'));

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
  const navigate = useNavigate();
  const [destino, setDestino] = useState<DestinoFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favMsg, setFavMsg] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

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
      } catch (err: unknown) {
        setError(getApiErrorBody(err)?.error || 'No se pudo cargar el destino desde el backend.');
        setLoading(false);
        return;
      }
    };
    fetchDestino();
  }, [id]);

  useEffect(() => {
    if (authLoading || !destino) return;
    if (!isAuthenticated) {
      setIsFavorite(false);
      return;
    }

    let active = true;
    setCheckingFavorite(true);
    favoritosService.getAll()
      .then((response) => {
        const favoritos = response.data?.favoritos || [];
        if (active) {
          setIsFavorite(favoritos.some((favorito: { id?: number; destino_id?: number }) =>
            Number(favorito.destino_id ?? favorito.id) === destino.id));
        }
      })
      .catch(() => {
        if (active) setIsFavorite(false);
      })
      .finally(() => {
        if (active) setCheckingFavorite(false);
      });

    return () => { active = false; };
  }, [authLoading, destino, isAuthenticated]);

  const handleAddFavorito = async () => {
    if (!destino) return;
    try {
      await favoritosService.add(destino.id);
      setIsFavorite(true);
      setFavMsg('¡Agregado a favoritos!');
    } catch (err: unknown) {
      const message = getApiErrorBody(err)?.error || 'Error al agregar a favoritos';
      if (message.toLowerCase().includes('ya está en tus favoritos')) setIsFavorite(true);
      setFavMsg(message);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="senderia-navbar">
            <div className="detail-navbar-inner"><BrandLink /></div>
          </IonToolbar>
        </IonHeader>
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
          <IonToolbar className="senderia-navbar">
            <div className="detail-navbar-inner">
              <BrandLink />
              <IonButtons><IonBackButton defaultHref="/explorar" text="Volver" /></IonButtons>
            </div>
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
          <div className="detail-navbar-inner">
            <BrandLink />
            <button
              onClick={() => navigate('/explorar')}
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
                      aria-busy={checkingFavorite}
                    >
                      <span className={`favorite-heart${isFavorite ? ' is-saved' : ''}`} aria-hidden="true">
                        {isFavorite ? '♥' : '♡'}
                      </span>{' '}
                      Guardar en Favoritos
                    </button>
                  ) : (
                    <button
                      className="custom-primary-btn"
                      onClick={() => navigate('/login', { state: { from: { pathname: `/destinos/${destino.id}` } } })}
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

          <section className="destination-map-section" aria-labelledby="destination-map-title">
            <div className="destination-map-heading">
              <div>
                <h2 id="destination-map-title">Ubicación del destino</h2>
                <p>Explora el mapa y revisa el punto marcado para este lugar.</p>
              </div>
              <span className="destination-map-coordinates">
                {Number(destino.latitud).toFixed(5)}, {Number(destino.longitud).toFixed(5)}
              </span>
            </div>
            <Suspense fallback={<div className="destination-map-loading">Cargando mapa…</div>}>
              <MapaDestinos
                destinos={[{
                  id: destino.id,
                  nombre: destino.nombre,
                  region_nombre: destino.region_nombre,
                  categoria_nombre: destino.categoria_nombre,
                  latitud: Number(destino.latitud),
                  longitud: Number(destino.longitud),
                }]}
                scrollWheelZoom
                footerText="Marcador según las coordenadas guardadas para este destino."
              />
            </Suspense>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DestinoDetalle;
