import { describe, expect, it } from 'vitest';
import { coincideBusquedaDestino, normalizarTexto } from './busquedaDestinos';

const lagoLlanquihue = { nombre: 'Lago Llanquihue', region_nombre: 'Los Lagos' };
const puertoVaras = { nombre: 'Puerto Varas', region_nombre: 'Los Lagos' };
const lagoPenuelas = { nombre: 'Lago Peñuelas', region_nombre: 'Valparaíso' };
const cerrosValparaiso = { nombre: 'Cerros de Valparaíso', region_nombre: 'Valparaíso' };

describe('normalizarTexto', () => {
  it('ignora mayúsculas, tildes y espacios repetidos', () => {
    expect(normalizarTexto('  Región   de  VALPARAÍSO ')).toBe('region de valparaiso');
  });
});

describe('coincideBusquedaDestino', () => {
  it('busca por nombre sin coincidir parcialmente con la región', () => {
    expect(coincideBusquedaDestino(lagoLlanquihue, 'Lago')).toBe(true);
    expect(coincideBusquedaDestino(lagoPenuelas, 'lago')).toBe(true);
    expect(coincideBusquedaDestino(puertoVaras, 'Lago')).toBe(false);
    expect(coincideBusquedaDestino(puertoVaras, 'Lagos')).toBe(false);
  });

  it('muestra todos los destinos de una región cuando el texto es su nombre exacto', () => {
    expect(coincideBusquedaDestino(puertoVaras, 'los lagos')).toBe(true);
    expect(coincideBusquedaDestino(lagoLlanquihue, 'Los Lagos')).toBe(true);
    expect(coincideBusquedaDestino(lagoPenuelas, 'Los Lagos')).toBe(false);
  });

  it('no distingue tildes en el nombre ni en la región', () => {
    expect(coincideBusquedaDestino(lagoPenuelas, 'valparaiso')).toBe(true);
    expect(coincideBusquedaDestino(cerrosValparaiso, 'VALPARAISO')).toBe(true);
    expect(coincideBusquedaDestino(lagoPenuelas, 'penuelas')).toBe(true);
  });

  it('acepta cualquier destino cuando la búsqueda está vacía', () => {
    expect(coincideBusquedaDestino(puertoVaras, '')).toBe(true);
    expect(coincideBusquedaDestino(puertoVaras, '   ')).toBe(true);
  });
});
