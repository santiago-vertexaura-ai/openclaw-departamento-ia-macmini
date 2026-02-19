---
slug: prompt-caching-monitoring-checklist
title: Prompt Caching - Monitoring & Health Check
category: topics
tags: [prompt-caching, monitoring, cost-tracking, performance-metrics, health-check]
created: 2026-02-17
updated: 2026-02-17
related: [prompt-caching-implementation-feb17-2026, prompt-caching-technical-architecture]
---

# Prompt Caching: Monitoring & Health Check

---

## Weekly Checklist

### Cost Verification (Every Monday)

```bash
# 1. Check cost-ledger
cat /Users/alfredpifi/clawd/cost-ledger.json | jq '.agents[] | {name, cost_this_week, cost_last_week}'

# Expected: 80% reduction vs last week before caching
```

**Métrica esperada:**
```
Last week (sin caché): $550/semana
This week (con caché): $110/semana
Reduction: 80% ✅
```

**Si no ves 80%:**
- [ ] Verificar que jobs.json tiene cache_control directives
- [ ] Confirmar que system prompts NO cambiaron (sin cache miss)
- [ ] Revisar OpenClaw logs para errores de caché

---

### Latency Metrics (Every Wednesday)

```sql
-- En Supabase: agent_activity table
SELECT 
  agent,
  DATE_TRUNC('day', created_at) as day,
  AVG(duration_ms) as avg_duration,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration
FROM agent_activity
WHERE created_at >= NOW() - INTERVAL 14 DAYS
GROUP BY agent, day
ORDER BY day DESC;
```

**Esperado:**
- **Roberto:** 4000ms (sin caché) → 1000ms (con caché) = 4x faster
- **Andrés:** 3500ms → 900ms = 3.9x faster
- **Marina:** 3000ms → 800ms = 3.75x faster

**Si latency NO mejora:**
- [ ] Verificar que requests son idénticas (mismo system prompt)
- [ ] Confirmar que hay <5 min entre requests (dentro de ventana caché)
- [ ] Revisar si hay network delays externos

---

### System Prompt Stability (Every Friday)

```bash
# Check if SYSTEM_PROMPT_CACHEABLE files changed
git diff workspace-*/SYSTEM_PROMPT_CACHEABLE.md

# Expected: NO changes (unless versioned intentionally)
```

**If files changed:**
- [ ] Confirm version bumped (v1.0 → v1.1 → ...)
- [ ] Confirm cache_version updated in jobs.json
- [ ] Confirm reason documented in vault (decision comment)

**Regla:** SYSTEM_PROMPT_CACHEABLE.md should be FROZEN except for intentional improvements.

---

### Cache Hit Rate Estimation

Based on cost reduction, calculate hit rate:

```
Formula: (Cost_before - Cost_after) / (Cost_before - Cost_new_only) × 100%

Example:
- Cost without caching: $100/day
- Cost with caching: $20/day
- Cost of new tokens only: $10/day
- Hit rate: ($100 - $20) / ($100 - $10) × 100% = 88.9%
```

**Healthy range:** 75-95% (if <75%, diagnose immediately)

---

## Monthly Deep Dive

### Analyze Cost Trends

```bash
# 1. Generate cost history
cat /Users/alfredpifi/clawd/cost-history.json | jq '.daily[] | {date, total_cost, by_agent}'

# 2. Calculate week-over-week
# Week 1 (pre-caching): $2,000
# Week 2 (post-caching): $400
# Delta: 80% savings ✅

# 3. Project annual savings
# Monthly: $2000 - $400 = $1,600 savings
# Annual: $1,600 × 12 = $19,200 savings
```

### Compare vs Baseline

Track this metric monthly:

| Week | Costs | vs Previous | vs Pre-Caching | Cache Benefit |
|------|-------|-----------|----------------|---------------|
| Week 1 (Feb 10) | $550 | - | baseline | 0% |
| Week 2 (Feb 17) | $110 | -80% | -80% | ✅ |
| Week 3 (Feb 24) | $95 | -14% | -83% | ✅✅ |
| Week 4 (Mar 3) | $100 | +5% | -82% | ✅✅ |

**Healthy:**
- Week-to-week variance <20% (normal fluctuation)
- Consistent 80%+ reduction vs baseline

**Warning signs:**
- Sudden cost increase >$150 (caché perdido)
- Latency increases (caché no funcionando)
- Hit rate <70% (diagnóstico requerido)

---

## Quarterly Review

### 1. Cost-Benefit Analysis

```
Tokens Cached: ~100K tokens (system prompts + frequent contexts)
Cache Hit Rate: ~85% (healthy)
Monthly Cost Savings: $1,600
Implementation Cost: 0 (no cambios en código)
Time Investment: 4h (implementación)
ROI: Infinite (payoff in <1 day)
```

