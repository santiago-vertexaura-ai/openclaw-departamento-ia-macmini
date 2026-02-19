# TOOLS.md — Skills de Andrés

## Skills disponibles

### content_intelligence (PRINCIPAL)
- **Qué hace**: Análisis de 5 capas de contenido: anatomía, fórmulas, audiencia, competencia, tendencias
- **Instrucciones**: skills/content_intelligence/README.md
- **Scripts**: docs.sh (leer fuentes), metrics.sh (cálculos), validate-output.sh (validar)
- **Output**: JSON estructurado + markdown para agent_docs
- **Cuándo**: Para cualquier tarea de tipo `analysis`, `content_analysis`, `viral_analysis`

### formula_bank
- **Qué hace**: Mantiene y actualiza el banco de fórmulas replicables
- **Instrucciones**: skills/formula_bank/README.md
- **Datos**: knowledge/formula_bank.json
- **Cuándo**: Después de cada análisis, actualizar fórmulas. Para tarea tipo `formula_update`

### trend_tracking
- **Qué hace**: Detecta tendencias emergentes/declinantes comparando datos temporales
- **Instrucciones**: skills/trend_tracking/README.md
- **Datos**: knowledge/trend_history.jsonl, data/snapshots/
- **Cuándo**: Weekly brief, tarea tipo `trend_analysis`

### feedback_analysis
- **Qué hace**: Analiza métricas post-publicación para refinar fórmulas
- **Instrucciones**: skills/feedback_analysis/README.md
- **Datos**: knowledge/formula_bank.json (actualiza scores)
- **Cuándo**: Cuando Roberto trae métricas de contenido publicado, tarea tipo `feedback`

### vault (MEMORIA DEL DEPARTAMENTO)
- **Qué hace**: Consulta la memoria colectiva del departamento para enriquecer análisis
- **Script**: /Users/alfredpifi/clawd/scripts/vault.sh
- **Comandos útiles**:
  - `vault.sh search "<query>"` — Buscar notas relevantes
  - `vault.sh read <slug>` — Leer nota completa
  - `vault.sh graph --entity <slug> --hops 2` — Ver conexiones
  - `vault.sh list formulas` — Ver fórmulas existentes
  - `vault.sh list trends` — Ver tendencias detectadas
- **Cuándo**: ANTES de cada análisis. Si hay fórmulas, tendencias o perfiles de audiencia previos, ÚSALOS como base — no empieces de cero.

### tasks
- **Qué hace**: Gestión de tareas via Supabase
- **Instrucciones**: skills/tasks/README.md
- **Script**: scripts/tasks.sh
- **Cuándo**: SIEMPRE — es el entry point de toda sesión

## Routing: task_type → Skill

| task_type | Skill | Qué hacer |
|-----------|-------|-----------|
| `analysis` | content_intelligence | Análisis 5 capas completo |
| `content_analysis` | content_intelligence | Análisis 5 capas completo |
| `viral_analysis` | content_intelligence | Foco en capa 1 y 2 (hooks y fórmulas) |
| `trend_analysis` | trend_tracking | Comparar con histórico, detectar emergentes |
| `weekly_brief` | content_intelligence + trend_tracking | Análisis semanal cross-document |
| `formula_update` | formula_bank | Actualizar banco con nuevas fórmulas |
| `feedback` | feedback_analysis | Analizar métricas post-publicación |
