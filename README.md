# VertexAura Infrastructure

Configuración de OpenClaw + Dashboard + Scripts para el departamento de IA de VertexAura.

## 🏗️ Estructura

```
├─ openclaw-config/     Configuración del gateway (jobs.json, openclaw.json)
├─ dashboard/           Next.js control panel para Alfred
├─ scripts/             Bash/Python scripts (auditorías, seguridad)
├─ agents/              Configuración de agentes (SOUL.md, MEMORY.md)
├─ docs/                Documentación, vault, security guides
└─ README.md            Este archivo
```

## ⚡ Quick Start

### 1. Clone repository
```bash
git clone https://github.com/santiago-vertexaura-ai/vertexaura-infrastructure
cd vertexaura-infrastructure
```

### 2. Restore secrets (NO from Git - use Proton Pass)
```bash
# Copy templates
cp .env.example .env
cp credentials.template ~/.openclaw/credentials/authenticated.json

# Fill with your actual keys from Proton Pass
nano .env
nano ~/.openclaw/credentials/authenticated.json
```

### 3. Restore OpenClaw configuration
```bash
cp openclaw-config/openclaw.json ~/.openclaw/
cp openclaw-config/clawdbot.json ~/.openclaw/
cp openclaw-config/cron/jobs.json ~/.openclaw/cron/
```

### 4. Install & run dashboard
```bash
cd dashboard
npm install
npm run dev
```

## 🔐 SECURITY

### ✅ TRACKED IN GIT
- Código (scripts, dashboard)
- Configuración (jobs.json, openclaw.json)
- Documentación (vault, memory, security docs)
- Templates (.env.example, credentials.template)

### ❌ NEVER IN GIT
- `.env` / `.env.local` files
- `credentials/` directory
- Auth tokens, API keys
- Session data, device pairings

**Secrets are stored in:** Proton Pass (encrypted)

## 📚 Documentation

- **Security:** See `/docs/SECURITY-HARDENING.md`
- **Audits:** See `/docs/CRON-SECURITY-AUDIT-8H.md`
- **Agents:** See `/agents/*/SOUL.md` for each agent
- **Architecture:** See `AGENTS.md` and `MEMORY.md`

## 🚀 Deployment

Restore from disaster:
1. Clone this repo
2. Restore secrets from Proton Pass
3. Restore OpenClaw config (as above)
4. `npm install` in dashboard/
5. System ready

## 📝 Commits

Daily commits at 22:30 (CET) with full summary of changes.

Format: `[DD-MMM-YYYY] Daily Infrastructure Update - [Summary]`

## 🤝 Team

- **Alfred:** Orchestration, security, strategy
- **Roberto:** Research, news scanning, YouTube analysis
- **Andrés:** Content intelligence, analysis, formulas
- **Marina:** Content creation, drafts
- **Arturo:** Performance metrics, social analytics
- **Alex:** Sales, community strategy

## 📞 Support

For issues or questions, check vault documentation in `/docs/vault/`


Para restaurar en otra máquina solo necesitarías:

git clone el repo
Rellenar los [REDACTED] con los tokens reales
npm install en alfred-dashboard
Copiar los plists a ~/Library/LaunchAgents/
Configurar .env.local con las API keys


