#!/usr/bin/env bash
# (Re)create symlinks from this repo to aro-studio-apps-docs.
# Run from the dev repo root. Default docs path: ../../../knowledge/aro-studio/aro-studio-apps-docs
# (workspace root must contain both knowledge/ and projects/). If symlinked files don't show in the IDE, use a multi-root workspace that includes both repos.
# Usage: ./scripts/link-docs.sh [path-to-docs-repo]

set -e
DEV_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_REL="${1:-../../../knowledge/aro-studio/aro-studio-apps-docs}"
DOCS_ABS="$(cd "$DEV_ROOT" && cd "$DOCS_REL" 2>/dev/null && pwd)" || true

if [[ -z "$DOCS_ABS" || ! -d "$DOCS_ABS" ]]; then
  echo "Docs repo not found at $DEV_ROOT/$DOCS_REL"
  echo "Clone aro-studio-apps-docs there or pass the path: ./scripts/link-docs.sh /path/to/aro-studio-apps-docs"
  exit 1
fi

cd "$DEV_ROOT"

link() {
  local name="$1"
  local target="$2"
  rm -rf "$name" 2>/dev/null || true
  ln -s "$target" "$name"
  echo "  $name -> $target"
}

echo "Linking to docs repo at $DOCS_ABS"
link "docs" "$DOCS_REL/docs"
mkdir -p .cursor
rm -rf .cursor/rules
mkdir -p .cursor/rules
for f in "$DOCS_ABS/cursor/rules"/*; do
  [[ -e "$f" ]] || continue
  name=".cursor/rules/$(basename "$f")"
  target="../../$DOCS_REL/cursor/rules/$(basename "$f")"
  rm -f "$name" 2>/dev/null || true
  ln -s "$target" "$name"
  echo "  $name -> $target"
done
link "AGENTS.md" "$DOCS_REL/AGENTS.md"
link "adr" "$DOCS_REL/adr"
link "decisions" "$DOCS_REL/decisions"
link "diagrams" "$DOCS_REL/diagrams"
echo "Done."
