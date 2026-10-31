import { Request, Response } from 'express';
import { destinoSchema, destinoUpdateSchema, destinosQuerySchema, idParamSchema } from '../validators/schemas.js';
import * as destinosService from '../services/destinos.service.js';
import type { PersistedDestinoUpdate } from '../services/destinos.service.js';
import { GeocodingError, geocodeDestination } from '../services/geocoding.service.js';
import { hasPostgresCode } from './databaseErrors.js';

const resolveCoordinates = async (
  nombre: string,
  regionId: number,
  res: Response,
): Promise<{ latitud: number; longitud: number } | null> => {
  const region = await destinosService.findRegionNameById(regionId);
  if (!region) {
    res.status(400).json({ error: 'La región indicada no existe.' });
    return null;
  }

  try {
    const coordinates = await geocodeDestination(nombre, region);
    if (!coordinates) {
      res.status(422).json({
        error: `No se encontraron coordenadas en Chile para “${nombre}” en la región ${region}. Ingresa ambas coordenadas manualmente.`,
      });
      return null;
    }
    return coordinates;
  } catch (error) {
    if (error instanceof GeocodingError && error.code === 'not_configured') {
      res.status(503).json({ error: error.message });
      return null;
    }
    const message = error instanceof GeocodingError
      ? error.message
      : 'No se pudo consultar el servicio de geocodificación.';
    console.error('Error de geocodificación:', message);
    res.status(502).json({ error: message });
    return null;
  }
};

export const getDestinos = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedQuery = destinosQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({ error: 'Parámetros de filtro inválidos', detalles: parsedQuery.error.flatten().fieldErrors });
      return;
    }
    const destinos = await destinosService.listDestinos(parsedQuery.data);
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

    const coordinates = typeof parsed.data.latitud === 'number' && typeof parsed.data.longitud === 'number'
      ? { latitud: parsed.data.latitud, longitud: parsed.data.longitud }
      : await resolveCoordinates(parsed.data.nombre, parsed.data.region_id, res);
    if (!coordinates) return;

    const destino = await destinosService.createDestino({ ...parsed.data, ...coordinates });
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
    const { latitud, longitud, ...otherFields } = parsed.data;
    let updateFields: PersistedDestinoUpdate = otherFields;
    if (latitud === null && longitud === null) {
      const current = await destinosService.findDestinoById(parsedId.data);
      if (!current) {
        res.status(404).json({ error: 'Destino no encontrado' });
        return;
      }
      const nombre = parsed.data.nombre ?? current.nombre;
      const regionId = parsed.data.region_id ?? current.region_id;
      const coordinates = await resolveCoordinates(nombre, regionId, res);
      if (!coordinates) return;
      updateFields = { ...otherFields, ...coordinates };
    } else if (typeof latitud === 'number' && typeof longitud === 'number') {
      updateFields = { ...otherFields, latitud, longitud };
    }

    const destino = await destinosService.updateDestino(parsedId.data, updateFields);
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
    res.json({ mensaje: 'Destino quitado de la aplicación. El registro se conserva en la base de datos.', destino });
  } catch (err) {
    console.error('Error al eliminar destino:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};
