import { Router } from 'express';
import {
  completePasswordReset,
  googleLogin,
  login,
  me,
  register,
  requestPasswordReset,
  resendVerificationCode,
  verifyEmail,
} from '../controllers/auth.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/verification/resend', resendVerificationCode);
router.post('/google', googleLogin);
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', completePasswordReset);
router.get('/me', auth, me);

export default router;
