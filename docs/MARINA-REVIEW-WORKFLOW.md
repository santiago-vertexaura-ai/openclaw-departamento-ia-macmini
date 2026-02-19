# Marina Review Workflow — Aprobación y Revisión de Contenido

**Versión:** 1.0  
**Fecha:** 18 Feb 2026  
**Status:** ACTIVO  

---

## 🎬 Flujo Completo: De Tarea a Publicación

```
1. MARINA CREA CONTENIDO
   ↓
   Completa tarea con JSON:
   {
     "content": "Post completo...",
     "platform": "twitter|linkedin|instagram",
     "scheduled_at": "2026-02-20T10:00:00Z"
   }
   
2. AUTO-SYNC: Cron sync-marina-tasks-to-calendar
   ↓
   Detecta tarea completada → Agrega a content_calendar
   status: "pending_review"
   review_status: "pending_review"
   
3. SANTI REVISA EN DASHBOARD
   ↓
   Social Calendar → Click en post → Detail Panel
   
4. SANTI ELIGE UNA OPCIÓN:
   ├─ ✅ APROBAR
   │  ├─ review_status = "approved"
   │  ├─ status = "aprobado"
   │  └─ Sigue pendiente publicación
   │
   ├─ 📝 PEDIR REVISIÓN
   │  ├─ Abre modal con textarea
   │  ├─ Escribe feedback → "Enfócate en hook emocional..."
   │  ├─ review_status = "pending_revision"
   │  ├─ status = "revision_pendiente"
   │  ├─ revision_feedback = "[feedback de Santi]"
   │  └─ Cron crea NUEVA tarea Marina con feedback
   │
   └─ ❌ RECHAZAR
      ├─ review_status = "rejected"
      ├─ status = "rechazado"
      └─ Cron crea NUEVA tarea URGENTE Marina
```

---

## 📊 Estados de Contenido

| Estado | Review Status | Significado | Acción |
|--------|---------------|-------------|--------|
| `pending_review` | pending_review | Nuevo, sin revisar | Santi: Aprobar/Revisar/Rechazar |
| `aprobado` | approved | Listo, pendiente publicación | Santi: "Marcar Publicado" o esperar |
| `revision_pendiente` | pending_revision | Feedback enviado a Marina | Marina: regenerar con feedback |
| `rechazado` | rejected | No aprobado | Marina: crear desde cero |
| `publicado` | approved | En línea | ✓ Listo |

---

## 🖱️ Cómo Usar en Dashboard

### Paso 1: Ver Contenido Pendiente
1. Abre **Social Calendar** (tab Social en dashboard)
2. Posts con status **pending_review** aparecen en la fecha programada
3. Click en cualquier post → **Detail Panel** (derecha)

### Paso 2: Revisar Contenido
En el detail panel ves:
- **Título** del post
- **Platform** (Twitter, LinkedIn, Instagram, etc.)
- **Status** actual (pending_review)
- **Hora programada** (scheduled_at)
- **Contenido completo** (scrollable)

### Paso 3: Tomar Decisión

#### ✅ APROBAR
```
Click "Aprobar" → status = "aprobado"
↓
Post listo para publicación
↓
(Opcional) Click "Marcar Publicado" para publicar inmediatamente
O esperar a la hora programada (auto-publish)
```

#### 📝 PEDIR REVISIÓN
```
Click "Pedir Revisión" → Abre modal
↓
Escribe feedback (ej: "Hook más emocional, menos datos")
↓
Click "Enviar Feedback"
↓
Supabase: revision_feedback = "[tu feedback]"
Cron: Crea NUEVA tarea Marina con comentarios
↓
Marina: Lee feedback, regenera contenido, completa tarea
↓
Post vuelve al calendar con status "pending_review"
```

#### ❌ RECHAZAR
```
Click "Rechazar" → status = "rechazado"
↓
Supabase: review_status = "rejected"
Cron: Crea NUEVA tarea URGENTE para Marina
↓
Marina: Regenera COMPLETAMENTE desde cero
↓
Post vuelve al calendar para nueva revisión
```

---

## 🔄 Flujo Detallado: Pedir Revisión

### En el Dashboard (Santi):
1. Click "Pedir Revisión"
2. Modal aparece con textarea
3. Escribes feedback específico:
   ```
   ❌ Mal:
   "Cambiar el hook"
   
   ✅ Bien:
   "El hook actual ("mientras lees esto...") es demasiado urgente para 
   nuestra audiencia de CTOs. Cambiar a algo más técnico, enfocado en 
   arquitectura de sistemas automatizados. Menos emocional, más racional."
   ```
4. Click "Enviar Feedback"
5. Detail panel se cierra, post va a "revision_pendiente"

### En Supabase (backend):
```json
{
  "id": "uuid",
  "title": "Post LinkedIn: Oficina Virtual...",
  "status": "revision_pendiente",
  "review_status": "pending_revision",
  "revision_feedback": "[Feedback de Santi]",
  "revised_count": 1,
  "revision_history": [
    {
      "revision": 1,
      "feedback": "[Feedback]",
      "timestamp": "2026-02-18T20:30:00Z",
      "requested_by": "santi"
    }
  ]
}
```

### En Marina's Task (cron):
```
Nueva tarea creada automáticamente:
  title: "REVISIÓN: Post LinkedIn - Oficina Virtual (Feedback Santi)"
  assigned_to: "marina"
  status: "pendiente"
  priority: "alta"
  brief: {
    source_doc_id: "[id del post original]",
    revision_feedback: "[Feedback de Santi]",
    revised_count: 1
  }
  comments: [{
    author: "Santi",
    text: "[Feedback]",
    timestamp: "..."
  }]
```

