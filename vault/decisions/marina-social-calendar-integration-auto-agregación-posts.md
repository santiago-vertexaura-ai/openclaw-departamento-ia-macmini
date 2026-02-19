---
title: "Marina Social Calendar Integration - Auto-Agregación Posts"
date: 2026-02-18
last_updated: 2026-02-18T16:52:04Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

18 Feb 2026: Implementado protocolo automático. Cuando Marina completa tarea content_creation, automáticamente agrega post a Social Calendar (tabla content_calendar en Supabase). Script: workspace-marina/scripts/add-to-calendar.sh. Parámetros: task_id, title, content, platform, scheduled_time (opcional). Status: pending_review (Santi revisa), review_status: approved (cron publica), rejected (feedback a Marina). Horario default: 08:00 next day. Tabla y índices creados vía SQL en Supabase. REGLA: SIEMPRE agregar al calendario cuando completes tarea content_creation.
