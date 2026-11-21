import React, { useCallback, useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonSpinner, IonToolbar } from '@ionic/react';
import { categoriasService } from '../services/api';
import type { Categoria } from '../services/api';
import { getApiErrorBody, getApiErrorMessage } from '../services/apiError';
import BrandLink from '../components/BrandLink';
import AdminNav from '../components/AdminNav';

const formularioInicial = { nombre: '', slug: '', descripcion: '' };

/** Convierte un nombre en slug: minúsculas, sin tildes y con guiones. */
const crearSlug = (texto: string): string => texto
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 100);

const AdminCategorias: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState(formularioInicial);
  const [slugEditado, setSlugEditado] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargarCategorias = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const response = await categoriasService.getAll();
      setCategorias(response.data.categorias || []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar las categorías.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargarCategorias(); }, [cargarCategorias]);

  const reiniciarFormulario = () => {
    setForm(formularioInicial);
    setSlugEditado(false);
    setEditandoId(null);
  };

  const cambiarNombre = (nombre: string) => {
    setForm((actual) => ({ ...actual, nombre, slug: slugEditado ? actual.slug : crearSlug(nombre) }));
  };

  const editarCategoria = (categoria: Categoria) => {
    setEditandoId(categoria.id);
    setSlugEditado(true);
    setForm({ nombre: categoria.nombre, slug: categoria.slug, descripcion: categoria.descripcion || '' });
    setAviso('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarCategoria = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setAviso('');
    const datos = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim(),
      descripcion: form.descripcion.trim(),
    };
    if (!/^[a-z0-9-]+$/.test(datos.slug)) {
      setError('El identificador (slug) solo puede tener letras minúsculas, números y guiones.');
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await categoriasService.update(editandoId, datos);
        setAviso(`Categoría “${datos.nombre}” actualizada.`);
      } else {
        await categoriasService.create(datos);
        setAviso(`Categoría “${datos.nombre}” creada.`);
      }
      reiniciarFormulario();
      await cargarCategorias();
    } catch (err: unknown) {
      const detalles = getApiErrorBody(err)?.detalles;
      setError(detalles
        ? Object.values(detalles).flat().join('. ')
        : getApiErrorMessage(err, 'No se pudo guardar la categoría.'));
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCategoria = async (categoria: Categoria) => {
    if (!window.confirm(`¿Eliminar la categoría “${categoria.nombre}”? Solo se puede eliminar si no tiene destinos activos.`)) return;
    setError('');
    setAviso('');
    try {
      await categoriasService.delete(categoria.id);
      setAviso(`Categoría “${categoria.nombre}” eliminada.`);
      if (editandoId === categoria.id) reiniciarFormulario();
      await cargarCategorias();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo eliminar la categoría.'));
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="admin-page-brand"><BrandLink subtitle="Panel de admin" /></div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="admin-layout">
          <AdminNav />
          <main className="admin-main">
            <div className="admin-header-row">
              <div>
                <h1>Categorías</h1>
                <p>Tipos de destino que se usan para clasificar y filtrar el catálogo.</p>
              </div>
              <button type="button" onClick={() => { reiniciarFormulario(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Nueva categoría
              </button>
            </div>
            {error && <p role="alert" style={{ color: '#B91C1C' }}>{error}</p>}
            {aviso && <p role="status" style={{ color: '#15803D' }}>{aviso}</p>}

            <section className="admin-table-card" style={{ padding: 20, marginBottom: 24 }}>
              <h2>{editandoId ? 'Editar categoría' : 'Crear categoría'}</h2>
              <form onSubmit={(event) => { void guardarCategoria(event); }} className="admin-form-grid">
                <label>
                  Nombre
                  <input required minLength={2} maxLength={100} value={form.nombre} onChange={(e) => cambiarNombre(e.target.value)} />
                </label>
                <label>
                  Identificador (slug)
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    pattern="[a-z0-9\-]+"
                    title="Solo letras minúsculas, números y guiones"
                    value={form.slug}
                    onChange={(e) => { setSlugEditado(true); setForm((actual) => ({ ...actual, slug: e.target.value })); }}
                  />
                </label>
                <label>
                  Descripción
                  <textarea maxLength={500} value={form.descripcion} onChange={(e) => setForm((actual) => ({ ...actual, descripcion: e.target.value }))} />
                </label>
                <p className="admin-form-help">El identificador se genera a partir del nombre y se usa en los filtros (por ejemplo, <code>parque-nacional</code>).</p>
                <div>
                  <button type="submit" disabled={guardando}>
                    {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Crear categoría'}
                  </button>
                  {editandoId && <button type="button" onClick={reiniciarFormulario}>Cancelar</button>}
                </div>
              </form>
            </section>

            <section className="admin-table-card">
              <h2>Categorías registradas ({categorias.length})</h2>
              {cargando ? <IonSpinner /> : categorias.length === 0 ? <p>No hay categorías registradas.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead><tr><th>Nombre</th><th>Identificador</th><th>Descripción</th><th>Acciones</th></tr></thead>
                    <tbody>
                      {categorias.map((categoria) => (
                        <tr key={categoria.id}>
                          <td>{categoria.nombre}</td>
                          <td><code>{categoria.slug}</code></td>
                          <td>{categoria.descripcion || '—'}</td>
                          <td>
                            <button type="button" onClick={() => editarCategoria(categoria)}>Editar</button>{' '}
                            <button type="button" onClick={() => void eliminarCategoria(categoria)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminCategorias;
