#!/bin/bash
# metrics.sh — Cálculos numéricos puros con jq + bc
# Uso: ./scripts/metrics.sh <comando> [args...]
# NO usa el modelo para calcular — solo aritmética

set -euo pipefail

CMD="${1:-help}"

case "$CMD" in

  engagement)
    # Calcular engagement rate
    # Uso: ./scripts/metrics.sh engagement <views> <likes> <comments> <shares>
    VIEWS="${2:?ERROR: Falta views}"
    LIKES="${3:?ERROR: Falta likes}"
    COMMENTS="${4:?ERROR: Falta comments}"
    SHARES="${5:-0}"

    if [[ "$VIEWS" -eq 0 ]]; then
      echo '{"engagement_rate": 0, "interactions": 0, "views": 0, "error": "zero views"}'
      exit 0
    fi

    INTERACTIONS=$((LIKES + COMMENTS + SHARES))
    RATE=$(echo "scale=4; ($INTERACTIONS / $VIEWS) * 100" | bc)

    echo "{\"engagement_rate\": $RATE, \"interactions\": $INTERACTIONS, \"views\": $VIEWS, \"likes\": $LIKES, \"comments\": $COMMENTS, \"shares\": $SHARES}"
    ;;

  growth)
    # Calcular tasa de crecimiento
    # Uso: ./scripts/metrics.sh growth <start> <end> <days>
    START="${2:?ERROR: Falta valor inicial}"
    END="${3:?ERROR: Falta valor final}"
    DAYS="${4:?ERROR: Falta días}"

    if [[ "$START" -eq 0 ]]; then
      echo '{"error": "start value is zero, cannot calculate growth rate"}'
      exit 0
    fi

    DELTA=$((END - START))
    GROWTH_PCT=$(echo "scale=2; ($DELTA / $START) * 100" | bc)
    DAILY_AVG=$(echo "scale=2; $DELTA / $DAYS" | bc)

    echo "{\"start\": $START, \"end\": $END, \"delta\": $DELTA, \"growth_pct\": $GROWTH_PCT, \"days\": $DAYS, \"daily_avg\": $DAILY_AVG}"
    ;;

  compare)
    # Comparar dos valores
    # Uso: ./scripts/metrics.sh compare <value1> <value2>
    VAL1="${2:?ERROR: Falta value1}"
    VAL2="${3:?ERROR: Falta value2}"

    if [[ "$VAL1" -eq 0 ]]; then
      echo "{\"value1\": $VAL1, \"value2\": $VAL2, \"delta\": $VAL2, \"delta_pct\": \"inf\", \"ratio\": \"inf\"}"
      exit 0
    fi

    DELTA=$((VAL2 - VAL1))
    DELTA_PCT=$(echo "scale=2; ($DELTA / $VAL1) * 100" | bc)
    RATIO=$(echo "scale=2; $VAL2 / $VAL1" | bc)

    echo "{\"value1\": $VAL1, \"value2\": $VAL2, \"delta\": $DELTA, \"delta_pct\": $DELTA_PCT, \"ratio\": $RATIO}"
    ;;

  rank)
    # Ordenar JSON array por un campo
    # Uso: echo '[...]' | ./scripts/metrics.sh rank <field>
    FIELD="${2:?ERROR: Falta field. Uso: echo '[...]' | ./scripts/metrics.sh rank <field>}"

    jq --arg f "$FIELD" '
      sort_by(-.[$f]) |
      to_entries |
      map(.value + {rank: (.key + 1)})
    '
    ;;

  *)
    echo "Uso: ./scripts/metrics.sh <comando> [args...]"
    echo ""
    echo "Comandos:"
    echo "  engagement <views> <likes> <comments> [shares]  Calcular engagement rate"
    echo "  growth <start> <end> <days>                     Calcular tasa de crecimiento"
    echo "  compare <value1> <value2>                       Comparar dos valores (delta%, ratio)"
    echo "  rank <field>                                    Ordenar JSON array (stdin) por campo"
    ;;

esac
