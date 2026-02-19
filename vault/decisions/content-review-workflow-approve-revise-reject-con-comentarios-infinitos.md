---
title: "Content Review Workflow: Approve/Revise/Reject con Comentarios Infinitos"
date: 2026-02-18
last_updated: 2026-02-18T18:26:21Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

Sistema de revisión completo implementado. Santi puede: (1) Aprobar (→ aprobado), (2) Pedir Revisión con comentarios (→ pending_revision), (3) Rechazar. Si pide revisión: comentarios se guardan en revision_feedback + se crea tarea urgente Marina con feedback en comments. Marina REGENERA contenido y devuelve a pending_review. Loop infinito sin límite. Decisión: revision_count + revision_history rastrean iteraciones. Impacto: Garantiza que Marina ve EXACTAMENTE qué pedir Santi, no hay malentendidos.
