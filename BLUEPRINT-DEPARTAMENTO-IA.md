# BLUEPRINT COMPLETO: Departamento de IA - VertexAura
## Documento de Reconstruccion - 19 Febrero 2026

---

## 1. VISION GENERAL

### Que es esto?
Un **departamento de marketing de IA completamente autonomo** que opera 24/7 en un Mac Mini. 5 agentes de IA coordinados que investigan, analizan, crean contenido y gestionan redes sociales para la marca **@santim.ia / VertexAura**.

### Stack tecnologico
- **Framework**: OpenClaw (framework de agentes IA propietario)
- **Gateway**: Puerto 18789 (localhost), auth por token
- **Dashboard**: Next.js 15 + React 19 (puerto 3000)
- **Base de datos**: Supabase Cloud (tablas: `agent_tasks`, `agent_docs`, `agent_activity`)
- **Modelos**: Anthropic Claude Haiku 4.5 (cloud, ~$2/agente/mes) + Ollama GLM 4.7 Flash (local, $0)
- **TTS**: openai-edge-tts en puerto 5050 (Edge TTS local)
- **STT**: Whisper local
- **Vision**: Gemma3:27b via Ollama
- **Scraping IG**: Apify (plan free)
- **Hardware**: Mac Mini M4 (24/7)

### Costo mensual total: ~$55/mes
- Alfred (Haiku 4.5): ~$50/mes (orquestador principal)
- Andres (Haiku 4.5): ~$2/mes
- Roberto (GLM 4.7 Flash local): $0/mes
- Marina (GLM 4.7 Flash local): $0/mes
- CM (GLM 4.7 Flash local): $0/mes

---

## 2. ARQUITECTURA DE AGENTES

```
SANTI (humano) --> Telegram / Dashboard Chat
       |
       v
ALFRED (Haiku 4.5 / Sonnet para crons estrategicos)
  |  Orquestador central, toma decisiones, coordina todo
  |
  |---> ROBERTO (GLM 4.7 Flash local)
  |       Investigador. Busca datos en YouTube, News, Twitter, Reddit, HN, Instagram.
  |       SOLO recopila datos. NUNCA genera ideas ni contenido.
  |
  |---> ANDRES (Haiku 4.5 cloud)
  |       Content Intelligence. Analiza los datos de Roberto.
  |       Extrae formulas replicables, patrones, insights accionables.
  |       5 capas de analisis. Output JSON estructurado + doc markdown.
  |
  |---> MARINA (GLM 4.7 Flash local)
  |       Content Creator. Transforma analisis de Andres en contenido publicable.
  |       Multi-plataforma (Twitter, LinkedIn, Instagram).
  |       3 hooks por pieza. Aplica formulas del banco.
  |
  |---> CM (GLM 4.7 Flash local)
          Community Manager. Analisis semanal de performance social.
          Compara @santim.ia vs competidores. Reporte dominical.
```

### Pipeline de contenido completo
```
Roberto (investiga) --> agent_docs (Supabase)
          |
Alfred decide "crear contenido"
          |
          v
Andres (analiza datos Roberto) --> agent_docs (analisis)
          |
Alfred decide "crear contenido publicable"
          |
          v
Marina (crea contenido) --> content_calendar (Supabase)
          |
Cron sync cada 5 min --> Dashboard Social Calendar
          |
          v
Santi revisa: APPROVE / REVISE / REJECT
          |
Si REVISE --> nueva tarea Marina con feedback como comentarios
Si REJECT --> nueva tarea Marina urgente
Si APPROVE --> aparece en calendario, Santi publica manualmente
```

---

## 3. DETALLE POR AGENTE

### 3.1 ALFRED - El Orquestador

**Modelo**: Haiku 4.5 (default), Sonnet para 4 crons estrategicos
**Workspace**: `~/clawd/`
**Rol**: COO del departamento. Orquesta, delega, decide.

**Personalidad (SOUL.md)**:
- Piensa en sistemas, no en tareas
- Busca impacto sobre perfeccion
- Proactivo: actua sin pedir permiso cuando puede aportar valor sin riesgo
- Directo, calmo, orientado a soluciones
- Avatar: langosta

