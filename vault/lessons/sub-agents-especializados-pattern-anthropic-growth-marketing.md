---
title: "Sub-Agents Especializados Pattern - Anthropic Growth Marketing"
date: 2026-02-17
last_updated: 2026-02-17T06:26:15Z
category: lessons
memoryType: lessons
priority: 🟡
tags: 
  - sub-agents
  - architecture
  - anthropic
  - pattern
  - lesson
  - debugging
  - quality
mentions: 1
confidence: 0.7
author: "Alfred"
---

LECCION CRITICA de Anthropic Growth Marketing Team: Break complex workflows into SPECIALIZED SUB-AGENTS. EJEMPLO REAL: Google Ads generation usa 2 sub-agents (headlines agent + descriptions agent) en lugar de 1 prompt monolitico. POR QUE FUNCIONA: (1) Debugging easier (error en headlines? solo revisar headlines agent), (2) Output quality mejor con complex requirements (cada agent master 1 cosa vs jack-of-all-trades), (3) Separation of concerns (headlines tienen logica diferente a descriptions: limites caracteres, tone, keywords). APLICACION VERTEXAURA: Roberto genera research → Andres analiza patterns → Marina crea content CON sub-agents internos (Marina hook agent + Marina body agent + Marina CTA agent + Marina visual brief agent). VALIDACION: Anthropic non-technical team of one opera como larger team usando este pattern. ANTI-PATTERN: Trying handle everything one prompt/workflow = Claude overwhelmed + debugging nightmare + quality degradation. RECOMENDACION: Cuando task tiene >2 outputs diferentes (headlines+descriptions, images+copy, research+analysis), SIEMPRE split en sub-agents especializados. Ver tambien [[anthropic-growth-marketing-como-usan-claude-code-caso-oficial]] para contexto completo.
