export interface DestinoBuscable {
  nombre: string;
  region_nombre: string;
}

// Ignora mayúsculas, tildes y espacios repetidos para comparar textos.
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// Un destino coincide si su nombre contiene el texto o si el texto es exactamente el nombre de su región.
export function coincideBusquedaDestino(destino: DestinoBuscable, busqueda: string): boolean {
  const termino = normalizarTexto(busqueda);
  if (!termino) return true;
  return normalizarTexto(destino.nombre).includes(termino)
    || normalizarTexto(destino.region_nombre) === termino;
}
