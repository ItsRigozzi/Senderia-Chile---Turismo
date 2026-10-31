import { Router } from 'express';
import { getArchivoPendienteAdmin, getPendientesAdmin, revisarSugerencia } from '../controllers/sugerenciasImagenes.controller.js';
import { auth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

router.get('/', auth, roleGuard('admin'), getPendientesAdmin);
router.get('/:id/archivo', auth, roleGuard('admin'), getArchivoPendienteAdmin);
router.patch('/:id/revision', auth, roleGuard('admin'), revisarSugerencia);

export default router;
