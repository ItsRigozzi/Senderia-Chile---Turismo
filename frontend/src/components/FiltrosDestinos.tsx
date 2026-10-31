import React from 'react';
import { IonCheckbox } from '@ionic/react';
import type { Categoria, DestinoFiltros, Region } from '../services/api';

export type FiltroDestino = keyof DestinoFiltros;

interface OpcionFiltro {
  slug: string;
  nombre: string;
}

interface FiltrosDestinosProps {
  regiones: Region[];
  categorias: Categoria[];
  seleccion: DestinoFiltros;
  activos: number;
  onToggle: (filtro: FiltroDestino, slug: string) => void;
  onLimpiar: () => void;
  error?: string;
  // 'oscuro' adapta los colores a fondos oscuros, como la barra lateral del panel admin.
  variante?: 'claro' | 'oscuro';
}

const GrupoFiltro: React.FC<{
  titulo: string;
  filtro: FiltroDestino;
  opciones: OpcionFiltro[];
  seleccionados: string[];
  onToggle: FiltrosDestinosProps['onToggle'];
}> = ({ titulo, filtro, opciones, seleccionados, onToggle }) => (
  <fieldset className="filtros-destinos-grupo">
    <legend>
      {titulo}
      {seleccionados.length > 0 && <span className="filtros-destinos-grupo-contador">{seleccionados.length}</span>}
    </legend>
    {opciones.map((opcion) => (
      <IonCheckbox
        key={opcion.slug}
        className="filtros-destinos-opcion"
        labelPlacement="end"
        justify="start"
        checked={seleccionados.includes(opcion.slug)}
        onIonChange={() => onToggle(filtro, opcion.slug)}
      >
        {opcion.nombre}
      </IonCheckbox>
    ))}
  </fieldset>
);

const FiltrosDestinos: React.FC<FiltrosDestinosProps> = ({
  regiones, categorias, seleccion, activos, onToggle, onLimpiar, error, variante = 'claro',
}) => {
  return (
    <div className={`filtros-destinos${variante === 'oscuro' ? ' filtros-destinos--oscuro' : ''}`}>
      <div className="filtros-destinos-header">
        <span className="filtros-destinos-titulo">
          Filtros
          <span className="filtros-destinos-contador" aria-live="polite">
            {activos === 0 ? 'Ninguno activo' : `${activos} ${activos === 1 ? 'activo' : 'activos'}`}
          </span>
        </span>
        <button type="button" className="filtros-destinos-limpiar" onClick={onLimpiar} disabled={activos === 0}>
          Limpiar filtros
        </button>
      </div>

      {error ? (
        <p className="filtros-destinos-error">{error}</p>
      ) : (
        <div className="filtros-destinos-grupos">
          <GrupoFiltro titulo="Tipo" filtro="categoria" opciones={categorias} seleccionados={seleccion.categoria} onToggle={onToggle} />
          <GrupoFiltro titulo="Región" filtro="region" opciones={regiones} seleccionados={seleccion.region} onToggle={onToggle} />
        </div>
      )}
    </div>
  );
};

export default FiltrosDestinos;
