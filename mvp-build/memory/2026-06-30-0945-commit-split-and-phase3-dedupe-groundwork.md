# Handoff — commit split + Phase 3 ingress dedupe groundwork + seam assessment

Date: 2026-06-30 09:45
Status: `source-wired`; combined tree green (26 files / 128 tests). Phase 2 source-complete (live gate pending); Phase 3 ready to spec.
Scope: clean up the mixed working tree into two commits, then lay the one piece of genuine pre-Phase-3 groundwork and map the 2/3/4/6 seam state before writing the Phase 3 implementation doc.

## What changed

1. **Commit hygiene.** Split the previously-mixed dirty tree into two commits on
   `fix/events-and-systemic-robustness`:
   - `7bf2c7e` Phase 2: runtime & scheduler productionization.
   - `4c46fe8` Harden events/reminder/entitlement mesh.
   `server.ts` straddles both (scheduler boundary + db-fault hardening) and rode with Phase 2;
   `db.ts` landed with the events commit. Neither commit is independently buildable by design — the
   combined tree is green. (See `2026-06-30-0902-...` for the events-hardening detail.)
2. **Phase 3 groundwork — race-safe `inbound_events` dedupe.** `deliverEmployeeEvent` deduped by
   `idempotency_key` with a select-then-insert; the only index was the non-unique `idx_events_idem`,
   so two at-least-once webhook deliveries could race past the select and both insert (duplicate row +
   double owner notification). Added migration `0010_phase3_inbound_event_dedupe.sql` (drops
   `idx_events_idem`, adds a **unique** index on `idempotency_key`) and a `insertDedup` helper in
   `db.ts` that turns a 23505 into a tolerated `{conflict:true}` (any other error still fails loud).
   Both `inbound_events` insert sites (suppressed + main) now short-circuit to `duplicateResult` on
   conflict — the main path returns **before** sending a second owner message. Same pattern as the
   reminder idempotency index (`0009`). New `tests/unit/db.test.ts` proves the helper's branches in
   isolation (fake-supabase doesn't enforce unique indexes).

## Why

The events mesh is the spine Phases 3–6 plug into; its dedupe invariant should live in the database,
not only in app-level pre-checks, before Phase 3 promotes ingress to the primary path. This is a
prerequisite invariant, **not** the Phase 3 work itself (that work — promoting the generic registry —
is deliberately left for the implementation doc).

## Seam assessment (2 / 3 / 4 / 6) — what's already wired vs. what each phase owns

- **Phase 2:** source-complete. `scheduler-runner` covers all four jobs (reminders / watch renewal /
  daily briefs / runtime health); wake seam + health snapshots wired. **No actionable source loose
  ends** — only the live `runtime-accepted` gate (Docker + real Hermes job ids) remains, blocked on
  creds/host.
- **Phase 3 (generic ingress):** groundwork **laid**. The seams exist — `apps/manager/src/events/registry.ts`
  (`EventSourceAdapter`: verify/normalize/dedupeKey), `inbound_events` (+ now-unique dedupe), the
  `deliver_only`/`wake_employee` routing flag, and the triage tables. The registry is currently
  **dead code off the hot path**: `webhooks/{gmail,stripe,twilio}.ts` verify+normalize themselves and
  call `deliverEmployeeEvent` directly; the gmail/stripe/twilio adapters are placeholder pass-throughs.
  **Promoting the registry to the primary ingress path is the Phase 3 build** — do it in the doc, not
  as pre-wiring.
- **Phase 4 (live wake):** seam exists and is named. `deliverEmployeeEvent`'s `wake_employee` branch
  calls `wakeEmployeeForEvent(apiUrl, …)` and enqueues repair on failure. Phase 4 makes that a real
  live Hermes Run and the descriptor employee-authored + validated. **New named seam:** an
  *atomic-claim-before-wake* (insert a pending `inbound_events` row to claim the idempotency key
  before waking) to eliminate a redundant wake under the dedupe race — today's backstop prevents
  duplicate rows/messages but the wake can still fire twice. Belongs to Phase 4.
- **Phase 6 (metering):** `run_id`/correlation is essentially absent (only scheduler `job_run_id`).
  **Decision: do not pre-build it.** It is Phase 6's defined surface (`work_runs` + `run_id`
  propagation); introducing it now would blur phase boundaries. Name `run_id` origination at ingress
  in the Phase 3 doc as a forward seam.

## Files / seams touched

- `packages/db/migrations/0010_phase3_inbound_event_dedupe.sql` (new).
- `apps/manager/src/lib/db.ts` (`insertDedup`, `PG_UNIQUE_VIOLATION`).
- `apps/manager/src/lib/employee-events.ts` (`duplicateResult`; both insert sites conflict-tolerant).
- `tests/unit/db.test.ts` (new).

## Carry-forward / next

- **Write the Phase 3 implementation doc** (one phase, per founder preference): promote
  `events/registry.ts` to the real ingress entry; move per-provider verify/normalize behind real
  adapters while keeping strict signature/OIDC at the edge; assert the `deliver_only` zero-token path;
  name the Phase 4 atomic-claim-before-wake seam and the Phase 6 `run_id`-at-ingress seam.
- Live gates (Phase 1 provider/runtime, Phase 2 runtime) still `pending` real creds/host.

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit` — pass, **26 files / 128 tests** (+`db.test.ts`).
- `npm run build` — pass.
- `npm run lint` — pass.
- Not run (no creds): integration (env-gated skip), acceptance harness. Migration `0010` authored,
  **not yet applied** to a live DB.
