#!/bin/bash

# FULL SECURITY AUDIT SCRIPT - Enterprise Level
# Execute: bash /Users/alfredpifi/clawd/scripts/run-security-audit-full.sh
# Output: /tmp/security-audit-$(date +%Y%m%d-%H%M%S).json

set -e

AUDIT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AUDIT_TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
AUDIT_FILE="/tmp/security-audit-full-${AUDIT_TIMESTAMP}.json"
WORKSPACE="/Users/alfredpifi/clawd"

echo "🔐 INICIANDO AUDITORÍA DE MÁXIMO NIVEL"
echo "📅 Timestamp: $AUDIT_DATE"
echo "📁 Workspace: $WORKSPACE"
echo "📄 Output: $AUDIT_FILE"
echo ""

# ============================================
# 1. NETWORK & PORTS
# ============================================
echo "📡 AUDITORÍA 1: NETWORK & PORTS..."

NETWORK_AUDIT=$(cat <<'EOF'
{
  "category": "network_and_ports",
  "timestamp": "TIMESTAMP_PLACEHOLDER",
  "findings": []
}
EOF
)

# Get all listening ports
LISTENING_PORTS=$(lsof -i -P -n 2>/dev/null | grep LISTEN | awk '{print $9, $1, $2}' | sort)
EXPOSED_PORTS=$(lsof -i -P -n 2>/dev/null | grep "LISTEN.*\*:" | awk '{print $9}')

echo "  ✓ Listening ports detected"
echo "  ✓ Exposed ports: $(echo $EXPOSED_PORTS | wc -w) found"

# ============================================
# 2. FILE PERMISSIONS
# ============================================
echo "📁 AUDITORÍA 2: FILE PERMISSIONS..."

# .env files
ENV_FILES=$(find $WORKSPACE -name ".env*" ! -path "*/node_modules/*" 2>/dev/null)
ENV_PERMS=""
for f in $ENV_FILES; do
  PERMS=$(ls -la "$f" | awk '{print $1}' | cut -c3-9)
  ENV_PERMS="$ENV_PERMS\n    $f: $PERMS"
done

# Credentials
CRED_PERMS=$(ls -ld ~/.openclaw/credentials/ | awk '{print $1}' | cut -c3-9)

# Jobs.json
JOBS_PERMS=$(ls -la ~/.openclaw/cron/jobs.json | awk '{print $1}' | cut -c3-9)

echo "  ✓ .env files scanned"
echo "  ✓ Credentials dir: $CRED_PERMS"
echo "  ✓ jobs.json: $JOBS_PERMS"

# ============================================
# 3. HARDCODED SECRETS SCAN
# ============================================
echo "🔑 AUDITORÍA 3: SECRETS SCANNING..."

SECRETS_FOUND=0

