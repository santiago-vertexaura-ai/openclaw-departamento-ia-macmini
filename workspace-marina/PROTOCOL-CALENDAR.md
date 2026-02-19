---
title: "Marina - Protocol: Direct Calendar Generation (NO DOCUMENTOS)"
date: 2026-02-18
status: "OBLIGATORIO"
---

# 📅 PROTOCOLO: Generar Directamente al Calendario

**REGLA OBLIGATORIA:** Marina NO genera documentos. TODO va directo al calendario en Supabase.

---

## ¿CÓMO FUNCIONA?

**Workflow nuevo:**
1. Recibes tarea con `task_type = "content_creation"`
2. Generas el post (título + contenido + plataforma)
3. Completas la tarea en Supabase **con JSON en el campo "result"**
4. **Cron automático (cada 5 min)** detecta y agrega al calendar
5. Santi revisa en dashboard Social Calendar tab
6. Si aprueba → post aparece en platform a la hora programada
7. Si pide revisión → feedback aparece en panel y vuelves a generar

**CERO documentos intermedios.**

---

## CÓMO COMPLETAR UNA TAREA

**NO uses `add-to-calendar.sh` manualmente.** El cron lo hace automáticamente.

**Tú solo completas la tarea con JSON:**

```bash
bash scripts/tasks.sh complete <TASK_ID> '{
  "content": "Aquí está el contenido completo del post...",
  "platform": "twitter",
  "scheduled_at": "2026-02-20T08:00:00Z"
}'
```

**Parámetros JSON:**
- `content`: El post completo (título + body)
- `platform`: twitter, linkedin, instagram, tiktok, youtube, email
- `scheduled_at`: (opcional) ISO 8601 format. Default: next day 08:00

### Ejemplo Real

```bash
bash scripts/tasks.sh complete ee3d0cac-e0e7-4979-9713-d16d2dabfe7d '{
  "content": "🚀 Aquí están los 5 agentes IA de VertexAura trabajando en tiempo real...",
  "platform": "twitter",
  "scheduled_at": "2026-02-20T08:00:00Z"
}'
```

**El resto es automático:**
- Cron cada 5 min detecta tarea completada
- Agrega automáticamente a content_calendar
- Santi lo ve en Social Calendar tab
- Si aprueba → status "approved" → publica a la hora

---

## ESTADOS CALENDAR

| Status | Significado | Quién lo controla |
|--------|-------------|-------------------|
| **programado** | Post listo, esperando hora | Marina (by default) |
| **borrador** | Aún en edición | Marina (si quieres guardar borrador) |
| **publicado** | Ya publicado en red | Sistema (cron automation) |
| **fallido** | Error en publicación | Sistema (si falla) |

---

## REVIEW STATUS

| Status | Significado | Siguiente paso |
|--------|-------------|----------------|
| **pending_review** | Esperando aprobación Santi | Santi revisa en dashboard |
| **approved** | Aprobado, listo publicar | Cron publica automáticamente |
| **rejected** | Santi pide cambios | Tarea vuelve a Marina con feedback |

---

## WORKFLOW COMPLETO (NUEVO)

```
Marina recibe tarea (content_creation)
  ↓
Genera post (en memoria, NO documento, NO guardar local)
  ↓
Completa tarea: bash tasks.sh complete <id> '{content, platform, scheduled_at}'
  ↓
Cron sync-marina-tasks-to-calendar (cada 5 min):
  - Detecta tarea completada
  - Extrae JSON del campo result
  - Agrega automáticamente a content_calendar en Supabase
  ↓
Post aparece en Dashboard → Social Calendar tab (izquierda)
  ↓
Santi hace click en post → Panel derecha (50% pantalla) con:
  - Preview completo del contenido
  - Platform, hora programada, autor
  - Botones: APROBAR / REVISAR / RECHAZAR
  ↓
Si Santi aprueba:
  - Click "Aprobar"
  - Status → "approved"
  - Cron automático publica a la hora programada
  
Si Santi pide revisión:
  - Click "Revisar"
  - Escribe feedback en textarea
  - Sistema crea automáticamente nueva tarea para Marina
  - Marina recibe tarea con feedback
  - Genera variante mejorada
  - Completa nuevamente (vuelve al calendar)

Si Santi rechaza:
  - Click "Rechazar"
  - Escribe feedback/razón
  - Sistema crea tarea URGENTE para Marina
  - Marina regenara desde cero
```

**CERO documentos. TODO en el calendar. Santi controla TODO desde dashboard.**

---

## INFORMACIÓN IMPORTANTE

**assigned_to debe ser minúscula:**
- ✅ Correcto: `assigned_to: "marina"`
- ❌ Incorrecto: `assigned_to: "Marina"`

Si cometes error, validador automático lo corrige cada hora.

---

## PRÓXIMAS TAREAS MARINA

Cada tarea que recibas ahora incluirá instrucciones en el brief sobre:
- Plataformas objetivo
- Horario sugerido
- Links/referencias
- Feedback previo (si existe)

Cuando completes, **SIEMPRE:** 
```bash
bash scripts/add-to-calendar.sh ...
```

---

**Fecha creación:** 18 Febrero 2026  
**Status:** 🟢 ACTIVO  
**Responsable:** Marina  
**Validación:** Cron automático cada hora
