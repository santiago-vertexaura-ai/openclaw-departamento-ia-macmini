---
title: "Preferencias Santi - Análisis Instagram"
date: 2026-02-14
last_updated: 2026-02-14T10:33:34Z
category: preferences
memoryType: preferences
priority: 🟡
tags: 
  - instagram
  - analisis-visual
  - apify
  - preferencias
mentions: 1
confidence: 0.7
author: "Alfred"
---

# Preferencias de Análisis Instagram

## Contexto
Conversación 14 feb 2026 sobre sistema de inteligencia competitiva en Instagram.

## Prioridades Claras

### 1. Análisis Visual es lo MÁS Importante
- Foco principal: análisis visual de videos/reels
- Transcripción también importante pero secundaria
- Quiere entender: ritmo, texto overlay, efectos, composición

### 2. Presupuesto
- Tiene 5€/mes GRATIS en Apify (todos los meses recurrente)
- No le importa usar Apify porque es gratis
- Preguntó por opción 100% gratis, pero al confirmar Apify gratis decidió usarlo

### 3. Arquitectura Preferida
- Aprobó arquitectura **híbrida** (OpenCV + ffmpeg + VLLM)
- Balance entre métricas objetivas y análisis cualitativo
- Preguntó específicamente: OpenCV vs VLLM → decidió híbrido

### 4. Análisis de Video Deseado
Métricas clave que le interesan:
- Transcripción del audio
- Tono y efectos sonoros
- Ritmo de edición (cortes)
- Texto overlay (muy importante)
- Subtítulos (estilo, presencia)
- Composición visual (rostro vs screen)
- Efectos y música

## Decisiones Tomadas

1. **Usar Apify** - 5€/mes gratis, 20K posts/mes capacidad
2. **Análisis visual prioritario** - sobre métricas de engagement
3. **Arquitectura híbrida** - OpenCV+ffmpeg (métricas) + VLLM (contexto)
4. **Tarea en backlog** - asignada a Alfred, pendiente definir competidores

## Preguntas que Hizo

- ¿Cómo scraping Instagram para competidores?
- ¿Apify coste? → confirmó 5€ gratis
- ¿Posible analizar transcripción + efectos visuales?
- ¿Buscar cuentas por temas/hashtags? → sí, posible
- ¿Hay forma 100% gratis? → discutido, pero eligió Apify
- ¿OpenCV+ffmpeg o VLLM? → decidió híbrido

## Próximos Pasos Cuando Active Tarea

1. Definir lista 5-10 competidores Instagram
2. Hashtags para discovery
3. Frecuencia informes (diario/semanal)
4. Setup Apify + pipeline análisis visual
