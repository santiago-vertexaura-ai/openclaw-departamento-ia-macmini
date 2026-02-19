# Skill: Formula Bank

## Descripción
Mantiene y actualiza el banco acumulativo de fórmulas de contenido replicables. Cada fórmula tiene un score de rendimiento que se actualiza con feedback real.

## Cuándo usar
- task_type: `formula_update`
- Después de cada análisis de content_intelligence (actualizar banco)

## Datos
- Archivo: `knowledge/formula_bank.json`

## Estructura de una fórmula

```json
{
  "id": "formula-001",
  "nombre": "Contraste cifra grande vs pequeña",
  "plantilla": "Paso 1: [métrica impresionante]. Paso 2: [recurso mínimo]. Paso 3: [resultado]. CTA: [pregunta]",
  "cuando_usar": "Cuando tienes datos de crecimiento rápido con recursos limitados",
  "ejemplo_original": "De 5 a 13,000 seguidores en 83 días con $300/mes",
  "ejemplo_vertexaura": "Alfred y Roberto analizan 50+ fuentes semanales con $0 en APIs",
  "fuente_doc_id": "id-del-doc-original",
  "tier": "A",
  "score": 0,
  "usos": 0,
  "creada": "2026-02-13",
  "ultima_actualizacion": "2026-02-13",
  "tags": ["crecimiento", "eficiencia", "contraste"]
}
```

## Tiers de fórmulas

| Tier | Score | Significado |
|------|-------|-------------|
| A | 8-10 | Top performer — usar frecuentemente |
| B | 5-7 | Buen rendimiento — usar regularmente |
| C | 2-4 | Rendimiento bajo — rotar o adaptar |
| D | 0-1 | Agotada o fallida — archivar |

## Flujo para formula_update

1. Leer `knowledge/formula_bank.json`
2. Si la tarea trae nuevas fórmulas → agregar con tier B (por defecto)
3. Si la tarea trae métricas de rendimiento → actualizar scores
4. Si alguna fórmula tiene score bajando 2+ semanas → degradar tier
5. Escribir de vuelta `knowledge/formula_bank.json`
6. Completar tarea con resumen de cambios

## Detección de fórmulas agotadas

Una fórmula está agotada cuando:
- Score baja 2+ semanas consecutivas
- Engagement rate < 50% del promedio del canal
- La audiencia reporta fatiga (mismos comentarios repetitivos)

Acción: degradar a tier D, proponer variante o retirar.

## Reglas

- NUNCA borrar fórmulas — degradar a tier D
- Cada fórmula debe tener fuente_doc_id trazable
- Scores solo se actualizan con datos reales (de feedback_analysis), NO estimados
- Nuevas fórmulas entran como tier B hasta que haya datos de rendimiento
