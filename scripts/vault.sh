#!/bin/bash
# vault.sh — Sistema de memoria basado en markdown + YAML frontmatter + wiki-links
# Inspirado en ClawVault: plain markdown > vector DBs (74% vs 68.5% en LoCoMo)
#
# Uso:
#   vault.sh add <category> <title> [content] [--tags tag1,tag2] [--type memoryType] [--priority high|medium|low] [--author name]
#   vault.sh link <note_slug> <target_slug>
#   vault.sh search <query>
#   vault.sh graph [--entity slug] [--hops N]
#   vault.sh index
#   vault.sh decay [--days N]
#   vault.sh read <slug>
#   vault.sh list [category]
#   vault.sh stats

set -euo pipefail

VAULT_DIR="${VAULT_DIR:-$HOME/clawd/vault}"

# ── Helpers ──

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9áéíóúñü]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//'
}

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

today() {
  date +"%Y-%m-%d"
}

# Parse wiki-links from a file, return one per line
extract_links() {
  local file="$1"
  grep -oE '\[\[[^]]+\]\]' "$file" 2>/dev/null | sed 's/\[\[//g;s/\]\]//g' | tr '[:upper:]' '[:lower:]' | sort -u
}

# Find note file by slug (searches all categories)
find_note() {
  local slug="$1"
  local found=""
  found=$(find "$VAULT_DIR" -name "${slug}.md" -not -name "_index.md" 2>/dev/null | head -1)
  if [ -z "$found" ]; then
    # Try partial match
    found=$(find "$VAULT_DIR" -name "*${slug}*.md" -not -name "_index.md" 2>/dev/null | head -1)
  fi
  echo "$found"
}

# Parse YAML frontmatter from a file
parse_frontmatter() {
  local file="$1"
  local key="$2"
  sed -n '/^---$/,/^---$/p' "$file" | grep "^${key}:" | sed "s/^${key}: *//" | sed 's/^"//;s/"$//'
}

# ── Commands ──

cmd_add() {
  local category=""
  local title=""
  local content=""
  local tags=""
  local memtype=""
  local priority="medium"
  local author=""

  # Parse positional args
  category="${1:-}"
  shift 2>/dev/null || true
  title="${1:-}"
  shift 2>/dev/null || true

  # Remaining positional = content (if not a flag)
  if [[ -n "${1:-}" && "${1:0:2}" != "--" ]]; then
    content="$1"
    shift
  fi

  local confidence_val=""

  # Parse flags
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --tags) tags="$2"; shift 2 ;;
      --type) memtype="$2"; shift 2 ;;
      --priority) priority="$2"; shift 2 ;;
      --author) author="$2"; shift 2 ;;
      --confidence) confidence_val="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  if [ -z "$category" ] || [ -z "$title" ]; then
    echo '{"error": "Usage: vault.sh add <category> <title> [content] [--tags t1,t2] [--type type] [--priority high|medium|low] [--author name]"}'
    exit 1
  fi

  # Validate category
  local valid_cats="decisions topics people formulas lessons trends projects preferences"
  if ! echo "$valid_cats" | grep -qw "$category"; then
    echo "{\"error\": \"Invalid category '$category'. Valid: $valid_cats\"}"
    exit 1
  fi

  local slug
  slug=$(slugify "$title")
  local filepath="$VAULT_DIR/$category/${slug}.md"

  # Soft limits check
  local total_count
  total_count=$(find "$VAULT_DIR" -name "*.md" -not -name "_index.md" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$total_count" -gt 500 ]; then
    echo "{\"warning\": \"Vault has $total_count notes (>500). Consider running vault.sh dedup and pruning.\"}" >&2
  fi

  # Don't overwrite existing notes — append or warn
  if [ -f "$filepath" ]; then
    if [ -n "$content" ]; then
      # Size check before append
      local filesize
      filesize=$(wc -c < "$filepath" | tr -d ' ')
      if [ "$filesize" -gt 50000 ]; then
        echo "{\"warning\": \"Note $slug exceeds 50KB ($filesize bytes). Consider splitting.\"}" >&2
      fi
      # Append content and update date
      echo "" >> "$filepath"
      echo "$content" >> "$filepath"
      # Update last_updated in frontmatter
      local tmp
      tmp=$(mktemp)
      sed "s/^last_updated:.*/last_updated: $(now_iso)/" "$filepath" > "$tmp"
      # Increment mentions
      local old_mentions
      old_mentions=$(parse_frontmatter "$filepath" "mentions" || echo "1")
      local new_mentions=$((old_mentions + 1))
      sed "s/^mentions:.*/mentions: $new_mentions/" "$tmp" > "$filepath"
      rm -f "$tmp"
      echo "{\"status\": \"updated\", \"slug\": \"$slug\", \"path\": \"$category/$slug.md\", \"mentions\": $new_mentions}"
    else
      echo "{\"status\": \"exists\", \"slug\": \"$slug\", \"path\": \"$category/$slug.md\"}"
    fi
    return
  fi

  # Map priority to emoji
  local pri_emoji="🟡"
  case "$priority" in
    high) pri_emoji="🔴" ;;
    medium) pri_emoji="🟡" ;;
    low) pri_emoji="🟢" ;;
  esac

  # Build tags array
  local tags_yaml="[]"
  if [ -n "$tags" ]; then
    tags_yaml=$(echo "$tags" | tr ',' '\n' | sed 's/^ *//;s/ *$//' | awk '{printf "  - %s\n", $0}')
    tags_yaml=$'\n'"$tags_yaml"
  fi

  # Write note
  cat > "$filepath" <<FRONTMATTER
