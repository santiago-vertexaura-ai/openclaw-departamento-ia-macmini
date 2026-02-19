#!/bin/bash
# alfred-status-watcher.sh
# Watches OpenClaw gateway logs and updates agents-status.json in real-time.
# Tracks Alfred (main), Roberto, Andrés, and Marina agents.
# Persists cost data in cost-ledger.json across restarts.
# Parses JSON log format with embedded run events.

STATUS_FILE="/Users/alfredpifi/clawd/agents-status.json"
LEGACY_FILE="/Users/alfredpifi/clawd/alfred-status.json"
LEDGER_FILE="/Users/alfredpifi/clawd/cost-ledger.json"
LOG_DIR="/tmp/openclaw"
SESSIONS_DIR_MAIN="/Users/alfredpifi/.openclaw/agents/main/sessions"
SESSIONS_DIR_ROBERTO="/Users/alfredpifi/.openclaw/agents/roberto/sessions"
SESSIONS_DIR_ANDRES="/Users/alfredpifi/.openclaw/agents/andres/sessions"
SESSIONS_DIR_MARINA="/Users/alfredpifi/.openclaw/agents/marina/sessions"
SESSIONS_DIR_ARTURO="/Users/alfredpifi/.openclaw/agents/arturo/sessions"
SESSIONS_DIR_ALEX="/Users/alfredpifi/.openclaw/agents/alex/sessions"

# Per-agent state
ALFRED_STATUS="idle"
ALFRED_LAST_ACTIVITY=""
ALFRED_LAST_COST="0"
ALFRED_LAST_MODEL=""
ALFRED_LAST_DESC="Watcher iniciado"

ROBERTO_STATUS="idle"
ROBERTO_LAST_ACTIVITY=""
ROBERTO_LAST_COST="0"
ROBERTO_LAST_MODEL=""
ROBERTO_LAST_DESC=""

ANDRES_STATUS="idle"
ANDRES_LAST_ACTIVITY=""
ANDRES_LAST_COST="0"
ANDRES_LAST_MODEL=""
ANDRES_LAST_DESC=""

MARINA_STATUS="idle"
MARINA_LAST_ACTIVITY=""
MARINA_LAST_COST="0"
MARINA_LAST_MODEL=""
MARINA_LAST_DESC=""

ARTURO_STATUS="idle"
ARTURO_LAST_ACTIVITY=""
ARTURO_LAST_COST="0"
ARTURO_LAST_MODEL=""
ARTURO_LAST_DESC=""

ALEX_STATUS="idle"
ALEX_LAST_ACTIVITY=""
ALEX_LAST_COST="0"
ALEX_LAST_MODEL=""
ALEX_LAST_DESC=""

# Ledger vars
LEDGER_alfred_totalAll="0"
LEDGER_alfred_totalMonth="0"
LEDGER_alfred_totalToday="0"
LEDGER_alfred_interactions="0"
LEDGER_roberto_totalAll="0"
LEDGER_roberto_totalMonth="0"
LEDGER_roberto_totalToday="0"
LEDGER_roberto_interactions="0"
LEDGER_andres_totalAll="0"
LEDGER_andres_totalMonth="0"
LEDGER_andres_totalToday="0"
LEDGER_andres_interactions="0"
LEDGER_marina_totalAll="0"
LEDGER_marina_totalMonth="0"
LEDGER_marina_totalToday="0"
LEDGER_marina_interactions="0"
LEDGER_arturo_totalAll="0"
LEDGER_arturo_totalMonth="0"
LEDGER_arturo_totalToday="0"
LEDGER_arturo_interactions="0"
LEDGER_alex_totalAll="0"
LEDGER_alex_totalMonth="0"
LEDGER_alex_totalToday="0"
LEDGER_alex_interactions="0"

# Load from cost ledger
if [ -f "$LEDGER_FILE" ]; then
  eval "$(python3 -c "
