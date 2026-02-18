# ADDENDUM — Tareas Vencidas 17 Feb (16:21-16:45 CET)

**Status Verificación Final:** 3/3 COMPLETADAS EN SUPABASE. 1 ISSUE DETECTADO.

---

## VERIFICACIÓN TAREAS EN SUPABASE

Todas 3 tareas confirmadas como `status: completada` en agent_tasks:

```bash
a869961c-b85a-4615-842a-943decfefc5a | Preparar lista funcionalidades SaaS | ✅ completada
739d6138-11a3-4251-936e-8a196be56048 | Diagnostico: Instagram feed vacio | ✅ completada  
38d9accc-a017-4b9d-8d66-04a52501804b | RECORDATORIO: Sesion brainstorm SaaS | ✅ completada
```

---

## ISSUE DETECTADO: RLS en agent_docs

**Problema:** Instagram script ejecutó correctamente (extrajo 2 posts) pero NO persiste en Supabase.

**Causa raíz:** Row-Level Security (RLS) policy en tabla `agent_docs` rechaza inserciones con anon key (error 401).

**Evidencia:**
```
instagram-apify.sh scrape santim.ia 2
→ Output: 2 posts JSON ✅
→ POST /agent_docs: Error 401 ❌
→ Supabase RLS: "new row violates row-level security policy"
```

**Opciones para arreglado (28 Feb - semana próxima):**

1. **Usar Service Role Key:** Script debe usar `SUPABASE_SERVICE_ROLE_KEY` en lugar de anon key
   - Ventaja: Bypassa RLS
   - Desventaja: Credencial más privilegiada (requiere cuidado security)

2. **Crear Supabase Function:** POST a función SECURITY DEFINER que persista
   - Ventaja: Control fino sobre qué se inserta
   - Desventaja: Setup SQL adicional

3. **Wrapper Script Centralizado:** Script bash wrapper que maneja persistencia
   - Ventaja: Reutilizable para todos scrapers
   - Desventaja: Complejidad bash extra

**Recomendación:** Opción 2 (Supabase Function) es más segura. Implementación: 18-19 Feb.

---

## LECCIONES CAPTURADAS HOY

### Arquitectura Aprendizajes
1. **Script ≠ Persistencia**: Los scripts generan datos pero no persisten automáticamente
2. **RLS matters**: Supabase RLS puede bloquear inserciones aunque el usuario esté autenticado
3. **Key types**: anon key vs service role key tienen permisos diferentes

### Operacionales
1. **Root cause first**: Ejecuté diagnosis correctamente (script sí genera datos, problema es persistencia)
2. **Timing crons**: Cambio 30min → 10min fue acertado (tareas se procesaron < 3h después deadline)
3. **Documentation anticipada**: Tarea "lista SaaS" completada ANTES de deadline ✅

### Infraestructura
1. **Supabase RLS**: Policy válida de seguridad, requiere arquitectura correcta
2. **Environmental credentials**: Están disponibles en ~/.env.local
3. **Script testing**: Ejecutar scripts manualmente ANTES de confiar en crons

---

## STATUS FINAL (16:45 CET)

### ✅ COMPLETADO
- Tarea 1: RECORDATORIO brainstorm (documento `/tmp/saas_funcionalidades.md`)
- Tarea 2: DIAGNÓSTICO Instagram (root cause identificada)
- Tarea 3: PREPARACIÓN lista SaaS (documento completado)
- Documentación en vault (decisiones + lecciones)
- Documentación en memory (este archivo)

### ⏳ PENDIENTE PRÓXIMA SEMANA
- RLS fix en agent_docs (opción 2: Supabase Function)
- Script persistence testing (una vez RLS resuelto)
- Generalizar pattern auto-persist para todos scrapers

### 🎯 PRÓXIMOS PASOS (Inmediato)
1. Brainstorm con Santi usando doc SaaS funcionalidades
2. Validar scope + timeline + decisiones
3. Planning Week: Semana 18-22 Feb (confirmación implementación)

---

**Generado por:** Alfred  
**Final Status:** READY FOR DELIVERY  
**Time:** 17 Feb 2026, 16:45 CET
