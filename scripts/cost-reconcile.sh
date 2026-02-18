#!/bin/bash
# cost-reconcile.sh
# Scans all OpenClaw session files and produces accurate cost data.
# Updates cost-ledger.json with real costs grouped by agent and date.
# Also writes cost-history.json with daily breakdown for trend charts.
#
# Uses per-entry timestamps (not file mtime) for accurate daily attribution.
#
# Usage: cost-reconcile.sh [--dry-run]

LEDGER_FILE="/Users/alfredpifi/clawd/cost-ledger.json"
HISTORY_FILE="/Users/alfredpifi/clawd/cost-history.json"

DRY_RUN=""
[ "$1" = "--dry-run" ] && DRY_RUN="1"

export DRY_RUN

python3 << 'PYEOF'
import json, os, glob
from datetime import datetime, date

SESSIONS_DIRS = {
    "alfred": "/Users/alfredpifi/.openclaw/agents/main/sessions",
    "roberto": "/Users/alfredpifi/.openclaw/agents/roberto/sessions",
    "andres": "/Users/alfredpifi/.openclaw/agents/andres/sessions",
}

LEDGER_FILE = "/Users/alfredpifi/clawd/cost-ledger.json"
HISTORY_FILE = "/Users/alfredpifi/clawd/cost-history.json"
DRY_RUN = os.environ.get("DRY_RUN", "")

# Collect costs: { agent: { date_str: { cost: float, interactions: int } } }
agent_daily = {"alfred": {}, "roberto": {}, "andres": {}}

def process_session_file(filepath, agent):
    """Extract cost data from a session JSONL file, using per-entry timestamps."""
    try:
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    msg = obj.get('message', {})
                    if msg.get('role') == 'assistant' and msg.get('usage', {}).get('cost'):
                        c = msg['usage']['cost']
                        cost = c.get('total', 0)
                        if cost <= 0:
                            continue

                        # Get date from entry timestamp (preferred) or file mtime (fallback)
                        ts = obj.get('timestamp', '')
                        if ts and len(ts) >= 10:
                            entry_date = ts[:10]  # "2026-02-16T..." -> "2026-02-16"
                        else:
                            # Fallback to file mtime
                            stat = os.stat(filepath)
                            entry_date = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d")

                        if entry_date not in agent_daily[agent]:
                            agent_daily[agent][entry_date] = {"cost": 0, "interactions": 0}
                        agent_daily[agent][entry_date]["cost"] += cost
                        agent_daily[agent][entry_date]["interactions"] += 1
                except:
                    continue
    except:
        return

# Process all session files (active + deleted)
for agent, sessions_dir in SESSIONS_DIRS.items():
    if not os.path.isdir(sessions_dir):
        continue

    # Active sessions (.jsonl)
    for f in glob.glob(os.path.join(sessions_dir, "*.jsonl")):
        process_session_file(f, agent)

    # Deleted sessions (.jsonl.deleted.*)
    for f in glob.glob(os.path.join(sessions_dir, "*.jsonl.deleted.*")):
        process_session_file(f, agent)

# Calculate totals
today = date.today().strftime("%Y-%m-%d")
this_month = date.today().strftime("%Y-%m")

print("=" * 60)
print("COST RECONCILIATION REPORT")
print("=" * 60)

ledger = {}
history = {"daily": {}, "generated_at": datetime.now().isoformat()}

total_all_agents = 0

for agent in ["alfred", "roberto", "andres"]:
    total_all = 0
    total_month = 0
    total_today = 0
    total_interactions = 0

    for d, data in sorted(agent_daily[agent].items()):
        total_all += data["cost"]
        total_interactions += data["interactions"]
        if d.startswith(this_month):
            total_month += data["cost"]
        if d == today:
            total_today += data["cost"]

        # Add to daily history
        if d not in history["daily"]:
            history["daily"][d] = {"alfred": 0, "roberto": 0, "andres": 0}
        history["daily"][d][agent] = round(data["cost"], 6)

    total_all_agents += total_all

    ledger[agent] = {
        "totalAll": round(total_all, 6),
        "totalMonth": round(total_month, 6),
        "totalToday": round(total_today, 6),
        "interactions": total_interactions,
        "date": today,
        "month": this_month,
    }

    print(f"\n{agent.upper()}:")
    print(f"  Total all-time:  ${total_all:.6f}")
    print(f"  Total this month: ${total_month:.6f}")
    print(f"  Total today:     ${total_today:.6f}")
    print(f"  Interactions:    {total_interactions}")

    # Show daily breakdown
    days = sorted(agent_daily[agent].items())
    if days:
        print(f"  Daily breakdown:")
        for d, data in days[-10:]:  # Last 10 days
            print(f"    {d}: ${data['cost']:.4f} ({data['interactions']} interactions)")

print(f"\n{'=' * 60}")
print(f"TOTAL ALL AGENTS: ${total_all_agents:.6f}")
print(f"{'=' * 60}")

# Sort daily history
history["daily"] = dict(sorted(history["daily"].items()))

if DRY_RUN:
    print("\n[DRY RUN] Would write to:")
    print(f"  {LEDGER_FILE}")
    print(f"  {HISTORY_FILE}")
else:
    with open(LEDGER_FILE + ".tmp", "w") as f:
        json.dump(ledger, f, indent=2)
    os.rename(LEDGER_FILE + ".tmp", LEDGER_FILE)

    with open(HISTORY_FILE + ".tmp", "w") as f:
        json.dump(history, f, indent=2)
    os.rename(HISTORY_FILE + ".tmp", HISTORY_FILE)

    print(f"\nWritten to {LEDGER_FILE} and {HISTORY_FILE}")

PYEOF
