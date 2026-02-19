#!/bin/bash

##############################################################################
# WRAPPER: PROCESAR TAREAS DE ALFRED (CON DEDUPLICACIÓN)
#
# Este script es el punto de entrada para el cron OpenClaw
# Contiene toda la lógica con protección contra duplicados
#
##############################################################################

set -e

WORKSPACE="/Users/alfredpifi/clawd"
SUPABASE_URL="https://xacthbehposxdrfqajwz.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY3RoYmVocG9zeGRyZnFhand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzY5MjAsImV4cCI6MjA4NTUxMjkyMH0.GNYBVoVzkHsB8lANCCuihURppO5oCI36WwVrc5YeQU0"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

##############################################################################
# FUNCIÓN: Crear tarea CON deduplicación
##############################################################################

create_task_safe() {
  local title="$1"
  local created_by="$2"
  local task_type="$3"
  local brief_json="$4"
  
  echo "🔍 Verificando: $title"
  
  # PASO 1: Buscar si existe tarea con título SIMILAR creada hace <30min
  # Usar búsqueda by keyword principal
  local keyword=$(echo "$title" | cut -d: -f1)
  
  # Calcular fecha hace 30 min (compatible con macOS y Linux)
  local date_30min_ago
  if [ "$(uname)" == "Darwin" ]; then
    # macOS
    date_30min_ago=$(date -u -v-30M +%Y-%m-%dT%H:%M:%S)
  else
    # Linux
    date_30min_ago=$(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S)
  fi
  
  # Buscar tareas con titulo similar (case-insensitive)
  local recent_tasks=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?created_by=eq.${created_by}&created_at=gte.${date_30min_ago}&select=id,title" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" 2>/dev/null)
  
  # Ver si alguna tarea reciente tiene el keyword en el título
  if echo "$recent_tasks" | jq -e ".[] | select(.title | contains(\"$keyword\"))" > /dev/null 2>&1; then
    echo "⏸️  SKIP: $title (duplicado creado hace <30min)"
    return 0
  fi
  
  # PASO 2: No hay duplicado reciente, crear tarea
  echo "✅ Creando: $title"
  
  curl -s -X POST "$SUPABASE_URL/rest/v1/agent_tasks" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"assigned_to\": \"$created_by\",
      \"created_by\": \"$created_by\",
      \"task_type\": \"$task_type\",
      \"priority\": \"alta\",
      \"status\": \"pendiente\",
      \"brief\": $brief_json
    }" > /dev/null 2>&1
}

##############################################################################
# EJECUTAR TAREAS
##############################################################################

echo "[$TIMESTAMP] 🚀 CRON: Procesar tareas propias de Alfred"
echo ""

# TAREA 1: Recordatorio Brainstorm SaaS
create_task_safe \
  "RECORDATORIO: Sesión brainstorm SaaS (11:00-11:30h)" \
  "alfred" \
  "recordatorio" \
  '{"evento":"brainstorm SaaS","horario":"11:00-11:30h"}'

# TAREA 2: Diagnóstico Instagram Feed
create_task_safe \
  "DIAGNÓSTICO: Instagram feed vacío en dashboard" \
  "alfred" \
  "diagnóstico" \
  '{"problema":"Instagram feed vacío","prioridad":"crítica"}'

# TAREA 3: Preparación Funcionalidades SaaS
create_task_safe \
  "PREPARACIÓN: Lista funcionalidades SaaS" \
  "alfred" \
  "preparación" \
  '{"tema":"VertexAura SaaS","scope":"15 funcionalidades"}'

echo ""
echo "[$TIMESTAMP] ✅ CRON COMPLETADO (Con deduplicación activa)"

exit 0
