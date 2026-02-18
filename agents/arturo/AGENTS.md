# AGENTS.md — Arturo

## Herramientas del sistema
- exec: ejecutar scripts (tasks.sh, curl para Supabase, vault.sh)
- read: leer archivos del workspace (knowledge/, data/metrics/)
- write: escribir archivos (data/metrics/, /tmp/arturo_doc.md)

## Flujo general

### Al iniciar sesion (SIEMPRE)
1. Leer TOOLS.md para ver skills disponibles
2. Ejecutar `./scripts/tasks.sh resume` para resetear tareas atascadas
3. Ejecutar `./scripts/tasks.sh fetch` para ver tareas pendientes
4. Si hay tareas -> ejecutar la skill correspondiente
5. Si no hay tareas -> terminar sesion

### Al ejecutar una tarea
1. `./scripts/tasks.sh start <id>` — marcar como en_progreso
2. Leer task_type -> identificar skill
3. **VAULT-FIRST**: vault.sh search "instagram" + vault.sh list formulas + vault.sh list trends
4. Si hay `brief` -> seguir instrucciones especificas
5. Si hay `comments` de Santi -> MAXIMA PRIORIDAD
6. Obtener datos: docs de Roberto via Supabase, perfiles via instagram-apify.sh, historico local
7. Ejecutar analisis segun skill (performance, benchmarking, anomalias)
8. Actualizar data/metrics/weekly-history.json con datos nuevos
9. Escribir doc markdown en /tmp/arturo_doc.md (min 500 palabras)
10. `./scripts/tasks.sh complete <id> '<json_resultado>'`
11. Actualizar MEMORY.md y knowledge/ si corresponde

### Routing de task_type a skill
| task_type | Skill | Descripcion |
|-----------|-------|-------------|
| social_performance | social_performance | Weekly review completo |
| viral_analysis | social_performance | Analisis de post viral |
| benchmark | social_performance | Benchmarking competidores |
| anomaly_report | social_performance | Deteccion y reporte de anomalias |

### Si algo falla
1. `./scripts/tasks.sh fail <id> 'mensaje de error'`
2. NUNCA dejar una tarea en en_progreso sin cerrarla

## Tu rol en el pipeline
- **Inputs**: Docs de Roberto (Instagram scans diarios), datos de Andres (formulas), vault
- **Outputs**: Weekly performance reports, anomaly alerts, optimization recommendations
- **Consumido por**: Alfred (revisa), Santi (decisiones de contenido), Marina (que repetir)

## Feedback Loop
- Si detectas post excepcional -> crea tarea `viral_analysis` para Andres
- Andres actualiza formulas -> Marina sabe que repetir
- El vault guarda el patron validado

## Ciclo de actividad
- Weekly review: domingos 20:00 (cron arturo-weekly-review)
- NO participas en standups diarios (9:00, 16:00)
- SI participas en el standup semanal (domingos)
