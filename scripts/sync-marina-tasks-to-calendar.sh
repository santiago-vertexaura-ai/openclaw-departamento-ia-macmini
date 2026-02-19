#!/bin/bash

# SYNC MARINA TASKS TO CALENDAR
# Detecta tareas de Marina completadas y las agrega automáticamente a calendar
# Ejecutado: cron cada 5 min

set -euo pipefail

source ~/.env.local 2>/dev/null || { echo "❌ .env.local no encontrado"; exit 1; }

API="$SUPABASE_URL/rest/v1"
AUTH=(
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
  -H "Content-Type: application/json"
)

echo "🔄 Sincronizando tareas Marina → calendar..."

# Buscar tareas Marina completadas QUE NO ESTÉN EN CALENDAR AÚN
TASKS=$(curl -s "$API/agent_tasks?assigned_to=eq.marina&status=eq.completada&select=id,title,result" \
  "${AUTH[@]}" 2>/dev/null)

TASK_COUNT=$(echo "$TASKS" | jq 'length')
echo "📋 Tareas completadas encontradas: $TASK_COUNT"

if [ "$TASK_COUNT" -eq 0 ]; then
  echo "✅ Sin tareas nuevas"
  exit 0
fi

# Procesar cada tarea
echo "$TASKS" | jq -c '.[]' | while read -r TASK; do
  TASK_ID=$(echo "$TASK" | jq -r '.id')
  TITLE=$(echo "$TASK" | jq -r '.title')
  RESULT=$(echo "$TASK" | jq -r '.result // empty')
  
  # Verificar si YA ESTÁ en calendar
  EXISTING=$(curl -s "$API/content_calendar?task_id=eq.$TASK_ID" \
    "${AUTH[@]}" 2>/dev/null | jq 'length')
  
  if [ "$EXISTING" -gt 0 ]; then
    echo "  ✅ Tarea $TASK_ID ya en calendar"
    continue
  fi
  
  # Extraer info del result JSON (Marina pone: {content, platform, scheduled_at})
  if [ ! -z "$RESULT" ]; then
    CONTENT=$(echo "$RESULT" | jq -r '.content // ""')
    PLATFORM=$(echo "$RESULT" | jq -r '.platform // "twitter"')
    SCHEDULED=$(echo "$RESULT" | jq -r '.scheduled_at // ""')
    
    if [ -z "$SCHEDULED" ]; then
      SCHEDULED=$(date -u -v+1d +%Y-%m-%dT08:00:00Z)
    fi
    
    # Agregar a calendar
    echo "  📅 Agregando: $TITLE ($PLATFORM)"
    
    curl -s -X POST "$API/content_calendar" \
      "${AUTH[@]}" \
      -d "{
        \"title\": $(echo "$TITLE" | jq -R .),
        \"content\": $(echo "$CONTENT" | jq -R .),
        \"platform\": \"$PLATFORM\",
        \"scheduled_at\": \"$SCHEDULED\",
        \"task_id\": \"$TASK_ID\",
        \"author\": \"marina\",
        \"status\": \"programado\",
        \"review_status\": \"pending_review\"
      }" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
      echo "    ✅ Agregado al calendar"
    else
      echo "    ❌ Error agregando al calendar"
    fi
  else
    echo "  ⚠️  Tarea $TASK_ID sin result JSON"
  fi
done

echo "✅ Sincronización completada"
