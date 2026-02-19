---
title: "Todos los Scrapers Deben Auto-Persistir a Supabase"
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

Patrón descubierto: instagram-apify.sh generaba JSON pero NO lo guardaba en Supabase → 100% data loss, invisible en dashboard. REGLA: Si script genera datos (scrape/analysis/content) → MUST curl POST a Supabase inmediatamente. No confiar en 'lo guardaré después'. Aplicar a: instagram-apify, youtube-analyzer, twitter-scraper, etc. Documentado en TOOLS.md.
