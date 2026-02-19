# PLAN DE ACCIÓN: TRANSFORMAR A DEPARTAMENTO 24/7 PROACTIVO

**Línea temporal:** 4 semanas
**Objetivo:** De sistema reactivo a autónomo 24/7
**Métricas éxito:** Latency <10min, 40% autonomía, 3+ proyectos

---

## SEMANA 1: COMUNICACIÓN (19-25 FEB)

### DÍA 1-2: ARQUITECTURA DE SESIONES

**Qué hacer:**
- [ ] Crear sesión persistente para Roberto (agent:roberto)
- [ ] Crear sesión persistente para Andrés (agent:andres)
- [ ] Crear sesión persistente para Marina (agent:marina)
- [ ] Agregar función `alfred_notify()` en cada agente
- [ ] Probar: Roberto → Andrés (test message)

**Resultado esperado:**
```
Alfred: "Roberto, tengo doc para Andrés"
Alfred: [sessions_send] → Roberto: "Listo, lo recibe Andrés"
Robert: [sessions_send] → Andrés: "Doc X para analizar"
Andrés: "Recibido, analizando..."
Andrés: [sessions_send] → Alfred: "Completo, enviando a Marina"
```

**Éxito:** Sin errores, latency <5 segundos entre mensajes

---

### DÍA 3-4: FLUJO DOCUMENTADO

**Qué hacer:**
- [ ] Documentar flujo: Roberto → Andrés → Marina
- [ ] Crear templates de mensajes estandarizados
- [ ] Agregar logging de todas las communicaciones
- [ ] Crear Supabase table: `agent_communications`

**Template ejemplo:**
```
[COMUNICACIÓN INTER-AGENTES]
De: Roberto
Para: Andrés
Tipo: ANALYSIS_REQUEST
Contenido: "Doc X (word_count: 1500). Busca: formulas CLR, PSQV, target audience"
Urgencia: MEDIA
Deadline: 10 min
Timestamp: 2026-02-20T14:32:00Z
```

**Éxito:** 5+ comunicaciones exitosas logged, 0 errores

---

### DÍA 5-7: TEST FULL PIPELINE

**Qué hacer:**
- [ ] Roberto crea doc real
- [ ] Notifica a Andrés en tiempo real
- [ ] Andrés analiza, notifica a Marina
- [ ] Marina crea contenido, notifica a Santi
- [ ] Santi aprueba/rechaza en tiempo real
- [ ] Medir latency total

**Target:** De 2 horas (crons) a 20 minutos (comunicación directa)

**Éxito:** Pipeline completo <20min, 0 bottlenecks

---

## SEMANA 2: AUTONOMÍA ALFRED (26 FEB - 4 MAR)

### DÍA 1-2: MATRIZ DE DECISIONES

**Qué hacer:**
- [ ] Definir 20 tipos de decisiones (ver abajo)
- [ ] Asignar: AUTO (Alfred solo) vs APROVE_SANTI
- [ ] Crear scoring formula para cada tipo
- [ ] Agregar a `DECISION_MATRIX.json`

**Ejemplo matriz:**

```json
{
  "decisions": [
    {
      "id": "content_create",
      "name": "Crear contenido (Marina task)",
      "auto": true,
      "condition": "score >= 8 AND cost < $0",
      "threshold": 8
    },
    {
      "id": "investigacion",
      "name": "Investigación (Roberto task)",
      "auto": true,
      "condition": "relevancia >= 6",
      "threshold": 6
    },
    {
      "id": "proyecto_nuevo",
      "name": "Iniciar proyecto estratégico",
      "auto": false,
      "requires": "santi_approval"
    },
    {
      "id": "gasto_dinero",
      "name": "Gastar dinero",
      "auto": false,
      "requires": "santi_approval"
    },
    {
      "id": "publicar_contenido",
      "name": "Publicar en redes oficiales",
      "auto": true,
      "condition": "approved_by_santi = true"
    }
  ]
}
```

**Éxito:** 20 decisiones categorizadas, criterios claros

---

### DÍA 3-4: DECISION LOGGER

**Qué hacer:**
- [ ] Crear `decision_log` en Supabase
- [ ] Cada vez que Alfred decide algo → log
- [ ] Campos: decision_id, reasoning, score, timestamp, result
- [ ] Dashboard: ver todas las decisiones de Alfred

**Ejemplo log:**
```json
{
  "timestamp": "2026-02-22T14:15:00Z",
  "decision": "content_create",
  "doc_id": "abc123",
  "score": 8.5,
  "reasoning": "Roberto doc sobre OpenClaw trends. CLR high, relevancia VertexAura 9/10. Público interessado.",
  "action": "Delegué a Marina sin preguntar",
  "result": "Marina creó 3 variantes en 15min",
  "santi_feedback": "Excelente timing"
}
```