---
title: "$title"
date: $(today)
last_updated: $(now_iso)
category: $category
memoryType: ${memtype:-$category}
priority: $pri_emoji
tags: ${tags_yaml}
mentions: 1
confidence: ${confidence_val:-0.7}
author: "${author:-system}"
---

${content:-}
FRONTMATTER

  echo "{\"status\": \"created\", \"slug\": \"$slug\", \"path\": \"$category/$slug.md\"}"
}

cmd_link() {
  local source_slug="${1:-}"
  local target_slug="${2:-}"

  if [ -z "$source_slug" ] || [ -z "$target_slug" ]; then
    echo '{"error": "Usage: vault.sh link <source_slug> <target_slug>"}'
    exit 1
  fi

  local source_file
  source_file=$(find_note "$source_slug")
  local target_file
  target_file=$(find_note "$target_slug")

  if [ -z "$source_file" ]; then
    echo "{\"error\": \"Note not found: $source_slug\"}"
    exit 1
  fi

  # Add link to source if not already present
  if ! grep -q "\[\[$target_slug\]\]" "$source_file" 2>/dev/null; then
    echo "" >> "$source_file"
    echo "Relacionado con [[$target_slug]]." >> "$source_file"
  fi

  # Add backlink to target if it exists
  if [ -n "$target_file" ] && ! grep -q "\[\[$source_slug\]\]" "$target_file" 2>/dev/null; then
    echo "" >> "$target_file"
    echo "Relacionado con [[$source_slug]]." >> "$target_file"
  fi

  echo "{\"status\": \"linked\", \"source\": \"$source_slug\", \"target\": \"$target_slug\"}"
}

