---
title: "Instagram Intelligence System"
date: 2026-02-14
last_updated: 2026-02-14T10:33:56Z
category: projects
memoryType: projects
priority: 🟡
tags: 
  - instagram
  - inteligencia-competitiva
  - analisis-visual
  - apify
  - proyecto
mentions: 1
confidence: 0.7
author: "Alfred"
---

# Sistema de Inteligencia Competitiva Instagram

## Estado
- **Fase:** Backlog
- **Asignado:** Alfred
- **Prioridad:** Media
- **ID Tarea:** c669305d-a086-4faf-8ad1-7427a2db919d

## Objetivo
Sistema completo de análisis de competidores en Instagram con foco especial en análisis visual profundo de videos/reels.

## Arquitectura Técnica

### Stack Seleccionado
1. **Apify Instagram Scraper** - 5€/mes gratis (20K posts/mes)
2. **Whisper Local** - Transcripción audio (gratis)
3. **Análisis Visual Híbrido:**
   - OpenCV + ffmpeg → métricas objetivas
   - VLLM (LLaVA 13B) → análisis cualitativo
4. **Supabase** - Almacenamiento (tier gratis)

### Pipeline Completo
```
Apify → Scrape + descarga videos
  ↓
Whisper → Transcripción
  ↓
ffmpeg → Métricas (cortes, duración)
  ↓
OpenCV → Detecciones (rostros, texto OCR, colores)
  ↓
VLLM → Contexto (energía, estilo, insights)
  ↓
Supabase → Almacenamiento estructurado
  ↓
Informes → Diarios + Semanales
```

## Métricas Clave a Extraer

**Análisis Visual (Prioridad Alta):**
- Ritmo de edición (cortes por minuto)
- Texto overlay (cantidad, posición, estilo)
- Subtítulos (presencia, formato, estilo)
- Composición (% rostro vs screen recording vs b-roll)
- Efectos de sonido (tipos, frecuencia)
- Música (tempo, energía)
- Color grading (saturación, filtros)

**Transcripción:**
- Texto completo
- Tono (formal/casual, energético/calmado)
- Estructura narrativa
- Call-to-action

**Engagement:**
- Likes, comentarios, shares, saves
- Engagement rate
- Correlación métricas visuales ↔ engagement

## Flujos de Trabajo

### Daily Scan (02:00 AM)
- Scrape últimos 3-5 posts de cada competidor
- ~50 posts/día
- Análisis automático de videos con engagement >3%

### Weekly Trends (Domingos 21:00)
- Análisis agregado de la semana
- Top performers (qué funcionó)
- Anti-patterns (qué evitar)
- Recomendaciones para VertexAura

### Monthly Discovery
- Búsqueda por hashtags relevantes
- Identificar nuevas cuentas trending
- Ampliar lista de competidores

## Tablas Supabase

```sql
instagram_accounts (username, followers, bio, category)
instagram_posts (post_id, engagement_rate, caption, hashtags)
instagram_video_analysis (transcript, visual_metrics, recommendations)
instagram_trends (week_start, top_formats, insights)
```

## Fases de Implementación

**Fase 1: Setup (2-3 días)**
- Cuenta Apify + credenciales
- Tablas Supabase
- Scripts base de scraping

**Fase 2: Pipeline Visual (3-4 días)**
- OpenCV + ffmpeg + VLLM integrado
- Procesamiento automático videos
- Almacenamiento resultados

**Fase 3: Automatización (2-3 días)**
- Cron jobs diario/semanal
- Dashboard visualización
- Alertas proactivas

**Fase 4: Optimización (1-2 días)**
- Discovery hashtags
- Refinamiento métricas
- Mejora prompts VLLM

## Pendiente Definir
- [ ] Lista 5-10 competidores iniciales
- [ ] Hashtags para discovery
- [ ] Umbrales de alertas (ej: engagement >5%)
- [ ] Formato informes semanales

## Enlaces Relacionados
- [[preferencias-santi-análisis-instagram]] - Preferencias detalladas
- Tarea Supabase: c669305d-a086-4faf-8ad1-7427a2db919d
- MEMORY.md decisiones sobre análisis visual
