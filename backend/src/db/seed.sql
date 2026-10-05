-- =========================================
-- Senderia Chile - Datos iniciales (Seed)
-- =========================================

-- Regiones de Chile
INSERT INTO regiones (nombre, slug) VALUES
  ('Arica y Parinacota', 'arica-y-parinacota'),
  ('Tarapacá', 'tarapaca'),
  ('Antofagasta', 'antofagasta'),
  ('Atacama', 'atacama'),
  ('Coquimbo', 'coquimbo'),
  ('Valparaíso', 'valparaiso'),
  ('Metropolitana', 'metropolitana'),
  ('O''Higgins', 'ohiggins'),
  ('Maule', 'maule'),
  ('Ñuble', 'nuble'),
  ('Biobío', 'biobio'),
  ('La Araucanía', 'la-araucania'),
  ('Los Ríos', 'los-rios'),
  ('Los Lagos', 'los-lagos'),
  ('Aysén', 'aysen'),
  ('Magallanes', 'magallanes')
-- Puede existir ya el nombre o el slug si una ejecución anterior cargó
-- parcialmente el seed. Ignorar cualquier conflicto único hace repetible
-- la inicialización.
ON CONFLICT DO NOTHING;

-- Categorías
INSERT INTO categorias (nombre, slug, descripcion) VALUES
  ('Parque Nacional', 'parque-nacional', 'Áreas protegidas con biodiversidad y paisajes naturales.'),
  ('Playa', 'playa', 'Destinos costeros y balnearios.'),
  ('Montaña', 'montana', 'Cerros, volcanes y rutas de trekking.'),
  ('Desierto', 'desierto', 'Paisajes desérticos y formaciones geológicas.'),
  ('Patrimonio', 'patrimonio', 'Sitios declarados patrimonio cultural o histórico.'),
  ('Termas', 'termas', 'Aguas termales y centros de relajación.'),
  ('Museo', 'museo', 'Museos y espacios culturales.'),
  ('Lago', 'lago', 'Lagos y lagunas con actividades recreativas.')
ON CONFLICT DO NOTHING;

-- Destinos de ejemplo
INSERT INTO destinos (nombre, descripcion, categoria_id, region_id, latitud, longitud, horario, condiciones_acceso, imagen_url) VALUES
  (
    'Parque Nacional Torres del Paine',
    'Uno de los parques nacionales más emblemáticos de Chile, famoso por sus torres de granito, glaciares y lagos de color turquesa.',
    (SELECT id FROM categorias WHERE slug = 'parque-nacional'),
    (SELECT id FROM regiones WHERE slug = 'magallanes'),
    -51.253194, -72.881389,
    '8:30 - 20:00 (verano) / 8:30 - 18:00 (invierno)',
    'Se requiere reserva previa en temporada alta. Entrada pagada.',
    '/images/destinos/torres-del-paine.jpg'
  ),
  (
    'Valle de la Luna',
    'Formación geológica en el desierto de Atacama con paisajes lunares, dunas y cuevas de sal.',
    (SELECT id FROM categorias WHERE slug = 'desierto'),
    (SELECT id FROM regiones WHERE slug = 'antofagasta'),
    -22.923904, -68.282418,
    '8:00 - 19:00',
    'Llevar agua y protección solar. Caminos de tierra.',
    '/images/destinos/valle-de-la-luna.jpg'
  ),
  (
    'Cerros de Valparaíso',
    'Coloridos cerros con arte callejero, ascensores patrimoniales y vistas al puerto.',
    (SELECT id FROM categorias WHERE slug = 'patrimonio'),
    (SELECT id FROM regiones WHERE slug = 'valparaiso'),
    -33.039765, -71.631610,
    'Acceso libre',
    'Usar calzado cómodo. Precaución en calles empinadas.',
    '/images/destinos/cerros-valparaiso.jpg'
  ),
  (
    'Termas Geométricas',
    'Conjunto de 17 pozones de aguas termales entre bosque nativo, con pasarelas de madera y diseño arquitectónico único.',
    (SELECT id FROM categorias WHERE slug = 'termas'),
    (SELECT id FROM regiones WHERE slug = 'los-rios'),
    -39.501939, -71.874940,
    '10:00 - 20:00',
    'Reserva anticipada recomendada. Estacionamiento disponible.',
    '/images/destinos/termas-geometricas.jpg'
  ) ON CONFLICT (nombre, region_id) DO UPDATE
    SET imagen_url = EXCLUDED.imagen_url,
        updated_at = CURRENT_TIMESTAMP;

-- Por seguridad, el seed no crea administradores con contraseñas conocidas.
-- Cree el primer administrador mediante el comando documentado en README.md.
