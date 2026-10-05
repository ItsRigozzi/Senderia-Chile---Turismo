import React, { useCallback, useEffect, useState } from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonSpinner, IonToolbar } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { favoritosService } from '../services/api';

interface Favorito {
  favorito_id: number;
  id: number;
  nombre: string;
  descripcion?: string;
  categoria_nombre: string;
  region_nombre: string;
  imagen_url?: string;
}

const Favoritos: React.FC = () => {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadFavoritos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await favoritosService.getAll();
      setFavoritos(response.data.favoritos || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudieron cargar tus favoritos.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadFavoritos(); }, [loadFavoritos]);

  const remove = async (id: number) => {
    try {
      await favoritosService.remove(id);
      setFavoritos((items) => items.filter((item) => item.favorito_id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo quitar el favorito.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="senderia-navbar">
          <div className="favorites-navbar-inner">
            <div className="favorites-brand">
              <span className="brand-badge" aria-hidden="true">▲</span>
              <strong>Senderia <span>Chile</span></strong>
            </div>
            <button className="favorites-back-button" type="button" onClick={() => navigate('/explorar')}>
              <span aria-hidden="true">←</span> Volver a Explorar Destinos
            </button>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <main className="favorites-page">
          <header className="favorites-page-heading">
            <h1>Mis atractivos guardados</h1>
            <p>Tu colección de destinos para planificar tu próximo viaje por Chile.</p>
          </header>
          {error && <p role="alert" className="favorites-error">{error}</p>}
          {loading ? <div className="favorites-loading"><IonSpinner /><span>Cargando favoritos…</span></div> : favoritos.length === 0 ? <section className="favorites-empty"><span aria-hidden="true">♡</span><h2>Aún no guardas destinos</h2><p>Explora Chile y agrega a favoritos los lugares que quieras visitar.</p><IonButton onClick={() => navigate('/explorar')}>Explorar destinos</IonButton></section> : <section className="favorites-grid">{favoritos.map((item) => <article className="favorite-card" key={item.favorito_id}><button className="favorite-image-button" onClick={() => navigate(`/destinos/${item.id}`)} aria-label={`Ver ${item.nombre}`}><img src={item.imagen_url || '/images/destinos/sin-imagen.svg'} alt={item.nombre} loading="lazy" onError={(e) => { if (!e.currentTarget.src.endsWith('/sin-imagen.svg')) e.currentTarget.src = '/images/destinos/sin-imagen.svg'; }} /></button><div className="favorite-card-body"><span>{item.region_nombre} · {item.categoria_nombre}</span><h2>{item.nombre}</h2><p>{item.descripcion}</p><div><IonButton fill="clear" onClick={() => navigate(`/destinos/${item.id}`)}>Ver destino</IonButton><IonButton color="medium" fill="clear" onClick={() => void remove(item.favorito_id)}>Quitar</IonButton></div></div></article>)}</section>}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Favoritos;
