#!/bin/bash
# cron-health-guard.sh — Only trigger health monitor if there are actual errors
# Checks jobs.json for consecutiveErrors >= 2 before starting an LLM session
set -euo pipefail

LOG_FILE="/Users/alfredpifi/clawd/logs/poll-guard.log"
JOBS_FILE="/Users/alfredpifi/.openclaw/cron/jobs.json"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ ! -f "$JOBS_FILE" ]; then
  echo "$TIMESTAMP | health-guard | ERROR: jobs.json not found" >> "$LOG_FILE"
  exit 1
fi

ERRORS=$(jq '[.jobs[] | select(.state.consecutiveErrors >= 2)] | length' "$JOBS_FILE" 2>/dev/null || echo "0")

if [ "$ERRORS" -gt "0" ]; then
  echo "$TIMESTAMP | health-guard | ERRORS FOUND ($ERRORS) | Triggering alfred-cron-health-monitor" >> "$LOG_FILE"
  /opt/homebrew/bin/openclaw cron run alfred-cron-health-monitor --timeout 60000 >> "$LOG_FILE" 2>&1 || \
    echo "$TIMESTAMP | health-guard | ERROR triggering monitor" >> "$LOG_FILE"
else
  echo "$TIMESTAMP | health-guard | NO ERRORS | Skipped" >> "$LOG_FILE"
fi
