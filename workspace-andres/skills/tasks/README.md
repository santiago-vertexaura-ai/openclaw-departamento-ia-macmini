# Skill: Tasks (Gestión de Tareas via Supabase)

## Descripción
Esta es tu skill PRINCIPAL. Antes de ejecutar cualquier otra skill, debes revisar si tienes tareas pendientes en Supabase.

## Herramienta
Script: `scripts/tasks.sh`

### Comandos disponibles

```bash
# Resetear stale + ver tareas pendientes
scripts/tasks.sh resume

# Ver tareas pendientes (ordenadas por prioridad: urgente > alta > media > baja)
scripts/tasks.sh fetch

# Marcar tarea como en progreso (SIEMPRE antes de empezar a ejecutar)
scripts/tasks.sh start <task_id>

# Marcar tarea como completada con resultado JSON
scripts/tasks.sh complete <task_id> '{"resumen_ejecutivo_para_alfred":{"top_3_insights":["..."]}}'

# Marcar tarea como fallida con mensaje de error
scripts/tasks.sh fail <task_id> 'descripcion del error'

# Crear documento (contenido markdown via stdin)
echo 'contenido markdown extenso...' | scripts/tasks.sh doc <task_id> '<titulo>' '<doc_type>' '["tag1","tag2"]'
```

## REGLA CRÍTICA: Documento obligatorio

**Para TODA tarea de tipo `analysis`, `content_analysis`, `viral_analysis`, `trend_analysis`, `weekly_brief`:**

1. ANTES de ejecutar `scripts/tasks.sh complete`, DEBES escribir `/tmp/andres_doc.md`
2. El documento debe tener mínimo 500 palabras con el análisis completo
3. Si no creas el doc, la tarea se considera INCOMPLETA
4. El doc se sube automáticamente a Supabase al ejecutar `complete`

**Sin documento = tarea fallida.** No hay excepciones.

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

## Contexto de la tarea

Cada tarea tiene varios campos con información. Léelos TODOS antes de ejecutar:

| Campo | Para qué sirve |
|-------|---------------|
| `title` | Resumen corto de lo que hay que hacer |
| `brief` | Instrucciones detalladas (JSON). Si existe, tiene prioridad sobre title |
| `description` | Contexto adicional. Puede contener detalles, matices o restricciones |
| `comments` | Array de comentarios del equipo. Pueden contener aclaraciones o info extra |

**Orden de prioridad:** `brief` > `description` > `title`. Usa todo lo que esté disponible.

## Cómo obtener los datos fuente

Andrés NO recopila datos. Lee los documentos de Roberto:

```bash
# Doc vinculado a la tarea (si brief tiene source_doc_id o task tiene task_id de Roberto)
scripts/docs.sh fetch-by-task <task_id_roberto>

# Últimos docs recientes de Roberto
scripts/docs.sh fetch-recent 7 10

# Buscar por tema
scripts/docs.sh fetch-by-topic "keyword"
```

## Flujo de ejecución

```
1. Ejecutar: scripts/tasks.sh resume (resetea stale + devuelve pendientes)
2. Si resume devuelve [] → ejecutar: scripts/tasks.sh fetch
3. Si el resultado es [] → no hay tareas → terminar sesión
4. Tomar la PRIMERA tarea del array
5. Ejecutar: scripts/tasks.sh start <id>
6. Leer TODOS los campos: title, brief, description, comments
7. Leer task_type → buscar skill en TOOLS.md
8. Leer el README.md de esa skill
9. Obtener docs fuente con scripts/docs.sh
10. LEER cada documento completamente
11. Ejecutar análisis según skill
12. Validar output: scripts/validate-output.sh <archivo>
13. Escribir /tmp/andres_doc.md (mínimo 500 palabras)
14. Ejecutar: scripts/tasks.sh complete <id> '<resultado_json>'
15. Actualizar MEMORY.md y knowledge/ si corresponde
16. Si hay más tareas → volver al paso 1
```

## Formato del resultado JSON

Para análisis 5 capas, el resultado es el JSON completo del análisis (ver skills/content_intelligence/README.md).

Para otros tipos, incluir al menos:
```json
{
  "summary": "Descripción breve del resultado",
  "type": "content_intelligence|trend_tracking|formula_update|feedback",
  "highlights": ["insight 1", "insight 2"],
  "source_docs": ["doc_id_1"]
}
```

## Manejo de errores

- Si una skill falla → `scripts/tasks.sh fail <id> 'mensaje'`
- NUNCA dejar una tarea en `en_progreso` sin cerrarla
- Si no entiendes el task_type → fail con "task_type no reconocido: <tipo>"
- Si no hay docs de Roberto disponibles → fail con "sin documentos fuente disponibles"

## Reglas

- SIEMPRE ejecutar `start` ANTES de empezar a trabajar
- SIEMPRE ejecutar `complete` o `fail` al terminar
- NO inventar datos — si un dato no está en docs de Roberto, no lo incluyas
- NO resumir — ANALIZAR. Buscar el POR QUÉ detrás de cada dato
- Si brief pide algo fuera de tus capacidades → fail con explicación
