---
title: "VLM Local Strategy - Qwen con GPU local en lugar de APIs"
date: 2026-02-16
last_updated: 2026-02-16T09:04:05Z
category: decisions
memoryType: decisions
priority: 🟡
tags: 
  - vlm
  - qwen
  - gpu
  - local
  - api-cost-optimization
  - video-analysis
mentions: 1
confidence: 0.7
author: "Alfred"
---

FEEDBACK SANTI (15 Feb digest semanal): Propone usar Qwen VLM con GPUs locales (DGX Spark o Mac mini M4) en lugar de APIs externas. APLICACIÓN: Análisis de apps España (competencia) + análisis YouTube (transcripción + visual). BENEFICIOS: (1) Costes operativos bajos vs APIs, (2) Control total sobre procesamiento, (3) No dependencia de APIs externas (uptime, rate limits, pricing changes). PRIORIDAD: MEDIA (investigar, no urgente). ACCIÓN: Roberto debe investigar setup técnico de Qwen VLM + requisitos infra GPU (DGX Spark vs Mac mini M4). FILOSOFÍA: Preferir tooling local cuando los costes de APIs escalan y hay alternativas viables con control local.

Relacionado con [[como-piensa-santi-costes]].
