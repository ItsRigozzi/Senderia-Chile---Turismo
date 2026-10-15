import { Request, Response } from 'express';
import { destinoSchema, destinoUpdateSchema, idParamSchema } from '../validators/schemas.js';
import * as destinosService from '../services/destinos.service.js';
import { hasPostgresCode } from './databaseErrors.js';

export const getDestinos = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoria = typeof req.query.categoria === 'string' ? req.query.categoria : undefined;
    const region = typeof req.query.region === 'string' ? req.query.region : undefined;
    const destinos = await destinosService.listDestinos(categoria, region);
    res.json({ destinos, source: 'database' });
  } catch (err) {
    console.error('Error al obtener destinos:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const getDestinoById = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = idParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ error: 'El ID del destino debe ser un entero positivo' });
      return;
    }
    const destino = await destinosService.findDestinoById(parsedId.data);
    if (destino) {
      res.json({ destino, source: 'database' });
      return;
    }
    res.status(404).json({ error: 'Destino no encontrado' });
  } catch (err) {
    if (hasPostgresCode(err, '22P02')) {
      res.status(400).json({ error: 'El ID del destino no es válido' });
      return;
    }
    console.error('Error al obtener destino:', err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const createDestino = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = destinoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const destino = await destinosService.createDestino(parsed.data);
    res.status(201).json({ mensaje: 'Destino creado exitosamente', destino });
  } catch (err) {
    if (hasPostgresCode(err, '23505')) {
      res.status(409).json({ error: 'Ya existe un destino con ese nombre en la región seleccionada' });
      return;
    }
    if (hasPostgresCode(err, '23503')) {
      res.status(400).json({ error: 'La categoría o región indicada no existe' });
      return;
    }
    console.error('Error al crear destino:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const updateDestino = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = idParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ error: 'El ID del destino debe ser un entero positivo' });
      return;
    }
    const parsed = destinoUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      return;
    }
    const destino = await destinosService.updateDestino(parsedId.data, parsed.data);
    if (!destino) {
      res.status(404).json({ error: 'Destino no encontrado' });
      return;
    }
    res.json({ mensaje: 'Destino actualizado exitosamente', destino });
  } catch (err) {
    if (hasPostgresCode(err, '23505')) {
      res.status(409).json({ error: 'Ya existe un destino con ese nombre en la región seleccionada' });
      return;
    }
    if (hasPostgresCode(err, '23503')) {
      res.status(400).json({ error: 'La categoría o región indicada no existe' });
      return;
    }
    console.error('Error al actualizar destino:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const deleteDestino = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = idParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ error: 'El ID del destino debe ser un entero positivo' });
      return;
    }
    const destino = await destinosService.deleteDestino(parsedId.data);
    if (!destino) {
      res.status(404).json({ error: 'Destino no encontrado' });
      return;
    }
    res.json({ mensaje: 'Destino eliminado exitosamente', destino });
  } catch (err) {
    console.error('Error al eliminar destino:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};
