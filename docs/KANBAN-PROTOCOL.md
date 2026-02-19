# KANBAN PROTOCOL — Sincronización de Tareas en Tiempo Real

**Versión:** 1.0  
**Fecha:** 18 Feb 2026  
**Status:** ACTIVO  

---

## 🎯 Objetivo

Cada agente (Roberto, Andrés, Marina, Arturo, Alex) y Alfred pueden **consultar sus tareas asignadas en tiempo real** desde Supabase sin necesidad de intervención manual.

Todos los cron jobs **DEBEN** sincronizar el kanban al iniciar y al completar.

---

## 📋 Flujo de Trabajo

```
CRON INICIA
    ↓
1. TASK-PULL — Consulta tareas pendientes en Supabase
2. VERIFY-ASSIGNED — Valida que tareas sean para este agente
3. EXECUTE-TASKS — Ejecuta tareas (order: URGENTE > ALTA > MEDIA > BAJA)
4. UPDATE-STATUS — Marca tareas como completadas
    ↓
CRON TERMINA
```

---

## 🛠️ Integración en Cron Jobs

### Paso 1: Al Inicio del Cron

```bash
#!/bin/bash

AGENT_NAME="roberto"  # Cambiar según agente
WORKSPACE="/Users/alfredpifi/clawd"

# TASK-PULL: Sincronizar kanban
bash "$WORKSPACE/scripts/kanban-sync.sh" "$AGENT_NAME" "export"

# Cargar tareas
TASKS_FILE="$WORKSPACE/memory/kanban-${AGENT_NAME}-pending.json"

if [ ! -f "$TASKS_FILE" ]; then
  echo "❌ Sin tareas asignadas. Cron idle."
  exit 0
fi

# Contar tareas
TASK_COUNT=$(jq 'length' "$TASKS_FILE")
echo "📋 ${TASK_COUNT} tareas pendientes para ${AGENT_NAME}"

# Iterar tareas (order: priority)
jq -r '.[] | "\(.id)|\(.title)|\(.priority)|\(.task_type)|\(.brief | @json)"' "$TASKS_FILE" | \
while IFS='|' read -r task_id task_title priority task_type brief; do
  
  echo "🔄 Ejecutando: [$priority] $task_title"
  
  # MARK AS IN_PROGRESS
  bash "$WORKSPACE/scripts/tasks.sh" start "$task_id" 2>/dev/null || true
  
  # EXECUTE TASK (agent-specific logic)
  # ... agente hace su trabajo ...
  
  # MARK AS COMPLETED
  bash "$WORKSPACE/scripts/tasks.sh" complete "$task_id" '{"result":"..."}' 2>/dev/null || true
  
done

echo "✅ Cron completado para ${AGENT_NAME}"
```

### Paso 2: Después de Completar Tarea

```bash
# Al completar una tarea, SIEMPRE actualizar Supabase
bash "$WORKSPACE/scripts/tasks.sh" complete "$task_id" '{
  "result": "contenido generado",
  "completed_at": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
}'
```

### Paso 3: Alfred Cierra Tareas Completadas

```bash
#!/bin/bash
# Cron Alfred — ejecutar cada 4 horas

bash /Users/alfredpifi/clawd/scripts/kanban-sync.sh alfred close-completed

# Monitorear estado
bash /Users/alfredpifi/clawd/scripts/kanban-sync.sh alfred monitor-kanban
```

---

## 📊 Estructura de Tarea en Supabase

```json
{
  "id": "uuid",
  "title": "Investigar tendencias X/Twitter",
  "assigned_to": "roberto",
  "created_by": "alfred",
  "task_type": "research",
  "priority": "alta",
  "status": "pendiente",
  "brief": {
    "tema": "Inteligencia Artificial",
    "fuentes": ["twitter", "hacker-news", "reddit"],
    "max_resultados": 20
  },
  "result": null,
  "status": "pendiente",
  "created_at": "2026-02-18T12:00:00Z",
  "completed_at": null,
  "archived_at": null
}
```

---

## ✅ Checklist: Integrar Kanban en Cron

Para cada agente (Roberto, Andrés, Marina, Arturo, Alex):

