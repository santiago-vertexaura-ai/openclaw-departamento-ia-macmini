---
title: "Marina Workflow Completamente Automatizado - Sin Documentos, TODO a Calendar"
date: 2026-02-18
last_updated: 2026-02-18T17:19:49Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

18 Feb 2026: Completado workflow nuevo para Marina. Cambios: (1) Marina NO genera documentos. (2) Completa tarea con JSON en result field: {content, platform, scheduled_at}. (3) Cron sync-marina-tasks-to-calendar (cada 5 min) detecta automáticamente y agrega a content_calendar. (4) Santi ve posts en Social Calendar tab con panel Notion-style a la derecha (click = desglose). (5) Botones: Aprobar/Pedir Revisión/Rechazar. (6) Si aprobado → status=approved → cron publica a hora programada. AUTOMATIZACIÓN COMPLETA: Marina genera → cron persiste → Santi aprueba → cron publica. Cero fricción.
