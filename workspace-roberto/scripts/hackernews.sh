#!/bin/bash
# hackernews.sh — HackerNews Algolia API scanner para Roberto
# Uso: hackernews.sh search "<query>" [limit]
#      hackernews.sh top [limit]
#      hackernews.sh scan                 — busca todas las keywords configuradas

set -o pipefail

DATA_DIR="$(dirname "$0")/../data/hackernews"
TODAY=$(date +%Y-%m-%d)

mkdir -p "$DATA_DIR/$TODAY" 2>/dev/null

case "$1" in
    search)
        QUERY="$2"
        LIMIT="${3:-20}"
        if [ -z "$QUERY" ]; then
            echo '{"error": "Usage: hackernews.sh search \"<query>\" [limit]"}'
            exit 1
        fi

        ENCODED_QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$QUERY'))")
        URL="https://hn.algolia.com/api/v1/search_by_date?query=${ENCODED_QUERY}&tags=story&hitsPerPage=${LIMIT}"
        RESULT=$(curl -sL "$URL" 2>&1)

        if echo "$RESULT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
            echo "$RESULT" | python3 -c "
import sys, json

data = json.load(sys.stdin)
hits = data.get('hits', [])

results = []
for h in hits:
    results.append({
        'title': h.get('title', ''),
        'author': h.get('author', ''),
        'points': h.get('points', 0),
        'num_comments': h.get('num_comments', 0),
        'url': h.get('url', ''),
        'hn_url': 'https://news.ycombinator.com/item?id=' + str(h.get('objectID', '')),
        'created_at': h.get('created_at', '')
    })

print(json.dumps(results, indent=2, ensure_ascii=False))
"
            SAFE_QUERY=$(echo "$QUERY" | tr ' /' '_' | tr -cd '[:alnum:]_-')
            echo "$RESULT" > "$DATA_DIR/$TODAY/search_${SAFE_QUERY}.json"
        else
            echo "{\"error\": \"HackerNews API search failed\"}"
        fi
        ;;

    top)
        LIMIT="${2:-30}"
        URL="https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${LIMIT}"
        RESULT=$(curl -sL "$URL" 2>&1)

        if echo "$RESULT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
            echo "$RESULT" | python3 -c "
import sys, json

data = json.load(sys.stdin)
hits = data.get('hits', [])

results = []
for h in hits:
    results.append({
        'title': h.get('title', ''),
        'author': h.get('author', ''),
        'points': h.get('points', 0),
        'num_comments': h.get('num_comments', 0),
        'url': h.get('url', ''),
        'hn_url': 'https://news.ycombinator.com/item?id=' + str(h.get('objectID', '')),
        'created_at': h.get('created_at', '')
    })

print(json.dumps(results, indent=2, ensure_ascii=False))
"
            echo "$RESULT" > "$DATA_DIR/$TODAY/top.json"
        else
            echo "{\"error\": \"HackerNews API top failed\"}"
        fi
        ;;

    scan)
        # Scan keywords from tiers config
        CONFIG="$(dirname "$0")/../config/keywords_tiers.json"
        if [ -f "$CONFIG" ]; then
            KEYWORDS=$(python3 -c "
import json
c = json.load(open('$CONFIG'))
# Only tier 1 and 2 for HN (most relevant)
kws = c.get('tier1_critical', []) + c.get('tier2_high', [])
for kw in kws:
    print(kw)
")
        else
            KEYWORDS="AI agents\nagentic AI\nClaude\nAnthropric\nMCP protocol"
        fi

        echo "["
        FIRST=1
        echo "$KEYWORDS" | while read -r KW; do
            [ -z "$KW" ] && continue
            if [ $FIRST -eq 0 ]; then echo ","; fi
            FIRST=0
            echo "{\"keyword\": $(python3 -c "import json; print(json.dumps('$KW'))"), \"results\":"
            "$0" search "$KW" 10 2>/dev/null || echo "[]"
            echo "}"
        done
        echo "]"
        ;;

    *)
        echo "HackerNews scanner para Roberto (Algolia API)"
        echo ""
        echo "Uso:"
        echo "  hackernews.sh search \"<query>\" [limit]  — Buscar stories"
        echo "  hackernews.sh top [limit]                — Front page actual"
        echo "  hackernews.sh scan                       — Buscar todas las keywords tier 1-2"
        echo ""
        echo "Ejemplos:"
        echo "  hackernews.sh search \"AI agents\" 20"
        echo "  hackernews.sh top 30"
        echo "  hackernews.sh scan"
        exit 1
        ;;
esac
