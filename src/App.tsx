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

/* Vistas */
import Explorar from './pages/Explorar';
import DestinoDetalle from './pages/DestinoDetalle';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './routes/ProtectedRoute';

setupIonicReact();

const App: React.FC = () => {
  const userIsAdmin = true; 

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {/* Rutas Públicas (v6 usa element={<Component />}) */}
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/destinos/:id" element={<DestinoDetalle />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Privadas */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute isAdmin={userIsAdmin}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Redirección Inicial */}
          <Route path="/" element={<Navigate to="/explorar" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;