import json
try:
  d = json.load(open('$LEDGER_FILE'))
  for agent in ['alfred', 'roberto', 'andres', 'marina', 'arturo', 'alex']:
    a = d.get(agent, {})
    print(f'LEDGER_{agent}_totalAll=\"{a.get(\"totalAll\", 0)}\"')
    print(f'LEDGER_{agent}_totalMonth=\"{a.get(\"totalMonth\", 0)}\"')
    print(f'LEDGER_{agent}_totalToday=\"{a.get(\"totalToday\", 0)}\"')
    print(f'LEDGER_{agent}_interactions=\"{a.get(\"interactions\", 0)}\"')
except: pass
" 2>/dev/null)"
fi

# Also try reading from legacy file for Alfred if ledger is empty
if [ -f "$LEGACY_FILE" ] && [ "$LEDGER_alfred_totalAll" = "0" ]; then
  eval "$(python3 -c "
import json
try:
  d = json.load(open('$LEGACY_FILE'))
  print(f'LEDGER_alfred_totalAll=\"{d.get(\"totalCost\", 0)}\"')
  print(f'LEDGER_alfred_interactions=\"{d.get(\"interactionCount\", 0)}\"')
except: pass
" 2>/dev/null)"
fi

TODAY=$(date +%Y-%m-%d)
THIS_MONTH=$(date +%Y-%m)

