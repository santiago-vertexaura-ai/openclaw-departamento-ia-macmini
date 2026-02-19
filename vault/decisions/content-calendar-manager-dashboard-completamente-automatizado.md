---
title: "Content Calendar Manager - Dashboard Completamente Automatizado"
date: 2026-02-18
last_updated: 2026-02-18T17:21:09Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

18 Feb 2026: Implementado ContentCalendarManager.tsx en dashboard. Cambios: (1) Social Calendar tab ahora muestra lista de posts en izquierda. (2) Click en post → abre panel derecha (50% pantalla) con preview completo, metadata, botones. (3) Botones: Aprobar (status=approved), Revisar (pide feedback, crea tarea Marina), Rechazar (crea tarea urgente). (4) Feedback en textarea → sistema crea automáticamente tarea Marina con contexto. (5) Real-time updates via Supabase subscription. (6) Marina genera → cron persiste → Santi controla TODO desde dashboard. CERO documentos, TODO en calendar. Componente: src/components/social/ContentCalendarManager.tsx
