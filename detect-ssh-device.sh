#!/bin/bash

# Script para detectar conexiones SSH activas y guardar el dispositivo conectado

# Detectar conexiones SSH activas
SSH_CONNECTIONS=$(who | grep '(' | head -1)

if [ -n "$SSH_CONNECTIONS" ]; then
    # Extraer IP y dispositivo
    IP=$(echo "$SSH_CONNECTIONS" | grep -oE '\([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\)' | tr -d '()')
    DEVICE=$(echo "$SSH_CONNECTIONS" | awk '{print $NF}')
    
    # Detectar tipo de dispositivo por IP o hostname
    if [[ "$DEVICE" == *"MacPro"* ]] || [[ "$SSH_CONNECTIONS" == *"MacPro"* ]]; then
        DEVICE_TYPE="MacPro"
    elif [[ "$DEVICE" == *"iPhone"* ]]; then
        DEVICE_TYPE="iPhone"
    elif [[ "$DEVICE" == *"iPad"* ]]; then
        DEVICE_TYPE="iPad"
    elif [[ "$DEVICE" == *"Mac"* ]]; then
        DEVICE_TYPE="Mac"
    else
        DEVICE_TYPE="Remoto"
    fi
    
    # Actualizar alfred-status.json
    jq ".device = {\"type\": \"$DEVICE_TYPE\", \"ip\": \"$IP\", \"connection\": \"SSH\"}" alfred-status.json > alfred-status.json.tmp
    mv alfred-status.json.tmp alfred-status.json
    
    echo "✓ Dispositivo detectado: $DEVICE_TYPE ($IP)"
else
    # No hay conexión SSH activa
    jq ".device = {\"type\": null, \"ip\": null, \"connection\": null}" alfred-status.json > alfred-status.json.tmp
    mv alfred-status.json.tmp alfred-status.json
    
    echo "✓ No hay conexión SSH activa"
fi
