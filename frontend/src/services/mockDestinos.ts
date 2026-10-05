export interface Destino {
  id: string;
  nombre: string;
  categoria: string;
  region: string;
  coordenadas: string;
  descripcion?: string;
  imagen_url?: string;
}

export const mockDestinos: Destino[] = [
  {
    id: "1",
    nombre: "Parque Nacional Torres del Paine",
    categoria: "Parque Nacional",
    region: "Magallanes",
    coordenadas: "-51.253194, -72.881389",
    descripcion: "Famoso parque en la Patagonia chilena con montañas escarpadas, glaciares milenarios y lagos de color turquesa intenso.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Torres_del_Paine_cuernos.jpg/1280px-Torres_del_Paine_cuernos.jpg"
  },
  {
    id: "2",
    nombre: "Valle de la Luna - Atacama",
    categoria: "Desierto",
    region: "Antofagasta",
    coordenadas: "-22.9239, -68.2824",
    descripcion: "Formaciones geológicas lunares esculpidas por el viento y el agua con atardeceres rojizos en el Desierto de Atacama.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-02%2C_DD_10-12_HDR.jpg/1280px-Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-02%2C_DD_10-12_HDR.jpg"
  },
  {
    id: "3",
    nombre: "Parque Nacional Vicente Pérez Rosales",
    categoria: "Parque Nacional",
    region: "Los Lagos",
    coordenadas: "-41.1342, -72.2612",
    descripcion: "El parque nacional más antiguo de Chile. Alberga el imponente Volcán Osorno y los cristalinos Saltos del Petrohué.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Volcan_Osorno_from_Lago_Todos_los_Santos.jpg/1280px-Volcan_Osorno_from_Lago_Todos_los_Santos.jpg"
  },
  {
    id: "4",
    nombre: "Cerro Manquehue",
    categoria: "Cerro y Senderismo",
    region: "Metropolitana",
    coordenadas: "-33.3514, -70.5847",
    descripcion: "Cumbre emblemática del valle de Santiago para trekking y senderismo con vistas panorámicas 360° de toda la cuenca capitalina.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Cerro_Manquehue_Santiago_Chile.jpg/1280px-Cerro_Manquehue_Santiago_Chile.jpg"
  },
  {
    id: "5",
    nombre: "Parque Nacional Conguillío",
    categoria: "Parque Nacional",
    region: "La Araucanía",
    coordenadas: "-38.6481, -71.6428",
    descripcion: "Hogar de densos bosques de araucarias milenarias a los pies del activo volcán Llaima y la mística Laguna Arcoíris.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Conguillio_National_Park.jpg/1280px-Conguillio_National_Park.jpg"
  },
  {
    id: "6",
    nombre: "Parque Nacional Pan de Azúcar",
    categoria: "Parque y Costa",
    region: "Atacama",
    coordenadas: "-26.1558, -70.6558",
    descripcion: "Fusión del desierto costero y el océano Pacífico, hogar de pingüinos de Humboldt y senderos con flora desértica y camanchaca.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Pan_de_Azucar_National_Park_Chile.jpg/1280px-Pan_de_Azucar_National_Park_Chile.jpg"
  }
];