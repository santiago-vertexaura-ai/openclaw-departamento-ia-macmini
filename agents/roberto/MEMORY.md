# MEMORY.md — Roberto

## Canales monitorizados
| Canal | Handle | Channel ID | Priority | Último scrape |
|-------|--------|-----------|----------|---------------|
| Alex Finn | @AlexFinnOfficial | UCfQNB91qRP_5ILeu_S_bSkg | high | — |
| Cole Medin | @ColeMedin | UCMwVTLZIRRUyyVrkjDpn4pA | high | — |
| Nate Herk | @NateHerk | UC2ojq-nuP8ceeHqiroeKhBA | high | — |
| Chase AI | @Chase-H-AI | UCoy6cTJ7Tg0dqS-DI-_REsA | medium | — |
| Jon Hernandez | @la_inteligencia_artificial | UCl5-lvQyfILb-l2abPk4Ntg | medium | — |

## Última ejecución
- **2026-02-12:** 6 investigaciones completadas (6.218 palabras totales) en ~2.5 horas
- **2026-02-13 00:03:** Intento bloqueado por allowlist missing en openclaw.json (error sessions_spawn)
- **2026-02-13 14:02:** SCAN VESPERTINO COMPLETO ejecutado por subagent
  - Tareas pendientes: 0 (pipeline limpio)
  - Análisis: 5 canales YouTube (25 vids) + News (10 fuentes) + Reddit (8 subs) + HN (10 stories) = 58 data points
  - Reportes generados: scan-vespertino-2026-02-13.md (253 líneas, 11K) + scan-summary-2026-02-13.json (8K)
  - Status: COMPLETADO ✅
- **2026-02-14 13:03:** INVESTIGACIÓN MERCADO SKOOL ESPAÑA (Task 02980852-1f8d-40e6-a58c-e8a801d6d427)
  - Documento: 4.115 palabras, estructura profesional con 11 secciones
  - Gap identificado: CERO comunidades Skool en español sobre Claude Code + OpenClaw = oportunidad perfecta
  - 5+ comunidades analizadas, pricing promedio 44€/mes, benchmarks documentados
  - Recomendaciones tácticas: pricing escalonado (25€ fundadores), email funnel 7 emails, 12 módulos
  - Target: 300+ miembros año 1, ingresos 100k€+
  - Siguiente fase: Andrés analiza patrones de éxito para playbook lanzamiento
  - Status: COMPLETADO ✅ (Auto-doc generado en Supabase)
- **2026-02-17 02:01:** SCAN MATUTINO COMPLETO (Subagent Roberto)
  - Tareas pendientes: 0 (sin queue, datos listos)
  - Análisis consolidado: YouTube (25 videos) + News (60+) + Reddit (80 posts) + HackerNews (140+)
  - Hallazgos críticos: 5 descubrimientos clave documentados
  - Cambio principal vs Feb 15: Posicionamiento recomendado = "Claude Code FIRST, not OpenClaw"
  - Nueva urgencia: Lanzar en 7 días (no 30), ventana competitiva se cierra 60-90 días
  - Recomendación táctica: Cambiar messaging copy para enfatizar seguridad Claude Code
  - Reportes generados: SCAN_MATUTINO_17FEB_2026_INFORME_EJECUTIVO.md (15K)
  - Status: COMPLETADO ✅

## Hallazgos recientes (Feb 6-17)
### Investigaciones completadas:
1. OpenClaw Architecture (869 palabras)
2. AI Marketing 2026 (1.242 palabras)
3. AI Agents Transition (1.267 palabras)
4. AI Agents Ecosystem (1.768 palabras) — incluye oportunidades VertexAura
5. MCP Protocol (508 palabras)
6. Spain AI Adoption (564 palabras)
7. **SCAN VESPERTINO (2026-02-13 14:02)** — Análisis completo multifuente
8. **SCAN MATUTINO (2026-02-17 02:01)** — Consolidación delta Feb 15-17