**Éxito:** 10+ decisiones logged sin errores

---

### DÍA 5-7: MECANISMO DE APRENDIZAJE

**Qué hacer:**
- [ ] Recopilar feedback de Santi sobre decisiones
- [ ] ¿Decisión correcta? Score += 0.1
- [ ] ¿Decisión incorrecta? Score -= 0.2
- [ ] Ajustar thresholds automáticamente
- [ ] Crear vault entry: "Decisiones aprendidas"

**Ejemplo:**
```
Decisión #1: Content score 8.2 → Alfred crea task
Resultado: Post excelente, 1000+ engagement
Feedback Santi: "Perfecta"
→ Nueva threshold para similar content: >= 8.0 (baja)

Decisión #2: Content score 7.8 → Alfred NO crea (threshold 8.0)
Resultado: Perdemos oportunidad
Feedback Santi: "Deberías haber hecho"
→ Nueva threshold: >= 7.5 (baja más)
```

**Éxito:** Thresholds ajustándose automáticamente, accuracy > 80%

---

## SEMANA 3: PROACTIVIDAD ROBERTO (5-11 MAR)

### DÍA 1-2: SCORING DE OPORTUNIDADES

**Qué hacer:**
- [ ] Crear `opportunity_score()` function
- [ ] Score basado en: relevancia × urgencia × likelihood
- [ ] Si score >= 7: Roberto CREA doc automáticamente
- [ ] Si score 5-7: Roberto reporta a Alfred
- [ ] Si score < 5: Ignora (no worth)

**Fórmula:**
```
score = (relevancia_0-10 × 0.5) + 
        (urgency_0-10 × 0.3) + 
        (likelihood_win_0-10 × 0.2)

Score >= 7: AUTO - Crea doc
Score 5-7: REPORT - "Alert: relevancia 6.2"
Score < 5: IGNORE
```

**Ejemplo real:**
```
Trending: "Anthropic releases Claude 3.5 Opus"
Relevancia VertexAura: 9/10 (usamos Opus)
Urgencia: 8/10 (breaking news)
Likelihood ganar: 7/10 (podemos posicionarnos)
Score = (9×0.5) + (8×0.3) + (7×0.2) = 8.3

→ Roberto CREA doc, notifica Andrés
```

**Éxito:** Roberto generando 3-5 docs/semana proactivamente

---

### DÍA 3-4: TRIGGER AUTOMÁTICO

**Qué hacer:**
- [ ] Roberto monitorea 24/7 (nuevas noticias cada 5min)
- [ ] Cuando score >= 7: trigger automático
- [ ] Roberto: "Alert: Score 8.1. Doc creado. Enviando a Andrés"
- [ ] Notificación a Santi: "Oportunidad detectada (score 8.1)"

**Result:**
```
16:45 - Noticia trending
16:47 - Roberto: "Analizando... score 8.2"
16:50 - Roberto: "Doc creado. ID abc123"
16:52 - Andrés: "Recibido, analizando..."
17:10 - Andrés: "Completo, enviando a Marina"
17:25 - Marina: "Post listo, pendiente Santi"
17:30 - Santi aprueba
17:35 - PUBLICADO (50 minutos desde trending noticia)

Ventaja: 10+ horas antes que competencia
```

**Éxito:** 0 falsos positivos, <50min del trending a publicado

---

### DÍA 5-7: REFINAMIENTO

**Qué hacer:**
- [ ] Recopilar falsos positivos (score alto pero contenido malo)
- [ ] Ajustar scoring formula
- [ ] Entrenar Roberto: "Evita X en el futuro"
- [ ] Documentar learnings

**Éxito:** Accuracy > 85%, <5% falsos positivos

---

## SEMANA 4: PROYECTOS PARALELOS (12-18 MAR)

### DÍA 1-2: CATÁLOGO DE PROYECTOS

**Qué hacer:**
- [ ] Listar proyectos NIVEL A (strategic)
- [ ] Listar proyectos NIVEL B (content)
- [ ] Listar proyectos NIVEL C (infrastructure)
- [ ] Crear `projects.json` con detalles

**NIVEL A (Strategic):**
```json
{
  "id": "future_creator",
  "name": "Future Creator Community",
  "owner": "Alfred",
  "status": "in_progress",
  "deadline": "2026-04-01",
  "tasks": ["curriculum", "landing_page", "sales_funnel", "email_sequences"],
  "priority": 1
},
{
  "id": "saas_mvp",
  "name": "VertexAura SaaS MVP",
  "owner": "Alfred",
  "status": "planning",
  "deadline": "2026-06-30",
  "tasks": ["design", "mvp_build", "alpha_test", "go_to_market"],
  "priority": 2
}
```

