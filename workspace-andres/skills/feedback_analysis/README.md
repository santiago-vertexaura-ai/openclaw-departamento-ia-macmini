# Skill: Feedback Analysis

## Descripción
Analiza métricas post-publicación de contenido para refinar fórmulas y mejorar la estrategia. Cierra el loop entre publicación y optimización.

## Cuándo usar
- task_type: `feedback`
- Cuando Roberto trae métricas de contenido publicado (engagement, views, shares, etc.)

## Datos
- Formula bank: `knowledge/formula_bank.json` (actualiza scores)
- Audience profile: `knowledge/audience_profile.json` (refina perfiles)

## Input esperado

La tarea debe contener (en brief o description) métricas de publicaciones:
```json
{
  "publicaciones": [
    {
      "url": "https://x.com/...",
      "fecha": "2026-02-10",
      "formula_usada": "formula-001",
      "views": 5000,
      "likes": 200,
      "comments": 45,
      "shares": 30,
      "followers_gained": 15
    }
  ]
}
```

## Flujo de ejecución

1. Leer métricas de la tarea (brief/description)
2. Para cada publicación con `formula_usada`:
   a. Calcular engagement: `scripts/metrics.sh engagement <views> <likes> <comments> <shares>`
   b. Comparar con promedios del canal (de audience_profile.json)
   c. Actualizar score de la fórmula en formula_bank.json
3. Detectar patrones:
   - ¿Qué fórmulas superan el promedio?
   - ¿Cuáles están por debajo?
   - ¿Hay correlación entre formato y rendimiento?
4. Actualizar `knowledge/audience_profile.json` con nuevos datos
5. Generar recomendaciones
6. Completar tarea

## Output esperado

```json
{
  "type": "feedback_analysis",
  "period": "2026-02-07 a 2026-02-13",
  "publicaciones_analizadas": 3,
  "resultados": [
    {
      "url": "...",
      "formula_usada": "formula-001",
      "engagement_rate": 5.5,
      "vs_promedio": "+23%",
      "veredicto": "SUPERA_PROMEDIO|EN_PROMEDIO|BAJO_PROMEDIO"
    }
  ],
  "formulas_actualizadas": [
    {
      "id": "formula-001",
      "score_anterior": 7,
      "score_nuevo": 8,
      "razon": "engagement 23% sobre promedio"
    }
  ],
  "recomendaciones": {
    "repetir": ["fórmulas que funcionaron bien"],
    "rotar": ["fórmulas con rendimiento medio — probar variantes"],
    "abandonar": ["fórmulas con rendimiento bajo consistente"]
  }
}
```

## Reglas

- Solo actualizar scores con datos REALES de métricas — NUNCA estimar
- Si no hay métricas suficientes para una fórmula, no actualizar su score
- Mínimo 2 usos de una fórmula antes de degradar tier
- Registrar siempre la fecha de última actualización en formula_bank.json
