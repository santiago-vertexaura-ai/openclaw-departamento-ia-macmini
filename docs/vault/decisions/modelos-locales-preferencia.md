---
title: "modelos-locales-preferencia"
date: 2026-02-16
last_updated: 2026-02-16T18:56:18Z
category: decisions
memoryType: decisions
priority: 🔴
tags: 
  - modelos
  - ollama
  - costes
mentions: 1
confidence: 0.7
author: "Alfred"
---

Santi prefiere modelos locales sobre cloud cuando sea posible. Razones: ahorro de costes + independencia de proveedores. Orden de prueba para agentes: (1) GLM 4.7 Flash — 87.4 τ²-Bench, mejor tool calling open source, (2) qwen3-agentic — diseñado para agentes, (3) qwen3-coder-agentic — versión coding, (4) qwen3:30b — estándar, (5) mistral-nemo — ligero. Cloud (Haiku 4.5) solo como ÚLTIMO recurso. IMPORTANTE: phi4-reasoning y qwen2.5-coder-tools NO funcionan con OpenClaw tools. [[departamento-marketing-autonomo]]
