#!/bin/bash
# tasks.sh — Supabase CRUD helper para Andrés
# Uso: ./scripts/tasks.sh <comando> [args...]

set -euo pipefail

# Cargar credenciales
ENV_FILE="$HOME/clawd/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: No se encuentra $ENV_FILE" >&2
  exit 1
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_KEY=$(grep '^SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_SERVICE=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
  echo "ERROR: SUPABASE_URL o SUPABASE_ANON_KEY no encontrados en $ENV_FILE" >&2
  exit 1
fi

# Service role key bypassa RLS (necesario para INSERT en agent_docs)
WRITE_KEY="${SUPABASE_SERVICE:-$SUPABASE_KEY}"

API="$SUPABASE_URL/rest/v1"
AUTH_HEADERS=(
  -H "Authorization: Bearer $SUPABASE_KEY"
  -H "apikey: $SUPABASE_KEY"
  -H "Content-Type: application/json"
)
AUTH_WRITE=(
  -H "Authorization: Bearer $WRITE_KEY"
  -H "apikey: $WRITE_KEY"
  -H "Content-Type: application/json"
)

# Orden de prioridad para ordenar resultados
priority_order() {
  jq 'sort_by(
    (if .priority == "urgente" then 0
     elif .priority == "alta" then 1
     elif .priority == "media" then 2
     else 3 end),
    .created_at
  )'
}

# Escribir log en agent_activity
log_activity() {
  local action="$1"
  local task_id="$2"
  local details="${3:-null}"

  curl -s -X POST "$API/agent_activity" \
    "${AUTH_HEADERS[@]}" \
    -d "{
      \"agent_id\": \"andres\",
      \"action\": \"$action\",
      \"task_id\": \"$task_id\",
      \"details\": $details
    }" > /dev/null
}

CMD="${1:-help}"

case "$CMD" in

  resume)
    # Resetear tareas en_progreso >30 min (stale) a pendiente, luego devolver pendientes
    RESULT=$(curl -s "$API/agent_tasks?assigned_to=eq.andres&status=eq.en_progreso&select=*" \
      "${AUTH_HEADERS[@]}" \
      -H "Prefer: return=representation")
    COUNT=$(echo "$RESULT" | jq 'length')
    if [[ "$COUNT" -gt 0 ]]; then
      NOW_SEC=$(date +%s)
      IDS=$(echo "$RESULT" | jq -r '.[].id')
      for TASK_ID in $IDS; do
        STARTED=$(echo "$RESULT" | jq -r --arg id "$TASK_ID" '.[] | select(.id==$id) | .started_at // empty')
        if [[ -n "$STARTED" ]]; then
          STARTED_CLEAN=$(echo "$STARTED" | cut -d+ -f1 | cut -d. -f1)
          STARTED_SEC=$(date -j -f "%Y-%m-%dT%H:%M:%S" "$STARTED_CLEAN" "+%s" 2>/dev/null || echo "0")
          ELAPSED=$(( NOW_SEC - STARTED_SEC ))
          if [[ "$ELAPSED" -gt 1800 ]]; then
            curl -s -X PATCH "$API/agent_tasks?id=eq.$TASK_ID" \
              "${AUTH_HEADERS[@]}" \
              -H "Content-Type: application/json" \
              -d '{"status":"pendiente","started_at":null}' > /dev/null
            log_activity "task_reset_stale" "$TASK_ID" "{\"elapsed_seconds\": $ELAPSED}"
            echo "RESET: Tarea $TASK_ID reseteada (stale ${ELAPSED}s)" >&2
          fi
        fi
      done
    fi
    FRESH=$(curl -s "$API/agent_tasks?assigned_to=eq.andres&status=eq.pendiente&select=*" \
      "${AUTH_HEADERS[@]}" \
      -H "Prefer: return=representation")
    echo "$FRESH" | priority_order
    ;;

  fetch)
    # Obtener tareas pendientes asignadas a andres, ordenadas por prioridad
    RESULT=$(curl -s "$API/agent_tasks?assigned_to=eq.andres&status=eq.pendiente&select=*" \
      "${AUTH_HEADERS[@]}" \
      -H "Prefer: return=representation")

    echo "$RESULT" | priority_order
    ;;

  start)
    TASK_ID="${2:?ERROR: Falta task_id. Uso: ./scripts/tasks.sh start <task_id>}"
    NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    curl -s -X PATCH "$API/agent_tasks?id=eq.$TASK_ID" \
      "${AUTH_HEADERS[@]}" \
      -H "Prefer: return=representation" \
      -d "{
        \"status\": \"en_progreso\",
        \"started_at\": \"$NOW\"
      }"

    log_activity "task_started" "$TASK_ID" "{\"started_at\": \"$NOW\"}"
    echo "OK: Tarea $TASK_ID marcada como en_progreso"
    ;;

  complete)
    TASK_ID="${2:?ERROR: Falta task_id. Uso: ./scripts/tasks.sh complete <task_id> '<result_json>'}"
    RESULT_JSON="${3:?ERROR: Falta result_json. Uso: ./scripts/tasks.sh complete <task_id> '<result_json>'}"
    NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # === AUTO-DOC (errores aqui NO deben impedir el complete) ===
    set +e
    TASK_DATA=$(curl -s "$API/agent_tasks?id=eq.$TASK_ID&select=task_type,title,brief" \
      "${AUTH_HEADERS[@]}")
    TASK_TYPE=$(echo "$TASK_DATA" | jq -r '.[0].task_type // empty')
    TASK_TITLE=$(echo "$TASK_DATA" | jq -r '.[0].title // empty')

    if [[ "$TASK_TYPE" =~ ^(analysis|content_analysis|viral_analysis|trend_analysis|weekly_brief|formula_update|feedback)$ ]]; then
      EXISTING=$(curl -s "$API/agent_docs?task_id=eq.$TASK_ID&select=id" \
        "${AUTH_WRITE[@]}")
      DOC_COUNT=$(echo "$EXISTING" | jq 'length' 2>/dev/null || echo "0")

      if [[ "$DOC_COUNT" == "0" ]]; then
        if [[ -f /tmp/andres_doc.md ]]; then
          DOC_CONTENT=$(cat /tmp/andres_doc.md)
        else
          SUMMARY=$(echo "$RESULT_JSON" | jq -r '.resumen_ejecutivo_para_alfred.top_3_insights[0] // .summary // "Sin resumen"')
          DOC_CONTENT="# $TASK_TITLE

