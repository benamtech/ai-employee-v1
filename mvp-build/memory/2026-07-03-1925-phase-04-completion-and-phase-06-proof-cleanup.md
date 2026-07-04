# Handoff — Phase 4 Completion Fixes + Phase 6 Proof Cleanup

Date: 2026-07-03 19:25
Status: source-wired; live runtime/provider proof pending
Scope: Resolve review findings after Phase 4 hardening / Phase 6 foundation before Phase 5 production implementation.

## What changed

- `events/ingress.ts` now finishes the `work_run` it starts. Provider/manager external ingress owns that run, so it marks it `succeeded` after normal/duplicate/persisted delivery, `failed` when delivery routes to repair, and `failed` on throw.
- `lib/employee-events.ts` now also finishes direct-owned runs on duplicate, suppression, repair, and normal delivery paths, so trusted Manager-authored deliveries cannot leave `work_runs` stuck in `started`.
- `lib/turn-drain.ts` now persists drained owner-turn replies as `to_owner` `employee_messages`, passes `message_id` to the router, and preserves the queued turn's `run_id` into `delivery_decisions`.
- `packages/db/migrations/0014_phase4_turn_claim_run_id.sql` recreates the two turn-claim RPCs so real Postgres claims return `run_id`; the fake RPC and env-gated turn-claim integration proof were updated to match.
- Phase 6 status drift was corrected: the phase doc top-line now says `source-wired`, and the RLS integration proof now covers all six 0013 metering ledgers in addition to 0011/0012 control-plane tables.
- `CODEGRAPH.md` now lists migration `0014`.

## Why

The review found two real runtime defects and one proof/doc gap:

- ingress-created and direct-owned `work_runs` could stay `started` forever, poisoning later rollups;
- drained queued owner replies could be marked delivered without a Work Surface message row;
- Phase 6 was source-wired but one status line and the env-gated RLS proof had not caught up.

## Current status

- Phase 4 source-side completion: `source-wired` and locally green. Live Hermes runtime acceptance remains `pending`.
- Phase 6 foundation: `source-wired`; RLS proof is now authored but still env-gated until Supabase creds exist.
- Phase 5 remains `planned` and should be treated as unimplemented.

## Files / seams touched

- `apps/manager/src/events/ingress.ts`
- `apps/manager/src/lib/turn-drain.ts`
- `tests/unit/run-id-chain.test.ts`
- `tests/unit/turn-drain.test.ts`
- `tests/unit/_helpers/fake-supabase.ts`
- `tests/integration/turn-claim.integration.test.ts`
- `tests/integration/new-tables-rls.integration.test.ts`
- `packages/db/migrations/0014_phase4_turn_claim_run_id.sql`
- `../wiki/MVP/build-plan-current/phases/phase-06-metering-foundation.md`
- `CODEGRAPH.md`

## Carry-forward / next

- Phase 5 can now build on stable descriptor/router/`run_id` seams.
- Live acceptance remains the hard gate for phases 1/2/4: capture real Hermes, Twilio, Gmail/PubSub, Stripe, Docker/job proof ids when credentials/host land.
- Run `npm run db:migrate` before live Supabase proof so 0014 is applied.

## Verification

- `npm run test:unit -- tests/unit/run-id-chain.test.ts tests/unit/turn-drain.test.ts tests/unit/turn-queue.test.ts tests/unit/ingress.test.ts tests/unit/metering.test.ts` — pass, 27 tests.
- `npm run typecheck` — pass.
- `npm run test:unit` — pass, 38 files / 216 tests.
- `npm run test:integration` — pass with 4 files / 9 tests skipped cleanly without creds.
- `npm run lint` — pass.
- `npm run build` — pass.
