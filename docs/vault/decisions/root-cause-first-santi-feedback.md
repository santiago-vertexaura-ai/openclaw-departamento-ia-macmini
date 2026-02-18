---
slug: root-cause-first-protocol
title: "Santi Feedback: Root Cause First (Entender antes de arreglar)"
category: decisions
tags: [protocol, methodology, santi-feedback, process]
author: Alfred
created: 2026-02-18
updated: 2026-02-18
related: [audit-instagram-feed-fix]
---

# Root Cause First Protocol

## Feedback (17 Feb)
"Siempre entender la causa y después arreglar"

## Aplicación
No arreglar síntoma sin investigar raíz. 

## Ejemplos Ejecutados
1. **Instagram feed vacío:** No fue UI bug → fue data no persistida en Supabase
2. **Cron timing lento:** No fue hardware → fue schedule 30min (diseño deficiente)
3. **Security puertos expuestos:** No fue configuración desconocida → fue default bindings

## Protocolo Implementado
```
PROBLEMA → INVESTIGAR (6 niveles) → ENTENDER → ARREGLAR → PREVENIR → DOCUMENTAR
```

## Estándar Ahora
- Esto NO es sugerencia
- Esto es OBLIGATORIO en todo diagnosis
- Si no entiendo causa, no arreglo
