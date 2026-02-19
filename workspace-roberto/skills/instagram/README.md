# Instagram Monitoring — Scrape y analisis via Apify + Visual Analysis

## Cuando usar
- task_type: `instagram_monitor` | `instagram_analysis` | `instagram_scan`

## Scripts

### Datos (Apify)
```bash
/Users/alfredpifi/clawd/scripts/instagram-apify.sh scrape <handle> [limit]    # Posts nuevos (dedup)
/Users/alfredpifi/clawd/scripts/instagram-apify.sh profile <handle>           # Perfil metadata
/Users/alfredpifi/clawd/scripts/instagram-apify.sh reels <handle> [limit]     # Reels con video URLs
/Users/alfredpifi/clawd/scripts/instagram-apify.sh download-reel <url> <out>  # Descarga video
/Users/alfredpifi/clawd/scripts/instagram-apify.sh mark-seen <handle> <codes> # Marcar vistos
/Users/alfredpifi/clawd/scripts/instagram-apify.sh list-monitored             # Lista cuentas
/Users/alfredpifi/clawd/scripts/instagram-apify.sh usage                      # Creditos Apify
```

### Analisis Visual
```bash
/Users/alfredpifi/clawd/scripts/visual-analysis.sh analyze-reel <video>       # Pipeline completo
/Users/alfredpifi/clawd/scripts/visual-analysis.sh ocr-frame <image>          # OCR texto overlay
/Users/alfredpifi/clawd/scripts/visual-analysis.sh vision-describe <image>    # Gemma3 vision
/Users/alfredpifi/clawd/scripts/visual-analysis.sh transcribe <audio>         # Whisper
```

### Fallback (instaloader, deprecated)
```bash
/Users/alfredpifi/clawd/scripts/instagram.sh scrape <handle> [limit]
/Users/alfredpifi/clawd/scripts/instagram.sh profile <handle>
```

## Cuentas monitoreadas
- **@santim.ia** — Cuenta propia de Santi (datos para CM semanal)
- **@rackslabs** — Competencia directa
- **@mattganzak** — Referencia gold, 53K+ followers, 956+ posts

## Deduplicacion
Posts ya analizados se guardan en `data/instagram/seen_posts.json`.
El script `instagram-apify.sh scrape` filtra automaticamente posts ya vistos.
Despues de analizar, ejecutar `mark-seen` para registrar.

## Flujo de ejecucion (cron diario)
1. Alfred ejecuta `instagram-apify.sh scrape` para cada cuenta (solo posts nuevos)
2. Si hay reels nuevos: Alfred descarga + ejecuta `visual-analysis.sh analyze-reel`
3. Alfred marca posts como vistos con `mark-seen`
4. Alfred spawn Roberto con todos los datos
5. Roberto analiza:
   - Competidores: formulas, hooks, patrones replicables
   - santim.ia: recopilar datos (performance analysis lo hace CM semanalmente)
   - Visual: composicion, OCR, transcripcion de reels
6. Roberto escribe doc y lo sube a Supabase

## Output esperado
- **Por cuenta**: posts nuevos, engagement metrics, formatos
- **Comparativa**: que cuenta rinde mejor y por que
- **Hooks**: primeros 50 chars de caption = hook
- **Visual analysis**: composicion, texto overlay, caras, colores, tipo contenido
- **Transcripcion**: texto del audio de reels
- **Recomendaciones**: que replicar, que evitar (basado en datos)

## IMPORTANTE
- Solo datos, NUNCA opiniones ni ideas propias
- Si Apify falla, reportar error en el doc
- Videos se borran automaticamente tras analisis (nunca acumular)
- Minimo 500 palabras en el documento
