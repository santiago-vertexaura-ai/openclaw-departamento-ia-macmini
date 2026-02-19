---
title: "Credenciales - Manifest y Ubicación"
date: 2026-02-18
location: "Proton Pass (encriptado)"
status: "DOCUMENTO CONFIDENCIAL"
---

# 🔐 MANIFEST DE CREDENCIALES

**Ubicación:** Proton Pass (encriptado)
**Backup:** Sincronizado automático Proton
**NUNCA en Git:** ✅ Confirmado

---

## 📋 LISTA COMPLETA

### ANTHROPIC
```
Tipo: API Key
Nombre: ANTHROPIC_API_KEY
Donde se usa:
  - Gateway OpenClaw (.env.local)
  - Dashboard (environment variables)
  - Scripts de auditoría
  - Sub-agents (sessions)
Rotación: Cada 6 meses
Almacenamiento: Proton Pass
Status: ✅ ACTIVO
```

### SUPABASE
```
Tipo: Multiple Keys
Claves:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY

Donde se usa:
  - Dashboard (queries)
  - Scripts de tareas (agent_tasks)
  - Auditorías (agent_docs)
  - Memoria (sessions)

Rotación: Cada 6 meses
Almacenamiento: Proton Pass
Status: ✅ ACTIVO
```

### TELEGRAM
```
Tipo: Bot Token
Nombre: TELEGRAM_BOT_TOKEN
Donde se usa:
  - Delivery de mensajes (crons)
  - Alertas de seguridad
  - Morning/evening briefs (audio)

Rotación: Según necesidad
Almacenamiento: Proton Pass
Status: ✅ ACTIVO
```

### GITHUB
```
Tipo: Personal Access Token
Nombre: [REDACTED - stored in Proton Pass]
Donde se usa:
  - Commits automáticos (22:30 cron)
  - Pushes a repo privado
  - Sincronización infraestructura

Rotación: Cada 3 meses
Almacenamiento: Proton Pass
Status: ✅ ACTIVO (18 Feb 2026)
```

### OPENAI/OTROS (Si aplica)
```
Tipo: [API Key / Token]
Nombre: [NOMBRE]
Donde se usa: [SERVICIOS]
Status: [ESTADO]
```

---

## 🔄 PROTOCOLO DE ROTACIÓN

### ANTHROPIC API KEY
```bash
# 1. Generar nueva key en Anthropic Console
# 2. Actualizar en Proton Pass
# 3. Actualizar en .env.local (local machine)
# 4. Actualizar en ~/.openclaw/.env
# 5. Reiniciar gateway: openclaw gateway restart
# 6. Verificar: openclaw models status
# 7. Documentar cambio en MEMORY.md
```

### SUPABASE KEYS
```bash
# 1. Regenerar en Supabase Console
# 2. Actualizar en Proton Pass
# 3. Actualizar en .env.local
# 4. Reiniciar dashboard
# 5. Verificar conectividad queries
# 6. Documentar cambio
```

### GITHUB TOKEN
```bash
# 1. Crear nuevo token en GitHub Settings
# 2. Seleccionar repo y permisos (contents: read+write)
# 3. Actualizar en Proton Pass
# 4. Actualizar en /tmp/commit-diario.sh (GITHUB_TOKEN=...)
# 5. Test: git push a repo de prueba
# 6. Documentar cambio
```

---

## ✅ CHECKLIST DE SEGURIDAD

- [ ] NUNCA commitear credenciales a Git
- [ ] NUNCA dejar credenciales en plaintext local
- [ ] NUNCA compartir tokens por chat/email
- [ ] Almacenamiento: SOLO Proton Pass
- [ ] Backup: Proton sincroniza automáticamente
- [ ] Rotación: CADA 6 MESES (calendario en MEMORY.md)
- [ ] Acceso: SOLO Santi + scripts automáticos

---

## 📅 PRÓXIMA ROTACIÓN

**Fecha recomendada:** 18 Agosto 2026 (6 meses desde 18 Feb)

**Checklist:**
```
- [ ] ANTHROPIC_API_KEY
- [ ] SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] GITHUB_TOKEN
- [ ] TELEGRAM_BOT_TOKEN (si es necesario)
```

---

## 🚨 EMERGENCIA

Si alguna credencial se expone:

1. **INMEDIATO:** Revocar en servicio (Anthropic, Supabase, GitHub)
2. **MISMO DÍA:** Generar nueva credencial
3. **MISMO DÍA:** Actualizar en Proton Pass
4. **MISMO DÍA:** Actualizar en sistemas (.env, scripts)
5. **MISMO DÍA:** Documentar incidente en MEMORY.md

---

**Documento clasificado:** CONFIDENCIAL
**Requiere acceso:** Santi + Alfred
**Última actualización:** 18 Febrero 2026
