import React, { useEffect, useState } from 'react';
import { getApiErrorBody } from '../services/apiError';
import { sugerenciasImagenesService } from '../services/api';
import type { SugerenciaImagenAdmin } from '../services/api';

interface Props {
  sugerencia: SugerenciaImagenAdmin;
  procesando: boolean;
  onRevisar: (id: number, decision: 'aprobada' | 'rechazada') => void;
}

const AdminSugerenciaImagenCard: React.FC<Props> = ({ sugerencia, procesando, onRevisar }) => {
  const [mostrarImagen, setMostrarImagen] = useState(false);
  const [urlImagen, setUrlImagen] = useState('');
  const [cargandoImagen, setCargandoImagen] = useState(false);
  const [errorImagen, setErrorImagen] = useState('');

  useEffect(() => {
    if (!mostrarImagen) return undefined;

    let activa = true;
    let objectUrl = '';
    setCargandoImagen(true);
    setErrorImagen('');
    sugerenciasImagenesService.getAdminImage(sugerencia.id)
      .then((response) => {
        objectUrl = URL.createObjectURL(response.data);
        if (activa) setUrlImagen(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((err: unknown) => {
        if (activa) setErrorImagen(getApiErrorBody(err)?.error || 'No se pudo cargar la imagen.');
      })
      .finally(() => {
        if (activa) setCargandoImagen(false);
      });

    return () => {
      activa = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mostrarImagen, sugerencia.id]);

  const fecha = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(sugerencia.created_at));
  const imageRegionId = `imagen-sugerida-${sugerencia.id}`;

  const toggleImagen = () => {
    if (mostrarImagen) setUrlImagen('');
    setMostrarImagen((visible) => !visible);
  };

  return (
    <article className="admin-image-suggestion-card">
      <div className="admin-image-suggestion-content">
        <h3>{sugerencia.destino_nombre}</h3>
        <dl className="admin-image-suggestion-meta">
          <div><dt>Región</dt><dd>{sugerencia.region_nombre}</dd></div>
          <div><dt>Tipo de lugar</dt><dd>{sugerencia.categoria_nombre}</dd></div>
          <div><dt>Fecha y hora</dt><dd>{fecha}</dd></div>
          <div><dt>Enviada por</dt><dd>{sugerencia.autor_nombre}</dd></div>
        </dl>
        {sugerencia.comentario && <p><strong>Comentario:</strong> {sugerencia.comentario}</p>}
        <p className="admin-image-suggestion-consent">
          El usuario confirmó que tiene permiso para compartirla y aceptó la atribución pública si se aprueba.
        </p>

        <button
          type="button"
          className="admin-image-suggestion-toggle"
          aria-expanded={mostrarImagen}
          aria-controls={imageRegionId}
          onClick={toggleImagen}
        >
          {mostrarImagen ? 'Ocultar imagen' : 'Ver imagen sugerida'}
        </button>
        {mostrarImagen && (
          <div id={imageRegionId} className="admin-image-suggestion-image-region">
            {urlImagen ? (
              <img src={urlImagen} alt={`Imagen sugerida para ${sugerencia.destino_nombre}`} />
            ) : (
              <div className="admin-image-suggestion-preview" role="status">
                {errorImagen || (cargandoImagen ? 'Cargando imagen…' : 'No se pudo mostrar la imagen.')}
              </div>
            )}
          </div>
        )}

        <div className="admin-image-suggestion-actions">
          <button type="button" disabled={procesando} onClick={() => onRevisar(sugerencia.id, 'aprobada')}>
            Aprobar y publicar
          </button>
          <button type="button" disabled={procesando} onClick={() => onRevisar(sugerencia.id, 'rechazada')}>
            Rechazar
          </button>
        </div>
      </div>
    </article>
  );
};

export default AdminSugerenciaImagenCard;
