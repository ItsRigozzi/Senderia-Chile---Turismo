import React, { useCallback, useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonSpinner, IonTitle, IonToolbar } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { categoriasService, destinosService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Categoria { id: number; nombre: string; }
interface Region { id: number; nombre: string; }
interface Destino {
  id: number; nombre: string; categoria_id: number; categoria_nombre: string;
  region_id: number; region_nombre: string; descripcion?: string; latitud: number;
  longitud: number; horario?: string; condiciones_acceso?: string; imagen_url?: string;
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
  const navigate = useNavigate();
  const { logout } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [destinosResponse, categoriasResponse, regionesResponse] = await Promise.all([
        destinosService.getAll(), categoriasService.getAll(), categoriasService.getRegiones(),
      ]);
      setDestinos(destinosResponse.data.destinos || []);
      setCategorias(categoriasResponse.data.categorias || []);
      setRegiones(regionesResponse.data.regiones || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo cargar la información desde PostgreSQL.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const resetForm = () => { setForm(initialForm); setEditingId(null); };
  const updateField = (field: keyof typeof initialForm, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const editDestino = (destino: Destino) => {
    setEditingId(destino.id);
    setForm({
      nombre: destino.nombre, descripcion: destino.descripcion || '',
      categoria_id: String(destino.categoria_id), region_id: String(destino.region_id),
      latitud: String(destino.latitud), longitud: String(destino.longitud),
      horario: destino.horario || '', condiciones_acceso: destino.condiciones_acceso || '',
      imagen_url: destino.imagen_url || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveDestino = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    const payload = {
      nombre: form.nombre.trim(), descripcion: form.descripcion.trim(),
      categoria_id: Number(form.categoria_id), region_id: Number(form.region_id),
      latitud: Number(form.latitud), longitud: Number(form.longitud),
      horario: form.horario.trim(), condiciones_acceso: form.condiciones_acceso.trim(),
      ...(form.imagen_url.trim() ? { imagen_url: form.imagen_url.trim() } : {}),
    };
    try {
      if (editingId) await destinosService.update(editingId, payload);
      else await destinosService.create(payload);
      setNotice(editingId ? 'Destino actualizado.' : 'Destino creado.');
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo guardar el destino. Verifica los campos y la conexión.');
    } finally { setSaving(false); }
  };

  const deleteDestino = async (destino: Destino) => {
    if (!window.confirm(`¿Eliminar “${destino.nombre}”?`)) return;
    setError(''); setNotice('');
    try {
      await destinosService.delete(destino.id);
      setNotice('Destino eliminado.');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo eliminar el destino.');
    }
  };

  return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Administración de Senderia</IonTitle></IonToolbar></IonHeader>
      <IonContent>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-brand"><span className="brand-badge">▲</span><div><strong>Senderia</strong><span style={{ display: 'block', fontSize: 11 }}>PANEL ADMIN</span></div></div>
            <button className="admin-nav-item" onClick={() => navigate('/explorar')}>Volver a la aplicación ↗</button>
            <button className="admin-nav-item" onClick={() => { logout(); navigate('/login'); }}>Cerrar sesión</button>
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
                <label>Latitud<input required type="number" step="any" min="-90" max="90" value={form.latitud} onChange={(e) => updateField('latitud', e.target.value)} /></label>
                <label>Longitud<input required type="number" step="any" min="-180" max="180" value={form.longitud} onChange={(e) => updateField('longitud', e.target.value)} /></label>
                <label>Horario<input maxLength={255} value={form.horario} onChange={(e) => updateField('horario', e.target.value)} /></label>
                <label>Imagen (URL)<input type="url" maxLength={500} value={form.imagen_url} onChange={(e) => updateField('imagen_url', e.target.value)} /></label>
                <label>Descripción<textarea value={form.descripcion} onChange={(e) => updateField('descripcion', e.target.value)} /></label>
                <label>Condiciones de acceso<textarea value={form.condiciones_acceso} onChange={(e) => updateField('condiciones_acceso', e.target.value)} /></label>
                <div><button type="submit" disabled={saving || loading}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear destino'}</button>{editingId && <button type="button" onClick={resetForm}>Cancelar</button>}</div>
              </form>
            </section>
            <section className="admin-table-card"><h2>Destinos ({destinos.length})</h2>{loading ? <IonSpinner /> : destinos.length === 0 ? <p>No hay destinos en la base de datos. Ejecuta el seed para cargar ejemplos.</p> : <div style={{ overflowX: 'auto' }}><table className="admin-table"><thead><tr><th>Nombre</th><th>Categoría</th><th>Región</th><th>Acciones</th></tr></thead><tbody>{destinos.map((destino) => <tr key={destino.id}><td>{destino.nombre}</td><td>{destino.categoria_nombre}</td><td>{destino.region_nombre}</td><td><button onClick={() => navigate(`/destinos/${destino.id}`)}>Ver</button> <button onClick={() => editDestino(destino)}>Editar</button> <button onClick={() => void deleteDestino(destino)}>Eliminar</button></td></tr>)}</tbody></table></div>}</section>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
