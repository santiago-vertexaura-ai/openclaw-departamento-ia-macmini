#!/bin/bash

# VALIDATE KANBAN ↔ SUPABASE CONSISTENCY
# Asegura que TODAS las tareas en kanban están en Supabase con valores correctos
# Ejecutar: bash scripts/validate-kanban-supabase-sync.sh

set -e

source .env.local 2>/dev/null || { echo "❌ .env.local no encontrado"; exit 1; }

AGENTS=("alfred" "roberto" "andres" "marina" "arturo" "alex")
ERRORS=0

echo "🔍 VALIDANDO CONSISTENCY Kanban ↔ Supabase..."
echo ""

for AGENT in "${AGENTS[@]}"; do
  echo "📋 Agente: $AGENT"
  
  # Buscar tareas CON MAYÚSCULA (bug)
  UPPERCASE=$(curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.${AGENT^}&status=neq.cancelada" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "apikey: $SUPABASE_ANON_KEY" 2>/dev/null | jq -r '.[] | .id' 2>/dev/null || echo "")
  
  if [ ! -z "$UPPERCASE" ]; then
    echo "  ⚠️  Encontradas tareas CON MAYÚSCULA:"
    for TASK_ID in $UPPERCASE; do
      echo "    - Corrigiendo: $TASK_ID"
      
      # Corregir a minúsculas
      curl -s -X PATCH "$SUPABASE_URL/rest/v1/agent_tasks?id=eq.$TASK_ID" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "apikey: $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"assigned_to\": \"$AGENT\"}" 2>/dev/null
      
      ERRORS=$((ERRORS + 1))
    done
  else
    echo "  ✅ OK (todos en minúsculas)"
  fi
done

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "⚠️  $ERRORS tareas corregidas"
  exit 1
else
  echo "✅ CONSISTENCY OK - Kanban ↔ Supabase sincronizados"
  exit 0
fi
