import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonSpinner, IonModal, IonTitle, IonButtons, IonButton, IonFooter,
  useIonViewWillEnter
} from '@ionic/react';
import { useAuth } from '../context/useAuth';
import { categoriasService, destinosService, publicAssetUrl } from '../services/api';
import type { Categoria, DestinoFiltros, Region } from '../services/api';
import { getApiErrorBody } from '../services/apiError';
import { useNavigate } from 'react-router-dom';
import BrandLink from '../components/BrandLink';
import FiltrosDestinos from '../components/FiltrosDestinos';
import type { FiltroDestino } from '../components/FiltrosDestinos';
import { coincideBusquedaDestino } from '../utils/busquedaDestinos';

const MapaDestinos = lazy(() => import('../components/MapaDestinos'));

interface Destino {
  id: number;
  nombre: string;
  categoria_nombre: string;
  region_nombre: string;
  latitud: number;
  longitud: number;
  imagen_url: string | null;
  condiciones_acceso?: string | null;
  calificacion_promedio: number | string | null;
  total_opiniones: number;
}

const Explorar: React.FC = () => {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState<DestinoFiltros>({ categoria: [], region: [] });
  const [opcionesCategorias, setOpcionesCategorias] = useState<Categoria[]>([]);
  const [opcionesRegiones, setOpcionesRegiones] = useState<Region[]>([]);
  const [errorOpciones, setErrorOpciones] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const ultimaPeticion = useRef(0);
  const filtrosIniciales = useRef(true);
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();

  const fetchDestinos = useCallback(async () => {
    // Si el usuario cambia los filtros rápido, solo se aplica la respuesta de la última petición.
    const peticion = ++ultimaPeticion.current;
    setLoading(true);
    setError('');
    try {
      const response = await destinosService.getAll(filtros);
      if (peticion !== ultimaPeticion.current) return;
      const data: { destinos?: Destino[] } = response.data;
      setDestinos(data?.destinos || []);
    } catch (err: unknown) {
      if (peticion !== ultimaPeticion.current) return;
      setError(getApiErrorBody(err)?.error || 'No se pudo conectar con la API. Comprueba que PostgreSQL y el backend estén activos.');
    } finally {
      if (peticion === ultimaPeticion.current) setLoading(false);
    }
  }, [filtros]);

  const fetchOpcionesFiltros = useCallback(async () => {
    try {
      const [categoriasResponse, regionesResponse] = await Promise.all([
        categoriasService.getAll(), categoriasService.getRegiones(),
      ]);
      setOpcionesCategorias(categoriasResponse.data.categorias || []);
      setOpcionesRegiones(regionesResponse.data.regiones || []);
      setErrorOpciones('');
    } catch {
      setErrorOpciones('No se pudieron cargar los filtros. Intenta nuevamente en unos minutos.');
    }
  }, []);

  useIonViewWillEnter(() => {
    void fetchDestinos();
    void fetchOpcionesFiltros();
  }, [fetchDestinos, fetchOpcionesFiltros]);

  // La carga inicial la hace useIonViewWillEnter; aquí solo se vuelve a consultar al cambiar los filtros.
  useEffect(() => {
    if (filtrosIniciales.current) {
      filtrosIniciales.current = false;
      return;
    }
    void fetchDestinos();
  }, [fetchDestinos]);

  const toggleFiltro = (filtro: FiltroDestino, slug: string) => {
    setFiltros((actual) => ({
      ...actual,
      [filtro]: actual[filtro].includes(slug)
        ? actual[filtro].filter((valor) => valor !== slug)
        : [...actual[filtro], slug],
    }));
  };

  const limpiarFiltros = () => setFiltros({ categoria: [], region: [] });
  const filtrosActivos = filtros.categoria.length + filtros.region.length;

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');

  const categorias = ['Todos', 'Requiere reserva previa'];

  const requiresAdvanceReservation = (conditions?: string | null): boolean => {
    const normalized = (conditions || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const explicitlyOptional = /\b(?:no\s+(?:se\s+)?(?:requiere|necesita|exige|solicita)|no\s+(?:es\s+)?(?:necesaria|necesario|obligatoria|obligatorio)|sin(?:\s+necesidad\s+de)?)\b.{0,40}\breserv(?:a|as|ar|acion|aciones)\b/.test(normalized)
      || /\breserv(?:a|as|ar|acion|aciones)\b.{0,30}\bno\s+(?:es\s+)?(?:necesaria|necesario|obligatoria|obligatorio|requerida|requerido)\b/.test(normalized);
    return !explicitlyOptional && /\breserv(?:a|as|ar|acion|aciones)\b/.test(normalized);
  };

  const destinosFiltrados = destinos.filter((d) => {
    const matchBusqueda = coincideBusquedaDestino(d, busqueda);

    const matchCategoria = categoriaFiltro === 'Requiere reserva previa'
      ? requiresAdvanceReservation(d.condiciones_acceso)
      : true;
    return matchBusqueda && matchCategoria;
  });

  // Mientras se recarga por un cambio de filtros se mantienen visibles los resultados anteriores.
  const mostrarResultados = !error && (!loading || destinos.length > 0);
  const panelFiltros = (
    <FiltrosDestinos
      regiones={opcionesRegiones}
      categorias={opcionesCategorias}
      seleccion={filtros}
      activos={filtrosActivos}
      onToggle={toggleFiltro}
      onLimpiar={limpiarFiltros}
      error={errorOpciones}
    />
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="senderia-navbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BrandLink />

              {isAdmin && (
                <span
                  role="status"
                  aria-live="polite"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: error ? '#FEE2E2' : '#DCFCE7',
                    color: error ? '#B91C1C' : '#15803D'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: error ? '#DC2626' : '#16A34A' }} />
                  {error ? 'API no disponible' : 'API conectada'}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {isAuthenticated ? (
                <>
                  <span style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                    {user?.nombre}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#fff', color: '#0F172A', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Admin
                    </button>
                  )}
                  <button onClick={() => navigate('/favoritos')} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#fff', color: '#0F172A', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>♡ Favoritos</button>
                  <button
                    onClick={() => { logout(); window.location.replace('/login'); }}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/login')}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #0F172A', background: '#0F172A', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => navigate('/registro')}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#fff', color: '#0F172A', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="explorer-layout">
          <div className="search-filter-panel">
            <div className="search-input-wrapper">
              <span className="search-icon-placeholder">🔍</span>
              <input
                type="text"
                placeholder="¿Qué lugar de Chile deseas explorar? (ej. Torres del Paine)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="filter-chips">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  className={`filter-chip ${categoriaFiltro === cat ? 'active' : ''}`}
                  onClick={() => setCategoriaFiltro(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button type="button" className="explorar-filtros-boton" onClick={() => setFiltrosAbiertos(true)}>
              Filtros{filtrosActivos > 0 && <span className="filtros-destinos-grupo-contador">{filtrosActivos}</span>}
            </button>
          </div>

          <div className="explorar-cuerpo">
            <aside className="explorar-filtros-sidebar" aria-label="Filtros de destinos">
              {panelFiltros}
            </aside>

            <div className="explorar-resultados">
              {loading && destinos.length > 0 && (
                <p className="explorar-actualizando" role="status">Actualizando resultados…</p>
              )}

              {loading && destinos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <IonSpinner name="crescent" />
                  <p style={{ marginTop: '12px', color: '#64748B', fontSize: '14px' }}>Cargando destinos turísticos...</p>
                </div>
              )}

              {error && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, margin: '16px 0' }}>
                  {isAdmin ? error : 'No se pudieron cargar los destinos. Intenta nuevamente en unos minutos.'}
                </div>
              )}

              {!loading && !error && destinosFiltrados.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <p style={{ color: '#64748B', fontSize: '15px' }}>No se encontraron destinos que coincidan con tu búsqueda y filtros.</p>
                  <p style={{ color: '#64748B', fontSize: '14px' }}>Prueba quitando algún filtro o cambiando el texto de búsqueda.</p>
                  {filtrosActivos > 0 && (
                    <button type="button" className="filtros-destinos-limpiar" onClick={limpiarFiltros}>
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}

              {mostrarResultados && destinosFiltrados.length > 0 && (
                <section className="destination-map-section" aria-labelledby="explore-map-title">
                  <div className="destination-map-heading">
                    <div>
                      <h2 id="explore-map-title">Mapa de destinos</h2>
                      <p>Los marcadores corresponden a los destinos visibles según tu búsqueda y filtros.</p>
                    </div>
                    <span className="destination-map-coordinates">
                      {destinosFiltrados.length} {destinosFiltrados.length === 1 ? 'destino' : 'destinos'}
                    </span>
                  </div>
                  <Suspense fallback={<div className="destination-map-loading">Cargando mapa…</div>}>
                    <MapaDestinos
                      destinos={destinosFiltrados.map((destino) => ({
                        id: destino.id,
                        nombre: destino.nombre,
                        region_nombre: destino.region_nombre,
                        categoria_nombre: destino.categoria_nombre,
                        latitud: Number(destino.latitud),
                        longitud: Number(destino.longitud),
                      }))}
                      onOpenDestination={(destinationId) => navigate(`/destinos/${destinationId}`)}
                      scrollWheelZoom
                      footerText="Selecciona un marcador para ver el destino. Los datos provienen de Sendería y las calles del mapa de OpenStreetMap."
                    />
                  </Suspense>
                </section>
              )}

              {mostrarResultados && (
                <div className="destinos-grid">
                  {destinosFiltrados.map((destino) => (
                    <div
                      key={destino.id}
                      className="destino-card"
                      onClick={() => navigate(`/destinos/${destino.id}`)}
                    >
                      <div className="destino-img-wrap">
                        <img
                          src={destino.imagen_url?.startsWith('/api/')
                            ? publicAssetUrl(destino.imagen_url)
                            : destino.imagen_url || '/images/destinos/sin-imagen.svg'}
                          alt={destino.nombre}
                          loading="lazy"
                          onError={(e) => {
                            if (!e.currentTarget.src.endsWith('/sin-imagen.svg')) {
                              e.currentTarget.src = '/images/destinos/sin-imagen.svg';
                            }
                          }}
                        />
                        <span className="destino-badge-top">{destino.categoria_nombre}</span>
                      </div>

                      <div className="destino-card-body">
                        <span className="destino-region">{destino.region_nombre}</span>
                        <h3 className="destino-nombre">{destino.nombre}</h3>

                        <div className="destino-card-footer">
                          <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: 600 }}>
                            {destino.calificacion_promedio == null ? (
                              <>☆ <span style={{ color: '#94A3B8', fontWeight: 400 }}>Sin calificaciones</span></>
                            ) : (
                              <>
                                ★ {Number(destino.calificacion_promedio).toFixed(1)}{' '}
                                <span style={{ color: '#94A3B8', fontWeight: 400 }}>
                                  ({destino.total_opiniones} {destino.total_opiniones === 1 ? 'calificación' : 'calificaciones'})
                                </span>
                              </>
                            )}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563EB' }}>
                            Ver detalles →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </IonContent>

      <IonModal
        className="explorar-filtros-modal"
        isOpen={filtrosAbiertos}
        onDidDismiss={() => setFiltrosAbiertos(false)}
        breakpoints={[0, 0.75, 1]}
        initialBreakpoint={0.75}
        expandToScroll={false}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Filtrar destinos</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setFiltrosAbiertos(false)}>Cerrar</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {panelFiltros}
        </IonContent>
        <IonFooter>
          <IonToolbar>
            <IonButton expand="block" onClick={() => setFiltrosAbiertos(false)}>
              {loading ? 'Ver resultados' : `Ver ${destinosFiltrados.length} ${destinosFiltrados.length === 1 ? 'resultado' : 'resultados'}`}
            </IonButton>
          </IonToolbar>
        </IonFooter>
      </IonModal>
    </IonPage>
  );
};

export default Explorar;
