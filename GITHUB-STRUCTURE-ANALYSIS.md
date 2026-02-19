---
title: "GitHub Structure Analysis - Qué subir, qué no"
date: 2026-02-18
---

# 📊 ESTRUCTURA VERTEXAURA + OPENCLAW PARA GITHUB

## 1️⃣ ESTRUCTURA COMPLETA

```
/Users/alfredpifi/clawd/ (WORKSPACE PRINCIPAL)
├─ alfred-dashboard/                    [CÓDIGO - SÍ SUBIR]
│  ├─ src/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ next.config.ts
│  ├─ .env.local                        [❌ NO - SECRETS]
│  ├─ certs/                            [❌ NO - CERTIFICADOS]
│  └─ README.md
│
├─ alfred-estrategia/                   [CÓDIGO - SÍ SUBIR]
│  └─ ...
│
├─ scripts/                             [CÓDIGO - SÍ SUBIR]
│  ├─ vault.sh
│  ├─ security-audit-8h-cycle.sh
│  ├─ security-audit-8h-wrapper.sh
│  └─ ...
│
├─ services/                            [CÓDIGO - SÍ SUBIR]
│  └─ ...
│
├─ skills/                              [CÓDIGO - SÍ SUBIR]
│  └─ ...
│
├─ workspace-roberto/                   [DOCUMENTACIÓN - SÍ SUBIR]
│  ├─ SOUL.md
│  ├─ MEMORY.md
│  ├─ IDENTITY.md
│  ├─ config/                           [PARCIAL]
│  │  ├─ keywords_tiers.json            [✅ SÍ - no tiene secrets]
│  │  └─ interest_profile.json          [✅ SÍ - no tiene secrets]
│  └─ scripts/                          [✅ SÍ - scripts de trabajo]
│
├─ workspace-andres/                    [DOCUMENTACIÓN - SÍ SUBIR]
├─ workspace-marina/                    [DOCUMENTACIÓN - SÍ SUBIR]
├─ workspace-arturo/                    [DOCUMENTACIÓN - SÍ SUBIR]
├─ workspace-alex/                      [DOCUMENTACIÓN - SÍ SUBIR]
│
├─ vault/                               [DOCUMENTACIÓN - SÍ SUBIR]
│  ├─ decisions/
│  ├─ lessons/
│  ├─ projects/
│  ├─ people/
│  ├─ topics/
│  └─ formulas/
│
├─ memory/                              [DOCUMENTACIÓN - PARCIAL]
│  └─ *.md                              [✅ SÍ - aprendizajes, no tiene secrets]
│
├─ research/                            [DOCUMENTACIÓN - SÍ SUBIR]
│  └─ reports/
│
├─ vertexaura-marketing/                [CÓDIGO - SÍ SUBIR]
│  └─ ...
│
├─ SOUL.md                              [DOCUMENTACIÓN - SÍ SUBIR]
├─ MEMORY.md                            [DOCUMENTACIÓN - SÍ SUBIR]
├─ AGENTS.md                            [DOCUMENTACIÓN - SÍ SUBIR]
├─ HEARTBEAT.md                         [DOCUMENTACIÓN - SÍ SUBIR]
├─ IDENTITY.md                          [DOCUMENTACIÓN - SÍ SUBIR]
├─ .env.local                           [❌ NO - SECRETS]
├─ cost-ledger.json                     [❌ QUIZÁ - DATOS SENSIBLES]
├─ cost-history.json                    [❌ QUIZÁ - DATOS SENSIBLES]
└─ ...

~/.openclaw/ (OPENCLAW CONFIGURATION)
├─ openclaw.json                        [✅ SUBIR - config del gateway]
├─ clawdbot.json                        [✅ SUBIR - config de bots]
├─ cron/
│  └─ jobs.json                         [✅ SUBIR - definición de crons]
│
├─ credentials/                         [❌ NO - API KEYS, TOKENS]
│  ├─ anthropic.json
│  ├─ supabase.json
│  ├─ whatsapp/
│  ├─ telegram/
│  └─ ...
│
├─ agents/                              [✅ PARCIAL - estructuras sin secrets]
│  └─ */agent/auth-profiles.json        [❌ NO - auth tokens]
│
├─ devices/                             [❌ NO - device pairing]
├─ identity/                            [❌ NO - identity data]
├─ telegram/                            [❌ NO - session data]
├─ logs/                                [❌ NO - logs locales]
├─ media/                               [❌ NO - archivos descargados]
└─ workspace/                           [✅ SUBIR - if needed]
```

---

## 2️⃣ MATRIZ DE DECISIÓN

