# Skill: Tasks (Gestion de Tareas via Supabase)

## Descripcion
Esta es tu skill PRINCIPAL. Antes de ejecutar cualquier otra skill, debes revisar si tienes tareas pendientes en Supabase.

## Herramienta
Script: `workspace-roberto/scripts/tasks.sh`

### Comandos disponibles

```bash
# Ver tareas pendientes (ordenadas por prioridad: urgente > alta > media > baja)
workspace-roberto/scripts/tasks.sh fetch

# Marcar tarea como en progreso (SIEMPRE antes de empezar a ejecutar)
workspace-roberto/scripts/tasks.sh start <task_id>

# Marcar tarea como completada con resultado JSON
workspace-roberto/scripts/tasks.sh complete <task_id> '{"summary":"...","file_path":"...","items_count":N}'

# Marcar tarea como fallida con mensaje de error
workspace-roberto/scripts/tasks.sh fail <task_id> 'descripcion del error'

# Crear documento (OBLIGATORIO para research, news_scan, report)
# El contenido markdown se pasa via stdin (pipe)
echo 'contenido markdown extenso...' | workspace-roberto/scripts/tasks.sh doc <task_id> '<titulo>' '<doc_type>' '["tag1","tag2"]'
```

## ⚠️ REGLA CRITICA: Documento obligatorio

**Para TODA tarea de tipo `research`, `news_scan`, `report` o `youtube_analysis`:**

1. ANTES de ejecutar `workspace-roberto/scripts/tasks.sh complete`, DEBES escribir `/tmp/roberto_doc.md`
2. El documento debe tener minimo 500 palabras con TODA la informacion recopilada
3. Si no creas el doc, la tarea se considera INCOMPLETA — otro agente tendra que rehacerla
4. El doc se sube automaticamente a Supabase al ejecutar `complete`

**Sin documento = tarea fallida.** No hay excepciones.

## Routing: task_type → Skill

| task_type | Skill | Que hacer |
|-----------|-------|-----------|
| `youtube_analysis` | youtube | Ejecutar pipeline yt-dlp segun `brief`. Si no hay brief, analizar ultimos videos del canal indicado en `title` |
| `news_scan` | news | Buscar en Google News RSS. El tema esta en `title` y/o `brief` |
| `report` | reports | Generar daily o weekly segun lo indicado en `brief` |
| `research` | news + web_fetch | Investigacion generica: combinar Google News + web_fetch para recopilar datos |
| `twitter_scan` | twitter | PENDIENTE — no ejecutar hasta que se configure bird CLI |

## Contexto de la tarea

Cada tarea tiene varios campos con informacion. Leelos TODOS antes de ejecutar:

| Campo | Para que sirve |
|-------|---------------|
| `title` | Resumen corto de lo que hay que hacer |
| `brief` | Instrucciones detalladas (JSON). Si existe, tiene prioridad sobre title |
| `description` | Contexto adicional escrito por el humano. Puede contener detalles, matices o restricciones |
| `comments` | Array de comentarios del equipo. Pueden contener aclaraciones, cambios de alcance o info extra |

**Orden de prioridad:** `brief` > `description` > `title`. Usa todo lo que este disponible.

## OBLIGATORIO: Crear documento EXTENSO para research/news_scan/report/youtube_analysis

Para task_type `research`, `news_scan`, `report` o `youtube_analysis`, SIEMPRE debes crear un documento markdown EXTENSO ANTES de completar la tarea.
Sin documento = tarea INCOMPLETA. No ejecutes `complete` sin haber creado el doc primero.

### Requisitos del documento

El documento markdown debe contener **TODA la informacion recopilada** con maximo detalle:
- **Titulos y fechas** de cada fuente consultada
- **URLs completas** de cada fuente
- **Citas textuales** de fragmentos relevantes
- **Datos crudos**: numeros, estadisticas, nombres, fechas exactas
- **Transcripciones relevantes** (para YouTube)
- **Contexto**: quien dijo que, cuando, donde

