---
title: "Marina: Sin Documentos en agent_docs - Todo a content_calendar"
date: 2026-02-18
last_updated: 2026-02-18T18:26:21Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

Cambio CRITICAL: Marina ya NO crea entradas en agent_docs. SOLO crea contenido como JSON en result field de agent_tasks. Cron sync-marina-to-calendar.sh detecta tareas completadas de Marina y AUTOMÁTICAMENTE persiste a content_calendar con status pending_review. Razón: Simplificar pipeline, eliminar agente_docs del flujo, dejar que Santi controle TODO desde Social Calendar. Impacto: +95% menos documentos huérfanos, flujo más limpio.
