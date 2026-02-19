---
title: "Agentes ahora hablan directamente entre sí (no solo through Alfred)"
date: 2026-02-19
last_updated: 2026-02-18T23:30:05Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

Cambio operacional: antes Roberto→Alfred→Andrés→Alfred→Marina (bottleneck). Ahora Roberto→Andrés (directo), Andrés→Marina (directo), todos reportan a Alfred. Ganancia: 90% menos latencia. Regla: si hay disagreement (Roberto vs Marina), Alfred arbitra + consulta Santi.
