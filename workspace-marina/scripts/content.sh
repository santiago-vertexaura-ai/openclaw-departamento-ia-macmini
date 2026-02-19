#!/bin/bash
# content.sh — Fetch context for Marina's content creation
# Uso: ./scripts/content.sh <comando> [args...]
#
# Comandos:
#   fetch-analysis <doc_id>          Obtener análisis de Andrés por doc_id
#   fetch-analysis-recent [limit]    Últimos análisis de Andrés
#   fetch-draft <doc_id>             Obtener draft original para revision
#   fetch-formulas [limit]           Fórmulas del vault (tier A/B preferidas)
#   fetch-voice                      Voice examples de Santi
#   fetch-platforms                  Platform constraints

set -euo pipefail

ENV_FILE="$HOME/clawd/.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: No se encuentra $ENV_FILE" >&2
  exit 1
fi

SUPABASE_URL=$(grep '^SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
SUPABASE_SERVICE=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$ENV_FILE" | cut -d= -f2-)

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE" ]]; then
  echo "ERROR: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no encontrados en $ENV_FILE" >&2
  exit 1
fi

API="$SUPABASE_URL/rest/v1"
AUTH_HEADERS=(
  -H "Authorization: Bearer $SUPABASE_SERVICE"
  -H "apikey: $SUPABASE_SERVICE"
  -H "Content-Type: application/json"
)

WORKSPACE="$HOME/clawd/workspace-marina"
VAULT="$HOME/clawd/vault"
VAULT_SCRIPT="$HOME/clawd/scripts/vault.sh"

# Truncar contenido largo para caber en contexto del modelo
MAX_CONTENT_CHARS=12000
truncate_content() {
  jq --arg max "$MAX_CONTENT_CHARS" '
    if type == "array" then
      map(
        if (.content | length) > ($max | tonumber) then
          .content = (.content[:($max | tonumber)] + "\n\n[... TRUNCADO a " + $max + " chars ...]")
        else . end
      )
    else . end
  '
}

CMD="${1:-help}"

case "$CMD" in

  fetch-source)
    # Obtener cualquier doc (research de Roberto O analysis de Andrés) por doc_id
    DOC_ID="${2:?ERROR: Falta doc_id. Uso: ./scripts/content.sh fetch-source <doc_id>}"

    RESULT=$(curl -s "$API/agent_docs?id=eq.$DOC_ID&select=id,title,content,tags,author,doc_type,word_count,created_at" \
      "${AUTH_HEADERS[@]}" | truncate_content)

    DOC_TYPE=$(echo "$RESULT" | jq -r '.[0].doc_type // "unknown"' 2>/dev/null)
    case "$DOC_TYPE" in
      research) echo "NOTA: Investigacion directa de Roberto. Datos puros sin procesar." ;;
      analysis) echo "NOTA: Analisis procesado de Andres. Incluye formulas y patrones." ;;
      report) echo "NOTA: Informe estructurado. Contiene conclusiones y recomendaciones." ;;
      *) echo "NOTA: Documento tipo '$DOC_TYPE'." ;;
    esac
    echo "$RESULT"
    ;;

  fetch-analysis)
    # Obtener análisis específico de Andrés por doc_id (alias de fetch-source)
    DOC_ID="${2:?ERROR: Falta doc_id. Uso: ./scripts/content.sh fetch-analysis <doc_id>}"

    curl -s "$API/agent_docs?id=eq.$DOC_ID&select=id,title,content,tags,author,doc_type,word_count,created_at" \
      "${AUTH_HEADERS[@]}" | truncate_content
    ;;

  fetch-analysis-recent)
    # Últimos análisis de Andrés (para cuando no hay source_doc_id)
    LIMIT="${2:-5}"
    SEVEN_DAYS=$(date -v-7d -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -d "-7 days" -u +"%Y-%m-%dT%H:%M:%SZ")

    curl -s "$API/agent_docs?author=ilike.Andr%C3%A9s&doc_type=eq.analysis&created_at=gte.$SEVEN_DAYS&order=created_at.desc&limit=$LIMIT&select=id,title,content,tags,word_count,created_at" \
      "${AUTH_HEADERS[@]}" | truncate_content
    ;;

  fetch-draft)
    # Obtener draft original para revision (cuando Santi pide cambios)
    DOC_ID="${2:?ERROR: Falta doc_id. Uso: ./scripts/content.sh fetch-draft <doc_id>}"

    curl -s "$API/agent_docs?id=eq.$DOC_ID&select=id,title,content,tags,author,doc_type,word_count,review_status,review_feedback,comments,created_at" \
      "${AUTH_HEADERS[@]}" | truncate_content
    ;;

  fetch-formulas)
    # Buscar fórmulas del vault
    LIMIT="${2:-10}"

    if [[ -x "$VAULT_SCRIPT" ]]; then
      # Search vault for formula entries
      "$VAULT_SCRIPT" search "formula" 2>/dev/null | head -n "$LIMIT"
    fi

    # Also check formula_bank.json from Andrés if it exists
    FORMULA_BANK="$HOME/clawd/workspace-andres/knowledge/formula_bank.json"
    if [[ -f "$FORMULA_BANK" ]]; then
      echo "---FORMULA_BANK---"
      cat "$FORMULA_BANK"
    fi

    # Check vault formulas directory
    if [[ -d "$VAULT/formulas" ]]; then
      echo "---VAULT_FORMULAS---"
      for f in "$VAULT/formulas"/*.md; do
        [[ -f "$f" ]] || continue
        echo "=== $(basename "$f" .md) ==="
        cat "$f"
        echo ""
      done
    fi
    ;;

  fetch-voice)
    # Voice examples de Santi
    VOICE_FILE="$WORKSPACE/knowledge/voice_examples.json"
    if [[ -f "$VOICE_FILE" ]] && [[ -s "$VOICE_FILE" ]]; then
      cat "$VOICE_FILE"
    else
      echo '{"status":"empty","message":"No voice examples yet. Santi will provide via Telegram/Chat."}'
    fi
    ;;

  fetch-platforms)
    # Platform constraints
    PLATFORMS_FILE="$WORKSPACE/config/platforms.json"
    if [[ -f "$PLATFORMS_FILE" ]]; then
      cat "$PLATFORMS_FILE"
    else
      echo '{"error":"platforms.json not found"}'
    fi
    ;;

  fetch-all)
    # Fetch everything Marina needs for a task (convenience command)
    DOC_ID="${2:-}"

    echo '{"context":{'

    # 1. Analysis
    echo '"analysis":'
    if [[ -n "$DOC_ID" ]]; then
      curl -s "$API/agent_docs?id=eq.$DOC_ID&select=id,title,content,tags,word_count" \
        "${AUTH_HEADERS[@]}" | truncate_content
    else
      echo '[]'
    fi

    # 2. Voice
    echo ',"voice":'
    VOICE_FILE="$WORKSPACE/knowledge/voice_examples.json"
    if [[ -f "$VOICE_FILE" ]] && [[ -s "$VOICE_FILE" ]]; then
      cat "$VOICE_FILE"
    else
      echo '{}'
    fi

    # 3. Platforms
    echo ',"platforms":'
    PLATFORMS_FILE="$WORKSPACE/config/platforms.json"
    if [[ -f "$PLATFORMS_FILE" ]]; then
      cat "$PLATFORMS_FILE"
    else
      echo '{}'
    fi

    echo '}}'
    ;;

  *)
    echo "content.sh — Fetch context for Marina's content creation"
    echo ""
    echo "Uso: ./scripts/content.sh <comando> [args...]"
    echo ""
    echo "Comandos:"
    echo "  fetch-source <doc_id>            Obtener cualquier doc (research/analysis/report)"
    echo "  fetch-analysis <doc_id>          Obtener análisis de Andrés por doc_id"
    echo "  fetch-analysis-recent [limit]    Últimos análisis de Andrés (7 días)"
    echo "  fetch-draft <doc_id>             Obtener draft original para revision"
    echo "  fetch-formulas [limit]           Fórmulas del vault + formula_bank"
    echo "  fetch-voice                      Voice examples de Santi"
    echo "  fetch-platforms                  Platform constraints (LinkedIn, Twitter, IG)"
    echo "  fetch-all [doc_id]               Todo el contexto combinado"
    ;;

esac
