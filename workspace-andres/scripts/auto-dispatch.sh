#!/bin/bash
# auto-dispatch.sh — Crea tareas de análisis para Andrés cuando Roberto completa investigaciones
# + Registra comunicación entre agentes (Roberto → @Andrés handoff)
#
# Se ejecuta desde el cron de Andrés ANTES de tasks.sh fetch
# Solo crea tareas si:
#   1. Roberto tiene una tarea completada en los últimos 7 días
#   2. Esa tarea tiene un doc asociado en agent_docs
#   3. NO existe ya una tarea de Andrés referenciando ese doc/tarea

set -euo pipefail

ENV_FILE="$HOME/clawd/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo '{"dispatched":0,"reason":"no env file"}'
  exit 0
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_KEY=$(grep '^SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_SERVICE=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
  echo '{"dispatched":0,"reason":"missing credentials"}'
  exit 0
fi

API="$SUPABASE_URL/rest/v1"

# Export for Python subprocess
export API SUPABASE_KEY SUPABASE_SERVICE

# 1. Get Roberto's completed tasks from last 7 days
SEVEN_DAYS_AGO=$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ)

ROBERTO_TASKS=$(curl -s "${API}/agent_tasks?assigned_to=eq.roberto&status=eq.completada&completed_at=gte.${SEVEN_DAYS_AGO}&select=id,title,task_type" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

TASK_COUNT=$(echo "$ROBERTO_TASKS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

if [[ "$TASK_COUNT" == "0" ]]; then
  echo '{"dispatched":0,"reason":"no completed Roberto tasks in last 7 days"}'
  exit 0
fi

# 2. For each completed Roberto task, check doc + create Andrés task + log handoff
echo "$ROBERTO_TASKS" | python3 -c "
import sys, json, subprocess, os, re

tasks = json.load(sys.stdin)
api = os.environ['API']
key = os.environ['SUPABASE_KEY']
svc = os.environ['SUPABASE_SERVICE']

dispatched = 0
skipped = 0

def curl_get(url, auth_key):
    r = subprocess.run(
        ['curl', '-s', url, '-H', f'apikey: {auth_key}', '-H', f'Authorization: Bearer {auth_key}'],
        capture_output=True, text=True
    )
    return json.loads(r.stdout) if r.stdout.strip() else []

def curl_post(url, data, auth_key):
    r = subprocess.run(
        ['curl', '-s', '-X', 'POST', url,
         '-H', f'apikey: {auth_key}', '-H', f'Authorization: Bearer {auth_key}',
         '-H', 'Content-Type: application/json', '-H', 'Prefer: return=representation',
         '-d', json.dumps(data)],
        capture_output=True, text=True
    )
    return json.loads(r.stdout) if r.stdout.strip() else None

def check_no_andres_flag(task_data):
    \"\"\"Check if task has explicit NO_ANDRES flag in brief or description\"\"\"
    brief = task_data.get('brief', {})
    description = task_data.get('description') or ''  # Handle None from DB
    
    # Patterns to detect NO_ANDRES instructions
    no_andres_patterns = [
        r'NO.*Andr[ée]s',
        r'[sS][oó]lo.*Roberto',
        r'Andr[ée]s.*NO.*debe',
        r'NO.*procesar.*Andr[ée]s',
        r'NO.*crear.*tarea.*Andr[ée]s',
        r'MUY_IMPORTANTE.*NO',
        r'[sS][oó]lo para Roberto',
        r'[sS][oó]lo para Santi'
    ]
    
    # Check brief (if dict or string)
    if brief and isinstance(brief, dict):
        brief_str = json.dumps(brief)
        for pattern in no_andres_patterns:
            if re.search(pattern, brief_str, re.IGNORECASE):
                return True
    
    # Check description (only if not empty)
    if description:
        for pattern in no_andres_patterns:
            if re.search(pattern, description, re.IGNORECASE):
                return True
    
    return False

for task in tasks:
    task_id = task['id']
    task_title = task['title']
    task_type = task.get('task_type', '')

    # Skip non-research task types
    if task_type not in ('youtube_analysis', 'youtube', 'news_scan', 'news',
                          'research', 'twitter_scan', 'twitter',
                          'reddit_scan', 'hackernews_scan', 'report'):
        continue
    
    # === CHECK NO_ANDRES FLAG ===
    # Get full task data to check brief/description
    full_task = curl_get(f'{api}/agent_tasks?id=eq.{task_id}&select=id,title,brief,description', key)
    if full_task and check_no_andres_flag(full_task[0]):
        print(f'SKIPPED (NO_ANDRES flag): {task_title}', file=sys.stderr)
        skipped += 1
        continue

    # Check if doc exists for this task (service key for agent_docs RLS)
    docs = curl_get(f'{api}/agent_docs?task_id=eq.{task_id}&select=id,title,word_count', svc)
    if not docs:
        continue

    doc = docs[0]
    doc_id = doc['id']

    # Check if Andrés already has a task for this source
    andres_tasks = curl_get(f'{api}/agent_tasks?assigned_to=eq.andres&select=id,brief', key)
    already_exists = False
    for at in (andres_tasks or []):
        brief = at.get('brief')
        if isinstance(brief, dict):
            if brief.get('source_doc_id') == doc_id or brief.get('source_task_id') == task_id:
                already_exists = True
                break

    if already_exists:
        continue

    # === CREATE ANDRÉS TASK ===
    new_task = curl_post(f'{api}/agent_tasks', {
        'title': f'Análisis content intelligence: {task_title}',
        'assigned_to': 'andres',
        'created_by': 'Alfred',
        'task_type': 'content_analysis',
        'status': 'pendiente',
        'priority': 'media',
        'description': f'Analizar el documento de Roberto: \"{task_title}\". Análisis de 5 capas completo.',
        'brief': {'source_doc_id': doc_id, 'source_task_id': task_id}
    }, key)

    if not new_task:
        continue

    new_id = new_task[0]['id'] if isinstance(new_task, list) else new_task.get('id', '')
    if not new_id:
        continue

    # === LOG HANDOFF: Roberto → @Andrés ===
    curl_post(f'{api}/agent_activity', {
        'agent_id': 'Roberto',
        'action': 'task_handoff',
        'task_id': new_id,
        'details': {
            'message': f'@Andrés, ya he terminado mi investigación sobre \"{task_title}\". Los datos están listos, te toca analizarlos.',
            'source_task_id': task_id,
            'source_doc_id': doc_id
        }
    }, key)

    # === LOG: Alfred delegates ===
    curl_post(f'{api}/agent_activity', {
        'agent_id': 'Alfred',
        'action': 'task_reviewed',
        'task_id': new_id,
        'details': {
            'message': f'@Andrés, nueva tarea de análisis. @Roberto ha completado la investigación, aplica las 5 capas.'
        }
    }, key)

    dispatched += 1
    print(f'DISPATCHED: {new_id} <- {task_title}', file=sys.stderr)

print(json.dumps({'dispatched': dispatched, 'skipped': skipped}))
" 2>&1