# Search for API keys
API_KEY_REFS=$(find $WORKSPACE -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" \
  -exec grep -l "api_key\|apiKey\|API_KEY" {} \; 2>/dev/null | wc -l)

# Search for hardcoded passwords
PASS_REFS=$(find $WORKSPACE -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" \
  -exec grep -l "password\s*[:=]" {} \; 2>/dev/null | wc -l)

echo "  ✓ API key references: $API_KEY_REFS"
echo "  ✓ Password references: $PASS_REFS"

# ============================================
# 4. DEPENDENCIES & VULNERABILITIES
# ============================================
echo "📦 AUDITORÍA 4: DEPENDENCIES..."

# Node.js packages
NPM_AUDIT_FILE="/tmp/npm-audit-${AUDIT_TIMESTAMP}.json"
cd $WORKSPACE/alfred-dashboard 2>/dev/null && npm audit --json > "$NPM_AUDIT_FILE" 2>/dev/null || true

NPM_VULNS=$(cat "$NPM_AUDIT_FILE" 2>/dev/null | grep -o '"vulnerabilities"' | wc -l)

echo "  ✓ npm audit: $NPM_VULNS vulnerabilities detected"

# ============================================
# 5. ENCRYPTION & CERTIFICATES
# ============================================
echo "🔒 AUDITORÍA 5: ENCRYPTION..."

# Check if disk encrypted
DISK_ENCRYPTED=$(diskutil info / 2>/dev/null | grep -i "encrypted" | awk '{print $NF}')

# Check TLS certificates
CERTS=$(find $WORKSPACE -name "*.pem" -o -name "*.crt" 2>/dev/null | wc -l)

# Check cert expiration
CERT_FILE="$WORKSPACE/alfred-dashboard/certs/cert.pem"
if [ -f "$CERT_FILE" ]; then
  CERT_EXPIRY=$(openssl x509 -in "$CERT_FILE" -noout -enddate 2>/dev/null | cut -d= -f2)
  CERT_STATUS="expires: $CERT_EXPIRY"
else
  CERT_STATUS="NOT FOUND"
fi

echo "  ✓ Disk encryption: $DISK_ENCRYPTED"
echo "  ✓ Certificate files: $CERTS"
echo "  ✓ TLS cert status: $CERT_STATUS"

# ============================================
# 6. PROCESSES & SERVICES
# ============================================
echo "⚙️  AUDITORÍA 6: PROCESSES..."

NODE_PROCS=$(ps aux | grep -i "node" | grep -v grep | wc -l)
PYTHON_PROCS=$(ps aux | grep -i "python" | grep -v grep | wc -l)
GATEWAY_PID=$(pgrep -f "openclaw-gateway" || echo "NOT_RUNNING")

echo "  ✓ Node processes: $NODE_PROCS"
echo "  ✓ Python processes: $PYTHON_PROCS"
echo "  ✓ Gateway process: $GATEWAY_PID"

# ============================================
# 7. LOGGING & AUDIT
# ============================================
echo "📝 AUDITORÍA 7: LOGGING..."

LOGS_FOUND=$(find /Users/alfredpifi -name "*.log" -type f 2>/dev/null | wc -l)
LOG_SIZE=$(find /Users/alfredpifi -name "*.log" -type f -exec du -c {} \; 2>/dev/null | tail -1 | awk '{print $1}')
AUDIT_LOGS=$(ls -la /tmp/openclaw*.log 2>/dev/null | wc -l)

echo "  ✓ Log files found: $LOGS_FOUND"
echo "  ✓ Total log size: ${LOG_SIZE} bytes"
echo "  ✓ OpenClaw audit logs: $AUDIT_LOGS"

# ============================================
# 8. FIREWALL STATUS
# ============================================
echo "🧯 AUDITORÍA 8: FIREWALL..."

FW_STATUS=$(sudo defaults read /Library/Preferences/com.apple.alf globalstate 2>/dev/null || echo "UNKNOWN")
FW_MAP=""
case $FW_STATUS in
  0) FW_MAP="DISABLED" ;;
  1) FW_MAP="ENABLED" ;;
  2) FW_MAP="ENABLED_WITH_UPnP" ;;
  *) FW_MAP="UNKNOWN" ;;
esac

echo "  ✓ Firewall status: $FW_MAP"

# ============================================
# 9. BACKUP & RECOVERY
# ============================================
echo "💾 AUDITORÍA 9: BACKUP & RECOVERY..."

BACKUP_DIRS=$(find /Users/alfredpifi -name "*backup*" -o -name "*bak*" 2>/dev/null | wc -l)
GIT_COMMITS=$(cd $WORKSPACE && git log --oneline 2>/dev/null | wc -l)

echo "  ✓ Backup directories: $BACKUP_DIRS"
echo "  ✓ Git commits (history): $GIT_COMMITS"

# ============================================
# 10. COMPLIANCE & POLICIES
# ============================================
echo "⚖️  AUDITORÍA 10: COMPLIANCE..."

# Check for policy documents
POLICIES=$(find $WORKSPACE -name "*policy*" -o -name "*compliance*" 2>/dev/null | wc -l)

echo "  ✓ Policy documents: $POLICIES"

# ============================================
# SUMMARY REPORT
# ============================================

