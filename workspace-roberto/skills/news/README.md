# Skill: News (Google News RSS)

## Uso
Buscar y recopilar noticias relevantes sobre temas de interés usando Google News RSS.

## Fuente ÚNICA
Google News RSS. Gratis, sin API key, sin límite de peticiones.

## Cómo buscar

### URL base
```
https://news.google.com/rss/search?q=TOPIC&hl=LANG&gl=COUNTRY&ceid=COUNTRY:LANG
```

### Ejemplos
```bash
# IMPORTANTE: siempre usar -A con User-Agent, sin él Google devuelve vacío
# Inglés
curl -s -L -A "Mozilla/5.0" "https://news.google.com/rss/search?q=Claude+Code+AI&hl=en&gl=US&ceid=US:en"

# Español
curl -s -L -A "Mozilla/5.0" "https://news.google.com/rss/search?q=inteligencia+artificial+agentes&hl=es&gl=ES&ceid=ES:es"
```

### Parsear RSS (XML)
El RSS devuelve XML. Extraer de cada `<item>`:
- `<title>`: título del artículo
- `<link>`: URL del artículo
- `<pubDate>`: fecha de publicación
- `<source>`: fuente (ej: "TechCrunch", "The Verge")
- `<description>`: extracto breve

## Configuración
Ver `config.json` para los topics organizados por categoría, idiomas, y max_articles_per_topic.

## Búsqueda por tema específico
Si se pide "busca noticias sobre X", construir la query RSS con ese tema:
- "busca noticias sobre n8n" → `?q=n8n+AI+automation&hl=en&gl=US&ceid=US:en`
- "noticias sobre OpenAI" → `?q=OpenAI+latest+news&hl=en&gl=US&ceid=US:en`
- Siempre Google News RSS, nunca otra fuente.

## Formato de salida

Guardar en `data/news/<topic>_<fecha>.json`:

```json
{
  "topic": "Claude Code AI",
  "query": "Claude+Code+AI",
  "language": "en",
  "scraped_at": "2026-02-10T08:00:00Z",
  "source": "google_news_rss",
  "article_count": 10,
  "articles": [
    {
      "title": "Article Title",
      "url": "https://...",
      "source": "TechCrunch",
      "published_at": "2026-02-09T14:00:00Z",
      "description": "Brief excerpt...",
      "relevance": "high/medium/low",
      "category": "platform_update/industry_news/tool_release/competitive_intel"
    }
  ]
}
```

## Reglas
- SOLO datos del RSS, nunca inventar artículos
- Si el RSS no devuelve resultados, reportar "0 articles found"
- Clasificar relevance basándose en el título y la fuente
- No hacer web_fetch de cada artículo (demasiado lento); solo extraer datos del RSS
