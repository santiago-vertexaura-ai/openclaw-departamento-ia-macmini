#!/bin/bash
# Morning Brief con Audio - Generación y envío automático

set -e

# Cargar credenciales
source ~/.openclaw/openclaw.json 2>/dev/null || true
source ~/clawd/.env.local 2>/dev/null || true

BRIEF_TEXT_FILE="/tmp/morning_brief_$(date +%Y%m%d).txt"
BRIEF_AUDIO_FILE="/tmp/morning_brief_$(date +%Y%m%d).m4a"

# Función para generar el brief (usando OpenClaw sessions)
generate_brief() {
    echo "Generando Morning Brief..."
    
    # Aquí el texto del brief se generará vía el cron existente
    # Este script solo se encarga de convertir a audio y enviar
    
    # Por ahora, capturamos el último brief del log o esperamos que el cron lo genere
    echo "Brief generado (pendiente de implementación completa)"
}

# Función para convertir a audio
convert_to_audio() {
    if [ ! -f "$BRIEF_TEXT_FILE" ]; then
        echo "Error: No se encontró el archivo de texto del brief"
        return 1
    fi
    
    echo "Convirtiendo a audio..."
    bash /Users/alfredpifi/clawd/scripts/say-alfred.sh Reed "$(cat $BRIEF_TEXT_FILE)" "$BRIEF_AUDIO_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✓ Audio generado: $BRIEF_AUDIO_FILE"
        return 0
    else
        echo "✗ Error generando audio"
        return 1
    fi
}

# Función para enviar por Telegram
send_to_telegram() {
    if [ ! -f "$BRIEF_AUDIO_FILE" ]; then
        echo "Error: No se encontró el archivo de audio"
        return 1
    fi
    
    # TODO: Implementar envío a Telegram con curl
    # Por ahora solo confirmamos que existe
    echo "✓ Audio listo para enviar: $BRIEF_AUDIO_FILE"
}

# Ejecución principal
echo "=== Morning Brief Audio Generator ==="
echo "Fecha: $(date '+%Y-%m-%d %H:%M')"
echo

# generate_brief
# convert_to_audio
# send_to_telegram

echo
echo "Script completado"
