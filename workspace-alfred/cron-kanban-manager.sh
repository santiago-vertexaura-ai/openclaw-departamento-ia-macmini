#!/bin/bash

##############################################################################
# CRON: ALFRED KANBAN MANAGER
# 
# Propósito:
#   - Sincronizar estado de tareas completadas
#   - Cerrar tareas (marcar como archivadas)
#   - Monitorear tareas vencidas o bloqueadas
#   - Alertas si hay problemas en el kanban
#
# Frecuencia: Cada 4 horas (6, 10, 14, 18, 22 CET)
# Status: ACTIVO desde 18 Feb 2026
#
##############################################################################

set -e

WORKSPACE="/Users/alfredpifi/clawd"
LOG_FILE="$WORKSPACE/memory/cron-kanban-manager.log"

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] ========== CRON: KANBAN MANAGER ==========" >> "$LOG_FILE"

##############################################################################
# 1. MONITOR KANBAN — Estado general
##############################################################################

echo "[$TIMESTAMP] 📊 Monitoreando kanban..." >> "$LOG_FILE"

bash "$WORKSPACE/scripts/kanban-sync.sh" alfred monitor-kanban >> "$LOG_FILE" 2>&1

##############################################################################
# 2. CLOSE COMPLETED — Cerrar tareas completadas
##############################################################################

echo "[$TIMESTAMP] 🔄 Cerrando tareas completadas..." >> "$LOG_FILE"

bash "$WORKSPACE/scripts/kanban-sync.sh" alfred close-completed >> "$LOG_FILE" 2>&1

##############################################################################
# 3. CHECK OVERDUE — Detectar tareas vencidas (sin progreso en >1h)
##############################################################################

echo "[$TIMESTAMP] ⏰ Detectando tareas vencidas..." >> "$LOG_FILE"

SUPABASE_URL="https://xacthbehposxdrfqajwz.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY3RoYmVocG9zeGRyZnFhand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzY5MjAsImV4cCI6MjA4NTUxMjkyMH0.GNYBVoVzkHsB8lANCCuihURppO5oCI36WwVrc5YeQU0"

# Tareas en progreso >1h sin actualización
STALLED=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?status=eq.en_progreso&select=id,title,assigned_to,updated_at" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY")

STALLED_COUNT=$(echo "$STALLED" | jq 'length')

if [ "$STALLED_COUNT" -gt 0 ]; then
  echo "[$TIMESTAMP] ⚠️  ${STALLED_COUNT} tareas en progreso (monitorear):" >> "$LOG_FILE"
  echo "$STALLED" | jq -r '.[] | "  - \(.assigned_to): \(.title) (last: \(.updated_at))"' >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] ✅ Sin tareas bloqueadas" >> "$LOG_FILE"
fi

##############################################################################
# 4. ASSIGN PENDING — Proponer asignación de tareas pendientes
##############################################################################

echo "[$TIMESTAMP] 📝 Revisando tareas sin asignar..." >> "$LOG_FILE"

UNASSIGNED=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=is.null&status=eq.pendiente&select=id,title" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY")

UNASSIGNED_COUNT=$(echo "$UNASSIGNED" | jq 'length')

if [ "$UNASSIGNED_COUNT" -gt 0 ]; then
  echo "[$TIMESTAMP] 🚨 ${UNASSIGNED_COUNT} tareas sin asignar:" >> "$LOG_FILE"
  echo "$UNASSIGNED" | jq -r '.[] | "  - ID: \(.id | .[0:8])… \(.title)"' >> "$LOG_FILE"
  echo "[$TIMESTAMP] ⚠️  ACCIÓN REQUERIDA: Revisar tareas no asignadas" >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] ✅ Todas las tareas están asignadas" >> "$LOG_FILE"
fi

##############################################################################
# 5. SUMMARY — Resumen por agente
##############################################################################

echo "[$TIMESTAMP] 📊 RESUMEN FINAL:" >> "$LOG_FILE"

for agent in alfred roberto andres marina arturo alex; do
  PENDING=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.pendiente&select=id" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq 'length')
  
  IN_PROGRESS=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.en_progreso&select=id" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq 'length')
  
  COMPLETED=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.completada&select=id" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq 'length')
  
  if [ "$PENDING" -gt 0 ] || [ "$IN_PROGRESS" -gt 0 ]; then
    echo "[$TIMESTAMP]   ${agent}: $PENDING pendientes | $IN_PROGRESS en progreso | $COMPLETED completadas" >> "$LOG_FILE"
  fi
done

##############################################################################
# 6. SAVE STATE — Guardar estado para dashboard
##############################################################################

echo "[$TIMESTAMP] 💾 Guardando estado para dashboard..." >> "$LOG_FILE"

cat > "$WORKSPACE/memory/kanban-state.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "stalled_count": $STALLED_COUNT,
  "unassigned_count": $UNASSIGNED_COUNT,
  "cron_status": "completed"
}
EOF

echo "[$TIMESTAMP] ✅ Cron completado" >> "$LOG_FILE"
echo "[$TIMESTAMP] ========================================" >> "$LOG_FILE"

# Mantener log limpio (últimas 500 líneas)
tail -500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"

exit 0