### TOP 5 HALLAZGOS DEL SCAN VESPERTINO (13 Feb):
1. **🚨 OpenClaw Security Crisis** (18k exposed devices, 15% malicious skills) → Opportunity window closing, action needed this week
2. **📈 Claude Code Exponential Adoption** (1.6k+ upvotes r/ClaudeAI, Spotify devs, $30B Anthropic funding) → Perfect positioning for VertexAura
3. **💰 Crypto AI Agent Economy Emerging** (Coinbase wallets, Super Bowl coverage, LN Agent Tools) → New vertical opportunity
4. **🎯 Influencer Ecosystem Consolidation** (Cole Medin, Nate Herk, Chase AI, Jon Hernandez) → Partnership strategy clear
5. **🔗 Tool Ecosystem Integration** (Firecrawl, 1Password, VirusTotal) → Partnerships needed

### TOP 5 HALLAZGOS DEL SCAN MATUTINO (17 Feb):
1. **🎓 Demanda Masiva Claude Code Education** (522 upvotes r/ClaudeAI "28 plugins", HN: 10+ threads multi-agent) → Market PIDE educación structured
2. **🔐 OpenClaw Security = VertexAura Opportunity** (HN: "Security-Risk Patterns" trending, VirusTotal partnership) → Reposition como "Claude Code SAFE" vs OpenClaw
3. **🌍 Spanish Market UNDEFENDED** (500M+ audience, CERO competitors in "Claude Code education Spanish") → First-mover advantage CRÍTICO
4. **💰 Pricing Psychology Confirms 47€** (r/SaaS: "distribution > perfection", "$12k/mes de 100 views") → No discount needed, quality signal
5. **🚀 Content Flywheel Mechanics Validated** (Member-generated content = organic growth loop, YouTube creators pivoting) → Build community incentives day 1

### Calidad: Excelente
- Contenido estructurado y accionable
- Patrones detectados en todos los análisis
- Relevancia directa para VertexAura (OpenClaw, AI adoption, MCP)

### Throughput: 2.400+ palabras/día cuando operativo

## Gotchas
- yt-dlp `--flat-playlist` devuelve campos null → NUNCA usar datos directamente
- Siempre usar `--dump-json` por vídeo individual para datos completos
- youtube-transcript-api: usar `api = YouTubeTranscriptApi(); api.fetch(id, languages=[...])`
- Alex Finn channel handle: `@AlexFinnOfficial` (no `@AlexFinn`)

## Instrucciones de Mejora (Feedback Santi - 15 Feb)

### VLM Local para Análisis Video
**Acción:** Investigar + implementar Qwen VLM local con GPU
- Santi tiene GPUs disponibles (DGX Spark o Mac mini M4)
- Beneficios: costes bajos (local), control total, sin APIs externas
- Aplicar a: análisis apps España (competencia multi-plataforma), análisis YouTube (transcripción + visual)
- Investigación inicial: Setup Qwen, infraestructura disponible, benchmarks velocidad vs Anthropic Vision

### Análisis Case Studies: NO Modelo Específico, SÍ Arquitectura
**Contexto:** Análisis Vadim feedback crítico. Aplicar a TODOS future case study analysis.
**NO hacer:** Centrarse en modelo específico (ej: "Opus 4.6 es el secreto")
**SÍ hacer:** Extraer 6 pilares replicables:
1. **Arquitectura equipo:** Orquestador + especialistas aislados + hub central
2. **Escalado agentes:** Cómo crece 1→3→6→9 agentes sin romper sistema
3. **Workflows monetizables:** Inputs → outputs que generan revenue
4. **Token strategy:** Modelo correcto por tarea, caching, prompts cortos. COSTES no son detalles, son estructura.
5. **Building-in-public:** Transparencia radical como motor distribución. Números reales, building imperfecto, fallos públicos.
6. **Trazabilidad + auditoría:** Visibilidad agentes (logs, fallos, costes/tokens), escalado sin perder control

**Plantilla análisis futuro:**
- P1: Desmentir "stack premium" (no es Opus 4.6, no es API fancy)
- P2-P6: Profundidad en cada pilar con ejemplos concretos y números
- Conclusión: Qué se puede replicar en Alfred/Roberto hoy mismo con recursos actuales

### Brief Mejorado para Investigaciones
**Cuando investigues case studies o empresas:**
- Incluir: "¿Cuál es el patrón replicable? ¿Qué recursos requiere? ¿Qué números públicos revelan?"
- Excluir: "¿Qué tecnología premium usan? ¿Cuál es su stack secreto?"
- Enfoque: Principios > herramientas. Arquitectura > tecnología.
