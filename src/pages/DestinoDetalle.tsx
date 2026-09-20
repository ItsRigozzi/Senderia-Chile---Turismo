import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonItem, IonLabel } from '@ionic/react';
import { useParams } from 'react-router';
import { mockDestinos, Destino } from '../services/mockDestinos';

const DestinoDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const destino = mockDestinos.find((d: Destino) => d.id === id);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/explorar" />
          </IonButtons>
          <IonTitle>Detalle del Destino</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {destino ? (
          <>
            <h2>{destino.nombre}</h2>
            <IonItem>
              <IonLabel>
                <h3>Región</h3>
                <p>{destino.region}</p>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>
                <h3>Coordenadas GPS</h3>
                <p>{destino.coordenadas}</p>
              </IonLabel>
            </IonItem>
          </>
        ) : (
          <p>Destino no encontrado.</p>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DestinoDetalle;