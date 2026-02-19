# Skill: Reports (Informes consolidados)

## Uso
Generar informes diarios y semanales consolidando datos de todas las fuentes (YouTube, News, Twitter cuando esté disponible).

## Tipos de informe

### Daily Report
Consolidar datos del día. Solo hechos y clasificación.

**Cuándo**: Después de completar el ciclo diario de scraping.

**Formato** — Guardar en `data/reports/daily/YYYY-MM-DD.json`:
```json
{
  "date": "2026-02-10",
  "generated_at": "2026-02-10T09:00:00Z",
  "sources": {
    "youtube": {
      "new_videos": 3,
      "channels_checked": 5,
      "high_relevance": 1
    },
    "news": {
      "articles_found": 25,
      "high_relevance": 4
    },
    "twitter": {
      "tweets_found": 0,
      "note": "not configured yet"
    }
  },
  "highlights": [
    {
      "source": "youtube",
      "title": "...",
      "relevance": "high",
      "category": "competitive_intel",
      "url": "..."
    }
  ],
  "alerts": [
    "Nuevo video de Cole Medin sobre Agent Teams (47K views)"
  ]
}
```

### Weekly Report
Consolidar 7 daily reports. Solo hechos, estadísticas y tendencias factuales.

**Cuándo**: Domingos ~10:00.

**Formato** — Guardar en `data/reports/weekly/YYYY-WXX.json`:
```json
{
  "week": "2026-W06",
  "period": "2026-02-03 to 2026-02-09",
  "generated_at": "2026-02-10T10:00:00Z",
  "summary": {
    "youtube": {
      "total_new_videos": 12,
      "by_channel": {
        "Alex Finn": 3,
        "Cole Medin": 4,
        "Nate Herk": 2,
        "Chase AI": 1,
        "Jon Hernandez": 2
      },
      "top_video": { "title": "...", "views": 47884, "channel": "..." },
      "avg_engagement_rate": 0.058
    },
    "news": {
      "total_articles": 85,
      "by_topic": {
        "core": 20,
        "platforms": 35,
        "industry": 20,
        "vertexaura": 10
      },
      "top_sources": ["TechCrunch", "The Verge", "Ars Technica"]
    }
  },
  "trends": [
    "3 de 5 canales publicaron sobre Claude Code esta semana",
    "OpenAI dominó noticias con 15 artículos",
    "Engagement rate subió 12% en videos sobre AI agents"
  ],
  "top_5_items": [
    {
      "source": "youtube",
      "title": "...",
      "relevance": "high",
      "url": "..."
    }
  ]
}
```

## Reglas
- SOLO hechos y números, NUNCA ideas de contenido ni sugerencias creativas
- Tendencias basadas en datos concretos ("3 de 5 canales publicaron sobre X")
- Si no hay datos suficientes para una métrica, poner null, no estimar
- Las alerts del daily solo incluyen items con relevance=high
