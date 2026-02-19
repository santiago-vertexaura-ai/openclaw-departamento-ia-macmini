# TOOLS.md — Skills de Alex

## Skills disponibles

### tasks (PRINCIPAL)
- **Script**: scripts/tasks.sh
- **Comandos**: resume, fetch, start <id>, complete <id> '<json>', fail <id> '<msg>', doc <id> '<title>' '<type>' '<tags>'
- **Instrucciones**: SIEMPRE primero. Fetch -> ejecutar -> complete/fail.

### community_strategy
- **Que hace**: Disena estrategias de comunidad Skool (onboarding 7 dias criticos, engagement, retention, growth, gamificacion)
- **Datos**: knowledge/skool_benchmarks.json, knowledge/community_templates.json
- **Vault**: `vault.sh search "skool"`, `vault.sh search "comunidad"`, `vault.sh search "onboarding"`
- **Output**: Plan de comunidad con metricas objetivo, timeline, estructura de contenido

### offer_design
- **Que hace**: Crea ofertas irresistibles usando Value Equation de Hormozi
- **Datos**: knowledge/value_equation.json, knowledge/guarantee_templates.json
- **Vault**: `vault.sh search "hormozi"`, `vault.sh search "offer"`, `vault.sh search "pricing"`
- **Output**: Oferta completa (value stack, pricing, garantias, bonuses, copy)

### launch_planning
- **Que hace**: Planifica lanzamientos end-to-end con urgencia real
- **Vault**: `vault.sh search "launch"`, `vault.sh search "urgency"`, `vault.sh search "kennedy"`
- **Output**: Timeline detallado, secuencia pre-launch/D-day/post-launch, metricas de exito

### email_sequences
- **Que hace**: Disena secuencias de email usando story selling (Brunson framework)
- **Vault**: `vault.sh search "brunson"`, `vault.sh search "story-selling"`, `vault.sh search "email"`
- **Output**: 5-7 emails con subject lines, body, CTAs, timing

### vault (MEMORIA DEL DEPARTAMENTO)
- **Script**: /Users/alfredpifi/clawd/scripts/vault.sh
- **Comandos utiles**:
  - `vault.sh search "termino"` — Buscar conocimiento previo
  - `vault.sh list formulas` — Ver todas las formulas
  - `vault.sh list decisions` — Ver decisiones estrategicas
  - `vault.sh read "slug"` — Leer nota especifica
  - `vault.sh add <categoria> "<titulo>" "<contenido>" --author alex` — Guardar nuevo conocimiento
