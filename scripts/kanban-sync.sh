#!/bin/bash

##############################################################################
# KANBAN-SYNC.SH — Sincronización en tiempo real del Kanban (Supabase)
# 
# Propósito:
#   - Todos los agentes ven sus tareas asignadas en tiempo real
#   - Alfred monitora tareas completadas y las cierra
#   - Cada cron agente SIEMPRE consulta antes de ejecutar
#
# Uso:
#   bash kanban-sync.sh [agent_name] [action]
#   bash kanban-sync.sh marina list_pending      # Ver tareas pendientes de Marina
#   bash kanban-sync.sh alfred close-completed    # Cerrar tareas completadas
#   bash kanban-sync.sh alfred monitor-kanban     # Monitoreo 24/7 del kanban
#
##############################################################################

set -e

SUPABASE_URL="https://xacthbehposxdrfqajwz.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhY3RoYmVocG9zeGRyZnFhand6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzY5MjAsImV4cCI6MjA4NTUxMjkyMH0.GNYBVoVzkHsB8lANCCuihURppO5oCI36WwVrc5YeQU0"

AGENT_NAME="${1,,}"  # Lowercase
ACTION="${2:-list_pending}"
WORKSPACE="/Users/alfredpifi/clawd"

##############################################################################
# Colores para output
##############################################################################
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

##############################################################################
# FUNCIÓN: Listar tareas pendientes de un agente
##############################################################################
list_pending() {
  local agent="$1"
  
  echo -e "${BLUE}📋 Tareas PENDIENTES asignadas a: ${GREEN}${agent}${NC}\n"
  
  curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.pendiente&order=priority.desc,created_at.asc&select=id,title,priority,brief,status" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq -r '.[] | 
    "[\(.priority | ascii_upcase)] \(.id | .[0:8])… \(.title)\n  Brief: \(.brief | @json)\n"'
  
  # Contar totales
  local count=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.pendiente&select=id" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq 'length')
  
  echo -e "\n${GREEN}✅ Total: ${count} tareas pendientes${NC}\n"
}

##############################################################################
# FUNCIÓN: Listar tareas EN PROGRESO
##############################################################################
list_in_progress() {
  local agent="$1"
  
  echo -e "${BLUE}⏳ Tareas EN PROGRESO de: ${GREEN}${agent}${NC}\n"
  
  curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.en_progreso&select=id,title,priority,status" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq -r '.[] | "\(.id | .[0:8])… \(.title) [\(.status)]"'
}

##############################################################################
# FUNCIÓN: Listar tareas COMPLETADAS de un agente
##############################################################################
list_completed() {
  local agent="$1"
  
  echo -e "${BLUE}✓ Tareas COMPLETADAS de: ${GREEN}${agent}${NC}\n"
  
  curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.completada&order=completed_at.desc&limit=10&select=id,title,completed_at" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq -r '.[] | "\(.completed_at) \(.id | .[0:8])… \(.title)"'
}

##############################################################################
# FUNCIÓN: Cerrar tareas completadas (ALFRED ONLY)
##############################################################################
close_completed() {
  if [ "$AGENT_NAME" != "alfred" ]; then
    echo -e "${RED}❌ Solo Alfred puede cerrar tareas completadas${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}🔄 Cerrando tareas completadas...${NC}\n"
  
  # Buscar todas las tareas con status=completada (pending closure)
  local tasks=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?status=eq.completada&select=id,assigned_to,title" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY")
  
  local count=$(echo "$tasks" | jq 'length')
  
  if [ "$count" -eq 0 ]; then
    echo -e "${GREEN}✅ Sin tareas para cerrar${NC}\n"
    return 0
  fi
  
  echo "$tasks" | jq -r '.[] | "\(.id) - \(.assigned_to) - \(.title)"' | while read -r line; do
    local id=$(echo "$line" | cut -d' ' -f1)
    local agent=$(echo "$line" | cut -d'-' -f2 | xargs)
    local title=$(echo "$line" | cut -d'-' -f3- | xargs)
    
    echo -e "  ✓ Cierre: ${GREEN}${agent}${NC} — ${title}"
    
    # Marcar como cerrada (status = archivada, o simplemente completada + archived_at = now)
    curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_tasks?id=eq.${id}" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "apikey: $SUPABASE_KEY" \
      -H "Content-Type: application/json" \
      -d '{"status":"completada","archived_at":"now()"}' > /dev/null
  done
  
  echo -e "\n${GREEN}✅ ${count} tareas cerradas${NC}\n"
}

