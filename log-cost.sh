#!/bin/bash

# Script para registrar costes de cada interacción
# Uso: bash log-cost.sh "model-name" "0.0001" "Descripción"

MODEL="${1:-haiku}"
COST="${2:-0.0001}"
DESCRIPTION="${3:-Interacción con Santi}"

COSTS_FILE="/Users/alfredpifi/clawd/alfred-costs.json"

# Agregar interacción
jq ".interactions += [{\"model\": \"$MODEL\", \"cost\": $COST, \"timestamp\": \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\", \"description\": \"$DESCRIPTION\"}] | .totalCosts += $COST" "$COSTS_FILE" > "$COSTS_FILE.tmp"
mv "$COSTS_FILE.tmp" "$COSTS_FILE"

echo "✓ Coste registrado: $COST USD ($MODEL)"
