---
title: MÁXIMA SEGURIDAD - Security Hardening Report
date: 2026-02-18
version: 1.0
status: IN-PROGRESS
---

# 🔒 MÁXIMA SEGURIDAD - HARDENING REPORT

**Fecha:** 18 Febrero 2026
**Servidor:** Mac mini de Alfred
**Objetivo:** Zero-exposure architecture (only localhost access)

---

## 📊 ESTADO ACTUAL

### ✅ IMPLEMENTADO
- [x] Firewall macOS: HABILITADO
- [x] System Integrity Protection (SIP): ENABLED
- [x] Permisos sensibles: HARDENED (600/700)
  - .env files: 600 ✅
  - credentials/: 700 ✅
  - ssh/: 700 ✅
  - certs/: 700 ✅
  - jobs.json: 600 ✅

### 🔴 CRÍTICOS - ACCIÓN INMEDIATA REQUERIDA

| Puerto | Servicio | Status | Acción |
|--------|----------|--------|--------|
| 3000 | Node.js Dashboard | 🔴 *:3000 | → 127.0.0.1:3000 |
| 5000 | ControlCenter | 🔴 *:5000 | → 127.0.0.1:5000 |
| 7000 | ControlCenter | 🔴 *:7000 | → 127.0.0.1:7000 |
| 18789 | OpenClaw Gateway | ✅ 127.0.0.1:18789 | OK |

---

## 🔧 CONFIGURACIONES REQUERIDAS

### 1. DASHBOARD (Next.js - Puerto 3000)

**Archivo:** `/Users/alfredpifi/clawd/alfred-dashboard/next.config.ts`

Añadir:
```typescript
const nextConfig = {
  // ... existing config
  server: {
    host: '127.0.0.1',
    port: 3000,
  }
}
```

O ejecutar:
```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

### 2. HTTPS EN DASHBOARD

Certificados autofirmados (ya existen):
- Key: `/Users/alfredpifi/clawd/alfred-dashboard/certs/key.pem` ✅ (600)
- Cert: `/Users/alfredpifi/clawd/alfred-dashboard/certs/cert.pem` ✅ (600)

Implementar en next.config.ts:
```typescript
import fs from 'fs'
import path from 'path'

const nextConfig = {
  server: {
    host: '127.0.0.1',
    port: 3000,
    key: fs.readFileSync(path.join(process.cwd(), 'certs/key.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), 'certs/cert.pem')),
  }
}
```

### 3. ACCESO REMOTO (SSH TUNNEL SOLO)

Para acceder desde otra máquina:

```bash
# Local (desde MacBook en wifi)
ssh -L 3000:127.0.0.1:3000 -L 18789:127.0.0.1:18789 alfredpifi@192.168.1.X

# Entonces acceder: https://localhost:3000
```

NUNCA exponer puertos directamente a internet.

---

## 🚨 RIESGOS IDENTIFICADOS

### Crítico
- ❌ Puertos 3000/5000/7000 escuchando en `*:*` (world-accessible)
- ⚠️ Dashboard HTTPS no implementado

### Alto
- ⚠️ Credenciales en disco sin encripción
- ⚠️ Logs de cron jobs públicos en jobs.json

### Medio
- ℹ️ 13 conexiones remotas activas (revisar origen)
- ℹ️ Considerar rate-limiting en Gateway

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] **Hoy:** Bindear puertos 3000/5000/7000 a 127.0.0.1
- [ ] **Hoy:** Habilitar HTTPS en Dashboard
- [ ] **Mañana:** Implementar SSH tunneling para acceso remoto
- [ ] **Mañana:** Auditar 13 conexiones remotas activas
- [ ] **Esta semana:** Implementar secrets encryption (credenciales)
- [ ] **Esta semana:** Configurar VPN para acceso externo (WireGuard/Tailscale)
- [ ] **Esta semana:** Habilitar logging centralizado
- [ ] **Esta semana:** Rate-limiting en Gateway

---

## 📝 CAMBIOS POR EJECUTAR

### Inmediatos (HOY)

**1. Detener servicios:**
```bash
pkill -f "node.*3000"
pkill -f "ControlCenter.*5000"
pkill -f "ControlCenter.*7000"
```

**2. Actualizar configuraciones (next.config.ts, etc.):**
- Cambiar `0.0.0.0` → `127.0.0.1`
- Cambiar `localhost` → `127.0.0.1` (explicit)

**3. Reiniciar:**
```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

**4. Verificar:**
```bash
lsof -i :3000 | grep LISTEN  # Debe mostrar 127.0.0.1:3000 SOLO
```

---

## 🔐 ARQUITECTURA OBJETIVO

```
Internet
   ↓ (SSH TUNNEL ONLY)
   ↓
Firewall macOS
   ↓
Localhost (127.0.0.1)
   ├─ :3000 (Dashboard - HTTPS)
   ├─ :5000 (ControlCenter)
   ├─ :7000 (ControlCenter)
   └─ :18789 (Gateway)
       ↓
   Internal services (todos localhost)
```

---

## 🎯 PRÓXIMOS PASOS

**Si necesitas acceso remoto:**
1. Implementar WireGuard VPN (recomendado)
   O
2. Usar SSH Port Forwarding (tunneling)

**Nunca:** Exponer puertos directamente a internet (firewall de router)

---

## ✍️ Implementado por
Alfred (Security Hardening - Máxima Seguridad)
18 Febrero 2026 - 14:20 UTC
