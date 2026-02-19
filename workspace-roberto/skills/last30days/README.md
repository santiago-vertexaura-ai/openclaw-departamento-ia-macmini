# last30days — Investigacion de los ultimos 30 dias

## Que hace
Investiga cualquier tema usando fuentes recientes (ultimos 30 dias): web, Reddit, X/Twitter. Sintetiza hallazgos en insights accionables.

## Cuando usar
- Cuando la tarea requiere informacion MUY reciente
- Trends, noticias, opiniones actuales
- Temas que cambian rapido (IA, tech, marketing digital)

## Pasos

### 1. Web Search (Brave con freshness)
```
web_search(query="[tema]", freshness="pm", count=5)
```
- `pm` = ultimo mes, `pw` = ultima semana, `pd` = ultimas 24h

### 2. Reddit Search
```
web_search(query="site:reddit.com [tema]", freshness="pm", count=5)
```
Subreddits clave: r/ClaudeAI, r/ChatGPT, r/LocalLLaMA, r/MachineLearning

### 3. X/Twitter Search
```bash
bird search "[tema]" -n 10 --plain
```
Buscar practitioners reales, no engagement bait.

### 4. Deep Dive (opcional)
Para URLs prometedoras:
```
web_fetch(url="https://...", maxChars=10000)
```

### 5. Sintetizar
Combinar en:
1. **Patrones clave** — que esta funcionando
2. **Errores comunes** — que evitar
3. **Herramientas/tecnicas** — metodos especificos mencionados
4. **Fuentes** — con URLs

## Output esperado
```markdown
## Ultimos 30 dias: [Tema]

### Que esta funcionando
- [Pattern 1 con fuente]

### Errores comunes
- [Error 1]

### Tecnicas clave
- [Tecnica con fuente]

### Fuentes
- [URL] - [descripcion breve]
```

## Dependencias
- Brave Search (via web_search tool)
- bird CLI (para X/Twitter, ya instalado)
- browser tool (para deep dive de URLs)
