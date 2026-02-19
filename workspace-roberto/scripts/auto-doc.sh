#!/bin/bash
# auto-doc.sh — Crear documentos automaticos para tareas completadas sin doc
# Ejecutado via LaunchAgent cada 15 min, independiente de Roberto/gateway
set -uo pipefail

ENV_FILE="$HOME/clawd/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: No se encuentra $ENV_FILE" >&2
  exit 1
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_ANON=$(grep '^SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_SERVICE=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON" ]]; then
  echo "ERROR: SUPABASE_URL o SUPABASE_ANON_KEY no encontrados" >&2
  exit 1
fi

# Usar service_role key para bypasear RLS (INSERT en agent_docs)
# Fallback a anon key si no hay service_role
WRITE_KEY="${SUPABASE_SERVICE:-$SUPABASE_ANON}"

API="$SUPABASE_URL/rest/v1"
AUTH_READ=(-H "Authorization: Bearer $SUPABASE_ANON" -H "apikey: $SUPABASE_ANON" -H "Content-Type: application/json")
AUTH_WRITE=(-H "Authorization: Bearer $WRITE_KEY" -H "apikey: $WRITE_KEY" -H "Content-Type: application/json")

# Buscar tareas completadas de tipos que requieren doc
TASKS=$(curl -s "$API/agent_tasks?status=eq.completada&task_type=in.(research,news_scan,report,youtube_analysis)&select=id,title,task_type,result" "${AUTH_READ[@]}")

if [[ -z "$TASKS" || "$TASKS" == "[]" ]]; then
  exit 0
fi

CREATED=0
TASK_COUNT=$(echo "$TASKS" | jq 'length')

for i in $(seq 0 $((TASK_COUNT - 1))); do
  task=$(echo "$TASKS" | jq -c ".[$i]")
  TASK_ID=$(echo "$task" | jq -r '.id')
  TITLE=$(echo "$task" | jq -r '.title // "Sin titulo"')
  TASK_TYPE=$(echo "$task" | jq -r '.task_type')
  # Limpiar variables entre iteraciones para evitar contaminacion
  HIGHLIGHTS=""
  FILE_PATH=""
  SUMMARY=""

  # Verificar si ya tiene doc (agent_docs requiere service_role por RLS)
  EXISTING=$(curl -s "$API/agent_docs?task_id=eq.$TASK_ID&select=id" "${AUTH_WRITE[@]}")
  DOC_COUNT=$(echo "$EXISTING" | jq 'length' 2>/dev/null || echo "0")
  if [[ "$DOC_COUNT" != "0" ]]; then
    continue
  fi

  # Extraer datos del result
  RESULT=$(echo "$task" | jq -r '.result // empty')
  if [[ -z "$RESULT" || "$RESULT" == "null" ]]; then
    echo "SKIP: '$TITLE' — sin result" >&2
    continue
  fi

  # Roberto puede usar nombres variables para los campos — buscar todas las variantes
  SUMMARY=$(echo "$task" | jq -r '.result.summary // .result.resumen // .result.conclusion // .result.conclusiones // "Sin resumen disponible"')
  HIGHLIGHTS=$(echo "$task" | jq -r '(.result.highlights // .result.hallazgos_clave // .result.hallazgos // .result.top_skills // [])[]' 2>/dev/null || true)
  FILE_PATH=$(echo "$task" | jq -r '.result.file_path // .result.archivo // empty')
  NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Construir markdown
  MD="# $TITLE"
  MD="$MD

## Resumen
$SUMMARY

## Hallazgos principales"

  if [[ -n "$HIGHLIGHTS" ]]; then
    while IFS= read -r h; do
      [[ -n "$h" ]] && MD="$MD
- $h"
    done <<< "$HIGHLIGHTS"
  else
    MD="$MD
- Sin hallazgos especificos registrados"
  fi

  # Incluir datos del archivo si existe
  if [[ -n "$FILE_PATH" ]]; then
    FULL_PATH="$HOME/clawd/workspace-roberto/$FILE_PATH"
    if [[ -f "$FULL_PATH" ]]; then
      RAW=$(head -c 4000 "$FULL_PATH")
      MD="$MD

## Datos
\`\`\`
Archivo: $FILE_PATH
\`\`\`

\`\`\`json
$RAW
\`\`\`"
    fi
  fi

  # ENRICHMENT: Si el doc es corto (<400 palabras), usar Ollama local para generar doc profesional
  # Roberto escribe docs de 1000+ palabras cuando lo hace bien → pasan el umbral
  # auto-doc.sh basico genera ~260 palabras de JSON crudo → se enriquece con Ollama
  CURRENT_WORDS=$(echo "$MD" | wc -w | tr -d ' ')
  if [[ "$CURRENT_WORDS" -lt 400 ]]; then
    echo "  Doc basico muy corto ($CURRENT_WORDS palabras), intentando enrichment con Ollama..."
    RESULT_JSON=$(echo "$task" | jq -c '.result')

    # Prompt contextualizado para el departamento de marketing de VertexAura
    ENRICHMENT_PROMPT="Eres un analista de investigacion del departamento de marketing de VertexAura.

Tu trabajo es transformar datos de investigacion en bruto (formato JSON) en un documento de investigacion profesional, estructurado y detallado en formato Markdown.

CONTEXTO: Este documento formara parte de la base de conocimiento del departamento de marketing de VertexAura. Sera compartido con otros miembros del equipo y sera usado para:
1. Informar decisiones estrategicas del equipo de marketing
2. Compartir con otros miembros del equipo que lo emplearan para generar y gestionar contenido de VertexAura
3. Alimentar a otros agentes de IA (Alfred, Roberto y futuros agentes) que trabajan en el ecosistema
4. Servir como referencia tecnica y de mercado para el equipo completo

INSTRUCCIONES:
- Extrae TODA la informacion del JSON sin omitir datos
- Organiza la informacion de forma logica y profesional
- Incluye tablas cuando haya datos comparativos (rankings, precios, features)
- Cita fuentes especificas con URLs cuando esten disponibles
- Anade contexto y analisis: que significan los datos, tendencias, oportunidades
- Incluye una seccion de Implicaciones para VertexAura al final
- Minimo 500 palabras, sin limite superior — mas detalle es mejor
- Escribe en espanol

ESTRUCTURA RECOMENDADA:
# [Titulo]
## Resumen ejecutivo
## Fuentes consultadas
## Hallazgos principales
### [Seccion por tema]
## Analisis y tendencias
## Implicaciones para VertexAura
## Datos completos

TITULO DE LA INVESTIGACION: $TITLE

DATOS DE INVESTIGACION (JSON):"

    # Construir el payload JSON para Ollama
    OLLAMA_PAYLOAD=$(python3 -c "
import json, sys
prompt = sys.argv[1]
result = sys.argv[2]
full_content = prompt + '\n' + result
payload = {
    'model': 'qwen3:30b',
    'messages': [{'role': 'user', 'content': full_content}],
    'temperature': 0.3,
    'max_tokens': 4096
}
print(json.dumps(payload))
" "$ENRICHMENT_PROMPT" "$RESULT_JSON")

    OLLAMA_RESPONSE=$(curl -s --max-time 300 http://localhost:11434/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d "$OLLAMA_PAYLOAD" 2>/dev/null)

    ENRICHED=$(echo "$OLLAMA_RESPONSE" | jq -r '.choices[0].message.content // empty' 2>/dev/null)
    ENRICHED_WORDS=$(echo "$ENRICHED" | wc -w | tr -d ' ')

    if [[ -n "$ENRICHED" && "$ENRICHED_WORDS" -gt 100 ]]; then
      MD="$ENRICHED"
      echo "  -> Enriquecido con Ollama qwen3:30b ($ENRICHED_WORDS palabras)"
    else
      echo "  -> Ollama no disponible o respuesta corta ($ENRICHED_WORDS palabras), usando fallback JSON" >&2
      # Fallback: volcar JSON completo como ultimo recurso
      RESULT_PRETTY=$(echo "$task" | jq '.result' 2>/dev/null || echo "$RESULT")
      MD="$MD

## Datos completos del resultado
\`\`\`json
$RESULT_PRETTY
\`\`\`"
    fi
  fi

  MD="$MD

---
*Generado por auto-doc.sh — VertexAura Marketing Dept.*
*Fecha: $NOW*"

  DOC_TYPE="research"
  [[ "$TASK_TYPE" == "report" ]] && DOC_TYPE="report"

  # Escapar para JSON
  WORD_COUNT=$(echo "$MD" | wc -w | tr -d ' ')
  CONTENT_JSON=$(printf '%s' "$MD" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')
  TITLE_JSON=$(printf '%s' "$TITLE" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API/agent_docs" "${AUTH_WRITE[@]}" \
    -H "Prefer: return=representation" \
    -d "{
      \"title\": $TITLE_JSON,
      \"content\": $CONTENT_JSON,
      \"author\": \"Roberto\",
      \"doc_type\": \"$DOC_TYPE\",
      \"tags\": [\"$TASK_TYPE\", \"auto\"],
      \"task_id\": \"$TASK_ID\",
      \"word_count\": $WORD_COUNT
    }")

  HTTP=$(echo "$RESPONSE" | tail -1)
  if [[ "$HTTP" == "201" ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') OK: Doc creado para '$TITLE' ($WORD_COUNT palabras)"
    CREATED=$((CREATED + 1))
  else
    BODY=$(echo "$RESPONSE" | sed '$d')
    echo "$(date '+%Y-%m-%d %H:%M:%S') WARN: Fallo doc para '$TITLE' (HTTP $HTTP): $BODY" >&2
  fi
done

echo "$(date '+%Y-%m-%d %H:%M:%S') auto-doc.sh completado. Docs creados: $CREATED"