### Marina Trabaja:
1. Lee la tarea + feedback
2. Regenera contenido mejorado
3. Completa tarea con nuevo JSON
4. Cron automático → Content Calendar con status "pending_review"
5. Santi revisa de nuevo (aprueba/rechaza/revisa)

---

## 📈 Revisar Múltiples Veces (Sin Límite)

El sistema permite infinite revisions:

```
Santi: Pedir Revisión #1 ↔ Marina: Regenera #1
Santi: Pedir Revisión #2 ↔ Marina: Regenera #2
Santi: Pedir Revisión #3 ↔ Marina: Regenera #3
...
Santi: Aprobar ✓
```

Cada revision se trackea en `revision_history`.

---

## 🔐 Permisos y Responsabilidades

| Rol | Acción |
|-----|--------|
| **Marina** | Crea contenido. Lee feedback. Regenera. |
| **Santi** | Revisa. Aprueba/Rechaza/Pide Revisión. Publica. |
| **Cron** | Detecta tareas completadas. Sincroniza calendar. Crea tareas revisión. |

---

## 🎯 Botones en Detail Panel

### Estados y Botones Disponibles

#### Status: `pending_review`
```
┌─────────────────────────────────────┐
│  Post: "Oficina Virtual VertexAura" │
│  Platform: LinkedIn                 │
│  Status: Pendiente Revisión         │
├─────────────────────────────────────┤
│ [Aprobar] [Pedir Revisión] [Rechazar] │
└─────────────────────────────────────┘
```

#### Status: `aprobado`
```
┌─────────────────────────────────────┐
│  Post: "Oficina Virtual VertexAura" │
│  Platform: LinkedIn                 │
│  Status: Aprobado                   │
├─────────────────────────────────────┤
│        [Marcar Publicado]           │
└─────────────────────────────────────┘
```

#### Status: `publicado`
```
┌─────────────────────────────────────┐
│  Post: "Oficina Virtual VertexAura" │
│  Platform: LinkedIn                 │
│  Status: ✓ Publicado                │
├─────────────────────────────────────┤
│       (Sin acciones disponibles)    │
└─────────────────────────────────────┘
```

---

## 🚀 Automatización: Auto-Publish

(Próximamente) Posts aprobados se publican automáticamente a la hora programada (scheduled_at).

Para publicar manual ahora:
1. Aprobar post
2. Click "Marcar Publicado"
3. Status → "publicado"
4. (Futuro: Publica a plataforma real)

---

## 📞 Flujo Completo: Ejemplo Real

### Día 1 — Marina crea
```
Marina completa tarea: "Crear post LinkedIn - Oficina Virtual"
JSON result:
{
  "content": "Antes: 20h admin. Ahora: 2h con 5 agentes...",
  "platform": "linkedin",
  "scheduled_at": "2026-02-20T10:00:00Z"
}
```

### Día 1 — Sync automático
```
Cron: sync-marina-tasks-to-calendar (cada 5 min)
→ Detecta tarea completada
→ Agrega a content_calendar con status="pending_review"
→ Post aparece en Social Calendar (20 Feb, 10:00)
```

### Día 1 — Santi revisa
```
Abre Dashboard → Social Calendar → Click post LinkedIn
→ Detail panel muestra contenido completo
→ Lee y piensa: "El hook es good pero necesita más contexto"
→ Click "Pedir Revisión"
→ Modal aparece
→ Escribe: "Agregar 1-2 líneas sobre por qué esto importa ahora"
→ Click "Enviar Feedback"
```

### Día 1 — Cron crea tarea Marina
```
Nueva tarea automática:
  title: "REVISIÓN: Post LinkedIn - Oficina Virtual (Feedback Santi)"
  assigned_to: "marina"
  priority: "alta"
  comments: [{
    author: "Santi",
    text: "Agregar 1-2 líneas sobre por qué esto importa ahora"
  }]
```

### Día 2 — Marina regenera
```
Marina lee tarea con feedback
Regenera contenido: agrega contexto + hook mejorado
Completa tarea con nuevo JSON
Cron: content_calendar actualiza con nuevo contenido
```

### Día 2 — Santi aprueba
```
Post vuelve a calendar con status="pending_review"
Santi revisa de nuevo
Click "Aprobar"
→ status = "aprobado"
→ Aparece botón "Marcar Publicado"
```

### Día 2 — Publica
```
Click "Marcar Publicado"
→ status = "publicado"
Post listo (próximamente: auto-publicar a LinkedIn)
```

---

## ✅ Checklist: Setup Completo

- [x] SocialCalendarWeekly.tsx con botones
- [x] Modal para pedir revisión
- [x] Funciones: approveContent, rejectContent, requestRevision
- [x] Estados: pending_review, aprobado, revision_pendiente, rechazado, publicado
- [x] Cron sync-marina-tasks-to-calendar (cada 5 min)
- [x] Cron crear tarea revisión automática
- [x] Dashboard levantado y funcional
- [ ] Field revision_feedback en Supabase (add migration si necesario)
- [ ] Cron auto-publish a hora programada (próximo)

---

## 🎯 Próximos Pasos

1. **Hoy (18 Feb):** Sistema de revisión LISTO, testing con Santi
2. **19 Feb:** Marina empieza a generar contenido, Santi revisa en dashboard
3. **20 Feb:** Ciclo completo funcionando (Marina → Santi Revisa → Marina Regenera)
4. **Próxima semana:** Auto-publish a plataformas reales (LinkedIn API, Twitter API, etc.)

---

**Status:** ✅ ACTIVO — Contenido de Marina ahora pasa por sistema de revisión robusto