##############################################################################
# FUNCIÓN: Dashboard en tiempo real (ALFRED)
##############################################################################
monitor_kanban() {
  if [ "$AGENT_NAME" != "alfred" ]; then
    echo -e "${RED}❌ Solo Alfred puede monitorear el kanban${NC}"
    exit 1
  fi
  
  echo -e "${BLUE}📊 KANBAN DASHBOARD (modo monitoreo)${NC}\n"
  
  # Estado general
  local total=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?select=id" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq 'length')
  
  local pending=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?status=eq.pendiente&select=id" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq 'length')
  
  local in_progress=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?status=eq.en_progreso&select=id" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq 'length')
  
  local completed=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?status=eq.completada&select=id" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" | jq 'length')
  
  echo "Total Tareas:     ${BLUE}${total}${NC}"
  echo "Pendientes:       ${YELLOW}${pending}${NC}"
  echo "En Progreso:      ${YELLOW}${in_progress}${NC}"
  echo "Completadas:      ${GREEN}${completed}${NC}\n"
  
  # Por agente
  echo -e "${BLUE}📍 Tareas por agente:${NC}\n"
  for agent in alfred roberto andres marina arturo alex; do
    local agent_pending=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.pendiente&select=id" \
      -H "Authorization: Bearer $SUPABASE_KEY" \
      -H "apikey: $SUPABASE_KEY" | jq 'length')
    
    if [ "$agent_pending" -gt 0 ]; then
      echo "  ${GREEN}${agent}${NC}: ${YELLOW}${agent_pending}${NC} pendientes"
    fi
  done
  
  echo ""
}

##############################################################################
# FUNCIÓN: Export tareas a archivo local (para que agente lea)
##############################################################################
export_for_agent() {
  local agent="$1"
  local output_file="$WORKSPACE/memory/kanban-${agent}-pending.json"
  
  echo -e "${BLUE}📥 Exportando tareas para ${GREEN}${agent}${NC}...\n"
  
  curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${agent}&status=eq.pendiente&order=priority.desc&select=id,title,priority,brief,task_type,status" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" > "$output_file"
  
  local count=$(jq 'length' "$output_file")
  
  echo -e "${GREEN}✅ ${count} tareas exportadas a:${NC}"
  echo "   ${output_file}\n"
}

##############################################################################
# MAIN
##############################################################################

case "$ACTION" in
  list_pending)
    list_pending "$AGENT_NAME"
    ;;
  list_in_progress)
    list_in_progress "$AGENT_NAME"
    ;;
  list_completed)
    list_completed "$AGENT_NAME"
    ;;
  close-completed)
    close_completed
    ;;
  monitor-kanban)
    monitor_kanban
    ;;
  export)
    export_for_agent "$AGENT_NAME"
    ;;
  *)
    echo -e "${RED}❌ Acción desconocida: ${ACTION}${NC}"
    echo ""
    echo "Uso: bash kanban-sync.sh [agent] [action]"
    echo ""
    echo "Acciones:"
    echo "  list_pending      — Ver tareas pendientes del agente"
    echo "  list_in_progress  — Ver tareas en progreso"
    echo "  list_completed    — Ver tareas completadas (últimas 10)"
    echo "  close-completed   — Cerrar tareas completadas (ALFRED ONLY)"
    echo "  monitor-kanban    — Dashboard kanban en tiempo real (ALFRED ONLY)"
    echo "  export            — Exportar tareas a JSON local"
    echo ""
    exit 1
    ;;
esac