| Carpeta/Archivo | ¿Qué contiene? | Secrets? | ¿Subir? | Notas |
|---|---|---|---|---|
| **CÓDIGO** |
| alfred-dashboard/ | React app, config Next.js | .env.local | ✅ Sí (+ .gitignore .env.local) | Incluir .env.example |
| alfred-estrategia/ | Lógica Alfred | Posible | ✅ Sí (revisar) | Buscar hardcoded keys |
| scripts/ | Bash/Python scripts | Bajo | ✅ Sí | Auditoría, seguridad |
| services/ | Microservicios | Posible | ✅ Sí (revisar) | .env en .gitignore |
| skills/ | Extensiones | No | ✅ Sí | Clean |
| vertexaura-marketing/ | Código marketing | No | ✅ Sí | Clean |
| **DOCUMENTACIÓN** |
| workspace-*/ | SOUL.md, MEMORY.md, IDENTITY.md | No | ✅ Sí | Contexto de agentes |
| vault/ | Decisiones, lecciones, fórmulas | No | ✅ Sí | Knowledge base |
| memory/ | Aprendizajes diarios | No | ✅ Sí | Historial |
| research/ | Reportes | No | ✅ Sí | Investigación |
| **CONFIGURACIÓN OPENCLAW** |
| openclaw.json | Gateway config | Bajo | ✅ Sí | Revisar credenciales |
| clawdbot.json | Bot config | Bajo | ✅ Sí | Revisar tokens |
| cron/jobs.json | Definición de crons | No | ✅ Sí | Pure config |
| **NO SUBIR** |
| .env.local | API keys, secrets | ❌ CRÍTICO | ❌ No | NUNCA |
| .env | API keys | ❌ CRÍTICO | ❌ No | NUNCA |
| credentials/ | API keys, tokens | ❌ CRÍTICO | ❌ No | NUNCA |
| agents/*/auth-profiles.json | Auth tokens | ❌ CRÍTICO | ❌ No | NUNCA |
| logs/ | Logs locales | Posible | ❌ No | Info sensible |
| media/ | Archivos descargados | Posible | ❌ No | Tamaño |
| devices/ | Device pairing | Posible | ❌ No | Security |
| telegram/ | Session data | ❌ CRÍTICO | ❌ No | Session tokens |
| cost-*.json | Datos de negocio | Privado | ⚠️ Quizá | Datos sensibles |
| node_modules/ | Dependencias | N/A | ❌ No | Peso (re-install) |
| venv_scraper/ | Python env | N/A | ❌ No | Peso (re-create) |

---

## 3️⃣ .GITIGNORE (CORRECTO PARA VERTEXAURA)

```bash
# SECRETS - NUNCA COMMITEAR
.env
.env.local
.env.*.local
*.key
*.pem

# OPENCLAW SECRETS
~/.openclaw/credentials/
~/.openclaw/agents/*/agent/auth-profiles.json
~/.openclaw/telegram/
~/.openclaw/devices/
~/.openclaw/identity/
~/.openclaw/logs/
~/.openclaw/media/
~/.openclaw/delivery-queue/

# DEPENDENCIES (re-install)
node_modules/
venv_scraper/
.venv/

# GENERATED FILES
dist/
build/
.next/

# OS FILES
.DS_Store
*.swp
*~
.vscode/
.idea/

# LOGS
logs/
*.log
npm-debug.log*
yarn-debug.log*

# SENSITIVE DATA
cost-*.json
agents-status.json
standup-active.json
*.bak
```

---

## 4️⃣ STRUCTURE DE REPO EN GITHUB

```
vertexaura-infrastructure (repo privado)

├─ openclaw-config/
│  ├─ openclaw.json                   [✅ SÍ]
│  ├─ clawdbot.json                   [✅ SÍ]
│  ├─ cron/
│  │  └─ jobs.json                    [✅ SÍ]
│  ├─ credentials.template            [✅ TEMPLATE]
│  ├─ .env.example                    [✅ TEMPLATE]
│  └─ README.md
│
├─ dashboard/
│  ├─ (código alfred-dashboard)        [✅ SÍ]
│  ├─ .env.example                    [✅ TEMPLATE]
│  └─ .gitignore
│
├─ scripts/
│  ├─ security-audit-8h-*.sh           [✅ SÍ]
│  ├─ vault.sh                         [✅ SÍ]
│  └─ ...
│
├─ agents/
│  ├─ alfred/
│  │  ├─ SOUL.md
│  │  ├─ MEMORY.md
│  │  ├─ IDENTITY.md
│  │  └─ AGENTS.md
│  ├─ roberto/
│  │  ├─ SOUL.md
│  │  ├─ MEMORY.md
│  │  └─ config/keywords_tiers.json
│  └─ ...
│
├─ docs/
│  ├─ vault/                          [✅ SÍ - knowledge base]
│  ├─ memory/                         [✅ SÍ - aprendizajes]
│  ├─ SECURITY-HARDENING.md           [✅ SÍ]
│  ├─ PLAN-SEGURIDAD-SIMPLIFICADO.md [✅ SÍ]
│  └─ AUDIT-*.md                      [✅ SÍ]
│
├─ .gitignore                         [✅ IMPORTANTE]
├─ .env.example                       [✅ TEMPLATE]
├─ credentials.template               [✅ TEMPLATE]
├─ README.md                          [✅ INSTRUCCIONES]
└─ RESTORE.md                         [✅ CÓMO RECUPERAR]
```

---

## 5️⃣ ARCHIVOS TEMPLATE (PARA DOCUMENTAR SIN EXPONER)

### .env.example
```bash
# Openclaw Gateway
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Supabase
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here

