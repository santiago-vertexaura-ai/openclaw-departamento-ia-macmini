# Skill: Trend Tracking

## Descripción
Detecta tendencias emergentes y declinantes comparando datos temporales. Cada análisis se registra en el historial para detectar patrones a lo largo del tiempo.

## Cuándo usar
- task_type: `trend_analysis`
- task_type: `weekly_brief` (combinado con content_intelligence)

## Datos
- Historial: `knowledge/trend_history.jsonl` (una línea JSON por análisis)
- Snapshots: `data/snapshots/` (estados puntuales para comparación)

## Formato de entrada en trend_history.jsonl

Cada línea es un JSON independiente:
```json
{"date": "2026-02-13", "source_doc": "doc-id", "topics": [{"name": "vibe-coding", "mentions": 3, "sentiment": "positivo"}, {"name": "token optimization", "mentions": 2, "sentiment": "positivo"}]}
```

## Clasificación de tendencias

| Fase | Criterio |
|------|----------|
| EMERGENTE | Aparece por primera vez o en 1-2 fuentes |
| CRECIENDO | Frecuencia subiendo 2+ semanas, múltiples fuentes |
| PICO | Máxima frecuencia, todos hablan de ello |
| DECLINANDO | Frecuencia bajando, menos fuentes la mencionan |
| SATURADO | Demasiado cubierto, audiencia fatigada |

## Detección de señales

### Convergencia
3+ fuentes independientes hablan del mismo tema en la misma semana → SEÑAL FUERTE

### Spike
Frecuencia de un tema > 3x su media histórica → investigar por qué

### Divergencia
Un tema popular en competidores pero ausente en nuestro contenido → GAP

## Flujo de ejecución

1. Leer `knowledge/trend_history.jsonl`
2. Obtener docs recientes: `scripts/docs.sh fetch-recent 7 10`
3. Extraer topics/keywords de cada doc
4. Comparar con historial:
   - ¿Qué topics son nuevos? → EMERGENTE
   - ¿Cuáles aumentan frecuencia? → CRECIENDO
   - ¿Cuáles disminuyen? → DECLINANDO
5. Buscar convergencias y spikes
6. Agregar nueva línea a `knowledge/trend_history.jsonl`
7. Escribir análisis en `/tmp/andres_doc.md`
8. Completar tarea

## Output esperado

```json
{
  "type": "trend_analysis",
  "period": "2026-02-07 a 2026-02-13",
  "trends": [
    {
      "topic": "nombre",
      "phase": "EMERGENTE|CRECIENDO|PICO|DECLINANDO|SATURADO",
      "evidence": "datos concretos",
      "mentions_this_week": 3,
      "mentions_last_week": 1,
      "sources": ["doc-id-1", "doc-id-2"],
      "recommendation": "qué hacer con esta tendencia"
    }
  ],
  "convergences": ["temas donde 3+ fuentes coinciden"],
  "spikes": ["temas con aumento repentino"],
  "gaps": ["temas populares que no cubrimos"]
}
```

## Reglas

- NO inventar tendencias — solo reportar lo que muestran los datos
- Si el historial es muy corto (< 3 semanas), dilo en limitations
- Comparar siempre con la semana anterior como mínimo
- Cada tendencia debe tener evidencia concreta (doc IDs + citas)
