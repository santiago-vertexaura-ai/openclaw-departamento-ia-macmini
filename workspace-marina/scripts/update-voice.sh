#!/bin/bash
# update-voice.sh — Adds approved draft content to voice_examples.json
# Called when Santi approves a draft in the dashboard

VOICE_FILE="/Users/alfredpifi/clawd/workspace-marina/knowledge/voice_examples.json"
DRAFT_CONTENT="${1:?Usage: update-voice.sh '<approved content text>'}"
PLATFORM="${2:-general}"

# Ensure file exists
if [ ! -f "$VOICE_FILE" ]; then
  echo '{"examples":[]}' > "$VOICE_FILE"
fi

# Add new example
python3 -c "
import json, sys
from datetime import datetime

voice_file = '$VOICE_FILE'
content = sys.stdin.read().strip()
platform = '$PLATFORM'

try:
    with open(voice_file, 'r') as f:
        data = json.load(f)
except:
    data = {'examples': []}

if 'examples' not in data:
    data['examples'] = []

# Keep max 50 examples (FIFO)
data['examples'].append({
    'content': content,
    'platform': platform,
    'approved_at': datetime.now().isoformat(),
    'source': 'santi_approved'
})

if len(data['examples']) > 50:
    data['examples'] = data['examples'][-50:]

with open(voice_file, 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(json.dumps({'status': 'added', 'total_examples': len(data['examples'])}))
" <<< "$DRAFT_CONTENT"
