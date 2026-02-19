# Skill: Twitter/X — Monitorización y búsqueda

## Qué hace
Busca tweets, monitoriza keywords relevantes para VertexAura, y detecta leads potenciales en español usando Bird CLI.

## Herramienta
`scripts/twitter.sh` — wrapper sobre Bird CLI (`/opt/homebrew/bin/bird`)

## Comandos disponibles

### `search "<query>" [max]`
Busca tweets recientes que contengan la query.
- **max**: número máximo de resultados (default: 20)
- **Output**: JSON array de tweets con author, text, likes, retweets, date, url

### `read <tweet_url>`
Lee un tweet completo con su hilo y métricas.
- **Output**: JSON con tweet completo, replies count, engagement metrics

### `leads "<query>" [max]`
Busca tweets de usuarios en español que mencionan keywords de leads.
- Filtra: solo cuentas con >200 followers
- **Output**: JSON array de leads potenciales con bio, followers, tweet

## Config
`skills/twitter/config.json` — keywords de leads, perfil de Chrome, umbrales

## Datos
`data/twitter/` — outputs de búsquedas guardados por fecha

## Dependencias
- Bird CLI v0.8.0 (`/opt/homebrew/bin/bird`)
- Chrome profile "clawdbot" con sesión activa en x.com (cuenta de Alfred)

## Instrucciones de uso

1. **SIEMPRE** lee `config/keywords_tiers.json` antes de buscar
2. Busca keywords de tier 1-3 relevantes al task
3. Para leads: usa SOLO keywords en español del tier 4
4. Guarda resultados en `data/twitter/YYYY-MM-DD/` como JSON
5. **NUNCA** interactúes (dar like, reply, follow) — solo lectura
6. Si Bird falla con error de auth: reporta en task result, NO reintentar en bucle

## Ejemplo de flujo

```bash
# Búsqueda general
scripts/twitter.sh search "AI agents" 20

# Leer un tweet específico
scripts/twitter.sh read "https://x.com/user/status/123456"

# Detectar leads en español
scripts/twitter.sh leads "automatización IA" 10
```
