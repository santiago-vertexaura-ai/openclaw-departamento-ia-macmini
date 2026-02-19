# Skill: YouTube Scraping + Análisis

## Uso
Extraer metadatos, transcripciones y análisis de canales y vídeos de YouTube.

## Configuración
Ver `config.json` para la lista de canales monitorizados, prioridades y video_count por canal.

## PASO 0: Canales configurados (OBLIGATORIO)

ANTES de buscar cualquier canal, SIEMPRE lee `workspace-roberto/skills/youtube/config.json`.

Si el usuario menciona un nombre de canal (ej: "Chase AI", "Alex Finn", "Cole Medin"):
1. Lee `config.json` y busca un canal cuyo campo `name` coincida con lo que pide el usuario
2. Si lo encuentras, usa el `handle` y `channel_id` de config.json — NO inventes handles
3. Si NO lo encuentras en config.json, entonces busca el canal manualmente

Canales configurados actualmente: Alex Finn, Cole Medin, Nate Herk, Chase AI, Jon Hernandez

**Ejemplo**: Si piden "Chase AI" → config.json tiene `"name": "Chase AI", "handle": "@Chase-H-AI"` → usa `@Chase-H-AI`, NO `@ChaseAI`

## USAR EL SCRIPT youtube.sh (OBLIGATORIO)

**NO uses yt-dlp directamente.** yt-dlp sale con código 101 frecuentemente y OpenClaw lo interpreta como error.
Usa SIEMPRE el script wrapper que maneja los exit codes correctamente:

### Paso 1: Listar últimos vídeos de un canal
```bash
workspace-roberto/scripts/youtube.sh list <CHANNEL_ID> <MAX_VIDEOS>
```
Ejemplo: `workspace-roberto/scripts/youtube.sh list UCMwVTLZIRRUyyVrkjDpn4pA 5`

Devuelve JSON con array de objetos: `[{id, title, published, description}, ...]`

### Paso 2: Metadatos COMPLETOS por vídeo individual
```bash
workspace-roberto/scripts/youtube.sh info <VIDEO_ID>
```
Ejemplo: `workspace-roberto/scripts/youtube.sh info XmweZ4fLkcI`

Devuelve JSON completo con title, view_count, like_count, duration, description, etc.

### Paso 3 (opcional): Transcripción
```python
from youtube_transcript_api import YouTubeTranscriptApi
api = YouTubeTranscriptApi()
transcript = api.fetch("VIDEO_ID", languages=["en", "es"])
full_text = " ".join([s.text for s in transcript])
```

### IMPORTANTE: NO uses yt-dlp directamente
yt-dlp sale con código 101 frecuentemente (errores parciales). OpenClaw interpreta exit code != 0 como error.
El script youtube.sh maneja esto internamente y SIEMPRE devuelve JSON limpio con exit 0.

## Formato de salida

Guardar en `data/youtube/<channel_handle>_<fecha>.json`:

```json
{
  "channel": "Channel Name",
  "channel_id": "UCXXXXXXX",
  "channel_handle": "@handle",
  "scraped_at": "2026-02-10T18:00:00Z",
  "method": "yt-dlp",
  "video_count": 5,
  "videos": [
    {
      "id": "VIDEO_ID",
      "title": "Video Title",
      "description": "...",
      "upload_date": "20260209",
      "duration": 1154,
      "duration_string": "19:14",
      "views": 27399,
      "likes": 1444,
      "comments": 313,
      "categories": ["Science & Technology"],
      "url": "https://www.youtube.com/watch?v=VIDEO_ID",
      "transcript_available": true,
      "engagement": {
        "likes_per_view": 0.053,
        "comments_per_view": 0.011,
        "engagement_rate": 0.064,
        "engagement_tier": "high"
      },
      "analysis": {
        "main_topic": "...",
        "key_points": ["...", "..."],
        "hardware_mentioned": ["..."],
        "software_mentioned": ["..."],
        "prices_mentioned": ["..."],
        "target_audience": "...",
        "sentiment": "positive/negative/neutral",
        "relevance": "high/medium/low",
        "category": "competitive_intel/platform_update/industry_news/tool_release"
      }
    }
  ],
  "channel_trends": {
    "avg_views": 35000,
    "avg_likes": 1800,
    "avg_comments": 250,
    "avg_engagement_rate": 0.058,
    "views_trend": "growing/stable/declining",
    "best_performing": { "id": "...", "title": "...", "views": 47884 },
    "worst_performing": { "id": "...", "title": "...", "views": 5200 },
    "publishing_frequency": "3 videos/week",
    "top_topics": ["AI agents", "Claude Code", "Mac hardware"]
  },
  "content_intelligence": {
    "title_patterns": ["Numbers in title", "How-to format", "Clickbait elements"],
    "avg_duration_seconds": 900,
    "content_gaps": ["Spanish tutorials", "Budget setups"],
    "trending_keywords": ["Claude Code", "AI agents", "automation"]
  }
}
```

## Cálculos de engagement

### Por vídeo
- `likes_per_view` = likes / views
- `comments_per_view` = comments / views
- `engagement_rate` = (likes + comments) / views
- `engagement_tier`:
  - "viral": engagement_rate > 0.10
  - "high": engagement_rate > 0.05
  - "medium": engagement_rate > 0.02
  - "low": engagement_rate <= 0.02

### Channel trends
- `avg_views`: media de views de los N vídeos scrapeados
- `views_trend`: comparar avg de los 3 más recientes vs los 3 más antiguos
  - Si recientes > antiguos * 1.2 → "growing"
  - Si recientes < antiguos * 0.8 → "declining"
  - Else → "stable"
- `publishing_frequency`: calcular de las upload_dates
- `top_topics`: extraer de los main_topic de cada vídeo, agrupar por similitud

### Content intelligence
- `title_patterns`: analizar títulos buscando patrones (números, preguntas, how-to, mayúsculas, emojis)
- `content_gaps`: temas que aparecen poco o nunca entre los canales monitorizados
- `trending_keywords`: palabras más frecuentes en títulos y key_points

## Reglas de análisis

### Si el vídeo es sobre OpenClaw/ClawdBot:
Extraer:
- Configuraciones mencionadas
- Mejores prácticas
- Trucos y tips
- Ideas de skills/herramientas
- Problemas y soluciones

### Inteligencia competitiva:
- Frecuencia de publicación del canal
- Tendencias de views entre vídeos
- Temas emergentes
- Qué contenido explota y por qué

## Prioridad de métodos
1. youtube.sh list (RSS) → youtube.sh info (yt-dlp individual) → Transcripción
2. NUNCA uses yt-dlp directamente — siempre via youtube.sh
3. NUNCA reportar datos parciales directamente (campos null = alucinaciones)
