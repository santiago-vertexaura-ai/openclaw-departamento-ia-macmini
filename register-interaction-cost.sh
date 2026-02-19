#!/bin/bash

# Script que se ejecuta AUTOMÁTICAMENTE después de cada respuesta
# Estima tokens y registra costes
# Los tokens se estiman: ~4 caracteres = 1 token

# Parámetros
MESSAGE_LENGTH="${1:-0}"  # Longitud del mensaje del usuario
RESPONSE_LENGTH="${2:-0}" # Longitud de mi respuesta

# Estimar tokens (aproximación: 1 token = ~4 caracteres)
INPUT_TOKENS=$((MESSAGE_LENGTH / 4))
OUTPUT_TOKENS=$((RESPONSE_LENGTH / 4))

# Si son muy pequeños, mínimo 10 tokens
[ $INPUT_TOKENS -lt 10 ] && INPUT_TOKENS=10
[ $OUTPUT_TOKENS -lt 10 ] && OUTPUT_TOKENS=10

COSTS_FILE="/Users/alfredpifi/clawd/alfred-costs.json"

# Precios Haiku (actualizados)
INPUT_PRICE="1.25"
OUTPUT_PRICE="5.00"

# Calcular costes
INPUT_COST=$(echo "scale=8; ($INPUT_TOKENS / 1000000) * $INPUT_PRICE" | bc)
OUTPUT_COST=$(echo "scale=8; ($OUTPUT_TOKENS / 1000000) * $OUTPUT_PRICE" | bc)
TOTAL_COST=$(echo "scale=8; $INPUT_COST + $OUTPUT_COST" | bc)

# Actualizar JSON
jq --arg model "claude-haiku-4.5" \
   --arg inputTokens "$INPUT_TOKENS" \
   --arg outputTokens "$OUTPUT_TOKENS" \
   --arg totalCost "$TOTAL_COST" \
   --arg inputCost "$INPUT_COST" \
   --arg outputCost "$OUTPUT_COST" \
   '.interactions += [{
     "model": $model,
     "inputTokens": ($inputTokens | tonumber),
     "outputTokens": ($outputTokens | tonumber),
     "inputCost": ($inputCost | tonumber),
     "outputCost": ($outputCost | tonumber),
     "totalCost": ($totalCost | tonumber),
     "timestamp": now | todate,
     "description": "Respuesta a Santi"
   }] |
   .totalCosts = (.totalCosts + ($totalCost | tonumber)) |
   .summary.totalInputTokens = (.summary.totalInputTokens + ($inputTokens | tonumber)) |
   .summary.totalOutputTokens = (.summary.totalOutputTokens + ($outputTokens | tonumber)) |
   .summary.byModel["claude-haiku-4.5"].inputTokens = (.summary.byModel["claude-haiku-4.5"].inputTokens + ($inputTokens | tonumber)) |
   .summary.byModel["claude-haiku-4.5"].outputTokens = (.summary.byModel["claude-haiku-4.5"].outputTokens + ($outputTokens | tonumber)) |
   .summary.byModel["claude-haiku-4.5"].totalCost = (.summary.byModel["claude-haiku-4.5"].totalCost + ($totalCost | tonumber))' \
   "$COSTS_FILE" > "$COSTS_FILE.tmp"

mv "$COSTS_FILE.tmp" "$COSTS_FILE"

echo "💰 Coste registrado: \$${TOTAL_COST} USD"
echo "📊 Input: $INPUT_TOKENS tokens | Output: $OUTPUT_TOKENS tokens"
