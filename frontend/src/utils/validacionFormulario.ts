// Mensajes de validación propios y claros, en lugar de los mensajes genéricos del navegador.

const EJEMPLO_CORREO = 'Ejemplo: nombre@gmail.com';

/** Devuelve un mensaje explicando qué está mal en el correo, o '' si es válido. */
export function validarCorreo(valor: string): string {
  const correo = valor.trim();
  if (!correo) return 'Ingresa tu correo electrónico.';
  if (/\s/.test(correo)) return 'El correo no puede tener espacios.';

  const arrobas = correo.split('@').length - 1;
  if (arrobas === 0) return `Al correo le falta el signo @. ${EJEMPLO_CORREO}`;
  if (arrobas > 1) return `El correo solo puede tener un signo @. ${EJEMPLO_CORREO}`;

  const [usuario, dominio] = correo.split('@');
  if (!usuario) return `Falta tu nombre de usuario antes del @. ${EJEMPLO_CORREO}`;
  if (!dominio) return `Falta el proveedor después del @ (gmail, outlook, etc.). ${EJEMPLO_CORREO}`;
  if (usuario.startsWith('.') || usuario.endsWith('.')) {
    return `El nombre de usuario no puede empezar ni terminar con un punto. ${EJEMPLO_CORREO}`;
  }
  if (correo.includes('..')) return 'El correo no puede tener dos puntos seguidos.';
  if (dominio.startsWith('.')) {
    return `Después del @ falta el proveedor (gmail, outlook, etc.) antes del punto. ${EJEMPLO_CORREO}`;
  }
  if (!dominio.includes('.')) {
    return `Al correo le falta la terminación (.com, .cl, etc.). ${EJEMPLO_CORREO}`;
  }

  const terminacion = dominio.slice(dominio.lastIndexOf('.') + 1);
  if (!/^[a-zA-Z]{2,}$/.test(terminacion)) {
    return `La terminación del correo está incompleta o no es válida (.com, .cl, etc.). ${EJEMPLO_CORREO}`;
  }
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(usuario) || !/^[a-zA-Z0-9.-]+$/.test(dominio)) {
    return `El correo tiene caracteres no permitidos. ${EJEMPLO_CORREO}`;
  }
  if (correo.length > 255) return 'El correo es demasiado largo.';
  return '';
}

/** Valida una contraseña nueva y su confirmación. Devuelve el mensaje de error o ''. */
export function validarContrasenaNueva(password: string, confirmacion: string): string {
  if (!password) return 'Ingresa una contraseña.';
  if (password.length < 8) return `La contraseña debe tener al menos 8 caracteres (llevas ${password.length}).`;
  if (!/\p{L}/u.test(password)) return 'La contraseña debe incluir al menos una letra.';
  if (!/\d/.test(password)) return 'La contraseña debe incluir al menos un número.';
  if (!confirmacion) return 'Repite la contraseña en el campo "Confirmar contraseña".';
  if (password !== confirmacion) return 'Las contraseñas no coinciden. Revisa que ambas sean iguales.';
  return '';
}

/** Valida el código de 6 dígitos enviado por correo. */
export function validarCodigo(codigo: string): string {
  const limpio = codigo.trim();
  if (!limpio) return 'Ingresa el código de 6 dígitos que te enviamos por correo.';
  if (!/^\d{6}$/.test(limpio)) return `El código debe tener exactamente 6 números (llevas ${limpio.length}).`;
  return '';
}

/** Mensaje en español para un campo que no pasó la validación nativa del navegador. */
export function mensajeCampoInvalido(campo: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  const v = campo.validity;
  if (v.valueMissing) {
    return campo instanceof HTMLSelectElement ? 'Selecciona una opción de la lista.' : 'Este campo es obligatorio.';
  }
  if (v.typeMismatch && campo.type === 'email') return validarCorreo(campo.value) || 'Revisa el formato del correo.';
  if (v.typeMismatch && campo.type === 'url') return 'Ingresa una dirección web válida, por ejemplo https://sitio.cl/imagen.jpg';
  if (v.tooShort && 'minLength' in campo) {
    return `Debe tener al menos ${campo.minLength} caracteres (llevas ${campo.value.length}).`;
  }
  if (v.tooLong && 'maxLength' in campo) return `Debe tener como máximo ${campo.maxLength} caracteres.`;
  if (v.rangeUnderflow && 'min' in campo) return `El valor mínimo permitido es ${campo.min}.`;
  if (v.rangeOverflow && 'max' in campo) return `El valor máximo permitido es ${campo.max}.`;
  if (v.stepMismatch) return 'El valor no tiene un formato válido.';
  if (v.patternMismatch) return campo.title || 'El formato ingresado no es válido.';
  if (v.badInput) return 'Ingresa un número válido.';
  return '';
}

/**
 * Reemplaza en toda la app los mensajes del navegador ("El signo . está colocado en una posición
 * incorrecta…") por mensajes propios en español. Se instala una sola vez al iniciar.
 */
export function instalarMensajesValidacion(): void {
  const esCampo = (el: EventTarget | null): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
    el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;

  document.addEventListener('invalid', (event) => {
    if (!esCampo(event.target)) return;
    const campo = event.target;
    campo.setCustomValidity('');
    if (!campo.validity.valid) campo.setCustomValidity(mensajeCampoInvalido(campo));
  }, true);

  // Al escribir se limpia el mensaje propio para que el navegador vuelva a evaluar el campo.
  const limpiar = (event: Event) => { if (esCampo(event.target)) event.target.setCustomValidity(''); };
  document.addEventListener('input', limpiar, true);
  document.addEventListener('change', limpiar, true);
}
