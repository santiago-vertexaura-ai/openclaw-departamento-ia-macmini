#!/bin/bash
# news.sh — Google News RSS parser para Roberto
# Uso: news.sh search "<query>" [max_results] [lang] [country]
#
# Parsea RSS XML y devuelve JSON limpio (no XML crudo).

set -o pipefail

case "$1" in
    search)
        QUERY="$2"
        MAX="${3:-10}"
        LANG="${4:-es}"
        COUNTRY="${5:-ES}"
        if [ -z "$QUERY" ]; then
            echo '{"error": "Usage: news.sh search \"<query>\" [max_results] [lang] [country]. Ejemplo: news.sh search \"Claude Code\" 10 es ES"}'
            exit 1
        fi
        # URL-encode query (basic)
        ENCODED_QUERY=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$QUERY'))")
        URL="https://news.google.com/rss/search?q=${ENCODED_QUERY}&hl=${LANG}&gl=${COUNTRY}"

        curl -sL -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' "$URL" | \
            python3 -c "
import sys, json, xml.etree.ElementTree as ET
from datetime import datetime

try:
    raw = sys.stdin.read()
    if not raw.strip():
        print(json.dumps({'error': 'RSS vacio. Google News no devolvio resultados.'}))
        sys.exit(0)

    root = ET.fromstring(raw)
    channel = root.find('channel')
    items = channel.findall('item')[:$MAX] if channel is not None else []

    results = []
    for item in items:
        title = item.find('title')
        link = item.find('link')
        pub_date = item.find('pubDate')
        source = item.find('source')

        results.append({
            'title': title.text if title is not None else '',
            'link': link.text if link is not None else '',
            'published': pub_date.text if pub_date is not None else '',
            'source': source.text if source is not None else ''
        })

    print(json.dumps(results, indent=2, ensure_ascii=False))
except ET.ParseError as e:
    print(json.dumps({'error': f'XML parse error: {str(e)}'}))
except Exception as e:
    print(json.dumps({'error': str(e)}))
"
        ;;

    *)
        echo "Google News RSS tool para Roberto"
        echo ""
        echo "Uso:"
        echo "  news.sh search \"<query>\" [max_results] [lang] [country]"
        echo ""
        echo "Ejemplos:"
        echo "  news.sh search \"Claude Code\" 10 es ES"
        echo "  news.sh search \"inteligencia artificial\" 5 es ES"
        echo "  news.sh search \"AI agents\" 10 en US"
        exit 1
        ;;
esac
