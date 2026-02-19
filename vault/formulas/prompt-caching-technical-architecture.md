---
slug: prompt-caching-technical-architecture
title: Arquitectura Técnica - Prompt Caching en OpenClaw/Claude API
category: formulas
tags: [prompt-caching, technical, claude-api, architecture, optimization]
created: 2026-02-17
updated: 2026-02-17
related: [prompt-caching-implementation-feb17-2026, prompt-caching-openclaw-cost-optimization]
confidence: high
---

# Arquitectura Técnica: Prompt Caching en OpenClaw

---

## Concepto Clave

**Prompt caching** almacena tokens procesados en la API de Claude para reutilización, reduciendo costo y latencia.

### Arquitectura de Claude API

```
Request 1:
┌─────────────────────────────────┐
│ System Prompt (20K tokens)      │  ← Procesado, cacheado
│ Document Context (30K tokens)   │  ← Procesado, cacheado  
│ New Query (2K tokens)           │  ← Procesado, resultado
└─────────────────────────────────┘
Cost: 52K × $3/MTok = $0.156

Request 2 (mismo día, <5 min):
┌─────────────────────────────────┐
│ [System Prompt] CACHED          │  ← Reutilizado (10% cost)
│ [Document Context] CACHED       │  ← Reutilizado (10% cost)
│ New Query 2 (2K tokens)         │  ← Procesado, resultado
└─────────────────────────────────┘
Cost: 2K × $3/MTok + 50K × $0.30/MTok = $0.006 + $0.015 = $0.021

Savings: 87% en esta request
```

---

## Implementación en VertexAura

### Estructura de Archivos

```
workspace-roberto/
├── SYSTEM_PROMPT_CACHEABLE.md     ← NUEVO: system prompt estable
├── SOUL.md                        ← Original: valores personales
├── IDENTITY.md                    ← Original: rol y boundaries
└── ... (skills, scripts, etc)

Similar para workspace-andres/ y workspace-marina/
```

### Atributos del System Prompt Cacheable

```yaml
---
title: System Prompt - Roberto (Cacheable)
version: "1.0"
hash: "cacheable-v1.0-20260217"
cache_control: "ephemeral"      # Válido 5 min dentro de sesión
stability: "STABLE"             # No cambiar sin versioning
---
```

**Regla:** Una vez creado, NO CAMBIAR sin incrementar `version` y `hash`.

---

## Flujo en Cron Jobs

### jobs.json Payload (Antes vs Después)

**ANTES:**
```json
{
  "id": "roberto-task-poll",
  "payload": {
    "kind": "agentTurn",
    "message": "eres Roberto, investiga...",
    "model": "claude-haiku-4-5"
  }
}
```

**DESPUÉS:**
```json
{
  "id": "roberto-task-poll",
  "payload": {
    "kind": "agentTurn",
    "message": "eres Roberto, investiga...",
    "model": "claude-haiku-4-5",
    "system_prompt_cacheable": "/Users/alfredpifi/clawd/workspace-roberto/SYSTEM_PROMPT_CACHEABLE.md",
    "cache_control": "ephemeral",
    "cache_version": "cacheable-v1.0-20260217"
  }
}
```

### Ejecución de Jobs

```
Cron trigger @ 10:30 AM
  ↓
Load payload from jobs.json (incluye cache_control + system_prompt_cacheable)
  ↓
sessions_spawn(agentId="roberto", payload=..., model="claude-haiku-4-5")
  ↓
OpenClaw envía request a Claude API CON cache_control headers
  ↓
Claude API:
  - Request 1: Procesa system_prompt (cache hit #1)
  - Request 2: Reutiliza del caché (cache hit #2)
  - ...
  - Request 30: Reutiliza del caché (cache hit #30)
  ↓
Caché expira @ 10:35 AM (5 min ephemeral)
```

---

## Cálculo de Reutilización

### Ventana de Cache Eficiente

Con jobs ejecutándose cada **30 minutos**, cada caché se reutiliza ~6 veces antes de expirar:

```
10:00 - Job 1 ejecuta: 1 nuevo request (cache miss)
10:01 - Task 1.1 ejecuta: Reutiliza caché (cache hit)
10:02 - Task 1.2 ejecuta: Reutiliza caché (cache hit)
...
10:29 - Task 1.6 ejecuta: Reutiliza caché (cache hit)
10:30 - Job 2 ejecuta: 1 nuevo request (cache miss, timeout expirado)
10:31 - Task 2.1 ejecuta: Reutiliza caché (cache hit)
...
```

**Ratio:** 1 miss, 5-10 hits = 80-90% cache hit rate.

---

## Tokens en Caché

### Por Agente (Sistema Prompt)

