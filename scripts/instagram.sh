#!/bin/bash
# instagram.sh — Instagram scraping via instaloader
# Uso: ./instagram.sh <comando> [args...]
#
# Comandos:
#   scrape <handle> [limit]    Obtener últimos N posts (default 5)
#   profile <handle>           Metadata del perfil
#   login                      Login y guardar sesión (hacer 1 vez)
#   session-check              Verificar si la sesión es válida
#   list-monitored             Lista cuentas configuradas

set -euo pipefail

ENV_FILE="$HOME/clawd/.env.local"
IG_USER=""
IG_PASS=""
if [[ -f "$ENV_FILE" ]]; then
  IG_USER=$(grep '^INSTAGRAM_USER=' "$ENV_FILE" | cut -d= -f2- || true)
  IG_PASS=$(grep '^INSTAGRAM_PASS=' "$ENV_FILE" | cut -d= -f2- || true)
fi

# Monitored accounts (centralizado)
MONITORED_ACCOUNTS="santim.ia rackslabs mattganzak"

# Use pipx venv python (instaloader installed via pipx, not system python)
INSTA_PYTHON="$HOME/.local/pipx/venvs/instaloader/bin/python3"
if [[ ! -x "$INSTA_PYTHON" ]]; then
  echo '{"error":"instaloader venv python not found. Run: pipx install instaloader"}' >&2
  exit 1
fi

# Session file directory
SESSION_DIR="$HOME/.config/instaloader"
mkdir -p "$SESSION_DIR"

CMD="${1:-help}"

case "$CMD" in

  login)
    # Login interactivo y guardar sesión
    "$INSTA_PYTHON" << PYEOF
import json, sys, os
import instaloader

ig_user = "${IG_USER}"
ig_pass = "${IG_PASS}"
session_dir = "${SESSION_DIR}"

if not ig_user or not ig_pass:
    print(json.dumps({"error": "INSTAGRAM_USER and INSTAGRAM_PASS required in .env.local"}))
    sys.exit(1)

L = instaloader.Instaloader(quiet=True)

try:
    L.login(ig_user, ig_pass)
    session_file = os.path.join(session_dir, f"session-{ig_user}")
    L.save_session_to_file(session_file)
    print(json.dumps({"status": "ok", "message": f"Session saved to {session_file}", "user": ig_user}))
except instaloader.TwoFactorAuthRequiredException:
    print(json.dumps({"error": "2FA required", "hint": "Run: instaloader --login alfred.vxa (interactive CLI for 2FA)"}))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"Login failed: {str(e)}"}))
    sys.exit(1)
PYEOF
    ;;

  session-check)
    # Verificar si hay sesión guardada válida
    "$INSTA_PYTHON" << PYEOF
import json, sys, os
import instaloader

ig_user = "${IG_USER}"
session_dir = "${SESSION_DIR}"
session_file = os.path.join(session_dir, f"session-{ig_user}")

if not os.path.exists(session_file):
    print(json.dumps({"valid": False, "reason": "No session file found", "hint": "Run: instagram.sh login"}))
    sys.exit(0)

L = instaloader.Instaloader(quiet=True)
try:
    L.load_session_from_file(ig_user, session_file)
    # Test the session by fetching own profile
    test = instaloader.Profile.from_username(L.context, ig_user)
    print(json.dumps({"valid": True, "user": ig_user, "test_profile": test.username}))
except Exception as e:
    print(json.dumps({"valid": False, "reason": str(e), "hint": "Session expired. Run: instagram.sh login"}))
PYEOF
    ;;

  scrape)
    HANDLE="${2:?ERROR: Falta handle. Uso: ./instagram.sh scrape <handle> [limit]}"
    LIMIT="${3:-5}"

    "$INSTA_PYTHON" << PYEOF
import json, sys, time, os
import instaloader

handle = "${HANDLE}"
limit = ${LIMIT}
ig_user = "${IG_USER}"
ig_pass = "${IG_PASS}"
session_dir = "${SESSION_DIR}"

