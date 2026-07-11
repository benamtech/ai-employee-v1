# Branch consolidation → single `main` line + wiki explorer redesign merged

Date: 2026-07-11 ~11:20 EDT
Status: git-hygiene + one wiki-doc merge; no MVP source changed; no live gates upgraded
Scope: made `main` the single furthest-ahead line, archived + closed every other branch
(local AND on `origin`), merged the 98.css wiki-explorer redesign, and made an architectural
call to NOT ship hardcoded owner-facing work-verb strings.

## Why this session happened

Founder ask: make `main` the "furthest ahead in a real and meaningful way," then close/"wrap up"
all other branches so the branch list stops causing confusion, with new features going on fresh
branches off `main` before merge. Validate before destroying anything.

## State found

Single repo (root `.git`, remote `benamtech/ai-employee-v1`; `mvp-build/` is a subdir, **not** a
separate repo — the older "local-only mvp-build repo" note is stale). Seven branches + two worktrees:

- `main` — already the furthest-ahead line; identical to `phase5-deep-review-phase6-groundwork`
  and a superset of the three `worktree-*` merged branches (fix-audit-findings, live-onboard-harness,
  mcp-server-toolsets-descriptor were all ahead-of-main **0**).
- `codex/first-live-test-note` — +3 commits, −32 behind.
- `worktree-hermes-alignment-corrections` — +6 commits, −33 behind.

The two divergent branches were **early exploratory work dated 07-03/04/05** (first Hermes API
alignment, local Docker harness, OpenRouter routing, first-gen connector actions). `main`'s memory
trail already runs through 07-11 and already contains the `2026-07-05` materialization handoff those
branches introduced, then took a **later tool-agnostic connector-center path** over 32+ newer commits.
Verdict: merging either into `main` would **regress** it, not advance it.

## What I did

1. **Preserved everything, then closed it.** Archive tags (recoverable forever, no branch clutter):
   - `archive/codex-first-live-test-note` → dd526ac
   - `archive/hermes-alignment-corrections` → 5edd108
   - `archive/live-onboard-harness-wip` → 8a1d15d (the live-onboard worktree's uncommitted WIP,
     committed so it wouldn't be lost on worktree removal)
   Then removed both worktrees and deleted all non-`main` local branches. **Result: `main` is the
   only branch.** Tags pushed to `origin`; the six matching `origin` branches deleted.

2. **Merged the wiki explorer redesign.** `index.html` was swapped from the bespoke Inter/IBM-Plex
   branded Explorer to a **98.css retro theme** (uncommitted working-tree change). First evaluated
   against the "does it move the MVP forward" gate and set aside (it's the GTM *wiki* explorer, not
   MVP code); founder confirmed it **improves the wiki**, so it was merged to `main` (fast-forward,
   `index.html` only). Verified the FILES manifest (98 `.md` entries) and explorer wiring
   (`fetch`, `renderFileIntel`, knowledge-graph SVG) survived the −863/+272 rewrite.

3. **Rejected the "approval work-verb" slice — architectural call.** The onboard-harness WIP held a
   genuinely-forward-looking slice (Hermes Runs SSE `approval.request` → surface "Waiting for
   approval"; run-event type constants; expanded `supportsRunEvents` descriptors; a headed
   `demo-browser.mjs`). I staged it on `feat/hermes-approval-event-surfacing`, but the founder called
   it correctly: **hardcoding tool→owner-verb strings for frontier models is tech debt.** It extends
   the questionable `work-verbs.ts` `VERB_BY_TOOL` allowlist, and **approval is already first-class**
   on `main` (the approval gate + `ApprovalCard.tsx` + approval records render from real state), so
   piping it through a fuzzy progress-verb channel is redundant. Aligns with the standing
   "let the agent/model breathe" principle. Branch abandoned; nothing merged. The bits live in
   `archive/live-onboard-harness-wip` if the SSE-descriptor alignment or `demo-browser.mjs` are ever
   wanted (both were verified non-stale against `main`).

   **Open thread for a future pass:** the *existing* `VERB_BY_TOOL` allowlist on `main` is itself the
   pattern the founder is questioning. Worth a dedicated **model-native narration** redesign (let the
   employee describe its own work, keep only the security guarantee that raw tool names/args never
   reach the owner) rather than growing the table.

## Pre-existing issue found (not mine)

`tests/unit/gmail-pubsub.test.ts` → "acks handler failures with 204 and records an audit failure"
**fails with a 5s timeout**, reproduced on clean untouched `main` in isolation (8 pass / 1 timeout).
Not introduced this session. Likely an async fake that never resolves under vitest's default 5s
`testTimeout`. Worth a targeted fix — the CLAUDE.md "all unit tests green" claim is currently untrue
for a full run.

## Going forward

`main` is the only branch and the single source of truth. Branch off `main` per feature; merge back;
delete. Everything closed this session is recoverable from `archive/*` tags on `origin`.