| Agente | Tokens | Frecuencia | Costo/día (sin caché) |
|--------|--------|------------|----------------------|
| Roberto | 8K | 24× (cada 30 min) | ~$0.58 |
| Andrés | 6K | 24× (cada 30 min) | ~$0.43 |
| Marina | 5K | 24× (cada 30 min) | ~$0.36 |
| **Total** | **19K** | **72×** | **~$1.37/día** |

**Con caché (80% hit rate):**
- 72 requests × 1 miss + 71 hits
- Cost: (19K × $3/MTok) + (19K × 71 × $0.30/MTok)
- = $0.057 + $0.40 = $0.46/día
- **Ahorro: 67% en system prompts**

### Contexto Reutilizado (Vault + Documents)

Si incluyes en cada request:
- Vault knowledge base: ~50K tokens (cacheable)
- Document context: ~30K tokens (cacheable)
- New query: ~2K tokens (no cacheable)

**Total por request:** 82K tokens

**Costo sin caché:** 82K × $3/MTok × 72 requests = $17.66/día  
**Costo con caché:** (82K × $3/MTok) + (82K × $0.30/MTok × 71) = $0.25 + $1.74 = $1.99/día  
**Ahorro:** 89%

---

## Compatibilidad & Versioning

### Claude Models Compatibles

✅ Soportan prompt caching:
- Claude 3.5 Sonnet
- Claude 3 Opus
- Claude 3 Haiku (nuestro caso)

### Versioning Strategy

**Cuando cambiar `cache_version`:**

```yaml
Escenario: Quieres mejorar instrucciones de Roberto

v1.0 → v1.1:
- hash: cacheable-v1.0-20260217 → cacheable-v1.1-20260220
- version: "1.0" → "1.1"
- Nota: Nuevo caché creado, viejo desechado

El cambio es INTENCIONADO y RASTREADO.
```

**Regla:** No cambies hash sin razonable justificación. Versioning inadecuado = caché "envenenado" con prompts viejos.

---

## Monitoreo & Debugging

### Verificar Cache Hit Rates

En OpenClaw logs:
```bash
grep "cache_control" /var/log/openclaw.log
grep "cache_usage_input_tokens" /var/log/openclaw.log  # Indica hits
```

En Supabase agent_activity:
```sql
SELECT 
  agent,
  COUNT(*) as request_count,
  AVG(duration_ms) as avg_latency,
  timestamp
FROM agent_activity
WHERE created_at >= NOW() - INTERVAL 24 HOUR
GROUP BY agent, timestamp;
```

Esperado:
- Latency reduced 3-5x (indica reutilización)
- Cost trending down 80%

### Debugging Cache Miss

Si ves cache miss cuando esperabas hit:

1. **Verificar ventana temporal (< 5 min)** — Si >5 min entre requests, caché expiró
2. **Verificar hash match** — ¿Cambió el system prompt sin actualizar hash?
3. **Verificar model consistency** — ¿Mismo modelo en ambas requests?

---

## Best Practices

### ✅ DO

- ✅ Mantener SYSTEM_PROMPT_CACHEABLE.md estable (cambiar solo cuando mejora)
- ✅ Versionar cambios (v1.0 → v1.1 → v1.2...)
- ✅ Agrupar tasks similares (reutilizan caché)
- ✅ Usar mismo modelo en payload (claude-haiku-4-5 consistently)
- ✅ Monitorear cost trends (verificar ahorros reales)

### ❌ DON'T

- ❌ Cambiar SYSTEM_PROMPT_CACHEABLE.md sin actualizar hash
- ❌ Diferentes versiones en mismo cron job
- ❌ Cambiar system prompt más de 1x/semana (caché poco efectivo)
- ❌ Ignorar monitoreo (no sabrás si funciona)

---

## Escalabilidad

### Agregar Nuevo Agente

Para agregar agente 4 (ej: "Lucia" - performance analyst):

1. Crear `workspace-lucia/SYSTEM_PROMPT_CACHEABLE.md`
2. Agregar job en `jobs.json`:
   ```json
   {
     "id": "lucia-task-poll",
     "payload": {
       "system_prompt_cacheable": "/path/to/SYSTEM_PROMPT_CACHEABLE.md",
       "cache_control": "ephemeral",
       "cache_version": "cacheable-v1.0-20260217"
     }
   }
   ```
3. Agregar `_index.md` y crear cron schedule

**Costo incremental:** ~$0.30/día (system prompt 5K tokens × caché 80%)

---

## Referencias

- Claude API Docs: https://docs.anthropic.com/en/docs/build-a-bot/manage-context-windows
- Prompt Caching Spec: https://docs.anthropic.com/en/docs/build-a-bot/cache-tokens-in-context-windows
- OpenClaw sessions_spawn: `/opt/homebrew/lib/node_modules/openclaw/docs/agents.md`

