---
title: "Auditoría Seguridad - 4 puertos expuestos públicamente (16 Feb)"
date: 2026-02-16
last_updated: 2026-02-16T09:03:57Z
category: decisions
memoryType: decisions
priority: 🔴
tags: 
  - seguridad
  - vulnerabilidad
  - firewall
  - macos
  - urgente
mentions: 1
confidence: 0.7
author: "Alfred"
---

HALLAZGO CRÍTICO (16 Feb 04:00): Auditoría detectó 4 puertos expuestos públicamente en Mac mini, accesibles desde internet (no localhost only). PUERTOS AFECTADOS: (1) 49152 rapportd (Apple sync), (2) 7000 ControlCenter, (3) 5000 ControlCenter, (4) 3283 ARDAgent (Remote Desktop). RIESGO: Alto - vectores de ataque potenciales para acceso no autorizado al sistema. RECOMENDACIÓN URGENTE: (a) Configurar firewall macOS (pfctl) para bloquear acceso externo, (b) Deshabilitar servicios Apple innecesarios (Remote Desktop, ControlCenter), (c) Corregir permisos jobs.json (chmod 600). SERVICIOS SEGUROS CONFIRMADOS: gateway (localhost), dashboard (localhost), ollama (localhost), nginx (localhost). ACCIÓN PENDIENTE: Santi debe decidir si aplicar las correcciones recomendadas. Informe completo: /Users/alfredpifi/clawd/research/reports/security-audit.json

Relacionado con [[proyectos-activos]].
