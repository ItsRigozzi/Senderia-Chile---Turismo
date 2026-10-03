import { Router } from 'express';
import { getCategorias, getRegiones, createCategoria, updateCategoria, deleteCategoria } from '../controllers/categorias.controller.js';
import { auth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

// Pública
router.get('/', getCategorias);
router.get('/regiones', getRegiones);

// Admin
router.post('/', auth, roleGuard('admin'), createCategoria);
router.put('/:id', auth, roleGuard('admin'), updateCategoria);
router.delete('/:id', auth, roleGuard('admin'), deleteCategoria);

export default router;
