# Heartbeat — Alfred

## Sistema
- Verifica que el gateway responde
- Verifica que no hay cron jobs recientes con error
- Si algún job falló, reporta por Telegram con diagnóstico

## Tareas
- Revisa si hay tareas pendientes o bloqueadas >2h
- Si hay tareas sin asignar >24h, sugiere priorización

## Comunicación
- Si hay mensajes de Santi sin responder >1h, priorízalos

## Auto-mantenimiento
- Si MEMORY.md no se ha actualizado en >48h y ha habido actividad, actualízalo
- Si esta checklist necesita cambios, actualízala
- Si nada requiere atención: termina sin responder. NO envíes ningún mensaje.
