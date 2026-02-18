---
title: "Matriz de Capacidades Invertida"
date: 2026-02-14
last_updated: 2026-02-14T12:35:00Z
category: formulas
memoryType: formula
priority: 🟢
tags: 
  - competitive_intelligence
  - market_research
  - feature_gap_detection
  - product_strategy
confidence: 0.85
author: "Andrés (detectada de análisis de Roberto)"
---

## Descripción

Técnica de investigación que identifica gaps de mercado REALES mapeando capacidades de competidores.

Cuando 80%+ de competidores fallan en la misma feature, no es un defecto del competidor — es una brecha de mercado real.

## Plantilla paso a paso

1. **Define la pregunta clave del problema**
   - Ej: "¿Qué necesito que haga la herramienta?"
   - Respuesta: "Analizar contenido visual + transcribir + detectar hooks + usar IA"

2. **Lista N competidores** (mínimo 5, ideal 10+)
   - Ej: Metricool, Hootsuite, Sprout, VidIQ, TubeBuddy, Brandwatch, etc.

3. **Para cada competidor, pregunta SÍ/NO/PARCIAL para cada feature**
   - "¿Analiza contenido visual?" → NO
   - "¿Transcribe automáticamente?" → NO
   - "¿Detecta hooks?" → NO
   - "¿Integra IA?" → SÍ (pero limitada)

4. **En cada NO/PARCIAL, cita la limitación entre comillas**
   - Entre comillas AUTORIZA como feedback de usuario, no opinión
   - Ej: "No analiza CONTENIDO de videos, solo métricas" (Metricool)
   - Ej: "Monitorea que video tuvo X views pero NO dice QUÉ hace que sea viral" (Hootsuite)

5. **Cuenta NOs: Si 80%+ fallan en X → X es un gap de mercado**
   - 18/18 fallan en "análisis visual" = 100% = BRECHA REAL

## Cuándo usar

- Argumentar que existe una brecha REAL (no teórica)
- Pitch de inversión (validar mercado)
- Planificación de producto (qué features construir)
- Análisis competitivo para GTM (posicionamiento)

## Ejemplo original (Roberto)

```
Pregunta: ¿Existe herramienta que combine 
análisis visual + transcripción + hooks + IA?

Herramientas analizadas: 18

Metricool: NO análisis visual ("No analiza CONTENIDO, solo métricas")
Hootsuite: NO explica por qué es viral ("Monitorea X views pero NO dice qué hace viral")
Sprout: NO análisis profundo de competencia
VidIQ: PARCIAL ("Analiza thumbnail pero NO frames internos")
TubeBuddy: NO transcripción, NO detección de hooks

Resultado: 18/18 fallan en lo mismo

Conclusión: BRECHA REAL EN EL MERCADO
```

## Ejemplo VertexAura

```
Pregunta: ¿Existe herramienta que detecte automáticamente 
hooks de contenido en ESPAÑOL + contexto SaaS B2B?

Herramientas analizadas: 18

Resultado: 0/18 lo hacen (100% fallan)

Conclusión: Oportunidad de ser la primera en España
```

## Por qué funciona

- **Autoridad por números:** 18/18 > 3/5 (muestra no es pequeña)
- **Validación por patrón:** Si TODOS fallan en X, no es defecto — es mercado esperando solución
- **Citación entre comillas:** Suena como feedback usuario, no opinión ejecutiva
- **Enfoque en AUSENCIA, no en opinión:** "Ninguna tiene X" es medible. "X sería mejor" es opinión.

## Variantes

**Versión rápida (5 min):** Solo los 3-5 competidores más conocidos
**Versión exhaustiva (1 día):** 15+ competidores (como Roberto)
**Versión SaaS:** Incluir pricing, contract, target market
**Versión feature:** Matriz granular (Sí/No/Parcial para 10+ features)

## Relacionado

Conectada con:
- [[tapping-the-gap]] (cuantificar el gap una vez detectado)
- [[limitacion-reveladora]] (cómo citar limitaciones con autoridad)
- [[competitive-intelligence]] (tema general)

