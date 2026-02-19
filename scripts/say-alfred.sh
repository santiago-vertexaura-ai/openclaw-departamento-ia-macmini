#!/bin/bash
# say-alfred.sh - Genera audios en español castellano con voz de hombre

VOICE="${1:-Reed}"  # Default: Reed (hombre, español castellano)
TEXT="${2:-Hola santi}"
OUTPUT="${3:-/tmp/alfred-audio.m4a}"

if [ -z "$TEXT" ]; then
    echo "Uso: ./say-alfred.sh [voz] [texto] [archivo_salida]"
    echo ""
    echo "Voces disponibles (español castellano):"
    say -v "?" 2>&1 | grep "Español (España)" | awk '{print "  - " $1}'
    echo ""
    echo "Ej: ./say-alfred.sh Reed 'Hola santi' /tmp/audio.m4a"
    exit 1
fi

echo "🎙️ Generando audio con voz $VOICE..."
say -v "$VOICE" "$TEXT" -o "$OUTPUT" 2>&1

if [ -f "$OUTPUT" ]; then
    SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')
    echo "✅ Audio generado: $OUTPUT ($SIZE)"
else
    echo "❌ Error generando audio"
    exit 1
fi
