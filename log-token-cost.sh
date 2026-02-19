#!/bin/bash

# Script para registrar costes reales basados en tokens
# Haiku precios: $0.80 por 1M tokens input, $4.00 por 1M tokens output
# Uso: bash log-token-cost.sh "1500" "800" "Respondiendo a Santi"

INPUT_TOKENS="${1:-100}"
OUTPUT_TOKENS="${2:-50}"
DESCRIPTION="${3:-Interacción con Santi}"

COSTS_FILE="/Users/alfredpifi/clawd/alfred-costs.json"

# Precios de Haiku (por millón de tokens)
INPUT_PRICE="0.80"
OUTPUT_PRICE="4.00"

# Calcular costes
# Coste = (tokens / 1,000,000) * precio
INPUT_COST=$(echo "scale=6; ($INPUT_TOKENS / 1000000) * $INPUT_PRICE" | bc)
OUTPUT_COST=$(echo "scale=6; ($OUTPUT_TOKENS / 1000000) * $OUTPUT_PRICE" | bc)
TOTAL_COST=$(echo "scale=6; $INPUT_COST + $OUTPUT_COST" | bc)

echo "📊 Tokens: Input=$INPUT_TOKENS | Output=$OUTPUT_TOKENS"
echo "💰 Costes: Input=$INPUT_COST | Output=$OUTPUT_COST | Total=$TOTAL_COST"

# Actualizar JSON con nueva interacción
jq --arg model "haiku" \
   --arg inputTokens "$INPUT_TOKENS" \
   --arg outputTokens "$OUTPUT_TOKENS" \
   --arg totalCost "$TOTAL_COST" \
   --arg inputCost "$INPUT_COST" \
   --arg outputCost "$OUTPUT_COST" \
   --arg desc "$DESCRIPTION" \
   '.interactions += [{
     "model": $model,
     "inputTokens": ($inputTokens | tonumber),
     "outputTokens": ($outputTokens | tonumber),
     "inputCost": ($inputCost | tonumber),
     "outputCost": ($outputCost | tonumber),
     "totalCost": ($totalCost | tonumber),
     "timestamp": now | todate,
     "description": $desc
   }] |
   .totalCosts = (.totalCosts + ($totalCost | tonumber)) |
   .summary.totalInputTokens = (.summary.totalInputTokens + ($inputTokens | tonumber)) |
   .summary.totalOutputTokens = (.summary.totalOutputTokens + ($outputTokens | tonumber)) |
   .summary.byModel.haiku.inputTokens = (.summary.byModel.haiku.inputTokens + ($inputTokens | tonumber)) |
   .summary.byModel.haiku.outputTokens = (.summary.byModel.haiku.outputTokens + ($outputTokens | tonumber)) |
   .summary.byModel.haiku.totalCost = (.summary.byModel.haiku.totalCost + ($totalCost | tonumber))' \
   "$COSTS_FILE" > "$COSTS_FILE.tmp"

mv "$COSTS_FILE.tmp" "$COSTS_FILE"

echo "✓ Coste registrado: \$${TOTAL_COST} USD (Haiku)"
