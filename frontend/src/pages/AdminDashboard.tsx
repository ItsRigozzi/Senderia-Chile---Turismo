import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonSpinner, IonToolbar } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { categoriasService, destinosService } from '../services/api';
import type { Categoria, DestinoFiltros, Region } from '../services/api';
import { useAuth } from '../context/useAuth';
import { getApiErrorBody } from '../services/apiError';
import BrandLink from '../components/BrandLink';
import FiltrosDestinos from '../components/FiltrosDestinos';
import type { FiltroDestino } from '../components/FiltrosDestinos';
import { coincideBusquedaDestino, normalizarTexto } from '../utils/busquedaDestinos';

interface Destino {
  id: number; nombre: string; categoria_id: number; categoria_nombre: string;
  region_id: number; region_nombre: string; descripcion?: string; latitud: number | null;
  longitud: number | null; horario?: string; condiciones_acceso?: string; imagen_url?: string;
}

const initialForm = {
  nombre: '', descripcion: '', categoria_id: '', region_id: '', latitud: '', longitud: '',
  horario: '', condiciones_acceso: '', imagen_url: '',
};

const AdminDashboard: React.FC = () => {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Búsqueda y filtros solo afectan a la tabla de destinos; el formulario usa las listas completas.
  const [filtros, setFiltros] = useState<DestinoFiltros>({ categoria: [], region: [] });
  const [busqueda, setBusqueda] = useState('');
  const [totalDestinos, setTotalDestinos] = useState(0);
  const [actualizandoTabla, setActualizandoTabla] = useState(true);
  const ultimaPeticion = useRef(0);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoriasResponse, regionesResponse] = await Promise.all([
        categoriasService.getAll(), categoriasService.getRegiones(),
      ]);
      setCategorias(categoriasResponse.data.categorias || []);
      setRegiones(regionesResponse.data.regiones || []);
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudo cargar la información desde PostgreSQL.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDestinos = useCallback(async () => {
    // Si los filtros cambian rápido, solo se aplica la respuesta de la última petición.
    const peticion = ++ultimaPeticion.current;
    const hayFiltros = filtros.categoria.length + filtros.region.length > 0;
    setActualizandoTabla(true);
    try {
      // Con filtros activos también se pide el listado completo para mostrar el total ("2 de 470").
      const [filtradosResponse, todosResponse] = await Promise.all([
        destinosService.getAll(filtros),
        hayFiltros ? destinosService.getAll() : null,
      ]);
      if (peticion !== ultimaPeticion.current) return;
      const filtrados: { destinos?: Destino[] } = filtradosResponse.data;
      const todos: { destinos?: Destino[] } = todosResponse ? todosResponse.data : filtrados;
      setDestinos(filtrados.destinos || []);
      setTotalDestinos((todos.destinos || []).length);
    } catch (err: unknown) {
      if (peticion !== ultimaPeticion.current) return;
      setError(getApiErrorBody(err)?.error || 'No se pudieron cargar los destinos desde PostgreSQL.');
    } finally {
      if (peticion === ultimaPeticion.current) setActualizandoTabla(false);
    }
  }, [filtros]);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => { void loadDestinos(); }, [loadDestinos]);

  const toggleFiltro = (filtro: FiltroDestino, slug: string) => {
    setFiltros((actual) => ({
      ...actual,
      [filtro]: actual[filtro].includes(slug)
        ? actual[filtro].filter((valor) => valor !== slug)
        : [...actual[filtro], slug],
    }));
  };

  const limpiarFiltros = () => setFiltros({ categoria: [], region: [] });
  const limpiarBusquedaYFiltros = () => { setBusqueda(''); limpiarFiltros(); };
  const filtrosActivos = filtros.categoria.length + filtros.region.length;
  const hayBusquedaOFiltros = filtrosActivos > 0 || normalizarTexto(busqueda) !== '';
  const destinosVisibles = destinos.filter((destino) => coincideBusquedaDestino(destino, busqueda));
  const cargandoTabla = actualizandoTabla && totalDestinos === 0;

  const resetForm = () => { setForm(initialForm); setEditingId(null); };
  const updateField = (field: keyof typeof initialForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const editDestino = (destino: Destino) => {
    setEditingId(destino.id);
    setForm({
      nombre: destino.nombre, descripcion: destino.descripcion || '',
      categoria_id: String(destino.categoria_id), region_id: String(destino.region_id),
      latitud: destino.latitud == null ? '' : String(destino.latitud),
      longitud: destino.longitud == null ? '' : String(destino.longitud),
      horario: destino.horario || '', condiciones_acceso: destino.condiciones_acceso || '',
      imagen_url: destino.imagen_url || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveDestino = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const hasLatitude = form.latitud.trim() !== '';
    const hasLongitude = form.longitud.trim() !== '';
    if (hasLatitude !== hasLongitude) {
      setError('Ingresa latitud y longitud juntas, o deja ambas vacías para ubicar por nombre y región.');
      setSaving(false);
      return;
    }
    const payload = {
      nombre: form.nombre.trim(), descripcion: form.descripcion.trim(),
      categoria_id: Number(form.categoria_id), region_id: Number(form.region_id),
      latitud: hasLatitude ? Number(form.latitud) : null,
      longitud: hasLongitude ? Number(form.longitud) : null,
      horario: form.horario.trim(), condiciones_acceso: form.condiciones_acceso.trim(),
      ...(form.imagen_url.trim() ? { imagen_url: form.imagen_url.trim() } : {}),
    };
    try {
      const response = editingId
        ? await destinosService.update(editingId, payload)
        : await destinosService.create(payload);
      const savedDestination = response.data?.destino;
      const locationNotice = !hasLatitude && savedDestination
        ? ` Coordenadas asignadas automáticamente: ${Number(savedDestination.latitud).toFixed(5)}, ${Number(savedDestination.longitud).toFixed(5)}. Revisa el marcador antes de entregar.`
        : '';
      setNotice(`${editingId ? 'Destino actualizado.' : 'Destino creado.'}${locationNotice}`);
      resetForm();
      await loadDestinos();
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudo guardar el destino. Verifica los campos y la conexión.');
    } finally { setSaving(false); }
  };

  const deleteDestino = async (destino: Destino) => {
    if (!window.confirm(`¿Quitar “${destino.nombre}” de la aplicación? Sus datos se conservarán en la base de datos.`)) return;
    setError(''); setNotice('');
    try {
      await destinosService.delete(destino.id);
      setNotice('Destino quitado de la aplicación. Sus datos se conservaron en la base de datos.');
      await loadDestinos();
    } catch (err: unknown) {
      setError(getApiErrorBody(err)?.error || 'No se pudo quitar el destino de la aplicación.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 24px' }}>
            <BrandLink subtitle="Panel de admin" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <button className="admin-nav-item" onClick={() => navigate('/explorar')}>Volver a la aplicación ↗</button>
            <button className="admin-nav-item" onClick={() => { logout(); window.location.replace('/login'); }}>Cerrar sesión</button>
            <div className="admin-sidebar-filtros">
              <FiltrosDestinos
                variante="oscuro"
                regiones={regiones}
                categorias={categorias}
                seleccion={filtros}
                activos={filtrosActivos}
                onToggle={toggleFiltro}
                onLimpiar={limpiarFiltros}
              />
            </div>
          </aside>
          <main className="admin-main">
            <div className="admin-header-row"><div><h1>Destinos turísticos</h1><p>Los cambios se guardan en PostgreSQL.</p></div><button onClick={() => { resetForm(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Nuevo destino</button></div>
            {error && <p role="alert" style={{ color: '#B91C1C' }}>{error}</p>}
            {notice && <p role="status" style={{ color: '#15803D' }}>{notice}</p>}
            <section className="admin-table-card" style={{ padding: 20, marginBottom: 24 }}>
              <h2>{editingId ? 'Editar destino' : 'Crear destino'}</h2>
              <form onSubmit={saveDestino} className="admin-form-grid">
                <label>Nombre<input required minLength={2} maxLength={255} value={form.nombre} onChange={(e) => updateField('nombre', e.target.value)} /></label>
                <label>Categoría<select required value={form.categoria_id} onChange={(e) => updateField('categoria_id', e.target.value)}><option value="">Selecciona una categoría</option>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
                <label>Región<select required value={form.region_id} onChange={(e) => updateField('region_id', e.target.value)}><option value="">Selecciona una región</option>{regiones.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</select></label>
                <label>Latitud (opcional)<input type="number" step="any" min="-90" max="90" placeholder="Ej. -33.42613" value={form.latitud} onChange={(e) => updateField('latitud', e.target.value)} /></label>
                <label>Longitud (opcional)<input type="number" step="any" min="-180" max="180" placeholder="Ej. -70.43477" value={form.longitud} onChange={(e) => updateField('longitud', e.target.value)} /></label>
                <label>Horario<input maxLength={255} value={form.horario} onChange={(e) => updateField('horario', e.target.value)} /></label>
                <label>Imagen (URL)<input type="url" maxLength={500} value={form.imagen_url} onChange={(e) => updateField('imagen_url', e.target.value)} /></label>
                <label>Descripción<textarea value={form.descripcion} onChange={(e) => updateField('descripcion', e.target.value)} /></label>
                <label>Condiciones de acceso<textarea value={form.condiciones_acceso} onChange={(e) => updateField('condiciones_acceso', e.target.value)} /></label>
                <p className="admin-form-help">Completa ambas coordenadas si las conoces. Si las dejas vacías, Sendería las buscará con Geoapify usando el nombre y la región seleccionada; para eso se requiere GEOAPIFY_API_KEY en backend/.env. Si la búsqueda no encuentra el lugar, podrás ingresar las coordenadas manualmente.</p>
                <div><button type="submit" disabled={saving || loading}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear destino'}</button>{editingId && <button type="button" onClick={resetForm}>Cancelar</button>}</div>
              </form>
            </section>
            <section className="admin-table-card">
              <h2>Destinos activos ({hayBusquedaOFiltros ? `${destinosVisibles.length} de ${totalDestinos}` : totalDestinos})</h2>
              <div className="admin-busqueda">
                <input
                  type="search"
                  aria-label="Buscar destinos"
                  placeholder="Buscar por nombre de destino o nombre exacto de región…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {actualizandoTabla && !cargandoTabla && <span role="status">Actualizando…</span>}
              </div>
              {cargandoTabla ? <IonSpinner /> : totalDestinos === 0 ? <p>No hay destinos activos en la aplicación.</p> : destinosVisibles.length === 0 ? (
                <div className="admin-sin-resultados">
                  <p>No hay destinos que coincidan con la búsqueda y los filtros.</p>
                  <button type="button" className="filtros-destinos-limpiar" onClick={limpiarBusquedaYFiltros}>Limpiar búsqueda y filtros</button>
                </div>
              ) : <div style={{ overflowX: 'auto' }}><table className="admin-table"><thead><tr><th>Nombre</th><th>Categoría</th><th>Región</th><th>Acciones</th></tr></thead><tbody>{destinosVisibles.map((destino) => <tr key={destino.id}><td>{destino.nombre}</td><td>{destino.categoria_nombre}</td><td>{destino.region_nombre}</td><td><button onClick={() => navigate(`/destinos/${destino.id}`)}>Ver</button> <button onClick={() => editDestino(destino)}>Editar</button> <button onClick={() => void deleteDestino(destino)}>Eliminar</button></td></tr>)}</tbody></table></div>}
            </section>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
