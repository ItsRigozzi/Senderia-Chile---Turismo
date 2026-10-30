export interface DestinationCoordinates {
  latitud: number;
  longitud: number;
}

type GeoapifyResult = {
  lat?: number;
  lon?: number;
  country_code?: string;
};

type GeoapifyResponse = {
  results?: GeoapifyResult[];
};

export class GeocodingError extends Error {
  constructor(
    public readonly code: 'not_configured' | 'provider_unavailable',
    message: string,
  ) {
    super(message);
    this.name = 'GeocodingError';
  }
}

const coordinateCache = new Map<string, DestinationCoordinates>();

const normalizeQuery = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');

/**
 * Busca coordenadas de un destino nuevo sin enviarlas al navegador.
 * Se cachean resultados para no gastar créditos al repetir el mismo nombre.
 */
export async function geocodeDestination(nombre: string, region: string): Promise<DestinationCoordinates | null> {
  const cacheKey = `${normalizeQuery(nombre)}|${normalizeQuery(region)}`;
  const cachedCoordinates = coordinateCache.get(cacheKey);
  if (cachedCoordinates) return cachedCoordinates;

  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) {
    throw new GeocodingError(
      'not_configured',
      'Falta configurar GEOAPIFY_API_KEY en backend/.env para ubicar destinos solo por nombre.',
    );
  }

  const url = new URL('https://api.geoapify.com/v1/geocode/search');
  url.searchParams.set('text', `${nombre}, ${region}, Chile`);
  url.searchParams.set('filter', 'countrycode:cl');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lang', 'es');
  url.searchParams.set('limit', '5');
  url.searchParams.set('apiKey', apiKey);

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new GeocodingError('provider_unavailable', 'Geoapify no respondió. Intenta nuevamente o ingresa las coordenadas manualmente.');
  }

  if (!response.ok) {
    throw new GeocodingError('provider_unavailable', `Geoapify respondió con estado ${response.status}. Revisa la clave o intenta más tarde.`);
  }

  let data: GeoapifyResponse;
  try {
    data = await response.json() as GeoapifyResponse;
  } catch {
    throw new GeocodingError('provider_unavailable', 'Geoapify devolvió una respuesta inválida. Intenta nuevamente o ingresa las coordenadas manualmente.');
  }

  const result = data.results?.find((candidate) =>
    candidate.country_code === 'cl'
      && Number.isFinite(candidate.lat)
      && Number.isFinite(candidate.lon)
      && candidate.lat! >= -90
      && candidate.lat! <= 90
      && candidate.lon! >= -180
      && candidate.lon! <= 180,
  );

  if (!result || typeof result.lat !== 'number' || typeof result.lon !== 'number') return null;

  const coordinates = { latitud: result.lat, longitud: result.lon };
  coordinateCache.set(cacheKey, coordinates);
  return coordinates;
}
