# Tasks — Motor de ejecución de Marina

## Comandos
```bash
scripts/tasks.sh resume              # Reset stale + devolver pendientes
scripts/tasks.sh fetch               # Obtener pendientes (assigned_to=marina)
scripts/tasks.sh start <id>          # Marcar en_progreso
scripts/tasks.sh complete <id> '<json>'  # Completar + auto-doc + vault
scripts/tasks.sh fail <id> '<msg>'   # Marcar fallida
```

## Campos de tarea (leer TODOS)
- `title`: Resumen corto
- `brief`: Instrucciones detalladas (JSON, prioridad máxima)
  - Puede contener `source_doc_id` y `source_task_id`
- `description`: Contexto adicional
- `comments`: Feedback directo de Santi — SI EXISTEN, MANDAN

## Prioridad de campos
`comments` > `brief` > `description` > `title`

## IMPORTANTE
- SIEMPRE crear `/tmp/marina_doc.md` ANTES de completar
- Mínimo 300 palabras en el documento
- doc_type será "draft" automáticamente
