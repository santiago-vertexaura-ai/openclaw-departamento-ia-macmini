#!/bin/bash

# SECURITY AUDIT - MÁXIMO NIVEL - EVERY 8 HOURS
# Ejecutar: bash /Users/alfredpifi/clawd/scripts/security-audit-8h-cycle.sh
# Cron: 0 0,8,16 * * * bash /Users/alfredpifi/clawd/scripts/security-audit-8h-cycle.sh >> /tmp/audit-cron.log 2>&1

set -e

AUDIT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
AUDIT_TS=$(date +"%Y%m%d-%H%M%S")
WORKSPACE="/Users/alfredpifi/clawd"
AUDIT_DIR="/tmp/security-audits"
AUDIT_REPORT="${AUDIT_DIR}/audit-${AUDIT_TS}.json"
TREND_FILE="/tmp/security-audit-trends.json"

mkdir -p "$AUDIT_DIR"

echo "════════════════════════════════════════════════════════════════"
echo "🔐 AUDITORÍA DE MÁXIMO NIVEL - CICLO 8h"
echo "════════════════════════════════════════════════════════════════"
echo "Timestamp: $AUDIT_TIME"
echo "Output: $AUDIT_REPORT"
echo ""

# ============================================================
# 1. NETWORK SECURITY
# ============================================================
echo "📡 1/15 Network Security..."
LISTENING_PORTS=$(lsof -i -P -n 2>/dev/null | grep LISTEN | wc -l)
EXPOSED_PORTS=$(lsof -i -P -n 2>/dev/null | grep "LISTEN.*\*:" | wc -l)
IPv6_LISTEN=$(lsof -i6 -P -n 2>/dev/null | grep LISTEN | wc -l)
ESTABLISHED=$(netstat -an 2>/dev/null | grep ESTABLISHED | wc -l)

# ============================================================
# 2. FILE INTEGRITY
# ============================================================
echo "📁 2/15 File Integrity..."
# Hash de archivos críticos
CRED_HASH=$(find ~/.openclaw/credentials -type f -exec md5 {} \; 2>/dev/null | md5)
ENV_HASH=$(find $WORKSPACE -name ".env*" ! -path "*/node_modules/*" -exec md5 {} \; 2>/dev/null | md5)
CRON_HASH=$(md5 ~/.openclaw/cron/jobs.json 2>/dev/null || echo "NOT_FOUND")

# ============================================================
# 3. PROCESS SECURITY
# ============================================================
echo "⚙️  3/15 Process Security..."
NODE_PROCS=$(ps aux | grep -i "node" | grep -v grep | wc -l)
PYTHON_PROCS=$(ps aux | grep -i "python" | grep -v grep | wc -l)
RUBY_PROCS=$(ps aux | grep -i "ruby" | grep -v grep | wc -l)
GATEWAY_STATUS=$(pgrep -f "openclaw-gateway" > /dev/null && echo "RUNNING" || echo "STOPPED")
REDIS_STATUS=$(pgrep -f "redis" > /dev/null && echo "RUNNING" || echo "STOPPED")
POSTGRES_STATUS=$(pgrep -f "postgres" > /dev/null && echo "RUNNING" || echo "STOPPED")

# ============================================================
# 4. AUTHENTICATION & ACCESS
# ============================================================
echo "🔑 4/15 Authentication & Access..."
# Últimas login attempts
RECENT_LOGINS=$(last -f /var/log/wtmp 2>/dev/null | head -5 | wc -l || echo "0")
# SSH keys
SSH_KEYS=$(find ~/.ssh -name "*.pub" -o -name "id_*" 2>/dev/null | wc -l)
# Sudo access
SUDO_USERS=$(dscl . -read /Groups/admin GroupMembership 2>/dev/null | wc -w || echo "UNKNOWN")

