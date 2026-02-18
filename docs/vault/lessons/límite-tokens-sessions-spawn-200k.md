---
title: "Límite Tokens Sessions Spawn - 200k"
date: 2026-02-14
last_updated: 2026-02-14T22:13:24Z
category: lessons
memoryType: lessons
priority: 🟡
tags: 
  - tokens
  - optimization
  - escalabilidad
  - andrés
mentions: 1
confidence: 0.7
author: "Alfred"
---

# Lección: Límite Tokens en Sessions Spawn

**Fecha:** 2026-02-14  
**Contexto:** Día histórico 10 tareas completadas

## El Problema

**Síntoma:**
- Andrés spawneado con documentos muy largos (>4000 palabras)
- Timeout ocasional en análisis complejos
- Token budget: 200k por sesión spawn

**Root cause:**
- Prompts Andrés muy detallados
- Documentos Roberto muy extensos
- Context window consumption alta

## Impacto

**Positivo:**
- Sistema no falló (solo warnings)
- Todas las tareas completaron exitosamente
- Calidad output se mantuvo

**Negativo:**
- Riesgo timeout en tareas >15 min
- Coste tokens elevado (ineficiente)
- No escalable a 20-30 agentes

## Solución Implementada

**Corto plazo:** Ninguna (funciona)

**Medio plazo (necesario):**
1. **Refactorizar prompts Andrés:**
   - Reducir instrucciones redundantes
   - Modularizar por tipo de análisis
   - Template-based approach

2. **Chunk processing:**
   - Dividir documentos >3000 palabras
   - Análisis por secciones
   - Agregación final

3. **Model selection dinámica:**
   - Haiku para análisis simples (<1500 palabras)
   - Sonnet para análisis complejos (>1500 palabras)
   - Opus solo cuando absolutamente necesario

4. **Streaming approach:**
   - Procesar en streaming vs cargar todo context
   - Reduce peak memory
   - Mejora latency percibida

## Métricas Monitorear

- **Token consumption por tarea** (objetivo: <50k average)
- **% tareas hitting 200k limit** (objetivo: <5%)
- **Coste por análisis** (objetivo: </bin/zsh.50/tarea)
- **Quality degradation con prompts más cortos** (objetivo: 0% drop)

## Relacionado

- Patrón Vadim token optimization
- Sistema multi-agente escalabilidad

---

## Action Items

- [ ] Auditar prompts Andrés (identificar redundancias)
- [ ] Implementar chunking documentos largos
- [ ] A/B test Haiku vs Sonnet en análisis simples
- [ ] Dashboard métrica: token consumption por agente
