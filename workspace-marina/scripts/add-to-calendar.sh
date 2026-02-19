#!/bin/bash

# ADD TO CALENDAR - Marina automáticamente agrega posts al Social Calendar
# Uso: bash add-to-calendar.sh <task_id> <post_title> <post_content> <platform> [scheduled_time]

set -euo pipefail

TASK_ID="${1:-}"
POST_TITLE="${2:-}"
POST_CONTENT="${3:-}"
PLATFORM="${4:-}"
SCHEDULED_TIME="${5:-}"

if [[ -z "$TASK_ID" || -z "$POST_TITLE" || -z "$POST_CONTENT" || -z "$PLATFORM" ]]; then
  echo "Uso: add-to-calendar.sh <task_id> <title> <content> <platform> [scheduled_time]"
  echo "Platforms: twitter, linkedin, instagram, tiktok, youtube, email"
  exit 1
fi

# Validar platform
case "$PLATFORM" in
  twitter|linkedin|instagram|tiktok|youtube|email) ;;
  *)
    echo "❌ Platform inválida: $PLATFORM"
    exit 1
    ;;
esac

# Cargar credenciales
ENV_FILE="$HOME/clawd/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: No se encuentra $ENV_FILE"
  exit 1
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_SERVICE=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE" ]]; then
  echo "ERROR: Credenciales Supabase no encontradas"
  exit 1
fi

# Si no hay hora programada, usar hora default (08:00 next day)
if [[ -z "$SCHEDULED_TIME" ]]; then
  TOMORROW=$(date -u -v+1d +%Y-%m-%dT08:00:00Z)
  SCHEDULED_TIME="$TOMORROW"
else
  # Asegurar formato ISO 8601
  if ! echo "$SCHEDULED_TIME" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}'; then
    echo "❌ Hora debe ser formato ISO 8601: YYYY-MM-DDTHH:MM:SSZ"
    exit 1
  fi
fi

echo "📅 Agregando post a Social Calendar..."
echo "  Título: $POST_TITLE"
echo "  Platform: $PLATFORM"
echo "  Programado: $SCHEDULED_TIME"

# Crear entrada en content_calendar
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/rest/v1/content_calendar" \
  -H "Authorization: Bearer $SUPABASE_SERVICE" \
  -H "apikey: $SUPABASE_SERVICE" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"title\": \"$POST_TITLE\",
    \"content\": $(echo "$POST_CONTENT" | jq -R .),
    \"platform\": \"$PLATFORM\",
    \"scheduled_at\": \"$SCHEDULED_TIME\",
    \"task_id\": \"$TASK_ID\",
    \"author\": \"marina\",
    \"status\": \"programado\",
    \"review_status\": \"pending_review\"
  }")

ENTRY_ID=$(echo "$RESPONSE" | jq -r '.[0].id // empty' 2>/dev/null)

if [[ ! -z "$ENTRY_ID" && "$ENTRY_ID" != "null" ]]; then
  echo "✅ Agregado a Social Calendar: $ENTRY_ID"
  echo ""
  echo "📊 Detalles:"
  echo "$RESPONSE" | jq '.[] | {id, title, platform, scheduled_at, review_status}'
  exit 0
else
  echo "❌ Error agregando a calendario:"
  echo "$RESPONSE" | jq '.'
  exit 1
fi
