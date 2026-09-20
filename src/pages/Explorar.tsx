import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton } from '@ionic/react';
import { mockDestinos, Destino } from '../services/mockDestinos';

const Explorar: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Senderia Chile - Explorar</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {mockDestinos.map((destino: Destino) => (
          <IonCard key={destino.id}>
            <IonCardHeader>
              <IonCardSubtitle>{destino.categoria} • {destino.region}</IonCardSubtitle>
              <IonCardTitle>{destino.nombre}</IonCardTitle>
            </IonCardHeader>
            <IonButton fill="clear" routerLink={`/destinos/${destino.id}`}>Ver detalles</IonButton>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default Explorar;
