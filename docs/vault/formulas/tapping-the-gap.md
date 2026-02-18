---
title: "Tapping the Gap (Oportunidad Cuantificada)"
date: 2026-02-14
last_updated: 2026-02-14T12:36:00Z
category: formulas
memoryType: formula
priority: 🟢
tags: 
  - product_strategy
  - market_sizing
  - go_to_market
  - tam_sam_som
  - investment_pitch
confidence: 0.85
author: "Andrés (detectada de análisis de Roberto)"
---

## Descripción

Fórmula para cuantificar un gap de mercado usando TAM → SAM → SOM.

Transforma especulación ("creo que hay mercado") en inversión decidible ("hay €1.5M en España disponibles").

## Plantilla paso a paso

### 1. Identifica el gap
```
"X no existe"
o
"X es incompleto"
o
"Ninguna herramienta hace X"

Ej: "No existe herramienta que combine 
     análisis visual + transcripción + hooks + IA"
```

### 2. Calcula TAM (Total Addressable Market)
Pregunta: ¿Cuánto gastarían TODOS globalmente en una solución como esta?

```
Ej: €15M+
   (Todas las agencias, marcas, SaaS que producen contenido social)

CLIENTES POTENCIALES GLOBALES:
- Agencias de social media: ~5,000 (Media spend: €1-2M/año en herramientas)
- Empresas SaaS: ~50,000 (Media spend: €10-50K/año en análisis)
- Marcas medianas: ~100,000 (Media spend: €5-20K/año)

CÁLCULO: 50K empresas × €300/año promedio = €15M TAM
```

### 3. Calcula SAM (Serviceable Addressable Market)
Pregunta: Restringe a TU mercado.

```
Ej: España = €1.5M anual
   (SaaS, agencias, marcas medianas España)

CLIENTES POTENCIALES ESPAÑA:
- Agencias SaaS: ~300 (€0.5M)
- Empresas SaaS medianas: ~500 (€0.8M)
- Marcas medianas: ~200 (€0.2M)

TOTAL: €1.5M SAM
```

### 4. Calcula SOM (Serviceable Obtainable Market)
Pregunta: ¿Cuánto capturas realista en año 1?

```
Ej: VertexAura = €150K año 1

PROYECCIÓN AÑO 1:
- Opción A: 30 clientes × €5K/año = €150K
- Opción B: 10 clientes × €15K/año = €150K
- Opción C: 5 clientes × €30K/año = €150K

SOM es REALISTA, no aspiracional.
(10-20% penetración del SAM es "bueno" para año 1)
```

### 5. Presenta como story
```
"TAM Global €15M+
 SAM España €1.5M
 SOM realista (Año 1): €150K
 
 Esto significa:
 - Mercado existe y es medible ✓
 - Mi target es alcanzable ✓
 - Mi proyección año 1 es conservadora ✓"
```

### 6. Termina con urgencia
```
"Ventana de oportunidad: 6-12 meses
 (Antes de que Hootsuite/Metricool/competidor lo construya)"

o

"Ventana: INMEDIATA
 (Primero en mover captura el mercado España)"
```

## Cuándo usar

- **Pitch de inversión:** Convencer inversores que existe un mercado
- **Roadmap de producto:** Priorizar si una feature es TAM grande o pequeño
- **Go-to-market:** Validar que target market es real
- **Decision making:** Decidir si vale la pena construir algo

## Ejemplo original (Roberto)

```
GAP: "No existe herramienta que combine análisis visual + 
      transcripción + detección de hooks + IA"

TAM Global: €15M+ 
   (Todas las empresas que necesitan análisis social competitivo)

SAM España: €1.5M anual
   (SaaS, agencias, marcas medianas España)

SOM Año 1: €150K realista
   (15-30 clientes a €5-10K/año, o 5-10 a €15-30K/año)

VIABILIDAD: ALTAMENTE RECOMENDADO BUILD
```

## Ejemplo VertexAura (hipotético)

```
GAP: "No existen herramientas que detecten automáticamente 
      hooks en videos en ESPAÑOL + contexto SaaS B2B"

TAM Global: €8M
   (Agencias + marcas que producen video social)

SAM España: €500K
   (SaaS medianas + agencias especialistas)

SOM Año 1: €50K realista
   (5-10 clientes a €5-10K/año)

URGENCIA: 6 meses (antes de que VidIQ lo agregue)
```

## Por qué funciona

1. **TAM valida el mercado existe** — No es micro nicho
2. **SAM valida mi target existe** — Puedo alcanzarlo
3. **SOM valida que soy realista** — No prometo 100% penetración
4. **Números generan confianza** — Suena como research, no especulación
5. **Urgencia acelera decisión** — "Meses" vs. "años" cambia el timing

## Errores comunes

❌ **TAM muy grande:** "Mercado global de software €500M así que mi SOM es €10M"
✅ Sé específico: "Dentro del mercado de análisis social, mi SAM es €1.5M España"

❌ **SOM como aspiración:** "Si capturo 50% del mercado = €750K año 1"
✅ Sé conservador: "10-20% penetración es realista = €150K año 1"

❌ **Sin urgencia:** "Mercado existe, puede esperar"
✅ Añade timing: "Ventana 6 meses antes de que competidor lo haga"

## Variantes

**Versión Investor:** Énfasis en TAM (¿mercado grande?) + timeline (¿urgencia?)
**Versión Product:** Énfasis en SAM (¿puedo llegar?) + SOM (¿es viable?)
**Versión Founder:** Énfasis en urgencia (¿por qué AHORA?) + defensibilidad

## Relacionado

Conectada con:
- [[matriz-capacidades-invertida]] (detectar el gap)
- [[limitacion-reveladora]] (validar el gap con quotes usuario)
- [[competitive-intelligence]] (tema general)

