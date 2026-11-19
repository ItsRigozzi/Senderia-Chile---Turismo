import nodemailer from 'nodemailer';
import { AUTH_EMAIL_CODE_TTL_MINUTES } from './authCodes.service.js';

const escapeHtml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const isEmailDeliveryConfigured = (): boolean => Boolean(
  process.env.SMTP_HOST?.trim()
  && process.env.SMTP_USER?.trim()
  && process.env.SMTP_PASS?.trim(),
);

/**
 * Modo desarrollo: sin SMTP configurado y fuera de producción, los códigos se
 * muestran en la consola del backend en vez de enviarse por correo. Así el
 * registro y la recuperación funcionan sin configurar Gmail. En producción
 * (NODE_ENV=production) nunca se imprimen códigos.
 */
export const isEmailConsoleMode = (): boolean =>
  !isEmailDeliveryConfigured() && process.env.NODE_ENV !== 'production';

/** Indica si los códigos por correo pueden entregarse (por SMTP o por consola). */
export const canDeliverAuthEmails = (): boolean =>
  isEmailDeliveryConfigured() || isEmailConsoleMode();

const createTransport = () => {
  if (!isEmailDeliveryConfigured()) {
    throw new Error('SMTP no está configurado. Completa SMTP_HOST, SMTP_USER y SMTP_PASS en backend/.env.');
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    disableFileAccess: true,
    disableUrlAccess: true,
  });
};

const sendCodeEmail = async (
  email: string,
  nombre: string,
  codigo: string,
  purpose: 'verificacion' | 'recuperacion',
): Promise<void> => {
  const minutes = AUTH_EMAIL_CODE_TTL_MINUTES;
  const isVerification = purpose === 'verificacion';

  if (isEmailConsoleMode()) {
    const label = isVerification ? 'verificación de correo' : 'recuperación de contraseña';
    console.log(`\n[MODO DESARROLLO] Código de ${label} para ${email}: ${codigo} (vence en ${minutes} minutos)\n`);
    return;
  }

  const action = isVerification ? 'verificar tu correo' : 'cambiar tu contraseña';
  const subject = isVerification ? 'Verifica tu correo | Sendería Chile' : 'Recupera tu contraseña | Sendería Chile';
  const safeName = escapeHtml(nombre);
  const text = `Hola ${nombre},\n\nUsa este código para ${action} en Sendería Chile: ${codigo}\n\nEl código vence en ${minutes} minutos y solo puede usarse una vez. Si no solicitaste este correo, puedes ignorarlo.`;
  const html = `<!doctype html><html lang="es"><body style="font-family:Arial,sans-serif;color:#0f172a"><h2>Sendería Chile</h2><p>Hola ${safeName},</p><p>Usa este código para ${action}:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${codigo}</p><p>El código vence en ${minutes} minutos y solo puede usarse una vez.</p><p>Si no solicitaste este correo, puedes ignorarlo.</p></body></html>`;

  await createTransport().sendMail({
    from: process.env.SMTP_FROM?.trim() || process.env.SMTP_USER,
    to: email,
    subject,
    text,
    html,
  });
};

export const sendVerificationCodeEmail = (email: string, nombre: string, codigo: string) =>
  sendCodeEmail(email, nombre, codigo, 'verificacion');

export const sendPasswordResetCodeEmail = (email: string, nombre: string, codigo: string) =>
  sendCodeEmail(email, nombre, codigo, 'recuperacion');
