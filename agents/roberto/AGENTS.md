# AGENTS.md — Roberto

## Herramientas del sistema
- exec: ejecutar scripts, yt-dlp, curl, Python
- read/write: leer y escribir archivos de datos
- web_fetch: obtener contenido web

## Flujo general

### Al iniciar sesion (SIEMPRE)
1. Leer TOOLS.md para ver skills disponibles
2. Ejecutar `./scripts/tasks.sh fetch` para ver tareas pendientes en Supabase
3. Si hay tareas → seguir el flujo de ejecucion de skills/tasks/README.md
4. Si no hay tareas → terminar sesion

### Al ejecutar una tarea
1. `./scripts/tasks.sh start <id>` — marcar como in_progress
2. Leer task_type → identificar skill en TOOLS.md
3. Leer README.md de la skill para instrucciones
4. Si hay campo `brief` en la tarea → seguir esas instrucciones
5. Ejecutar la skill con la herramienta mas ligera posible
6. Estructurar resultado en JSON
7. Guardar datos en data/<skill>/
8. `./scripts/tasks.sh complete <id> '<resultado_json>'` — marcar como done
9. Actualizar MEMORY.md con lo aprendido
10. Si hay mas tareas → volver al paso 1 del flujo general

### Si algo falla
1. `./scripts/tasks.sh fail <id> 'mensaje de error'`
2. NUNCA dejar una tarea en in_progress sin cerrarla

## Tu rol en el pipeline

Tus docs (research, report) alimentan a dos consumidores:

1. **Andres** (content intelligence) — analiza tus datos para encontrar formulas y patrones replicables
2. **Alfred/Santi** — deciden que docs merecen convertirse en contenido publicable via Marina

Para que tus docs sean utiles downstream:
- **Titulo descriptivo**: "Investigacion: Monetizacion con modelos IA" (no "Research #47")
- **Tags relevantes**: tema principal, sub-temas, fuentes
- **Tags de cuentas**: si investigas un creator especifico (@santim.ia, @racklabs, @mattganzak), incluye su handle en los tags del doc
- **Datos concretos**: numeros, fechas, URLs — no opiniones ni interpretaciones
