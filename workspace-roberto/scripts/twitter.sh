#!/bin/bash
# twitter.sh — Bird CLI wrapper para Roberto
# Uso: twitter.sh search "<query>" [max]
#      twitter.sh read <tweet_url>
#      twitter.sh leads "<query>" [max]

set -o pipefail

BIRD="/opt/homebrew/bin/bird"
DATA_DIR="$(dirname "$0")/../data/twitter"
TODAY=$(date +%Y-%m-%d)

# Load Twitter tokens from .env.local
ENV_FILE="$(dirname "$0")/../../.env.local"
if [ -f "$ENV_FILE" ]; then
    export AUTH_TOKEN=$(grep '^AUTH_TOKEN=' "$ENV_FILE" | cut -d'=' -f2)
    export CT0=$(grep '^CT0=' "$ENV_FILE" | cut -d'=' -f2)
fi

if [ -z "$AUTH_TOKEN" ] || [ -z "$CT0" ]; then
    echo '{"error": "Missing AUTH_TOKEN or CT0. Set them in ~/clawd/.env.local"}'
    exit 1
fi

# Ensure data directory exists
mkdir -p "$DATA_DIR/$TODAY" 2>/dev/null

case "$1" in
    search)
        QUERY="$2"
        MAX="${3:-20}"
        if [ -z "$QUERY" ]; then
            echo '{"error": "Usage: twitter.sh search \"<query>\" [max]. Ejemplo: twitter.sh search \"AI agents\" 20"}'
            exit 1
        fi

        RESULT=$("$BIRD" search "$QUERY" -n "$MAX" --plain 2>&1)
        EXIT_CODE=$?

        if [ $EXIT_CODE -ne 0 ] && [ -z "$RESULT" ]; then
            echo "{\"error\": \"Bird CLI failed with exit code $EXIT_CODE. Check Chrome profile auth.\"}"
            exit 1
        fi

        # Save raw output
        SAFE_QUERY=$(echo "$QUERY" | tr ' /' '_' | tr -cd '[:alnum:]_-')
        echo "$RESULT" > "$DATA_DIR/$TODAY/search_${SAFE_QUERY}.txt"

        # Parse to JSON
        python3 -c "
import sys, json, re

raw = sys.stdin.read().strip()
if not raw:
    print(json.dumps([]))
    sys.exit(0)

tweets = []
current = {}
for line in raw.split('\n'):
    line = line.strip()
    if not line:
        if current:
            tweets.append(current)
            current = {}
        continue

    if line.startswith('@'):
        if current:
            tweets.append(current)
        parts = line.split(' ', 1)
        current = {'author': parts[0], 'text': parts[1] if len(parts) > 1 else ''}
    elif line.startswith('http'):
        current['url'] = line
    elif re.match(r'\d+ likes?', line, re.I):
        nums = re.findall(r'(\d+)\s*(likes?|retweets?|replies?)', line, re.I)
        for val, key in nums:
            current[key.lower().rstrip('s')] = int(val)
    elif current.get('text'):
        current['text'] += ' ' + line
    else:
        current['text'] = line

if current:
    tweets.append(current)

print(json.dumps(tweets[:int('$MAX')], indent=2, ensure_ascii=False))
" <<< "$RESULT"
        ;;

    read)
        URL="$2"
        if [ -z "$URL" ]; then
            echo '{"error": "Usage: twitter.sh read <tweet_url>"}'
            exit 1
        fi

        RESULT=$("$BIRD" read "$URL" --plain 2>&1)
        EXIT_CODE=$?

        if [ $EXIT_CODE -ne 0 ] && [ -z "$RESULT" ]; then
            echo "{\"error\": \"Bird CLI read failed with exit code $EXIT_CODE\"}"
            exit 1
        fi

        # Save raw output
        TWEET_ID=$(echo "$URL" | grep -oE '[0-9]+$')
        echo "$RESULT" > "$DATA_DIR/$TODAY/read_${TWEET_ID}.txt"

        echo "$RESULT"
        ;;

    leads)
        QUERY="$2"
        MAX="${3:-10}"
        if [ -z "$QUERY" ]; then
            echo '{"error": "Usage: twitter.sh leads \"<query>\" [max]"}'
            exit 1
        fi

        RESULT=$("$BIRD" search "$QUERY" -n "$MAX" --plain 2>&1)
        EXIT_CODE=$?

        if [ $EXIT_CODE -ne 0 ] && [ -z "$RESULT" ]; then
            echo "{\"error\": \"Bird CLI leads search failed with exit code $EXIT_CODE\"}"
            exit 1
        fi

        # Save raw output
        SAFE_QUERY=$(echo "$QUERY" | tr ' /' '_' | tr -cd '[:alnum:]_-')
        echo "$RESULT" > "$DATA_DIR/$TODAY/leads_${SAFE_QUERY}.txt"

        echo "$RESULT"
        ;;

    *)
        echo "Twitter/X tool para Roberto (via Bird CLI)"
        echo ""
        echo "Uso:"
        echo "  twitter.sh search \"<query>\" [max]   — Buscar tweets"
        echo "  twitter.sh read <tweet_url>          — Leer tweet completo"
        echo "  twitter.sh leads \"<query>\" [max]    — Buscar leads en espanol"
        echo ""
        echo "Ejemplos:"
        echo "  twitter.sh search \"AI agents\" 20"
        echo "  twitter.sh read \"https://x.com/user/status/123456\""
        echo "  twitter.sh leads \"implementar IA\" 10"
        exit 1
        ;;
esac
