---
title: "Problema Crítico - Puerto Binding Status Desconocido (16+ Dias)"
date: 2026-02-18
last_updated: 2026-02-18T13:55:55Z
category: decisions
memoryType: decisions
priority: 🟡
tags: []
mentions: 1
confidence: 0.7
author: "alfred"
---

Hallazgo 16 Feb: 4 puertos públicos (:3000, :5000, :7000, :3443). Se asumió arreglado hace 16 días. 18 Feb script dice '0 expuestos' pero CONFLICTO: auditoría anterior mostró 3. POSIBLE: Se reiniciaron accidentalmente a localhost. RIESGO: NO VERIFICADO FORMALMENTE. CRÍTICO: Ejecutar INMEDIATAMENTE: lsof -i :3000 -i :5000 -i :7000 | grep LISTEN. Si muestra wildcard (*) → SECURITY BREACH, bindear AHORA a 127.0.0.1.
