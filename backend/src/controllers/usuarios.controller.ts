import { Request, Response } from 'express';
import { idParamSchema, usuarioUpdateSchema } from '../validators/schemas.js';
import * as usuariosService from '../services/usuarios.service.js';

export const getUsuarios = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await usuariosService.listUsuarios();
    res.json({ usuarios });
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(503).json({ error: 'No se pudo consultar PostgreSQL' });
  }
};

export const updateUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = usuarioUpdateSchema.safeParse(req.body);
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
      res.status(400).json({ error: 'El ID del usuario debe ser un entero positivo' });
      return;
    }
    const usuario = await usuariosService.updateUsuario(parsedId.data, parsed.data);
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ mensaje: 'Usuario actualizado exitosamente', usuario });
  } catch (err) {
    console.error('Error al actualizar usuario:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};

export const deleteUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = idParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ error: 'El ID del usuario debe ser un entero positivo' });
      return;
    }
    const id = parsedId.data;

    // No permitir que un admin se elimine a sí mismo
    if (req.user && req.user.userId === id) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
      return;
    }

    const usuario = await usuariosService.deleteUsuario(id);
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ mensaje: 'Usuario eliminado exitosamente', usuario });
  } catch (err) {
    console.error('Error al eliminar usuario:', err instanceof Error ? err.message : err);
    res.status(503).json({ error: 'No se pudo escribir en PostgreSQL' });
  }
};
