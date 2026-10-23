#!/usr/bin/env bash
# Ralph: one story per iteration, up to MAX_ITER iterations.
#
#   ./ralph/ralph.sh        # 5 iterations
#   ./ralph/ralph.sh 2      # 2 iterations
#
# The story is taken from prd.json: the first one with `passes: false` and NO `blocked` field.
# Stories with `blocked` are skipped — otherwise every iteration would retry the same one until
# the cap runs out.
#
# Each iteration calls `claude -p` with ralph/RALPH.md as the instructions, then verifies. All
# three verification steps BLOCK, ordered cheapest first. Measured on this repo 2026-10-23: tsc
# clean, eslint 0 errors, build passes in ~10s total.
#
#   npx tsc --noEmit   -> BLOCKS (this is the typecheck; the project has no `typecheck` script)
#   npx eslint src     -> BLOCKS (covers .ts and .tsx)
#   pnpm build         -> BLOCKS (catches prerender / cacheComponents errors tsc cannot see)
#
# Plus one gate of its own: prd.json must keep its shape.

set -uo pipefail

MAX_ITER="${1:-5}"
repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$repo_root"

if [[ ! -f prd.json ]]; then
  echo "ralph: no prd.json in $repo_root" >&2
  exit 1
fi

# Check the shape of prd.json BEFORE doing anything. Bad shape ⇒ stop cleanly, never call claude.
validate_prd() {
  node -e '
    const s = require("./prd.json");

    if (!Array.isArray(s)) {
      console.error("prd.json must be an array");
      process.exit(1);
    }

    const required = ["id", "category", "description", "steps", "touches"];
    const ids = new Set();
    let bad = 0;

    s.forEach((x, i) => {
      if (!x || typeof x !== "object" || Array.isArray(x)) {
        console.error(`story #${i}: not an object`);
        bad++;
        return;
      }

      const label = x.id || "no id";
      const missing = required.filter((k) => !(k in x));

      if (missing.length) {
        console.error(`story #${i} (${label}): missing field ${missing.join(", ")}`);
        bad++;
      }

      if (typeof x.passes !== "boolean") {
        console.error(`story #${i} (${label}): passes must be a boolean, got ${typeof x.passes}`);
        bad++;
      }

      if (!Array.isArray(x.steps) || !Array.isArray(x.touches)) {
        console.error(`story #${i} (${label}): steps and touches must be arrays`);
        bad++;
      }

      if (Array.isArray(x.touches) && x.touches.length === 0) {
        console.error(`story #${i} (${label}): touches is empty — no scope boundary at all`);
        bad++;
      }

      if (x.id) {
        if (ids.has(x.id)) {
          console.error(`story #${i}: duplicate id "${x.id}"`);
          bad++;
        }
        ids.add(x.id);
      }

      if ("blocked" in x && typeof x.blocked !== "string") {
        console.error(`story #${i} (${label}): blocked must be a string (the reason), got ${typeof x.blocked}`);
        bad++;
      }
    });

    if (bad) process.exit(1);
  '
}

pending_count() {
  node -e 'console.log(require("./prd.json").filter((x) => x && x.passes === false && !x.blocked).length)'
}

blocked_count() {
  node -e 'console.log(require("./prd.json").filter((x) => x && x.blocked).length)'
}

next_story() {
  node -e '
    const t = require("./prd.json").find((x) => x && x.passes === false && !x.blocked);
    console.log(t ? t.id : "");
  '
}

report_blocked() {
  local n
  n=$(blocked_count)

  if [[ "$n" -gt 0 ]]; then
    echo "ralph: $n story/stories have \`blocked\` — ralph skips them, you need to resolve and clear the field:"
    node -e '
      require("./prd.json").filter((x) => x && x.blocked).forEach((x) => console.log(`  - ${x.id}: ${x.blocked}`));
    '
  fi
}

validate_prd || exit 1

for ((i = 1; i <= MAX_ITER; i++)); do
  remaining=$(pending_count) || exit 1

  if [[ "$remaining" -eq 0 ]]; then
    echo "ralph: no pending stories, stopping at iteration $i."
    report_blocked
    exit 0
  fi

  story=$(next_story)
  echo "══ iteration $i/$MAX_ITER — story: $story ($remaining pending) ══"

  claude -p "Read ralph/RALPH.md and do exactly ONE story from prd.json: the first with \`passes: false\` and no \`blocked\` field. Follow the procedure in RALPH.md exactly. Stop once that story is set to \`passes: true\` or \`blocked\`." \
    --permission-mode auto || {
    echo "ralph: claude exited with an error on iteration $i, stopping." >&2
    exit 1
  }

  echo "── verify iteration $i ──"

  validate_prd || {
    echo "ralph: prd.json shape was broken on iteration $i, stopping." >&2
    exit 1
  }

  if ! tsc_out=$(npx tsc --noEmit 2>&1); then
    echo "ralph: TYPECHECK FAILED on iteration $i — stopping." >&2
    echo "$tsc_out" | tail -20 >&2
    exit 2
  fi
  echo "ralph: typecheck OK"

  if ! lint_out=$(npx eslint src 2>&1); then
    echo "ralph: LINT ERROR on iteration $i — stopping." >&2
    echo "$lint_out" | tail -20 >&2
    exit 2
  fi
  echo "ralph: lint OK"

  if ! build_out=$(pnpm build 2>&1); then
    echo "ralph: BUILD FAILED on iteration $i — stopping." >&2
    echo "$build_out" | tail -20 >&2
    exit 2
  fi
  echo "ralph: build OK"

  echo "ralph: iteration $i done."
done

echo "ralph: reached the iteration cap ($MAX_ITER)."
report_blocked
exit 0
