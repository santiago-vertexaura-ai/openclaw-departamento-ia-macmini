---
title: "Task Deduplication - Evitar duplicados en Supabase"
date: 2026-02-18
last_updated: 2026-02-18T18:10:09Z
category: lessons
memoryType: lessons
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

18 Feb 2026: Descubierto que cron 'Alfred - Procesar tareas propias' creaba 3+ tareas duplicadas sin verificar. Causa: No hay dedup_key ni verificación de timestamp. Solución: Implementado dedup-task.sh que antes de crear tarea: (1) busca similar por keyword, (2) si existe hace <30min → SKIP (debounce), (3) si existe hace >30min → UPDATE, (4) si no existe → CREATE. Integración: Todo cron debe llamar dedup-task.sh ANTES de curl -X POST. Status: Script listo, duplicados viejos borrados, documentación en TASK-DEDUPLICATION-PROTOCOL.md. Próxima: Agregar dedup_key a Supabase schema.
