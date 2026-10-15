import { Request, Response } from 'express';
import { favoritoSchema, idParamSchema } from '../validators/schemas.js';
import * as favoritosService from '../services/favoritos.service.js';

export const getFavoritos = async (req: Request, res: Response): Promise<void> => {
  try {
    const favoritos = await favoritosService.listFavoritos(req.user!.userId);
    res.json({ favoritos });
  } catch (err) {
    console.error('Error al obtener favoritos:', err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const addFavorito = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const parsed = favoritoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Datos inválidos', detalles: parsed.error.flatten().fieldErrors });
      return;
    }

    const result = await favoritosService.addFavorito(userId, parsed.data.destino_id);
    if (result.status === 'destination-missing') {
      res.status(404).json({ error: 'Destino no encontrado' });
      return;
    }
    if (result.status === 'duplicate') {
      res.status(409).json({ error: 'El destino ya está en tus favoritos' });
      return;
    }
    res.status(201).json({ mensaje: 'Destino agregado a favoritos', favorito: result.favorito });
  } catch (err) {
    console.error('Error al agregar favorito:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const removeFavorito = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = idParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ error: 'El ID del favorito debe ser un entero positivo' });
      return;
    }
    const favorito = await favoritosService.deleteFavorito(req.user!.userId, parsedId.data);
    if (!favorito) {
      res.status(404).json({ error: 'Favorito no encontrado' });
      return;
    }

    res.json({ mensaje: 'Destino eliminado de favoritos' });
  } catch (err) {
    console.error('Error al eliminar favorito:', err);
    console.error('Error al eliminar favorito:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};
