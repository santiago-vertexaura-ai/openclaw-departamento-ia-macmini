# Task Deduplication Protocol — Evitar Duplicados en agent_tasks

**Versión:** 1.0  
**Fecha:** 18 Feb 2026  
**Status:** ACTIVO  
**Causa:** Crons se ejecutaban múltiples veces sin verificar si tarea ya existía  

---

## 🚨 Problema Resuelto

Antes: El cron **"Alfred - Procesar tareas propias"** creaba 3+ tareas casi idénticas cada vez que se ejecutaba:

```
❌ ANTES (Duplicados):
- ID: fd9663c0... "DIAGNÓSTICO: Instagram feed vacío en dashboard (>2h20min)"     [17:48:36]
- ID: 9e9a825d... "DIAGNÓSTICO: Instagram feed vacío en dashboard (>2h VENCIDA)"  [18:01:16]
  ↑ Misma tarea, ejecutada 2 veces en ~13 min

❌ ANTES (más duplicados):
- ID: f20f6a68... "PREPARACIÓN: Lista funcionalidades SaaS (>2h25min)"            [17:48:36]
- ID: 6b692444... "PREPARACIÓN: Lista funcionalidades SaaS (>2h25min VENCIDA)"    [18:01:22]
  ↑ Idem, duplicado
```

**Causa raíz:**
- Cron usa `curl -X POST` sin verificar si tarea ya existe
- NO hay dedup_key o identificador único
- NO hay verificación de timestamp (debounce)
- Cada ejecución = nueva tarea aunque sea idéntica

---

## ✅ Solución Implementada

### Script: `dedup-task.sh`

Ubicación: `/Users/alfredpifi/clawd/scripts/dedup-task.sh`

**Lógica:**
```
ANTES DE CREAR TAREA:
  1. Extraer keyword (primeras palabras del título)
  2. Buscar en Supabase: ¿existe tarea similar creada hace poco?
  3. Si existe hace <30min → SKIP (debounce)
  4. Si existe hace >30min → ACTUALIZAR (en lugar de crear)
  5. Si no existe → CREAR normalmente
```

**Uso:**
```bash
bash dedup-task.sh create "DIAGNÓSTICO: Instagram feed vacío" alfred "diagnóstico"

# Output:
# 🔍 Buscando duplicados...
# ⏸️  DEBOUNCE: Tarea similar creada hace 5min
#    Status: SKIPPED
# O:
# ✅ NUEVA TAREA: No hay duplicados detectados
#    Puedes crear: ...
```

---

## 🔧 Integración en Cron

### Antes (❌ Vulnerable a duplicados):
```bash
curl -X POST "$SUPABASE_URL/rest/v1/agent_tasks" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"DIAGNÓSTICO: ...", "assigned_to":"alfred", ...}'
```

### Después (✅ Con deduplicación):
```bash
# Verificar duplicados ANTES de crear
bash /Users/alfredpifi/clawd/scripts/dedup-task.sh create \
  "DIAGNÓSTICO: Instagram feed vacío" \
  alfred \
  "diagnóstico"

# Si retorna 0 → OK crear
if [ $? -eq 0 ]; then
  curl -X POST "$SUPABASE_URL/rest/v1/agent_tasks" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{...}'
fi
```

---

## 🔄 Parámetros del Script

```bash
bash dedup-task.sh create [TITLE] [CREATED_BY] [TASK_TYPE]

Parámetros:
  - TITLE        : Título de la tarea (ej: "DIAGNÓSTICO: Instagram feed vacío")
  - CREATED_BY   : Quién crea (ej: "alfred")
  - TASK_TYPE    : Tipo de tarea (ej: "diagnóstico", "research", "system")

Retorna:
  - 0    : OK, puedes crear tarea
  - 1    : ERROR o DEBOUNCE (skip)
```

---

## 📊 Ejemplo Real: Cron Alfred Mejorado

