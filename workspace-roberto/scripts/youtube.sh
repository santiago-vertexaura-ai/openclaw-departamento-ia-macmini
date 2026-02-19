#!/bin/bash
# youtube.sh — Wrapper para yt-dlp que maneja exit codes correctamente
# Uso: youtube.sh list <channel_id> [max_videos]
#      youtube.sh info <video_id>
#
# IMPORTANTE: yt-dlp frecuentemente sale con código 101 (errores parciales)
# incluso cuando los datos son válidos. Este script maneja eso internamente.

set -o pipefail

case "$1" in
    list)
        INPUT="$2"
        MAX="${3:-5}"
        if [ -z "$INPUT" ]; then
            echo '{"error": "Usage: youtube.sh list <channel_id_or_handle> [max_videos]. Ejemplo: youtube.sh list UCMwVTLZIRRUyyVrkjDpn4pA 5"}'
            exit 1
        fi
        # Si recibimos un handle (@...), resolverlo a channel_id via yt-dlp
        if [[ "$INPUT" == @* ]]; then
            CHANNEL_ID=$(yt-dlp --print channel_id "https://www.youtube.com/$INPUT/videos" --playlist-items 1 2>/dev/null) || true
            if [ -z "$CHANNEL_ID" ]; then
                echo "{\"error\": \"No se pudo resolver el handle $INPUT a un channel_id. Usa el channel_id directamente (formato UCxxxx) o lee config.json\"}"
                exit 0
            fi
        else
            CHANNEL_ID="$INPUT"
        fi
        # Usa RSS feed (más fiable que yt-dlp para listar vídeos, sin problemas de exit code)
        curl -sL "https://www.youtube.com/feeds/videos.xml?channel_id=$CHANNEL_ID" | \
            python3 -c "
import sys, json, xml.etree.ElementTree as ET
ns = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015', 'media': 'http://search.yahoo.com/mrss/'}
try:
    tree = ET.parse(sys.stdin)
    entries = tree.findall('.//a:entry', ns)[:$MAX]
    videos = []
    for e in entries:
        vid_id = e.find('yt:videoId', ns)
        title = e.find('a:title', ns)
        published = e.find('a:published', ns)
        media_group = e.find('media:group', ns)
        description = ''
        if media_group is not None:
            desc_el = media_group.find('media:description', ns)
            if desc_el is not None and desc_el.text:
                description = desc_el.text[:500]
        videos.append({
            'id': vid_id.text if vid_id is not None else '',
            'title': title.text if title is not None else '',
            'published': published.text if published is not None else '',
            'description': description
        })
    print(json.dumps(videos, indent=2, ensure_ascii=False))
except Exception as ex:
    print(json.dumps({'error': str(ex)}))
"
        ;;

    info)
        VIDEO_ID="$2"
        if [ -z "$VIDEO_ID" ]; then
            echo '{"error": "Usage: youtube.sh info <video_id>"}'
            exit 1
        fi
        # yt-dlp con vídeo individual casi siempre sale con código 0
        # Si sale con 101, los datos siguen siendo válidos
        OUTPUT=$(yt-dlp --dump-json "https://www.youtube.com/watch?v=$VIDEO_ID" 2>/dev/null) || true
        if [ -n "$OUTPUT" ]; then
            echo "$OUTPUT"
        else
            echo "{\"error\": \"No se pudo obtener info del vídeo $VIDEO_ID\"}"
        fi
        ;;

    *)
        echo "YouTube scraping tool para Roberto"
        echo ""
        echo "Uso:"
        echo "  youtube.sh list <channel_id> [max_videos]   — Listar últimos vídeos (vía RSS)"
        echo "  youtube.sh info <video_id>                  — Metadatos completos de un vídeo"
        echo ""
        echo "Ejemplos:"
        echo "  youtube.sh list UCMwVTLZIRRUyyVrkjDpn4pA 5  — Últimos 5 de Cole Medin"
        echo "  youtube.sh info dQw4w9WgXcQ                — Info completa de un vídeo"
        exit 1
        ;;
esac
