import { Request, Response } from 'express';
import { idParamSchema, opinionSchema } from '../validators/schemas.js';
import * as opinionesService from '../services/opiniones.service.js';

const parseDestinationId = (value: string, res: Response): number | undefined => {
  const parsed = idParamSchema.safeParse(value);
  if (!parsed.success) {
    res.status(400).json({ error: 'El ID del destino debe ser un entero positivo' });
    return undefined;
  }
  return parsed.data;
};

export const getOpiniones = async (req: Request, res: Response): Promise<void> => {
  const destinoId = parseDestinationId(req.params.id, res);
  if (!destinoId) return;

  try {
    const data = await opinionesService.listOpiniones(destinoId);
    if (!data) {
      res.status(404).json({ error: 'Destino no encontrado' });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error('Error al consultar opiniones:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudieron consultar las opiniones' });
  }
};

export const getMiOpinion = async (req: Request, res: Response): Promise<void> => {
  const destinoId = parseDestinationId(req.params.id, res);
  if (!destinoId) return;

  try {
    const opinion = await opinionesService.findOpinion(destinoId, req.user!.userId);
    res.json({ opinion: opinion ?? null });
  } catch (error) {
    console.error('Error al consultar la opinión propia:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudo consultar tu opinión' });
  }
};

export const saveMiOpinion = async (req: Request, res: Response): Promise<void> => {
  const destinoId = parseDestinationId(req.params.id, res);
  if (!destinoId) return;

  const parsed = opinionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Datos de opinión inválidos',
      detalles: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const opinion = await opinionesService.saveOpinion(destinoId, req.user!.userId, parsed.data);
    if (!opinion) {
      res.status(404).json({ error: 'Destino no encontrado' });
      return;
    }
    res.json({ mensaje: 'Tu calificación fue guardada', opinion });
  } catch (error) {
    console.error('Error al guardar opinión:', error instanceof Error ? error.message : error);
    res.status(503).json({ error: 'No se pudo guardar tu opinión' });
  }
};