```bash
#!/bin/bash
# cron-alfred-procesar-tareas-propias.sh (VERSIÓN MEJORADA)

WORKSPACE="/Users/alfredpifi/clawd"

# TASK 1: Recordatorio Brainstorm SaaS
if bash "$WORKSPACE/scripts/dedup-task.sh" create \
  "RECORDATORIO: Sesión brainstorm SaaS (11:00-11:30h)" \
  alfred \
  "recordatorio"; then
  
  # Solo crea si no hay duplicado reciente
  curl -s -X POST "$SUPABASE_URL/rest/v1/agent_tasks" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"title":"...", ...}' > /dev/null
  echo "✅ Tarea creada: Recordatorio SaaS"
else
  echo "⏸️  SKIP: Recordatorio SaaS (duplicado reciente)"
fi

# TASK 2: Diagnóstico Instagram Feed
if bash "$WORKSPACE/scripts/dedup-task.sh" create \
  "DIAGNÓSTICO: Instagram feed vacío" \
  alfred \
  "diagnóstico"; then
  
  curl -s -X POST "$SUPABASE_URL/rest/v1/agent_tasks" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{...}' > /dev/null
  echo "✅ Tarea creada: Diagnóstico Instagram"
else
  echo "⏸️  SKIP: Diagnóstico Instagram (duplicado reciente)"
fi

# ... más tareas ...
```

---

## 🧹 Limpieza de Duplicados Existentes

### Duplicados eliminados (18 Feb 2026):
```
✓ fd9663c0-0f86-494f-a9fd-fe0e6249ecb8  "DIAGNÓSTICO... (>2h20min)"
✓ f20f6a68-26b6-4bb4-a616-59b7e0af6472  "PREPARACIÓN..." (vieja)
```

### Cómo identificar más duplicados:
```bash
# Ver tareas de Alfred con títulos similares
curl -s "$SUPABASE_URL/rest/v1/agent_tasks?assigned_to=eq.alfred&select=title" \
  -H "Authorization: Bearer $KEY" | jq '.[] | .title' | sort | uniq -c | grep -v "^[[:space:]]*1 "

# Si count > 1 → duplicado potencial
```

---

## 📋 Configuración de Debounce

**Tiempo actual: 30 minutos**

Si necesitas cambiar:
```bash
# En dedup-task.sh, línea ~70:
if [ $DIFF -lt 1800 ]; then  # 1800 segundos = 30 min
  # Cambiar a:
  if [ $DIFF -lt 3600 ]; then  # 60 min
  # O:
  if [ $DIFF -lt 600 ]; then   # 10 min
```

---

## ✅ Verificación: Task Creation Safety Checklist

Antes de crear tarea por curl:

- [ ] ¿Ejecutaste `dedup-task.sh` para verificar duplicados?
- [ ] ¿El script retornó exit code 0?
- [ ] ¿Verificaste que `assigned_to` esté en minúsculas?
- [ ] ¿Llenaste `created_by` correctamente?
- [ ] ¿Incluiste `brief` con contexto suficiente?

---

## 🎯 Próximas Mejoras

1. **Agregar `dedup_key` a Supabase** (columna nueva en agent_tasks)
   - Hash único basado en título + created_by
   - UNIQUE constraint previene inserts duplicados a nivel DB

2. **Dashboard visual** para detectar duplicados
   - Mostrar tareas con mismo keyword principal
   - Alertar sobre potenciales duplicados

3. **Merged tasks** — si encuentras duplicados, consolidar en una sola

---

## 📞 Soporte

Si encuentras duplicados:

```bash
# 1. Identifica:
curl -s "$SUPABASE_URL/rest/v1/agent_tasks?title=ilike.%DIAGNÓSTICO%" \
  -H "Authorization: Bearer $KEY" | jq '.[] | {id, title, created_at}'

# 2. Reporta a Alfred con IDs
# 3. Alfred borra IDs viejos:
curl -X DELETE "$SUPABASE_URL/rest/v1/agent_tasks?id=eq.OLD_ID" \
  -H "Authorization: Bearer $KEY"
```

---

**Status:** ✅ ACTIVO — Todo cron debe integrar dedup-task.sh al crear tareas

