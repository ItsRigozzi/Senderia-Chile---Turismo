import { Router } from 'express';
import { getDestinos, getDestinoById, createDestino, updateDestino, deleteDestino } from '../controllers/destinos.controller.js';
import { auth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

// Públicas
router.get('/', getDestinos);
router.get('/:id', getDestinoById);

// Admin
router.post('/', auth, roleGuard('admin'), createDestino);
router.put('/:id', auth, roleGuard('admin'), updateDestino);
router.delete('/:id', auth, roleGuard('admin'), deleteDestino);

export default router;