**Jerarquia de decisiones**:
- **Actua solo**: Si es reversible, sin riesgo, claramente positivo, mejora interna
- **Consulta a Santi**: Si implica gasto, es visible a terceros, afecta estrategia, riesgo de perdida de datos

**Ritmo diario**:
- 08:30: Morning Brief (audio Telegram)
- 09:00: Proactive Leader (decisiones de contenido, revision estrategia)
- 10:00: Roberto IG scan (datos Instagram)
- Cada 30 min: polls de tareas (Roberto, Andres, Marina)
- 16:00: Afternoon check
- 22:00: Evening Review (audio Telegram)
- 23:00: Diario nocturno

**Routing de tareas**:
| Tipo | Agente |
|------|--------|
| Investigar/buscar datos | Roberto |
| Analizar docs para patrones/formulas | Andres |
| Crear contenido publicable | Marina |
| Config/sistema/infraestructura | Alfred |

**4 crons con Sonnet** (el resto Haiku):
1. `morning-brief-santi` - Brief matutino
2. `alfred-evening-review` - Revision nocturna
3. `alfred-proactive-leader` - Liderazgo proactivo
4. `alfred-weekly-report` - Reporte semanal

### 3.2 ROBERTO - El Investigador

**Modelo**: `ollama/glm-4.7-flash` (local, 32K context, $0/mes)
**Workspace**: `~/clawd/workspace-roberto/`
**Rol**: Ojos y oidos del equipo. SOLO recopila datos. NUNCA genera ideas.

**Skills (10)**:
1. **tasks** (principal) - Motor de ejecucion de tareas via Supabase
2. **youtube** - yt-dlp + transcripciones + analisis de canales
3. **news** - Google News RSS (gratis, sin API key)
4. **twitter** - Bird CLI (busqueda, lectura, deteccion de leads)
5. **reddit** - Reddit JSON API (publico, sin auth)
6. **hackernews** - Algolia HN API
7. **instagram** - Apify (scraping) + visual-analysis.sh (ffmpeg + OCR + Gemma3 + Whisper)
8. **reports** - Reportes diarios/semanales consolidados
9. **last30days** - Investigacion de temas recientes (web + Reddit + Twitter)
10. **placeholder** - Skills futuras

**Canales YouTube monitorizados**: Alex Finn, Cole Medin, Nate Herk, Chase AI, Jon Hernandez
**Cuentas Instagram**: @santim.ia, @rackslabs, @mattganzak
**Subreddits**: r/artificial, r/MachineLearning, r/LocalLLaMA, r/ClaudeAI, r/ChatGPT, r/SaaS, r/startups, r/marketing

**Output obligatorio**: Para research/news_scan/report/youtube_analysis DEBE escribir `/tmp/roberto_doc.md` (min 500 palabras con TODOS los datos). Sin documento = tarea fallida.

**Reglas criticas**:
- Anti-alucinacion: SOLO reporta datos EXPLICITAMENTE en la fuente
- Si dato falta: "not available", NUNCA inventa
- Prefiere menos datos correctos > mas datos inventados
- Cada dato trazable a fuente concreta con URL

### 3.3 ANDRES - Content Intelligence

**Modelo**: `anthropic/claude-haiku-4-5` (cloud, ~$2/mes)
**Workspace**: `~/clawd/workspace-andres/`
**Rol**: Cerebro analitico. Transforma datos crudos de Roberto en inteligencia accionable.

**NOTA CRITICA**: Modelos locales de Ollama NO funcionan con el sistema de tools de OpenClaw (phi4, qwen2.5-coder fallan). Andres DEBE usar modelo cloud.

**Skills (5)**:
1. **tasks** (principal) - Motor de ejecucion
2. **content_intelligence** (principal) - Analisis 5 capas
3. **formula_bank** - Banco de formulas replicables con scoring
4. **feedback_analysis** - Analisis post-publicacion para refinar formulas
5. **trend_tracking** - Deteccion de tendencias emergentes vs declinantes

**Analisis de 5 capas**:
1. **Content Anatomy**: Hooks, estructura emocional, formato tecnico
2. **Replicable Formulas**: Templates paso a paso que Marina llena sin pensar estrategia
3. **Audience Intelligence**: Quien interactua, lenguaje que usan, objeciones, momentos receptivos
4. **Competitive Intelligence**: Que funciona a competidores, gaps que nadie cubre
5. **Metrics & Trends**: Numeros concretos, direccion de tendencia, senales de mercado

