#!/bin/bash
# Script: Monitoreo automático de comentarios NUEVOS de Santi
# Frecuencia: Cada 15 minutos
# Solo procesa comentarios que NO hayan sido procesados antes

source /Users/alfredpifi/clawd/.env.local

LOG_FILE="/Users/alfredpifi/clawd/logs/comment-monitor.log"
STATE_FILE="/Users/alfredpifi/clawd/logs/comment-state.json"
mkdir -p "$(dirname "$LOG_FILE")"

# Inicializar archivo de estado si no existe
if [[ ! -f "$STATE_FILE" ]]; then
  echo "{}" > "$STATE_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking for new comments..." >> "$LOG_FILE"

# Query documentos estratégicos de Alfred
DOCS=$(curl -s "$SUPABASE_URL/rest/v1/agent_docs?author=eq.Alfred&doc_type=eq.strategy&select=id,title,comments,updated_at" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY")

# Cargar estado previo
PREV_STATE=$(cat "$STATE_FILE")

NEW_COMMENTS_FOUND=0
NEW_DOCS=()

# Iterar cada documento
echo "$DOCS" | jq -c '.[]' | while read -r doc; do
  DOC_ID=$(echo "$doc" | jq -r '.id')
  DOC_TITLE=$(echo "$doc" | jq -r '.title')
  COMMENTS=$(echo "$doc" | jq -c '.comments')
  UPDATED_AT=$(echo "$doc" | jq -r '.updated_at')
  
  # Contar comentarios actuales
  CURRENT_COUNT=$(echo "$COMMENTS" | jq 'length')
  
  if [[ "$CURRENT_COUNT" -eq 0 ]]; then
    continue
  fi
  
  # Obtener count previo del estado
  PREV_COUNT=$(echo "$PREV_STATE" | jq -r --arg id "$DOC_ID" '.[$id].comment_count // 0')
  PREV_UPDATED=$(echo "$PREV_STATE" | jq -r --arg id "$DOC_ID" '.[$id].last_updated // ""')
  
  # Detectar cambios
  HAS_NEW=false
  
  # Caso 1: Más comentarios que antes
  if [[ "$CURRENT_COUNT" -gt "$PREV_COUNT" ]]; then
    HAS_NEW=true
  fi
  
  # Caso 2: Mismo count pero updated_at cambió (comentario editado)
  if [[ "$CURRENT_COUNT" -eq "$PREV_COUNT" ]] && [[ "$UPDATED_AT" != "$PREV_UPDATED" ]] && [[ -n "$PREV_UPDATED" ]]; then
    HAS_NEW=true
  fi
  
  if [[ "$HAS_NEW" == "true" ]]; then
    NEW_COMMENTS_FOUND=$((NEW_COMMENTS_FOUND + 1))
    NEW_DOCS+=("$DOC_TITLE")
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🆕 NEW: $DOC_TITLE ($DOC_ID) - Comments: $PREV_COUNT → $CURRENT_COUNT" >> "$LOG_FILE"
    
    # Actualizar estado
    NEW_STATE=$(echo "$PREV_STATE" | jq --arg id "$DOC_ID" --argjson count "$CURRENT_COUNT" --arg updated "$UPDATED_AT" \
      '.[$id] = {comment_count: $count, last_updated: $updated, last_check: (now | tostring)}')
    echo "$NEW_STATE" > "$STATE_FILE"
    PREV_STATE="$NEW_STATE"
  fi
done

# Si no hay comentarios nuevos, salir silenciosamente
if [[ "$NEW_COMMENTS_FOUND" -eq 0 ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] No new comments." >> "$LOG_FILE"
  exit 0
fi

# Hay comentarios nuevos → notificar
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔔 $NEW_COMMENTS_FOUND documentos con comentarios NUEVOS!" >> "$LOG_FILE"

# Construir lista de títulos para Telegram
TITLES_TEXT=""
for title in "${NEW_DOCS[@]}"; do
  TITLES_TEXT="${TITLES_TEXT}• $title\n"
done

# Notificar por Telegram
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"$TELEGRAM_CHAT_ID\",
    \"text\": \"🔔 COMENTARIOS NUEVOS DETECTADOS\\n\\n$NEW_COMMENTS_FOUND documentos actualizados:\\n\\n${TITLES_TEXT}\\nRevisando y aplicando modificaciones ahora...\",
    \"parse_mode\": \"Markdown\"
  }" > /dev/null

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Notification sent. Alfred will process on next heartbeat or manual trigger." >> "$LOG_FILE"
