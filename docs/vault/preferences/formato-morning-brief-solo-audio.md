---
title: "Formato Morning Brief - Solo Audio"
date: 2026-02-14
last_updated: 2026-02-14T10:42:59Z
category: preferences
memoryType: preferences
priority: 🟡
tags: 
  - morning-brief
  - audio
  - tts
  - preferencias
  - comunicacion
mentions: 1
confidence: 0.7
author: "Alfred"
---

# Preferencia: Morning Brief Solo en Audio

**Fecha:** 2026-02-14  
**Contexto:** Confirmación explícita de Santi

## Preferencia Clara

> "Solo me respondas en audio, cuando sea el Morning Brief, cuando lo creemos. Si no, responden solo en texto."

**Formato Morning Brief:**
- ✅ SIEMPRE audio (TTS)
- ❌ NUNCA texto
- Duración: 2-3 minutos
- Horario: 08:30 AM

**Formato resto de comunicaciones:**
- Texto por defecto
- Audio solo si el contexto lo requiere o Santi envía audio

## Razón

Santi quiere el Morning Brief en formato consumible mientras hace otras cosas (desayuno, camino, etc.). Audio es más práctico que leer texto.

## Implementación

Cron job debe:
1. Generar resumen 200-300 palabras
2. Convertir a audio con TTS
3. Enviar SOLO archivo audio por Telegram
4. NO incluir texto acompañante

## Relacionado

- [[preferencias-santi-análisis-instagram]]
- Tarea Morning Brief: b7a362d0-fe10-4f7a-94ed-5a1a15bb29e5
