import { mkdirSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { sugerenciasImagenesDirectory } from '../config/uploads.js';

const maxImageBytes = 5 * 1024 * 1024;
const extensionByMime: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

mkdirSync(sugerenciasImagenesDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: sugerenciasImagenesDirectory,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extensionByMime[file.mimetype] || '.img'}`);
    },
  }),
  limits: { fileSize: maxImageBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!extensionByMime[file.mimetype]) {
      callback(new Error('Formato no permitido. Sube una imagen JPG, PNG o WebP.'));
      return;
    }
    callback(null, true);
  },
});

const matchesImageSignature = (bytes: Buffer, mimeType: string): boolean => {
  if (mimeType === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimeType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/webp') {
    return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
};

const removeUploadedFile = async (filePath: string): Promise<void> => {
  await unlink(filePath).catch(() => undefined);
};

export const receiveSugerenciaImagen = (req: Request, res: Response, next: NextFunction): void => {
  upload.single('imagen')(req, res, async (error: unknown) => {
    if (error) {
      const tooLarge = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE';
      res.status(tooLarge ? 413 : 400).json({
        error: tooLarge
          ? 'La imagen supera el máximo permitido de 5 MB.'
          : error instanceof Error ? error.message : 'No se pudo recibir la imagen.',
      });
      return;
    }

    if (!req.file) {
      next();
      return;
    }

    try {
      const bytes = await readFile(req.file.path);
      if (!matchesImageSignature(bytes, req.file.mimetype)) {
        await removeUploadedFile(req.file.path);
        res.status(400).json({ error: 'El archivo no coincide con una imagen JPG, PNG o WebP válida.' });
        return;
      }
      next();
    } catch {
      await removeUploadedFile(req.file.path);
      res.status(400).json({ error: 'No se pudo leer el archivo de imagen.' });
    }
  });
};

export { removeUploadedFile };
