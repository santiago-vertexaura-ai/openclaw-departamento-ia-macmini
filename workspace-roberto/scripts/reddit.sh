#!/bin/bash
# reddit.sh — Reddit JSON API scanner para Roberto
# Uso: reddit.sh top <subreddit> [limit] [timeframe]
#      reddit.sh search "<query>" [limit]
#      reddit.sh scan                      — escanea todos los subreddits configurados

set -o pipefail

DATA_DIR="$(dirname "$0")/../data/reddit"
CONFIG_DIR="$(dirname "$0")/../skills/reddit"
TODAY=$(date +%Y-%m-%d)
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

mkdir -p "$DATA_DIR/$TODAY" 2>/dev/null

case "$1" in
    top)
        SUBREDDIT="$2"
        LIMIT="${3:-25}"
        TIMEFRAME="${4:-day}"
        if [ -z "$SUBREDDIT" ]; then
            echo '{"error": "Usage: reddit.sh top <subreddit> [limit] [timeframe]"}'
            exit 1
        fi

        URL="https://www.reddit.com/r/${SUBREDDIT}/top.json?t=${TIMEFRAME}&limit=${LIMIT}"
        RESULT=$(curl -sL -A "$UA" "$URL" 2>&1)

        if echo "$RESULT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
            echo "$RESULT" | python3 -c "
import sys, json

data = json.load(sys.stdin)
posts = data.get('data', {}).get('children', [])

results = []
for p in posts:
    d = p.get('data', {})
    results.append({
        'title': d.get('title', ''),
        'author': d.get('author', ''),
        'score': d.get('score', 0),
        'num_comments': d.get('num_comments', 0),
        'url': d.get('url', ''),
        'permalink': 'https://reddit.com' + d.get('permalink', ''),
        'created_utc': d.get('created_utc', 0),
        'subreddit': d.get('subreddit', ''),
        'selftext': d.get('selftext', '')[:300] if d.get('selftext') else ''
    })

print(json.dumps(results, indent=2, ensure_ascii=False))
"
            # Save
            echo "$RESULT" > "$DATA_DIR/$TODAY/top_${SUBREDDIT}.json"
        else
            echo "{\"error\": \"Failed to fetch r/$SUBREDDIT\", \"raw\": $(echo "$RESULT" | head -c 200 | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}"
        fi
        ;;

    search)
        QUERY="$2"
        LIMIT="${3:-25}"
        if [ -z "$QUERY" ]; then
            echo '{"error": "Usage: reddit.sh search \"<query>\" [limit]"}'
            exit 1
        fi

        ENCODED_QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$QUERY'))")
        URL="https://www.reddit.com/search.json?q=${ENCODED_QUERY}&sort=relevance&t=week&limit=${LIMIT}"
        RESULT=$(curl -sL -A "$UA" "$URL" 2>&1)

        if echo "$RESULT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
            echo "$RESULT" | python3 -c "
import sys, json

data = json.load(sys.stdin)
posts = data.get('data', {}).get('children', [])

results = []
for p in posts:
    d = p.get('data', {})
    results.append({
        'title': d.get('title', ''),
        'author': d.get('author', ''),
        'score': d.get('score', 0),
        'num_comments': d.get('num_comments', 0),
        'url': d.get('url', ''),
        'permalink': 'https://reddit.com' + d.get('permalink', ''),
        'subreddit': d.get('subreddit', '')
    })

print(json.dumps(results, indent=2, ensure_ascii=False))
"
            SAFE_QUERY=$(echo "$QUERY" | tr ' /' '_' | tr -cd '[:alnum:]_-')
            echo "$RESULT" > "$DATA_DIR/$TODAY/search_${SAFE_QUERY}.json"
        else
            echo "{\"error\": \"Reddit search failed\"}"
        fi
        ;;

    scan)
        # Scan all configured subreddits
        if [ -f "$CONFIG_DIR/config.json" ]; then
            SUBREDDITS=$(python3 -c "import json; c=json.load(open('$CONFIG_DIR/config.json')); print('\n'.join(c.get('subreddits',[])))")
        else
            SUBREDDITS="artificial MachineLearning LocalLLaMA ClaudeAI ChatGPT SaaS startups marketing"
        fi

        echo "["
        FIRST=1
        for SUB in $SUBREDDITS; do
            if [ $FIRST -eq 0 ]; then echo ","; fi
            FIRST=0
            echo "{\"subreddit\": \"$SUB\", \"posts\":"
            "$0" top "$SUB" 10 day 2>/dev/null || echo "[]"
            echo "}"
        done
        echo "]"
        ;;

    *)
        echo "Reddit scanner para Roberto"
        echo ""
        echo "Uso:"
        echo "  reddit.sh top <subreddit> [limit] [timeframe]  — Top posts de un subreddit"
        echo "  reddit.sh search \"<query>\" [limit]             — Buscar en todo Reddit"
        echo "  reddit.sh scan                                  — Escanear todos los subreddits configurados"
        echo ""
        echo "Ejemplos:"
        echo "  reddit.sh top artificial 10 day"
        echo "  reddit.sh search \"AI agents\" 25"
        echo "  reddit.sh scan"
        exit 1
        ;;
esac
