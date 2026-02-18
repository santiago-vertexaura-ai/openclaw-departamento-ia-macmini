#!/bin/bash
# instagram-apify.sh — Instagram data extraction via Apify
# Reemplaza instaloader con Apify cloud scrapers (fiable, sin rate limits)
#
# Comandos:
#   scrape <handle> [limit]       Posts nuevos (filtra seen_posts.json)
#   profile <handle>              Metadata del perfil
#   reels <handle> [limit]        Reels con video URLs (solo nuevos)
#   download-reel <url> <output>  Descarga video via yt-dlp
#   list-monitored                Lista cuentas configuradas
#   usage                         Creditos Apify restantes
#   mark-seen <handle> <codes>    Marcar shortcodes como analizados (comma-sep)

set -euo pipefail

ENV_FILE="$HOME/clawd/.env.local"
APIFY_KEY=""
if [[ -f "$ENV_FILE" ]]; then
  APIFY_KEY=$(grep '^APIFY_API_KEY=' "$ENV_FILE" | cut -d= -f2- || true)
fi

if [[ -z "$APIFY_KEY" ]]; then
  echo '{"error":"APIFY_API_KEY not found in ~/clawd/.env.local"}' >&2
  exit 1
fi

# Monitored accounts
MONITORED_ACCOUNTS="santim.ia rackslabs mattganzak"

# Deduplication file
DATA_DIR="$HOME/clawd/workspace-roberto/data/instagram"
SEEN_FILE="$DATA_DIR/seen_posts.json"
mkdir -p "$DATA_DIR"

# Initialize seen_posts.json if not exists
if [[ ! -f "$SEEN_FILE" ]]; then
  echo '{}' > "$SEEN_FILE"
fi

CMD="${1:-help}"

case "$CMD" in

  scrape)
    HANDLE="${2:?ERROR: Falta handle. Uso: ./instagram-apify.sh scrape <handle> [limit]}"
    LIMIT="${3:-5}"

    python3 << PYEOF
import json, sys, os, requests
from datetime import datetime, timedelta

token = "${APIFY_KEY}"
handle = "${HANDLE}"
limit = ${LIMIT}
seen_file = "${SEEN_FILE}"

# Supabase credentials for persistence (use SERVICE_ROLE for RLS bypass)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xacthbehposxdrfqajwz.supabase.co")
SUPABASE_API_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_API_KEY:
    try:
        with open(os.path.expanduser("~/clawd/.env.local")) as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    SUPABASE_API_KEY = line.split("=", 1)[1].strip()
                    break
    except:
        pass

# Load seen posts
seen = {}
try:
    with open(seen_file) as f:
        seen = json.load(f)
except:
    seen = {}

seen_codes = set(seen.get(handle, {}).keys())

try:
    from apify_client import ApifyClient
    client = ApifyClient(token)

    run_input = {
        "username": [handle],
        "resultsLimit": limit + len(seen_codes),  # fetch extra to account for seen
    }

    run = client.actor("apify/instagram-post-scraper").call(run_input=run_input, timeout_secs=120)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    posts = []
    for item in items:
        shortcode = item.get("shortCode") or item.get("id", "")
        if shortcode in seen_codes:
            continue
        if len(posts) >= limit:
            break

        is_video = item.get("type") in ("Video", "Reel") or item.get("videoUrl") is not None
        typename = "GraphVideo" if is_video else "GraphSidecar" if item.get("type") == "Sidecar" else "GraphImage"

        posts.append({
            "shortcode": shortcode,
            "caption": (item.get("caption") or "")[:500],
            "likes": item.get("likesCount", 0),
            "comments_count": item.get("commentsCount", 0),
            "date": item.get("timestamp", ""),
            "is_video": is_video,
            "typename": typename,
            "author": handle,
            "url": item.get("url") or f"https://www.instagram.com/p/{shortcode}/",
            "video_url": item.get("videoUrl") or "",
        })

    # Persist to Supabase agent_docs if we have posts
    if posts and SUPABASE_API_KEY:
        try:
            doc_content = json.dumps(posts, ensure_ascii=False, indent=2)
            doc_data = {
                "title": f"Instagram Analysis: @{handle}",
                "content": doc_content,
                "author": "Roberto",
                "doc_type": "instagram_analysis",
                "tags": ["instagram", "analysis", handle],
                "word_count": len(doc_content.split()),
            }
            headers = {
                "Authorization": f"Bearer {SUPABASE_API_KEY}",
                "apikey": SUPABASE_API_KEY,
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            }
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/agent_docs",
                json=doc_data,
                headers=headers,
                timeout=10
            )
            if response.status_code not in (200, 201):
                print(f"Warning: Supabase persistence failed ({response.status_code}): {response.text}", file=sys.stderr)
            else:
                print(f"✓ Instagram data persisted to Supabase (doc_type=instagram_analysis)", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Could not persist to Supabase: {str(e)}", file=sys.stderr)

    print(json.dumps(posts, ensure_ascii=False, indent=2))

except Exception as e:
    print(json.dumps({"error": f"Apify scrape failed: {str(e)}"}))
    sys.exit(1)
PYEOF
    ;;

  profile)
    HANDLE="${2:?ERROR: Falta handle. Uso: ./instagram-apify.sh profile <handle>}"

    python3 << PYEOF
