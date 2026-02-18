#!/bin/bash
# visual-analysis.sh — Visual analysis pipeline for Instagram reels/images
# Uses: ffmpeg (frames), pytesseract (OCR), Gemma3:27b (vision), Whisper (transcription)
#
# Comandos:
#   analyze-reel <video_path>         Pipeline completo → JSON stdout
#   extract-frames <video> <outdir>   Keyframes via ffmpeg
#   ocr-frame <image_path>            OCR texto overlay
#   vision-describe <image_path>      Gemma3:27b analisis visual
#   transcribe <audio_path>           Whisper transcripcion
#   analyze-image <image_path>        Para carousel/imagen

set -euo pipefail

OLLAMA_URL="http://127.0.0.1:11434"
VISION_MODEL="gemma3:27b"
WHISPER_MODEL="base"

CMD="${1:-help}"

case "$CMD" in

  extract-frames)
    VIDEO="${2:?ERROR: Falta video. Uso: visual-analysis.sh extract-frames <video> <outdir>}"
    OUTDIR="${3:?ERROR: Falta outdir}"
    mkdir -p "$OUTDIR"

    # Get video duration
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VIDEO" 2>/dev/null || echo "30")
    DURATION=${DURATION%.*}  # truncate to int
    [[ "$DURATION" -lt 1 ]] && DURATION=30

    # Extract 5 frames at 0%, 25%, 50%, 75%, 100%
    for PCT in 0 25 50 75 100; do
      TIMESTAMP=$(( DURATION * PCT / 100 ))
      [[ "$TIMESTAMP" -ge "$DURATION" ]] && TIMESTAMP=$(( DURATION - 1 ))
      [[ "$TIMESTAMP" -lt 0 ]] && TIMESTAMP=0
      ffmpeg -ss "$TIMESTAMP" -i "$VIDEO" -vframes 1 -q:v 2 \
        "$OUTDIR/frame_${PCT}.jpg" -y -loglevel error 2>/dev/null || true
    done

    COUNT=$(ls "$OUTDIR"/frame_*.jpg 2>/dev/null | wc -l | tr -d ' ')
    echo "{\"frames_extracted\": $COUNT, \"duration_sec\": $DURATION, \"outdir\": \"$OUTDIR\"}"
    ;;

  ocr-frame)
    IMAGE="${2:?ERROR: Falta imagen. Uso: visual-analysis.sh ocr-frame <image_path>}"

    python3 << PYEOF
import json, sys
try:
    import pytesseract
    from PIL import Image
    img = Image.open("${IMAGE}")
    text = pytesseract.image_to_string(img, lang='spa+eng').strip()
    print(json.dumps({"text": text, "has_text": bool(text)}, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"text": "", "has_text": False, "error": str(e)}))
PYEOF
    ;;

  vision-describe)
    IMAGE="${2:?ERROR: Falta imagen. Uso: visual-analysis.sh vision-describe <image_path>}"

    python3 << PYEOF
import json, sys, base64

image_path = "${IMAGE}"
ollama_url = "${OLLAMA_URL}"
model = "${VISION_MODEL}"

