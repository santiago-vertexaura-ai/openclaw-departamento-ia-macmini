# Thread Writer — Skill de Marina

## Cuando usar
- task_type: `thread_writer` o cuando brief.platforms incluye "twitter" y el doc fuente es extenso
- Contenido que requiere mas de 1 tweet para explicarse

## Input requerido
1. Doc fuente (via `content.sh fetch-source <doc_id>`)
2. Voice examples (via content.sh fetch-voice)
3. Formulas del vault (via content.sh fetch-formulas)

## Output Schema

### JSON resultado
```json
{
  "platform": "twitter",
  "format": "thread",
  "tweet_count": 7,
  "hooks": {
    "principal": "Tweet 1 — el hook que engancha",
    "variante_1": "Alternativa de apertura",
    "variante_2": "Otra alternativa"
  },
  "formulas_aplicadas": ["formula-xxx"],
  "source_doc_id": "uuid"
}
```

### Documento (/tmp/marina_doc.md)
```markdown
# Thread: [Titulo]

## Tweet 1 (Hook)
[Max 280 chars. El mas importante — decide si leen el resto]

## Tweet 2
[Contexto o problema]

## Tweet 3-N
[Desarrollo, datos concretos, ejemplos]

## Tweet Final (CTA)
[Call to action + donde seguir la conversacion]

## Hashtags
Solo en el ultimo tweet, max 2-3 relevantes
```

## Reglas
1. Max 280 chars por tweet — ESTRICTO
2. Cada tweet debe poder leerse solo pero fluir en secuencia
3. Datos concretos > generalidades
4. El hook (tweet 1) es el 80% del exito
5. CTA intermedio en tweet 3-4 (like/RT si te interesa)
6. CTA final: pregunta directa o invitacion a debate
7. NO usar emojis excesivos — max 1 por tweet
8. Fragmentar ideas: 1 idea = 1 tweet
