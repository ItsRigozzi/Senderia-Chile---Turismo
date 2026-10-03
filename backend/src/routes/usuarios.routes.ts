import { Router } from 'express';
import { getUsuarios, updateUsuario, deleteUsuario } from '../controllers/usuarios.controller.js';
import { auth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

// Todas protegidas para admin
router.get('/', auth, roleGuard('admin'), getUsuarios);
router.patch('/:id', auth, roleGuard('admin'), updateUsuario);
router.delete('/:id', auth, roleGuard('admin'), deleteUsuario);

export default router;
