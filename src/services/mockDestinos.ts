export interface Destino {
  id: string;
  nombre: string;
  categoria: string;
  region: string;
  coordenadas: string;
}

export const mockDestinos: Destino[] = [
  { id: "1", nombre: "Parque Nacional Torres del Paine", categoria: "Parque Nacional", region: "Magallanes", coordenadas: "-51.253194, -72.881389" },
  { id: "2", nombre: "Valle de la Luna", categoria: "Desierto", region: "Atacama", coordenadas: "-22.923904499780864, -68.28241849419143" },
  { id: "3", nombre: "Cerros de Valparaíso", categoria: "Patrimonio", region: "Valparaíso", coordenadas: "-33.039765258649965, -71.63160995600187" },
  { id: "4", nombre: "Termas Geométricas", categoria: "Termas", region: "Los Ríos", coordenadas: "-39.50193882881266, -71.8749401853986" }
];