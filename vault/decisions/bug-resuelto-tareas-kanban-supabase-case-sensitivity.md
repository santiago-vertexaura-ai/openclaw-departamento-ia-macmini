---
title: "Bug Resuelto: Tareas Kanban ↔ Supabase Case-Sensitivity"
date: 2026-02-18
last_updated: 2026-02-18T16:44:38Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

18 Feb 17:45: Detectado BUG crítico. Tarea Marina 'Departamento IA VertexAura Twitter' estaba en Supabase con assigned_to='Marina' (mayúscula). Cron de Marina busca assigned_to=eq.marina (minúscula) → tarea invisible, bloqueada 1h. REGLA OBLIGATORIA implementada: assigned_to SIEMPRE minúsculas. Validador automático corre cada hora. Todos los scripts ahora forcean minúsculas. Tarea desbloqueada y visible para Marina.
