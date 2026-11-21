import { Request, Response } from 'express';
import { categoriaSchema, categoriaUpdateSchema, idParamSchema } from '../validators/schemas.js';
import * as categoriasService from '../services/categorias.service.js';
import { hasPostgresCode } from './databaseErrors.js';
import { sendServerError } from '../middleware/errorHandler.js';

export const getCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await categoriasService.listCategorias();
    res.json({ categorias });
  } catch (err) {
    sendServerError(res, err, 'Error al obtener categorías:', 'No se pudo consultar PostgreSQL');
  }
};

export const getRegiones = async (_req: Request, res: Response): Promise<void> => {
  try {
    const regiones = await categoriasService.listRegiones();
    res.json({ regiones });
  } catch (err) {
    sendServerError(res, err, 'Error al obtener regiones:', 'No se pudieron consultar las regiones');
  }
};

export const createCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = categoriaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const categoria = await categoriasService.createCategoria(parsed.data);
    if (!categoria) {
      res.status(409).json({ error: 'Ya existe una categoría con ese nombre o slug' });
      return;
    }
    res.status(201).json({ mensaje: 'Categoría creada exitosamente', categoria });
  } catch (err) {
    if (hasPostgresCode(err, '23505')) {
      res.status(409).json({ error: 'Ya existe una categoría con ese nombre o slug' });
      return;
    }
    sendServerError(res, err, 'Error al crear categoría:', 'No se pudo escribir en PostgreSQL');
  }
};

export const updateCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = categoriaUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
      return;
    }
    const parsedId = idParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ error: 'El ID de la categoría debe ser un entero positivo' });
      return;
    }
    const categoria = await categoriasService.updateCategoria(parsedId.data, parsed.data);
    if (!categoria) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }
    res.json({ mensaje: 'Categoría actualizada exitosamente', categoria });
  } catch (err) {
    if (hasPostgresCode(err, '23505')) {
      res.status(409).json({ error: 'Ya existe una categoría con ese nombre o slug' });
      return;
    }
    sendServerError(res, err, 'Error al actualizar categoría:', 'No se pudo escribir en PostgreSQL');
  }
};

export const deleteCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = idParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ error: 'El ID de la categoría debe ser un entero positivo' });
      return;
    }
    const result = await categoriasService.deleteCategoria(parsedId.data);
    if (result.associatedCount > 0) {
      res.status(409).json({ 
        error: 'No se puede eliminar la categoría porque tiene destinos activos asociados',
        destinos_asociados: result.associatedCount
      });
      return;
    }
    if (!result.categoria) {
      res.status(404).json({ error: 'Categoría no encontrada' });
      return;
    }
    res.json({
      mensaje: 'Categoría eliminada exitosamente',
      categoria: result.categoria,
      destinos_inactivos_eliminados: result.inactiveRemoved ?? 0,
    });
  } catch (err) {
    if (hasPostgresCode(err, '23503')) {
      res.status(409).json({ error: 'No se puede eliminar la categoría porque tiene destinos asociados' });
      return;
    }
    sendServerError(res, err, 'Error al eliminar categoría:', 'No se pudo escribir en PostgreSQL');
  }
};
