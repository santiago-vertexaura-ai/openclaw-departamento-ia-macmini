# TOOLS.md — Entorno Local

## TTS (Text-to-Speech)

- **Sistema:** macOS `say`
- **Idioma:** Español (castellano)
- **Voz por defecto:** Reed
- **Script:** `bash /Users/alfredpifi/clawd/scripts/say-alfred.sh`
- **Formato:** M4A (AAC)

```bash
bash say-alfred.sh Reed "Hola, soy Alfred"
bash say-alfred.sh Reed "Texto" /tmp/audio.m4a
```

Voces disponibles: Reed (default), Eddy, Rocko, Grandpa.

## Supabase

- **URL:** `https://xacthbehposxdrfqajwz.supabase.co`
- **Credenciales:** `/Users/alfredpifi/clawd/vertexaura-marketing/.env`
- **Dashboard keys:** `/Users/alfredpifi/clawd/alfred-dashboard/.env.local`

## Dashboard

- **Framework:** Next.js 15 + TypeScript + Tailwind
- **Ubicación:** `/Users/alfredpifi/clawd/alfred-dashboard`
- **Ejecutar:** `npx next dev --hostname 127.0.0.1` → http://127.0.0.1:3000

## Skills instaladas

- **last30days-lite** — Research últimos 30 días (Reddit, X/Twitter, web)

## Twitter (via Roberto scripts)

- **Script**: `/Users/alfredpifi/clawd/workspace-roberto/scripts/twitter.sh`
- **Comandos**:
  - `twitter.sh search "<query>" [max]` — Buscar tweets recientes
  - `twitter.sh read <tweet_url>` — Leer tweet completo + thread
  - `twitter.sh leads "<query>" [max]` — Buscar leads en español
- **Auth**: AUTH_TOKEN + CT0 en ~/clawd/.env.local (cookies de Chrome)
- **Cuándo**: Morning brief (noticias relevantes), investigación ad-hoc, monitoreo competencia

## Google News

- **Script**: `/Users/alfredpifi/clawd/workspace-roberto/scripts/news.sh`
- **Comandos**:
  - `news.sh search "<query>" [max] [lang] [country]` — Buscar noticias recientes
- **Ejemplo**: `news.sh search "AI agents" 5 es ES`
- **Cuándo**: Morning brief, investigación de tendencias, contexto de mercado

## Last 30 Days Research

- **Script**: `/Users/alfredpifi/clawd/scripts/last30days.sh`
- **Uso**: `last30days.sh "<tema>" [idioma]`
- **Fuentes**: Google News (news.sh) + Twitter (twitter.sh) + Reddit (reddit.sh)
- **Output**: JSON consolidado con hallazgos de las 3 fuentes
- **Cuándo**: Investigación de temas recientes, trends rápidos, contexto para decisiones

## Vault (MEMORIA DEL DEPARTAMENTO)

- **Script**: `/Users/alfredpifi/clawd/scripts/vault.sh`
- **Vault dir**: `~/clawd/vault/` — archivos markdown con YAML frontmatter + `[[wiki-links]]`
- **Comandos**:
  - `vault.sh search "<query>"` — Buscar notas relevantes
  - `vault.sh read <slug>` — Leer nota completa
  - `vault.sh graph --entity <slug>` — Ver conexiones de una entidad
  - `vault.sh stats` — Estado general del vault
  - `vault.sh add <category> <title> [content] --tags t1,t2 --author Alfred` — Añadir nota
  - `vault.sh list [category]` — Listar notas (categorías: decisions, topics, people, formulas, lessons, trends, projects, preferences)
- **Cuándo**: Cuando Santi pregunte sobre algo que el departamento ya investigó. Cuando orquestes tareas, consulta el vault para dar contexto a Roberto/Andrés. En el informe semanal, usa `vault.sh graph` para mapear el conocimiento.

## Rutas clave

- Workspace: `/Users/alfredpifi/clawd`
- OpenClaw config: `~/.openclaw/openclaw.json`
- Cron jobs: `~/.openclaw/cron/jobs.json`
- Scripts: `/Users/alfredpifi/clawd/scripts/`