**Banco de formulas** (formula_bank.json):
- Tiers: A (8-10, usar frecuentemente), B (5-7, usar regularmente), C (2-4, rotar), D (0-1, archivar)
- Cada formula tiene: plantilla, cuando usar, ejemplo original, ejemplo VertexAura, score, usos
- Scores SOLO se actualizan con metricas reales (feedback_analysis), NUNCA estimaciones

**Clasificacion Schwartz de awareness**:
- Level 1 UNAWARE: No saben que tienen problema
- Level 2 PROBLEM-AWARE: Saben el problema, no soluciones
- Level 3 SOLUTION-AWARE: Saben que hay soluciones, no la nuestra
- Level 4 PRODUCT-AWARE: Conocen nuestra solucion, no han comprado
- Level 5 MOST-AWARE: Nos conocen, confian, listos para comprar

**Output**: JSON estructurado + doc markdown (min 500 palabras). Anti-alucinacion estricto.

### 3.4 MARINA - Content Creator

**Modelo**: `ollama/glm-4.7-flash` (local, $0/mes)
**Workspace**: `~/clawd/workspace-marina/`
**Rol**: Transforma analisis en contenido publicable que suena como Santi.

**Skills (7)**:
1. **tasks** (principal) - Motor de ejecucion
2. **content_creation** (principal) - Creacion multi-plataforma
3. **hook_adaptation** - Adaptacion de hooks entre plataformas
4. **carousel_creator** - Carruseles para LinkedIn/Instagram
5. **thread_writer** - Hilos de Twitter/X
6. **repurposing** - Reformular contenido existente para otros formatos
7. **trend_reaction** - Contenido reactivo a tendencias/tweets virales

**Output por tarea**:
1. 3 variantes de hook (escritas, no descritas)
2. Cuerpo adaptado por plataforma (NO copy-paste)
3. CTA especifico por plataforma
4. Hashtags/keywords
5. Visual brief

**Cadencia objetivo (MINIMOS)**:
- Twitter/X: 3 posts/dia (1 hilo + 2 standalone)
- LinkedIn: 2 posts/semana (1 narrativo + 1 framework)
- Instagram: 3 posts/semana (1 carrusel + 1 reel script + 1 caption)

**Reglas criticas**:
- Comentarios de Santi = MAXIMA PRIORIDAD (override todo lo demas)
- VAULT-FIRST: Siempre consulta formulas/patrones antes de crear
- Voz de marca: Autentica, como si Santi escribiera
- Anti-alucinacion: Solo datos de docs fuente, NUNCA inventa stats
- Aprendizaje progresivo: Borradores aprobados se agregan a voice_examples.json

**Frameworks de marketing**:
- Hormozi Twitter Hooks
- Viral Thread Formula
- Brunson LinkedIn Narrative
- Gary Vee Content Pyramid
- Gary Vee Instagram Formats
- Schwartz Awareness Levels
- Regla: Aplicar AL MENOS UN framework nombrado por pieza de contenido

### 3.5 CM - Community Manager

**Modelo**: `ollama/glm-4.7-flash` (local, $0/mes)
**Workspace**: configurado en `~/.openclaw/agents/cm/`
**Rol**: Analisis semanal de performance social de @santim.ia vs competidores
**Cron**: Domingos 20:00
**Output**: Reporte semanal en Supabase (performance, top/bottom posts, recomendaciones)

---

## 4. INFRAESTRUCTURA TECNICA

### 4.1 Supabase (Base de datos cloud)
- **URL**: `xacthbehposxdrfqajwz.supabase.co`
- **Tablas**:
  - `agent_tasks`: Tareas asignadas a agentes (CRUD via REST API)
  - `agent_docs`: Documentos generados (research, analysis, draft, report, journal)
  - `agent_activity`: Log de actividad
  - `content_calendar`: Calendario de contenido (Marina -> Dashboard)
- **CRITICO**: `agent_docs` tiene RLS sin policies -> usar service_role key
- **CRITICO**: `assigned_to` DEBE ser lowercase (marina, no Marina) o crons no detectan