# Dashboard
NEXT_PUBLIC_API_URL=http://localhost:3000

# Telegram
TELEGRAM_BOT_TOKEN=your_token_here

# Caching
PROMPT_CACHE_ENABLED=true
```

### credentials.template
```json
{
  "anthropic": {
    "api_key": "YOUR_ANTHROPIC_API_KEY"
  },
  "supabase": {
    "url": "YOUR_SUPABASE_URL",
    "anon_key": "YOUR_SUPABASE_ANON_KEY",
    "service_role_key": "YOUR_SERVICE_ROLE_KEY"
  },
  "telegram": {
    "bot_token": "YOUR_TELEGRAM_BOT_TOKEN"
  }
}
```

---

## 6️⃣ README.md (GUÍA DE RESTAURACIÓN)

```markdown
# VertexAura Infrastructure

Configuración de OpenClaw + Dashboard + Crons para VertexAura.

## Quick Start

### 1. Clone repo
\`\`\`bash
git clone https://github.com/VertexAura/infrastructure
cd infrastructure
\`\`\`

### 2. Restore secrets (local only, NOT from Git)
\`\`\`bash
# Copy templates
cp .env.example .env
cp credentials.template ~/.openclaw/credentials/authenticated.json

# Fill with your actual keys (from iCloud / 1Password)
nano .env
nano ~/.openclaw/credentials/authenticated.json
\`\`\`

### 3. Restore OpenClaw config
\`\`\`bash
cp openclaw-config/openclaw.json ~/.openclaw/
cp openclaw-config/clawdbot.json ~/.openclaw/
cp openclaw-config/cron/jobs.json ~/.openclaw/cron/
\`\`\`

### 4. Install & run
\`\`\`bash
cd dashboard
npm install
npm run dev
\`\`\`

## Structure

- **openclaw-config/**: OpenClaw gateway configuration
- **dashboard/**: Next.js dashboard (Alfred control UI)
- **scripts/**: Automation scripts (audits, crons, etc)
- **agents/**: Agent configurations (SOUL.md, MEMORY.md, etc)
- **docs/**: Documentation, vault, security docs

## ⚠️ SECURITY

- NEVER commit `.env` files
- NEVER commit `credentials/`
- NEVER commit auth tokens
- Use `.gitignore` to exclude sensitive files
- Secrets stored in: iCloud Drive (encrypted) + local password manager

## Restore from disaster

See `RESTORE.md`
```

---

## 7️⃣ COMMAND PARA CREAR REPO CON .GITIGNORE

```bash
# 1. Crear repo en GitHub (privado)
# URL: https://github.com/new
# Name: vertexaura-infrastructure
# Private: YES

# 2. Clone y setup
git clone https://github.com/VertexAura/vertexaura-infrastructure
cd vertexaura-infrastructure

# 3. Copy código
cp -r /Users/alfredpifi/clawd/alfred-dashboard ./dashboard
cp -r /Users/alfredpifi/clawd/scripts ./scripts
cp -r /Users/alfredpifi/clawd/workspace-* ./agents
cp -r /Users/alfredpifi/clawd/vault ./docs/vault
cp -r /Users/alfredpifi/clawd/memory ./docs/memory
cp -r ~/.openclaw/cron ./openclaw-config/cron
cp ~/.openclaw/openclaw.json ./openclaw-config/
cp ~/.openclaw/clawdbot.json ./openclaw-config/

# 4. Crear .gitignore
cat > .gitignore << 'EOF'
# Secrets
.env
.env.local
.env.*.local
*.key
*.pem

# OpenClaw sensitive
credentials/
agents/*/auth-profiles.json
telegram/
devices/
identity/

# Dependencies
node_modules/
venv_scraper/
.venv/

# Generated
dist/
build/
.next/
logs/
*.log

# OS
.DS_Store
*.swp
*~
.vscode/
.idea/

# Sensitive data
cost-*.json
agents-status.json
standup-active.json
*.bak
EOF

# 5. Create templates
cat > .env.example << 'EOF'
ANTHROPIC_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
EOF

# 6. First commit
git add .
git commit -m "Initial commit: VertexAura infrastructure"
git push -u origin main
```

---

## 8️⃣ RESPUESTA CORTA

**SÍ, tiene 100% de sentido usar Git + GitHub + .gitignore**

### ✅ SUBIR A GITHUB:
- Código (scripts, dashboard, servicios)
- Configuración (jobs.json, openclaw.json, clawdbot.json)
- Documentación (SOUL.md, MEMORY.md, vault/, memory/)
- Templates (.env.example, credentials.template)

### ❌ NUNCA SUBIR:
- .env files (API keys)
- credentials/ directory
- Auth tokens, device pairings
- Session data

### 🔐 SECRETS VAN A:
- iCloud Drive (encriptado)
- O 1Password / LastPass (password manager)
- Nunca en Git, nunca en GitHub

**Con .gitignore bien configurado = 100% seguro**

---

Procedo a crear el repo?
