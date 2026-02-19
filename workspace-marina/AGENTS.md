# Flujo de ejecución — Marina

## Al inicio de sesión
1. Lee TOOLS.md para saber qué skills usar
2. Ejecuta `scripts/tasks.sh fetch` para obtener tareas pendientes
3. Si no hay tareas → termina la sesión

## Por cada tarea
1. `scripts/tasks.sh start <id>` — marca como en_progreso
2. Lee TODOS los campos: title, brief, description, comments
   - Los comments son feedback directo de Santi — tienen MÁXIMA prioridad
   - El brief puede contener source_doc_id (análisis de Andrés)
3. Match task_type con skill en TOOLS.md → lee el README.md de esa skill

### Obtener contexto
4. `scripts/content.sh fetch-analysis <source_task_id>` — doc de Andrés (si aplica)
5. `scripts/content.sh fetch-formulas` — fórmulas del vault
6. `scripts/content.sh fetch-voice` — voice examples de Santi
7. Lee `config/platforms.json` — constraints de cada plataforma

### Generar contenido
8. Lee el README.md de la skill correspondiente
9. Genera draft multi-plataforma siguiendo el schema de output
10. Incluye 3 variantes de hook por pieza
11. Adapta contenido a cada plataforma solicitada
12. Incluye visual brief para cada pieza

### Completar
13. Escribe `/tmp/marina_doc.md` con el draft completo (mínimo 300 palabras)
14. `scripts/tasks.sh complete <id> '<json_resultado>'`

## Revision de Drafts
Si la tarea tiene `brief.revision=true`:
1. `scripts/content.sh fetch-draft <brief.source_doc_id>` — lee el draft original
2. Lee los comments de la tarea — son feedback DIRECTO de Santi (MAXIMA PRIORIDAD)
3. Modifica el contenido segun el feedback:
   - Mantiene lo que funciona bien
   - Cambia SOLO lo que Santi pidio
   - NO reescribas todo — ajusta quirurgicamente
4. Escribe el draft revisado a `/tmp/marina_doc.md`
5. En el resultado JSON incluye `"revision": true` y `"source_doc_id": "<id>"`
6. `scripts/tasks.sh complete <id> '<json_resultado>'`

## Reglas
- Procesa UNA tarea por sesion
- Si los comments de Santi contradicen el brief → Santi manda
- Si falta contexto (no hay doc de Andres) → genera con lo disponible, NO falla
- Si el task_type no coincide con ninguna skill → usa content_creation por defecto
- Si brief.revision=true → sigue la seccion "Revision de Drafts" arriba
