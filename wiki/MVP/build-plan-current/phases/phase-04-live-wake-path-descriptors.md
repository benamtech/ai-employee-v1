# Phase 4 — Live Employee Wake Path & Descriptors

Status: source-wired / runtime pending

> **Architecture context:** this phase is the brain's reason-branch in
> [`../../agent-inbox-and-channel-architecture.md`](../../agent-inbox-and-channel-architecture.md) (conductor + Jobs
> + serialized inbox; channel-agnostic intents). Read it before building the wake path.

## Goal / Module

The event-bus **back half**: when a routed event needs judgment, **wake the employee against a live
Hermes Run/Session**, and make the employee's emitted `WorkEventDescriptor` a first-class, validated
output.

## Depends on

- Phase 2 (live runtime + scheduled runner).
- Phase 3 (normalized events with a clean `wake_employee` boundary).
- Phase 3A (Channel/Session/Presence router), so the employee emits channel-agnostic intents and the Manager decides
  where they surface.

## Surface (code + schema)

- Live Hermes Run/Session wake path (replaces the structured-event seam with a real run).
- First-class employee-authored `WorkEventDescriptor`: schema validation, rejection of malformed
  descriptors, safe-fact enforcement.

## Build tasks

- Complete the real message-to-agent wake path against live Hermes Runs/Sessions.
- Make employee-emitted `WorkEventDescriptor` records first-class (not Manager-authored only).
- Validate descriptors against the typed grammar; reject/repair malformed ones.
- Serialize wake attempts per employee brain; do not depend on Hermes accepting mid-run injected messages.
- Keep the owner seeing one employee — Manager remains the invisible control plane.

## Acceptance proof

- `runtime-accepted`: a judgment event **wakes the employee on live Hermes** and the run returns a
  validated `WorkEventDescriptor` (capture run/session ids + descriptor id).
- Malformed descriptors are rejected with audit, not surfaced to the owner.

## Seam handed forward

A live stream of validated descriptors that Phase 5 triages, batches, and renders live.

## Status

`source-wired` locally in `mvp-build/`: Gmail reply events can claim an inbound event, wake Hermes through
Sessions chat, parse/validate an employee-authored `WorkEventDescriptor`, bind approvals, and route through the
channel router. `runtime-accepted` remains pending real Hermes proof ids.

**Hardened (2026-07-03):** the wake path and every Phase 3/3A/4-core module now have direct deterministic
unit coverage (fake-supabase enforces unique indexes + a faithful turn-claim rpc), plus env-gated Postgres
integration proof of the plpgsql turn serialization and the new-table RLS posture. Malformed-descriptor →
repair (owner never sees it) is pinned by test. Fixes landed: key-based `assertSafeFact`, SMS message-channel
stamping, consistent `mustWrite` on delivery decisions, de-duplicated `manager` adapter registration, and a
turn-queue orphan fix. A scheduler `drain_employee_turns` lane handles straggler owner turns. External-source
extensibility is the `EventSourceAdapter` contract (auto-covered by `event-adapter-contract.test.ts`); the
internal `deliverEmployeeEvent` door is intentionally separate. See
`../../implementation-records/2026-07-03-phase-04-hardening-and-phase-06-record.md`.

**Completion cleanup (2026-07-03):** ingress-owned `work_runs` now finish cleanly, the queued-turn drain
persists owner-visible reply messages before routing, and migration `0014` keeps `run_id` crossing the real
turn-claim RPC boundary. Phase 4 has no known remaining local/source defect; live runtime proof is still the
acceptance gate.
