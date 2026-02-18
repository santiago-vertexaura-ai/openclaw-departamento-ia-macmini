---
title: "Auto-Dispatch Respeta Flag NO_ANDRES"
date: 2026-02-14
last_updated: 2026-02-14T11:34:57Z
category: decisions
memoryType: decisions
priority: 🟡
tags: 
  - decision
  - auto-dispatch
  - andres
  - flags
  - sistema
mentions: 1
confidence: 0.7
author: "Alfred"
---

# Decisión: Auto-Dispatch Respeta Instrucciones Explícitas

**Fecha:** 2026-02-14  
**Trigger:** Incidente con tarea de investigación apps España  
**Decidido por:** Santi

## Problema

Auto-dispatch de Andrés creó automáticamente una tarea para analizar el informe de Roberto sobre apps de análisis de competidores, **ignorando instrucción explícita** de Santi:

> "Andrés NO tiene que hacer nada con el informe de Roberto"

La instrucción estaba en:
- Brief de la tarea original (campo `MUY_IMPORTANTE`)
- Description de la tarea
- Comentario de Santi en la tarea

Auto-dispatch no revisaba estos campos antes de crear tarea de Andrés.

## Solución Implementada

Modificado `workspace-andres/scripts/auto-dispatch.sh` para:

1. **Antes de crear tarea de Andrés:** revisar brief + description de tarea original de Roberto
2. **Detectar patrones de exclusión:**
   - "NO Andrés"
   - "Solo Roberto"
   - "Andrés NO debe"
   - "NO procesar con Andrés"
   - "NO crear tarea Andrés"
   - "MUY_IMPORTANTE ... NO"
   - "Solo para Roberto"
   - "Solo para Santi"

3. **Si detecta flag:** NO crear tarea, loggear "SKIPPED (NO_ANDRES flag)"

## Código Implementado

```python
def check_no_andres_flag(task_data):
    brief = task_data.get('brief', {})
    description = task_data.get('description', '')
    
    no_andres_patterns = [
        r'NO.*Andr[ée]s',
        r'[sS][oó]lo.*Roberto',
        r'Andr[ée]s.*NO.*debe',
        r'NO.*procesar.*Andr[ée]s',
        # ... etc
    ]
    
    # Check in brief and description
    # Return True if any pattern matches
```

## Comportamiento Actualizado

**Antes:**
- Auto-dispatch crea tarea Andrés para TODA investigación completada de Roberto (task_type research)

**Ahora:**
- Auto-dispatch revisa instrucciones explícitas
- Si detecta "NO_ANDRES" → skip y log
- Solo crea tarea si NO hay flag de exclusión

## Validación

Tarea `be547a47-9241-413b-9b2a-a42c3d20c6ff` (investigación apps España):
- ✅ Cancelada (marcada como fallida)
- ✅ Script actualizado
- ✅ Próximas tareas respetarán flag

## Lección

**Regla general:**
Si Santi dice explícitamente "NO hacer X", el sistema DEBE respetarlo.

No asumir comportamiento por defecto cuando hay instrucción contraria explícita.

## Relacionado

- Tarea original Roberto: 9c07ad49-143b-4890-8f2f-3465fb5a46f9
- Tarea cancelada Andrés: be547a47-9241-413b-9b2a-a42c3d20c6ff
- Script: workspace-andres/scripts/auto-dispatch.sh

Relacionado con [[como-piensa-santi-equipo]].