# ============================================================
# 5. SECRETS & CREDENTIALS
# ============================================================
echo "🔐 5/15 Secrets Detection..."
EXPOSED_API_KEYS=$(find $WORKSPACE -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" \) \
  ! -path "*/node_modules/*" -exec grep -l "api_key.*=\|apiKey.*=\|API_KEY" {} \; 2>/dev/null | wc -l)
EXPOSED_PASSWORDS=$(find $WORKSPACE -type f \( -name "*.js" -o -name "*.ts" -o -name "*.py" \) \
  ! -path "*/node_modules/*" -exec grep -l "password.*=.*['\"]" {} \; 2>/dev/null | wc -l)
EXPOSED_TOKENS=$(find $WORKSPACE -type f -exec grep -l "token.*=\|jwt.*=" {} \; 2>/dev/null | wc -l)

# Git secrets
GIT_SECRETS=$(cd $WORKSPACE && git log --all -p 2>/dev/null | grep -i "api_key\|password\|secret\|token" 2>/dev/null | wc -l || echo "0")

# ============================================================
# 6. ENCRYPTION
# ============================================================
echo "🔒 6/15 Encryption Status..."
DISK_ENCRYPTED=$(diskutil info / 2>/dev/null | grep -i "encrypted" | awk '{print $NF}')
TLS_CERTS=$(find $WORKSPACE -name "*.pem" -o -name "*.crt" 2>/dev/null | wc -l)
CERT_VALIDITY=$(openssl x509 -in $WORKSPACE/alfred-dashboard/certs/cert.pem -noout -enddate 2>/dev/null | cut -d= -f2 || echo "INVALID")

# ============================================================
# 7. VULNERABILITY SCANNING
# ============================================================
echo "🐛 7/15 Vulnerability Scanning..."
npm_audit_file="/tmp/npm-audit-${AUDIT_TS}.json"
cd $WORKSPACE/alfred-dashboard 2>/dev/null && npm audit --json > "$npm_audit_file" 2>/dev/null || true
NPM_VULNS=$(cat "$npm_audit_file" 2>/dev/null | grep -o '"vulnerabilities"' | wc -l || echo "0")
NPM_CRITICAL=$(npm audit 2>/dev/null | grep -i "critical" | wc -l || echo "0")

# ============================================================
# 8. PERMISSION AUDITING
# ============================================================
echo "👤 8/15 Permission Auditing..."
CRED_PERMS=$(ls -ld ~/.openclaw/credentials/ 2>/dev/null | awk '{print $1}' | cut -c3-9)
ENV_PERMS=$(find $WORKSPACE -name ".env*" ! -path "*/node_modules/*" -exec ls -la {} \; 2>/dev/null | awk '{print $1}' | cut -c3-9 | sort | uniq -c)
JOBS_PERMS=$(ls -la ~/.openclaw/cron/jobs.json 2>/dev/null | awk '{print $1}' | cut -c3-9)
CERTS_PERMS=$(ls -la $WORKSPACE/alfred-dashboard/certs/ 2>/dev/null | grep -E "\.pem|\.crt" | awk '{print $1}' | cut -c3-9 | sort | uniq)

# ============================================================
# 9. LOGGING & AUDIT TRAIL
# ============================================================
echo "📝 9/15 Logging & Audit Trail..."
LOG_FILES=$(find /Users/alfredpifi -name "*.log" -type f -mtime -1 2>/dev/null | wc -l)
LOG_SIZE=$(find /Users/alfredpifi -name "*.log" -type f -mtime -1 -exec du -c {} \; 2>/dev/null | tail -1 | awk '{print $1}')
SYSTEM_LOGS=$(log show --last 1h 2>/dev/null | grep -i "error\|critical\|security" | wc -l 2>/dev/null || echo "0")
AUDIT_LOGS=$(find /var/audit -type f -mtime -1 2>/dev/null | wc -l 2>/dev/null || echo "0")

# ============================================================
# 10. FIREWALL STATUS
# ============================================================
echo "🧯 10/15 Firewall Status..."
FW_STATUS=$(sudo defaults read /Library/Preferences/com.apple.alf globalstate 2>/dev/null || echo "UNKNOWN")
BLOCKED_CONNECTIONS=$(log show --level=error --last 1h 2>/dev/null | grep -i "blocked\|denied\|firewall" | wc -l 2>/dev/null || echo "0")

# ============================================================
# 11. DATA BACKUP STATUS
# ============================================================
echo "💾 11/15 Data Backup..."
BACKUP_DIRS=$(find /Users/alfredpifi -name "*backup*" -o -name "*bak*" 2>/dev/null | wc -l)
LAST_BACKUP=$(find /Users/alfredpifi -name "*backup*" -type f -printf '%T@\n' 2>/dev/null | sort -rn | head -1 | xargs -I {} date -r {} +"%s" 2>/dev/null || echo "NEVER")
GIT_COMMITS=$(cd $WORKSPACE && git log --oneline 2>/dev/null | wc -l || echo "0")

# ============================================================
# 12. NETWORK CONNECTIONS
# ============================================================
echo "🌐 12/15 Network Connections..."
ACTIVE_CONNECTIONS=$(netstat -an 2>/dev/null | grep -i "established\|time_wait\|close_wait" | wc -l)
LISTENING_SERVICES=$(lsof -i -P -n 2>/dev/null | grep LISTEN | awk '{print $9}' | cut -d: -f2 | sort -u | wc -l)
SUSPICIOUS_IPS=$(netstat -an 2>/dev/null | grep ESTABLISHED | awk '{print $5}' | grep -v "^127\|^192\|^10\|^172" | wc -l)

# ============================================================
# 13. SSL/TLS CONFIGURATION
# ============================================================
echo "🔐 13/15 SSL/TLS Configuration..."
HTTPS_ENABLED=$(curl -s -o /dev/null -w "%{http_code}" https://localhost:3000 2>/dev/null || echo "ERROR")
TLS_VERSION=$(curl -I https://localhost:3000 2>/dev/null | grep -i "TLS\|SSL" | head -1 || echo "UNKNOWN")
CERT_CHAIN=$(openssl s_client -connect localhost:3000 -showcerts < /dev/null 2>/dev/null | grep -c "certificate" 2>/dev/null || echo "0")

# ============================================================
# 14. COMPLIANCE & POLICY
# ============================================================
echo "⚖️  14/15 Compliance Status..."
GDPR_DOCS=$(find $WORKSPACE -name "*gdpr*" -o -name "*privacy*" -o -name "*policy*" 2>/dev/null | wc -l || echo "0")
SOC2_STATUS=$([ -f "$WORKSPACE/SOC2-COMPLIANCE.md" ] && echo "EXISTS" || echo "MISSING")
INCIDENT_RESPONSE=$([ -f "$WORKSPACE/INCIDENT-RESPONSE-PLAN.md" ] && echo "EXISTS" || echo "MISSING")

# ============================================================
# 15. SYSTEM INTEGRITY
# ============================================================
echo "🛡️  15/15 System Integrity..."
KERNEL_PANIC=$(log show --level=error --last 24h 2>/dev/null | grep -i "panic" | wc -l 2>/dev/null || echo "0")
SYSTEM_ERRORS=$(log show --level=error --last 1h 2>/dev/null | wc -l 2>/dev/null || echo "0")
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
MEMORY_USAGE=$(vm_stat 2>/dev/null | grep "free memory" | awk '{print $3}' | tr -d '.' || echo "UNKNOWN")

# ============================================================
# RISK SCORING
# ============================================================
echo ""
echo "🎯 Calculating Risk Score..."

RISK_SCORE=0

# Network risks
[ "$EXPOSED_PORTS" -gt 0 ] && RISK_SCORE=$((RISK_SCORE + 20))
[ "$GATEWAY_STATUS" == "STOPPED" ] && RISK_SCORE=$((RISK_SCORE + 15))
[ "$SUSPICIOUS_IPS" -gt 0 ] && RISK_SCORE=$((RISK_SCORE + 10))

# Security risks
[ "$NPM_CRITICAL" -gt 0 ] && RISK_SCORE=$((RISK_SCORE + 15))
[ "$EXPOSED_PASSWORDS" -gt 5 ] && RISK_SCORE=$((RISK_SCORE + 10))
[ "$DISK_ENCRYPTED" != "Yes" ] && RISK_SCORE=$((RISK_SCORE + 20))

# Data protection
[ "$LAST_BACKUP" == "NEVER" ] && RISK_SCORE=$((RISK_SCORE + 25))
[ "$LOG_FILES" -lt 5 ] && RISK_SCORE=$((RISK_SCORE + 5))

# Compliance
[ "$SOC2_STATUS" == "MISSING" ] && RISK_SCORE=$((RISK_SCORE + 10))
[ "$INCIDENT_RESPONSE" == "MISSING" ] && RISK_SCORE=$((RISK_SCORE + 10))

# Cap at 100
[ "$RISK_SCORE" -gt 100 ] && RISK_SCORE=100

# ============================================================
# GENERATE JSON REPORT
# ============================================================
echo "📄 Generating JSON Report..."

cat > "$AUDIT_REPORT" <<JSONEOF
{
  "audit": {
    "timestamp": "$AUDIT_TIME",
    "version": "2.0-8h-cycle",
    "framework": "NIST/CIS/OWASP/ISO27001"
  },
  "risk_score": $RISK_SCORE,
  "findings": {
    "network": {
      "listening_ports": $LISTENING_PORTS,
      "exposed_ports": $EXPOSED_PORTS,
      "ipv6_listening": $IPv6_LISTEN,
      "established_connections": $ACTIVE_CONNECTIONS,
      "suspicious_ips": $SUSPICIOUS_IPS
    },
    "file_integrity": {
      "credentials_hash": "$CRED_HASH",
      "env_hash": "$ENV_HASH",
      "jobs_json_hash": "$CRON_HASH"
    },
    "processes": {
      "node_processes": $NODE_PROCS,
      "python_processes": $PYTHON_PROCS,
      "ruby_processes": $RUBY_PROCS,
      "gateway_status": "$GATEWAY_STATUS",
      "redis_status": "$REDIS_STATUS",
      "postgres_status": "$POSTGRES_STATUS"
    },
    "authentication": {
      "recent_logins": $RECENT_LOGINS,
      "ssh_keys": $SSH_KEYS,
      "sudo_users": "$SUDO_USERS"
    },
    "secrets": {
      "exposed_api_keys": $EXPOSED_API_KEYS,
      "exposed_passwords": $EXPOSED_PASSWORDS,
      "exposed_tokens": $EXPOSED_TOKENS,
      "git_secret_references": $GIT_SECRETS
    },
    "encryption": {
      "disk_encrypted": "$DISK_ENCRYPTED",
      "tls_certs": $TLS_CERTS,
      "cert_validity": "$CERT_VALIDITY",
      "https_enabled": "$HTTPS_ENABLED",
      "tls_version": "$TLS_VERSION"
    },
    "vulnerabilities": {
      "npm_vulnerabilities": $NPM_VULNS,
      "npm_critical": $NPM_CRITICAL,
      "npm_audit_file": "$npm_audit_file"
    },
    "permissions": {
      "credentials_perms": "$CRED_PERMS",
      "jobs_json_perms": "$JOBS_PERMS",
      "certs_perms": "$CERTS_PERMS"
    },
    "logging": {
      "log_files_24h": $LOG_FILES,
      "log_size_bytes": $LOG_SIZE,
      "system_errors_1h": $SYSTEM_ERRORS,
      "audit_logs": $AUDIT_LOGS
    },
    "firewall": {
      "status": "$FW_STATUS",
      "blocked_connections_1h": $BLOCKED_CONNECTIONS
    },
    "backup": {
      "backup_directories": $BACKUP_DIRS,
      "last_backup_timestamp": "$LAST_BACKUP",
      "git_commits": $GIT_COMMITS
    },
    "system_integrity": {
      "kernel_panics_24h": $KERNEL_PANIC,
      "system_errors_1h": $SYSTEM_ERRORS,
      "disk_usage_percent": $DISK_USAGE,
      "listening_services": $LISTENING_SERVICES
    },
    "compliance": {
      "gdpr_docs": $GDPR_DOCS,
      "soc2_status": "$SOC2_STATUS",
      "incident_response_plan": "$INCIDENT_RESPONSE"
    }
  },
  "alerts": [
    $([ "$EXPOSED_PORTS" -gt 0 ] && echo '"🔴 EXPOSED_PORTS: $EXPOSED_PORTS detected",' || true)
    $([ "$GATEWAY_STATUS" == "STOPPED" ] && echo '"🔴 GATEWAY_DOWN: OpenClaw gateway not running",' || true)
    $([ "$NPM_CRITICAL" -gt 0 ] && echo '"🔴 NPM_CRITICAL: $NPM_CRITICAL critical vulnerabilities",' || true)
    $([ "$DISK_ENCRYPTED" != "Yes" ] && echo '"🔴 DISK_UNENCRYPTED: FileVault not enabled",' || true)
    $([ "$RISK_SCORE" -ge 70 ] && echo '"🔴 HIGH_RISK: Risk score $RISK_SCORE (>=70)",' || true)
    "info"
  ],
  "recommendations": {
    "immediate": [
      $([ "$EXPOSED_PORTS" -gt 0 ] && echo '"Bind ports to 127.0.0.1 (localhost only)",' || true)
      $([ "$GATEWAY_STATUS" == "STOPPED" ] && echo '"Restart gateway: openclaw gateway restart",' || true)
      $([ "$NPM_CRITICAL" -gt 0 ] && echo '"Run npm audit fix in alfred-dashboard/",' || true)
      "none"
    ],
    "this_week": [
      $([ "$DISK_ENCRYPTED" != "Yes" ] && echo '"Enable FileVault encryption",' || true)
      $([ "$LAST_BACKUP" == "NEVER" ] && echo '"Implement backup strategy (3-2-1 rule)",' || true)
      "review security dashboard"
    ]
  }
}
JSONEOF

# ============================================================
# UPDATE TREND FILE
# ============================================================
echo "📈 Updating Trends..."

if [ -f "$TREND_FILE" ]; then
  # Append to existing trends
  jq ". += [{\"timestamp\": \"$AUDIT_TIME\", \"risk_score\": $RISK_SCORE, \"exposed_ports\": $EXPOSED_PORTS, \"vulnerabilities\": $NPM_VULNS}]" "$TREND_FILE" > "${TREND_FILE}.tmp" && mv "${TREND_FILE}.tmp" "$TREND_FILE"
else
  # Create new trends file
  echo "[{\"timestamp\": \"$AUDIT_TIME\", \"risk_score\": $RISK_SCORE, \"exposed_ports\": $EXPOSED_PORTS, \"vulnerabilities\": $NPM_VULNS}]" > "$TREND_FILE"
fi

# ============================================================
# ALERT SUMMARY
# ============================================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎯 AUDIT SUMMARY (Risk Score: $RISK_SCORE/100)"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Network:"
echo "  Listening ports: $LISTENING_PORTS"
echo "  Exposed ports: $EXPOSED_PORTS"
echo "  Gateway: $GATEWAY_STATUS"
echo ""
echo "Security:"
echo "  npm vulnerabilities: $NPM_VULNS (critical: $NPM_CRITICAL)"
echo "  Exposed passwords: $EXPOSED_PASSWORDS"
echo "  Disk encrypted: $DISK_ENCRYPTED"
echo ""
echo "Operations:"
echo "  Processes: Node($NODE_PROCS) Python($PYTHON_PROCS) Ruby($RUBY_PROCS)"
echo "  Backups: $BACKUP_DIRS directories"
echo "  System errors (1h): $SYSTEM_ERRORS"
echo ""
echo "Reports:"
echo "  JSON: $AUDIT_REPORT"
echo "  Trends: $TREND_FILE"
echo ""

# ALERT IF CRITICAL
if [ "$RISK_SCORE" -ge 70 ]; then
  echo "🚨 ALERT: Risk score HIGH ($RISK_SCORE)"
  # Opcionalmente enviar a Telegram aquí
fi

echo "✅ Audit complete: $(date)"
