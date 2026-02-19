#!/bin/bash

##############################################################################
# DEDUP-TASK.SH — Evita crear tareas duplicadas
#
# Propósito:
#   - Antes de crear tarea, verifica si existe
#   - Si existe hace <30min → SKIP (debounce)
#   - Si existe hace >30min → ACTUALIZAR (en lugar de crear)
#   - Si NO existe → CREAR normalmente
#
# Uso:
#   bash dedup-task.sh create "DIAGNÓSTICO: Instagram feed vacío" alfred "diagnóstico"
#
##############################################################################

set -e

ACTION="$1"
TITLE="$2"
CREATED_BY="$3"
TASK_TYPE="${4:-system}"

SUPABASE_URL="https://xacthbehposxdrfqajwz.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY3RoYmVocG9zeGRyZnFhand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzY5MjAsImV4cCI6MjA4NTUxMjkyMH0.GNYBVoVzkHsB8lANCCuihURppO5oCI36WwVrc5YeQU0"

case "$ACTION" in
  create)
    # Extraer keyword principal del título (primeras palabras)
    KEYWORD=$(echo "$TITLE" | cut -d: -f1 | tr '[:lower:]' '[:upper:]')
    
    echo "🔍 Buscando duplicados de: $KEYWORD..."
    
    # Buscar tarea similar creada por mismo autor
    EXISTING=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?created_by=eq.${CREATED_BY}&title=ilike.%${KEYWORD}%&select=id,title,created_at" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "apikey: $SUPABASE_KEY" 2>/dev/null || echo "[]")
    
    # Validar JSON y contar
    COUNT=$(echo "$EXISTING" | jq 'length // 0' 2>/dev/null || echo "0")
    
    if [ "$COUNT" -gt 0 ]; then
      # Existe al menos una tarea similar
      LAST_ID=$(echo "$EXISTING" | jq -r '.[0].id')
      LAST_CREATED=$(echo "$EXISTING" | jq -r '.[0].created_at')
      LAST_TITLE=$(echo "$EXISTING" | jq -r '.[0].title')
      
      # Calcular tiempo transcurrido
      LAST_TIMESTAMP=$(date -d "$LAST_CREATED" +%s)
      NOW_TIMESTAMP=$(date +%s)
      DIFF=$((NOW_TIMESTAMP - LAST_TIMESTAMP))
      DIFF_MIN=$((DIFF / 60))
      
      if [ $DIFF -lt 1800 ]; then
        # Hace <30min → SKIP (debounce)
        echo "⏸️  DEBOUNCE: Tarea similar creada hace ${DIFF_MIN}min"
        echo "   ID: $LAST_ID"
        echo "   Título: $LAST_TITLE"
        echo "   Status: SKIPPED (ejecutada recientemente)"
        exit 0
      else
        # Hace >30min → ACTUALIZAR en lugar de crear
        echo "🔄 ACTUALIZAR: Tarea similar existe desde hace ${DIFF_MIN}min"
        echo "   ID: $LAST_ID"
        echo "   Acción: Actualizar timestamp"
        
        # Actualizar updated_at
        curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_tasks?id=eq.${LAST_ID}" \
          -H "Authorization: Bearer $SUPABASE_KEY" \
          -H "apikey: $SUPABASE_KEY" \
          -H "Content-Type: application/json" \
          -d '{"updated_at":"now()"}' > /dev/null
        
        echo "✅ Tarea actualizada: $LAST_ID"
        exit 0
      fi
    else
      # No existe → CREAR normalmente
      echo "✅ NUEVA TAREA: No hay duplicados detectados"
      echo "   Puedes crear: $TITLE"
      exit 0
    fi
    ;;
  
  cleanup)
    # Eliminar duplicados viejos (> 48h, completadas)
    echo "🧹 Limpiando duplicados viejos..."
    
    # Esto es peligroso, solo para emergencias
    echo "⚠️  CLEANUP: No implementado (evita borrar data)"
    exit 1
    ;;
  
  *)
    echo "Uso: bash dedup-task.sh [create|cleanup] [title] [created_by] [task_type]"
    exit 1
    ;;
esac
