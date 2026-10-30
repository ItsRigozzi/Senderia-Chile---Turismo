import pool from '../config/db.js';
import type { QueryResultRow } from 'pg';

type SourceAttraction = QueryResultRow & {
  cod_atrac: string;
  nombre: string;
  region: string;
  comuna: string;
  provincia: string;
  descripcion: string | null;
};

type WikiPage = {
  pageid: number;
  title: string;
  extract?: string;
  thumbnail?: { source?: string };
  original?: { source?: string };
  pageprops?: { wikibase_item?: string };
  pageimage?: string;
  index?: number;
};

type WikiSearchResponse = {
  query?: { pages?: WikiPage[] };
};

type CommonsImageInfo = {
  url?: string;
  descriptionurl?: string;
  thumburl?: string;
  extmetadata?: Record<string, { value?: string; source?: string }>;
};

const WIKIPEDIA_API = 'https://es.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = process.env.WIKIMEDIA_USER_AGENT
  || 'SenderiaChileEnrichment/1.0 (https://github.com/ItsRigozzi/Senderia-Chile---Turismo)';
const configuredDelay = Number(process.env.WIKIMEDIA_DELAY_MS || 350);
const MIN_REQUEST_INTERVAL_MS = Number.isFinite(configuredDelay) ? Math.max(300, configuredDelay) : 350;
const MAX_RETRIES = 5;

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-CL')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function similarity(sourceName: string, pageTitle: string): number {
  const source = normalize(sourceName);
  const title = normalize(pageTitle);
  if (!source || !title) return 0;
  if (source === title) return 1;

  const sourceTokens = new Set(source.split(' ').filter((token) => token.length > 2));
  const titleTokens = new Set(title.split(' ').filter((token) => token.length > 2));
  if (sourceTokens.size === 0 || titleTokens.size === 0) return 0;
  const intersection = [...sourceTokens].filter((token) => titleTokens.has(token)).length;
  return intersection / Math.max(sourceTokens.size, titleTokens.size);
}

function metadataValue(metadata: CommonsImageInfo['extmetadata'], key: string): string | null {
  const value = metadata?.[key]?.value?.trim();
  return value ? value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : null;
}

function queryUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function requestJson<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const waitForSlot = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (waitForSlot > 0) await sleep(waitForSlot);
    lastRequestAt = Date.now();

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(25_000),
    });

    if (response.ok) return response.json() as Promise<T>;

    if ((response.status === 429 || response.status === 503) && attempt < MAX_RETRIES) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.max(5_000, 2 ** attempt * 1_000);
      await sleep(backoff);
      continue;
    }

    throw new Error(`Wikimedia respondió HTTP ${response.status}`);
  }

  throw new Error('Se agotaron los reintentos de Wikimedia');
}

async function findWikipediaPages(place: SourceAttraction): Promise<WikiPage[]> {
  const queries = [
    [`"${place.nombre}"`, place.comuna].filter(Boolean).join(' '),
    `"${place.nombre}"`,
  ];
  const results = new Map<number, WikiPage>();

  for (const searchText of [...new Set(queries)]) {
    const url = queryUrl(WIKIPEDIA_API, {
      action: 'query',
      generator: 'search',
      gsrsearch: searchText,
      gsrlimit: '8',
      prop: 'extracts|pageimages|pageprops',
      exintro: '1',
      explaintext: '1',
      exchars: '5000',
      piprop: 'thumbnail|original|name',
      pithumbsize: '1400',
      pilicense: 'free',
      ppprop: 'wikibase_item',
      redirects: '1',
      format: 'json',
      formatversion: '2',
    });

    const response = await requestJson<WikiSearchResponse>(url);
    const pages = response.query?.pages ?? [];
    for (const page of pages) results.set(page.pageid, page);

    // The name + commune search may return unrelated pages. Keep looking
    // with the place name alone so those results don't hide a better match.
    if (pages.some((page) => similarity(place.nombre, page.title) === 1)) break;
  }

  return [...results.values()].sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
}

async function getCommonsImageInfo(fileName: string): Promise<CommonsImageInfo | null> {
  const title = fileName.startsWith('File:') ? fileName : `File:${fileName}`;
  const url = queryUrl(COMMONS_API, {
    action: 'query',
    titles: title,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1400',
    iiextmetadatalanguage: 'es',
    iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|AttributionRequired',
    format: 'json',
    formatversion: '2',
  });

  const response = await requestJson<{
    query?: { pages?: Array<{ imageinfo?: CommonsImageInfo[] }> };
  }>(url);
  return response.query?.pages?.[0]?.imageinfo?.[0] ?? null;
}

