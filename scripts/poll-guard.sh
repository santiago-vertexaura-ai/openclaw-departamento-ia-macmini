#!/bin/bash
# poll-guard.sh — Check Supabase for pending tasks before starting LLM session
# Usage: poll-guard.sh <agent_name> <cron_job_id>
# If tasks found: triggers the OpenClaw cron job
# If no tasks: skips silently (no LLM cost)
set -euo pipefail

AGENT_NAME="${1:?Usage: poll-guard.sh <agent_name> <cron_job_id>}"
CRON_JOB_ID="${2:?Usage: poll-guard.sh <agent_name> <cron_job_id>}"
LOG_FILE="/Users/alfredpifi/clawd/logs/poll-guard.log"
ENV_FILE="/Users/alfredpifi/clawd/.env.local"

# Load Supabase credentials
SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_KEY=$(grep '^SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $AGENT_NAME | ERROR: Missing Supabase credentials" >> "$LOG_FILE"
  exit 1
fi

# Query Supabase for pending tasks for this agent
RESULT=$(curl -s --max-time 10 \
  "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${AGENT_NAME}&status=eq.pendiente&select=id&limit=1" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY" 2>/dev/null || echo "[]")

COUNT=$(echo "$RESULT" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))' 2>/dev/null || echo "0")

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$COUNT" -gt "0" ]; then
  echo "$TIMESTAMP | $AGENT_NAME | TASKS FOUND ($COUNT) | Triggering $CRON_JOB_ID" >> "$LOG_FILE"
  /opt/homebrew/bin/openclaw cron run "$CRON_JOB_ID" --timeout 600000 >> "$LOG_FILE" 2>&1 || \
    echo "$TIMESTAMP | $AGENT_NAME | ERROR triggering $CRON_JOB_ID" >> "$LOG_FILE"
else
  echo "$TIMESTAMP | $AGENT_NAME | NO TASKS | Skipped" >> "$LOG_FILE"
fi
