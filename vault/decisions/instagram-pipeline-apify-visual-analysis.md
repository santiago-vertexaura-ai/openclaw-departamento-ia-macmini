---
title: "Instagram Pipeline Apify + Visual Analysis"
date: 2026-02-17
last_updated: 2026-02-17T13:03:10Z
category: decisions
memoryType: decisions
priority: 🟡
tags: 
  - instagram
  - apify
  - visual
  - pipeline
  - decision
mentions: 1
confidence: 0.7
author: "Claude"
---

Pipeline Instagram implementado 17 Feb 2026. Apify reemplaza instaloader (rate limits resueltos). Scripts: instagram-apify.sh (scrape/profile/reels/dedup), visual-analysis.sh (ffmpeg+OCR+Gemma3:27b+Whisper). Cuentas: santim.ia, rackslabs, mattganzak. Dedup via seen_posts.json. Videos en /tmp (borrado inmediato). Cron roberto-ig-scan actualizado. [[model-routing-haiku-default]] [[pipeline-contenido]]
