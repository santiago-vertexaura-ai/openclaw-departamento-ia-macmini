# KANBAN SYSTEM — Sincronización de Tareas en Tiempo Real

**Status:** ✅ ACTIVO  
**Fecha Setup:** 18 Feb 2026  
**Propósito:** Todos los agentes ven sus tareas asignadas + Alfred controla el flujo  

---

## 🎯 Problema Resuelto

Antes: Tareas completadas quedaban "flotando" en Supabase sin cierre administrativo. No había visibilidad de qué tareas cada agente tenía asignadas. Los crons no sabían qué ejecutar.

**Ahora:** Sistema centralizado donde:
- ✅ Cada agente ve sus tareas pendientes en tiempo real
- ✅ Alfred cierra automáticamente tareas completadas
- ✅ Detecta bloqueadas (en progreso >1h)
- ✅ Auditoría completa: created → in_progress → completed → archived

---

## 📋 Estructura del Kanban

### Estados de Tarea
```
pendiente        → En cola, esperando agente
en_progreso      → Agente trabajando
completada       → Tarea terminada, result llenado
archivada        → Tarea cerrada administrativamente (solo Alfred)
fallida          → Tarea falló, agente reporta error
```

### Tabla: agent_tasks (Supabase)
```json
{
  "id": "uuid",
  "title": "Investigar tendencias X/Twitter",
  "assigned_to": "roberto",        // MINÚSCULAS (alfred, roberto, andres, marina, arturo, alex)
  "created_by": "alfred",
  "task_type": "research|news_scan|content_creation|report|analysis",
  "priority": "urgente|alta|media|baja",
  "status": "pendiente|en_progreso|completada|archivada|fallida",
  "brief": {"tema":"...", "plataformas":[], "comentarios":"..."},
  "result": null,                   // Se llena cuando completa
  "comments": [],                   // Feedback de Santi
  "created_at": "2026-02-18T12:00:00Z",
  "updated_at": "2026-02-18T14:30:00Z",
  "completed_at": null,
  "archived_at": null
}
```

---

## 🛠️ Herramientas Disponibles

### 1. **kanban-sync.sh** — Script Central
Ubicación: `/Users/alfredpifi/clawd/scripts/kanban-sync.sh`

```bash
# Ver tareas pendientes de un agente
bash kanban-sync.sh [agente] list_pending

# Ver tareas en progreso
bash kanban-sync.sh [agente] list_in_progress

# Ver tareas completadas (últimas 10)
bash kanban-sync.sh [agente] list_completed

# Exportar tareas a JSON local (para que agente las lea)
bash kanban-sync.sh [agente] export

# Alfred: Cerrar tareas completadas
bash kanban-sync.sh alfred close-completed

# Alfred: Monitoreo en tiempo real
bash kanban-sync.sh alfred monitor-kanban
```

### 2. **cron-kanban-manager.sh** — Cron de Alfred
Ubicación: `/Users/alfredpifi/clawd/workspace-alfred/cron-kanban-manager.sh`  
Frecuencia: 6h, 10h, 14h, 18h, 22h CET

**Qué hace:**
- Monitorea estado general del kanban
- Cierra tareas completadas
- Detecta tareas bloqueadas (en progreso >1h)
- Alertas si hay tareas sin asignar
- Guarda estado para dashboard

### 3. **KANBAN-PROTOCOL.md** — Guía de Integración
Ubicación: `/Users/alfredpifi/clawd/docs/KANBAN-PROTOCOL.md`

**Cómo integrar en tu cron:**
```bash
# Paso 1: Al inicio del cron
bash /Users/alfredpifi/clawd/scripts/kanban-sync.sh "[AGENT]" "export"

# Paso 2: Cargar tareas
TASKS_FILE="/Users/alfredpifi/clawd/memory/kanban-[AGENT]-pending.json"
jq '.[]' "$TASKS_FILE"  # Itera cada tarea

# Paso 3: Procesa tarea
# ... tu lógica ...

# Paso 4: Marca como completada
bash /Users/alfredpifi/clawd/scripts/tasks.sh complete "$task_id" '{"result":"..."}'
```

---

## 📍 Flujo de Trabajo Completo

### Para Crear Tarea (Santi o Alfred)

```bash
curl -s -X POST "https://xacthbehposxdrfqajwz.supabase.co/rest/v1/agent_tasks" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Investigar tendencias IA",
    "assigned_to": "roberto",            # ⚠️ MINÚSCULAS
    "created_by": "alfred",
    "task_type": "research",
    "priority": "alta",
    "status": "pendiente",
    "brief": {
      "tema": "Inteligencia Artificial",
      "fuentes": ["twitter", "reddit", "news"]
    },
    "comments": [{
      "author": "Santi",
      "text": "Enfócate en frameworks, no en prompts genéricos"
    }]
  }'
```

### Para que Agente Ejecute

1. **Cron inicia** → `kanban-sync.sh [agente] export`
2. **Agente carga** → Lee `kanban-[agente]-pending.json`
3. **Agente ejecuta** → Procesa cada tarea
4. **Agente reporta** → `tasks.sh complete [id] '{...}'`
5. **Alfred sincriza** → `kanban-sync.sh alfred close-completed` (cada 4h)

---