## Resumen
$SUMMARY

---
*Generado automaticamente por tasks.sh complete*
*Fecha: $NOW*"
        fi

        DOC_TYPE="analysis"
        WORD_COUNT=$(echo "$DOC_CONTENT" | wc -w | tr -d ' ')
        DOC_CONTENT_ESCAPED=$(printf '%s' "$DOC_CONTENT" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')
        DOC_TITLE_ESCAPED=$(printf '%s' "$TASK_TITLE" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')

        DOC_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API/agent_docs" \
          "${AUTH_WRITE[@]}" \
          -H "Prefer: return=representation" \
          -d "{
            \"title\": $DOC_TITLE_ESCAPED,
            \"content\": $DOC_CONTENT_ESCAPED,
            \"author\": \"Andrés\",
            \"doc_type\": \"$DOC_TYPE\",
            \"tags\": [\"$TASK_TYPE\", \"auto\"],
            \"task_id\": \"$TASK_ID\",
            \"word_count\": $WORD_COUNT
          }")

        DOC_HTTP=$(echo "$DOC_RESPONSE" | tail -1)
        if [[ "$DOC_HTTP" == "201" ]]; then
          log_activity "doc_created" "$TASK_ID" "{\"doc_type\": \"$DOC_TYPE\", \"word_count\": $WORD_COUNT, \"auto\": true}"
          echo "AUTO-DOC: Documento creado ($WORD_COUNT palabras)"
        else
          echo "WARN: Auto-doc fallo (HTTP $DOC_HTTP)" >&2
        fi
      fi
    fi
    # Limpiar siempre, incluso si auto-doc fallo o no aplica
    rm -f /tmp/andres_doc.md
    set -e
    # === FIN AUTO-DOC ===

    # === VAULT INGEST (fire-and-forget) ===
    /Users/alfredpifi/clawd/scripts/vault-ingest.sh "$TASK_ID" "$TASK_TYPE" "$TASK_TITLE" "Andrés" > /dev/null 2>&1 &

    curl -s -X PATCH "$API/agent_tasks?id=eq.$TASK_ID" \
      "${AUTH_HEADERS[@]}" \
      -H "Prefer: return=representation" \
      -d "{
        \"status\": \"completada\",
        \"result\": $RESULT_JSON,
        \"completed_at\": \"$NOW\"
      }"

    log_activity "task_completed" "$TASK_ID" "$RESULT_JSON"

    # Notificar a Santi por Telegram
    TELEGRAM_BOT_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE" | cut -d= -f2-)
    TELEGRAM_CHAT_ID=$(grep '^TELEGRAM_CHAT_ID=' "$ENV_FILE" | cut -d= -f2-)
    if [[ -n "$TELEGRAM_BOT_TOKEN" && -n "$TELEGRAM_CHAT_ID" ]]; then
      # Extraer insights de Andrés (estructura specific de su output)
      TOP_INSIGHT=$(echo "$RESULT_JSON" | jq -r '.resumen_ejecutivo_para_alfred.top_3_insights[0] // .summary // "Análisis completado"' | head -c 200)
      MESSAGE="✅ *Andrés completó análisis*

📊 *${TASK_TITLE}*

${TOP_INSIGHT}"
      
      curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=${MESSAGE}" \
        -d "parse_mode=Markdown" > /dev/null 2>&1 &
    fi

    # Trigger Alfred's LLM review (fire-and-forget, no bloquea)
    curl -s -X POST "http://localhost:3000/api/review" \
      -H "Content-Type: application/json" \
      -d "{\"task_id\": \"$TASK_ID\"}" > /dev/null 2>&1 &

    echo "OK: Tarea $TASK_ID completada"
    ;;

  fail)
    TASK_ID="${2:?ERROR: Falta task_id. Uso: ./scripts/tasks.sh fail <task_id> '<error_msg>'}"
    ERROR_MSG="${3:?ERROR: Falta error_msg. Uso: ./scripts/tasks.sh fail <task_id> '<error_msg>'}"
    NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Escapar error message para JSON seguro
    ERROR_MSG_ESCAPED=$(printf '%s' "$ERROR_MSG" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')

    curl -s -X PATCH "$API/agent_tasks?id=eq.$TASK_ID" \
      "${AUTH_HEADERS[@]}" \
      -H "Prefer: return=representation" \
      -d "{
        \"status\": \"fallida\",
        \"error\": $ERROR_MSG_ESCAPED,
        \"completed_at\": \"$NOW\"
      }"

    log_activity "task_failed" "$TASK_ID" "{\"error\": $ERROR_MSG_ESCAPED}"
    echo "OK: Tarea $TASK_ID marcada como fallida"
    ;;

  doc)
    # Uso: echo 'contenido md' | ./scripts/tasks.sh doc <task_id> '<titulo>' '<doc_type>' '["tags"]'
    TASK_ID="${2:?ERROR: Falta task_id. Uso: echo 'md' | ./scripts/tasks.sh doc <task_id> '<titulo>' '<doc_type>' '[\"tags\"]'}"
    DOC_TITLE="${3:?ERROR: Falta titulo}"
    DOC_TYPE="${4:-analysis}"
    DOC_TAGS="${5:-[]}"

    # Leer contenido desde stdin
    DOC_CONTENT=$(cat)
    if [[ -z "$DOC_CONTENT" ]]; then
      echo "ERROR: Contenido vacio. Pasa el markdown via stdin: echo 'md' | ./scripts/tasks.sh doc ..." >&2
      exit 1
    fi

    WORD_COUNT=$(echo "$DOC_CONTENT" | wc -w | tr -d ' ')

    DOC_CONTENT_ESCAPED=$(printf '%s' "$DOC_CONTENT" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')
    DOC_TITLE_ESCAPED=$(printf '%s' "$DOC_TITLE" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API/agent_docs" \
      "${AUTH_WRITE[@]}" \
      -H "Prefer: return=representation" \
      -d "{
        \"title\": $DOC_TITLE_ESCAPED,
        \"content\": $DOC_CONTENT_ESCAPED,
        \"author\": \"Andrés\",
        \"doc_type\": \"$DOC_TYPE\",
        \"tags\": $DOC_TAGS,
        \"task_id\": \"$TASK_ID\",
        \"word_count\": $WORD_COUNT
      }")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [[ "$HTTP_CODE" != "201" ]]; then
      echo "ERROR: Fallo al crear documento (HTTP $HTTP_CODE)" >&2
      echo "$BODY" >&2
      exit 1
    fi

    log_activity "doc_created" "$TASK_ID" "{\"doc_type\": \"$DOC_TYPE\", \"word_count\": $WORD_COUNT}"
    echo "OK: Documento '$DOC_TITLE' creado (${WORD_COUNT} palabras)"
    ;;

  urgent)
    TITLE="${2:?Falta titulo}"
    DESCRIPTION="${3:-}"
    # Create urgent task for Alfred
    PAYLOAD=$(python3 -c "import json; print(json.dumps({'title':'URGENTE: ' + json.loads(json.dumps('$TITLE')),'assigned_to':'alfred','task_type':'urgente','status':'pendiente','priority':'urgente','description':json.loads(json.dumps('$DESCRIPTION')),'created_by':'andres'}))")
    curl -s -X POST "$API/agent_tasks" "${AUTH_WRITE[@]}" -d "$PAYLOAD" > /dev/null
    # Telegram immediate alert
    TELEGRAM_BOT_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE" | cut -d= -f2-)
    TELEGRAM_CHAT_ID=$(grep '^TELEGRAM_CHAT_ID=' "$ENV_FILE" | cut -d= -f2-)
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
      curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" -d "text=URGENTE (Andres): $TITLE" -d "parse_mode=Markdown" > /dev/null &
    fi
    echo '{"status":"urgent_created","title":"'"$TITLE"'"}'
    ;;

  *)
    echo "Uso: ./scripts/tasks.sh <comando> [args...]"
    echo ""
    echo "Comandos:"
    echo "  resume                             Resetear stale (>30min en_progreso) + devolver pendientes"
    echo "  fetch                              Obtener tareas pendientes (status=pendiente, assigned_to=andres)"
    echo "  start <task_id>                    Marcar tarea como en_progreso"
    echo "  complete <task_id> '<result_json>'  Marcar tarea como completada + guardar resultado"
    echo "  fail <task_id> '<error_msg>'       Marcar tarea como fallida + guardar error"
    echo "  doc <task_id> '<title>' '<type>' '<tags>'  Crear documento (contenido via stdin)"
    echo "  urgent '<title>' '[description]'   Crear tarea URGENTE para Alfred + alerta Telegram"
    ;;

esac
