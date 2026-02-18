#!/bin/bash
# vault-ingest.sh — Ingesta automática al vault después de completar una tarea
# Llamado fire-and-forget desde tasks.sh complete
#
# Uso: vault-ingest.sh <task_id> <task_type> <task_title> <agent_name> [doc_content_file]
#
# Extrae entidades del título y contenido, crea notas en el vault,
# y enlaza con notas existentes.

set -euo pipefail

VAULT="${HOME}/clawd/scripts/vault.sh"
TASK_ID="${1:-}"
TASK_TYPE="${2:-}"
TASK_TITLE="${3:-}"
AGENT="${4:-}"
DOC_FILE="${5:-}"

if [ -z "$TASK_ID" ] || [ -z "$TASK_TYPE" ] || [ -z "$TASK_TITLE" ]; then
  exit 0  # Silently exit if missing args (fire-and-forget)
fi

# ── Determine vault category from task_type ──

case "$TASK_TYPE" in
  youtube_analysis|youtube)  CATEGORY="topics" ;;
  news_scan|news)            CATEGORY="trends" ;;
  twitter_scan|twitter)      CATEGORY="trends" ;;
  reddit_scan|reddit)        CATEGORY="topics" ;;
  hackernews_scan)           CATEGORY="trends" ;;
  research)                  CATEGORY="topics" ;;
  report)                    CATEGORY="topics" ;;
  analysis|content_analysis) CATEGORY="formulas" ;;
  viral_analysis)            CATEGORY="formulas" ;;
  trend_analysis)            CATEGORY="trends" ;;
  formula_update)            CATEGORY="formulas" ;;
  feedback)                  CATEGORY="lessons" ;;
  *)                         CATEGORY="topics" ;;
esac

# ── Extract keywords from title for entity detection ──

# Known entities to auto-link (people/channels from the system)
KNOWN_PEOPLE="alex-finn cole-medin nate-herk chase-ai jon-hernandez roberto andrés marina"
KNOWN_TOPICS="ai-agents openclaw claude-code youtube-strategy content-creation"

# Slugify the task title for the vault note
SLUG=$(echo "$TASK_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9áéíóúñü]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | head -c 60)

# Read doc content if available
CONTENT=""
if [ -n "$DOC_FILE" ] && [ -f "$DOC_FILE" ]; then
  CONTENT=$(head -c 2000 "$DOC_FILE")
else
  AGENT_LOWER=$(echo "$AGENT" | tr '[:upper:]' '[:lower:]')
  if [ -f "/tmp/${AGENT_LOWER}_doc.md" ]; then
    CONTENT=$(head -c 2000 "/tmp/${AGENT_LOWER}_doc.md")
  fi
fi

# ── Build wiki-links from known entities found in title/content ──

SEARCH_TEXT=$(echo "$TASK_TITLE $CONTENT" | tr '[:upper:]' '[:lower:]')
WIKI_LINKS=""

for person in $KNOWN_PEOPLE; do
  # Convert slug to searchable text (replace hyphens with spaces)
  SEARCH_NAME=$(echo "$person" | tr '-' ' ')
  if echo "$SEARCH_TEXT" | grep -qi "$SEARCH_NAME"; then
    WIKI_LINKS="$WIKI_LINKS [[$person]]"
  fi
done

for topic in $KNOWN_TOPICS; do
  SEARCH_NAME=$(echo "$topic" | tr '-' ' ')
  if echo "$SEARCH_TEXT" | grep -qi "$SEARCH_NAME"; then
    WIKI_LINKS="$WIKI_LINKS [[$topic]]"
  fi
done

# Always link to the agent
WIKI_LINKS="$WIKI_LINKS [[$(echo "$AGENT" | tr '[:upper:]' '[:lower:]')]]"

# ── Build note content ──

NOTE_CONTENT="Resultado de tarea \`$TASK_ID\` ($TASK_TYPE).

Agente: $AGENT
Tipo: $TASK_TYPE

Relacionado con:$WIKI_LINKS"

if [ -n "$CONTENT" ]; then
  # Extract a brief summary (first 300 chars of content body, skip frontmatter)
  BODY=$(echo "$CONTENT" | sed -n '/^---$/,/^---$/!p' | head -c 300)
  if [ -n "$BODY" ]; then
    NOTE_CONTENT="$NOTE_CONTENT

## Extracto
$BODY..."
  fi
fi

# ── Create vault note ──

TAGS="$TASK_TYPE,auto,task-result"
"$VAULT" add "$CATEGORY" "$TASK_TITLE" "$NOTE_CONTENT" \
  --tags "$TAGS" \
  --type "task-result" \
  --priority medium \
  --author "$AGENT" > /dev/null 2>&1 || true

# ── Link to detected entities ──

for person in $KNOWN_PEOPLE; do
  SEARCH_NAME=$(echo "$person" | tr '-' ' ')
  if echo "$SEARCH_TEXT" | grep -qi "$SEARCH_NAME"; then
    "$VAULT" link "$SLUG" "$person" > /dev/null 2>&1 || true
  fi
done

for topic in $KNOWN_TOPICS; do
  SEARCH_NAME=$(echo "$topic" | tr '-' ' ')
  if echo "$SEARCH_TEXT" | grep -qi "$SEARCH_NAME"; then
    "$VAULT" link "$SLUG" "$topic" > /dev/null 2>&1 || true
  fi
done

# ── Check doc rating and update vault confidence ──

ENV_FILE="$HOME/clawd/.env.local"
if [ -f "$ENV_FILE" ] && [ -n "$TASK_ID" ]; then
  SUPA_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- || true)
  # Try alternate key name
  [ -z "$SUPA_URL" ] && SUPA_URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- || true)
  SUPA_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2- || true)

  if [ -n "$SUPA_URL" ] && [ -n "$SUPA_KEY" ]; then
    RATING=$(curl -s "${SUPA_URL}/rest/v1/agent_docs?task_id=eq.${TASK_ID}&select=rating" \
      -H "Authorization: Bearer $SUPA_KEY" \
      -H "apikey: $SUPA_KEY" 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data and data[0].get('rating'):
        print(data[0]['rating'])
except: pass
" 2>/dev/null || true)

    if [ -n "$RATING" ]; then
      # Map rating to confidence: 1→0.3, 2→0.5, 3→0.7, 4→0.85, 5→1.0
      CONF=$(python3 -c "
r = float('$RATING')
m = {1:0.3, 1.5:0.4, 2:0.5, 2.5:0.6, 3:0.7, 3.5:0.8, 4:0.85, 4.5:0.9, 5:1.0}
print(m.get(r, m.get(round(r), 0.7)))
" 2>/dev/null || true)
      if [ -n "$CONF" ]; then
        "$VAULT" update-confidence "$SLUG" "$CONF" > /dev/null 2>&1 || true
      fi
    fi
  fi
fi

# ── Regenerate index ──

"$VAULT" index > /dev/null 2>&1 || true

exit 0
