# TASK_DISPATCH.md — Instrucciones de despacho de tareas

## Asignacion automatica de agentes (CRITICO)

Cuando Santi pide algo, Alfred DEBE asignar al agente correcto SIN que Santi lo diga explicitamente.

| Tipo de peticion | assigned_to | task_type | Ejemplo |
|------------------|-------------|-----------|---------|
| Buscar noticias, info, datos | `Roberto` | `news_scan` | "busca noticias sobre X" |
| Analizar video/canal YouTube | `Roberto` | `youtube_analysis` | "mira que ha subido Cole Medin" |
| Investigar un tema | `Roberto` | `research` | "investigame sobre rentahuman.ai" |
| Generar reporte | `Roberto` | `report` | "dame un resumen de la semana" |
| Buscar en Twitter/X | `Roberto` | `twitter_scan` | "mira que se dice de X en Twitter" |
| Analizar un tweet específico | `Roberto` | `twitter_manual` | Santi envía link de x.com |
| Buscar en Reddit | `Roberto` | `reddit_scan` | "mira que se dice en Reddit sobre X" |
| Buscar en HackerNews | `Roberto` | `hackernews_scan` | "mira HN sobre X" |
| Analizar un link/artículo | `Roberto` | `research` | Santi envía cualquier URL |
| Tareas de sistema/config | `Alfred` | `system` | "actualiza el cron de seguridad" |

**Regla general:** Si implica buscar, investigar, recopilar datos, o analizar contenido externo → **siempre Roberto**. Alfred NO investiga, Alfred coordina y despacha.

## Detección automática de links

Cuando Santi envía un URL en el chat o Telegram, Alfred DEBE:
1. Detectar el tipo de URL
2. Crear la tarea apropiada automáticamente
3. Informar a Santi: "He creado una tarea para que Roberto analice este link."

| Patrón URL | task_type | Título auto |
|------------|-----------|-------------|
| x.com/* o twitter.com/* | `twitter_manual` | "Analizar tweet: [título/extracto]" |
| youtube.com/* o youtu.be/* | `youtube_analysis` | "Analizar vídeo: [título si disponible]" |
| reddit.com/* | `reddit_scan` | "Analizar post Reddit: [título]" |
| news.ycombinator.com/* | `hackernews_scan` | "Analizar story HN: [título]" |
| Cualquier otro URL | `research` | "Analizar artículo: [dominio]" |

## Como crear una tarea en Supabase

```bash
curl -s -X POST "https://xacthbehposxdrfqajwz.supabase.co/rest/v1/agent_tasks" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "title": "Titulo descriptivo de la tarea",
    "assigned_to": "Roberto",
    "created_by": "Alfred",
    "task_type": "news_scan",
    "priority": "alta",
    "status": "pendiente",
    "brief": {"instrucciones": "detalladas para roberto"}
  }'
```

Credenciales en `~/clawd/.env.local` (SUPABASE_URL, SUPABASE_ANON_KEY).

## Push vs Pull

| Situacion | Accion |
|-----------|--------|
| Santi pide algo directo/urgente por Telegram | Crear tarea + `sessions_spawn` Roberto AHORA |
| Santi dice "para luego" / "cuando pueda" / "no urge" | Solo crear tarea (Roberto la recoge en su scan) |
| Tarea creada desde el dashboard | Solo crear (Roberto la recoge en su scan) |
| Cron detecta algo critico | Crear tarea + `sessions_spawn` Roberto |

### Push: sessions_spawn para Roberto
Cuando se necesita ejecucion inmediata, usar sessions_spawn para crear una sesion aislada de Roberto.

### Pull: scans cada 12h
Roberto tiene 2 ventanas de trabajo diarias (02:00 y 14:00) donde hace un scan completo de TODAS las fuentes y procesa TODAS las tareas pendientes.

Además, `roberto-task-poll` cada 30 min recoge tareas urgentes.

## Respuesta a Santi

### Cuando se hace push (urgente):
"Tarea creada. Roberto esta trabajando en ello."

### Cuando se deja para el scan (no urgente):
"Tarea creada. Roberto la procesará en su próximo escaneo."

### NUNCA:
- Inventar tiempos estimados ("tardara 15 minutos")
- Decir que algo esta listo sin verificar Supabase
- Investigar directamente — SIEMPRE delegar a Roberto

## Consultar estado de una tarea

Para verificar si Roberto termino una tarea:
```bash
curl -s "https://xacthbehposxdrfqajwz.supabase.co/rest/v1/agent_tasks?id=eq.<TASK_ID>&select=status,result,error" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "apikey: $SUPABASE_ANON_KEY"
```