import json, sys

token = "${APIFY_KEY}"
handle = "${HANDLE}"

try:
    from apify_client import ApifyClient
    client = ApifyClient(token)

    run_input = {
        "usernames": [handle],
    }

    run = client.actor("apify/instagram-profile-scraper").call(run_input=run_input, timeout_secs=60)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    if not items:
        print(json.dumps({"error": f"Profile not found: {handle}"}))
        sys.exit(1)

    p = items[0]
    print(json.dumps({
        "username": p.get("username", handle),
        "full_name": p.get("fullName", ""),
        "biography": p.get("biography", ""),
        "followers": p.get("followersCount", 0),
        "followees": p.get("followsCount", 0),
        "posts_count": p.get("postsCount", 0),
        "is_private": p.get("private", False),
        "is_verified": p.get("verified", False),
        "external_url": p.get("externalUrl") or "",
    }, ensure_ascii=False, indent=2))

except Exception as e:
    print(json.dumps({"error": f"Apify profile failed: {str(e)}"}))
    sys.exit(1)
PYEOF
    ;;

  reels)
    HANDLE="${2:?ERROR: Falta handle. Uso: ./instagram-apify.sh reels <handle> [limit]}"
    LIMIT="${3:-3}"

    python3 << PYEOF
import json, sys, os, requests
from datetime import datetime

token = "${APIFY_KEY}"
handle = "${HANDLE}"
limit = ${LIMIT}
seen_file = "${SEEN_FILE}"

# Supabase credentials for persistence (use SERVICE_ROLE for RLS bypass)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xacthbehposxdrfqajwz.supabase.co")
SUPABASE_API_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_API_KEY:
    try:
        with open(os.path.expanduser("~/clawd/.env.local")) as f:
            for line in f:
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    SUPABASE_API_KEY = line.split("=", 1)[1].strip()
                    break
    except:
        pass

seen = {}
try:
    with open(seen_file) as f:
        seen = json.load(f)
except:
    seen = {}

seen_codes = set(seen.get(handle, {}).keys())

try:
    from apify_client import ApifyClient
    client = ApifyClient(token)

    run_input = {
        "username": [handle],
        "resultsLimit": limit + len(seen_codes),
    }

    run = client.actor("apify/instagram-reel-scraper").call(run_input=run_input, timeout_secs=120)
    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())

    reels = []
    for item in items:
        shortcode = item.get("shortCode") or item.get("id", "")
        if shortcode in seen_codes:
            continue
        if len(reels) >= limit:
            break

        reels.append({
            "shortcode": shortcode,
            "caption": (item.get("caption") or "")[:500],
            "likes": item.get("likesCount", 0),
            "comments_count": item.get("commentsCount", 0),
            "views": item.get("videoViewCount", 0),
            "date": item.get("timestamp", ""),
            "video_url": item.get("videoUrl") or "",
            "duration_sec": item.get("videoDuration", 0),
            "author": handle,
            "url": item.get("url") or f"https://www.instagram.com/reel/{shortcode}/",
        })

    # Persist to Supabase agent_docs if we have reels
    if reels and SUPABASE_API_KEY:
        try:
            doc_content = json.dumps(reels, ensure_ascii=False, indent=2)
            doc_data = {
                "title": f"Instagram Reels Analysis: @{handle}",
                "content": doc_content,
                "author": "Roberto",
                "doc_type": "instagram_analysis",
                "tags": ["instagram", "reels", "analysis", handle],
                "word_count": len(doc_content.split()),
            }
            headers = {
                "Authorization": f"Bearer {SUPABASE_API_KEY}",
                "apikey": SUPABASE_API_KEY,
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            }
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/agent_docs",
                json=doc_data,
                headers=headers,
                timeout=10
            )
            if response.status_code not in (200, 201):
                print(f"Warning: Supabase persistence failed ({response.status_code}): {response.text}", file=sys.stderr)
            else:
                print(f"✓ Instagram reels data persisted to Supabase (doc_type=instagram_analysis)", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Could not persist to Supabase: {str(e)}", file=sys.stderr)

    print(json.dumps(reels, ensure_ascii=False, indent=2))

except Exception as e:
    print(json.dumps({"error": f"Apify reels failed: {str(e)}"}))
    sys.exit(1)
PYEOF
    ;;

  download-reel)
    URL="${2:?ERROR: Falta URL. Uso: ./instagram-apify.sh download-reel <url> <output>}"
    OUTPUT="${3:?ERROR: Falta output. Uso: ./instagram-apify.sh download-reel <url> <output>}"

    OUTDIR=$(dirname "$OUTPUT")
    mkdir -p "$OUTDIR"

    # Check file size limit (skip > 50MB)
    yt-dlp --no-download --print "%(filesize)s" "$URL" 2>/dev/null | head -1 | {
      read SIZE
      if [[ -n "$SIZE" && "$SIZE" != "NA" ]] && (( SIZE > 52428800 )); then
        echo '{"error":"Video exceeds 50MB limit, skipping","size_bytes":"'"$SIZE"'"}'
        exit 1
      fi
    }

    if yt-dlp -o "$OUTPUT" --no-playlist --quiet "$URL" 2>/dev/null; then
      FILESIZE=$(stat -f%z "$OUTPUT" 2>/dev/null || echo "0")
      echo "{\"status\":\"ok\",\"path\":\"$OUTPUT\",\"size_bytes\":$FILESIZE}"
    else
      echo '{"error":"Download failed","url":"'"$URL"'"}'
      exit 1
    fi
    ;;

  mark-seen)
    HANDLE="${2:?ERROR: Falta handle. Uso: ./instagram-apify.sh mark-seen <handle> <shortcode1,shortcode2,...>}"
    CODES="${3:?ERROR: Falta shortcodes (comma-separated)}"

    python3 << PYEOF
