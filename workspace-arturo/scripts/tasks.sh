#!/bin/bash
# tasks.sh — Supabase task CRUD for Arturo (Community & Performance Manager)
set -euo pipefail

AGENT="Arturo"
AGENT_ID="arturo"

# === LOAD ENV ===
ENV_FILE="/Users/alfredpifi/clawd/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env.local not found at $ENV_FILE"
  exit 1
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)
TELEGRAM_BOT_TOKEN=$(grep '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE" | cut -d= -f2-)
TELEGRAM_CHAT_ID=$(grep '^TELEGRAM_CHAT_ID=' "$ENV_FILE" | cut -d= -f2-)

API="$SUPABASE_URL/rest/v1"
AUTH_READ=(-H "Authorization: Bearer $SUPABASE_KEY" -H "apikey: $SUPABASE_KEY")
AUTH_WRITE=("${AUTH_READ[@]}" -H "Content-Type: application/json" -H "Prefer: return=representation")

VAULT="/Users/alfredpifi/clawd/scripts/vault.sh"
INGEST="/Users/alfredpifi/clawd/scripts/vault-ingest.sh"

notify_telegram() {
  local MSG="$1"
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=${MSG}" \
      -d "parse_mode=Markdown" > /dev/null 2>&1 &
  fi
}

log_activity() {
  local ACTION="$1" TASK_ID="$2" DETAILS="$3"
  curl -s -X POST "$API/agent_activity" "${AUTH_WRITE[@]}" \
    -d "{\"agent_id\":\"$AGENT_ID\",\"action\":\"$ACTION\",\"task_id\":\"$TASK_ID\",\"details\":$DETAILS}" > /dev/null 2>&1 &
}

CMD="${1:-help}"

case "$CMD" in
  resume)
    # Reset stale tasks (in_progreso > 30 min)
    THIRTY_MIN_AGO=$(date -u -v-30M '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date -u -d '30 minutes ago' '+%Y-%m-%dT%H:%M:%SZ')
    STALE=$(curl -s "$API/agent_tasks?assigned_to=eq.$AGENT_ID&status=eq.en_progreso&started_at=lt.$THIRTY_MIN_AGO&select=id,title" "${AUTH_READ[@]}")
    STALE_COUNT=$(echo "$STALE" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))' 2>/dev/null || echo "0")
    if [ "$STALE_COUNT" -gt "0" ]; then
      for ID in $(echo "$STALE" | jq -r '.[].id'); do
        curl -s -X PATCH "$API/agent_tasks?id=eq.$ID" "${AUTH_WRITE[@]}" \
          -d '{"status":"pendiente","started_at":null}' > /dev/null
        log_activity "task_reset_stale" "$ID" "{\"reason\":\"stale > 30min\"}"
      done
      echo "Reset $STALE_COUNT stale tasks"
    fi
    # Then fetch pending
    curl -s "$API/agent_tasks?assigned_to=eq.$AGENT_ID&status=eq.pendiente&order=priority.asc,created_at.asc&select=id,title,task_type,priority,brief,description,comments" "${AUTH_READ[@]}"
    ;;

  fetch)
    curl -s "$API/agent_tasks?assigned_to=eq.$AGENT_ID&status=eq.pendiente&order=priority.asc,created_at.asc&select=id,title,task_type,priority,brief,description,comments" "${AUTH_READ[@]}"
    ;;

  start)
    TASK_ID="${2:?ERROR: Falta task_id}"
    NOW=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    curl -s -X PATCH "$API/agent_tasks?id=eq.$TASK_ID" "${AUTH_WRITE[@]}" \
      -d "{\"status\":\"en_progreso\",\"started_at\":\"$NOW\"}"
    log_activity "task_started" "$TASK_ID" "{\"agent\":\"$AGENT\"}"
    ;;

  complete)
    TASK_ID="${2:?ERROR: Falta task_id}"
    RESULT_JSON="${3:-{}}"
    NOW=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

    # Get task metadata
    TASK_META=$(curl -s "$API/agent_tasks?id=eq.$TASK_ID&select=task_type,title" "${AUTH_READ[@]}")
    TASK_TYPE=$(echo "$TASK_META" | jq -r '.[0].task_type // "unknown"')
    TASK_TITLE=$(echo "$TASK_META" | jq -r '.[0].title // "Sin titulo"')

    # Auto-doc for report types
    if [[ "$TASK_TYPE" =~ ^(social_performance|weekly_review|anomaly_analysis|benchmark_report|content_recycle)$ ]]; then
      DOC_TITLE="Reporte: $TASK_TITLE"
      DOC_TYPE="report"
      DOC_TAGS="[\"arturo\",\"$TASK_TYPE\",\"auto\"]"

      if [ -f /tmp/arturo_doc.md ]; then
        DOC_CONTENT=$(python3 -c "import sys,json; print(json.dumps(open('/tmp/arturo_doc.md').read()))")
        WORD_COUNT=$(wc -w < /tmp/arturo_doc.md | tr -d ' ')
      else
        DOC_CONTENT=$(echo "$RESULT_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('resumen','Sin contenido')))" 2>/dev/null || echo '"Sin contenido"')
        WORD_COUNT=0
      fi

      DOC_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API/agent_docs" "${AUTH_WRITE[@]}" \
        -d "{\"title\":$(python3 -c "import json; print(json.dumps('$DOC_TITLE'))"),\"content\":$DOC_CONTENT,\"author\":\"$AGENT\",\"doc_type\":\"$DOC_TYPE\",\"tags\":$DOC_TAGS,\"task_id\":\"$TASK_ID\",\"word_count\":$WORD_COUNT}")
      DOC_HTTP=$(echo "$DOC_RESPONSE" | tail -1)

      if [ "$DOC_HTTP" = "201" ]; then
        DOC_ID=$(echo "$DOC_RESPONSE" | head -1 | jq -r '.[0].id // empty')
        log_activity "doc_created" "$TASK_ID" "{\"doc_id\":\"$DOC_ID\",\"doc_type\":\"$DOC_TYPE\",\"word_count\":$WORD_COUNT}"

        # Vault ingest (fire-and-forget)
        if [ -f "$INGEST" ]; then
          bash "$INGEST" "$TASK_ID" "$TASK_TYPE" "$TASK_TITLE" "$AGENT_ID" "/tmp/arturo_doc.md" &
        fi
      fi

      # Cleanup
      rm -f /tmp/arturo_doc.md
    fi

    # Mark task complete
    curl -s -X PATCH "$API/agent_tasks?id=eq.$TASK_ID" "${AUTH_WRITE[@]}" \
      -d "{\"status\":\"completada\",\"result\":$RESULT_JSON,\"completed_at\":\"$NOW\"}" > /dev/null

    log_activity "task_completed" "$TASK_ID" "{\"agent\":\"$AGENT\",\"task_type\":\"$TASK_TYPE\"}"

    # Telegram
    SUMMARY=$(echo "$RESULT_JSON" | jq -r '.resumen // .summary // "Reporte completado"' 2>/dev/null || echo "Reporte completado")
    notify_telegram "Arturo completo: *$TASK_TITLE*\n$SUMMARY"

    echo "Task $TASK_ID completed"
    ;;

  fail)
    TASK_ID="${2:?ERROR: Falta task_id}"
    ERROR_MSG="${3:-Error desconocido}"
    curl -s -X PATCH "$API/agent_tasks?id=eq.$TASK_ID" "${AUTH_WRITE[@]}" \
      -d "{\"status\":\"fallida\",\"error\":$(python3 -c "import json; print(json.dumps('$ERROR_MSG'))")}" > /dev/null
    log_activity "task_failed" "$TASK_ID" "{\"error\":$(python3 -c "import json; print(json.dumps('$ERROR_MSG'))")}"
    notify_telegram "Arturo FALLO en tarea: $ERROR_MSG"
    ;;

  doc)
    TASK_ID="${2:?ERROR: Falta task_id}"
    DOC_TITLE="${3:?ERROR: Falta titulo}"
    DOC_TYPE="${4:-report}"
    DOC_TAGS="${5:-[\"arturo\",\"manual\"]}"
    if [ -f /tmp/arturo_doc.md ]; then
      DOC_CONTENT=$(python3 -c "import sys,json; print(json.dumps(open('/tmp/arturo_doc.md').read()))")
      WORD_COUNT=$(wc -w < /tmp/arturo_doc.md | tr -d ' ')
    else
      echo "ERROR: /tmp/arturo_doc.md not found"
      exit 1
    fi
    curl -s -X POST "$API/agent_docs" "${AUTH_WRITE[@]}" \
      -d "{\"title\":$(python3 -c "import json; print(json.dumps('$DOC_TITLE'))"),\"content\":$DOC_CONTENT,\"author\":\"$AGENT\",\"doc_type\":\"$DOC_TYPE\",\"tags\":$DOC_TAGS,\"task_id\":\"$TASK_ID\",\"word_count\":$WORD_COUNT}"
    rm -f /tmp/arturo_doc.md
    ;;

  urgent)
    TITLE="${2:?ERROR: Falta titulo}"
    DESCRIPTION="${3:-}"
    curl -s -X POST "$API/agent_tasks" "${AUTH_WRITE[@]}" \
      -d "{\"title\":$(python3 -c "import json; print(json.dumps('$TITLE'))"),\"assigned_to\":\"alfred\",\"task_type\":\"urgente\",\"status\":\"pendiente\",\"priority\":\"urgente\",\"description\":$(python3 -c "import json; print(json.dumps('$DESCRIPTION'))"),\"created_by\":\"$AGENT_ID\"}"
    notify_telegram "URGENTE de Arturo: $TITLE"
    ;;

  feedback-loop)
    # Create viral_analysis task for Andres when exceptional post detected
    POST_URL="${2:?ERROR: Falta post_url}"
    REASON="${3:-Post excepcional detectado}"
    curl -s -X POST "$API/agent_tasks" "${AUTH_WRITE[@]}" \
      -d "{\"title\":\"Analisis viral: $REASON\",\"assigned_to\":\"andres\",\"task_type\":\"viral_analysis\",\"status\":\"pendiente\",\"priority\":\"alta\",\"description\":\"Post excepcional detectado por Arturo. URL: $POST_URL. Analizar formulas, hooks, psicologia de engagement y extraer patrones replicables.\",\"created_by\":\"$AGENT_ID\"}"
    log_activity "feedback_loop" "" "{\"reason\":\"$REASON\",\"target\":\"andres\"}"
    echo "Feedback loop triggered: viral_analysis task created for Andres"
    ;;

  help|*)
    echo "Usage: tasks.sh <command> [args]"
    echo "  resume                    - Reset stale tasks + fetch pending"
    echo "  fetch                     - List pending tasks"
    echo "  start <id>                - Mark task as in_progreso"
    echo "  complete <id> '<json>'    - Complete task with result"
    echo "  fail <id> '<msg>'         - Mark task as failed"
    echo "  doc <id> '<title>' [type] [tags] - Create doc from /tmp/arturo_doc.md"
    echo "  urgent '<title>' [desc]   - Create urgent task for Alfred"
    echo "  feedback-loop <url> [reason] - Trigger viral analysis for Andres"
    ;;
esac
