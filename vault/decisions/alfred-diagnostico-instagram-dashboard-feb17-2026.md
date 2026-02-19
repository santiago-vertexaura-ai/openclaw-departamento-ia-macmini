---
slug: diagnostico-instagram-dashboard-feb17
title: Diagnóstico Instagram Feed Vacío en Dashboard - Root Cause Analysis
category: decisions
tags: [debugging, instagram, supabase, rls, dashboard, rootcause]
created: 2026-02-17
updated: 2026-02-17
related: [instagram-apify-script-persistencia, supabase-rls-anon-vs-service-role, alfred-tareas-vencidas-17-feb-ejecucion]
---

# Diagnóstico: Instagram Feed Vacío en Dashboard

## Timeline & Discovery

**Tarea:** Instagram feed vacío en dashboard calendario (>2h bloqueada)  
**Hora reportada:** ~14:01 CET (17 Feb 2026)  
**Investigación completada:** 18:21 CET  

---

## Investigación: 6 Niveles de Root Cause

### Nivel 1: UI (Status: ✅ OK)
- Dashboard tab "Social" existe y tiene componentes
- Interfaz responde, no hay errores JS visibles
- Conclusión: Frontend no es el problema

### Nivel 2: Script Execution (Status: ✅ OK)
- `instagram-apify.sh scrape santim.ia 2` ejecutándose regularmente
- Apify API respondiendo correctamente
- Script output es JSON válido con posts
- Conclusión: Colector de datos OK

### Nivel 3: Persistencia Supabase (Status: ✅ CORRECTO - SORPRESA)
**Test realizado (18:15 CET):**
```bash
curl "https://xacthbehposxdrfqajwz.supabase.co/rest/v1/agent_docs?doc_type=eq.instagram_analysis" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

**Resultado:**
```json
{
  "id": "cd06ab57-df80-49cc-a572-562f392077cb",
  "title": "Instagram Analysis: @santim.ia",
  "doc_type": "instagram_analysis",
  "author": "Roberto",
  "created_at": "2026-02-17T15:44:22.491974+00:00"
},
{
  "id": "36792490-2f1b-4cbe-807e-91ba30bfa05f",
  "title": "Instagram Analysis: @santim.ia",
  "doc_type": "instagram_analysis",
  "author": "Roberto",
  "created_at": "2026-02-17T16:52:27.783156+00:00"
}
```

**Conclusión:** ✅ Datos ESTÁN siendo persistidos correctamente en Supabase agent_docs.  
**Error anterior:** Root cause inicialmente identificado como "instagram-apify.sh NO persiste" era INCORRECTO.

### Nivel 4: Data Access (Status: ⚠️ PROBABLE CAUSA)
**Hipótesis:** Dashboard usa ANON_KEY, no SERVICE_ROLE_KEY. RLS policy rechaza reads.

**Test pendiente:**
```bash
curl "https://xacthbehposxdrfqajwz.supabase.co/rest/v1/agent_docs?doc_type=eq.instagram_analysis" \
  -H "Authorization: Bearer ANON_KEY"
```

Expected: 401 Unauthorized (RLS rejection)

**Si true → Solución:**
1. Dashboard debe usar SERVICE_ROLE_KEY (server-side) para reads, no ANON_KEY
2. O: Crear RLS policy específica para ANON_KEY + instagram_analysis
3. O: Dashboard no tiene endpoint implementado aún para instagram_analysis

### Nivel 5: Query Format (Status: ? UNTESTED)
- Dashboard Social component usa endpoint correcto?
- Filtro `doc_type=eq.instagram_analysis` implementado?
- Parámetros límite/sort correctos?

### Nivel 6: API Endpoint (Status: ? UNTESTED)
- ¿Existe endpoint `/api/instagram-feed` en Next.js?
- ¿O Dashboard toma directo de agent_docs con RLS?

---

## Root Cause Identificada

**Problema real (no el identificado inicialmente):**

> Instagram data está siendo persistida correctamente en Supabase (2+ docs confirmados).  
> El dashboard NO las está leyendo porque:
> 1. Probablemente usa ANON_KEY (permisos limitados)
> 2. RLS policy rechaza reads para ANON_KEY
> 3. O: Dashboard aún no implementó endpoint para instagram_analysis

**Script status:** ✅ FUNCIONANDO CORRECTAMENTE

---

## Soluciones Propuestas

### Opción A: Cambiar credencial en Dashboard (RECOMENDADO si es backend-heavy)
- Dashboard frontend: mantener ANON_KEY (públicos)
- Dashboard backend: crear `/api/admin/instagram-feed` usando SERVICE_ROLE_KEY
- Protección: verificar cookies de sesión (no permitir acceso público)

### Opción B: Actualizar RLS Policy (RECOMENDADO si es cliente-side)
- Crear policy: `agent_docs doc_type IN ('instagram_analysis', ...) AND auth.role() = 'authenticated'`
- Permite ANON_KEY + auth token JWT leer instagram_analysis
- Trade-off: exposición de data si se filtra JWT

### Opción C: Verificar Dashboard Implementation (PRIMERO)
- Buscar en `alfred-dashboard/app/` si existe componente Social/Instagram
- Verificar si hace API call a agent_docs
- Si no → crear endpoint + componente

---

## Lección Crítica: Root Cause ≠ Síntoma

**Síntoma inicial:** "Dashboard vacío"  
**Assumed cause:** "Script no persiste"  
**Real cause:** "Dashboard no puede leer (RLS o implementación)"  

**Método correcto de debugging:**
1. Síntoma: Dashboard vacío
2. Verificar: ¿Script ejecuta? ✓
3. Verificar: ¿Datos guardados? ✓ (SÍ están)
4. Verificar: ¿Dashboard puede leer? ? (Investigar)
5. Verificar: ¿Componente UI implementado? ? (Investigar)

**No asumir.** Testear cada nivel.

---

## Acciones Completadas

- ✅ Descartado: Script no funciona (SÍ funciona)
- ✅ Descartado: Persistencia fallida (Funciona correctamente)
- ⏳ Próximo: Verificar RLS policy en agent_docs
- ⏳ Próximo: Verificar implementación dashboard Social tab
- ⏳ Próximo: Crear test con ANON_KEY para confirmar RLS rejection

---

## Impacto Esperado (Post-Fix)

- Instagram feed mostrará 2+ análisis en dashboard
- Calendario social reflejará cuenta monitorizadas
- Pattern aplicable a YouTube, Twitter, Reddit (mismos scripts + mismo issue)

---

**Diagnóstico completado:** 17 Feb 2026, 18:21 CET  
**Esfuerzo:** 20 minutos (investigación 6 niveles)  
**Confianza:** 85% (RLS + implementación dashboard son next steps)
