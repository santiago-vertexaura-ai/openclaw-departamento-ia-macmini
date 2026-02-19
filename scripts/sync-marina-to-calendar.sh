#!/bin/bash

##############################################################################
# CRON: SINCRONIZAR TAREAS MARINA → CONTENT_CALENDAR
#
# Propósito: Detectar tareas completadas de Marina y agregarlas a content_calendar
# Frecuencia: Cada 5 minutos
# Status: CRÍTICO para pipeline de contenido
#
##############################################################################

set -e

SUPABASE_URL="https://xacthbehposxdrfqajwz.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY3RoYmVocG9zeGRyZnFhand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzY5MjAsImV4cCI6MjA4NTUxMjkyMH0.GNYBVoVzkHsB8lANCCuihURppO5oCI36WwVrc5YeQU0"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/tmp/sync-marina-calendar.log"

echo "[$TIMESTAMP] 🔄 SINCRONIZANDO Marina → Content Calendar" >> "$LOG_FILE"

##############################################################################
# Buscar tareas completadas de Marina que NO están en content_calendar
##############################################################################

TASKS=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.marina&status=eq.completada&select=id,title,result,completed_at" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY")

TASK_COUNT=$(echo "$TASKS" | jq 'length')

echo "[$TIMESTAMP] 📋 Encontradas $TASK_COUNT tareas completadas de Marina" >> "$LOG_FILE"

# Iterar cada tarea
echo "$TASKS" | jq -c '.[]' | while read -r task; do
  TASK_ID=$(echo "$task" | jq -r '.id')
  TASK_TITLE=$(echo "$task" | jq -r '.title')
  RESULT=$(echo "$task" | jq -r '.result // empty')
  COMPLETED_AT=$(echo "$task" | jq -r '.completed_at')
  
  # Saltar si no hay result (tarea incompleta o sin contenido)
  if [ -z "$RESULT" ] || [ "$RESULT" = "null" ]; then
    echo "[$TIMESTAMP] ⏭️  SKIP: $TASK_TITLE (sin contenido)" >> "$LOG_FILE"
    continue
  fi
  
  # Extraer datos del result (soportar dos formatos: content o hooks)
  CONTENT=$(echo "$RESULT" | jq -r '.content // .hooks.principal // empty')
  PLATFORM=$(echo "$RESULT" | jq -r '.platform // .platforms[0] // "linkedin"')
  SCHEDULED_AT=$(echo "$RESULT" | jq -r '.scheduled_at // "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"')
  PLATFORMS_JSON=$(echo "$RESULT" | jq '.platforms // ["linkedin"]')
  HOOKS=$(echo "$RESULT" | jq '.hooks // {}')
  VISUAL_BRIEF=$(echo "$RESULT" | jq '.visual_brief // {}')
  FORMULAS=$(echo "$RESULT" | jq '.formulas_aplicadas // []')
  
  # Verificar si ya existe en content_calendar
  EXISTING=$(curl -s "$SUPABASE_URL/rest/v1/content_calendar?select=id&limit=1" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY")
  
  # Crear entrada en content_calendar
  echo "[$TIMESTAMP] ✅ Sincronizando: $TASK_TITLE ($PLATFORM)" >> "$LOG_FILE"
  
  # Crear JSON con SOLO los campos que existen en content_calendar
  CALENDAR_ENTRY=$(cat <<JSONEOF
{
  "title": "$TASK_TITLE",
  "content": "$CONTENT",
  "platform": "$PLATFORM",
  "scheduled_at": "$SCHEDULED_AT",
  "status": "pending_review",
  "review_status": "pending_review",
  "author": "marina",
  "task_id": "$TASK_ID",
  "content_preview": null,
  "feedback": null
}
JSONEOF
)
  
  curl -s -X POST "$SUPABASE_URL/rest/v1/content_calendar" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "$CALENDAR_ENTRY" > /dev/null 2>&1
  
  echo "[$TIMESTAMP] 📌 Agregado a calendar: $PLATFORM" >> "$LOG_FILE"
done

echo "[$TIMESTAMP] ✅ SINCRONIZACIÓN COMPLETADA" >> "$LOG_FILE"

# Limpiar log (mantener últimas 100 líneas)
tail -100 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"

exit 0
