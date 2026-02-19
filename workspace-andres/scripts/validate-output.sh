#!/bin/bash
# validate-output.sh — Validar JSON de salida de Andrés antes de guardar
# Uso: ./scripts/validate-output.sh <file.json>
# Exit 0 = OK, Exit 1 = errores (lista qué falta)

set -euo pipefail

FILE="${1:?ERROR: Falta archivo. Uso: ./scripts/validate-output.sh <file.json>}"

if [[ ! -f "$FILE" ]]; then
  echo "ERROR: Archivo no encontrado: $FILE" >&2
  exit 1
fi

ERRORS=0

# 1. JSON bien formado
if ! python3 -c "import json; json.load(open('$FILE'))" 2>/dev/null; then
  echo "FAIL: JSON mal formado" >&2
  ERRORS=$((ERRORS + 1))
  # No podemos seguir si JSON es invalido
  exit 1
fi

# 2. Detectar tipo de análisis y validar campos requeridos
python3 -c "
import json, sys

d = json.load(open('$FILE'))
errors = []

# Campos base siempre requeridos
if not d.get('source_docs'):
    errors.append('source_docs vacío o faltante')
if not d.get('limitations'):
    errors.append('limitations vacío o faltante (fuerza honestidad)')

# Detectar si es análisis de 5 capas (content_intelligence)
is_5_capas = any(k.startswith('capa_') for k in d.keys())

if is_5_capas:
    # Validar análisis 5 capas
    required_capas = [
        'capa_1_anatomia_contenido',
        'capa_2_formulas_replicables',
        'capa_3_intelligence_audiencia',
        'capa_4_competitive_intelligence',
        'capa_5_metricas_y_tendencias'
    ]
    for capa in required_capas:
        if capa not in d:
            errors.append(f'{capa} faltante')
        elif not isinstance(d[capa], dict) or len(d[capa]) < 2:
            errors.append(f'{capa} vacía o incompleta')

    # Validar hooks en capa 1
    c1 = d.get('capa_1_anatomia_contenido', {})
    hooks = c1.get('hooks_detectados', [])
    if not hooks:
        errors.append('capa_1: sin hooks detectados')
    else:
        for i, h in enumerate(hooks):
            if not h.get('por_que_funciona'):
                errors.append(f'capa_1: hook {i} sin por_que_funciona')

    # Validar fórmulas en capa 2
    c2 = d.get('capa_2_formulas_replicables', {})
    formulas = c2.get('formulas', [])
    if not formulas:
        errors.append('capa_2: sin fórmulas replicables')

    # Validar resumen ejecutivo
    resumen = d.get('resumen_ejecutivo_para_alfred', {})
    if not resumen.get('top_3_insights'):
        errors.append('resumen_ejecutivo: sin top_3_insights')
    if not resumen.get('accion_inmediata'):
        errors.append('resumen_ejecutivo: sin accion_inmediata')

else:
    # Validar análisis estándar (findings-based)
    findings = d.get('findings', [])
    if not findings:
        errors.append('findings vacío o faltante')
    else:
        no_evidence = [i for i, f in enumerate(findings) if not f.get('evidence')]
        if no_evidence:
            errors.append(f'findings sin evidence en posiciones: {no_evidence}')

if errors:
    print(f'FAIL: {len(errors)} errores encontrados:', file=sys.stderr)
    for e in errors:
        print(f'  - {e}', file=sys.stderr)
    sys.exit(1)
else:
    # Stats
    if is_5_capas:
        hooks = len(d.get('capa_1_anatomia_contenido', {}).get('hooks_detectados', []))
        formulas = len(d.get('capa_2_formulas_replicables', {}).get('formulas', []))
        gaps = len(d.get('capa_4_competitive_intelligence', {}).get('gaps_de_contenido', []))
        metrics = len(d.get('capa_5_metricas_y_tendencias', {}).get('metricas_clave', []))
        print(f'OK: 5 capas validadas. Hooks: {hooks}, Fórmulas: {formulas}, Gaps: {gaps}, Métricas: {metrics}')
    else:
        findings = len(d.get('findings', []))
        print(f'OK: Análisis validado. Findings: {findings}')
" 2>&1

EXIT_CODE=$?
exit $EXIT_CODE
