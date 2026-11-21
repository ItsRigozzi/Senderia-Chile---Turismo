import { Request, Response } from 'express';
import { idParamSchema, usuarioUpdateSchema } from '../validators/schemas.js';
import * as usuariosService from '../services/usuarios.service.js';
import { sendServerError } from '../middleware/errorHandler.js';

export const getUsuarios = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await usuariosService.listUsuarios();
    res.json({ usuarios });
  } catch (err) {
    sendServerError(res, err, 'Error al obtener usuarios:', 'No se pudo consultar PostgreSQL');
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
    const id = parsedId.data;

    // Un administrador no puede quitarse el rol a sí mismo.
    if (parsed.data.rol && parsed.data.rol !== 'admin' && req.user?.userId === id) {
      res.status(400).json({ error: 'No puedes quitarte el rol de administrador a ti mismo', code: 'SELF_DEMOTION' });
      return;
    }

    const result = await usuariosService.updateUsuario(id, parsed.data);
    if (result === 'LAST_ADMIN') {
      res.status(409).json({ error: 'No se puede quitar el rol al último administrador', code: 'LAST_ADMIN' });
      return;
    }
    const usuario = result;
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ mensaje: 'Usuario actualizado exitosamente', usuario });
  } catch (err) {
    sendServerError(res, err, 'Error al actualizar usuario:', 'No se pudo escribir en PostgreSQL');
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

    const result = await usuariosService.deleteUsuario(id);
    if (result === 'LAST_ADMIN') {
      res.status(409).json({ error: 'No se puede eliminar al último administrador', code: 'LAST_ADMIN' });
      return;
    }
    const usuario = result;
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json({ mensaje: 'Usuario eliminado exitosamente', usuario });
  } catch (err) {
    sendServerError(res, err, 'Error al eliminar usuario:', 'No se pudo escribir en PostgreSQL');
  }
};
