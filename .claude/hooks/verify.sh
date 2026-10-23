#!/usr/bin/env bash
# Stop hook: run the project's verification once, at the end of a turn.
#
# Why Stop and not PostToolUse: 'pnpm build' takes 10-20 seconds. Running it after every
# Edit is unusable. Stop runs exactly once when Claude finishes a turn.
#
# All three steps BLOCK, ordered cheapest first so a type error fails in seconds rather
# than after a full build. Measured on this repo 2026-10-23: tsc clean, eslint 0 errors,
# build passes with 8 static pages.
#
#   npx tsc --noEmit   -> the real typecheck; the project has no 'typecheck' script
#   npx eslint src     -> covers .ts AND .tsx; 'pnpm lint' runs bare eslint with no path,
#                         so pass src explicitly to be sure of the scope
#   pnpm build         -> catches what tsc cannot: prerender and cacheComponents errors,
#                         which have broken this project before
#
# If one of these starts failing for reasons outside this repo's control, downgrade that
# one block to a warning and WRITE DOWN WHY. Do not downgrade all three.

set -uo pipefail

input=$(cat)

# Guard against an infinite loop: if this turn was itself triggered by the Stop hook, leave.
stop_hook_active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false')

if [[ "$stop_hook_active" == "true" ]]; then
  exit 0
fi

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$repo_root"

fail() {
  echo "$1" >&2
  exit 2
}

tsc_output=$(npx tsc --noEmit 2>&1) || fail "verify.sh: 'npx tsc --noEmit' failed. Fix the type errors before ending the turn.

$tsc_output"

echo "verify.sh: typecheck OK."

lint_output=$(npx eslint src 2>&1) || fail "verify.sh: eslint reported errors. Fix them before ending the turn.

$lint_output"

echo "verify.sh: lint OK."

build_output=$(pnpm build 2>&1) || fail "verify.sh: 'pnpm build' failed. This catches prerender and cacheComponents problems that tsc cannot see.

$build_output"

echo "verify.sh: build OK."

exit 0
