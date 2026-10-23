# Ralph — one story per iteration

A loop for unattended runs: each iteration takes **exactly one** story from `prd.json`, does it,
verifies, commits, and stops. Never two stories in one iteration.

Run: `./ralph/ralph.sh [MAX_ITER]` (default 5 iterations).

## `prd.json`

An **array** of stories.

```json
[
  {
    "id": "auth-overview-page",
    "category": "auth",
    "description": "Build the /overview landing page shown after login",
    "why": "Paths.index points at /overview but no page exists, so login lands on a 404",
    "steps": ["...", "..."],
    "passes": false,
    "touches": ["src/app/[locale]/overview/"],
    "notes": "..."
  }
]
```

| Field         | Required | Meaning                                                                                                                                                       |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | yes      | kebab-case; used in the commit message and in `ralph.sh` log lines                                                                                            |
| `category`    | yes      | area of the app (`auth`, `i18n`, `ui`…), or `infra` / `docs` for work outside a feature                                                                       |
| `description` | yes      | one line                                                                                                                                                      |
| `why`         | no       | why it is needed; cite the rule or the known problem it addresses                                                                                             |
| `steps`       | yes      | the work, written so each item is **checkable**. If current behaviour is suspect, say so explicitly ("currently returns 404") so it is clear what must change |
| `passes`      | yes      | **boolean.** `false` = not done, `true` = done and verified. This is the only field that says which stories are finished                                      |
| `touches`     | yes      | paths this story may change. Anything outside is out of scope ⇒ set `blocked`                                                                                 |
| `notes`       | no       | constraints: existing patterns to reuse, work that must **not** be folded in, prerequisites, and anything the user must do by hand afterwards                 |
| `blocked`     | no       | why the story is stuck. **A story with this field is skipped**, not retried. Remove the field once it is resolved                                             |

There is no "in progress" state. If an iteration is interrupted, `git status` is what tells you
which files are half-done — see step 0.

**Read `notes` before writing code.** It is where things like "this story needs a running backend"
or "this is a breaking change, confirm first" are recorded.

## One iteration

0. **`git status` before doing anything.** There is no "in progress" state in `prd.json`, so if the
   previous iteration was interrupted the working tree is the only trace. Uncommitted changes that
   are not yours ⇒ **stop** and tell the user; do not mix them into a new story.
1. **Read `prd.json`**, take the first story with `passes: false` **and no `blocked` field**.
   No story left ⇒ stop and report "no pending stories".
2. **Read the context before writing**: `CLAUDE.md`, and the conventions in `.claude/rules/`
   (naming, comments, react, typescript, shadcn-ui). The `coding-convention` skill routes to the
   right rule file for the work at hand.
3. **Do the story**, changing only what is listed in `touches`. If something outside that scope has
   to change ⇒ add `"blocked": "<reason>"` to the story, commit, stop. Do not widen the scope.
4. **Verify** (`ralph.sh` runs these; all three BLOCK):
   - `npx tsc --noEmit` — the real typecheck; the project has no `typecheck` script.
   - `npx eslint src` — covers `.ts` and `.tsx`.
   - `pnpm build` — catches prerender and `cacheComponents` errors that tsc cannot see. This
     project has broken that way before, so the build step is not optional.

   Fail ⇒ fix and verify again, at most 3 attempts; still failing ⇒ add `"blocked": "<reason>"`
   and stop.

5. **Verify the UI with Playwright MCP** for any story that changes something a user can see or do.
   Start the dev server, open the page, drive the actual interaction, and check the result. "It
   compiles" is not evidence that a feature works — the auth work on this repo had three real bugs
   that only a browser run exposed.
6. **Append to `agent-progress.txt`**: one entry — date, `id`, what changed, how it was verified.
   This is what survives losing context between iterations.
7. **Set `passes` to `true`** and commit with a message citing the story `id`. Only set `true` when
   **every** item in `steps` is actually done — `passes` is the one thing the user reads to know
   what is fixed, so **setting it wrongly is lying**.
8. **Stop.** Do not move on to the next story in the same iteration; `ralph.sh` decides whether
   there is another one.

## What Ralph must not do

- Do not touch the protected paths: `.env`, `pnpm-lock.yaml`, `.next/`, `node_modules/`,
  `.agents/`. The `.claude/hooks/protect-files.sh` hook blocks them, but do not test it.
- Do not edit `eslint.config.mjs` or `next.config.ts` without the user — both are `ask` in
  `.claude/settings.json`. Needing a change there ⇒ set `blocked`.
- Do not add dependencies on your own; `pnpm add` is `ask`.
- Do not `git push` and do not open a PR unless the story says so.

## Monitoring

```bash
cat agent-progress.txt                                  # what has been done
node -e 'console.log(require("./prd.json").filter(s=>!s.passes&&!s.blocked).length)'   # stories left
node -e 'require("./prd.json").filter(s=>s.blocked).forEach(s=>console.log(s.id,"—",s.blocked))'
git log --oneline
```

A story with `blocked` is a **normal state**, not a failure — it means that story needs a human
decision. `ralph.sh` prints the list every run.
