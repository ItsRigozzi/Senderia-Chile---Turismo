import React, { useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { opinionesService, type OpinionDestino, type OpinionResumen } from '../services/api';
import { getApiErrorBody } from '../services/apiError';
import { useAuth } from '../context/useAuth';

interface OpinionesDestinoProps {
  destinoId: number;
}

interface MiOpinion {
  puntuacion: number;
  comentario: string | null;
}

const resumenVacio: OpinionResumen = {
  calificacion_promedio: null,
  total_opiniones: 0,
  opiniones: [],
};

const fechaLegible = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const OpinionesDestino: React.FC<OpinionesDestinoProps> = ({ destinoId }) => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [resumen, setResumen] = useState<OpinionResumen>(resumenVacio);
  const [miOpinion, setMiOpinion] = useState<MiOpinion | null>(null);
  const [puntuacion, setPuntuacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    opinionesService.getAll(destinoId)
      .then((response) => {
        if (active) setResumen(response.data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(getApiErrorBody(err)?.error || 'No se pudieron cargar las calificaciones.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [destinoId, reloadKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setMiOpinion(null);
      setPuntuacion(0);
      setComentario('');
      return;
    }

    let active = true;
    opinionesService.getMine(destinoId)
      .then((response) => {
        if (!active) return;
        const opinion = response.data.opinion;
        setMiOpinion(opinion ? {
          puntuacion: opinion.puntuacion,
          comentario: opinion.comentario,
        } : null);
        setPuntuacion(opinion?.puntuacion ?? 0);
        setComentario(opinion?.comentario ?? '');
      })
      .catch((err: unknown) => {
        if (active) setError(getApiErrorBody(err)?.error || 'No se pudo cargar tu calificación.');
      });

    return () => { active = false; };
  }, [destinoId, authLoading, isAuthenticated, reloadKey]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!puntuacion) {
      setError('Selecciona una puntuación de 1 a 5 estrellas.');
      return;
    }

    setSaving(true);
    setError('');
    setMensaje('');
    try {
      await opinionesService.save(destinoId, {
        puntuacion,
        comentario: comentario.trim() || null,
      });
      setMensaje(miOpinion ? 'Tu calificación se actualizó.' : 'Tu calificación se guardó.');
      setReloadKey((current) => current + 1);
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudo guardar tu calificación.');
    } finally {
      setSaving(false);
    }
  };

  const iniciarSesion = () => navigate('/login', {
    state: { from: { pathname: '/destinos/' + destinoId } },
  });

  return (
    <section className="opiniones-section" aria-labelledby="opiniones-titulo">
      <div className="opiniones-heading">
        <div>
          <h2 id="opiniones-titulo">Calificaciones y reseñas</h2>
          <p>Conoce la experiencia de otras personas que visitaron este destino.</p>
        </div>
        <span className="opiniones-total">
          {resumen.total_opiniones} {resumen.total_opiniones === 1 ? 'opinión' : 'opiniones'}
        </span>
      </div>

      <div className="opiniones-grid">
        {authLoading ? (
          <div className="opinion-form-card opinion-login-card" role="status">
            <IonSpinner name="crescent" />
            <span>Comprobando sesión…</span>
          </div>
        ) : isAuthenticated ? (
          <form className="opinion-form-card" onSubmit={handleSubmit}>
            <h3>{miOpinion ? 'Actualiza tu opinión' : 'Comparte tu opinión'}</h3>
            <p>Puedes calificar sin escribir una reseña.</p>

            <fieldset className="opinion-rating-field">
              <legend>Tu puntuación</legend>
              <div className="opinion-star-picker" role="group" aria-label="Selecciona de 1 a 5 estrellas">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value <= puntuacion ? 'opinion-star-button is-selected' : 'opinion-star-button'}
                    aria-label={value + (value === 1 ? ' estrella' : ' estrellas')}
                    aria-pressed={puntuacion === value}
                    onClick={() => setPuntuacion(value)}
                  >
                    {value <= puntuacion ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="opinion-comment-label" htmlFor="opinion-comentario">
              Reseña <span>(opcional)</span>
            </label>
            <textarea
              id="opinion-comentario"
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="¿Qué te pareció este lugar?"
            />
            <span className="opinion-character-count">{comentario.length}/1000</span>

            {error && <p className="opinion-error" role="alert">{error}</p>}
            {mensaje && <p className="opinion-success" role="status">{mensaje}</p>}

            <button className="opinion-submit-button" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : miOpinion ? 'Actualizar calificación' : 'Publicar calificación'}
            </button>
          </form>
        ) : (
          <div className="opinion-form-card opinion-login-card">
            <h3>¿Visitaste este destino?</h3>
            <p>Inicia sesión para calificarlo y, si quieres, compartir una reseña.</p>
            <button className="opinion-submit-button" type="button" onClick={iniciarSesion}>
              Iniciar sesión para calificar
            </button>
          </div>
        )}

        <div className="opiniones-list-card" aria-live="polite">
          <h3>Opiniones de visitantes</h3>
          {loading ? (
            <div className="opiniones-loading"><IonSpinner name="crescent" /><span>Cargando opiniones…</span></div>
          ) : error && resumen.opiniones.length === 0 ? (
            <p className="opinion-error">{error}</p>
          ) : resumen.opiniones.length === 0 ? (
            <p className="opiniones-empty">Todavía no hay calificaciones. Puedes ser la primera persona en opinar.</p>
          ) : (
            <div className="opiniones-list">
              {resumen.opiniones.map((opinion: OpinionDestino) => (
                <article className="opinion-item" key={opinion.id}>
                  <div className="opinion-item-heading">
                    <strong>{opinion.autor}</strong>
                    <span className="opinion-item-rating" aria-label={opinion.puntuacion + ' de 5 estrellas'}>
                      <span aria-hidden="true">{'★'.repeat(opinion.puntuacion)}{'☆'.repeat(5 - opinion.puntuacion)}</span>
                      <b>{opinion.puntuacion}/5</b>
                    </span>
                  </div>
                  <time dateTime={opinion.updated_at}>{fechaLegible(opinion.updated_at)}</time>
                  {opinion.comentario && <p>{opinion.comentario}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OpinionesDestino;
