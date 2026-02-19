---
title: "Browser Cache = Problema Silencioso Recurrente"
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

Síntoma: Usuario no ve cambios en dashboard a pesar de compilación exitosa. Causa: Browser serving old version desde caché. SOLUCIÓN TRIPLE: (1) Incognito Cmd+Shift+N, (2) Hard refresh Cmd+Shift+R, (3) Clear cache Cmd+Shift+Delete. LECCIÓN: Siempre informar usuario sobre caché cuando hay deployment. Futuro: Agregar versión hash en footer dashboard (versionHash=18-19-45).
