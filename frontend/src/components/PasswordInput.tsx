import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

const PasswordInput: React.FC<PasswordInputProps> = ({ className = '', ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`input-control ${className}`.trim()}
      />
      <button
        type="button"
        className="password-visibility-toggle"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setVisible((actual) => !actual)}
      >
        <IonIcon icon={visible ? eyeOffOutline : eyeOutline} aria-hidden="true" />
      </button>
    </div>
  );
};

export default PasswordInput;