### 2. Scaling Assessment

```
Current: 3 agents × ~100 tasks/day
Potential: 3 agents × ~500 tasks/day (same cost)
Additional agents possible: 2-3 without cost increase
```

If seeing sustained 85% hit rate, consider:
- Scaling agents
- Expanding cached context (vault, documents)
- Reducing prompt refresh interval

### 3. Documentation Update

- [ ] Review SYSTEM_PROMPT_CACHEABLE.md versions
- [ ] Update technical architecture if needed
- [ ] Prepare case study for external audiences

---

## Alert Thresholds

### 🔴 CRITICAL (Immediate Action)

- Cost increase >30% vs previous week
- Cache hit rate <60%
- Latency increase >50% from baseline

**Action:** Run diagnostics, check jobs.json, review OpenClaw logs

### 🟡 WARNING (Within 48 Hours)

- Cost trending up over 2 consecutive weeks
- Latency inconsistency (P95 > 3x P50)
- SYSTEM_PROMPT_CACHEABLE.md changed without versioning

**Action:** Investigate root cause, document findings

### 🟢 HEALTHY (No Action)

- Cost steady or decreasing
- Cache hit rate 75-95%
- Latency consistently <2s for cached requests
- SYSTEM_PROMPT_CACHEABLE.md stable

---

## Diagnostic Runbook

### If Cost Went UP

```bash
# 1. Check if prompts changed
git log --oneline workspace-*/SYSTEM_PROMPT_CACHEABLE.md

# If changed, is version bumped?
grep "cache_version" /Users/alfredpifi/.openclaw/cron/jobs.json | sort | uniq

# Expected: All match. If different versions, cache not shared.

# 2. Check if jobs.json is valid
jq empty /Users/alfredpifi/.openclaw/cron/jobs.json && echo "✅ Valid" || echo "❌ Invalid"

# 3. Check OpenClaw gateway status
openclaw gateway status

# 4. Review recent changes
git diff HEAD~10 /Users/alfredpifi/.openclaw/cron/jobs.json
```

### If Latency Increased

```bash
# 1. Check system resource usage
top -n 1 | grep openclaw

# 2. Check network latency
ping -c 5 api.anthropic.com

# 3. Check if Claude API is healthy
# curl -s https://status.anthropic.com | grep operational

# 4. Compare request sizes
# If sudden increase, cache may not be effective
```

### If Cache Hit Rate Low

```bash
# 1. Check system prompt consistency
md5sum workspace-*/SYSTEM_PROMPT_CACHEABLE.md

# Expected: Same MD5 across identical files
# If different, check versions

# 2. Check if requests are within 5-minute window
# Review agent_activity timestamps for gaps

# 3. Check if same model being used
grep "model" /Users/alfredpifi/.openclaw/cron/jobs.json | sort | uniq

# Expected: All say "claude-haiku-4-5" (or consistent model)
```

---

## Monthly Report Template

**Subject:** Prompt Caching Health Check - [Month]

```
EXECUTIVE SUMMARY
─────────────────
Cache Hit Rate: ___% (target: 75-95%)
Cost Savings: $___/month (target: 80%)
Latency Improvement: ___x faster (target: 3-5x)

METRICS
───────
Week 1: Cost $____, Latency ___ms, Hitrate ___%
Week 2: Cost $____, Latency ___ms, Hitrate ___%
Week 3: Cost $____, Latency ___ms, Hitrate ___%
Week 4: Cost $____, Latency ___ms, Hitrate ___%

ISSUES IDENTIFIED
─────────────────
[ ] Cost anomalies
[ ] Latency spikes
[ ] Cache misses
[ ] Prompt drift

ACTIONS TAKEN
─────────────
[ ] Updated documentation
[ ] Scaled agents (if applicable)
[ ] Optimized prompts
[ ] Other: ___________

NEXT MONTH GOALS
────────────────
- Maintain >80% hit rate
- Keep costs <$120/week
- Prepare scaling plan (if ready)
```

---

## Emergency Rollback

If caching causes issues, revert immediately:

```bash
# 1. Restore jobs.json backup
cp /Users/alfredpifi/.openclaw/cron/jobs.json.backup-[timestamp] \
   /Users/alfredpifi/.openclaw/cron/jobs.json

# 2. Verify
jq '.jobs[] | .payload.cache_control' /Users/alfredpifi/.openclaw/cron/jobs.json
# Expected: null (no cache directives)

# 3. Restart OpenClaw
openclaw gateway restart

# 4. Document incident
echo "Rollback: [reason]" >> vault/topics/incidents-log.md
```

**Timeline:** Rollback takes <2 minutes, costs revert immediately.

