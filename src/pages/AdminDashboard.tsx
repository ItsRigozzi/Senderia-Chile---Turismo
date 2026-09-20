import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonButtons } from '@ionic/react';
import { mockDestinos, Destino } from '../services/mockDestinos';

const AdminDashboard: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Panel Admin Senderia</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/explorar">Salir</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton expand="block" color="primary" className="ion-margin-bottom">+ Nuevo Destino</IonButton>
        <IonList>
          {mockDestinos.map((destino: Destino) => (
            <IonItem key={destino.id}>
              <IonLabel>
                <h2>{destino.nombre}</h2>
                <p>ID: {destino.id} • {destino.categoria}</p>
              </IonLabel>
              <IonButton fill="outline" slot="end">Editar</IonButton>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;