## 🎯 Ejemplo: Roberto Procesa Tareas

```bash
#!/bin/bash
# cron-roberto.sh

AGENT="roberto"
WORKSPACE="/Users/alfredpifi/clawd"

# STEP 1: EXPORT (sincroniza kanban)
bash "$WORKSPACE/scripts/kanban-sync.sh" "$AGENT" "export"

# STEP 2: LOAD TASKS
TASKS_FILE="$WORKSPACE/memory/kanban-${AGENT}-pending.json"
if [ ! -f "$TASKS_FILE" ]; then
  echo "Sin tareas. Idle."
  exit 0
fi

# STEP 3: ITERATE TASKS
jq -r '.[] | "\(.id)|\(.title)|\(.task_type)"' "$TASKS_FILE" | \
while IFS='|' read -r id title type; do
  
  # Mark as in-progress
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_tasks?id=eq.${id}" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"status":"en_progreso"}' > /dev/null
  
  # EXECUTE (research task)
  result=$(bash "$WORKSPACE/workspace-roberto/scripts/research.sh" "$title")
  
  # Mark as completed
  curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_tasks?id=eq.${id}" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"completada\",\"result\":$(echo "$result" | jq -Rs .)}" > /dev/null
  
  echo "✅ Completada: $title"
done

echo "✅ Cron Roberto completado"
```

---

## 🔴 Regla CRÍTICA: assigned_to MINÚSCULAS

```
✅ CORRECTO:   assigned_to: "marina"
❌ INCORRECTO: assigned_to: "Marina"
```

**Por qué:** Los crons buscan `assigned_to=eq.marina` (minúsculas). Si está con mayúscula, el cron NO detecta la tarea.

**Validación automática:**
- Cron `kanban-validator` ejecuta cada hora
- Detecta y CORRIGE automáticamente cualquier tarea con mayúsculas
- Si encuentras tarea bloqueada: `bash scripts/validate-kanban-supabase-sync.sh`

---

## 📊 Monitoreo y Alertas

### Dashboard Alfred

```bash
# Ver estado general
bash kanban-sync.sh alfred monitor-kanban

# Output:
# Total Tareas:     42
# Pendientes:       12
# En Progreso:      5
# Completadas:      25
#
# Tareas por agente:
#   robert:  3 pendientes
#   marina:  2 pendientes
#   andres:  1 pendientes
```

### Alertas Automáticas

1. **Tareas bloqueadas** (en progreso >1h):
   - Cron detecta y avisa a Santi
   - Incluye detalles: agente, tarea, última actualización

2. **Tareas sin asignar**:
   - Cron detecta trabajo pendiente sin asignar
   - Avisa que hay backlog

3. **Errores de sync**:
   - Si una tarea falla múltiples veces
   - Santi recibe alerta con error logs

---

## 📈 Métricas & Auditoría

Archivo: `/Users/alfredpifi/clawd/memory/kanban-state.json`

```json
{
  "timestamp": "2026-02-18T22:00:00Z",
  "stalled_count": 0,
  "unassigned_count": 2,
  "pending_by_agent": {
    "roberto": 3,
    "marina": 2,
    "andres": 1
  },
  "cron_status": "completed"
}
```

---

## 🚀 Próximos Pasos

### Para Todos los Agentes (ANTES 20 FEB)

Integra `kanban-sync.sh` en tu cron:

- [ ] **Roberto**: Agregar `export` al inicio de `cron-morning-scan.sh`
- [ ] **Andrés**: Agregar `export` al inicio de `cron-andres.sh`
- [ ] **Marina**: Agregar `export` al inicio de `cron-marina.sh`
- [ ] **Arturo**: Agregar `export` al inicio de `cron-arturo.sh`
- [ ] **Alex**: Agregar `export` al inicio de `cron-alex.sh`

### Para Alfred (ACTIVO YA)

- ✅ Cron `alfred-kanban-manager` ejecuta cada 6h
- ✅ Cierra tareas completadas automáticamente
- ✅ Detecta bloqueadas
- ✅ Envia alertas a Santi

---

## 🎓 Comandos Útiles (Santi)

```bash
# Ver qué tareas pendientes tiene Roberto
bash kanban-sync.sh roberto list_pending

# Ver qué tareas tiene Marina en progreso
bash kanban-sync.sh marina list_in_progress

# Ver estado general del kanban
bash kanban-sync.sh alfred monitor-kanban

# Crear nueva tarea para Roberto (desde CLI)
curl -X POST "$SUPABASE_URL/rest/v1/agent_tasks" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Investigar X",
    "assigned_to": "roberto",
    "task_type": "research",
    "priority": "alta"
  }'
```

---

## ✅ Status Checklist

- [x] Script `kanban-sync.sh` creado y funcional
- [x] Cron `alfred-kanban-manager` configurado
- [x] KANBAN-PROTOCOL.md documentado
- [x] Ejemplo de integración completo
- [x] Validador automático de minúsculas
- [x] Alertas configuradas en Telegram
- [ ] Agentes integran en sus crons (target: 20 Feb)
- [ ] Dashboard muestra kanban en tiempo real

---

**Estado:** ✅ SISTEMA LISTO PARA TODOS LOS AGENTES

Próxima integración: cada agente agrega 2 líneas a su cron. Punto.

