# Four audit findings fixed: approval action_key coupling, turn-claim race, reaper race, runtime-backend admission

Date: 2026-07-10 10:37
Status: source-wired, local proof only
Scope: targeted fixes from a deep skeptical audit of Phase 2/3/4 against `architecture-and-security-review-2026-07.md`, run against the checkpoint commit `fd2437a` (which itself checkpointed the prior session's Phase 3/4/trust-boundary work)

## What changed

A prior review session in this conversation independently verified the pre-tenant trust-boundary hardening pass (A1/B2/A3 from `architecture-and-security-review-2026-07.md`) and found it largely solid, but surfaced four concrete, previously-unflagged gaps. All four are now fixed:

1. **Approval `action_key` gating centralized.** New `packages/shared/src/approval-policy.ts` (mirrors the `TOOL_NAMES` single-source-of-truth pattern) derives `OWNER_AUTH_REQUIRED_APPROVAL_ACTION_KEYS` from `SEND_GATE_ACTION_KEY_GROUPS`, so a send-gate action_key can never be missing from the owner-auth-required set by construction. Previously `estimate.stub.ts`, `gmail.stub.ts`, `stripe.stub.ts`, and `employee-events.ts` each hand-maintained their own literal Sets/strings, which happened to line up but had no invariant enforcing it — the next new send-like tool could have silently reopened the B2 self-resolution bypass. `tests/unit/approval-policy.test.ts` (new) asserts the invariant directly; `estimate-tools.test.ts` gained self-resolution-denial tests for `send_email`/`send_deposit_invoice`/`send_invoice` (previously only `send_estimate_email` was tested); `event-bus.test.ts` gained tests proving `bindApprovalIfNeeded` binds the shared constants for `outbound_message`/`schedule_mutation` descriptors.
2. **Turn-claim lock-insert race fixed.** Migration `0024_turn_claim_lock_race_fix.sql`: `claim_employee_turn_job[_for_employee]`'s `INSERT INTO employee_turn_locks` now uses `ON CONFLICT (employee_id) DO NOTHING RETURNING employee_id`, checked before proceeding — previously an unguarded insert would raise an uncaught 23505 when two turns queued for the same employee were claimed concurrently (a real window: `deliverOwnerTurnToRuntime` is called both synchronously from `POST /manager/employee/:id/message` and fire-and-forget from the Twilio SMS webhook). `CREATE OR REPLACE FUNCTION` with an unchanged signature preserves the `service_role`-only grants from migrations 0020/0021 (verified against the Postgres docs). New `tests/integration/turn-claim-race.integration.test.ts` (env-gated, launches two claims via `Promise.all` against real Postgres — the existing `turn-claim.integration.test.ts` awaits its two calls sequentially and never opened this race).
3. **Reaper lost-update race fixed.** `reapStuckTurns` (`turn-drain.ts`) now guards both its requeue and fail `UPDATE`s with `.eq("lease_token", job.lease_token).eq("status", "running")` (mirroring `complete_employee_turn_job`'s already-correct compare-and-swap) and checks the returned row count — previously an unconditioned `.eq("id", job.id)`-only update could clobber a turn that legitimately completed right as its lease crossed the reap threshold, duplicating a customer-facing send. New unit test in `turn-drain.test.ts` hooks the fake DB's `employee_turn_locks.delete` call (which runs between the reaper's read and its write) to simulate a concurrent legitimate completion and asserts the reaper's guarded update matches zero rows and doesn't clobber it.
4. **Runtime-backend production admission guard added.** New `isLocalRuntimeBackendAllowed()` in `runtime-backend.ts` (default-deny; requires `ALLOW_LOCAL_RUNTIME_BACKEND=1`/`"true"`; hard-vetoed when `NODE_ENV=production` regardless of the flag — matches the established double-gate convention already used by `denyInternal`/`PROVISIONER_SKIP_SMS`/`SMS_INSECURE_NO_SIGNATURE`). `provision_employee` now calls it right after resolving the backend and returns a `failed("unauthorized", ...)` envelope + audit row (not a bare throw, to preserve this handler's audit trail — deliberately different from the plan's first draft). Previously `isProductionRuntimeBackend()` existed but was only consumed for health-scoring, never as an admission check — a misconfigured `HERMES_BACKEND_TYPE=local` in production would have provisioned a real tenant with zero container isolation.

## Why

The user asked for a rigorous "did we actually do a good job or are we kidding ourselves" audit of the recent Phase 2/3/4 work, followed by fixing whatever was found. The audit reused the repo's own existing `architecture-and-security-review-2026-07.md` as a baseline (confirming its A1/B2/A3 fixes hold) rather than re-deriving it, then went deeper with direct code verification into areas that review didn't cover in depth (the approval action_key coupling, and genuine Postgres-level concurrency races in the turn-claim/reaper machinery).

## Current status

`source-wired`, local proof only. No live provider/runtime/DB proof claimed. Migration `0024` has **not** been applied to any live Supabase — it must be applied and then the new integration test run against real Supabase creds to prove the claim-race fix; this session's proof for Fix 2 is source review + a passing (skipped, env-gated) test file, not a live run.

## Files / seams touched

- New: `packages/shared/src/approval-policy.ts`, `packages/db/migrations/0024_turn_claim_lock_race_fix.sql`, `tests/unit/approval-policy.test.ts`, `tests/integration/turn-claim-race.integration.test.ts`, `tests/unit/provisioning-runtime-backend.test.ts`.
- Modified: `packages/shared/src/index.ts`, `apps/manager/src/tools/{estimate,gmail,stripe,events,provisioning}.stub.ts`, `apps/manager/src/lib/{employee-events,turn-drain,runtime-backend}.ts`, `tests/unit/{estimate-tools,event-bus,turn-drain,runtime-backend}.test.ts`.
- Docs: `mvp-build/CODEGRAPH.md` (new "Audit-fix pass" status bullet; migration `0023`/`0024` rows added to the migrations table — `0023` was previously undocumented as a table row; `approval-policy.ts` added to the shared contracts table; `runtime-backend.ts`/`turn-drain.ts` one-liners updated; stale "38 files / 216 tests" local-truth line corrected to current counts) and root `CODEGRAPH.md` (the `mvp-build/` node's summary paragraph now mentions the scoped-MCP-credential hardening and this audit-fix pass).

## Carry-forward / next

1. Apply migration `0024` to live Supabase; run the new integration test with real creds to prove the claim-race fix under genuine Postgres concurrency.
2. The prior session's `2026-07-10-1022-next-session-ui-phase5-phase6-planning-prompt.md` handoff is still the live forward-planning prompt for a deep UI/materialization review, closing remaining Phase 4 production loose ends, a full production Phase 5 implementation, and Phase 6 groundwork — this session did not attempt that; it was scoped narrowly to the four audit findings.
3. A2/C3 (egress control) and A3's remaining items (`--read-only` rootfs, seccomp, gVisor/Firecracker) from the architecture review remain open — this session did not touch them.
4. Old rendered employee profiles still need reprovisioning to pick up the scoped MCP credential (carried forward from the prior session's handoff, unchanged by this session).

## Verification

- `npm run build --workspace=@amtech/shared && npm run build --workspace=@amtech/db` — required in this fresh worktree (both packages' `dist/` are gitignored and were missing).
- `npm run typecheck` — passed (all four workspaces).
- `npm run test:unit` — passed, **67 files / 400 tests** (up from 65 files / 383 tests baseline; +17 new tests across the four fixes).
- `npm run build` — passed (all workspaces, including `apps/web` Next.js build).
- `npm run lint` — passed, no errors.
- `npm run test:integration` — ran; **6 files / 11 tests skipped** cleanly (up from 10 skipped baseline; the new `turn-claim-race.integration.test.ts` registers and skips correctly without live Supabase creds). No live DB/Hermes/provider proof claimed.
