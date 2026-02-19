# Skill: Reddit — Monitorización de subreddits

## Qué hace
Escanea subreddits relevantes para VertexAura buscando posts sobre AI agents, automation, y temas de negocio.

## Herramienta
`scripts/reddit.sh` — wrapper sobre Reddit JSON API (sin auth, público)

## Comandos

### `top <subreddit> [limit] [timeframe]`
Top posts de un subreddit.
- **timeframe**: hour, day, week, month, year, all (default: day)
- **Output**: JSON array con title, author, score, comments, url, permalink

### `search "<query>" [limit]`
Búsqueda global en Reddit.
- **Output**: JSON array de posts relevantes

### `scan`
Escanea TODOS los subreddits configurados en `config.json`.
- **Output**: JSON array agrupado por subreddit

## Config
`skills/reddit/config.json` — lista de subreddits, límites

## Datos
`data/reddit/YYYY-MM-DD/` — outputs guardados por fecha

## Subreddits monitorizados
- r/artificial — AI general
- r/MachineLearning — investigación ML
- r/LocalLLaMA — modelos locales
- r/ClaudeAI — Claude/Anthropic
- r/ChatGPT — OpenAI/ChatGPT
- r/SaaS — SaaS business
- r/startups — startups
- r/marketing — marketing digital

## Instrucciones de uso
1. Lee `config/keywords_tiers.json` para saber qué buscar
2. Usa `scan` para un escaneo completo de todos los subreddits
3. Usa `search` para keywords específicos de tier 1-2
4. Filtra resultados por score >10 para calidad
5. Guarda hallazgos relevantes en el resultado de la tarea