extract_last_cost() {
  local sessions_dir="$1"
  local latest_session
  latest_session=$(ls -t "$sessions_dir"/*.jsonl 2>/dev/null | head -1)
  if [ -z "$latest_session" ]; then
    echo "|"
    return
  fi

  python3 -c "
import json
cost = None
model = None
with open('$latest_session', 'r') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        try:
            obj = json.loads(line)
            msg = obj.get('message', {})
            if msg.get('role') == 'assistant' and msg.get('usage', {}).get('cost'):
                c = msg['usage']['cost']
                cost = c.get('total', 0)
                model = msg.get('model', 'unknown')
        except: pass
if cost is not None:
    print(f'{cost}|{model}')
else:
    print('|')
" 2>/dev/null
}

extract_session_cost() {
  local sessions_dir="$1"
  local session_id="$2"
  local session_file="${sessions_dir}/${session_id}.jsonl"

  if [ ! -f "$session_file" ]; then
    echo "|"
    return
  fi

  python3 -c "
import json
total_cost = 0
model = None
with open('$session_file', 'r') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        try:
            obj = json.loads(line)
            msg = obj.get('message', {})
            if msg.get('role') == 'assistant' and msg.get('usage', {}).get('cost'):
                c = msg['usage']['cost']
                total_cost += c.get('total', 0)
                model = msg.get('model', 'unknown')
        except: pass
if total_cost > 0:
    print(f'{total_cost}|{model}')
else:
    print('|')
" 2>/dev/null
}

write_status() {
  python3 -c "
import json
data = {
  'alfred': {
    'status': '$ALFRED_STATUS',
    'lastActivity': '$ALFRED_LAST_ACTIVITY',
    'lastActivityDescription': '$ALFRED_LAST_DESC',
    'lastCost': $ALFRED_LAST_COST,
    'lastModel': '$ALFRED_LAST_MODEL',
    'totalCostToday': $LEDGER_alfred_totalToday,
    'totalCostMonth': $LEDGER_alfred_totalMonth,
    'totalCostAll': $LEDGER_alfred_totalAll,
    'interactionCount': $LEDGER_alfred_interactions
  },
  'roberto': {
    'status': '$ROBERTO_STATUS',
    'lastActivity': '$ROBERTO_LAST_ACTIVITY',
    'lastActivityDescription': '$ROBERTO_LAST_DESC',
    'lastCost': $ROBERTO_LAST_COST,
    'lastModel': '$ROBERTO_LAST_MODEL',
    'totalCostToday': $LEDGER_roberto_totalToday,
    'totalCostMonth': $LEDGER_roberto_totalMonth,
    'totalCostAll': $LEDGER_roberto_totalAll,
    'interactionCount': $LEDGER_roberto_interactions
  },
  'andres': {
    'status': '$ANDRES_STATUS',
    'lastActivity': '$ANDRES_LAST_ACTIVITY',
    'lastActivityDescription': '$ANDRES_LAST_DESC',
    'lastCost': $ANDRES_LAST_COST,
    'lastModel': '$ANDRES_LAST_MODEL',
    'totalCostToday': $LEDGER_andres_totalToday,
    'totalCostMonth': $LEDGER_andres_totalMonth,
    'totalCostAll': $LEDGER_andres_totalAll,
    'interactionCount': $LEDGER_andres_interactions
  },
  'marina': {
    'status': '$MARINA_STATUS',
    'lastActivity': '$MARINA_LAST_ACTIVITY',
    'lastActivityDescription': '$MARINA_LAST_DESC',
    'lastCost': $MARINA_LAST_COST,
    'lastModel': '$MARINA_LAST_MODEL',
    'totalCostToday': $LEDGER_marina_totalToday,
    'totalCostMonth': $LEDGER_marina_totalMonth,
    'totalCostAll': $LEDGER_marina_totalAll,
    'interactionCount': $LEDGER_marina_interactions
  },
  'arturo': {
    'status': '$ARTURO_STATUS',
    'lastActivity': '$ARTURO_LAST_ACTIVITY',
    'lastActivityDescription': '$ARTURO_LAST_DESC',
    'lastCost': $ARTURO_LAST_COST,
    'lastModel': '$ARTURO_LAST_MODEL',
    'totalCostToday': $LEDGER_arturo_totalToday,
    'totalCostMonth': $LEDGER_arturo_totalMonth,
    'totalCostAll': $LEDGER_arturo_totalAll,
    'interactionCount': $LEDGER_arturo_interactions
  },
  'alex': {
    'status': '$ALEX_STATUS',
    'lastActivity': '$ALEX_LAST_ACTIVITY',
    'lastActivityDescription': '$ALEX_LAST_DESC',
    'lastCost': $ALEX_LAST_COST,
    'lastModel': '$ALEX_LAST_MODEL',
    'totalCostToday': $LEDGER_alex_totalToday,
    'totalCostMonth': $LEDGER_alex_totalMonth,
    'totalCostAll': $LEDGER_alex_totalAll,
    'interactionCount': $LEDGER_alex_interactions
  }
}
with open('${STATUS_FILE}.tmp', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"

  # Legacy format for backwards compat
  python3 -c "
import json
data = {
  'status': '$ALFRED_STATUS',
  'mood': 'En accion' if '$ALFRED_STATUS' == 'working' else 'Descansando',
  'currentActivity': '$ALFRED_LAST_DESC',
  'lastActivityDescription': '$ALFRED_LAST_DESC',
  'lastActivity': '$ALFRED_LAST_ACTIVITY',
  'lastCost': $ALFRED_LAST_COST,
  'lastModel': '$ALFRED_LAST_MODEL',
  'totalCost': $LEDGER_alfred_totalAll,
  'interactionCount': $LEDGER_alfred_interactions,
  'available': True
}
with open('${LEGACY_FILE}.tmp', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null && mv "${LEGACY_FILE}.tmp" "$LEGACY_FILE"
}

save_ledger() {
  python3 -c "
import json
data = {
  'alfred': {
    'totalAll': $LEDGER_alfred_totalAll,
    'totalMonth': $LEDGER_alfred_totalMonth,
    'totalToday': $LEDGER_alfred_totalToday,
    'interactions': $LEDGER_alfred_interactions,
    'date': '$TODAY',
    'month': '$THIS_MONTH'
  },
  'roberto': {
    'totalAll': $LEDGER_roberto_totalAll,
    'totalMonth': $LEDGER_roberto_totalMonth,
    'totalToday': $LEDGER_roberto_totalToday,
    'interactions': $LEDGER_roberto_interactions,
    'date': '$TODAY',
    'month': '$THIS_MONTH'
  },
  'andres': {
    'totalAll': $LEDGER_andres_totalAll,
    'totalMonth': $LEDGER_andres_totalMonth,
    'totalToday': $LEDGER_andres_totalToday,
    'interactions': $LEDGER_andres_interactions,
    'date': '$TODAY',
    'month': '$THIS_MONTH'
  },
  'marina': {
    'totalAll': $LEDGER_marina_totalAll,
    'totalMonth': $LEDGER_marina_totalMonth,
    'totalToday': $LEDGER_marina_totalToday,
    'interactions': $LEDGER_marina_interactions,
    'date': '$TODAY',
    'month': '$THIS_MONTH'
  },
  'arturo': {
    'totalAll': $LEDGER_arturo_totalAll,
    'totalMonth': $LEDGER_arturo_totalMonth,
    'totalToday': $LEDGER_arturo_totalToday,
    'interactions': $LEDGER_arturo_interactions,
    'date': '$TODAY',
    'month': '$THIS_MONTH'
  },
  'alex': {
    'totalAll': $LEDGER_alex_totalAll,
    'totalMonth': $LEDGER_alex_totalMonth,
    'totalToday': $LEDGER_alex_totalToday,
    'interactions': $LEDGER_alex_interactions,
    'date': '$TODAY',
    'month': '$THIS_MONTH'
  }
}
with open('${LEDGER_FILE}.tmp', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null && mv "${LEDGER_FILE}.tmp" "$LEDGER_FILE"
}

# Parse a JSON log line — outputs: EVENT|AGENT|RUNID|SESSIONID|EXTRA|TIME
parse_log_line() {
  python3 -c "
import json, sys
line = sys.stdin.read().strip()
if not line: sys.exit(0)
try:
    obj = json.loads(line)
    msg = obj.get('1', '')
    time = obj.get('time', '')

    # Parse key=value pairs from the message
    parts = {}
    for token in msg.split():
        if '=' in token:
            k, v = token.split('=', 1)
            parts[k] = v

    run_id = parts.get('runId', '')

    # Determine agent from runId
    # IMPORTANT: announce: check MUST come first — announce runs contain agent names
    # but are just wrappers, not actual agent work.
    # Also: cron trigger runs (e.g. roberto-task-poll without announce:) are ALFRED
    # orchestrating, not the sub-agent. Only classify as roberto/andres for
    # non-announce runs that are NOT the cron trigger itself.
    if run_id.startswith('announce:'):
        agent = 'announce'
    else:
        agent = 'alfred'

    session_id = parts.get('sessionId', '')

    if 'embedded run tool start:' in msg:
        tool = parts.get('tool', '')
        print(f'TOOL|{agent}|{run_id}|{session_id}|{tool}|{time}')
    elif 'embedded run start:' in msg:
        model = parts.get('model', '')
        print(f'START|{agent}|{run_id}|{session_id}|{model}|{time}')
    elif 'embedded run done:' in msg:
        print(f'DONE|{agent}|{run_id}|{session_id}||{time}')
except: pass
" <<< "$1"
}

# Initial state
ALFRED_LAST_ACTIVITY=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

write_status
save_ledger

CURRENT_DATE=""

while true; do
  TODAY=$(date +%Y-%m-%d)
  THIS_MONTH=$(date +%Y-%m)
  LOG_FILE="$LOG_DIR/openclaw-${TODAY}.log"

  # Reset daily counters at midnight
  if [ -n "$CURRENT_DATE" ] && [ "$CURRENT_DATE" != "$TODAY" ]; then
    LEDGER_alfred_totalToday="0"
    LEDGER_roberto_totalToday="0"
    LEDGER_andres_totalToday="0"
    LEDGER_marina_totalToday="0"
    LEDGER_arturo_totalToday="0"
    LEDGER_alex_totalToday="0"
    OLD_MONTH=$(echo "$CURRENT_DATE" | cut -d'-' -f1-2)
    if [ "$OLD_MONTH" != "$THIS_MONTH" ]; then
      LEDGER_alfred_totalMonth="0"
      LEDGER_roberto_totalMonth="0"
      LEDGER_andres_totalMonth="0"
      LEDGER_marina_totalMonth="0"
      LEDGER_arturo_totalMonth="0"
      LEDGER_alex_totalMonth="0"
    fi
    save_ledger
    write_status
  fi

  if [ ! -f "$LOG_FILE" ]; then
    sleep 5
    continue
  fi

  CURRENT_DATE="$TODAY"

  tail -n 0 -F "$LOG_FILE" 2>/dev/null | while IFS= read -r line; do
    NEW_DATE=$(date +%Y-%m-%d)
    if [ "$NEW_DATE" != "$CURRENT_DATE" ]; then
      break
    fi

    # Fast filter: skip lines without embedded run events
    case "$line" in
      *"embedded run"*) ;;
      *) continue ;;
    esac

    parsed=$(parse_log_line "$line")
    [ -z "$parsed" ] && continue

    EVENT=$(echo "$parsed" | cut -d'|' -f1)
    AGENT=$(echo "$parsed" | cut -d'|' -f2)
    RUNID=$(echo "$parsed" | cut -d'|' -f3)
    SESSIONID=$(echo "$parsed" | cut -d'|' -f4)
    EXTRA=$(echo "$parsed" | cut -d'|' -f5)
    ETIME=$(echo "$parsed" | cut -d'|' -f6)

    # Skip announce events — they're just cron wrappers
    [ "$AGENT" = "announce" ] && continue

    # All non-announce gateway runs are Alfred (Sonnet orchestration).
    # Roberto/Andrés status comes from the API route's getRealtimeStatus.
    # Roberto/Andrés costs come from the reconciliation script.

    case "$EVENT" in
      START)
        ALFRED_STATUS="working"
        ALFRED_LAST_MODEL="${EXTRA:-claude-sonnet-4-5}"
        ALFRED_LAST_DESC="Procesando mensaje"
        ALFRED_LAST_ACTIVITY="${ETIME:-$(date -u '+%Y-%m-%dT%H:%M:%SZ')}"
        write_status
        ;;

      TOOL)
        tool_name="$EXTRA"
        if [ -n "$tool_name" ]; then
          ALFRED_LAST_DESC="Usando: $tool_name"
          write_status
        fi
        ;;

      DONE)
        # All gateway session costs are Alfred's (Sonnet)
        cost_data=$(extract_session_cost "$SESSIONS_DIR_MAIN" "$SESSIONID")
        cost_val=$(echo "$cost_data" | cut -d'|' -f1)
        model_val=$(echo "$cost_data" | cut -d'|' -f2)

        if [ -n "$cost_val" ] && [ "$cost_val" != "" ] && [ "$cost_val" != "0" ]; then
          ALFRED_LAST_COST="$cost_val"
          ALFRED_LAST_MODEL="${model_val:-$ALFRED_LAST_MODEL}"
          LEDGER_alfred_totalAll=$(python3 -c "print(round($LEDGER_alfred_totalAll + $cost_val, 8))" 2>/dev/null || echo "$LEDGER_alfred_totalAll")
          LEDGER_alfred_totalMonth=$(python3 -c "print(round($LEDGER_alfred_totalMonth + $cost_val, 8))" 2>/dev/null || echo "$LEDGER_alfred_totalMonth")
          LEDGER_alfred_totalToday=$(python3 -c "print(round($LEDGER_alfred_totalToday + $cost_val, 8))" 2>/dev/null || echo "$LEDGER_alfred_totalToday")
          LEDGER_alfred_interactions=$((LEDGER_alfred_interactions + 1))
          save_ledger
        fi

        # Roberto/Andrés costs are tracked by cost-reconcile.sh (their session
        # files get deleted too fast for real-time tracking)

        ALFRED_STATUS="idle"
        ALFRED_LAST_DESC="Tarea completada"
        ALFRED_LAST_ACTIVITY="${ETIME:-$(date -u '+%Y-%m-%dT%H:%M:%SZ')}"
        write_status
        ;;
    esac
  done

  sleep 2
done
