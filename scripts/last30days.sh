#!/bin/bash
# last30days.sh — Investigación de los últimos 30 días
# Combina: Google News + Twitter + Reddit para un tema dado
# Uso: last30days.sh "<tema>" [idioma]
# Ejemplo: last30days.sh "AI agents" es

set -o pipefail

TEMA="${1:?Uso: last30days.sh '<tema>' [idioma]}"
LANG="${2:-es}"
COUNTRY=$(echo "$LANG" | tr '[:lower:]' '[:upper:]')
TODAY=$(date +%Y-%m-%d)
SCRIPTS_DIR="$(dirname "$0")"
ROBERTO_SCRIPTS="/Users/alfredpifi/clawd/workspace-roberto/scripts"
DATA_DIR="/Users/alfredpifi/clawd/data/last30days/$TODAY"

mkdir -p "$DATA_DIR" 2>/dev/null

echo "{"
echo "  \"tema\": \"$TEMA\","
echo "  \"fecha\": \"$TODAY\","
echo "  \"idioma\": \"$LANG\","

# 1. Google News
echo "  \"news\": "
NEWS=$("$ROBERTO_SCRIPTS/news.sh" search "$TEMA" 5 "$LANG" "$COUNTRY" 2>/dev/null)
if [ -n "$NEWS" ] && [ "$NEWS" != "[]" ]; then
    echo "$NEWS,"
else
    echo "  [],"
fi

# 2. Twitter
echo "  \"twitter\": "
TWITTER=$("$ROBERTO_SCRIPTS/twitter.sh" search "$TEMA" 10 2>/dev/null)
if [ -n "$TWITTER" ] && [ "$TWITTER" != "[]" ]; then
    echo "$TWITTER,"
else
    echo "  [],"
fi

# 3. Reddit (if script exists)
echo "  \"reddit\": "
if [ -x "$ROBERTO_SCRIPTS/reddit.sh" ]; then
    REDDIT=$("$ROBERTO_SCRIPTS/reddit.sh" search "$TEMA" 2>/dev/null)
    if [ -n "$REDDIT" ] && [ "$REDDIT" != "[]" ]; then
        echo "$REDDIT"
    else
        echo "  []"
    fi
else
    echo "  []"
fi

echo "}"

# Save a copy
SAFE_TEMA=$(echo "$TEMA" | tr ' /' '_' | tr -cd '[:alnum:]_-')
cat > "$DATA_DIR/${SAFE_TEMA}.json" << INNEREOF
{"tema": "$TEMA", "fecha": "$TODAY", "saved": true}
INNEREOF
