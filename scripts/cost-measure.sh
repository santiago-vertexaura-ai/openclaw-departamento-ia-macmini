#!/bin/bash
# cost-measure.sh — Measure and record daily cost metrics for before/after comparison
# Outputs JSON report to ~/clawd/logs/cost-report-YYYY-MM-DD.json
set -euo pipefail

DATE=$(date '+%Y-%m-%d')
REPORT_FILE="/Users/alfredpifi/clawd/logs/cost-report-${DATE}.json"
LEDGER_FILE="/Users/alfredpifi/clawd/cost-ledger.json"
GUARD_LOG="/Users/alfredpifi/clawd/logs/poll-guard.log"

# Count poll-guard activity for today
GUARD_TRIGGERED=0
GUARD_SKIPPED=0
if [ -f "$GUARD_LOG" ]; then
  GUARD_TRIGGERED=$(grep -c "$DATE.*TASKS FOUND\|$DATE.*ERRORS FOUND" "$GUARD_LOG" 2>/dev/null || echo "0")
  GUARD_SKIPPED=$(grep -c "$DATE.*NO TASKS\|$DATE.*NO ERRORS" "$GUARD_LOG" 2>/dev/null || echo "0")
fi

# Read cost ledger
ALFRED_COST=0 ROBERTO_COST=0 ANDRES_COST=0 MARINA_COST=0
ALFRED_INT=0 ROBERTO_INT=0 ANDRES_INT=0 MARINA_INT=0
if [ -f "$LEDGER_FILE" ]; then
  ALFRED_COST=$(jq -r '.alfred.totalCostMonth // 0' "$LEDGER_FILE" 2>/dev/null || echo "0")
  ROBERTO_COST=$(jq -r '.roberto.totalCostMonth // 0' "$LEDGER_FILE" 2>/dev/null || echo "0")
  ANDRES_COST=$(jq -r '.andres.totalCostMonth // 0' "$LEDGER_FILE" 2>/dev/null || echo "0")
  MARINA_COST=$(jq -r '.marina.totalCostMonth // 0' "$LEDGER_FILE" 2>/dev/null || echo "0")
  ALFRED_INT=$(jq -r '.alfred.interactionCount // 0' "$LEDGER_FILE" 2>/dev/null || echo "0")
  ROBERTO_INT=$(jq -r '.roberto.interactionCount // 0' "$LEDGER_FILE" 2>/dev/null || echo "0")
  ANDRES_INT=$(jq -r '.andres.interactionCount // 0' "$LEDGER_FILE" 2>/dev/null || echo "0")
  MARINA_INT=$(jq -r '.marina.interactionCount // 0' "$LEDGER_FILE" 2>/dev/null || echo "0")
fi

# Estimate savings from skipped polls
# Average cost per poll ~$0.03 (Haiku)
SAVINGS=$(echo "$GUARD_SKIPPED * 0.03" | bc 2>/dev/null || echo "0")

# Generate report
cat > "$REPORT_FILE" <<EOF
{
  "date": "$DATE",
  "poll_guard": {
    "triggered": $GUARD_TRIGGERED,
    "skipped": $GUARD_SKIPPED,
    "estimated_savings_usd": $SAVINGS
  },
  "agents": {
    "alfred": { "cost_month": $ALFRED_COST, "interactions_month": $ALFRED_INT },
    "roberto": { "cost_month": $ROBERTO_COST, "interactions_month": $ROBERTO_INT },
    "andres": { "cost_month": $ANDRES_COST, "interactions_month": $ANDRES_INT },
    "marina": { "cost_month": $MARINA_COST, "interactions_month": $MARINA_INT }
  },
  "total_cost_month": $(echo "$ALFRED_COST + $ROBERTO_COST + $ANDRES_COST + $MARINA_COST" | bc 2>/dev/null || echo "0")
}
EOF

echo "Report saved to $REPORT_FILE"
