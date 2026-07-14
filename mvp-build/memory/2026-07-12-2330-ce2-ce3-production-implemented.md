# CE-2 + CE-3 production implementation + CE-1 loose ends (source-wired; migrations applied live)

Date: 2026-07-12 23:30
Status: `source-wired`; migrations `0029`/`0030` applied + verified on the live Supabase; live Hermes
hook/compression/rotation behavior + live employee reprovision `pending`.
Branch: `worktree-ce2-ce3-production` (worktree). Spec:
[`second-half-plan/context-engineering/phase-ce-02-03-production-implementation-plan.md`](../second-half-plan/context-engineering/phase-ce-02-03-production-implementation-plan.md).

## What shipped

Implemented CE-2 + CE-3 (+ CE-1 loose ends) per the production plan. Continues
[[2026-07-12-2219-ce1-profile-context-native-memory-source-wired]].

**CE-1 loose ends (audit found three real gaps):**
- `claimAgentContextPrimer` returned `!error` → an unapplied `0029` made the employee **never prime,
  silently reported as already-primed**. Now tri-state: `primed` / `already_primed` (23505) /
  `claim_failed`. `/manager/agent-context` primes anyway on `claim_failed` (fail-open) and surfaces it in
  `proof`.
- Renamed the primer gate column `session_key` → **`transcript_session_id`** (code + migration `0029`;
  unlaunched, no back-compat). The gate keys on the rotating Hermes **transcript** id, distinct from the
  stable `X-Hermes-Session-Key` memory scope — so CE-3 rotation re-primes. Dropped the
  `X-Hermes-Session-Key` fallback from the endpoint's transcript-id resolution.

**CE-2:** `{{COMPRESSION_CONFIG}}` (Hermes-default safety net, model-agnostic; CE-3 rotates first),
`{{DELEGATION_CONFIG}}` (`delegate_task` — in-turn context isolation, exposed by the `delegation:` block,
NOT a `platform_toolsets` name), and tokenized `{{HOOKS}}` — all rendered by `profile-renderer.ts`. New
`packages/shared/src/model-context.ts` is the ONLY place model metadata enters CE (context-window
capability input, never a behavior branch). Tool-output hygiene is a **Python Hermes plugin**
`packages/agent-template/plugins/amtech-hygiene` (`transform_tool_result`/`transform_terminal_output` are
plugin-only — NousResearch PRs #12972/#12929): secret redaction always-on + last-resort size-trim of
pathological bulk only; `deployPlugins` installs it to `$HERMES_HOME/plugins`. `routeForEventType`
(`event-types.ts`) is a data-driven routing table replacing inline `classifyRoute`.

**CE-3:** migration `0030_employee_sessions` + `lib/session-rotation.ts`. Split into **pre-turn**
`rotateSessionIfNeeded` (rotate before the turn so it runs fresh + re-primes) and **post-turn**
`recordSessionOccupancy` (tolerant `usage` parser), both under the turn lock at `runtime.ts`/`wake.ts`/
`turn-drain.ts`. Rotation mints a fresh `transcript_session_id`, preserves `memory_session_key`, repoints
`runtime_endpoints.api_session_id`, sets `pending_carryover`; the next primer carries a handoff via
`buildAgentContext` + `deriveNextAction`. Kill-switch `AMTECH_SESSION_ROTATION_DISABLED`.

## Two founder corrections during the build (both applied)

1. **Rotation timing: pre-turn, not post-turn.** Recording occupancy is post-turn (only known after the
   turn); the rotation *decision/action* is pre-turn (the post-previous-session boundary) so the turn that
   trips it runs on the fresh transcript and re-primes coherently. This is why `session-rotation.ts` has
   two functions, not one.
2. **Do not nerf the Hermes runtime.** The hygiene plugin was initially too aggressive (6k-char trim would
   strip legitimate `read_file`/query results the agent asked for). Reframed: secret redaction is precise
   and always-on; size-trimming is a rare last resort at 40k tool / 50k terminal (≈ Hermes' own
   truncation) with generous head/tail. Normal results pass through untouched. Doctrine written into the
   plugin header.

## Proof

- Local: `typecheck`, **87 unit files / 543 tests**, `npm run plugins:test` 10/10, `build`, `lint` all
  green; integration skips clean.
- Live DB: `0029` (renamed) + `0030` applied to live Supabase; verified `transcript_session_id` column,
  `employee_sessions` columns, RLS enabled on both, zero anon/authenticated grants.

## Carry-forward / still `pending`

1. **Reprovision existing employees** (needs the running Docker/Hermes stack) so they pick up the
   compression/delegation/hooks blocks + the hygiene plugin: `npm run live:reprovision` /
   `ops:reprovision-scoped-mcp`. Old rendered profiles predate all of CE-2.
2. **Live Hermes proof** (needs a real v0.18.x instance): plugin actually rewrites tool results; primer
   fires once per transcript and re-fires on rotation; preserving `X-Hermes-Session-Key` while `session_id`
   changes preserves memory scope; compression honored + rotation trips first; `delegate_task` returns a
   bounded child summary; confirm the exact `usage` prompt-token field name (parser is already tolerant).
3. **Plugin enable mechanism**: the plugin auto-deploys to `$HERMES_HOME/plugins`; confirm whether Hermes
   auto-enables discovered plugins or needs `hermes plugins enable amtech-hygiene` / a config list (check
   the "Build a Hermes Plugin" guide against the running instance).
4. CE-4 (connector-agnostic + operator modes) remains `planned`.

## Verification commands

`npm run typecheck && npm run test:unit && npm run build && npm run lint && npm run plugins:test`
