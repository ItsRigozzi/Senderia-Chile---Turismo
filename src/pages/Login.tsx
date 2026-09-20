import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonItem, IonList, IonText } from '@ionic/react';

const Login: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Acceso Senderia</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText color="medium">
          <p>Ingresa tus credenciales para acceder a la plataforma</p>
        </IonText>
        <IonList>
          <IonItem>
            <IonInput label="Correo electrónico" labelPlacement="floating" type="email" placeholder="admin@senderia.cl"></IonInput>
          </IonItem>
          <IonItem>
            <IonInput label="Contraseña" labelPlacement="floating" type="password"></IonInput>
          </IonItem>
        </IonList>
        <IonButton expand="block" className="ion-margin-top" routerLink="/admin/dashboard">
          Ingresar
        </IonButton>
        <IonButton expand="block" fill="clear" routerLink="/explorar">
          Volver a inicio
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;