#!/bin/bash

# AUTO-REMEDIATION - SERVICIOS CAÍDOS
# Reinicia servicios críticos si están down

LOG_FILE="/tmp/auto-remediation.log"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🤖 Auto-remediation: Verificando servicios..."

# Array de servicios a verificar
declare -A SERVICES=(
  ["openclaw-gateway"]="openclaw-gateway"
  ["redis"]="redis-server"
)

FIXED=0
FAILED=0

for SERVICE in "${!SERVICES[@]}"; do
  PATTERN="${SERVICES[$SERVICE]}"
  
  # Verificar si está running
  if pgrep -f "$PATTERN" > /dev/null; then
    log "✅ $SERVICE: RUNNING"
  else
    log "🔴 $SERVICE: DOWN - Intentando reiniciar..."
    
    case "$SERVICE" in
      "openclaw-gateway")
        openclaw gateway restart >> "$LOG_FILE" 2>&1
        sleep 2
        if pgrep -f "$PATTERN" > /dev/null; then
          log "✅ $SERVICE: REINICIADO"
          FIXED=$((FIXED + 1))
        else
          log "❌ $SERVICE: FALLO AL REINICIAR"
          FAILED=$((FAILED + 1))
        fi
        ;;
      "redis")
        redis-server --daemonize yes >> "$LOG_FILE" 2>&1
        sleep 1
        if pgrep -f "$PATTERN" > /dev/null; then
          log "✅ $SERVICE: REINICIADO"
          FIXED=$((FIXED + 1))
        else
          log "❌ $SERVICE: FALLO AL REINICIAR"
          FAILED=$((FAILED + 1))
        fi
        ;;
    esac
  fi
done

log ""
log "📊 Resumen: $FIXED reiniciados, $FAILED fallidos"

# Si hay fallos, notificar
if [ $FAILED -gt 0 ]; then
  log "🚨 ALERTA: Servicios no recuperados"
fi
