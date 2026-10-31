import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getApiErrorBody } from '../services/apiError';
import { sugerenciasImagenesService } from '../services/api';

interface Props {
  destinoId: number;
}

const SugerenciasImagenesDestino: React.FC<Props> = ({ destinoId }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [comentario, setComentario] = useState('');
  const [declaraDerechos, setDeclaraDerechos] = useState(false);
  const [aceptaAtribucion, setAceptaAtribucion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setAviso('');
    if (!archivo) {
      setError('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setError('La imagen supera el máximo permitido de 5 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      setError('El formato debe ser JPG, PNG o WebP.');
      return;
    }
    if (!declaraDerechos || !aceptaAtribucion) {
      setError('Confirma ambos permisos para poder enviar la imagen.');
      return;
    }

    const formData = new FormData();
    formData.append('imagen', archivo);
    formData.append('declara_derechos', 'true');
    formData.append('acepta_atribucion', 'true');
    formData.append('comentario', comentario.trim());

    setEnviando(true);
    try {
      const response = await sugerenciasImagenesService.submit(destinoId, formData);
      setAviso(response.data?.mensaje || 'Imagen enviada para revisión del administrador.');
      setArchivo(null);
      setComentario('');
      setDeclaraDerechos(false);
      setAceptaAtribucion(false);
      setFormularioAbierto(false);
      const input = document.getElementById(`sugerencia-imagen-${destinoId}`) as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudo enviar la imagen.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="community-images-section" aria-labelledby={`community-images-title-${destinoId}`}>
      <h2 id={`community-images-title-${destinoId}`} className="community-images-title">Aporta una imagen de este lugar</h2>
      {error && <p className="community-images-error" role="alert">{error}</p>}
      {aviso && <p className="community-images-success" role="status">{aviso}</p>}

      <div className="community-images-form-card">
        <div className="community-images-form-heading">
          <h3>¿Tienes una imagen de este lugar?</h3>
          <button
            type="button"
            className="community-images-toggle"
            aria-expanded={formularioAbierto}
            aria-controls={`community-images-form-${destinoId}`}
            onClick={() => setFormularioAbierto((abierto) => !abierto)}
          >
            {formularioAbierto ? 'Ocultar formulario' : 'Sugerir una imagen'}
          </button>
        </div>
        <div id={`community-images-form-${destinoId}`} hidden={!formularioAbierto}>
          <p className="community-images-form-description">Envíala para que el administrador la revise. Si se aprueba, aparecerá en la galería principal junto a la imagen del destino.</p>
          {authLoading ? <p>Verificando tu sesión…</p> : isAuthenticated ? (
            <form onSubmit={(event) => void submit(event)} className="community-images-form">
              <label>
                Imagen (JPG, PNG o WebP; máximo 5 MB)
                <input
                  id={`sugerencia-imagen-${destinoId}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  onChange={(event) => setArchivo(event.target.files?.[0] || null)}
                />
              </label>
              <label>
                Comentario opcional
                <input
                  type="text"
                  maxLength={500}
                  value={comentario}
                  onChange={(event) => setComentario(event.target.value)}
                  placeholder="Por ejemplo, desde qué sector fue tomada"
                />
              </label>
              <label className="community-images-checkbox">
                <input type="checkbox" checked={declaraDerechos} onChange={(event) => setDeclaraDerechos(event.target.checked)} />
                <span>Confirmo que tomé esta imagen o que tengo permiso para compartirla.</span>
              </label>
              <label className="community-images-checkbox">
                <input type="checkbox" checked={aceptaAtribucion} onChange={(event) => setAceptaAtribucion(event.target.checked)} />
                <span>Acepto que, si se aprueba, se publique mostrando mi nombre como aportante.</span>
              </label>
              <button type="submit" disabled={enviando || !archivo || !declaraDerechos || !aceptaAtribucion}>
                {enviando ? 'Enviando…' : 'Enviar imagen para revisión'}
              </button>
            </form>
          ) : (
            <button type="button" className="community-images-login" onClick={() => navigate('/login', { state: { from: { pathname: `/destinos/${destinoId}` } } })}>
              Inicia sesión para sugerir una imagen
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SugerenciasImagenesDestino;
