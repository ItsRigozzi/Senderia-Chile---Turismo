import { Router } from 'express';
import { getFavoritos, addFavorito, removeFavorito } from '../controllers/favoritos.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Todas protegidas (turista registrado o admin)
router.get('/', auth, getFavoritos);
router.post('/', auth, addFavorito);
router.delete('/:id', auth, removeFavorito);

export default router;
