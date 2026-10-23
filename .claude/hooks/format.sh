#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): format the single file that was just written.
#
# Uses 'npx prettier --write <file>' rather than 'pnpm format': the project script runs
# prettier over the whole repo, which cannot be scoped to one file. Same binary, same
# .prettierrc, narrower scope.
#
# Skips anything prettier does not handle here, and every path on the protected list
# (protect-files.sh should already have blocked those, but do not rely on hook order).

set -euo pipefail

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" || ! -f "$file_path" ]]; then
  exit 0
fi

case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.json|*.md|*.css) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  */.next/*|*/node_modules/*|*/.agents/*) exit 0 ;;
  *pnpm-lock.yaml) exit 0 ;;
esac

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

cd "$repo_root"
npx prettier --write "$file_path" >/dev/null 2>&1 || {
  echo "format.sh: prettier could not format $file_path (skipped)." >&2
  exit 0
}

exit 0