## Agentes del Departamento

| Agente | Modelo | Rol | Coste |
|--------|--------|-----|-------|
| **Roberto** | Haiku 4.5 (cloud) | Investigacion: news, YouTube, Twitter, Reddit, HN, IG | ~$4.50/mo |
| **Andres** | Haiku 4.5 (cloud) | Content Intelligence: analisis 5 capas, formulas, tendencias | ~$2/mo |
| **Marina** | GLM 4.7 Flash (local) | Content Creation: drafts multi-plataforma, hooks, carruseles | $0/mo |
| **Arturo** | GLM 4.7 Flash (local) | Performance: social analytics, benchmarking, anomalías | $0/mo |
| **Alex** | GLM 4.7 Flash (local) | Sales: ofertas, Skool, lanzamientos, email sequences | $0/mo |

- Roberto investiga → Andres analiza → Marina crea → Santi revisa
- Ver pipeline completo en AGENTS.md seccion "Pipeline de Contenido"
- Todos consultan vault antes de trabajar (VAULT-FIRST)

## Dashboard

- **Tab Docs**: docs del departamento + review system (aprobar/rechazar/revision)
- **Tab Social**: feed de investigacion + calendario de contenido + analytics
- **Boton "Crear Contenido"**: en docs research/analysis/report → crea tarea Marina con plataformas + notas
- **Review Toolbar**: en drafts → Aprobar / Pedir Revision (crea nueva tarea Marina) / Rechazar
- Cada review se guarda en vault automaticamente (tag: content-feedback)

## Workflow Orchestration Framework

**Fuente:** @mdancho84 (Feb 18, 2026) — Formalización de metodología departamento

### 1. Plan Mode Default
- Tareas 3+ pasos o decisiones arquitectónicas → PLAN FIRST
- Si algo se tuerce: STOP y re-planifica (no empujes)
- Plan mode para verificación, no solo construcción
- Specs detalladas upfront para reducir ambigüedad

### 2. Subagent Strategy
- Offload research, exploración, análisis paralelo a subagents (Roberto, Andrés)
- Mantiene main context limpio
- Problemas complejos = más compute vía subagents
- Un task per subagent para ejecución enfocada

### 3. Self-Improvement Loop
- Después de corrección del usuario: `tasks/lessons.md` + patrón
- Escribe reglas que prevengan el mismo error
- Itera ruthlessly en lecciones hasta error rate drops
- Review lecciones al inicio de sesión para proyecto relevante

### 4. Verification Before Done
- Nunca marques task como completa sin probar que funciona
- Diff behavior entre main y cambios cuando sea relevante
- Pregúntate: "¿Un staff engineer aprobaría esto?"
- Run tests, check logs, demuestra correctness

### 5. Demand Elegance (Balanced)
- Cambios no-triviales: pushback + "¿hay forma más elegante?"
- Si arreglo se ve hacky: implementa solución elegante AHORA
- Skip para fixes simples (no over-engineer)
- Challenge tu propio trabajo ANTES de presentarlo

### 6. Autonomous Bug Fixing
- Bug report = arrégla sin hand-holding
- Point at logs, errors, tests → resolve
- Zero contexto requerido del usuario
- Go fix failing CI tests sin que te digan cómo

### Task Management Pattern
1. **Plan First!** → `tasks/todo.md` con checkable items
2. **Verify Plans** → Check-in antes de implementar
3. **Track Progress** → Mark complete mientras avanzas
4. **Explain Changes** → Resumen high-level en cada paso
5. **Document Results** → Review section en `tasks/todo.md`
6. **Capture Lessons** → Update `tasks/lessons.md` post-correcciones

### Core Principles
- **Simplicity First**: Cambio más simple posible, impacto mínimo
- **Laziness Wins**: Root causes, no temporary fixes, senior developer standards
- **Minimal Impact**: Solo toca lo necesario, evita introducir bugs
