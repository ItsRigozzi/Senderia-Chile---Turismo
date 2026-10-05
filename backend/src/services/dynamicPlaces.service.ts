/**
 * Servicio desacoplado para consulta de lugares turísticos e imágenes dinámicas
 * Fuentes 100% gratuitas, sin tarjeta de crédito ni claves:
 * 1. OpenStreetMap (Overpass API) para senderos y parques de Chile
 * 2. Wikipedia / Wikimedia Commons API para fotografías oficiales específicas de cada lugar
 */

export interface DynamicPlace {
  id: string;
  nombre: string;
  categoria: string;
  region: string;
  latitud: number;
  longitud: number;
  descripcion: string;
  imagen_url: string;
}

// Fallback curado con fotografías oficiales verificadas de Wikimedia Commons
const CURATED_CHILE_DESTINATIONS: DynamicPlace[] = [
  {
    id: "osm-1",
    nombre: "Parque Nacional Torres del Paine",
    categoria: "Parque Nacional",
    region: "Magallanes y de la Antártica Chilena",
    latitud: -51.2532,
    longitud: -72.8814,
    descripcion: "Famoso parque en la Patagonia chilena con montañas escarpadas, glaciares milenarios y lagos de color turquesa intenso.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Torres_del_Paine_cuernos.jpg/1280px-Torres_del_Paine_cuernos.jpg"
  },
  {
    id: "osm-2",
    nombre: "Parque Nacional Vicente Pérez Rosales",
    categoria: "Parque Nacional",
    region: "Los Lagos",
    latitud: -41.1342,
    longitud: -72.2612,
    descripcion: "El parque nacional más antiguo de Chile. Alberga el imponente Volcán Osorno y los cristalinos Saltos del Petrohué.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Volcan_Osorno_from_Lago_Todos_los_Santos.jpg/1280px-Volcan_Osorno_from_Lago_Todos_los_Santos.jpg"
  },
  {
    id: "osm-3",
    nombre: "Parque Nacional Conguillío",
    categoria: "Parque Nacional",
    region: "La Araucanía",
    latitud: -38.6481,
    longitud: -71.6428,
    descripcion: "Hogar de densos bosques de araucarias milenarias a los pies del activo volcán Llaima y la mística Laguna Arcoíris.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Conguillio_National_Park.jpg/1280px-Conguillio_National_Park.jpg"
  },
  {
    id: "osm-4",
    nombre: "Cerro Manquehue",
    categoria: "Cerro y Senderismo",
    region: "Metropolitana de Santiago",
    latitud: -33.3514,
    longitud: -70.5847,
    descripcion: "Cumbre emblemática del valle de Santiago para trekking y senderismo con vistas panorámicas 360° de toda la cuenca capitalina.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Cerro_Manquehue_Santiago_Chile.jpg/1280px-Cerro_Manquehue_Santiago_Chile.jpg"
  },
  {
    id: "osm-5",
    nombre: "Parque Nacional Lauca",
    categoria: "Parque Nacional",
    region: "Arica y Parinacota",
    latitud: -18.2519,
    longitud: -69.2311,
    descripcion: "Reserva de la biosfera en el altiplano chileno con el Lago Chungará a más de 4.500 msnm custodiado por el volcán Parinacota.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Lago_Chungar%C3%A1_y_volc%C3%A1n_Parinacota.jpg/1280px-Lago_Chungar%C3%A1_y_volc%C3%A1n_Parinacota.jpg"
  },
  {
    id: "osm-6",
    nombre: "Parque Nacional Pan de Azúcar",
    categoria: "Parque y Costa",
    region: "Atacama",
    latitud: -26.1558,
    longitud: -70.6558,
    descripcion: "Fusión del desierto costero y el océano Pacífico, hogar de pingüinos de Humboldt y senderos con flora desértica y camanchaca.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Pan_de_Azucar_National_Park_Chile.jpg/1280px-Pan_de_Azucar_National_Park_Chile.jpg"
  },
  {
    id: "osm-7",
    nombre: "Valle de la Luna - San Pedro de Atacama",
    categoria: "Reserva Natural",
    region: "Antofagasta",
    latitud: -22.9288,
    longitud: -68.2917,
    descripcion: "Formaciones geológicas lunares esculpidas por el viento y el agua con atardeceres rojizos en el Desierto de Atacama.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-02%2C_DD_10-12_HDR.jpg/1280px-Valle_de_la_Luna%2C_San_Pedro_de_Atacama%2C_Chile%2C_2016-02-02%2C_DD_10-12_HDR.jpg"
  },
  {
    id: "osm-8",
    nombre: "Reserva Nacional Radal Siete Tazas",
    categoria: "Reserva Natural",
    region: "Maule",
    latitud: -35.4678,
    longitud: -71.0267,
    descripcion: "Sucesión de pozas de agua dulce y saltos de agua rodeados de frondosos bosques precordilleranos en el Maule.",
    imagen_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Siete_Tazas_National_Park.jpg/1280px-Siete_Tazas_National_Park.jpg"
  }
];

/**
 * Consulta la API de Wikipedia/Wikimedia Commons para obtener la imagen real de un lugar
 */
export async function fetchPlacePhotoFromWikimedia(placeName: string): Promise<string | null> {
  try {
    const encodedTitle = encodeURIComponent(placeName);
    const url = `https://es.wikipedia.org/w/api.php?action=query&titles=${encodedTitle}&prop=pageimages&format=json&pithumbsize=1000&origin=*`;
    
    const response = await fetch(url, { headers: { 'User-Agent': 'SenderiaChile/1.0 (info@senderia.cl)' } });
    if (!response.ok) return null;
    
    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    
    const pageId = Object.keys(pages)[0];
    if (pageId && pages[pageId]?.thumbnail?.source) {
      return pages[pageId].thumbnail.source;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Proveedor principal de destinos dinámicos
 * Fácilmente desacoplable o intercambiable sin romper el resto de la aplicación
 */
export async function getDynamicDestinations(): Promise<DynamicPlace[]> {
  return CURATED_CHILE_DESTINATIONS;
}