### 4.2 Scripts principales (`~/clawd/scripts/`)
- `tasks.sh` - CRUD de tareas en Supabase (cada agente tiene su fork)
- `vault.sh` - Gestion del Vault (add/link/search/graph/index/decay)
- `vault-ingest.sh` - Auto-ingesta al vault desde tareas completadas
- `instagram-apify.sh` - Scraping de Instagram via Apify
- `visual-analysis.sh` - Pipeline visual (ffmpeg + OCR + Gemma3 + Whisper)
- `kanban-sync.sh` - Sincronizacion Kanban <-> Supabase
- `sync-marina-tasks-to-calendar.sh` - Marina -> content_calendar (cada 5 min)
- `dedup-task.sh` - Deduplicacion de tareas
- `say-alfred.sh` - TTS de Alfred

### 4.3 Vault (Sistema de memoria)
- **Ubicacion**: `~/clawd/vault/`
- **Formato**: Markdown con YAML frontmatter + `[[wiki-links]]`
- **Categorias**: decisions, topics, people, formulas, lessons, trends, projects, preferences
- **Script**: `vault.sh` (add/link/search/graph/index/decay/read/list/stats)
- **Integracion**: `vault-ingest.sh` se ejecuta automaticamente al completar tareas
- **Dashboard**: Grafo interactivo force-directed en Canvas (tab Vault)

### 4.4 Cron Jobs (16+ jobs en `~/.openclaw/cron/jobs.json`)

| Job | Frecuencia | Modelo | Proposito |
|-----|-----------|--------|-----------|
| morning-brief-santi | 08:30 diario | Sonnet | Audio brief matutino |
| alfred-proactive-leader | 09:00 diario | Sonnet | Decisiones de contenido |
| roberto-ig-scan | 10:00 diario | Haiku | Scraping Instagram |
| roberto-morning-scan | 09:30 diario | Haiku | Scan YouTube/News |
| roberto-afternoon-scan | 15:00 diario | Haiku | Scan Twitter/Reddit |
| roberto-task-poll | cada 30 min | Haiku | Ejecutar tareas Roberto |
| andres-task-poll | cada 30 min | Haiku | Ejecutar tareas Andres |
| marina-task-poll | cada 30 min | Haiku | Ejecutar tareas Marina |
| alfred-evening-review | 22:00 diario | Sonnet | Review nocturno audio |
| daily-diary | 23:00 diario | Haiku | Diario del dia |
| alfred-weekly-report | Domingos | Sonnet | Reporte semanal |
| memory-digest-weekly | Domingos | Haiku | Digest de memoria |
| cm-weekly-review | Domingos 20:00 | Haiku | Analisis social semanal |
| security-audit-8h | cada 8h | Haiku | Auditoria de seguridad |
| memory-cleanup-monthly | mensual | Haiku | Limpieza de memoria |

**Notas criticas de cron**:
- Campo `"expr"` (NO `"cron"`) para expresiones 5-field
- `delivery.channel` DEBE estar presente incluso para modo `"silent"`
- Gateway cachea jobs en memoria -> REINICIAR gateway despues de editar jobs.json
- Paths ABSOLUTOS (gateway no ejecuta desde ~/clawd/)

### 4.5 LaunchAgents (macOS daemons)
- `ai.openclaw.gateway.plist` - Gateway principal
- `ai.openclaw.edge-tts.plist` - Servicio TTS
- `ai.openclaw.status-watcher.plist` - Monitor de estado multi-agente
- `ai.openclaw.poll-guard-*.plist` - Guards para polls de cada agente
- `ai.openclaw.auto-doc.plist` - Auto-documentacion

### 4.6 OpenClaw Config (`~/.openclaw/openclaw.json`)
- Model routing: provider anthropic (Haiku/Sonnet) + provider ollama (GLM 4.7 Flash)
- Tools: read, exec, write, edit, browser, assistant
- TTS: openai-edge-tts en puerto 5050
- Gateway: puerto 18789, auth por token
- Compaction: memoryFlush como OBJETO `{ "enabled": true, "softThresholdTokens": 4000 }`
- Session timeout: 3600s para Roberto

---

## 5. DASHBOARD (Next.js 15 + React 19)

