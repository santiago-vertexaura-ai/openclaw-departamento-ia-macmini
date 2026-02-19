# Skill: Content Intelligence (PRINCIPAL)

## Descripción
Análisis de 5 capas de contenido. Transforma los datos crudos de Roberto en conocimiento accionable con plantillas replicables para Marina.

## Cuándo usar
- task_type: `analysis`, `content_analysis`, `viral_analysis`
- task_type: `weekly_brief` (combinado con trend_tracking)

## Flujo de ejecución

### 1. Obtener documentos fuente
```bash
# Si brief tiene source_doc_id
scripts/docs.sh fetch-by-task <task_id>

# Si no, últimos docs de Roberto
scripts/docs.sh fetch-recent 7 10
```

### 2. Leer COMPLETAMENTE cada documento
No escanees — lee todo. Los detalles importan.

### 3. Ejecutar análisis de 5 capas
Genera un JSON con la estructura definida abajo. Cada capa tiene un propósito específico.

### 4. Validar output
```bash
scripts/validate-output.sh /tmp/andres_analysis.json
```

### 5. Escribir documento markdown
Escribe `/tmp/andres_doc.md` con el análisis en formato legible (mínimo 500 palabras).

### 6. Completar tarea
```bash
scripts/tasks.sh complete <task_id> '<json_del_analisis>'
```

## Las 5 capas

### Capa 1 — Anatomía del contenido
Disección quirúrgica: hooks, estructura emocional, puntos de engagement.

- **hooks_detectados**: Texto exacto del hook + análisis del mecanismo psicológico (NO "usó curiosidad", sino explicar el mecanismo: contraste, disonancia cognitiva, etc.) + patrón replicable + ejemplo adaptado a VertexAura
- **estructura_emocional**: Secuencia de emociones del contenido + explicación de por qué funciona
- **formato_tecnico**: Tipo de formato + estructura detallada (longitud, CTAs, uso de imágenes, etc.)

### Capa 2 — Fórmulas replicables
Plantillas que Marina puede rellenar directamente. NO análisis abstracto.

- **formulas**: Nombre + plantilla paso a paso + cuándo usar + ejemplo original + ejemplo VertexAura
- **hooks_listos_para_usar**: Hooks ESCRITOS (no descritos) listos para adaptar

### Capa 3 — Intelligence de audiencia
A quién le hablamos.

- **quien_interactua**: Perfiles concretos (developers, founders, CTOs...)
- **lenguaje_que_usan**: Palabras y frases EXACTAS (no jerga corporativa)
- **objeciones_comunes**: Dudas y resistencias reales
- **momentos_alta_receptividad**: Cuándo son más receptivos

### Capa 4 — Competitive intelligence
Qué hacen otros, qué funciona, qué huecos hay.

- **contenido_competidores**: Qué les funciona y qué no
- **gaps_de_contenido**: Temas que NADIE cubre bien + por qué es oportunidad + urgencia + hook propuesto
- **timing_recomendado**: Cuándo publicar y por qué

### Capa 5 — Métricas y tendencias
Números concretos y señales de mercado.

- **metricas_clave**: Nombre + valor + contexto + tendencia + implicación para VertexAura
- **tendencias_emergentes**: Descripción + evidencia + fase (EMERGENTE/CRECIENDO/PICO/DECLINANDO/SATURADO) + ventana de oportunidad
- **patrones_cross_document**: Patrones que solo se ven comparando múltiples fuentes

### Instagram Visual Pattern Analysis

When analyzing content that includes visual analysis data from Roberto's IG scan:
- Cross-reference `pattern_extraction.hook_type` with engagement metrics
- Identify which visual formulas correlate with higher performance
- Tag visual patterns that are replicable for @santim.ia
- Include in output: `visual_patterns_detected` array with formula + performance correlation

## Schema JSON de output

