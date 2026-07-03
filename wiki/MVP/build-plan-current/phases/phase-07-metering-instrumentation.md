# Phase 7 — Metering Instrumentation (chokepoints)

Status: planned

## Goal / Module

Wire the metering write-points: every place real work or cost happens emits `meter_events` /
`tool_invocations` against the `run_id`, including provider-cost capture.

## Depends on

- Phase 6 (ledgers, `metering.ts`, `run_id`).

## Surface (code + schema)

Instrument these chokepoints (no new tables; writes into Phase 6 ledgers):

- `/manager/tools/:name` (the universal Manager tool route);
- `callOpenAiCompatibleModel` (token/cost capture);
- `deliverToRuntime`, `wakeEmployeeForEvent`;
- Twilio send/verify/webhooks;
- Gmail OAuth/profile/watch/history/send/message;
- Stripe account/account-link/invoice/webhook/replay;
- Supabase Storage upload/download/signed link;
- scheduler and repair tools.

## Build tasks

- Make the Manager tool route the universal metering + audit chokepoint.
- Capture provider/model cost where available; mark **honestly unknown** where not.
- Emit `tool_invocations` + `meter_events` against the propagated `run_id`.

## Acceptance proof

- A real chain — e.g. **Gmail reply → Stripe invoice → reminder** — is queryable as **one work chain**
  via `run_id`.
- Per-step costs are present or explicitly marked unknown (no silent zeros).

## Seam handed forward

A populated event-level ledger that Phase 8 aggregates into rollups, budgets, and safe summaries.

## Status

`planned`.