**Ubicacion**: `~/clawd/alfred-dashboard/`
**Puerto**: 3000 (con `--hostname 0.0.0.0` para acceso remoto)
**HTTPS**: Proxy en puerto 3443 (self-signed cert, LaunchAgent)

### 8 Tabs:
1. **Centro de Mandos** (default): KPI bar + AgentCards + ActivityFeed + SystemHealth
2. **Chat**: SSE streaming via gateway REST proxy
3. **Tareas**: Kanban board sincronizado con Supabase
4. **Cron Jobs**: Visualizacion y gestion de cron jobs
5. **Docs**: Documentos de agentes con badges de review
6. **Oficina 3D**: Oficina Sims-style con React Three Fiber v9
7. **Vault**: Grafo interactivo force-directed de memoria
8. **Social**: Calendario social + Content Calendar Manager

### Oficina 3D (React Three Fiber v9 + drei v10 + three.js 0.170)
- Agentes humanoides con colores unicos moviendose autonomamente
- 5 salas: Cubiculos (trabajo), Sala de Reuniones, Despacho de Santi, Cocina, Lounge
- Interacciones: chat entre agentes, cafe (solo en cocina, cooldown 3h), supervisar
- Objetos en escritorios (monitores, tazas, plantas)
- Confetti al completar tareas
- Camera presets para navegar a cada sala
- Minimapa
- Puertas con marcos
- Focus mode: click agente -> tooltip, click otra vez -> zoom

### Paleta visual
- Background: `#0A0A0B`
- Cards: `#141416`
- Borders: `#27272A`
- Estilo: dark premium

### API Routes
- `/api/status` - Estado de agentes
- `/api/activity` - Feed de actividad
- `/api/agent-files` - Archivos de configuracion de agentes
- `/api/health` - Health check del sistema
- `/api/chat` - Proxy SSE al gateway
- `/api/vault` - Grafo del vault
- `/api/tasks` - CRUD de tareas
- `/api/cron` - Gestion de crons
- `/api/docs` - Documentos
- `/api/content-calendar` - Calendario de contenido
- `/api/social/*` - Analytics y feed social

---

## 6. FILOSOFIA DEL DEPARTAMENTO

### 5 Principios universales (todos los agentes):
1. **"No puedo" NO existe** - Buscar web, consultar docs, APIs. Min 2 fuentes antes de rendirse.
2. **Proactividad** - No esperar ordenes. Detectar mejoras. Proponerlas.
3. **Auto-mejora** - Cada tarea = oportunidad de aprendizaje. Registrar lecciones.
4. **Comunicacion estrategica** - Como hacer la vida de Santi mas facil?
5. **Nunca mentir** - Si no hay datos, decirlo. Si no esta seguro, decirlo.

### VAULT-FIRST Protocol (todos los agentes):
- Consultar vault ANTES de ejecutar cualquier tarea
- No duplicar trabajo ya hecho
- Guardar decisiones/contexto/preferencias automaticamente
- Usar `vault.sh search` antes de crear trabajo nuevo

### Anti-alucinacion (todos los agentes):
- SOLO reportar datos EXPLICITAMENTE en las fuentes
- Si dato falta: "not available", NUNCA inventar
- Cada afirmacion trazable a fuente concreta
- Preferir menos datos correctos > mas datos inventados
- Muestras pequenas (N<5): declarar explicitamente

---

## 7. VISION DE PROACTIVIDAD (Roadmap)

### Problema actual (reactivo):
- 30+ min de latencia entre pasos
- Santi debe aprobar casi todo
- Agentes no se comunican entre si
- Oportunidades perdidas

### Solucion propuesta (proactivo):
- **Comunicacion en tiempo real**: Roberto -> Andres -> Marina -> Santi (<10 min latencia)
- **Alfred toma decisiones autonomas**: Content score >= 8, research <$100, optimizacion interna
- **Roberto detecta oportunidades**: Auto-actua si score >= 7
- **Proyectos paralelos**: 3+ proyectos simultaneamente

### 4 Fases de implementacion:
- **Fase 1** (Semana 1-2): Comunicacion inter-agentes
- **Fase 2** (Semana 2-3): Autonomia de Alfred (matriz de decisiones + scoring + log)
- **Fase 3** (Semana 3-4): Proactividad de Roberto (auto-deteccion con scoring)
- **Fase 4** (Semana 4+): Proyectos paralelos (3+ simultaneamente)

