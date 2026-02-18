#!/bin/bash

# SECURITY AUDIT 8H WRAPPER - Previene ejecuciones duplicadas
# Lock mechanism para asegurar SOLO 1 ejecución cada 8h

LOCK_FILE="/tmp/security-audit-8h.lock"
LOCK_TIMEOUT=28800  # 8 horas en segundos

# ============================================================
# VERIFICAR SI LOCK EXISTE Y AÚN ES VÁLIDO
# ============================================================
if [ -f "$LOCK_FILE" ]; then
  LOCK_TIME=$(cat "$LOCK_FILE")
  CURRENT_TIME=$(date +%s)
  TIME_DIFF=$((CURRENT_TIME - LOCK_TIME))
  
  if [ $TIME_DIFF -lt $LOCK_TIMEOUT ]; then
    # Lock aún válido - NO ejecutar
    echo "$(date): ⏭️ SKIP - Audit ya corrió hace $(($TIME_DIFF / 60)) minutos (timeout: $((LOCK_TIMEOUT / 60)) min)"
    exit 0
  else
    # Lock expirado - continuar
    echo "$(date): 🔓 Lock expired, proceeding with audit"
    rm -f "$LOCK_FILE"
  fi
fi

# ============================================================
# CREAR LOCK
# ============================================================
echo "$(date +%s)" > "$LOCK_FILE"
echo "$(date): 🔒 LOCK created - audit starting"

# ============================================================
# EJECUTAR AUDITORÍA
# ============================================================
bash /Users/alfredpifi/clawd/scripts/security-audit-8h-cycle.sh

AUDIT_RESULT=$?

# ============================================================
# ACTUALIZAR LOCK CON TIEMPO ACTUAL
# ============================================================
echo "$(date +%s)" > "$LOCK_FILE"

if [ $AUDIT_RESULT -eq 0 ]; then
  echo "$(date): ✅ Audit completed successfully. Next audit in 8h"
else
  echo "$(date): ❌ Audit failed with code $AUDIT_RESULT"
  exit $AUDIT_RESULT
fi
