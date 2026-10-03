import React, { useCallback, useEffect, useState } from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
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
      <IonHeader><IonToolbar className="senderia-navbar"><IonTitle>Mis destinos favoritos</IonTitle><IonButton slot="end" fill="clear" onClick={() => navigate('/explorar')}>Explorar</IonButton></IonToolbar></IonHeader>
      <IonContent>
        <main className="favorites-page">
          <h1>Mis favoritos</h1>
          <p>Tu lista se guarda en tu cuenta.</p>
          {error && <p role="alert" className="favorites-error">{error}</p>}
          {loading ? <div className="favorites-loading"><IonSpinner /><span>Cargando favoritos…</span></div> : favoritos.length === 0 ? <section className="favorites-empty"><span aria-hidden="true">♡</span><h2>Aún no guardas destinos</h2><p>Explora Chile y agrega a favoritos los lugares que quieras visitar.</p><IonButton onClick={() => navigate('/explorar')}>Explorar destinos</IonButton></section> : <section className="favorites-grid">{favoritos.map((item) => <article className="favorite-card" key={item.favorito_id}><button className="favorite-image-button" onClick={() => navigate(`/destinos/${item.id}`)} aria-label={`Ver ${item.nombre}`}><img src={item.imagen_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80'} alt={item.nombre} loading="lazy" /></button><div className="favorite-card-body"><span>{item.region_nombre} · {item.categoria_nombre}</span><h2>{item.nombre}</h2><p>{item.descripcion}</p><div><IonButton fill="clear" onClick={() => navigate(`/destinos/${item.id}`)}>Ver destino</IonButton><IonButton color="medium" fill="clear" onClick={() => void remove(item.favorito_id)}>Quitar</IonButton></div></div></article>)}</section>}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default Favoritos;