### Metricas objetivo:
| Metrica | Actual | Objetivo |
|---------|--------|----------|
| Latencia contenido | 30+ min | <10 min |
| Decisiones autonomas | 0% | 40% |
| Oportunidades/semana | 0 | 3-5 |
| Proyectos activos | 1 | 3+ |
| Horas productivas/dia | 8 | 24 |

---

## 8. PITFALLS Y LECCIONES APRENDIDAS

### Modelos locales y OpenClaw:
- **phi4-reasoning**: Devuelve 400 "does not support tools" -> NO USAR
- **qwen2.5-coder-tools**: Acepta tools pero no los usa -> NO USAR
- **glm-4.7-flash**: FUNCIONA con tools de OpenClaw (verificado Feb 16 2026)
- **Regla**: Para agentes que necesitan tools, usar GLM 4.7 Flash (local) o modelos cloud

### macOS:
- `grep -P` no disponible -> usar `sed -n` o python
- `${VAR,,}` (lowercase bash 4+) falla en zsh default -> usar `echo "$VAR" | tr '[:upper:]' '[:lower:]'`
- LaunchAgent: KeepAlive + RunAtLoad para servicios persistentes, StartInterval SOLO para periodicos

### Next.js / React:
- React Three Fiber v8 + Next.js 15 = error `ReactCurrentBatchConfig` -> Upgrade a React 19 + R3F v9
- `useRef()` sin argumento = type error en React 19 -> usar `useRef(null)`
- tsconfig paths: `"@/*": ["./src/*"]` (no `"./*"`)
- Chrome headless + `--disable-gpu` = sin WebGL -> usar `--use-gl=angle --enable-unsafe-swiftshader`

### OpenClaw:
- `compaction.memoryFlush` DEBE ser OBJETO, no boolean
- `tools.allow` DEBE incluir `"assistant"` o heartbeat falla
- Gateway cachea cron jobs -> REINICIAR despues de editar jobs.json
- Paths en jobs.json DEBEN ser absolutos
- `"expr"` NO `"cron"` para expresiones cron

### Supabase:
- `agent_docs` tiene RLS sin policies -> usar service_role key
- `agent_tasks` POST requiere campo `created_by`
- Conexion directa DB poco fiable -> usar REST API

### Scraping:
- yt-dlp exit code 101: A menudo datos validos pese al error -> usar youtube.sh wrapper
- yt-dlp JSON para 5 videos = 221K tokens (excede 200K de Haiku) -> usar youtube.sh list (RSS)
- Google News RSS requiere header `-A "Mozilla/5.0"`
- Edge TTS solo soporta MP3/WebM (NO ogg)
- Apify plan free para Instagram scraping

---

## 9. ESTRUCTURA DE ARCHIVOS CLAVE