cmd_search() {
  local query="${1:-}"
  if [ -z "$query" ]; then
    echo '{"error": "Usage: vault.sh search <query>"}'
    exit 1
  fi

  local results
  results=$(grep -rl "$query" "$VAULT_DIR" --include="*.md" 2>/dev/null | grep -v "_index.md" || true)

  if [ -z "$results" ]; then
    echo '{"results": []}'
    return
  fi

  echo '{"results": ['
  local first=true
  while IFS= read -r file; do
    local rel_path="${file#$VAULT_DIR/}"
    local title
    title=$(parse_frontmatter "$file" "title" || echo "$rel_path")
    local category
    category=$(parse_frontmatter "$file" "category" || echo "unknown")
    local slug
    slug=$(basename "$file" .md)

    if [ "$first" = true ]; then
      first=false
    else
      echo ","
    fi
    printf '  {"slug": "%s", "title": %s, "category": "%s", "path": "%s"}' \
      "$slug" "$(python3 -c "import json; print(json.dumps('$title'))" 2>/dev/null || echo "\"$title\"")" "$category" "$rel_path"
  done <<< "$results"
  echo ''
  echo ']}'
}

cmd_graph() {
  local entity=""
  local hops=2

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --entity) entity="$2"; shift 2 ;;
      --hops) hops="$2"; shift 2 ;;
      *) shift ;;
    esac
  done

  # Build full graph from all vault files
  python3 - "$VAULT_DIR" "$entity" "$hops" <<'PYTHON'
import os, sys, json, re, hashlib

vault_dir = sys.argv[1]
focus_entity = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
max_hops = int(sys.argv[3]) if len(sys.argv) > 3 else 2

nodes = {}
edges = []
edge_set = set()

def parse_frontmatter(content):
    fm = {}
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            for line in parts[1].strip().split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.strip()
                    val = val.strip().strip('"')
                    if key == "tags" and val.startswith("["):
                        try:
                            fm[key] = json.loads(val)
                        except:
                            fm[key] = []
                    else:
                        fm[key] = val
    return fm

def extract_links(content):
    raw = re.findall(r'\[\[([^\]]+)\]\]', content)
    return list(set([link.lower() for link in raw]))

# Category colors
cat_colors = {
    "decisions": "#3B82F6",
    "topics": "#8B5CF6",
    "people": "#F59E0B",
    "formulas": "#22C55E",
    "lessons": "#EF4444",
    "trends": "#06B6D4",
    "projects": "#EC4899",
    "preferences": "#A855F7",
}

# Scan all vault files
for root, dirs, files in os.walk(vault_dir):
    for fname in files:
        if not fname.endswith(".md") or fname == "_index.md":
            continue
        filepath = os.path.join(root, fname)
        slug = fname[:-3]  # remove .md
        rel_dir = os.path.relpath(root, vault_dir)
        category = rel_dir if rel_dir != "." else "root"

        with open(filepath, "r") as f:
            content = f.read()

        fm = parse_frontmatter(content)
        links = extract_links(content)

        # Word count (body only, skip frontmatter)
        body = content.split("---", 2)[-1] if content.startswith("---") else content
        word_count = len(body.split())

        nodes[slug] = {
            "id": slug,
            "label": fm.get("title", slug),
            "category": category,
            "color": cat_colors.get(category, "#71717A"),
            "priority": fm.get("priority", "🟡"),
            "confidence": (lambda v: float(v) if str(v).replace('.','',1).isdigit() else 0.7)(fm.get("confidence", 0.7)),
            "mentions": (lambda v: int(v) if str(v).isdigit() else 1)(fm.get("mentions", 1)),
            "memoryType": fm.get("memoryType", category),
            "author": fm.get("author", "system"),
            "date": fm.get("date", ""),
            "last_updated": fm.get("last_updated", ""),
            "tags": fm.get("tags", []) if isinstance(fm.get("tags"), list) else [],
            "word_count": word_count,
            "links": links,
        }

        for link_target in links:
            edge_key = tuple(sorted([slug, link_target]))
            if edge_key not in edge_set:
                edge_set.add(edge_key)
                edges.append({
                    "source": slug,
                    "target": link_target,
                })

# If focus entity specified, filter by hops
if focus_entity:
    reachable = {focus_entity}
    frontier = {focus_entity}
    for _ in range(max_hops):
        next_frontier = set()
        for e in edges:
            if e["source"] in frontier and e["target"] not in reachable:
                next_frontier.add(e["target"])
                reachable.add(e["target"])
            if e["target"] in frontier and e["source"] not in reachable:
                next_frontier.add(e["source"])
                reachable.add(e["source"])
        frontier = next_frontier
    nodes = {k: v for k, v in nodes.items() if k in reachable}
    edges = [e for e in edges if e["source"] in reachable and e["target"] in reachable]

