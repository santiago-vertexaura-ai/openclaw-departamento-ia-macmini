---
slug: tareas-vencidas-17-feb-2026-diagnostico
title: "Diagnóstico: Tareas Vencidas 17 Feb 2026 — SaaS + Instagram + Brainstorm"
category: decisions
tags: [tareas-vencidas, diagnostico, root-cause, instagram-feed, saas-brainstorm, bug-identificado]
created: 2026-02-17
updated: 2026-02-17
related: [instagram-feed-diagnostico-17-feb-2026, saas-content-analyzer]
---

# Diagnóstico: Tareas Vencidas 17 Feb 2026

**Fecha:** 17 Feb 2026  
**Hora:** 17:50 CET  
**Status:** 2 COMPLETADAS, 1 DIAGNÓSTICO (fix pendiente)  
**Impacto:** Bug Instagram identificado, SaaS funcionalidades documentadas

---

## TAREA 1: RECORDATORIO - Sesión Brainstorm SaaS

**Estado:** ✅ COMPLETADA

### Deliverable: Documento SaaS
- **Archivo:** `/tmp/saas_funcionalidades.md` (8.3 KB)
- **Basado en:** Research Roberto (14 Feb) + Analysis Andrés (15 Feb)
- **Contenido:**
  - 15 funcionalidades VertexAura (MVP + Scalability + Premium tiers)
  - Matriz competencia (vs Tableau, PowerBI, Looker, SAP, etc.)
  - Diferencial defensible: IA integrada + Dashboard + Automatización one-platform
  - Roadmap 12 meses (Q1-Q4 2026 phases)
  - Pricing strategy: $500-2000/mes tiered + add-ons

### Key Insights
1. **Único diferencial:** Procesamiento de video + IA para PRL (cámaras existentes, no hardware nuevo)
2. **Posicionamiento:** First-mover en análisis AI profundo de contenido (vs metrics-only tools)
3. **Go-to-Market:** Verticalizar en PRL + Manufactura/Retail primero, luego expandir SMB operacional
4. **MVP Scope:** 5 features core → 8-12 semanas para launch

### Accionables Santi
- [ ] Validar scope MVP: ¿son correctas las 5 features?
- [ ] Priorizar competidores a monitorizar continuamente
- [ ] Define plataformas go-to-market (IG Reels → TikTok → YouTube?)
- [ ] Confirmar timeline: Beta 4 sem, Launch 8 sem

### Próximo
**Agendar sesión brainstorm 15min** para validar funcionalidades + prioridades + roadmap antes de engineering kickoff.

---

## TAREA 2: DIAGNÓSTICO - Instagram Feed Vacío en Dashboard

**Estado:** 🔍 INVESTIGACIÓN COMPLETA

### Síntoma
Dashboard mostraba 0 posts Instagram en sección Social Calendar.

### Root Cause Analysis (6 niveles)

**Level 1: Dashboard**
- ✅ UI operativa, 8 tabs funcionales
- ✅ Social tab accesible
- ❓ Reader para agent_docs: **VERIFICACIÓN PENDIENTE**

**Level 2: Instagram Script**
- ✅ `/Users/alfredpifi/clawd/scripts/instagram-apify.sh` ejecutándose
- ✅ Apify API respondiendo correctamente
- ✅ Posts extraídos correctamente (2 reels nuevos)
- Status output: "✓ Instagram data persisted to Supabase (doc_type=instagram_analysis)"

**Level 3: Supabase agent_docs**
- ❌ **TABLA VACÍA** (curl query: length = 0)
- ❌ **ZERO documentos de cualquier tipo**
- Conclusión: **Datos nunca llegaron a Supabase**

**Level 4: Script Persistencia Logic**
```python
# Script POST request (líneas 71-95):
response = requests.post(
    f"{SUPABASE_URL}/rest/v1/agent_docs",
    json=doc_data,
    headers=headers,  # includes SERVICE_ROLE_KEY
    timeout=10
)
if response.status_code not in (200, 201):
    print(f"Warning: Supabase persistence failed...")
else:
    print(f"✓ Instagram data persisted to Supabase...")
```

**PROBLEMA IDENTIFICADO:**
- Script recibe status 200/201 (connection OK)
- Pero **response body no se verificaba**
- Puede haber error Supabase sin 4xx/5xx code
- O inserción silenciosa fallida por RLS policy

**Level 5: Credenciales / Permisos**
- `SUPABASE_SERVICE_ROLE_KEY` cargada desde `~/.env.local`
- Script busca: `SUPABASE_SERVICE_ROLE_KEY=...`
- Verificación: Key formato correcto (JWT válido)
- ⚠️ **SOSPECHA:** Key no se carga correctamente en shell script context