**Minimo 500 palabras** para research/news_scan. Sin limite superior — mas detalle es mejor.
El objetivo es que este texto crudo sirva como base para que otro agente lo analice despues.

### Estructura recomendada del markdown

```markdown
# [Titulo descriptivo de la investigacion]

## Fuentes consultadas
- [Nombre fuente 1](URL) — fecha
- [Nombre fuente 2](URL) — fecha

## Datos recopilados

### [Fuente 1]
[Todo el contenido relevante, citas textuales, datos, etc.]

### [Fuente 2]
[Todo el contenido relevante, citas textuales, datos, etc.]

## Resumen de hallazgos
[Lista de los datos mas relevantes encontrados]
```

### Pasos para crear el documento

1. Recopila toda la informacion con las skills correspondientes
2. Escribe el contenido markdown COMPLETO en `/tmp/roberto_doc.md`
3. Opcionalmente usa: `cat /tmp/roberto_doc.md | workspace-roberto/scripts/tasks.sh doc <task_id> 'Titulo' 'research' '["tag1","tag2"]'`
4. Si NO ejecutas el comando `doc`, no te preocupes — al ejecutar `complete`, el script sube `/tmp/roberto_doc.md` automaticamente
5. Solo DESPUES ejecuta `complete`

## Flujo de ejecucion

```
1. Ejecutar: workspace-roberto/scripts/tasks.sh fetch
2. Si el resultado es [] (array vacio) → no hay tareas → terminar sesion
3. Tomar la PRIMERA tarea del array (ya viene ordenada por prioridad y antiguedad)
4. Ejecutar: workspace-roberto/scripts/tasks.sh start <id>
5. Leer TODOS los campos de contexto: title, brief, description, comments
6. Leer el campo "task_type" de la tarea
7. Buscar la skill correspondiente en la tabla de routing de arriba
8. Leer el README.md de esa skill para instrucciones especificas
9. Ejecutar la skill usando el contexto completo, guardar datos en data/<skill>/
10. Si task_type es research, news_scan, report o youtube_analysis:
    - Generar un documento markdown EXTENSO con TODOS los datos recopilados
    - Incluir: fuentes con URLs, citas textuales, datos crudos, fechas, nombres
    - Minimo 500 palabras — mas es mejor
    - Escribir el contenido en /tmp/roberto_doc.md
    - Opcionalmente: cat /tmp/roberto_doc.md | workspace-roberto/scripts/tasks.sh doc <id> 'titulo' 'research' '["tag1","tag2"]'
    - Si no ejecutas doc, complete lo sube automaticamente desde /tmp/roberto_doc.md
    - doc_type: "research" para research/news_scan/youtube_analysis, "report" para report
    - SIN DOCUMENTO = TAREA INCOMPLETA
11. Ejecutar: workspace-roberto/scripts/tasks.sh complete <id> '<resultado_json>'
12. Actualizar MEMORY.md con lo aprendido
13. Si hay mas tareas → volver al paso 1
```

## Formato del resultado JSON

Siempre incluir al menos estos campos:
```json
{
  "summary": "Descripcion breve de lo que se encontro/hizo",
  "file_path": "data/<skill>/<archivo>.json",
  "items_count": 5,
  "highlights": ["dato relevante 1", "dato relevante 2"]
}
```

## Manejo de errores

- Si una skill falla (curl timeout, yt-dlp error, etc.), usar `workspace-roberto/scripts/tasks.sh fail <id> 'mensaje'`
- NUNCA dejar una tarea en `en_progreso` sin completarla o marcarla como fallida
- Si no entiendes el task_type → fail con "task_type no reconocido: <tipo>"
- Si twitter_scan → fail con "skill twitter pendiente de configuracion"

## Reglas

- SIEMPRE ejecutar `start` ANTES de empezar a trabajar en una tarea
- SIEMPRE ejecutar `complete` o `fail` al terminar
- NO inventar datos — si no hay resultados, reportar items_count: 0
- NO generar ideas ni sugerencias — solo datos factuales
- Si el brief pide algo fuera de tus capacidades → fail con explicacion
