import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const SECCIONES = [
  { ruta: '/admin/dashboard', texto: 'Destinos' },
  { ruta: '/admin/categorias', texto: 'Categorías' },
  { ruta: '/admin/usuarios', texto: 'Usuarios' },
  { ruta: '/admin/sugerencias-imagenes', texto: 'Imágenes sugeridas' },
];

/** Navegación común del panel de administración. */
const AdminNav: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="admin-sidebar" aria-label="Navegación de administración">
      {SECCIONES.map(({ ruta, texto }) => {
        const activa = pathname === ruta;
        return (
          <button
            key={ruta}
            type="button"
            className={`admin-nav-item${activa ? ' active' : ''}`}
            aria-current={activa ? 'page' : undefined}
            onClick={() => { if (!activa) navigate(ruta); }}
          >
            {texto}
          </button>
        );
      })}
      {children}
      <button type="button" className="admin-nav-item" onClick={() => navigate('/explorar')}>
        Volver a la aplicación ↗
      </button>
      <button type="button" className="admin-nav-item" onClick={cerrarSesion}>
        Cerrar sesión
      </button>
    </aside>
  );
};

export default AdminNav;
