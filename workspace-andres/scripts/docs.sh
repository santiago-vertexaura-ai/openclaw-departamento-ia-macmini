#!/bin/bash
# docs.sh — Leer documentos de Roberto desde Supabase
# Uso: ./scripts/docs.sh <comando> [args...]

set -euo pipefail

# Cargar credenciales
ENV_FILE="$HOME/clawd/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: No se encuentra $ENV_FILE" >&2
  exit 1
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_SERVICE=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE" ]]; then
  echo "ERROR: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontrados en $ENV_FILE" >&2
  exit 1
fi

API="$SUPABASE_URL/rest/v1"
AUTH_HEADERS=(
  -H "Authorization: Bearer $SUPABASE_SERVICE"
  -H "apikey: $SUPABASE_SERVICE"
  -H "Content-Type: application/json"
)

# Truncar contenido largo para caber en contexto del modelo
MAX_CONTENT_CHARS=8000
truncate_content() {
  jq --arg max "$MAX_CONTENT_CHARS" '
    if type == "array" then
      map(
        if (.content | length) > ($max | tonumber) then
          .content = (.content[:($max | tonumber)] + "\n\n[... TRUNCADO a " + $max + " chars ...]")
        else . end
      )
    else . end
  '
}

CMD="${1:-help}"

case "$CMD" in

  fetch-recent)
    # Últimos docs (default: 7 días, 10 docs)
    DAYS="${2:-7}"
    LIMIT="${3:-10}"
    SINCE=$(date -v-${DAYS}d -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -d "-${DAYS} days" -u +"%Y-%m-%dT%H:%M:%SZ")

    curl -s "$API/agent_docs?created_at=gte.$SINCE&order=created_at.desc&limit=$LIMIT&select=id,title,content,tags,author,doc_type,task_id,word_count,created_at" \
      "${AUTH_HEADERS[@]}" | truncate_content
    ;;

  fetch-by-task)
    # Doc vinculado a una tarea específica
    TASK_ID="${2:?ERROR: Falta task_id. Uso: ./scripts/docs.sh fetch-by-task <task_id>}"

    curl -s "$API/agent_docs?task_id=eq.$TASK_ID&select=id,title,content,tags,author,doc_type,word_count,created_at" \
      "${AUTH_HEADERS[@]}" | truncate_content
    ;;

  fetch-by-topic)
    # Búsqueda por título (ilike)
    KEYWORD="${2:?ERROR: Falta keyword. Uso: ./scripts/docs.sh fetch-by-topic <keyword>}"
    LIMIT="${3:-5}"

    curl -s "$API/agent_docs?title=ilike.*${KEYWORD}*&order=created_at.desc&limit=$LIMIT&select=id,title,content,tags,author,doc_type,word_count,created_at" \
      "${AUTH_HEADERS[@]}" | truncate_content
    ;;

  fetch-by-agent)
    # Docs de un agente específico
    AGENT="${2:?ERROR: Falta agent. Uso: ./scripts/docs.sh fetch-by-agent <agent> [limit]}"
    LIMIT="${3:-10}"

    curl -s "$API/agent_docs?author=ilike.$AGENT&order=created_at.desc&limit=$LIMIT&select=id,title,content,tags,author,doc_type,word_count,created_at" \
      "${AUTH_HEADERS[@]}" | truncate_content
    ;;

  list)
    # Solo IDs y títulos recientes (ligero)
    LIMIT="${2:-20}"

    curl -s "$API/agent_docs?order=created_at.desc&limit=$LIMIT&select=id,title,author,doc_type,word_count,created_at" \
      "${AUTH_HEADERS[@]}"
    ;;

  *)
    echo "Uso: ./scripts/docs.sh <comando> [args...]"
    echo ""
    echo "Comandos:"
    echo "  fetch-recent [days] [limit]       Últimos docs (default: 7 días, 10 docs)"
    echo "  fetch-by-task <task_id>           Doc vinculado a una tarea específica"
    echo "  fetch-by-topic <keyword> [limit]  Búsqueda por título"
    echo "  fetch-by-agent <agent> [limit]    Docs de un agente específico"
    echo "  list [limit]                      Solo IDs y títulos recientes"
    ;;

esac