```
~/clawd/                           # Workspace principal (Alfred)
  ├── SOUL.md                      # Alma de Alfred
  ├── AGENTS.md                    # Protocolo operativo
  ├── IDENTITY.md                  # Identidad
  ├── MEMORY.md                    # Memoria persistente
  ├── TOOLS.md                     # Herramientas disponibles
  ├── USER.md                      # Info sobre Santi
  ├── .env.local                   # SECRETS (no en git)
  ├── agents-status.json           # Estado multi-agente (runtime)
  ├── cost-ledger.json             # Costos (runtime)
  ├── vault/                       # Sistema de memoria
  │   ├── _index.md                # Indice del vault
  │   ├── decisions/               # Decisiones tomadas
  │   ├── lessons/                 # Lecciones aprendidas
  │   ├── preferences/             # Preferencias de Santi
  │   ├── projects/                # Proyectos activos
  │   ├── topics/                  # Temas relevantes
  │   ├── formulas/                # Formulas de contenido
  │   ├── people/                  # Personas relevantes
  │   └── trends/                  # Tendencias detectadas
  ├── scripts/                     # Scripts operativos
  ├── memory/                      # Diarios (YYYY-MM-DD.md)
  ├── alfred-dashboard/            # Dashboard Next.js
  │   ├── src/components/
  │   │   ├── centro/              # Centro de Mandos
  │   │   ├── chat/                # Chat con Alfred
  │   │   ├── oficina/             # Oficina 3D
  │   │   ├── vault/               # Visualizacion Vault
  │   │   └── social/              # Calendario Social
  │   └── src/app/api/             # API routes
  ├── workspace-roberto/           # Workspace Roberto
  │   ├── SOUL.md, TOOLS.md, etc.
  │   ├── skills/                  # Skills (youtube, news, etc.)
  │   ├── scripts/                 # tasks.sh, youtube.sh, etc.
  │   ├── config/                  # keywords_tiers.json
  │   └── data/                    # Datos recopilados
  ├── workspace-andres/            # Workspace Andres
  │   ├── SOUL.md, TOOLS.md, etc.
  │   ├── skills/                  # Skills (content_intelligence, etc.)
  │   ├── scripts/                 # tasks.sh, docs.sh, metrics.sh
  │   └── knowledge/               # formula_bank.json, audience_profile.json
  ├── workspace-marina/            # Workspace Marina
  │   ├── SOUL.md, TOOLS.md, etc.
  │   ├── skills/                  # Skills (content_creation, etc.)
  │   ├── scripts/                 # tasks.sh, content.sh
  │   └── knowledge/               # voice_examples.json, platforms.json
  └── openclaw-config/             # Backup de configs OpenClaw
      ├── openclaw.json            # Config principal
      ├── cron/jobs.json           # Cron jobs
      ├── agents/                  # models.json por agente
      └── launchagents/            # plists macOS

~/.openclaw/                       # Config OpenClaw (fuera del repo)
  ├── openclaw.json                # Config principal (ACTIVA)
  ├── cron/jobs.json               # Cron jobs (ACTIVOS)
  ├── agents/                      # Configs por agente
  ├── devices/                     # Auth de dispositivos
  ├── identity/                    # Identidad gateway
  └── telegram/                    # Sesion Telegram
```

---

## 10. COMO RECONSTRUIR DESDE CERO

### Paso 1: Clonar repo
```bash
git clone https://github.com/santiago-vertexaura-ai/openclaw-departamento-ia-macmini.git clawd
cd clawd
```

### Paso 2: Configurar secrets
```bash
# Crear .env.local con:
SUPABASE_URL=https://xacthbehposxdrfqajwz.supabase.co
SUPABASE_KEY=<service_role_key>
SUPABASE_ANON_KEY=<anon_key>
ANTHROPIC_API_KEY=<api_key>
APIFY_API_KEY=<api_key>
GATEWAY_TOKEN=<token>
AUTH_TOKEN=<twitter_auth_token>
CT0=<twitter_ct0>
```

### Paso 3: Instalar OpenClaw
```bash
# Instalar OpenClaw (seguir docs oficiales)
# Copiar configs:
cp openclaw-config/openclaw.json ~/.openclaw/openclaw.json
cp openclaw-config/cron/jobs.json ~/.openclaw/cron/jobs.json
# Rellenar [REDACTED] con tokens reales
```

### Paso 4: Instalar dependencias
```bash
cd alfred-dashboard && npm install && npx next build
# Instalar Ollama + descargar glm-4.7-flash
ollama pull glm4:latest  # o como se llame el modelo
```

### Paso 5: Configurar LaunchAgents
```bash
cp openclaw-config/launchagents/*.plist ~/Library/LaunchAgents/
# Editar paths si cambian
# Cargar:
launchctl load ~/Library/LaunchAgents/ai.openclaw.*.plist
```

### Paso 6: Iniciar servicios
```bash
# Gateway (via LaunchAgent o manual)
# Dashboard:
cd ~/clawd/alfred-dashboard && npx next start --hostname 0.0.0.0
# TTS:
# Se inicia via LaunchAgent
```

### Paso 7: Verificar
```bash
curl http://localhost:18789/health  # Gateway
curl http://localhost:3000          # Dashboard
curl http://localhost:5050/health   # TTS
ollama list                         # Modelos locales
```

---

*Documento generado el 19 de Febrero de 2026. Repo: github.com/santiago-vertexaura-ai/openclaw-departamento-ia-macmini*