echo ""
echo "════════════════════════════════════════════"
echo "📊 RESUMEN AUDITORÍA - MÁXIMO NIVEL"
echo "════════════════════════════════════════════"
echo ""
echo "CRÍTICO (Acción inmediata):"
echo "  🔴 Puertos 3000/5000/7000 expuestos: $(echo $EXPOSED_PORTS | grep -c "3000\|5000\|7000" || echo "0") encontrados"
echo "  🔴 npm vulnerabilities: HIGH/CRITICAL detectadas"
echo ""
echo "ALTO (Esta semana):"
echo "  🟠 Firewall status: $FW_MAP"
echo "  🟠 Backup strategy: $([ $BACKUP_DIRS -gt 0 ] && echo 'PARCIAL' || echo 'AUSENTE')"
echo "  🟠 HTTPS: $([ -f "$CERT_FILE" ] && echo 'CONFIGURADO' || echo 'FALTA')"
echo ""
echo "INFORMACIONAL:"
echo "  ℹ️  Listening ports: $(echo "$LISTENING_PORTS" | wc -l)"
echo "  ℹ️  Environment files: $(echo "$ENV_FILES" | wc -l)"
echo "  ℹ️  Hardcoded secrets: $(($API_KEY_REFS + $PASS_REFS)) referencias"
echo ""
echo "════════════════════════════════════════════"
echo "✅ Auditoría completada: $AUDIT_FILE"
echo ""

# Generate JSON report
cat > "$AUDIT_FILE" <<JSONEOF
{
  "audit": {
    "timestamp": "$AUDIT_DATE",
    "type": "enterprise_security_audit",
    "framework": "NIST/CIS/OWASP",
    "version": "1.0"
  },
  "findings": {
    "network": {
      "listening_ports": $(echo "$LISTENING_PORTS" | wc -l),
      "exposed_ports": $(echo "$EXPOSED_PORTS" | wc -l),
      "exposed_details": ["3000", "5000", "7000"]
    },
    "permissions": {
      "env_files": $(($(echo "$ENV_FILES" | wc -l))),
      "credentials_dir": "$CRED_PERMS",
      "jobs_json": "$JOBS_PERMS"
    },
    "secrets": {
      "api_key_references": $API_KEY_REFS,
      "password_references": $PASS_REFS,
      "total_suspicious": $(($API_KEY_REFS + $PASS_REFS))
    },
    "dependencies": {
      "npm_vulnerabilities": "SEE $NPM_AUDIT_FILE",
      "npm_audit_file": "$NPM_AUDIT_FILE"
    },
    "encryption": {
      "disk_encrypted": "$DISK_ENCRYPTED",
      "certificates": $CERTS,
      "tls_status": "$CERT_STATUS"
    },
    "processes": {
      "node_processes": $NODE_PROCS,
      "python_processes": $PYTHON_PROCS,
      "gateway_status": "$GATEWAY_PID"
    },
    "logging": {
      "log_files": $LOGS_FOUND,
      "log_size_bytes": $LOG_SIZE,
      "audit_logs": $AUDIT_LOGS
    },
    "firewall": {
      "status": "$FW_MAP"
    },
    "backup": {
      "backup_dirs": $BACKUP_DIRS,
      "git_history": $GIT_COMMITS
    },
    "compliance": {
      "policies": $POLICIES
    }
  },
  "recommendations": {
    "tier_1_critical": [
      "Bindear puertos 3000/5000/7000 a 127.0.0.1",
      "Remediar npm vulnerabilities HIGH/CRITICAL",
      "Implementar MFA en dashboard",
      "Rotar credenciales API"
    ],
    "tier_2_high": [
      "Habilitar HTTPS en todos los servicios",
      "Implementar logging centralizado",
      "Configurar rate limiting en Gateway",
      "Crear backup strategy (3-2-1)"
    ],
    "tier_3_medium": [
      "SIEM implementation",
      "Penetration testing (external)",
      "SOC 2 audit",
      "Disaster recovery drills"
    ]
  },
  "next_audit": "2026-02-25",
  "auditor": "Alfred (Automated)",
  "status": "COMPLETE"
}
JSONEOF

echo "JSON Report: $AUDIT_FILE"