import json, sys
from datetime import datetime

handle = "${HANDLE}"
codes = "${CODES}".split(",")
seen_file = "${SEEN_FILE}"

seen = {}
try:
    with open(seen_file) as f:
        seen = json.load(f)
except:
    seen = {}

if handle not in seen:
    seen[handle] = {}

today = datetime.utcnow().strftime("%Y-%m-%d")
for code in codes:
    code = code.strip()
    if code:
        seen[handle][code] = {"date": today, "analyzed": True}

# Cleanup entries older than 90 days
cutoff = datetime.utcnow().strftime("%Y-%m-%d")
from datetime import timedelta
cutoff_date = (datetime.utcnow() - timedelta(days=90)).strftime("%Y-%m-%d")
for h in list(seen.keys()):
    for sc in list(seen[h].keys()):
        if seen[h][sc].get("date", "2099-01-01") < cutoff_date:
            del seen[h][sc]

with open(seen_file, "w") as f:
    json.dump(seen, f, indent=2)

print(json.dumps({"status": "ok", "handle": handle, "marked": len(codes)}))
PYEOF
    ;;

  list-monitored)
    echo "$MONITORED_ACCOUNTS" | tr ' ' '\n' | jq -R . | jq -s '{"monitored_accounts": .}'
    ;;

  usage)
    python3 << PYEOF
import json, sys

token = "${APIFY_KEY}"

try:
    from apify_client import ApifyClient
    client = ApifyClient(token)
    user = client.user().get()
    plan = user.get("plan", {})
    usage = user.get("monthlyUsage", {})
    print(json.dumps({
        "plan": plan.get("id", "unknown"),
        "monthly_usage_usd": usage.get("totalUsageUsd", 0),
        "monthly_limit_usd": plan.get("monthlyUsageLimitUsd", 0),
        "username": user.get("username", ""),
    }, indent=2))
except Exception as e:
    print(json.dumps({"error": f"Usage check failed: {str(e)}"}))
    sys.exit(1)
PYEOF
    ;;

  *)
    echo "instagram-apify.sh — Instagram data extraction via Apify"
    echo ""
    echo "Uso: ./instagram-apify.sh <comando> [args...]"
    echo ""
    echo "Comandos:"
    echo "  scrape <handle> [limit]       Posts nuevos (filtra ya vistos)"
    echo "  profile <handle>              Metadata del perfil"
    echo "  reels <handle> [limit]        Reels con video URLs (solo nuevos)"
    echo "  download-reel <url> <output>  Descarga video via yt-dlp"
    echo "  list-monitored                Lista cuentas configuradas"
    echo "  usage                         Creditos Apify restantes"
    echo "  mark-seen <handle> <codes>    Marcar shortcodes como analizados"
    echo ""
    echo "Cuentas monitorizadas: $MONITORED_ACCOUNTS"
    echo "Seen posts: $SEEN_FILE"
    ;;

esac
