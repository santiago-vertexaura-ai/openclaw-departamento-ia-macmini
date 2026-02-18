#!/bin/bash
# create-task.sh — Helper para crear tareas en Supabase con validación
# Uso: create-task.sh <assigned_to> <title> <task_type> <priority> <brief_json>

set -euo pipefail

ASSIGNED_TO="${1:-}"
TITLE="${2:-}"
TASK_TYPE="${3:-research}"
PRIORITY="${4:-media}"
BRIEF="${5:-{}}"

if [[ -z "$ASSIGNED_TO" || -z "$TITLE" ]]; then
  echo "Uso: create-task.sh <assigned_to> <title> [task_type] [priority] [brief_json]"
  echo ""
  echo "Ejemplo:"
  echo "  create-task.sh roberto \"Investigar X\" research alta '{\"objetivo\":\"Y\"}'"
  echo ""
  echo "assigned_to válidos: roberto, andres, marina, alfred (minúsculas)"
  exit 1
fi

# Validar assigned_to es minúscula
if [[ "$ASSIGNED_TO" =~ [A-Z] ]]; then
  echo "ERROR: assigned_to debe ser minúscula (roberto, andres, marina, alfred)"
  echo "Recibido: $ASSIGNED_TO"
  exit 1
fi

# Cargar credenciales
ENV_FILE="$HOME/clawd/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: No se encuentra $ENV_FILE"
  exit 1
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
  echo "ERROR: Credenciales Supabase no encontradas"
  exit 1
fi

# Crear tarea
TASK_ID=$(curl -s -X POST "$SUPABASE_URL/rest/v1/agent_tasks" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"title\": \"$TITLE\",
    \"assigned_to\": \"$ASSIGNED_TO\",
    \"created_by\": \"Alfred\",
    \"task_type\": \"$TASK_TYPE\",
    \"priority\": \"$PRIORITY\",
    \"status\": \"pendiente\",
    \"brief\": $BRIEF
  }" | jq -r '.[0].id')

if [[ -n "$TASK_ID" && "$TASK_ID" != "null" ]]; then
  echo "✓ Tarea creada: $TASK_ID"
  echo "  Título: $TITLE"
  echo "  Asignada: $ASSIGNED_TO"
  echo "  Tipo: $TASK_TYPE"
  echo "  Prioridad: $PRIORITY"
else
  echo "✗ Error creando tarea"
  exit 1
fi
