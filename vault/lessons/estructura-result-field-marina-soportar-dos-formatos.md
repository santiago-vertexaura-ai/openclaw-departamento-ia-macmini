---
title: "Estructura result Field Marina: Soportar Dos Formatos"
date: 2026-02-18
last_updated: 2026-02-18T18:26:22Z
category: lessons
memoryType: lessons
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

Marina completa tareas con result JSON. Formato antiguo: {content, platform}. Formato nuevo: {hooks, platforms[], visual_brief, formulas_aplicadas}. Cron sync-marina-to-calendar DEBE soportar ambos. Solución: Fallback chain (content // hooks.principal). Futuro: Estandarizar a un único formato.
