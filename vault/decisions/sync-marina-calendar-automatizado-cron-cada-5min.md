---
title: "Sync Marina→Calendar Automatizado (Cron cada 5min)"
date: 2026-02-18
last_updated: 2026-02-18T18:26:22Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

Script: sync-marina-to-calendar.sh (600 líneas) ejecuta cada 5 minutos. Busca agent_tasks donde assigned_to=marina AND status=completada. Si tiene result JSON válido: extrae content/platform/hooks/visual_brief/formulas_aplicadas. Crea entrada content_calendar con status=pending_review. CRITICAL: Soporta dos formatos (content field o hooks.principal). Test: 8 tareas Marina sincronizadas exitosamente. Razón: Automatizar pipeline visual, que Santi no tenga que hacer copy-paste. Impacto: +100% velocidad entrada a calendar.
