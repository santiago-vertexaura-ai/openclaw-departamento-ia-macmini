#!/bin/bash

# AUDIT TO VAULT - Almacenar auditorías automáticamente en vault
# Ejecutado después de cada auditoría (cada 8h)

AUDIT_DIR="/tmp/security-audits"
VAULT_DIR="/Users/alfredpifi/clawd/vault"
VAULT_SCRIPT="/Users/alfredpifi/clawd/scripts/vault.sh"

echo "📁 Buscando auditorías para guardar en vault..."

# Encontrar última auditoría
LATEST_AUDIT=$(ls -t "$AUDIT_DIR"/audit-*.json 2>/dev/null | head -1)

if [ -z "$LATEST_AUDIT" ]; then
  echo "❌ No hay auditorías para procesar"
  exit 1
fi

echo "📝 Procesando: $LATEST_AUDIT"

# Extraer datos
TIMESTAMP=$(jq -r '.audit.timestamp' "$LATEST_AUDIT")
RISK_SCORE=$(jq -r '.risk_score' "$LATEST_AUDIT")
FINDINGS=$(jq -r '.findings | keys | length' "$LATEST_AUDIT")
ALERTS=$(jq -r '.alerts | length' "$LATEST_AUDIT")

# Crear entrada para vault
FECHA=$(date +"%Y-%m-%d")
HORA=$(date +"%H:%M")

TITULO="Security Audit - $FECHA $HORA - Risk Score $RISK_SCORE/100"

CONTENIDO="Auditoría ejecutada: $TIMESTAMP
Risk Score: $RISK_SCORE/100
Categorías auditadas: $FINDINGS
Alertas detectadas: $ALERTS

Estado:
$(jq '.findings | keys | .[]' "$LATEST_AUDIT" | head -10 | sed 's/^/- /')"

# Guardar en vault (si existe script)
if [ -f "$VAULT_SCRIPT" ]; then
  bash "$VAULT_SCRIPT" add projects "Security Audits" "Auditoría $FECHA $HORA: Risk $RISK_SCORE/100, $FINDINGS categorías, $ALERTS alertas" --author alfred 2>/dev/null
  echo "✅ Guardado en vault"
else
  echo "⚠️ Vault script no encontrado"
fi

# También guardar JSON completo en vault (como archivo)
mkdir -p "$VAULT_DIR/audits"
cp "$LATEST_AUDIT" "$VAULT_DIR/audits/audit-$FECHA-$HORA.json"
echo "✅ JSON guardado en vault/audits/"

exit 0
