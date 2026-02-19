# Carousel Creator — Skill de Marina

## Cuando usar
- task_type: `carousel_creator` o cuando brief.platforms incluye "linkedin" o "instagram" con contenido educativo/listicle
- Ideal para: tutoriales paso a paso, comparativas, listas de tips, frameworks

## Input requerido
1. Doc fuente (via `content.sh fetch-source <doc_id>`)
2. Voice examples (via content.sh fetch-voice)
3. Platform constraints (config/platforms.json)

## Output Schema

### JSON resultado
```json
{
  "platforms": ["linkedin", "instagram"],
  "format": "carousel",
  "slide_count": 8,
  "hooks": {
    "principal": "Slide 1 — titulo del carrusel",
    "variante_1": "Alternativa de portada",
    "variante_2": "Otra alternativa"
  },
  "formulas_aplicadas": ["formula-xxx"],
  "source_doc_id": "uuid",
  "visual_brief": ["Slide 1: fondo oscuro, titulo grande...", "Slide 2: icono + texto..."]
}
```

### Documento (/tmp/marina_doc.md)
```markdown
# Carrusel: [Titulo]

## Slide 1 (Portada/Hook)
**Titulo**: [Titulo impactante, max 8 palabras]
**Subtitulo**: [Contexto breve]
**Visual**: [Descripcion del diseno]

## Slide 2-N (Contenido)
**Titulo**: [Titulo de la slide]
**Cuerpo**: [2-3 lineas max, idea clara]
**Visual**: [Icono o grafico sugerido]

## Slide Final (CTA)
**Titulo**: [Resumen o invitacion]
**CTA**: [Accion especifica]
**Visual**: [Diseno de cierre]

## Caption LinkedIn
[Caption que acompana el carrusel, 500-800 chars]

## Caption Instagram
[Caption adaptada a IG, max 2200 chars, con emojis moderados]
```

## Reglas
1. Max 10 slides (ideal 6-8)
2. 1 idea por slide — NUNCA sobrecargues
3. Titulos de max 8 palabras por slide
4. Cuerpo de max 3 lineas por slide
5. Slide 1 = hook visual (titulo provocador + subtitulo)
6. Ultima slide = CTA claro (seguir, guardar, compartir)
7. Consistencia visual en todas las slides
8. LinkedIn: formato cuadrado (1080x1080) o vertical (1080x1350)
9. Instagram: vertical (1080x1350) preferido