async function ensureProposalTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.sernatur_wikimedia_propuestas (
      cod_atrac TEXT PRIMARY KEY REFERENCES public.sernatur_atractivos_fuente(cod_atrac) ON DELETE CASCADE,
      estado_coincidencia TEXT NOT NULL CHECK (estado_coincidencia IN ('coincidencia_exacta', 'revisar', 'sin_resultado', 'error')),
      puntaje_coincidencia NUMERIC(5,4),
      titulo_wikipedia TEXT,
      url_wikipedia TEXT,
      wikidata_qid TEXT,
      descripcion_wikipedia TEXT,
      imagen_url TEXT,
      imagen_archivo TEXT,
      imagen_url_fuente TEXT,
      imagen_autor TEXT,
      imagen_credito TEXT,
      imagen_licencia TEXT,
      imagen_url_licencia TEXT,
      candidatos JSONB NOT NULL DEFAULT '[]'::jsonb,
      horario_sugerido TEXT,
      condiciones_acceso_sugeridas TEXT,
      campos_operacionales_pendientes BOOLEAN NOT NULL DEFAULT TRUE,
      error TEXT,
      consultado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function saveError(codAtrac: string, error: unknown): Promise<void> {
  await pool.query(
    `INSERT INTO public.sernatur_wikimedia_propuestas
      (cod_atrac, estado_coincidencia, error, consultado_en)
     VALUES ($1, 'error', $2, CURRENT_TIMESTAMP)
     ON CONFLICT (cod_atrac) DO UPDATE SET
       estado_coincidencia = 'error', error = EXCLUDED.error,
       consultado_en = CURRENT_TIMESTAMP`,
    [codAtrac, error instanceof Error ? error.message : String(error)],
  );
}

async function enrich(place: SourceAttraction): Promise<string> {
  const pages = await findWikipediaPages(place);
  const ranked = pages
    .map((page) => ({ page, score: similarity(place.nombre, page.title) }))
    .sort((a, b) => b.score - a.score || (a.page.index ?? 999) - (b.page.index ?? 999));
  const best = ranked[0];

  if (!best || best.score < 0.2) {
    await pool.query(
      `INSERT INTO public.sernatur_wikimedia_propuestas
        (cod_atrac, estado_coincidencia, candidatos, consultado_en)
       VALUES ($1, 'sin_resultado', $2::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (cod_atrac) DO UPDATE SET
         estado_coincidencia = 'sin_resultado', candidatos = EXCLUDED.candidatos,
         error = NULL, consultado_en = CURRENT_TIMESTAMP`,
      [place.cod_atrac, JSON.stringify(ranked.map(({ page, score }) => ({ titulo: page.title, puntaje: score })))],
    );
    return 'sin_resultado';
  }

  const page = best.page;
  const exact = best.score === 1;
  let imageInfo: CommonsImageInfo | null = null;
  const imageName = page.pageimage;
  if (imageName) imageInfo = await getCommonsImageInfo(imageName);

  const wikiUrl = `https://es.wikipedia.org/?curid=${page.pageid}`;
  const metadata = imageInfo?.extmetadata;
  const imageUrl = imageInfo?.thumburl || imageInfo?.url || page.thumbnail?.source || page.original?.source || null;
  const candidates = ranked.map(({ page: candidate, score }) => ({
    titulo: candidate.title,
    url: `https://es.wikipedia.org/?curid=${candidate.pageid}`,
    puntaje: score,
  }));

  await pool.query(
    `INSERT INTO public.sernatur_wikimedia_propuestas (
       cod_atrac, estado_coincidencia, puntaje_coincidencia, titulo_wikipedia,
       url_wikipedia, wikidata_qid, descripcion_wikipedia, imagen_url,
       imagen_archivo, imagen_url_fuente, imagen_autor, imagen_credito,
       imagen_licencia, imagen_url_licencia, candidatos, campos_operacionales_pendientes,
       error, consultado_en
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, TRUE, NULL, CURRENT_TIMESTAMP
     )
     ON CONFLICT (cod_atrac) DO UPDATE SET
       estado_coincidencia = EXCLUDED.estado_coincidencia,
       puntaje_coincidencia = EXCLUDED.puntaje_coincidencia,
       titulo_wikipedia = EXCLUDED.titulo_wikipedia,
       url_wikipedia = EXCLUDED.url_wikipedia,
       wikidata_qid = EXCLUDED.wikidata_qid,
       descripcion_wikipedia = EXCLUDED.descripcion_wikipedia,
       imagen_url = EXCLUDED.imagen_url,
       imagen_archivo = EXCLUDED.imagen_archivo,
       imagen_url_fuente = EXCLUDED.imagen_url_fuente,
       imagen_autor = EXCLUDED.imagen_autor,
       imagen_credito = EXCLUDED.imagen_credito,
       imagen_licencia = EXCLUDED.imagen_licencia,
       imagen_url_licencia = EXCLUDED.imagen_url_licencia,
       candidatos = EXCLUDED.candidatos,
       campos_operacionales_pendientes = TRUE,
       error = NULL,
       consultado_en = CURRENT_TIMESTAMP`,
    [
      place.cod_atrac,
      exact ? 'coincidencia_exacta' : 'revisar',
      best.score,
      page.title,
      wikiUrl,
      page.pageprops?.wikibase_item ?? null,
      page.extract?.trim() || null,
      imageUrl,
      imageName ?? null,
      imageInfo?.descriptionurl ?? null,
      metadataValue(metadata, 'Artist'),
      metadataValue(metadata, 'Credit'),
      metadataValue(metadata, 'LicenseShortName'),
      metadataValue(metadata, 'LicenseUrl'),
      JSON.stringify(candidates),
    ],
  );

  return exact ? 'coincidencia_exacta' : 'revisar';
}

function getOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  if (process.argv.includes('--import-fuente')) {
    const { readFile } = await import('node:fs/promises');
    const { resolve } = await import('node:path');
    const sourceSql = resolve(process.cwd(), 'src/db/sernatur_carga_unica.sql');
    console.log(`Ejecutando la carga SERNATUR integrada para restaurar la fuente desde ${sourceSql}...`);
    await pool.query(await readFile(sourceSql, 'utf8'));
  }

  await ensureProposalTable();
  const limit = Number(getOption('limit') || 0);
  if (!Number.isFinite(limit) || limit < 0) throw new Error('--limit debe ser un entero positivo o 0 para procesar todos');
  const retryNoResult = process.argv.includes('--revisar-sin-resultado');
  const retryNoResultClause = retryNoResult ? "OR w.estado_coincidencia = 'sin_resultado'" : '';

  const pending = await pool.query<SourceAttraction>(
    `SELECT s.cod_atrac, s.nombre, s.region, s.comuna, s.provincia, s.descripcion
     FROM public.sernatur_atractivos_fuente s
     LEFT JOIN public.sernatur_wikimedia_propuestas w ON w.cod_atrac = s.cod_atrac
     WHERE w.cod_atrac IS NULL OR w.estado_coincidencia = 'error' ${retryNoResultClause}
     ORDER BY s.cod_atrac
     ${limit > 0 ? 'LIMIT $1' : ''}`,
    limit > 0 ? [limit] : [],
  );

  if (pending.rowCount === 0) {
    console.log('No hay registros pendientes de enriquecimiento.');
    return;
  }

  console.log(`Se procesarán ${pending.rowCount} registros. Se guardará el avance por destino y podrá reanudarse al volver a ejecutar el comando.`);
  const counts: Record<string, number> = {};

  for (let index = 0; index < pending.rows.length; index += 1) {
    const place = pending.rows[index];
    try {
      const status = await enrich(place);
      counts[status] = (counts[status] ?? 0) + 1;
      console.log(`[${index + 1}/${pending.rows.length}] ${place.nombre} (${place.cod_atrac}): ${status}`);
    } catch (error) {
      await saveError(place.cod_atrac, error);
      counts.error = (counts.error ?? 0) + 1;
      console.error(`[${index + 1}/${pending.rows.length}] ${place.nombre} (${place.cod_atrac}): error; se reintentará en la próxima ejecución.`);
    }
  }

  console.log('Resumen:', counts);
}

main()
  .catch((error) => {
    console.error('No se pudo completar el enriquecimiento:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
