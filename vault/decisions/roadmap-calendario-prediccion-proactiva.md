---
slug: roadmap-calendario-prediccion-proactiva
title: "Roadmap Mejoras: Calendario + Predicción Proactiva"
category: decisions
date: 2026-02-18
status: "EJECUTANDO"
---

# 🚀 ROADMAP MEJORAS DEPARTAMENTO

**Decisión Santi (18 Feb 18:40):** 
- ✅ PRIMERO: Trabajar en **CALENDARIO** (interfaz original + botón publicado)
- ⏳ LUEGO: Implementar **PREDICCIÓN PROACTIVA** (mejora #4)

---

## FASE 1: CALENDARIO + BOTÓN PUBLICADO (AHORA)

### ✅ COMPLETADO (18 Feb 18:30-18:45)

**Qué hicimos:**
1. Creé `SocialCalendarWithContent.tsx` — interfaz original + carga de `content_calendar`
2. El calendario **mantiene su aspecto visual original** (grid mes/semana)
3. **Cada día muestra posts** según `scheduled_at`
4. Click en post → panel derecha con detalles
5. **Botón "Marcar Publicado"** que:
   - Actualiza `status` → "publicado" en Supabase
   - Actualiza `review_status` → "approved"
   - Desaparece el botón (post ya publicado no se puede cambiar)

### Funcionamiento:
```
Calendar muestra posts por fecha
  ↓
Click post → abre panel derecha
  ↓
Panel muestra: título, content, platform, status, scheduled_at
  ↓
Botón "Marcar Publicado" (verde, con check)
  ↓
Click → actualiza Supabase automáticamente
  ↓
Panel muestra: "✓ Contenido publicado"
```

### Status:
✅ Código completado  
✅ Dashboard reiniciado  
⏳ **Recarga navegador (F5) para ver cambios**

---

## Qué Cambió de ContentCalendarManager:
- ❌ Borré interfaz 50/50 (lista izq + panel der)
- ❌ Borré el "REVISAR / RECHAZAR" complejo
- ✅ Restauré SocialCalendarWithContent (grid + detalles simples)
- ✅ Agregué botón "Marcar Publicado" con actualización automática Supabase

**Resultado:** Interfaz limpia. Un click para publicar. Eso es todo.

---

## FASE 2: PREDICCIÓN PROACTIVA (Próxima semana)

**Qué es:** Alfred predice qué contenido necesitarás basado en patrones.

**Ejemplo:**
```
Patrón detectado:
- Lunes 09:00 → siempre pides "post sobre clase nueva"
- Viernes 16:00 → siempre pides "preview módulo siguiente"

Alfred proactivo:
- Lunes 08:30 → crea task Roberto: "investigar qué se enseña en clase nueva"
- Viernes 15:30 → crea task Marina: "preparar draft preview módulo"

Resultado: Cuando llegas el lunes, investigación YA LISTA.
           Cuando llegas el viernes, post SEMI-HECHO.
```

**Mecánica:**
- Analizar últimas 30 días de tareas
- Detectar patrones: día de semana + hora + tipo de contenido
- Si patrón se repite 3+ veces → tareas preemptivas
- Cron Alfred: cada mañana 06:00h prepara trabajos del día

**Beneficio:** "Alfred ya sabe qué necesito."

---

## TIMELINE

### ESTA SEMANA (18-21 Feb)
- ✅ Calendario implementado (hoy)
- ⏳ Testing & ajustes (mañana)
- ✅ Botón "Marcar Publicado" funcional

### PRÓXIMA SEMANA (24-28 Feb)
- ⏳ Predicción Proactiva (análisis patrones)
- ⏳ Cron preemptivo (crear tareas automáticas)
- ⏳ Testing predicción

### DESPUÉS (3+ Mar)
- Mejoras 1, 2, 3, 5 (comunicación inter-agente, SLA, feedback loops, performance)

---

## Próximo Paso:

**Recarga el dashboard (F5) y prueba:**
1. Social Calendar tab
2. Haz click en un post
3. Click "Marcar Publicado"
4. Verifica que status cambió en Supabase

Reporta si funciona o si ves errores.