```json
{
  "analysis_id": "andres-weekly-001",
  "type": "content_intelligence",
  "source_docs": ["id-del-doc-de-roberto"],
  "analysis_date": "2026-02-13",

  "capa_1_anatomia_contenido": {
    "descripcion": "Disección quirúrgica del contenido: hooks, estructura emocional, puntos de engagement",
    "hooks_detectados": [
      {
        "hook_text": "el texto exacto del hook o titular que funciona",
        "por_que_funciona": "análisis detallado del mecanismo psicológico",
        "patron": "nombre del patrón replicable",
        "ejemplo_adaptado_vertexaura": "cómo Marina podría usar este mismo patrón"
      }
    ],
    "estructura_emocional": {
      "secuencia": ["emoción_1", "emoción_2"],
      "explicacion": "por qué esta secuencia funciona"
    },
    "formato_tecnico": {
      "tipo": "hilo/tweet/video/artículo",
      "estructura_detallada": "descripción precisa del formato"
    }
  },

  "capa_2_formulas_replicables": {
    "descripcion": "Plantillas que Marina puede rellenar directamente",
    "formulas": [
      {
        "nombre": "nombre corto de la fórmula",
        "plantilla": "estructura paso a paso que Marina rellena",
        "cuando_usar": "en qué contexto funciona mejor",
        "ejemplo_original": "el contenido original del que se extrajo",
        "ejemplo_vertexaura": "versión adaptada a VertexAura"
      }
    ],
    "hooks_listos_para_usar": [
      {
        "hook": "texto del hook listo para usar",
        "tema": "para qué tema de VertexAura sirve",
        "formato_recomendado": "hilo/tweet/video"
      }
    ]
  },

  "capa_3_intelligence_audiencia": {
    "descripcion": "A quién le hablamos",
    "perfil_audiencia": {
      "quien_interactua": "perfiles concretos",
      "lenguaje_que_usan": ["frases exactas"],
      "objeciones_comunes": ["dudas reales"],
      "momentos_alta_receptividad": "cuándo son más receptivos"
    }
  },

  "capa_4_competitive_intelligence": {
    "descripcion": "Qué hacen otros, qué funciona, qué huecos hay",
    "contenido_competidores": [
      {
        "competidor": "nombre o handle",
        "que_funciona": "qué les funciona y por qué",
        "que_no_funciona": "qué no les funciona"
      }
    ],
    "gaps_de_contenido": [
      {
        "gap": "tema que NADIE cubre bien",
        "por_que_es_oportunidad": "por qué VertexAura debería cubrirlo",
        "urgencia": "alta/media/baja",
        "hook_propuesto": "hook concreto para este gap"
      }
    ],
    "timing_recomendado": "cuándo publicar y por qué"
  },

  "capa_5_metricas_y_tendencias": {
    "descripcion": "Números concretos, tendencias, señales de mercado",
    "metricas_clave": [
      {
        "metrica": "nombre",
        "valor": "dato concreto",
        "contexto": "qué significa",
        "tendencia": "subiendo/bajando/estable",
        "implicacion_para_vertexaura": "qué hacer con este dato"
      }
    ],
    "tendencias_emergentes": [
      {
        "tendencia": "descripción",
        "evidencia": "datos que la respaldan",
        "fase": "EMERGENTE/CRECIENDO/PICO/DECLINANDO/SATURADO",
        "ventana_de_oportunidad": "cuánto tiempo para actuar"
      }
    ],
    "patrones_cross_document": "patrones que solo se ven comparando fuentes"
  },

  "resumen_ejecutivo_para_alfred": {
    "top_3_insights": ["insight 1", "insight 2", "insight 3"],
    "accion_inmediata": "qué debe hacer Alfred AHORA",
    "contenido_prioritario_para_marina": {
      "tema": "el tema más urgente",
      "formula_recomendada": "qué fórmula usar",
      "hook": "el hook recomendado",
      "timing": "cuándo publicar"
    }
  },

  "limitations": "qué NO puedes concluir, qué datos faltan, qué sesgo tiene la muestra"
}
```

## Reglas anti-alucinación (CRÍTICO)

- SOLO analiza datos EXPLÍCITAMENTE presentes en docs de Roberto
- Si un dato no está → "dato no disponible en fuentes actuales"
- NUNCA estimes métricas que no estén reportadas
- Cada claim debe ser trazable a un documento fuente con ID
- Si la muestra es pequeña (N<5), dilo explícitamente en limitations
- Los hooks deben estar ESCRITOS, no descritos
- Las fórmulas deben ser tan específicas que Marina pueda usarlas sin pensar en estrategia
- Los gaps de contenido deben ser concretos, no genéricos

## Después del análisis

1. Actualizar `knowledge/formula_bank.json` con nuevas fórmulas
2. Agregar línea a `knowledge/trend_history.jsonl` con tendencias detectadas
3. Actualizar `knowledge/audience_profile.json` si hay nuevos datos de audiencia

### Extended Analysis Fields (v2)

#### trigger_psychology
- primary_trigger: string (curiosity | fear | aspiration | anger | FOMO | social_proof)
- secondary_trigger: string (same options)
- schwartz_awareness_level: number (1-5)
- emotional_velocity: string (slow_burn | medium | instant_hook)

#### template_extraction
- fill_in_blanks_template: string (e.g. "I spent [TIME] doing [ACTIVITY] and discovered [INSIGHT]")
- vertexaura_example: string (adapted template for our context)
- replicability_score: number (1-10)

#### gap_detection
- missing_data: string[]
- unanswered_questions: string[]
- suggested_roberto_tasks: object[] (title, task_type, brief)

#### opportunity_validation
- alignment_score: number (1-10)
- authority_potential: number (1-10)
- audience_resonance: number (1-10)
- effort_vs_impact: string
