import { Router } from 'express';
import { getDestinos, getDestinoById, createDestino, updateDestino, deleteDestino } from '../controllers/destinos.controller.js';
import { getOpiniones, getMiOpinion, saveMiOpinion } from '../controllers/opiniones.controller.js';
import { createSugerencia, getArchivoAprobado, getImagenesAprobadas } from '../controllers/sugerenciasImagenes.controller.js';
import { auth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { receiveSugerenciaImagen } from '../middleware/uploadSugerenciaImagen.js';

const router = Router();

// Públicas
router.get('/', getDestinos);
router.get('/:id/imagenes-comunidad', getImagenesAprobadas);
router.get('/:id/imagenes-comunidad/:imagenId/archivo', getArchivoAprobado);
router.post('/:id/sugerencias-imagenes', auth, receiveSugerenciaImagen, createSugerencia);
router.get('/:id/opiniones', getOpiniones);
router.get('/:id/opinion', auth, getMiOpinion);
router.post('/:id/opiniones', auth, saveMiOpinion);
router.get('/:id', getDestinoById);

// Admin
router.post('/', auth, roleGuard('admin'), createDestino);
router.put('/:id', auth, roleGuard('admin'), updateDestino);
router.delete('/:id', auth, roleGuard('admin'), deleteDestino);

export default router;