with open(image_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

prompt = """Analyze this Instagram post/reel frame. Respond in JSON format ONLY:
{
  "composition": "brief layout/framing description",
  "text_overlays": "any text visible on screen",
  "faces_count": 0,
  "dominant_colors": ["#hex1", "#hex2"],
  "content_type": "educational|testimonial|lifestyle|promotional|entertainment",
  "visual_hooks": "what grabs attention",
  "energy_level": "low|medium|high",
  "brand_elements": "logos, consistent colors, fonts",
  "pattern_extraction": {
    "hook_type": "text_overlay|face_to_camera|b_roll|transition|split_screen|mixed",
    "visual_formula": "description of the replicable visual pattern",
    "replicable_elements": ["element1", "element2", "element3"]
  }
}

Additionally, extract REPLICABLE PATTERNS:
- hook_type: categorize as "text_overlay", "face_to_camera", "b_roll", "transition", "split_screen", or "mixed"
- visual_formula: describe the visual pattern in one sentence (e.g. "Face-to-camera hook with text overlay, then B-roll montage")
- replicable_elements: list 3-5 specific elements that Marina/Arturo can reference when creating similar content"""

import urllib.request
req = urllib.request.Request(
    f"{ollama_url}/api/generate",
    data=json.dumps({
        "model": model,
        "prompt": prompt,
        "images": [b64],
        "stream": False,
        "options": {"temperature": 0.3, "num_predict": 768}
    }).encode(),
    headers={"Content-Type": "application/json"},
)

try:
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.load(resp)
        response_text = result.get("response", "")
        # Try to extract JSON from response
        try:
            # Find JSON in response
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start >= 0 and end > start:
                parsed = json.loads(response_text[start:end])
                print(json.dumps(parsed, ensure_ascii=False))
            else:
                print(json.dumps({"raw": response_text}))
        except json.JSONDecodeError:
            print(json.dumps({"raw": response_text}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
PYEOF
    ;;

  transcribe)
    AUDIO="${2:?ERROR: Falta audio. Uso: visual-analysis.sh transcribe <audio_path>}"

    python3 << PYEOF
import json, sys, subprocess

audio_path = "${AUDIO}"
model = "${WHISPER_MODEL}"

try:
    result = subprocess.run(
        ["whisper", "--model", model, "--language", "es", "--output_format", "json",
         "--output_dir", "/tmp/whisper_out", audio_path],
        capture_output=True, text=True, timeout=120
    )
    # Read the output JSON
    import os
    base = os.path.splitext(os.path.basename(audio_path))[0]
    json_file = f"/tmp/whisper_out/{base}.json"
    if os.path.exists(json_file):
        with open(json_file) as f:
            data = json.load(f)
        text = data.get("text", "").strip()
        print(json.dumps({"transcription": text, "language": "es"}, ensure_ascii=False))
        os.remove(json_file)
    else:
        # Fallback: parse stdout
        print(json.dumps({"transcription": result.stdout.strip(), "language": "es"}, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"transcription": "", "error": str(e)}))
PYEOF
    ;;

  analyze-image)
    IMAGE="${2:?ERROR: Falta imagen. Uso: visual-analysis.sh analyze-image <image_path>}"

    # OCR
    OCR_RESULT=$("$0" ocr-frame "$IMAGE" 2>/dev/null || echo '{"text":"","has_text":false}')
    # Vision
    VISION_RESULT=$("$0" vision-describe "$IMAGE" 2>/dev/null || echo '{"error":"vision failed"}')

    python3 << PYEOF
import json
ocr = json.loads('${OCR_RESULT//\'/\\\'}' if '${OCR_RESULT}' else '{}')
vision = json.loads('${VISION_RESULT//\'/\\\'}' if '${VISION_RESULT}' else '{}')
print(json.dumps({
    "ocr_text": ocr.get("text", ""),
    "has_text_overlay": ocr.get("has_text", False),
    "vision_analysis": vision,
}, ensure_ascii=False, indent=2))
PYEOF
    ;;

  analyze-reel)
    VIDEO="${2:?ERROR: Falta video. Uso: visual-analysis.sh analyze-reel <video_path>}"

    WORKDIR=$(mktemp -d /tmp/va-XXXXXX)
    FRAMES_DIR="$WORKDIR/frames"
    AUDIO_FILE="$WORKDIR/audio.wav"
    mkdir -p "$FRAMES_DIR"

    cleanup() {
      rm -rf "$WORKDIR"
    }
    trap cleanup EXIT

    # 1. Extract frames
    FRAME_INFO=$("$0" extract-frames "$VIDEO" "$FRAMES_DIR" 2>/dev/null || echo '{"frames_extracted":0}')
    DURATION=$(echo "$FRAME_INFO" | python3 -c "import sys,json; print(json.load(sys.stdin).get('duration_sec',0))" 2>/dev/null || echo "0")

    # 2. Extract audio
    ffmpeg -i "$VIDEO" -vn -acodec pcm_s16le -ar 16000 -ac 1 "$AUDIO_FILE" -y -loglevel error 2>/dev/null || true

    # 3. OCR on each frame
    OCR_RESULTS="[]"
    OCR_JSON="["
    FIRST=true
    for FRAME in "$FRAMES_DIR"/frame_*.jpg; do
      [[ -f "$FRAME" ]] || continue
      RESULT=$("$0" ocr-frame "$FRAME" 2>/dev/null || echo '{"text":""}')
      if [[ "$FIRST" == "true" ]]; then
        FIRST=false
      else
        OCR_JSON+=","
      fi
      FNAME=$(basename "$FRAME" .jpg)
      OCR_JSON+="{\"frame\":\"$FNAME\",\"result\":$RESULT}"
    done
    OCR_JSON+="]"

    # 4. Vision analysis on frames (max 5)
    VISION_JSON="["
    FIRST=true
    for FRAME in "$FRAMES_DIR"/frame_*.jpg; do
      [[ -f "$FRAME" ]] || continue
      RESULT=$("$0" vision-describe "$FRAME" 2>/dev/null || echo '{"error":"vision timeout"}')
      if [[ "$FIRST" == "true" ]]; then
        FIRST=false
      else
        VISION_JSON+=","
      fi
      FNAME=$(basename "$FRAME" .jpg)
      VISION_JSON+="{\"frame\":\"$FNAME\",\"analysis\":$RESULT}"
    done
    VISION_JSON+="]"

    # 5. Transcription
    TRANSCRIPTION='{"transcription":""}'
    if [[ -f "$AUDIO_FILE" && -s "$AUDIO_FILE" ]]; then
      TRANSCRIPTION=$("$0" transcribe "$AUDIO_FILE" 2>/dev/null || echo '{"transcription":"","error":"whisper failed"}')
    fi

    # 6. Compile final JSON
    python3 << PYEOF
