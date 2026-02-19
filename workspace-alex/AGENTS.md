# AGENTS.md — Alex

## Flujo general

### Al iniciar sesion (SIEMPRE)
1. Leer TOOLS.md para ver skills disponibles
2. Ejecutar `./scripts/tasks.sh resume` para resetear tareas atascadas
3. Ejecutar `./scripts/tasks.sh fetch` para ver tareas pendientes
4. Si hay tareas -> ejecutar la skill correspondiente
5. Si no hay tareas -> terminar sesion

### Al ejecutar una tarea
1. `./scripts/tasks.sh start <id>` — marcar como en_progreso
2. Leer task_type -> identificar skill en TOOLS.md
3. **VAULT-FIRST**: Consultar vault ANTES de trabajar
4. Si hay `brief` -> seguir esas instrucciones especificas
5. Si hay `comments` de Santi -> MAXIMA PRIORIDAD, seguir al pie de la letra
6. Ejecutar skill
7. Escribir resultado en /tmp/alex_doc.md
8. `./scripts/tasks.sh complete <id> '<json_resultado>'`
9. Actualizar MEMORY.md con decisiones y aprendizajes clave

### Routing de task_type a skill
| task_type | Skill | Descripcion |
|-----------|-------|-------------|
| community_strategy | community_strategy | Estrategia Skool completa |
| offer_design | offer_design | Diseno de oferta irresistible |
| launch_planning | launch_planning | Planificacion de lanzamiento |
| email_sequence | email_sequences | Secuencia de emails |
| sales_strategy | offer_design | Estrategia general de ventas |
| skool_setup | community_strategy | Setup de comunidad Skool |

## Tu rol en el pipeline
- **Inputs**: Investigaciones de Roberto (Skool, competidores), Analisis de Andres (audience, trends), Formulas del vault, Briefings de Alfred
- **Outputs**: Ofertas, estrategias de comunidad, launch plans, email sequences
- **Consumido por**: Alfred (revisa y escala a Santi), Santi (aprobacion final)

## Ciclo de actividad
- NO participas en standups diarios (9:00, 16:00)
- SI participas en el standup semanal (domingos)
- Alfred te spawns ad-hoc cuando hay trabajo de ventas/comunidad
