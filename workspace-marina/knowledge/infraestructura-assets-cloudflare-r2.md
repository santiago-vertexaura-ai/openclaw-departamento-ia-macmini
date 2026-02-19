# Infraestructura Assets - Cloudflare R2 vs Supabase Storage

**Fecha:** 17 Feb 2026  
**Fuente:** Tweet Vadim Strizheus + Lección Departamento  
**Relevancia:** Donde almacenar imágenes/videos/assets que generas

---

## 🚨 **PROBLEMA DETECTADO**

**Vadim Strizheus** (solo-founder, 9 agentes IA, obsesivo con optimización costes) recibió factura **$104.35 USD** en Supabase por **egress de Storage**.

**Su reacción:** "Making the switch [to Cloudflare R2] tonight"

**Fecha:** 17 Feb 2026  
**Tweet:** https://x.com/VadimStrizheus/status/2023592849741148344

---

## 💰 **QUÉ ES EGRESS**

**Egress** = bandwidth de salida cuando usuarios descargan/acceden archivos desde storage.

**Ejemplo:**
- Subes imagen 1MB a Supabase Storage
- 1.000 usuarios la ven en tu web
- Egress = 1.000 MB = 1GB
- Supabase cobra por ese 1GB de bandwidth

**Escala rápido con:**
- Imágenes en posts (cada view = egress)
- Videos (cada reproducción = egress masivo)
- PDFs/documentos descargables
- Assets servidos directamente a usuarios

---

## 🆚 **SUPABASE STORAGE vs CLOUDFLARE R2**

### **Supabase Storage**

✅ **Pros:**
- Integrado con Supabase DB (mismo dashboard)
- Auth built-in (row-level security)
- Fácil setup
- CDN incluido

❌ **Cons:**
- **Cobra egress** después de límites plan
- Puede ser cost trap si no monitoreas
- Vadim pagó $104.35 (señal de alerta)

### **Cloudflare R2**

✅ **Pros:**
- **EGRESS GRATIS** (0 costo bandwidth salida)
- S3-compatible (APIs estándar)
- Pricing predecible
- Cloudflare CDN global

❌ **Cons:**
- Setup separado (no integrado con Supabase)
- Auth manual (si necesitas private files)
- Otra cuenta/servicio que gestionar

**Pricing R2:**
- $0.015/GB almacenamiento/mes
- $0 egress (GRATIS)
- $4.50 per million Class A operations (write/list)
- $0.36 per million Class B operations (read)

---

## 🎯 **APLICACIÓN PARA TI (Marina)**

### **Cuando creas contenido:**

**ESCENARIO 1: Posts LinkedIn/Twitter (texto + 1-2 imágenes)**
- ✅ **OK Supabase Storage** (bajo egress, pocas views repetidas)
- Guardas imagen en Supabase, link en agent_docs
- Egress mínimo

**ESCENARIO 2: Videos para Reels/TikTok**
- ⚠️ **CUIDADO Supabase** (videos = mucho egress)
- Si sirves video desde Supabase → cada view consume bandwidth
- **Mejor:** Cloudflare R2 o upload directo a plataforma (IG/TikTok)

**ESCENARIO 3: Assets reutilizables (logos, templates, recursos)**
- ✅ **Cloudflare R2** (se reutilizan mucho, egress acumula)
- Ejemplo: Logo VertexAura usado en 50 posts → mejor en R2

**ESCENARIO 4: Contenido público masivo (ebook, PDF lead magnet)**
- ✅ **Cloudflare R2** (muchas descargas = mucho egress)
- 1.000 descargas PDF 5MB = 5GB egress = $5-10 USD en Supabase
- En R2 = $0

---

## 📋 **ARQUITECTURA RECOMENDADA (VertexAura)**

### **Actual:**
- Supabase DB: agent_tasks, agent_docs (metadata)
- Supabase Storage: algunos attachments (bajo uso)

### **Si escalamos contenido:**

1. **Supabase DB** → Datos relacionales (tasks, docs metadata, auth)
2. **Cloudflare R2** → Assets grandes/públicos (videos, PDFs, imágenes reutilizadas)
3. **Links en DB** → Apuntan a R2 URLs

**Beneficio:** Costes predecibles. Si generamos 100 posts con imágenes vistas 10K veces cada uno = 0 costo egress extra en R2.

---

## ⚠️ **CUÁNDO PREOCUPARSE**

**Señales de alerta Supabase egress:**
- Dashboard público sirviendo imágenes/archivos a muchos usuarios
- Videos embebidos (cada play = egress)
- Lead magnets descargables (PDFs/recursos)
- Assets servidos directamente vs CDN externo

**Vadim signal:** Cuando un solo-founder obsesivo con optimización costes migra de Supabase Storage a R2 **esa misma noche** → es que el problema es REAL.

---

## 💡 **ACCIÓN PARA TI**

### **Corto plazo (ahora):**
- Continúa usando Supabase Storage para contenido low-volume
- Assets posts individuales LinkedIn/Twitter = OK

### **Mediano plazo (si escalamos):**
- Propón migrar assets grandes/públicos a Cloudflare R2
- Setup R2 bucket para videos/PDFs/recursos descargables
- Arquitectura dual: metadata Supabase, files R2

### **Largo plazo:**
- Monitorear costes Supabase mensualmente
- Si egress >$10/mes → evaluar migración completa a R2

---

## 🔗 **RECURSOS**

- Tweet Vadim: https://x.com/VadimStrizheus/status/2023592849741148344
- Vault lesson: [[supabase-storage-egress-costs-cloudflare-r2-alternativa]]
- Patrón Vadim: [[patrón-vadim-1-human-9-ia-agents]]
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/

---

## 📝 **RESUMEN EJECUTIVO**

**Lección:** Supabase Storage conveniente pero cobra egress. Si sirves archivos públicos a muchos usuarios, costes acumulan rápido ($104 USD caso Vadim).

**Alternativa:** Cloudflare R2 = S3-compatible, egress GRATIS, pricing predecible.

**Para ti:** Usa Supabase para contenido low-volume. Si escalamos a videos/PDFs/descargables masivos → propón R2.

**Señal:** Vadim (obsesivo optimización costes) migró esa misma noche → problema real, no edge case.

---

**Actualizado:** 17 Feb 2026, 10:05h  
**Por:** Alfred  
**Prioridad:** Medium (informativo, no urgente)
