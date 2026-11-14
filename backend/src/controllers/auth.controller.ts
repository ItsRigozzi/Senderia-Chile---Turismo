import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import {
  completePasswordResetSchema,
  emailCodeSchema,
  emailSchema,
  googleCredentialSchema,
  loginSchema,
  registerSchema,
} from '../validators/schemas.js';
import {
  createOrLinkGoogleTourist,
  createTouristAccount,
  findAccountByEmail,
  findSessionUser,
  markEmailVerified,
  updateTouristPassword,
} from '../services/auth.service.js';
import {
  consumeAuthEmailCode,
  discardAuthEmailCode,
  issueAuthEmailCode,
} from '../services/authCodes.service.js';
import {
  isEmailDeliveryConfigured,
  sendPasswordResetCodeEmail,
  sendVerificationCodeEmail,
} from '../services/email.service.js';

const SALT_ROUNDS = 10;
const GENERIC_RESET_MESSAGE = 'Si la cuenta puede recuperar su contraseña, recibirás un código en el correo registrado.';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  return secret;
};

const databaseUnavailable = (res: Response, error?: unknown): void => {
  if (error) console.error('Error de PostgreSQL:', error instanceof Error ? error.message : error);
  res.status(503).json({ error: 'Base de datos no disponible; la autenticación requiere PostgreSQL.' });
};

const emailDeliveryUnavailable = (res: Response): void => {
  res.status(503).json({
    error: 'El envío de correos no está configurado. Completa SMTP_HOST, SMTP_USER y SMTP_PASS en backend/.env.',
    code: 'SMTP_NOT_CONFIGURED',
  });
};

const issueSession = (user: {
  id: number;
  nombre: string;
  email: string;
  rol: 'turista' | 'admin';
  password_changed_at?: Date | string | null;
}) => {
  const passwordChangedAt = user.password_changed_at
    ? new Date(user.password_changed_at).getTime()
    : null;
  const token = jwt.sign(
    { userId: user.id, email: user.email, rol: user.rol, passwordChangedAt },
    getJwtSecret(),
    { expiresIn: '24h' },
  );
  return {
    usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    token,
  };
};

const isPgUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';

export const register = async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
    return;
  }
  if (!isEmailDeliveryConfigured()) {
    emailDeliveryUnavailable(res);
    return;
  }

  const { nombre, email, password } = parsed.data;
  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createTouristAccount(nombre, email, passwordHash);
    const issued = await issueAuthEmailCode(user.id, 'verificacion');
    if (!issued.issued) {
      res.status(503).json({ error: 'No se pudo preparar el código de verificación. Intenta nuevamente.', code: 'CODE_NOT_ISSUED' });
      return;
    }

    try {
      await sendVerificationCodeEmail(user.email, user.nombre, issued.code);
    } catch (error) {
      console.error('No se pudo enviar el correo de verificación:', error instanceof Error ? error.message : error);
      await discardAuthEmailCode(user.id, 'verificacion', issued.code).catch(() => undefined);
      res.status(503).json({
        error: 'La cuenta quedó pendiente de verificación, pero no se pudo enviar el correo. Revisa el SMTP e intenta reenviar el código.',
        code: 'EMAIL_SEND_FAILED',
        email: user.email,
      });
      return;
    }

    res.status(201).json({
      mensaje: 'Cuenta creada. Revisa tu correo e ingresa el código para activar la cuenta.',
      email: user.email,
    });
  } catch (error) {
    if (isPgUniqueViolation(error)) {
      res.status(409).json({ error: 'El correo ya está registrado', code: 'EMAIL_ALREADY_REGISTERED' });
      return;
    }
    databaseUnavailable(res, error);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const user = await findAccountByEmail(parsed.data.email);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }
    const passwordMatch = await bcrypt.compare(parsed.data.password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }
    if (!user.email_verificado) {
      res.status(403).json({
        error: 'Verifica tu correo antes de iniciar sesión.',
        code: 'EMAIL_NOT_VERIFIED',
      });
      return;
    }

    res.json({ mensaje: 'Inicio de sesión exitoso', ...issueSession(user) });
  } catch (error) {
    databaseUnavailable(res, error);
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const parsed = emailCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ingresa un correo válido y el código de 6 dígitos.', detalles: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const user = await findAccountByEmail(parsed.data.email);
    if (!user || user.rol !== 'turista') {
      res.status(400).json({ error: 'El código es incorrecto o venció.', code: 'INVALID_OR_EXPIRED_CODE' });
      return;
    }
    if (user.email_verificado) {
      res.status(409).json({ error: 'Este correo ya está verificado. Inicia sesión.', code: 'EMAIL_ALREADY_VERIFIED' });
      return;
    }

    const outcome = await consumeAuthEmailCode(user.id, 'verificacion', parsed.data.codigo, (client) =>
      markEmailVerified(user.id, client));
    if (outcome !== 'valid') {
      const messages = {
        missing: { status: 400, error: 'No hay un código vigente. Solicita uno nuevo.', code: 'CODE_NOT_FOUND' },
        expired: { status: 410, error: 'El código venció. Solicita uno nuevo.', code: 'CODE_EXPIRED' },
        invalid: { status: 400, error: 'El código es incorrecto.', code: 'INVALID_CODE' },
        locked: { status: 429, error: 'Se agotaron los intentos. Solicita un código nuevo.', code: 'CODE_ATTEMPTS_EXCEEDED' },
      } as const;
      const result = messages[outcome];
      res.status(result.status).json({ error: result.error, code: result.code });
      return;
    }

    const verifiedUser = await findAccountByEmail(parsed.data.email);
    if (!verifiedUser) {
      res.status(404).json({ error: 'No se encontró la cuenta después de verificarla.' });
      return;
    }
    res.json({ mensaje: 'Correo verificado. Tu cuenta ya está activa.', ...issueSession(verifiedUser) });
  } catch (error) {
    databaseUnavailable(res, error);
  }
};