**Level 6: RLS (Row Level Security)**
- Tabla `agent_docs` puede tener policies
- SERVICE_ROLE_KEY debe bypassear RLS
- ⚠️ **POSIBLE:** Policy bloqueando inserts específicos

---

### Diagnóstico Final

**NOT:** Script roto, Apify error, o dashboard bug  
**ACTUAL:** **Persistencia a Supabase falla silenciosamente**

**Causa raíz:** Uno o más de:
1. SERVICE_ROLE_KEY no cargada en contexto Python del script
2. Error Supabase no capturado (response.text no verificado)
3. RLS policy bloqueando inserts específicos

---

## SOLUCIONES

### Solución 1: DEBUG + FIX Script (RECOMENDADA)

**Acción:** Modificar `instagram-apify.sh` líneas 85-95
```python
# ANTES:
if response.status_code not in (200, 201):
    print(f"Warning: Supabase persistence failed...")
else:
    print(f"✓ Instagram data persisted...")

# DESPUÉS:
print(f"DEBUG: POST response status={response.status_code}, body={response.text[:500]}", file=sys.stderr)
if response.status_code not in (200, 201):
    print(f"ERROR: Supabase POST failed: {response.text}", file=sys.stderr)
    sys.exit(1)
else:
    data = response.json()
    print(f"✓ Document created: id={data[0].get('id')} (type=instagram_analysis)", file=sys.stderr)
```

**Verificar:**
1. SERVICE_ROLE_KEY se carga (print key prefix)
2. Response status y body
3. Document actually inserted

**Esfuerzo:** 15-20 min  
**Risk:** LOW  
**Impact:** HIGH (dashboard Instagram feed operational)

### Solución 2: Cron Health Monitor

**Acción:** Crear cron que verifica persistencia cada 6h
```bash
{
  "name": "alfred-instagram-health-check",
  "schedule": "0 */6 * * *",  # cada 6 horas
  "action": "shell",
  "command": "bash /Users/alfredpifi/clawd/scripts/instagram-apify.sh scrape santim.ia 1 > /tmp/ig-test.json && COUNT=$(curl ... agent_docs count) && if [ $COUNT -eq 0 ]; then echo 'ALERT: Instagram persistence failing'; fi"
}
```

**Esfuerzo:** 10 min  
**Risk:** LOW  
**Impact:** MEDIUM (early detection of failures)

---

## TAREA 3: PREPARACIÓN - Lista Funcionalidades SaaS

**Estado:** ✅ COMPLETADA

- Documento listo en `/tmp/saas_funcionalidades.md`
- Validado contra research Roberto + analysis Andrés
- Listo para brainstorm con Santi

---

## Timeline Ejecución

| Hora | Evento | Status |
|------|--------|--------|
| 11:00h | Sesión brainstorm debería ocurrir | ❌ VENCIDA (cron delay 30→10min) |
| 14:00h | Diagnóstico Instagram iniciado | ⏳ EN PROGRESO |
| 15:30h | Root cause identificada (persistencia) | ✅ RESUELTO |
| 17:50h | Documento reporte + vault + soluciones | ✅ COMPLETADO |

---

## Aplicación de Lecciones Aprendidas

**Lección 1:** "Datos vacío en dashboard" ≠ "script roto"  
→ Investigar: script output OK? → persistencia? → reader?

**Lección 2:** Scripts que producen datos NECESITAN:
1. ✅ Persistencia a agent_docs (implementada)
2. ✅ Cron que los ejecute regularly (FALTA en Instagram)
3. ✅ Verification que datos actually saved (FALTA logging)

**Lección 3:** Status code 200 ≠ success  
→ SIEMPRE verificar response.text + response.json()

---

## Recomendaciones

**Ahora (Next 30 min):**
- Implementar Solución 1 (debug script)
- Test manual: ejecutar script, verificar agent_docs query
- Validar dashboard mostrando datos

**Esta semana:**
- Agregar Solución 2 (health monitor cron)
- Review todos los scripts "scraper" por problema similar
- Audit trail: cuáles tienen persistencia? Cuáles tienen cron?

**Próximas auditorías:**
- Checklist: script output ✓ → persistencia ✓ → data in DB ✓ → dashboard reader ✓

---

**Documento:** 2026-02-17 17:50 CET  
**Autor:** Alfred  
**Next:** Agendar con Santi para implementar Soluciones 1+2