L = instaloader.Instaloader(
    download_pictures=False,
    download_videos=False,
    download_video_thumbnails=False,
    download_geotags=False,
    download_comments=False,
    save_metadata=False,
    compress_json=False,
    quiet=True,
)

# Try loading saved session first (avoids rate limits from re-login)
session_file = os.path.join(session_dir, f"session-{ig_user}")
logged_in = False

if os.path.exists(session_file):
    try:
        L.load_session_from_file(ig_user, session_file)
        logged_in = True
    except Exception:
        pass

# Fall back to fresh login
if not logged_in and ig_user and ig_pass:
    try:
        L.login(ig_user, ig_pass)
        L.save_session_to_file(session_file)
        logged_in = True
    except Exception as e:
        print(json.dumps({"error": f"Login failed: {str(e)}", "hint": "Run: instagram.sh login"}), file=sys.stderr)

if not logged_in:
    print(json.dumps({"error": "Not authenticated. Run: instagram.sh login"}))
    sys.exit(1)

try:
    profile = instaloader.Profile.from_username(L.context, handle)
except Exception as e:
    print(json.dumps({"error": f"Profile not found: {str(e)}"}))
    sys.exit(1)

posts = []
try:
    for i, post in enumerate(profile.get_posts()):
        if i >= limit:
            break
        posts.append({
            "shortcode": post.shortcode,
            "caption": (post.caption or "")[:500],
            "likes": post.likes,
            "comments_count": post.comments,
            "date": post.date_utc.isoformat() + "Z",
            "is_video": post.is_video,
            "typename": post.typename,
            "author": handle,
            "url": f"https://www.instagram.com/p/{post.shortcode}/"
        })
        if i < limit - 1:
            time.sleep(2)
except Exception as e:
    if posts:
        pass  # Return what we got before the error
    else:
        print(json.dumps({"error": f"Scrape failed: {str(e)}"}))
        sys.exit(1)

print(json.dumps(posts, ensure_ascii=False, indent=2))
PYEOF
    ;;

  profile)
    HANDLE="${2:?ERROR: Falta handle. Uso: ./instagram.sh profile <handle>}"

    "$INSTA_PYTHON" << PYEOF
import json, sys, os
import instaloader

handle = "${HANDLE}"
ig_user = "${IG_USER}"
session_dir = "${SESSION_DIR}"

L = instaloader.Instaloader(quiet=True)

# Try loading saved session
session_file = os.path.join(session_dir, f"session-{ig_user}")
if os.path.exists(session_file):
    try:
        L.load_session_from_file(ig_user, session_file)
    except Exception:
        pass

try:
    p = instaloader.Profile.from_username(L.context, handle)
    print(json.dumps({
        "username": p.username,
        "full_name": p.full_name,
        "biography": p.biography,
        "followers": p.followers,
        "followees": p.followees,
        "posts_count": p.mediacount,
        "is_private": p.is_private,
        "is_verified": p.is_verified,
        "external_url": p.external_url or "",
    }, ensure_ascii=False, indent=2))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
PYEOF
    ;;

  list-monitored)
    echo "$MONITORED_ACCOUNTS" | tr ' ' '\n' | jq -R . | jq -s '{"monitored_accounts": .}'
    ;;

  *)
    echo "instagram.sh — Instagram scraping via instaloader"
    echo ""
    echo "Uso: ./instagram.sh <comando> [args...]"
    echo ""
    echo "Comandos:"
    echo "  login                      Login y guardar sesión (hacer 1 vez)"
    echo "  session-check              Verificar si la sesión es válida"
    echo "  scrape <handle> [limit]    Obtener últimos N posts (default 5)"
    echo "  profile <handle>           Metadata del perfil"
    echo "  list-monitored             Lista cuentas configuradas"
    echo ""
    echo "Cuentas monitoreadas: $MONITORED_ACCOUNTS"
    echo ""
    echo "Setup inicial:"
    echo "  1. Configurar INSTAGRAM_USER y INSTAGRAM_PASS en ~/clawd/.env.local"
    echo "  2. Ejecutar: instagram.sh login"
    echo "  3. Si pide 2FA: instaloader --login alfred.vxa (CLI interactivo)"
    ;;

esac
