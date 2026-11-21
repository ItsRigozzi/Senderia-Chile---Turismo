import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonSpinner, IonToolbar } from '@ionic/react';
import { usuariosService } from '../services/api';
import type { UsuarioAdmin } from '../services/api';
import { getApiErrorMessage } from '../services/apiError';
import { useAuth } from '../context/useAuth';
import BrandLink from '../components/BrandLink';
import AdminNav from '../components/AdminNav';
import { normalizarTexto } from '../utils/busquedaDestinos';

const formatearFecha = (fecha: string): string => {
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? '—' : valor.toLocaleDateString('es-CL');
};

const AdminUsuarios: React.FC = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const response = await usuariosService.getAll();
      setUsuarios(response.data.usuarios || []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar los usuarios.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargarUsuarios(); }, [cargarUsuarios]);

  const totalAdmins = usuarios.filter((u) => u.rol === 'admin').length;
  const usuariosVisibles = useMemo(() => {
    const texto = normalizarTexto(busqueda);
    if (!texto) return usuarios;
    return usuarios.filter((u) => normalizarTexto(`${u.nombre} ${u.email}`).includes(texto));
  }, [usuarios, busqueda]);

  const reemplazarUsuario = (actualizado: UsuarioAdmin) =>
    setUsuarios((actuales) => actuales.map((u) => (u.id === actualizado.id ? { ...u, ...actualizado } : u)));

  const cambiarRol = async (usuario: UsuarioAdmin, rol: 'turista' | 'admin') => {
    if (rol === usuario.rol) return;
    const pregunta = rol === 'admin'
      ? `¿Dar permisos de administrador a ${usuario.nombre}?`
      : `¿Quitar los permisos de administrador a ${usuario.nombre}?`;
    if (!window.confirm(pregunta)) return;
    setProcesandoId(usuario.id);
    setError('');
    setAviso('');
    try {
      const response = await usuariosService.update(usuario.id, { rol });
      reemplazarUsuario(response.data.usuario);
      setAviso(`${usuario.nombre} ahora es ${rol === 'admin' ? 'administrador' : 'turista'}.`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo cambiar el rol.'));
    } finally {
      setProcesandoId(null);
    }
  };

  const guardarNombre = async (usuario: UsuarioAdmin) => {
    const nombre = nombreEditado.trim();
    if (nombre.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    setProcesandoId(usuario.id);
    setError('');
    setAviso('');
    try {
      const response = await usuariosService.update(usuario.id, { nombre });
      reemplazarUsuario(response.data.usuario);
      setEditandoId(null);
      setAviso('Nombre actualizado.');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar el nombre.'));
    } finally {
      setProcesandoId(null);
    }
  };

  const eliminarUsuario = async (usuario: UsuarioAdmin) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${usuario.nombre} (${usuario.email})? También se borrarán sus favoritos y opiniones. Esta acción no se puede deshacer.`)) return;
    setProcesandoId(usuario.id);
    setError('');
    setAviso('');
    try {
      await usuariosService.delete(usuario.id);
      setUsuarios((actuales) => actuales.filter((u) => u.id !== usuario.id));
      setAviso(`Cuenta de ${usuario.nombre} eliminada.`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo eliminar el usuario.'));
    } finally {
      setProcesandoId(null);
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
                <h1>Usuarios</h1>
                <p>Cuentas registradas y sus roles. Siempre debe quedar al menos un administrador.</p>
              </div>
              <button type="button" onClick={() => void cargarUsuarios()} disabled={cargando}>
                {cargando ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
            {error && <p role="alert" style={{ color: '#B91C1C' }}>{error}</p>}
            {aviso && <p role="status" style={{ color: '#15803D' }}>{aviso}</p>}

            <section className="admin-table-card">
              <h2>Cuentas ({busqueda ? `${usuariosVisibles.length} de ${usuarios.length}` : usuarios.length}) · {totalAdmins} {totalAdmins === 1 ? 'administrador' : 'administradores'}</h2>
              <div className="admin-busqueda">
                <input
                  type="search"
                  aria-label="Buscar usuarios"
                  placeholder="Buscar por nombre o correo…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              {cargando && usuarios.length === 0 ? <IonSpinner /> : usuariosVisibles.length === 0 ? (
                <p>{usuarios.length === 0 ? 'No hay usuarios registrados.' : 'No hay usuarios que coincidan con la búsqueda.'}</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr></thead>
                    <tbody>
                      {usuariosVisibles.map((usuario) => {
                        const esPropia = usuario.id === user?.id;
                        const esUltimoAdmin = usuario.rol === 'admin' && totalAdmins <= 1;
                        const bloquearRol = esPropia || esUltimoAdmin;
                        const procesando = procesandoId === usuario.id;
                        return (
                          <tr key={usuario.id}>
                            <td>
                              {editandoId === usuario.id ? (
                                <form onSubmit={(e) => { e.preventDefault(); void guardarNombre(usuario); }} style={{ display: 'flex', gap: 6 }}>
                                  <input aria-label="Nuevo nombre" required minLength={2} maxLength={150} value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} />
                                  <button type="submit" disabled={procesando}>Guardar</button>
                                  <button type="button" onClick={() => setEditandoId(null)}>Cancelar</button>
                                </form>
                              ) : (
                                <>{usuario.nombre}{esPropia && <small> (tú)</small>}</>
                              )}
                            </td>
                            <td>{usuario.email}</td>
                            <td>
                              <select
                                aria-label={`Rol de ${usuario.nombre}`}
                                value={usuario.rol}
                                disabled={bloquearRol || procesando}
                                title={esPropia ? 'No puedes cambiar tu propio rol' : esUltimoAdmin ? 'Debe quedar al menos un administrador' : undefined}
                                onChange={(e) => void cambiarRol(usuario, e.target.value as 'turista' | 'admin')}
                              >
                                <option value="turista">Turista</option>
                                <option value="admin">Administrador</option>
                              </select>
                            </td>
                            <td>{formatearFecha(usuario.created_at)}</td>
                            <td>
                              {editandoId !== usuario.id && (
                                <button type="button" disabled={procesando} onClick={() => { setEditandoId(usuario.id); setNombreEditado(usuario.nombre); }}>
                                  Editar nombre
                                </button>
                              )}{' '}
                              <button
                                type="button"
                                disabled={esPropia || esUltimoAdmin || procesando}
                                title={esPropia ? 'No puedes eliminar tu propia cuenta' : esUltimoAdmin ? 'Debe quedar al menos un administrador' : undefined}
                                onClick={() => void eliminarUsuario(usuario)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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

export default AdminUsuarios;
