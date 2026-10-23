#!/usr/bin/env bash
# PreToolUse hook (Edit|Write): block paths that must never be hand-edited.
#
# Reads the hook JSON on stdin, takes tool_input.file_path and matches it against the
# list below. A match prints a "deny" decision with the reason AND the correct way to
# do it, then exits 0. No match exits 0 silently and lets Claude Code decide from the
# permissions in settings.json.
#
# This list must stay in sync with permissions.deny in .claude/settings.json.

set -euo pipefail

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" ]]; then
  exit 0
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

# Normalise to a repo-relative path so the patterns below match either form.
rel="$file_path"
if [[ "$file_path" == /* ]]; then
  rel="${file_path#"$repo_root"/}"
fi

deny() {
  jq -nc --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

case "$rel" in
  .env)
    deny "$rel holds real secrets. To add a variable, declare it in the Zod schema in src/config.ts and ask the user to fill in .env themselves — the app throws at module load if a variable is missing from the schema." ;;
  pnpm-lock.yaml)
    deny "$rel is only ever changed by pnpm. Run 'pnpm add' / 'pnpm remove' instead of editing it." ;;
  .next/*)
    deny "$rel is build output, not source. Change the source under src/ and rebuild." ;;
  node_modules/*)
    deny "$rel is a dependency, not source." ;;
  .agents/*)
    deny "$rel is the skills store managed by the 'skills' CLI. Use 'npx skills add/remove/update' instead of editing it; hand edits are overwritten on the next sync." ;;
esac

exit 0
