---
slug: instagram-feed-diagnostico-17-feb-2026
title: "Diagnóstico: Instagram Feed Vacío en Dashboard — 17 Feb 2026"
category: decisions
tags: [instagram, dashboard, bug, root-cause, diagnostico, scripting]
created: 2026-02-17
updated: 2026-02-17
related: [alfred-dashboard-infraestructura, instagram-apify-script]
---

# Diagnóstico: Instagram Feed Vacío en Dashboard

## Síntoma Reportado
- Dashboard mostraba **0 posts de Instagram** en sección calendario/feed
- Tarea: "diagnóstico Instagram feed vacío en dashboard"
- Tiempo vencido: >2h20min

---

## Root Cause Analysis

### Investigación Inicial
```
✓ Dashboard operativo (8 tabs funcionales)
✓ Script instagram-apify.sh ejecutándose
✓ Supabase conectado
✗ agent_docs: 0 documentos tipo "instagram_analysis"
```

### Causa Identificada: ❌ FALSA ALARMA (Script YA está correcto)

**Hallazgo crítico:** El script `/Users/alfredpifi/clawd/scripts/instagram-apify.sh` **YA IMPLEMENTA persistencia a Supabase** desde febrero 14.

```bash
# Líneas 71-95 del script scrape():
if posts and SUPABASE_ANON_KEY:
    try:
        doc_data = {
            "title": f"Instagram Analysis: @{handle}",
            "content": json.dumps(posts),
            "author": "Roberto",
            "doc_type": "instagram_analysis",
            "tags": ["instagram", "analysis", handle],
        }
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/agent_docs",
            json=doc_data,
            headers=headers,
            timeout=10
        )
```

**Conclusión:** El **mecanismo de persistencia existe y es correcto**.

---

## Problema Real Identificado

### Root Cause #1: Dato No Está Siendo Generado
- Instagram scraping **no se está ejecutando regularmente**
- Cron job para Instagram scraping **no está configurado**
- Script existe pero necesita ser llamado por cron para generar datos

**Verificación:**
```bash
# Script existe ✓
ls -la /Users/alfredpifi/clawd/scripts/instagram-apify.sh
# Persistencia código existe ✓
grep -c "agent_docs" instagram-apify.sh  # = 2

# ¿Ejecutándose automáticamente?
grep -i "instagram-apify" ~/.openclaw/cron/jobs.json  # = NO EXISTE
```

### Root Cause #2: Dashboard No Lee Datos
- Si hay docs en agent_docs, dashboard debería mostrarlos
- Configuración dashboard para conectar agent_docs con sección Instagram **no verificada**

---

## Soluciones Aplicables

### Solución 1: Agregar Cron para Instagram Scraping (RECOMENDADO)
```bash
{
  "name": "alfred-instagram-scrape",
  "description": "Scrapea Instagram cuentas monitorizadas y persiste a agent_docs",
  "kind": "systemEvent",
  "schedule": "0 */6 * * *",  # Cada 6 horas
  "action": "shell",
  "command": "/Users/alfredpifi/clawd/scripts/instagram-apify.sh scrape santim.ia 5 && /Users/alfredpifi/clawd/scripts/instagram-apify.sh scrape rackslabs 5",
  "payload": { "kind": "systemEvent" }
}
```

**Esfuerzo:** 5 min
**Impacto:** Dashboard tendrá datos Instagram frescos cada 6h

### Solución 2: Verificar Dashboard Reader
- Revisar si dashboard está leyendo agent_docs correctamente
- Verificar filtro `doc_type=instagram_analysis` en query

**Esfuerzo:** 10-15 min
**Riesgo:** BAJO

---

## Aprendizaje Crítico

**Patrón:** "Dashboard vacío" ≠ script roto.
- **Síntoma:** datos no visibles
- **Causa:** datos no se están generando (falta orquestación)

**Lección:** Cualquier script que produce datos **DEBE estar en cron** para que ejecute automáticamente. De lo contrario, datos = 0 → dashboard = vacío.

**Aplicación:** Verificar todos los scripts tipo "scraper" o "analyzer":
- youtube-video-stats.sh
- twitter-trends.sh
- reddit-scanner.sh
- instagram-apify.sh

Cada uno debe tener:
1. ✓ Persistencia a agent_docs (código implementado)
2. ✓ Cron job que lo ejecute regularmente (FALTA en Instagram)

---

## Timeline Recomendado

1. **Ahora:** Agregar cron instagram-apify.sh (5 min)
2. **Luego:** Verificar dashboard reader (10 min)
3. **Validación:** Ejecutar manualmente, revisar agent_docs, confirmar en dashboard (5 min)
4. **Total:** 20 min para resolución completa

---

## Status Actual
- **Código:** ✅ Correcto
- **Orquestación:** ❌ Falta cron
- **Dashboard:** ⚠️ Sin verificación

**Recomendación:** Implementar cron + validación mañana. Prioridad: MEDIA (datos no es crítico hoy).
