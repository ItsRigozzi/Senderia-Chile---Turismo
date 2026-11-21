import { Route, Navigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables & Wireframe Styles */
import './theme/variables.css';

/* Vistas */
import Explorar from './pages/Explorar';
import DestinoDetalle from './pages/DestinoDetalle';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminSugerenciasImagenes from './pages/AdminSugerenciasImagenes';
import AdminCategorias from './pages/AdminCategorias';
import AdminUsuarios from './pages/AdminUsuarios';
import ProtectedRoute from './routes/ProtectedRoute';
import SessionExpiredRedirect from './components/SessionExpiredRedirect';

import Registro from './pages/Registro';
import VerificarCorreo from './pages/VerificarCorreo';
import RecuperarContrasena from './pages/RecuperarContrasena';
import Favoritos from './pages/Favoritos';
import { AuthProvider } from './context/AuthContext';

setupIonicReact();

const App: React.FC = () => {
  return (
    <AuthProvider>
      <IonApp>
        <IonReactRouter>
          <SessionExpiredRedirect />
          <IonRouterOutlet>
            {/* Rutas Públicas */}
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/destinos/:id" element={<DestinoDetalle />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/verificar-correo" element={<VerificarCorreo />} />
            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
            <Route path="/favoritos" element={<ProtectedRoute><Favoritos /></ProtectedRoute>} />
            
            {/* Rutas Privadas */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/categorias"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCategorias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsuarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sugerencias-imagenes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSugerenciasImagenes />
                </ProtectedRoute>
              }
            />

            {/* Redirección Inicial */}
            <Route path="/" element={<Navigate to="/explorar" replace />} />
          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </AuthProvider>
  );
};

export default App;
