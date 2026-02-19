# Trend Reaction — Skill de Marina

## Cuando usar
- task_type: `trend_reaction` o cuando el brief incluye URL de tweet/post de un creator
- Contenido reactivo: responder a tendencias, tweets virales, posts de creators seguidos
- Oportunidad: dar la perspectiva de VertexAura sobre algo que ya tiene traccion

## Input requerido
1. URL o contenido del tweet/post original (en brief o comments)
2. Doc fuente relacionado si existe (via `content.sh fetch-source <doc_id>`)
3. Voice examples (via content.sh fetch-voice)
4. Contexto VertexAura (que construimos, que sabemos hacer)

## Output Schema

### JSON resultado
```json
{
  "platforms": ["twitter", "linkedin"],
  "format": "trend_reaction",
  "original_url": "https://x.com/...",
  "original_author": "@handle",
  "reaction_type": "agree_and_extend | disagree_with_data | our_version | add_perspective",
  "hooks": {
    "principal": "Hook principal de la reaccion",
    "variante_1": "Alternativa",
    "variante_2": "Otra alternativa"
  },
  "source_doc_id": "uuid o null",
  "visual_brief": "Descripcion de imagen/grafico"
}
```

### Documento (/tmp/marina_doc.md)
```markdown
# Reaccion: [Titulo descriptivo]

## Contexto Original
- Autor: @handle
- URL: [url]
- Resumen: [que dijo/publico]

## Nuestra Reaccion

### Twitter/X
[Tweet o thread reaccionando, max 280 chars por tweet]
Referencia al original: "Como dice @handle..." o "Viendo el post de @handle..."

### LinkedIn
[Post mas extenso con nuestra perspectiva completa]
Datos propios que respaldan o complementan el original.

## Angulo VertexAura
[Por que esta reaccion demuestra nuestra autoridad]
[Datos reales de nuestros sistemas que respaldan la opinion]

## Visual Brief
[Imagen sugerida: screenshot del original + nuestra respuesta, o grafico comparativo]
```

## Reglas
1. SIEMPRE referenciar al autor original (mencion o cita)
2. NUNCA atacar — complementar, extender, dar perspectiva propia
3. Aportar DATOS REALES de VertexAura (numeros, sistemas, resultados)
4. Tipos de reaccion validos:
   - **agree_and_extend**: "Totalmente de acuerdo, y ademas..."
   - **disagree_with_data**: "Interesante perspectiva, pero nuestros datos dicen..."
   - **our_version**: "Nosotros lo hacemos asi, con estos resultados..."
   - **add_perspective**: "Buen punto. Desde nuestra experiencia construyendo X..."
5. Timing: reacciones deben ser RAPIDAS (prioridad alta en cola de Marina)
6. No reaccionar a TODOS los posts — solo los relevantes para nuestra autoridad
