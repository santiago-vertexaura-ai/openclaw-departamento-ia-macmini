#!/bin/bash

# Script para cambiar el estado a "idle" (Descansado)
# Se ejecuta cuando termino de procesar tareas

STATUS_FILE="/Users/alfredpifi/clawd/alfred-status.json"
TIMESTAMP_UTC=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

# Cambiar status a "idle"
jq ".status = \"idle\" | .currentActivity = \"Esperando tareas\"" "$STATUS_FILE" > "$STATUS_FILE.tmp"
mv "$STATUS_FILE.tmp" "$STATUS_FILE"

echo "✓ Estado: IDLE (Descansado)"
