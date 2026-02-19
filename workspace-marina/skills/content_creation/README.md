# Content Creation — Skill principal de Marina

## Cuándo usar
- task_type: `content_creation` o `direct_request`

## Input requerido
1. Doc fuente (vía `content.sh fetch-source <doc_id>`) — acepta research de Roberto O analysis de Andrés O report
2. Fórmulas del vault (vía content.sh fetch-formulas)
3. Voice examples (vía content.sh fetch-voice)
4. Platform constraints (config/platforms.json)
5. Comments de Santi en la tarea — MAXIMA PRIORIDAD, definen enfoque del contenido
6. brief.platforms — plataformas objetivo (si no hay, generar para LinkedIn, Twitter/X, Instagram)

## Output Schema

### JSON resultado (para tasks.sh complete)
```json
{
  "platforms": ["linkedin", "twitter", "instagram"],
  "hooks": {
    "principal": "El hook principal elegido",
    "variante_1": "Primera alternativa",
    "variante_2": "Segunda alternativa"
  },
  "formulas_aplicadas": ["formula-001", "formula-005"],
  "source_doc_id": "uuid del doc de Andrés usado",
  "visual_brief": "Descripción de la imagen/gráfico sugerido"
}
```

### Documento Markdown (/tmp/marina_doc.md)
```markdown
# [Título del contenido]

## Hooks
1. **Principal**: [hook]
2. **Variante A**: [hook alternativo]
3. **Variante B**: [hook alternativo]

## LinkedIn
[Contenido completo para LinkedIn, 800-1500 chars]

**CTA**: [call to action específico]
**Hashtags**: #tag1 #tag2 #tag3

## Twitter/X
[Tweet principal, max 280 chars]

### Thread (si necesario)
1/N [tweet]
2/N [tweet]
...

**Hashtags**: #tag1

## Instagram
[Caption completa, max 2200 chars]

**CTA**: [call to action]
**Hashtags primer comentario**: #tag1 #tag2 ... (20-30)

## Visual Brief
[Descripción detallada de la imagen/gráfico sugerido para acompañar el contenido]
- Formato: [carrusel/imagen/reel]
- Dimensiones: [según plataforma]
- Elementos clave: [qué debe mostrar]
```

## Reglas
1. SIEMPRE generar 3 variantes de hook
2. SIEMPRE adaptar el contenido a CADA plataforma (no copy-paste)
3. SIEMPRE incluir CTA específico por plataforma
4. SIEMPRE incluir visual brief
5. NUNCA inventar datos — solo usar lo que está en los docs fuente
6. Consultar voice_examples.json para calibrar tono
7. Consultar fórmulas del vault — preferir fórmulas probadas (tier A/B)
8. Mínimo 300 palabras en el documento
