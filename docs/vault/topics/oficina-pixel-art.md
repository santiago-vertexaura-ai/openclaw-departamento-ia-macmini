---
slug: oficina-pixel-art
title: Oficina Virtual Pixel Art - Dashboard VertexAura
category: topics
tags: [dashboard, visualizacion, contenido, diferenciacion, pixel-art]
created: 2026-02-14
updated: 2026-02-14
related: [contenido-video, roberto, alfred, dashboard]
---

# Oficina Virtual Pixel Art

## Qué es

Una visualización 2D pixel art de la "oficina virtual" del departamento de marketing de [[vertexaura]]. Muestra a los agentes IA ([[alfred]], [[roberto]], Andrés) trabajando en tiempo real en un entorno tipo RPG retro.

## Implementación

- **Tecnología:** HTML5 Canvas + React + TypeScript
- **Ubicación:** `~/clawd/alfred-dashboard/src/components/oficina/OfficeCanvas.tsx`
- **Acceso:** http://127.0.0.1:3000 → Tab "Oficina"

## Características

### Layout de Oficina

- **Suelo:** Cuadrícula azul marino oscuro (vibe retro game)
- **Fila superior (3 salas):**
  - Sala de reuniones (mesa redonda + sillas)
  - Despacho jefe (escritorio ejecutivo, sofá, estantería)
  - Cocina (armarios blancos, nevera, cafetera)
- **Centro:** 2 filas de cubículos (4x2 grid) con pasillos
  - Cada cubículo: escritorio con monitor azul, objeto único por agente, placa nombre, indicador verde/rojo
- **Lado derecho (Lounge):**
  - Sofá, mesa de café, dispensador de agua, puffs, mesa de ping pong, pizarra
- **Decoración:** Plantas/árboles esparcidos

### Agentes

- **Diseño:** Personajes pixel art ~20x40px escalados 2x
- **Características:** Pelo, cara, camisa de color único, pantalones oscuros
- **Animación:**
  - 2 frames de caminar (balanceo brazos + movimiento piernas)
  - Animación de sentado "trabajando" (brazos adelante escribiendo)

### Comportamiento en Tiempo Real

- **Status = "working"** → Personaje camina a su escritorio y se sienta
- **Status = "idle"** → Personaje deambula por la oficina (cocina, lounge, pasillos)
- **Polling:** Consulta endpoint `/api/employee-status` cada 5 segundos para actualizaciones

### Barra de Estado

- Abajo: badges mostrando nombre de cada agente, punto de color, y estado Working/Idle

## Estado Actual (14 Feb 2026)

- **Alfred:** Working (en su cubículo, glow activo, monitor encendido)
- **Andrés:** Working (en su cubículo)
- **Roberto:** Idle (en el lounge)

## Potencial para Contenido

### Por qué funciona

- **Visualmente impactante:** Diferente a todo lo que hay en el mercado
- **Prueba social visual:** Cualquiera que entre ve el "equipo" trabajando en tiempo real → credibilidad inmediata
- **Diferenciación brutal:** Nadie en automatización/IA B2B está haciendo esto
- **Enganche tipo juego:** Similar al artículo viral de Vox (@Voxyz_ai) sobre agentes con personalidades RPG (88k views, 894 bookmarks)

### Ideas para Contenido

1. **Reel/TikTok:** "Así trabaja mi equipo de IA 24/7"
   - Hook: graba momento en que Roberto pasa de idle a working (camina del lounge a su cubículo)
   - Duración: 15-30seg
   - Voiceover explicando qué hace cada agente

2. **Dashboard público embebido:**
   - Link compartible para que cualquiera vea la oficina en tiempo real
   - Cada visita = marketing pasivo

3. **Serie "Día X creando departamento 100% IA":**
   - Usar la oficina como visual principal en cada episodio
   - Mostrar evolución (nuevos agentes, nuevas salas, nuevas funciones)

### Lo que mejoraría

- **Interactividad visible:** Agentes caminando entre zonas más frecuentemente
- **Eventos especiales:** Reuniones (varios agentes en sala de juntas), breaks (todos en cocina)
- **Métricas en pantalla:** Mostrar tareas completadas, tiempo trabajado hoy, etc.

## Comparación con Referencia (Vox)

**Artículo de Vox:** "I Turned My AI Agents Into RPG Characters"
- 88k views, 486 likes, 894 bookmarks
- Ratio guardados/likes = altísimo (1.84) → contenido de referencia/utilidad

**Nuestra implementación:**
- Vox: personalidades tipo RPG (conceptual)
- VertexAura: visualización pixel art + datos en tiempo real (tangible)
- **Ventaja:** Llevamos el concepto un paso más allá con interfaz visual

## Próximos Pasos

1. Grabar clip de 15-30seg para Reel/TikTok
2. Preparar guión con hook + voiceover
3. Considerar dashboard público para compartir

---

**Estado:** Implementado ✅ | **Prioridad contenido:** Alta 🔥
