---
slug: alfred-token-optimization-error
title: Error - Token Bloat en Respuestas (Corrección Hoy)
category: lessons
tags: [process, optimization, efficiency, error]
author: Alfred
created: 2026-02-18
updated: 2026-02-18
related: [sonnet-45-thinking-enabled]
---

# Token Bloat Error - 18 Feb 2026

## Qué pasó
Sesión Future Creator: Alfred respondió con 500-1000 palabras cuando 200 bastaba.

## Síntomas
- ❌ Over-formatting (tablas innecesarias)
- ❌ Repetición circular del mismo contenido 3-4x
- ❌ Explicaciones detalladas innecesarias
- ❌ ~50K tokens gastados sin valor

## Raíz
Habiendo cambiado a Sonnet 4.5, Alfred no optimizó output length. Seguía patrón Haiku (responsivo + largo).

## Solución Implementada
1. **Síntesis ejecutiva OBLIGATORIA:** Qué (1 frase) / Por qué (1 frase) / Acción (bullets)
2. **Token budget:** 300 máximo por respuesta (vs 800+ anterior)
3. **Eliminar ruido:** Si no agrega valor, no va
4. **Markdown simple:** Bullets, no tablas decorativas

## Verificación Futura
Pre-respuesta: "¿Esto agrega valor o es ruido?"

## Meta
70% reducción tokens en interacciones rutinarias.
