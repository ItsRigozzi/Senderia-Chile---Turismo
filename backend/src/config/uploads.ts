import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// La ruta relativa funciona tanto desde src/ durante desarrollo como desde dist/ en producción.
export const sugerenciasImagenesDirectory = path.resolve(
  currentDirectory,
  '../../uploads/sugerencias-imagenes',
);
