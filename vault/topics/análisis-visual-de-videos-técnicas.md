---
title: "Análisis Visual de Videos - Técnicas"
date: 2026-02-14
last_updated: 2026-02-14T10:35:01Z
category: topics
memoryType: topics
priority: 🟡
tags: 
  - analisis-visual
  - video
  - opencv
  - ffmpeg
  - vllm
  - tecnicas
mentions: 1
confidence: 0.7
author: "Alfred"
---

# Análisis Visual de Videos - Stack Técnico

## Contexto
Técnicas y herramientas para análisis profundo de videos (Instagram Reels, TikTok, YouTube Shorts).

## Stack Completo

### Herramientas Open Source (Gratis)

**ffmpeg** - Análisis base
- Duración, FPS, resolución
- Detectar cortes de escena
- Extraer frames clave
- Separar audio

**OpenCV + Python** - Detecciones específicas
- Detección de rostros (% de tiempo con cara visible)
- OCR para texto overlay (pytesseract)
- Análisis de color (saturación, brillo, contraste)
- Detección de movimiento

**librosa** - Análisis de audio
- Tempo (BPM)
- Detección de beats
- Picos de intensidad (sound effects)
- Clasificación música vs voz

**VLLM Local** - Análisis cualitativo
- LLaVA 13B (mejor balance)
- Qwen2-VL 7B (más rápido)
- Phi-4-Vision (alternativa)

### Herramientas Comerciales

**AssemblyAI** - Transcripción avanzada (~/bin/zsh.15/hora)
- Speaker diarization
- Detección de entidades
- Mejor que Whisper en algunos casos

**Apify** - Scraping + descarga
- Instagram, TikTok, YouTube
- Maneja rate limits, proxies
- ~/bin/zsh.25/1000 posts

## Métricas Visuales Clave

### Ritmo de Edición
```bash
# Detectar cortes de escena
ffmpeg -i video.mp4 -vf "select='gt(scene,0.4)'" -vsync 0 -f null -

# Output: número de cortes
# Benchmark: 1 corte/2seg = muy rápido, 1/5seg = normal
```

### Texto Overlay
```python
import cv2
import pytesseract

# OCR cada N frames
text_detected = pytesseract.image_to_string(frame, lang='spa')

# Patrón ganador Instagram: 5-7 textos clave por video
```

### Composición
```python
# Detección de rostro
face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')
faces = face_cascade.detectMultiScale(gray_frame, 1.1, 4)

# Benchmark: 60-70% rostro = high engagement
```

### Análisis Cualitativo con VLLM
```python
import ollama

response = ollama.chat(
    model='llava:13b',
    messages=[{
        'role': 'user',
        'content': 'Describe el estilo visual, energía, y qué hace este frame atractivo',
        'images': ['frame.jpg']
    }]
)

# Output: contexto humano ("energía alta", "texto bien posicionado")
```

## Arquitectura Híbrida (Recomendada)

```
Video Input (87 seg)
    ↓
┌─────────────────────────┐
│ CAPA 1: ffmpeg (5 seg)  │
│ → Cortes, duración, FPS │
│ → Extrae frames clave   │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ CAPA 2: OpenCV (10 seg) │
│ → Rostros (65%)         │
│ → Texto OCR             │
│ → Colores               │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│ CAPA 3: VLLM (20 seg)   │
│ → Análisis 5 frames     │
│ → Contexto cualitativo  │
└────────┬────────────────┘
         ↓
    OUTPUT JSON
    (~35 seg total)
```

## Benchmarks de Métricas

### Videos High-Engagement Instagram (>5%)
- **Duración:** 60-90 segundos (óptimo)
- **Cortes:** 1 cada 2-3 segundos (rápido)
- **Texto overlay:** 5-7 apariciones
- **Subtítulos:** Presentes, estilo TikTok (palabras resaltadas)
- **Rostro visible:** 60-70% del tiempo
- **Música:** 120-140 BPM (upbeat)
- **Saturación:** +15-25% vs neutral
- **Sound effects:** 8-15 por video

### Anti-Patterns (Evitar)
- Videos >2 minutos: -60% engagement
- Sin texto overlay: -40%
- Ritmo lento (1 corte/8+ seg): -35%
- Sin subtítulos: -25%
- Música muy lenta (<80 BPM): -20%

## Modelos VLLM Comparativa

| Modelo | Tamaño | Velocidad | Calidad | Uso Recomendado |
|--------|--------|-----------|---------|-----------------|
| LLaVA 1.6 (13B) | 7.4 GB | ~3 seg/frame | ⭐⭐⭐⭐⭐ | Producción |
| Qwen2-VL (7B) | 4.5 GB | ~2 seg/frame | ⭐⭐⭐⭐ | Testing rápido |
| Phi-4-Vision | 8.2 GB | ~4 seg/frame | ⭐⭐⭐⭐ | Alternativa |

## Costes Estimados

**Por video (87 seg):**
- Whisper local: /bin/zsh (gratis)
- OpenCV + ffmpeg: /bin/zsh (gratis)
- VLLM local: /bin/zsh (gratis, usa GPU)
- Claude API análisis: ~/bin/zsh.01 (opcional)

**Total:** ~/bin/zsh-0.01 por video

**Por mes (50 videos/día):**
- 1.500 videos/mes × /bin/zsh.01 = ~/mes (si usamos Claude)
- /bin/zsh/mes si todo local

## Scripts de Referencia

**Setup rápido:**
```bash
# Instalar dependencias
pip install opencv-python pytesseract librosa
brew install tesseract ffmpeg
ollama pull llava:13b

# Script básico
bash ~/clawd/workspace-roberto/scripts/instagram-visual.sh analyze <video_url>
```

## Próximas Mejoras Posibles

1. **Detección de transiciones** (fade, zoom, swipe)
2. **Análisis de thumbnails** (qué capta clicks)
3. **Tracking de objetos** (qué elementos visuales destacan)
4. **Sentiment visual** (qué emociones transmite)
5. **A/B testing automático** (comparar variantes)

## Referencias
- OpenCV Docs: https://docs.opencv.org
- ffmpeg Scene Detection: https://ffmpeg.org/ffmpeg-filters.html#select
- LLaVA: https://llava-vl.github.io
- Análisis competitivo Instagram: [[instagram-intelligence-system]]