- [ ] **Paso 1:** Agregar `task-pull` al inicio del cron
- [ ] **Paso 2:** Cargar JSON de tareas pendientes
- [ ] **Paso 3:** Iterar tareas por priority (DESC)
- [ ] **Paso 4:** Marcar como `en_progreso` al iniciar
- [ ] **Paso 5:** Ejecutar tarea (agent-specific)
- [ ] **Paso 6:** Marcar como `completada` al terminar
- [ ] **Paso 7:** Actualizar `result` field con output

---

## 🎯 Estados de Tarea

```
pendiente         → En cola, esperando agente
en_progreso       → Agente está trabajando
completada        → Tarea hecha, result llenado
archivada/cerrada → Tarea procesada por Alfred (cierre administrativo)
fallida           → Tarea falló (agente reporta error)
```

---

## 🔍 Cómo Alfred Monitorea

```bash
# 1. Ver qué tareas hay pendientes
bash kanban-sync.sh alfred list_pending

# 2. Ver estado en tiempo real
bash kanban-sync.sh alfred monitor-kanban

# 3. Cerrar tareas completadas
bash kanban-sync.sh alfred close-completed
```

---

## 🚨 Si una Tarea Falla

Si un agente encuentra error en tarea:

```bash
# Marcar como fallida
bash /Users/alfredpifi/clawd/scripts/tasks.sh" fail "$task_id" '{
  "error": "Razón del fallo",
  "stderr": "output del error"
}'

# Alfred vera tarea fallida y re-asignará o investigará
```

---

## 📈 Ventajas de este Protocolo

✅ **Visibilidad en tiempo real** — Todos ven su kanban actualizado  
✅ **Sin duplicados** — Tareas no se ejecutan 2x  
✅ **Auto-priorización** — URGENTE se ejecuta primero  
✅ **Auditoría completa** — Cada tarea tracked desde inicio a fin  
✅ **Escalable** — Agregar nuevos agentes es trivial  
✅ **Resiliente** — Si cron falla, tarea sigue pendiente para próximo ciclo  

---

## 🔧 Ejemplo Real: Cron Roberto

```bash
#!/bin/bash
# /Users/alfredpifi/clawd/workspace-roberto/cron-roberto.sh

AGENT="roberto"
WORKSPACE="/Users/alfredpifi/clawd"

echo "🚀 Cron Roberto — $(date)"

# TASK-PULL
bash "$WORKSPACE/scripts/kanban-sync.sh" "$AGENT" "export"

TASKS_FILE="$WORKSPACE/memory/kanban-${AGENT}-pending.json"

if [ ! -f "$TASKS_FILE" ]; then
  echo "Sin tareas. Idle."
  exit 0
fi

# Procesar tareas
jq -r '.[] | "\(.id)|\(.title)|\(.task_type)"' "$TASKS_FILE" | \
while IFS='|' read -r id title type; do
  
  # START
  curl -s -X PATCH "https://xacthbehposxdrfqajwz.supabase.co/rest/v1/agent_tasks?id=eq.${id}" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"status":"en_progreso"}' > /dev/null
  
  # EXECUTE (example: research task)
  case "$type" in
    research)
      result=$(bash "$WORKSPACE/workspace-roberto/scripts/research.sh" "$title")
      ;;
    news_scan)
      result=$(bash "$WORKSPACE/workspace-roberto/scripts/news-scan.sh" "$title")
      ;;
  esac
  
  # COMPLETE
  curl -s -X PATCH "https://xacthbehposxdrfqajwz.supabase.co/rest/v1/agent_tasks?id=eq.${id}" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"completada\",\"result\":$(echo "$result" | jq -Rs .)}" > /dev/null
  
  echo "✅ Completada: $title"
done

echo "✅ Cron Roberto finalizado"
```

---

## 📞 Soporte

Si hay dudas sobre cómo integrar kanban-sync en tu cron:

1. Revisar script: `/Users/alfredpifi/clawd/scripts/kanban-sync.sh`
2. Revisar ejemplo: Cron Roberto (arriba)
3. Consultar a Alfred: `bash kanban-sync.sh [agent] list_pending`

---

**Status:** ✅ ACTIVO — Todos los agentes DEBEN integrar para 20 Feb 2026

