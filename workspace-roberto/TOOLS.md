# TOOLS.md — Skills de Roberto

## Skills disponibles

### tasks (PRINCIPAL — ejecutar SIEMPRE primero)
- **Que hace**: Gestiona tareas de Supabase: leer pendientes, marcar progreso, guardar resultados
- **Instrucciones**: skills/tasks/README.md
- **Script**: scripts/tasks.sh
- **IMPORTANTE**: Esta skill se ejecuta ANTES que cualquier otra. El flujo es: fetch tareas → ejecutar la skill correspondiente al task_type → marcar resultado

### youtube
- **Qué hace**: Extrae metadatos, transcripciones y análisis de canales y vídeos de YouTube
- **Instrucciones**: skills/youtube/README.md
- **Config**: skills/youtube/config.json
- **Datos**: data/youtube/
- **Dependencias**: yt-dlp, youtube-transcript-api
- **Output**: engagement metrics, channel trends, content intelligence

### news
- **Qué hace**: Busca y recopila noticias relevantes via Google News RSS
- **Instrucciones**: skills/news/README.md
- **Config**: skills/news/config.json
- **Datos**: data/news/
- **Dependencias**: curl (para RSS), parser XML
- **Output**: artículos clasificados por relevance y category

### twitter
- **Qué hace**: Busca tweets, monitoriza keywords relevantes, detecta leads en español via Bird CLI
- **Instrucciones**: skills/twitter/README.md
- **Config**: skills/twitter/config.json
- **Datos**: data/twitter/
- **Dependencias**: bird CLI v0.8.0 (/opt/homebrew/bin/bird), Chrome profile "clawdbot"
- **Script**: scripts/twitter.sh
- **Comandos**: search, read, leads
- **Output**: tweets relevantes, leads potenciales, engagement metrics

### reddit
- **Qué hace**: Escanea subreddits relevantes buscando posts sobre AI agents, automation, negocio
- **Instrucciones**: skills/reddit/README.md
- **Config**: skills/reddit/config.json
- **Datos**: data/reddit/
- **Dependencias**: curl (Reddit JSON API, sin auth)
- **Script**: scripts/reddit.sh
- **Comandos**: top, search, scan
- **Output**: posts con score, comments, links por subreddit

### hackernews
- **Qué hace**: Busca stories relevantes en HackerNews via Algolia API
- **Instrucciones**: skills/hackernews/README.md
- **Datos**: data/hackernews/
- **Dependencias**: curl (Algolia HN API, pública)
- **Script**: scripts/hackernews.sh
- **Comandos**: search, top, scan
- **Output**: stories con points, comments, URLs

### reports
- **Qué hace**: Genera informes diarios y semanales consolidando datos de todas las fuentes
- **Instrucciones**: skills/reports/README.md
- **Datos**: data/reports/daily/, data/reports/weekly/
- **Dependencias**: datos de youtube, news, twitter, reddit, hackernews
- **Output**: daily report (hechos + alertas), weekly report (estadísticas + tendencias factuales)

### last30days
- **Que hace**: Investiga cualquier tema usando fuentes recientes (ultimos 30 dias): web, Reddit, X/Twitter, HackerNews
- **Instrucciones**: skills/last30days/README.md
- **Dependencias**: web_search (Brave), bird CLI, browser tool, reddit.sh, hackernews.sh
- **Output**: insights sintetizados con fuentes, patterns, errores comunes, tecnicas

### instagram
- **Qué hace**: Scrape de cuentas de Instagram — posts, engagement, hooks, formatos
- **Instrucciones**: skills/instagram/README.md
- **Script**: /Users/alfredpifi/clawd/scripts/instagram.sh
- **Comandos**: scrape, profile, list-monitored
- **Cuentas**: @santim.ia (propia), @racklabs (competencia), @mattganzak (referencia OpenClaw)
- **Dependencias**: instaloader (pipx), sesión guardada en ~/.config/instaloader/
- **Output**: JSON con posts (caption, likes, comments, fecha, formato, URL)

### vault (MEMORIA DEL DEPARTAMENTO)
- **Qué hace**: Consulta la memoria colectiva del departamento antes de investigar
- **Script**: /Users/alfredpifi/clawd/scripts/vault.sh
- **Comandos útiles**:
  - `vault.sh search "<query>"` — Buscar notas relevantes en el vault
  - `vault.sh read <slug>` — Leer una nota completa
  - `vault.sh graph --entity <slug> --hops 2` — Ver conexiones de una entidad
  - `vault.sh list <category>` — Listar notas por categoría (people, topics, trends, etc.)
- **Cuándo**: ANTES de cada investigación. Si ya hay datos en el vault sobre el tema, no los repitas — amplíalos.

## Keywords de referencia
- **Archivo**: config/keywords_tiers.json
- **Uso**: scoring mecánico de relevancia en TODAS las fuentes
- Tier 1 (critical): OpenClaw, ClawdBot, VertexAura, Claude Code
- Tier 2 (high): AI agents, agentic AI, MCP, Claude, Anthropic...
- Tier 3 (medium): AI automation, n8n, langchain, RAG, AI chatbot...
- Tier 4 (watch): AI consulting, implementar IA, agentes IA en español...

## Perfil de intereses
- **Archivo**: config/interest_profile.json
- **Gestión**: Alfred lo actualiza basado en conversaciones con Santi
- **Uso**: cuando un topic tiene count >= 3, se propone como keyword nuevo

---

_Roberto consulta este archivo para saber qué skills tiene disponibles._
