import type { Request, Response } from 'express';
import { idParamSchema, revisionSugerenciaImagenSchema, sugerenciaImagenSchema } from '../validators/schemas.js';
import { sugerenciasImagenesDirectory } from '../config/uploads.js';
import { removeUploadedFile } from '../middleware/uploadSugerenciaImagen.js';
import * as sugerenciasService from '../services/sugerenciasImagenes.service.js';

const parseId = (value: string, res: Response): number | undefined => {
  const parsed = idParamSchema.safeParse(value);
  if (!parsed.success) {
    res.status(400).json({ error: 'El ID debe ser un entero positivo.' });
    return undefined;
  }
  return parsed.data;
};

const sendImageFile = (
  res: Response,
  image: { archivo_nombre: string; mime_type: string } | undefined,
  isPublic: boolean,
): void => {
  if (!image) {
    res.status(404).json({ error: 'Imagen no encontrada o todavía pendiente de aprobación.' });
    return;
  }
  res.setHeader('Content-Type', image.mime_type);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', isPublic ? 'public, max-age=3600' : 'private, no-store');
  res.sendFile(image.archivo_nombre, { root: sugerenciasImagenesDirectory, dotfiles: 'deny' }, (error) => {
    if (error && !res.headersSent) res.status(404).json({ error: 'No se pudo leer la imagen.' });
  });
};

export const createSugerencia = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'Selecciona una imagen JPG, PNG o WebP.' });
    return;
  }

  const parsed = sugerenciaImagenSchema.safeParse(req.body);
  if (!parsed.success) {
    await removeUploadedFile(req.file.path);
    res.status(400).json({
      error: 'Debes confirmar que tienes permiso para compartir la imagen y aceptar la atribución pública.',
      detalles: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const destinationId = parseId(req.params.id, res);
  if (!destinationId) {
    await removeUploadedFile(req.file.path);
    return;
  }

  try {
    const suggestion = await sugerenciasService.createSuggestion(
      destinationId,
      req.user!.userId,
      { filename: req.file.filename, mimetype: req.file.mimetype, size: req.file.size },
      parsed.data,
    );
    if (!suggestion) {
      await removeUploadedFile(req.file.path);
      res.status(404).json({ error: 'Destino no encontrado o inactivo.' });
      return;
    }
    res.status(201).json({
      mensaje: 'Imagen enviada. Se mostrará públicamente solo si el administrador la aprueba.',
      sugerencia: suggestion,
    });
  } catch (error) {
    await removeUploadedFile(req.file.path);
    console.error('Error al guardar sugerencia de imagen:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudo guardar la sugerencia de imagen.' });
  }
};

export const getImagenesAprobadas = async (req: Request, res: Response): Promise<void> => {
  const destinationId = parseId(req.params.id, res);
  if (!destinationId) return;
  try {
    const images = await sugerenciasService.listApprovedImages(destinationId);
    if (!images) {
      res.status(404).json({ error: 'Destino no encontrado.' });
      return;
    }
    res.json({ imagenes: images.map((image) => ({
      ...image,
      imagen_url: `/api/destinos/${destinationId}/imagenes-comunidad/${image.id}/archivo`,
    })) });
  } catch (error) {
    console.error('Error al consultar imágenes aprobadas:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudieron consultar las imágenes aportadas.' });
  }
};

export const getArchivoAprobado = async (req: Request, res: Response): Promise<void> => {
  const destinationId = parseId(req.params.id, res);
  const imageId = parseId(req.params.imagenId, res);
  if (!destinationId || !imageId) return;
  try {
    const image = await sugerenciasService.findApprovedImage(destinationId, imageId);
    sendImageFile(res, image, true);
  } catch (error) {
    console.error('Error al leer imagen aprobada:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudo cargar la imagen.' });
  }
};

export const getPendientesAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const suggestions = await sugerenciasService.listPendingSuggestions();
    res.json({ sugerencias: suggestions.map((suggestion) => ({
      ...suggestion,
      imagen_url: `/api/sugerencias-imagenes/${suggestion.id}/archivo`,
    })) });
  } catch (error) {
    console.error('Error al consultar sugerencias pendientes:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudieron consultar las sugerencias de imágenes.' });
  }
};

export const getArchivoPendienteAdmin = async (req: Request, res: Response): Promise<void> => {
  const imageId = parseId(req.params.id, res);
  if (!imageId) return;
  try {
    const image = await sugerenciasService.findPendingImage(imageId);
    sendImageFile(res, image, false);
  } catch (error) {
    console.error('Error al leer imagen pendiente:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudo cargar la imagen.' });
  }
};

export const revisarSugerencia = async (req: Request, res: Response): Promise<void> => {
  const imageId = parseId(req.params.id, res);
  if (!imageId) return;
  const parsed = revisionSugerenciaImagenSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'La decisión debe ser aprobada o rechazada.' });
    return;
  }
  try {
    const result = await sugerenciasService.reviewSuggestion(imageId, req.user!.userId, parsed.data.estado);
    if (!result.result) {
      res.status(result.alreadyReviewed ? 409 : 404).json({
        error: result.alreadyReviewed ? 'Esta sugerencia ya fue revisada.' : 'Sugerencia no encontrada.',
      });
      return;
    }
    res.json({ mensaje: parsed.data.estado === 'aprobada' ? 'Imagen aprobada y publicada.' : 'Imagen rechazada.', sugerencia: result.result });
  } catch (error) {
    console.error('Error al revisar sugerencia de imagen:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudo guardar la decisión.' });
  }
};
