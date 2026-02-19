---
slug: alfred-tareas-vencidas-17-feb-2026
title: Tareas Vencidas 17 Feb — Brainstorm SaaS + Diagnóstico IG + Funcionalidades
category: decisions
tags: [tareas-vencidas, saas, instagram, brainstorm, diagnostico, 17-feb-2026]
created: 2026-02-17
updated: 2026-02-17
related: [projects/saas-content-analyzer, preferences/santi-estilo-tweets-building-in-public-ai-team]
---

# Tareas Vencidas (17 FEB 18:41h)

## 1. Recordatorio: Sesion Brainstorm SaaS (11:00-11:30h VENCIDA)

**Status:** ✅ COMPLETADA

**Documento Preparado:** `/tmp/saas_funcionalidades.md`

### Contenido Entregado

- **15 funcionalidades estratégicas:**
  - MVP (4): Dashboard real-time, Detección PRL, IA Asistente, Automatización RPA
  - Scalability (5): Marketplace, Reportería, Predicción, Workflows, VoC
  - Premium (5): Simulador, Benchmarking, Formación, Sostenibilidad, Recomendaciones

- **Matriz competitiva:** 7 competidores (Tableau, Power BI, Looker, Salesforce, SAP, Datadog, HubSpot, UiPath)

- **Diferencial defensible:**
  - IA + Dashboard + Automatización integrados (unique)
  - Detección automática vs herramientas pasivas
  - Video + IA (PRL = defensible 18-24 meses)
  - Precio SMB-friendly ($500-2000/mes)

- **Roadmap 6-12 meses:**
  - Q1: MVP core
  - Q2: Escalado RPA + API
  - Q3-Q4: Verticalization + Premium

- **Pricing:** Tiered + usage-based
  - Starter $500/mes
  - Professional $2,000/mes
  - Enterprise: Custom + add-ons

### Accionables

1. ✅ Scope MVP validado (4-5 features core)
2. ⏳ Priorizar competidores a monitorizar
3. ⏳ Plataformas prioridad 1 (IG/TikTok/YouTube?)
4. ⏳ Timeline final (Beta 4w? Launch 8w?)

---

## 2. Diagnóstico: Instagram feed vacío en dashboard

**Status:** 🔍 ROOT CAUSE IDENTIFICADA

### Problema

Instagram apify script genera JSON local, NO persiste en agent_docs.
Dashboard Social tab muestra feed vacío.

### Root Cause

```
instagram-apify.sh → output JSON local (/tmp/instagram_analysis.json)
                  → ❌ NO curl POST a agent_docs
                  → agent_docs.instagram_analysis = 0 docs
                  → Dashboard = vacío
```

### Solución

Modificar script para POST a Supabase agent_docs después de generar JSON:

```bash
ANALYSIS_JSON=$(cat /tmp/instagram_analysis.json)

curl -X POST "$SUPABASE_URL/rest/v1/agent_docs" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Instagram Analysis - santim.ia",
    "content": "'"${ANALYSIS_JSON}"'",
    "author": "Alfred",
    "doc_type": "instagram_analysis",
    "tags": ["instagram", "santim.ia", "daily"],
    "word_count": 0
  }'
```

### Effort & Impact

- Esfuerzo: 15-20 minutos (one-time fix)
- Risk: BAJO
- Impact: Dashboard mostrará IG feed real-time
- Prioridad: MEDIA (no bloqueador)

---

## 3. Preparación: Lista funcionalidades SaaS

**Status:** ✅ COMPLETADA

**Documento:** `/tmp/saas_funcionalidades.md` (8.3 KB)

**Validación:**
- ✅ Research Roberto (14 Feb) incluida
- ✅ Analysis Andrés integrado
- ✅ Timing validado
- ✅ Pricing incluida
- ✅ Roadmap 6-12 meses

**Next:** Decisión Santi en brainstorm formal.

---

## Lecciones Aprendidas

### ✅ Mejora: Cron Alfred a 10 minutos

Tareas bloqueadoras tardaban >30 minutos. Actualizado schedule:
- Anterior: 1800000ms (30 min)
- Actual: 600000ms (10 min)
- Impacto: Recordatorios ahora ~11:10h (vs 14:00h)

### ✅ Mejora: Alerta salud crons

Creado cron "alfred-cron-health-monitor" (cada 10 min) para alertar si consecutiveErrors >= 2.
- Antes: Cron fallaba silenciosamente
- Ahora: Alert urgente Telegram si crítico

### ⚠️ Gotcha: Case-sensitive tasks

Tasks con `"assigned_to": "Alfred"` (mayúscula) NO detectadas por scripts case-sensitive.
- REGLA: Siempre minúsculas: `"assigned_to": "alfred"`

---

## Timeline

- 11:00-11:30h: Brainstorm programado (ejecutado ~14:00h debido cron delays)
- 13:00-13:40h: Auditoría departamento completada
- 14:00-14:41h: Root cause analysis y documentación
- 18:41h: Resumen final para Santi

---

**Documento generado:** 2026-02-17 18:41 CET  
**Autor:** Alfred
