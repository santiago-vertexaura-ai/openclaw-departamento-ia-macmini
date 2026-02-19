# Skill: Social Performance Analysis

## Descripcion
Analisis semanal de rendimiento en redes sociales de @santim.ia y comparativa con competidores.

## Cuando se activa
- Cron semanal (domingos 20:00)
- Tarea manual de Alfred

## Input
- Docs de Roberto de la ultima semana (agent_docs con tags "instagram")
- Historico de metricas: `data/metrics/weekly-history.json`
- Vault: formulas, tendencias, decisiones previas

## Output esperado
Reporte semanal (>500 palabras) con:
1. **Resumen de la semana**: Posts publicados, engagement total
2. **Top 3 posts**: Cuales funcionaron mejor y por que
3. **Bottom 3 posts**: Que no funciono y como mejorar
4. **Tendencias**: Engagement rate semanal vs historico
5. **Competidores**: Que hicieron @rackslabs y @mattganzak esta semana
6. **Recomendaciones**: 3-5 acciones concretas para la proxima semana

## Metricas clave
- Engagement rate = (likes + comments) / followers
- Growth rate = (followers_new - followers_old) / followers_old
- Post frequency = posts/semana
- Best time to post (basado en engagement)
- Format performance (reel vs carousel vs image)
