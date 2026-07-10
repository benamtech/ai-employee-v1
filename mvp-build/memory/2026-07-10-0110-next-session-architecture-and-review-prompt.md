# Next-session architecture and review handoff prompt

Date: 2026-07-10 01:10
Status: active handoff prompt
Scope: next session for architectural review, code review, and follow-on hardening

Use this prompt to start the next session.

```text
You are Codex working in `/home/georgej/AMTECH/GTM-RESEARCH`.

Goal: perform architectural work and code reviews across the AMTECH AI Employee MVP, with special attention to the newly source-wired Phase 4 capability/materialization layer and any accumulated security, correctness, or product-architecture risks. Do not assume the task is to build a new product phase unless the user asks; start from review/orientation, then implement narrow fixes only when the findings are concrete and safely scoped.

Session initiation protocol:

1. Read `identity.md`.
2. Read root `CODEGRAPH.md`.
3. Read `mvp-build/CODEGRAPH.md`.
4. Read `mvp-build/CLAUDE.md` and `mvp-build/AGENTS.md`.
5. Read `mvp-build/memory/MEMORY.md`.
6. Read the latest memory handoff for context: `mvp-build/memory/2026-07-10-0045-phase-4-source-wired-materialization.md`.
7. Skim the newest adjacent handoffs if needed:
   - `mvp-build/memory/2026-07-10-0012-phase-4-hardening-closure-and-next-session.md`
   - `mvp-build/memory/2026-07-09-2210-mvp-hardening-review-fixes-and-rls-closure.md`
   - `mvp-build/memory/2026-07-09-1815-phase-03-sms-signed-previews-and-live-gate.md`
8. Inspect the dirty tree with `git status --short`. Treat existing dirty work as user/previous-agent work. Do not revert it.
9. Use `rg`/targeted file reads first. Avoid broad rewrites and unrelated refactors.

Important current context:

- Phase 4 is `source-wired` only, not provider-accepted or runtime-accepted.
- The most recent handoff is `mvp-build/memory/2026-07-10-0045-phase-4-source-wired-materialization.md`; it is the authoritative context for the current Phase 4 source state.
- Recent Phase 4 source added:
  - `packages/shared/src/materialization.ts`
  - `apps/manager/src/lib/capability-registry.ts`
  - `apps/manager/src/lib/materialization.ts`
  - Manager MCP `resources/list` and `resources/read`
  - `/manager/materialization/diagnostics`
  - migration `packages/db/migrations/0022_phase4_materialization.sql`
  - tuple `(created_at,id)` SSE cursors
  - serialized SSE writes
  - atomic signed-link counter RPCs
  - secret-reference direct-read tightening
  - over-budget turn-drain fail/notify
  - real-MCP-result proof classification
- Local proof from the latest handoff: `npm run typecheck`, `npm run test:unit` (61 files / 373 tests), `npm run lint`, `npm run build`, and `npm run ui:test` passed. `npm run test:integration` ran but all 10 tests were env-skipped.
- No live Hermes/provider/DB proof is claimed for Phase 4. Live migration/advisor proof for `0022` is still pending.
- The real live gate remains: a model/provider path that executes Hermes/MCP tool calls, not tool-call JSON emitted as plain text.

Recommended review focus:

1. Phase 4 architecture boundaries
   - Does `SurfaceEnvelope`/`WorkResource`/`WorkAction` cleanly separate source facts, proof, safety, and rendering?
   - Are native cards still required for outbound messages, money movement, connector/credential changes, and destructive/external actions?
   - Do generic renderers preserve approval gates instead of relaxing them?
   - Does the capability registry avoid overclaiming live Hermes/tool availability?

2. Security/RLS/secrets
   - Review migration `0022_phase4_materialization.sql`.
   - Confirm `SECURITY DEFINER` RPCs are not callable by `anon` or `authenticated`.
   - Confirm owner/browser-safe reads never expose sealed secret refs, provider payloads, tokens, raw stack traces, or service internals.
   - If touching Supabase/RLS, use the Supabase skill instructions first and verify with local/static tests or live advisors if credentials/env are available.

3. Manager MCP resources
   - Confirm `resources/read` requires bound identity and cannot be used to spoof `account_id`/`employee_id`.
   - Confirm returned resources are owner-safe and redacted.
   - Confirm resources do not duplicate write/action semantics that belong in tools or approval gates.

4. Event stream and SSE
   - Review tuple cursor behavior for same-millisecond rows and reconnects.
   - Review serialized SSE progress writes and failure behavior.
   - Watch for hidden duplicate/loss cases between snapshot cursor, approval deltas, inbound events, and progress-only frames.

5. Turn queue/drain
   - Review claim/release/reap/drain invariants.
   - Confirm over-budget queued owner turns fail visibly and notify once.
   - Confirm event-wake turns never drain without lost context.

6. Diagnostics/admin groundwork
   - Review `/manager/materialization/diagnostics`.
   - It should expose proof ids and repair hints, not secrets/raw provider payloads.
   - Keep Phase 5 admin UI/billing/platform-role work out of scope unless explicitly requested.

7. Generated shared dist caveat
   - Root typecheck consumes `@amtech/shared` through `packages/shared/dist`.
   - `dist/` is gitignored, so source is authoritative, but local verification may require `npm run build --workspace @amtech/shared` or full `npm run build` before manager typecheck in a fresh workspace.

Review output protocol:

- If the user asks for review, use code-review stance: findings first, ordered by severity, with file/line references.
- Prefer concrete bugs, security risks, behavioral regressions, missing tests, and architectural boundary problems.
- If there are no findings, say so and name residual risk/test gaps.
- Do not bury findings under summaries.
- If a finding is actionable and safely scoped, implement the fix after confirming the review scope unless the user explicitly asked for review-only.

Implementation rules:

- Preserve existing dirty-tree work unless explicitly told to revert.
- Keep changes tightly scoped.
- Add or adjust tests for every nontrivial behavior change.
- Do not claim live provider/runtime acceptance without real proof ids.
- Owner-facing surfaces must not mention MCP/API/toolset/raw JSON/stack traces.
- Manager/admin diagnostics may expose technical proof ids, but never secrets or raw provider payloads.

Baseline commands from `mvp-build/` when changing source:

- `npm run typecheck`
- `npm run test:unit`
- `npm run lint`
- `npm run build`
- `npm run ui:test` if web surface/rendering changed
- `npm run test:integration` if env allows; env-gated skips are acceptable but must be reported honestly

If substantial architecture decisions or fixes are made:

- Add a dated handoff under `mvp-build/memory/`.
- Update `mvp-build/memory/MEMORY.md`.
- Update `mvp-build/CODEGRAPH.md` and root `CODEGRAPH.md` only if source layout/status/orientation changed materially.
```