export const resendVerificationCode = async (req: Request, res: Response): Promise<void> => {
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ingresa un correo válido.', detalles: parsed.error.flatten().fieldErrors });
    return;
  }
  if (!isEmailDeliveryConfigured()) {
    emailDeliveryUnavailable(res);
    return;
  }
  try {
    const user = await findAccountByEmail(parsed.data.email);
    if (user && user.rol === 'turista' && !user.email_verificado) {
      const issued = await issueAuthEmailCode(user.id, 'verificacion');
      if (issued.issued) {
        try {
          await sendVerificationCodeEmail(user.email, user.nombre, issued.code);
        } catch (error) {
          console.error('No se pudo reenviar el correo de verificación:', error instanceof Error ? error.message : error);
          await discardAuthEmailCode(user.id, 'verificacion', issued.code).catch(() => undefined);
        }
      }
    }
    res.json({ mensaje: 'Si la cuenta necesita verificación, se enviará un código. Si acabas de pedir uno, espera un minuto antes de reenviar.' });
  } catch (error) {
    databaseUnavailable(res, error);
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const parsed = googleCredentialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'No se recibió una credencial válida de Google.' });
    return;
  }
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    res.status(503).json({ error: 'El inicio con Google no está configurado en backend/.env.', code: 'GOOGLE_NOT_CONFIGURED' });
    return;
  }

  let payload: { sub?: string; email?: string; email_verified?: boolean; name?: string } | undefined;
  try {
    const googleClient = new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({ idToken: parsed.data.credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ error: 'No se pudo validar la sesión de Google. Intenta nuevamente.', code: 'GOOGLE_TOKEN_INVALID' });
    return;
  }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    res.status(401).json({ error: 'Google no confirmó un correo verificable.', code: 'GOOGLE_EMAIL_UNVERIFIED' });
    return;
  }

  try {
    const email = payload.email.trim().toLowerCase();
    const name = payload.name?.trim() || email.split('@')[0];
    const user = await createOrLinkGoogleTourist(payload.sub, email, name);
    res.json({ mensaje: 'Sesión iniciada con Google.', ...issueSession(user) });
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      const code = (error as Error & { code: string }).code;
      if (code === 'GOOGLE_ADMIN_DENIED') {
        res.status(403).json({ error: error.message, code });
        return;
      }
      if (code === 'GOOGLE_ACCOUNT_CONFLICT' || code === '23505') {
        res.status(409).json({ error: 'No se pudo vincular esta cuenta de Google con el correo registrado.', code: 'GOOGLE_ACCOUNT_CONFLICT' });
        return;
      }
    }
    databaseUnavailable(res, error);
  }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ingresa un correo válido.', detalles: parsed.error.flatten().fieldErrors });
    return;
  }
  if (!isEmailDeliveryConfigured()) {
    emailDeliveryUnavailable(res);
    return;
  }
  try {
    const user = await findAccountByEmail(parsed.data.email);
    if (user && user.rol === 'turista' && user.email_verificado && user.password_hash) {
      const issued = await issueAuthEmailCode(user.id, 'recuperacion');
      if (issued.issued) {
        try {
          await sendPasswordResetCodeEmail(user.email, user.nombre, issued.code);
        } catch (error) {
          console.error('No se pudo enviar el correo de recuperación:', error instanceof Error ? error.message : error);
          await discardAuthEmailCode(user.id, 'recuperacion', issued.code).catch(() => undefined);
        }
      }
    }
    res.json({ mensaje: GENERIC_RESET_MESSAGE });
  } catch (error) {
    databaseUnavailable(res, error);
  }
};

export const completePasswordReset = async (req: Request, res: Response): Promise<void> => {
  const parsed = completePasswordResetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Revisa el correo, el código y la contraseña.', detalles: parsed.error.flatten().fieldErrors });
    return;
  }
  try {
    const user = await findAccountByEmail(parsed.data.email);
    if (!user || user.rol !== 'turista' || !user.email_verificado || !user.password_hash) {
      res.status(400).json({ error: 'El código es incorrecto o venció.', code: 'INVALID_OR_EXPIRED_CODE' });
      return;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, SALT_ROUNDS);
    const outcome = await consumeAuthEmailCode(user.id, 'recuperacion', parsed.data.codigo, (client) =>
      updateTouristPassword(user.id, passwordHash, client));
    if (outcome !== 'valid') {
      const messages = {
        missing: { status: 400, error: 'No hay un código vigente. Solicita uno nuevo.', code: 'CODE_NOT_FOUND' },
        expired: { status: 410, error: 'El código venció. Solicita uno nuevo.', code: 'CODE_EXPIRED' },
        invalid: { status: 400, error: 'El código es incorrecto.', code: 'INVALID_CODE' },
        locked: { status: 429, error: 'Se agotaron los intentos. Solicita un código nuevo.', code: 'CODE_ATTEMPTS_EXCEEDED' },
      } as const;
      const result = messages[outcome];
      res.status(result.status).json({ error: result.error, code: result.code });
      return;
    }

    res.json({ mensaje: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.' });
  } catch (error) {
    databaseUnavailable(res, error);
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await findSessionUser(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ usuario: user });
  } catch (error) {
    databaseUnavailable(res, error);
  }
};