**NIVEL B (Content):**
```json
{
  "id": "ai_trends_newsletter",
  "name": "Weekly AI Trends Newsletter",
  "owner": "Roberto",
  "status": "proposal",
  "frequency": "weekly",
  "tasks": ["research", "analysis", "email", "linkedin"],
  "effort": "4.5h/week"
}
```

**Éxito:** Catálogo claro, prioridades definidas

---

### DÍA 3-4: ASIGNACIÓN DE RECURSOS

**Qué hacer:**
- [ ] Future Creator: 50% todos
- [ ] Proyectos nuevos: 30%
- [ ] Mantenimiento/Content: 20%
- [ ] Crear `resource_allocation.json`

**Asignación Roberto:**
```
Future Creator (curriculum research): 50%
AI Trends Newsletter (nuevo): 30%
Daily scans (twitter, news, youtube): 20%
```

**Asignación Marina:**
```
Future Creator (módulos copy): 40%
AI Trends Newsletter (email design): 10%
Reactive content (daily): 30%
Portfolio/building in public: 20%
```

**Éxito:** Todos los agentes con tareas distribuidas

---

### DÍA 5-7: EJECUCIÓN PARALELA

**Qué hacer:**
- [ ] Iniciar proyecto nuevo (AI Trends Newsletter)
- [ ] Roberto: research top 5 trends (2h)
- [ ] Andrés: analysis impacto (1h)
- [ ] Marina: email + LinkedIn post (1.5h)
- [ ] Publicar viernes

**Resultado:**
```
Semana 1:
- Futuro Creator: +1 módulo currículum
- SaaS: +1 competitive analysis
- Newsletter: +1 edición (nueva base)

En paralelo, daily content continues

Semana 2:
- Future Creator: +1 módulo
- SaaS: +1 MVP design iteration
- Newsletter: +1 edición
- Building in public: +2-3 contenidos

3 proyectos avanzando simultáneamente sin conflicto
```

**Éxito:** 3 proyectos activos, 0 bottlenecks

---

## VERIFICACIÓN SEMANAL (Cada lunes)

```markdown
## Check-in Proactividad

**Semana X:**

### Comunicación inter-agentes
- [ ] Roberto → Andrés: __ mensajes
- [ ] Andrés → Marina: __ mensajes
- [ ] Latency promedio: __min
- [ ] Errores: __

### Autonomía Alfred
- [ ] Decisiones tomadas: __
- [ ] Accuracy: __%
- [ ] Feedback Santi: positivo/neutral/crítico

### Proactividad Roberto
- [ ] Documentos creados: __
- [ ] Score promedio: __
- [ ] Falsos positivos: __

### Proyectos paralelos
- [ ] Future Creator progreso: ___
- [ ] Nuevo proyecto progreso: ___
- [ ] Mantenimiento status: ___

### Ajustes próxima semana
- [ ] ...
- [ ] ...
```

---

## MÉTRICAS ÉXITO - DASHBOARD

```
LATENCY:
- Before: 30+ min (crons)
- Target: < 10 min (comunicación)

AUTONOMÍA:
- Before: 0% Alfred decisions
- Target: 40% (level B/C)

OPORTUNIDADES:
- Before: 0/semana
- Target: 3-5/semana

PROYECTOS:
- Before: 1 active
- Target: 3+ active

DEPARTAMENTO ACTIVO:
- Before: 8 horas/día
- Target: 24/7 con actividad relevante
```

---

## RIESGOS MANAGEMENT

| Riesgo | Mitigación |
|--------|-----------|
| Alfred decide mal | Decision log + Santi review |
| Agentes abrumados | Max 3 proyectos, límite tasks |
| Pérdida de contexto | Logging everything |
| Falsos positivos Roberto | Scoring refinado + feedback |
| Comunicación confusa | Templates estandarizados |

---

## PRÓXIMAS ACCIONES

**HOY (18 Feb):**
- [ ] Santi lee documentos
- [ ] Identifica prioridad #1

**MAÑANA (19 Feb):**
- [ ] Sesión con Santi: Aprobación plan
- [ ] Definir decisiones que puedo tomar

**SEMANA 1:**
- [ ] Empezar con comunicación inter-agentes
- [ ] 1er test: Roberto → Andrés

---

**Documento preparado por:** Alfred
**Para discusión con:** Santi
**Próxima reunión:** Cuando terminé de entrenar
