---
title: "supabase-egress-control"
date: 2026-02-17
last_updated: 2026-02-16T23:21:08Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "system"
---

Minimizar egress Supabase: queries con select especificos (no *), excluir content en listados, truncar campos largos, limitar resultados. Free tier = 2GB/mes egress. [[como-piensa-santi-costes]]