import json, sys

ocr_data = json.loads('''$OCR_JSON''')
vision_data = json.loads('''$VISION_JSON''')
transcription = json.loads('''$TRANSCRIPTION''')

# Extract visual metrics
has_text = any(item.get("result", {}).get("has_text", False) for item in ocr_data)
has_faces = any(
    item.get("analysis", {}).get("faces_count", 0) > 0
    for item in vision_data
)
colors = []
content_types = []
for item in vision_data:
    a = item.get("analysis", {})
    colors.extend(a.get("dominant_colors", []))
    ct = a.get("content_type", "")
    if ct:
        content_types.append(ct)

# Most common content type
from collections import Counter
ct_counter = Counter(content_types)
main_type = ct_counter.most_common(1)[0][0] if ct_counter else "unknown"

# Deduplicate colors
unique_colors = list(dict.fromkeys(colors))[:5]

# Collect OCR text
ocr_texts = [item.get("result", {}).get("text", "") for item in ocr_data]
ocr_texts = [t for t in ocr_texts if t.strip()]

result = {
    "video_duration_sec": int(${DURATION}),
    "frame_count": len(vision_data),
    "ocr_text": ocr_texts,
    "vision_analysis": vision_data,
    "transcription": transcription.get("transcription", ""),
    "visual_metrics": {
        "has_text_overlay": has_text,
        "has_faces": has_faces,
        "dominant_colors": unique_colors,
        "content_type": main_type,
    },
}

print(json.dumps(result, ensure_ascii=False, indent=2))
PYEOF

    # Video cleanup is handled by trap (WORKDIR deleted)
    # But also delete the source video if it's in /tmp
    if [[ "$VIDEO" == /tmp/* ]]; then
      rm -f "$VIDEO"
    fi
    ;;

  *)
    echo "visual-analysis.sh — Visual analysis pipeline for Instagram"
    echo ""
    echo "Uso: ./visual-analysis.sh <comando> [args...]"
    echo ""
    echo "Comandos:"
    echo "  analyze-reel <video>         Pipeline completo (frames+OCR+vision+audio)"
    echo "  extract-frames <video> <dir> Extraer keyframes via ffmpeg"
    echo "  ocr-frame <image>            OCR texto overlay en frame"
    echo "  vision-describe <image>      Gemma3:27b analisis visual"
    echo "  transcribe <audio>           Whisper transcripcion"
    echo "  analyze-image <image>        Analisis de imagen (OCR+vision)"
    echo ""
    echo "Dependencias: ffmpeg, tesseract, python3 (opencv, pytesseract), ollama (gemma3:27b), whisper"
    ;;

esac