# Add phantom nodes for links that point to non-existent notes
all_linked = set()
for e in edges:
    all_linked.add(e["source"])
    all_linked.add(e["target"])
for link_id in all_linked:
    if link_id not in nodes:
        nodes[link_id] = {
            "id": link_id,
            "label": link_id.replace("-", " ").title(),
            "category": "phantom",
            "color": "#3F3F46",
            "priority": "🟡",
            "confidence": 0,
            "mentions": 0,
            "memoryType": "phantom",
            "author": "",
            "date": "",
            "last_updated": "",
            "tags": [],
            "word_count": 0,
            "links": [],
        }

result = {
    "nodes": list(nodes.values()),
    "edges": edges,
    "stats": {
        "total_notes": sum(1 for n in nodes.values() if n["category"] != "phantom"),
        "total_links": len(edges),
        "categories": {},
        "phantom_nodes": sum(1 for n in nodes.values() if n["category"] == "phantom"),
    }
}

# Category counts
for n in nodes.values():
    cat = n["category"]
    result["stats"]["categories"][cat] = result["stats"]["categories"].get(cat, 0) + 1

print(json.dumps(result, ensure_ascii=False, indent=2))
PYTHON
}

cmd_index() {
  # Regenerate _index.md
  local total=0
  local index_content="---
title: \"Vault Index\"
date: $(today)
auto_generated: true
---

# Vault - Departamento de Marketing VertexAura

Índice auto-generado del vault de memoria del departamento.

"

  for category in decisions topics people formulas lessons trends projects preferences; do
    local count
    count=$(find "$VAULT_DIR/$category" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    total=$((total + count))
    index_content+="## $category/ ($count notas)
"
    if [ "$count" -gt 0 ]; then
      for file in "$VAULT_DIR/$category"/*.md; do
        local title
        title=$(parse_frontmatter "$file" "title" || basename "$file" .md)
        local slug
        slug=$(basename "$file" .md)
        local priority
        priority=$(parse_frontmatter "$file" "priority" || echo "🟡")
        index_content+="- $priority [[$slug]] — $title
"
      done
    fi
    index_content+="
"
  done

  index_content+="---

**Total notas**: $total
**Última actualización**: $(now_iso)
"

  echo "$index_content" > "$VAULT_DIR/_index.md"
  echo "{\"status\": \"indexed\", \"total_notes\": $total}"
}

cmd_decay() {
  local days="${1:-30}"
  local cutoff
  cutoff=$(python3 -c "
from datetime import datetime, timedelta
d = datetime.utcnow() - timedelta(days=$days)
print(d.strftime('%Y-%m-%dT%H:%M:%SZ'))
")

  local decayed=0
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    local last_updated
    last_updated=$(parse_frontmatter "$file" "last_updated" || echo "")
    [ -z "$last_updated" ] && continue

    if [[ "$last_updated" < "$cutoff" ]]; then
      local conf
      conf=$(parse_frontmatter "$file" "confidence" || echo "0.7")
      local new_conf
      new_conf=$(python3 -c "print(max(0.1, round($conf - 0.1, 1)))")
      local tmp
      tmp=$(mktemp)
      sed "s/^confidence:.*/confidence: $new_conf/" "$file" > "$tmp"
      mv "$tmp" "$file"
      decayed=$((decayed + 1))
    fi
  done < <(find "$VAULT_DIR" -name "*.md" -not -name "_index.md" 2>/dev/null)

  echo "{\"status\": \"decayed\", \"notes_affected\": $decayed, \"threshold_days\": $days}"
}

cmd_read() {
  local slug="${1:-}"
  if [ -z "$slug" ]; then
    echo '{"error": "Usage: vault.sh read <slug>"}'
    exit 1
  fi

  local file
  file=$(find_note "$slug")
  if [ -z "$file" ]; then
    echo "{\"error\": \"Note not found: $slug\"}"
    exit 1
  fi

  cat "$file"
}

cmd_list() {
  local category="${1:-}"

  if [ -n "$category" ]; then
    local dir="$VAULT_DIR/$category"
    if [ ! -d "$dir" ]; then
      echo "{\"error\": \"Category not found: $category\"}"
      exit 1
    fi
    find "$dir" -name "*.md" -exec basename {} .md \; 2>/dev/null | sort
  else
    find "$VAULT_DIR" -name "*.md" -not -name "_index.md" 2>/dev/null | while read -r f; do
      local rel="${f#$VAULT_DIR/}"
      echo "$rel"
    done | sort
  fi
}

cmd_stats() {
  local total
  total=$(find "$VAULT_DIR" -name "*.md" -not -name "_index.md" 2>/dev/null | wc -l | tr -d ' ')
  local total_links=0

  while IFS= read -r file; do
    [ -z "$file" ] && continue
    local links
    links=$(extract_links "$file" | wc -l | tr -d ' ')
    total_links=$((total_links + links))
  done < <(find "$VAULT_DIR" -name "*.md" -not -name "_index.md" 2>/dev/null)

  echo "{"
  echo "  \"total_notes\": $total,"
  echo "  \"total_links\": $total_links,"
  echo "  \"categories\": {"
  local first=true
  for category in decisions topics people formulas lessons trends projects preferences; do
    local count
    count=$(find "$VAULT_DIR/$category" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$first" = true ]; then first=false; else echo ","; fi
    printf "    \"%s\": %d" "$category" "$count"
  done
  echo ""
  echo "  }"
  echo "}"
}

cmd_dedup() {
  python3 - "$VAULT_DIR" <<'PYTHON'
import os, sys, json

vault_dir = sys.argv[1]
notes = []

for root, dirs, files in os.walk(vault_dir):
    for fname in files:
        if not fname.endswith(".md") or fname == "_index.md":
            continue
        filepath = os.path.join(root, fname)
        slug = fname[:-3]
        category = os.path.relpath(root, vault_dir)
        with open(filepath) as f:
            content = f.read()
        title = slug
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                for line in parts[1].strip().split("\n"):
                    if line.startswith("title:"):
                        title = line.split(":", 1)[1].strip().strip('"')
                        break
        notes.append({"slug": slug, "category": category, "title": title})

duplicates = []
for i, a in enumerate(notes):
    for j, b in enumerate(notes):
        if j <= i:
            continue
        if a["category"] != b["category"]:
            continue
        words_a = set(a["title"].lower().split())
        words_b = set(b["title"].lower().split())
        if len(words_a) == 0 or len(words_b) == 0:
            continue
        overlap = len(words_a & words_b) / min(len(words_a), len(words_b))
        if overlap >= 0.6:
            duplicates.append({
                "note_a": a["slug"],
                "note_b": b["slug"],
                "category": a["category"],
                "similarity": round(overlap, 2)
            })

print(json.dumps({
    "total_notes": len(notes),
    "potential_duplicates": duplicates,
    "message": f"{len(notes)} notes, {len(duplicates)} potential duplicates" if duplicates else f"{len(notes)} notes, no duplicates found"
}, indent=2, ensure_ascii=False))
PYTHON
}

cmd_update_confidence() {
  local slug="${1:-}"
  local new_conf="${2:-}"
  if [ -z "$slug" ] || [ -z "$new_conf" ]; then
    echo '{"error": "Usage: vault.sh update-confidence <slug> <0.0-1.0>"}'
    exit 1
  fi
  local file
  file=$(find_note "$slug")
  if [ -z "$file" ]; then
    echo "{\"error\": \"Note not found: $slug\"}"
    exit 1
  fi
  local tmp
  tmp=$(mktemp)
  sed "s/^confidence:.*/confidence: $new_conf/" "$file" > "$tmp"
  sed "s/^last_updated:.*/last_updated: $(now_iso)/" "$tmp" > "$file"
  rm -f "$tmp"
  echo "{\"status\": \"updated\", \"slug\": \"$slug\", \"confidence\": $new_conf}"
}

cmd_health() {
  python3 - "$VAULT_DIR" <<'PYTHON'
import os, sys, json, re, time, subprocess

vault_dir = sys.argv[1]
notes = []
total_size = 0
largest_file = ""
largest_size = 0
total_links = 0

for root, dirs, files in os.walk(vault_dir):
    for fname in files:
        if not fname.endswith(".md") or fname == "_index.md":
            continue
        filepath = os.path.join(root, fname)
        slug = fname[:-3]
        fsize = os.path.getsize(filepath)
        total_size += fsize
        if fsize > largest_size:
            largest_size = fsize
            largest_file = slug
        with open(filepath) as f:
            content = f.read()
        links = re.findall(r'\[\[([^\]]+)\]\]', content)
        total_links += len(set([l.lower() for l in links]))
        notes.append(slug)

t0 = time.time()
try:
    subprocess.run(["grep", "-rl", "benchmark-perf-test", vault_dir, "--include=*.md"],
                   capture_output=True, timeout=10)
except:
    pass
search_ms = int((time.time() - t0) * 1000)

status = "healthy"
warnings = []
if len(notes) > 500:
    status = "warning"
    warnings.append(f"note_count_high({len(notes)}>500)")
if largest_size > 50000:
    status = "warning"
    warnings.append(f"largest_note_big({largest_file}={largest_size}B)")
if search_ms > 500:
    status = "warning"
    warnings.append(f"search_slow({search_ms}ms>500ms)")

print(json.dumps({
    "status": status,
    "total_notes": len(notes),
    "total_links": total_links,
    "total_size_bytes": total_size,
    "largest_note": largest_file,
    "largest_note_bytes": largest_size,
    "search_latency_ms": search_ms,
    "warnings": ", ".join(warnings) if warnings else "none",
    "limits": {
        "soft_max_notes": 500,
        "soft_max_note_bytes": 50000,
        "soft_max_search_ms": 500
    }
}, indent=2, ensure_ascii=False))
PYTHON
}

# ── Main dispatch ──

case "${1:-}" in
  add)    shift; cmd_add "$@" ;;
  link)   shift; cmd_link "$@" ;;
  search) shift; cmd_search "$@" ;;
  graph)  shift; cmd_graph "$@" ;;
  index)  cmd_index ;;
  decay)  shift; cmd_decay "$@" ;;
  read)   shift; cmd_read "$@" ;;
  list)   shift; cmd_list "$@" ;;
  stats)  cmd_stats ;;
  dedup)  cmd_dedup ;;
  update-confidence) shift; cmd_update_confidence "$@" ;;
  health) cmd_health ;;
  *)
    echo "Vault — Sistema de memoria del departamento"
    echo ""
    echo "Uso:"
    echo "  vault.sh add <category> <title> [content] [--tags t1,t2] [--type type] [--priority high|medium|low] [--author name]"
    echo "  vault.sh link <source_slug> <target_slug>"
    echo "  vault.sh search <query>"
    echo "  vault.sh graph [--entity slug] [--hops N]"
    echo "  vault.sh index"
    echo "  vault.sh decay [days]"
    echo "  vault.sh read <slug>"
    echo "  vault.sh list [category]"
    echo "  vault.sh stats"
    echo "  vault.sh dedup"
    echo "  vault.sh update-confidence <slug> <0.0-1.0>"
    echo "  vault.sh health"
    echo ""
    echo "Categorías: decisions, topics, people, formulas, lessons, trends, projects, preferences"
    exit 1
    ;;
esac
