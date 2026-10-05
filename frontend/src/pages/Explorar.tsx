import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonButton, IonSpinner, IonText, IonButtons
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { destinosService } from '../services/api';

interface Destino {
  id: number;
  nombre: string;
  categoria_nombre: string;
  region_nombre: string;
  imagen_url: string | null;
}

const Explorar: React.FC = () => {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, isAdmin, logout, user } = useAuth();

  useEffect(() => {
    const fetchDestinos = async () => {
      try {
        const response = await destinosService.getAll();
        if (response.data?.destinos && response.data.destinos.length > 0) {
          setDestinos(response.data.destinos);
        } else {
          setDestinos([]);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'No se pudo conectar con la API. Comprueba que PostgreSQL y el backend estén activos.');
      } finally {
        setLoading(false);
      }
    };
    fetchDestinos();
  }, []);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');

  const categorias = ['Todos', 'Parques Nac.', 'Reservas', 'Montañas', 'Desierto'];

  const matchCategoryName = (catNombre: string, filtro: string): boolean => {
    if (filtro === 'Todos') return true;
    const cat = catNombre.toLowerCase();
    if (filtro === 'Montañas') return cat.includes('montaña') || cat.includes('cerro') || cat.includes('senderismo') || cat.includes('trekking');
    if (filtro === 'Parques Nac.') return cat.includes('parque');
    if (filtro === 'Reservas') return cat.includes('reserva');
    if (filtro === 'Desierto') return cat.includes('desierto');
    return cat.includes(filtro.toLowerCase());
  };

  const destinosFiltrados = destinos.filter((d) => {
    const term = busqueda.toLowerCase().trim();
    const matchBusqueda = !term ||
      d.nombre.toLowerCase().includes(term) ||
      d.region_nombre.toLowerCase().includes(term) ||
      d.categoria_nombre.toLowerCase().includes(term) ||
      (term.includes('montaña') && (d.categoria_nombre.toLowerCase().includes('cerro') || d.categoria_nombre.toLowerCase().includes('senderismo')));

    const matchCategoria = matchCategoryName(d.categoria_nombre, categoriaFiltro);
    return matchBusqueda && matchCategoria;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="senderia-navbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => window.location.href = '/explorar'}>
                <span className="brand-badge">▲</span>
                <span style={{ fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>
                  Senderia <span style={{ color: '#64748B', fontWeight: 400 }}>Chile</span>
                </span>
              </div>

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
                      onClick={() => window.location.href = '/admin/dashboard'}
                      style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#fff', color: '#0F172A', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Admin
                    </button>
                  )}
                  {!isAdmin && <button onClick={() => window.location.href = '/favoritos'} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#fff', color: '#0F172A', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>♡ Favoritos</button>}
                  <button
                    onClick={logout}
                    style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => window.location.href = '/login'}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #0F172A', background: '#0F172A', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => window.location.href = '/registro'}
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
          </div>

          {loading && (
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
              <p style={{ color: '#64748B', fontSize: '15px' }}>No se encontraron destinos que coincidan con tu búsqueda.</p>
            </div>
          )}

          {!loading && !error && (
            <div className="destinos-grid">
              {destinosFiltrados.map((destino) => (
                <div
                  key={destino.id}
                  className="destino-card"
                  onClick={() => window.location.href = `/destinos/${destino.id}`}
                >
                  <div className="destino-img-wrap">
                    <img
                      src={destino.imagen_url || '/images/destinos/sin-imagen.svg'}
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
                        ★ 4.8 <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Opiniones)</span>
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
      </IonContent>
    </IonPage>
  );
};

export default Explorar;
