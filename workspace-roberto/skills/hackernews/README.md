# Skill: HackerNews — Scanner de stories

## Qué hace
Busca stories relevantes en HackerNews usando la API de Algolia (pública, sin auth).

## Herramienta
`scripts/hackernews.sh` — wrapper sobre Algolia HN API

## Comandos

### `search "<query>" [limit]`
Busca stories recientes por query.
- **Output**: JSON array con title, author, points, num_comments, url, hn_url

### `top [limit]`
Front page actual de HackerNews.
- **Output**: JSON array de stories en portada

### `scan`
Busca TODAS las keywords de tier 1-2 del archivo `config/keywords_tiers.json`.
- **Output**: JSON agrupado por keyword

## API
- Base: `https://hn.algolia.com/api/v1/`
- `search_by_date` — buscar por fecha (más reciente primero)
- `search` — buscar por relevancia (front_page tag para top)
- Sin rate limits agresivos, pero no abusar

## Datos
`data/hackernews/YYYY-MM-DD/` — outputs guardados por fecha

## Instrucciones de uso
1. Lee `config/keywords_tiers.json` para las keywords
2. Usa `scan` para el escaneo completo con keywords tier 1-2
3. Usa `search` para keywords específicos
4. Filtra resultados por points >5 para calidad
5. Incluye `hn_url` en resultados (link a la discusión, no al artículo)
