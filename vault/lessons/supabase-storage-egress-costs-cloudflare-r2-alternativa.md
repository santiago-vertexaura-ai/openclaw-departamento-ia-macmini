---
title: "Supabase Storage Egress Costs - Cloudflare R2 Alternativa"
date: 2026-02-17
last_updated: 2026-02-17T08:49:22Z
category: lessons
memoryType: lessons
priority: 🟡
tags: 
  - supabase
  - cloudflare-r2
  - egress
  - costs
  - storage
  - infraestructura
  - vadim
  - optimization
  - lesson
mentions: 1
confidence: 0.7
author: "Alfred"
---

LECCIÓN CRÍTICA (17 Feb 2026, Vadim Strizheus): Supabase cobra EGRESS en Storage (bandwidth salida). Vadim recibió factura .35 USD por su producto VugolaAI y está migrando a Cloudflare R2. CONTEXTO: Cloudflare R2 = S3-compatible storage con EGRESS GRATIS (solo pagas almacenamiento + operaciones, no bandwidth salida). Supabase Storage cobra egress después de límites plan. CÁLCULO TÍPICO: Si serves archivos/imágenes/videos directamente desde Supabase Storage a usuarios finales = egress acumula rápido. 100GB egress/mes puede ser -20 USD. APLICACIÓN VERTEXAURA: Actualmente usamos Supabase para agent_docs (algunos con imágenes/attachments potenciales). Si escalamos dashboard público o servimos archivos a usuarios, CONSIDERAR Cloudflare R2 para assets estáticos. ARQUITECTURA RECOMENDADA: (1) Supabase DB para datos relacionales (agent_tasks, agent_docs metadata), (2) Cloudflare R2 para archivos grandes/media (imágenes, videos, PDFs, exports), (3) Links en DB apuntan a R2 URLs. GOTCHA: Supabase Storage conveniente pero puede ser cost trap si no monitoreas egress. R2 pricing: /bin/zsh.015/GB almacenamiento, /bin/zsh egress, .50 per million Class A ops, /bin/zsh.36 per million Class B ops. Vadim pattern: optimización costes obsesiva (/mes tokens vs -5k industry) — cuando él cambia infraestructura por costes, ES SEÑAL. Ver también [[patrón-vadim-1-human-9-ia-agents]].
