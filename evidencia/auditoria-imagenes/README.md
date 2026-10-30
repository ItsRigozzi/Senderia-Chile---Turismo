# Auditoría visual inicial de imágenes SERNATUR

Se revisaron las miniaturas propuestas para los 480 candidatos de importación definidos en `backend/src/db/sernatur_carga_unica.sql`. La columna `estado_revision_visual` separa el tipo de imagen y la acción aplicada. Las URLs, autores y licencias originales quedan registradas en el CSV para poder reemplazar una imagen más adelante.

## Resultado

- 52 propuestas SVG son mapas (comunas, cuencas o ubicación), no fotos del atractivo.
- 2 propuestas SVG son una bandera o un escudo, no fotos del atractivo.
- 1 propuesta es una imagen satelital UMBRA, no una foto turística representativa.
- 309 miniaturas cargaron y parecen fotos; la revisión no comprueba que cada una corresponda exactamente al atractivo.
- 1 miniatura es un collage de varias fotos y requiere revisión editorial.
- 115 miniaturas quedaron pendientes porque Wikimedia respondió HTTP 429. Eso no significa que les falte imagen ni que la URL sea inválida.

## Cambio en la importación

El SQL conserva cada destino, sus coordenadas y los datos fuente. Para SVG y para el registro satelital identificado, limpia de forma reversible la URL de imagen pública y su atribución en `public.destinos`; la miniatura alternativa ya existente en el frontend cubre ese caso. La candidata y sus datos originales siguen en `public.sernatur_destinos_revision`. Si alguien reemplazó manualmente una imagen pública, el SQL solo la limpia cuando todavía coincide con la URL candidata original.

No se eliminaron filas ni se descargaron/reutilizaron fotos del Banco Audiovisual de SERNATUR. Las filas marcadas como pendientes o foto visible siguen requiriendo validación editorial y revisión de permisos/atribución.

## Fotografías adjuntas y créditos

Las cuatro imágenes locales y sus créditos CC están documentados en [creditos-reemplazos.md](creditos-reemplazos.md). Las URLs locales se aplican al ejecutar `sernatur_carga_unica.sql`; las imágenes están dentro de `frontend/public/images/destinos/sernatur/`.

## Archivo de datos

`revision-visual-candidatos-sernatur.csv` contiene los 480 registros, resultado, acción, nombre/código, URL candidata, autor, licencia y fuente de Wikipedia.
