---
title: "Arquitectura Análisis Instagram - Apify + Híbrido"
date: 2026-02-14
last_updated: 2026-02-14T10:34:21Z
category: decisions
memoryType: decisions
priority: 🟡
tags: 
  - decision
  - instagram
  - apify
  - arquitectura
  - analisis-visual
mentions: 1
confidence: 0.7
author: "Alfred"
---

# Decisión: Arquitectura para Análisis Instagram

**Fecha:** 2026-02-14  
**Decidido por:** Santi + Alfred  
**Contexto:** Sistema de inteligencia competitiva Instagram

## Decisión 1: Usar Apify (No 100% Gratis)

### Opciones Evaluadas
**A) 100% Gratis (Instaloader + Whisper + Ollama + OpenCV)**
- Pros: /bin/zsh coste
- Contras: Setup complejo, riesgo bloqueos, mantenimiento alto

**B) Apify (/bin/zsh.25/1000 posts, 5€ gratis/mes recurrente)**
- Pros: Confiable, escalable, bajo mantenimiento
- Contras: Técnicamente no gratis (pero 5€/mes cubierto)

### Elección: **B) Apify**

**Razón:** Santi tiene 5€/mes GRATIS recurrente en Apify.
Con eso: 20.000 posts/mes → suficiente para 50-100 videos/día.

**Trade-off aceptado:** Dependencia de Apify vs tiempo de setup/mantenimiento.

---

## Decisión 2: Arquitectura Híbrida (No Solo VLLM)

### Opciones Evaluadas

**A) Solo OpenCV + ffmpeg**
- Pros: Rápido (~10 seg/video), métricas precisas
- Contras: No entiende contexto cualitativo

**B) Solo VLLM (LLaVA/Qwen2-VL)**
- Pros: Insights cualitativos ricos
- Contras: Impreciso en métricas, más lento

**C) Híbrido (OpenCV+ffmpeg + VLLM)**
- Pros: Lo mejor de ambos mundos
- Contras: Más complejo, tiempo medio (~35 seg/video)

### Elección: **C) Híbrido**

**Razón:** 
- Santi preguntó explícitamente: "¿OpenCV+ffmpeg o VLLM?"
- Explicamos trade-offs
- Eligió híbrido para combinar métricas objetivas + contexto

**Implementación:**
1. ffmpeg → Duración, cortes de escena
2. OpenCV → Rostros, texto OCR, colores
3. VLLM (LLaVA 13B) → "Por qué funciona", estilo, energía

**Tiempo procesamiento:** ~35 segundos/video (aceptable)

---

## Decisión 3: Priorizar Análisis Visual

### Contexto
Santi dijo textualmente: 
> "lo que me interesa es el análisis visual eso es lo mas importante para mi junto a la transcripción"

### Implicación
- Análisis visual NO es un "nice to have", es el CORE
- Transcripción importante pero secundaria
- Métricas de engagement (likes/comments) son terciarias

### Priorización en Pipeline
1. **CRÍTICO:** Análisis visual (cortes, texto overlay, composición)
2. **IMPORTANTE:** Transcripción + tono
3. **ÚTIL:** Métricas engagement

---

## Aprendizajes para Futuras Decisiones

1. **Preguntar opciones claras:** "¿A, B o C?" funciona mejor que explicación larga
2. **Santi valora tiempo sobre dinero:** Si algo es "gratis" pero toma 10h setup, prefiere pagar
3. **Análisis visual > Datos numéricos:** Le interesa el "cómo" y "por qué", no solo el "cuánto"

---

## Próxima Revisión
Cuando se active la tarea, revisar si:
- Apify sigue teniendo 5€ gratis/mes
- LLaVA 13B es mejor opción o salió algo nuevo
- Métricas visuales seleccionadas son las correctas

## Enlaces
- [[instagram-intelligence-system]] - Proyecto completo
- [[preferencias-santi-análisis-instagram]] - Contexto preferencias
