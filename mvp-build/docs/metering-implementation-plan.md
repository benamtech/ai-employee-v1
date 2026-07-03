# Metering Implementation Plan

Status: planned

Companion to [`metering-architecture.md`](metering-architecture.md). This maps the current codebase to a production-grade metering system.

## Phase 0 - Lock The Vocabulary

Deliver:

- Add shared types for `WorkRun`, `MeterEvent`, `ToolInvocation`, `UsageRollup`, and `BudgetPolicy`.
- Define stable `feature_key` names for current product surfaces:
  - `front_door_turn`
  - `owner_web_message`
  - `owner_sms_message`
  - `wake_employee_event`
  - `deliver_only_event`
  - `manager_tool`
  - `gmail_send`
  - `gmail_history_sync`
  - `stripe_connect`
  - `stripe_invoice_send`
  - `twilio_sms`
  - `artifact_storage`
  - `scheduler_tick`
  - `repair_replay`
- Define status codes and units once in `packages/shared`.

Acceptance:

- all current code can compile against the type package;
- no DB migration yet;
- docs and types agree on names.

## Phase 1 - Add The Ledger Schema

Deliver an additive migration after checking current Supabase guidance:

- `work_runs`
- `meter_events`
- `tool_invocations`
- `meter_pricing_versions`
- `usage_rollups_daily`
- `budget_policies`

Keep current `usage_events` for compatibility during transition.

Schema rules:

- raw meter rows are append-only;
- account and employee ids are nullable only when context is truly unknown;
- unknown account context must create a repair row;
- use indexes for account/date, run id, category/provider, and feature key;
- add RLS for owner-readable rollups only; raw rows should stay Manager-only or behind safe views/routes.

Acceptance:

- migration applies cleanly;
- RLS integration test proves account A cannot read account B rollups;
- service role can write raw meter rows.

## Phase 2 - Create Metering Library

Add `apps/manager/src/lib/metering.ts` as the single write path.

Required functions:

- `startWorkRun(input)`
- `finishWorkRun(runId, status, summarySafe)`
- `recordMeterEvent(input)`
- `recordToolInvocation(input)`
- `estimateCost(provider, modelOrService, unit, quantity, at)`
- `withMeteredExternalCall(input, fn)`
- `withMeteredToolInvocation(input, fn)`

Rules:

- always write success and failure;
- never throw because metering failed unless a budget policy explicitly blocks the work;
- hash sensitive input/output instead of storing payloads;
- use safe audit redaction for metadata.

Acceptance:

- unit tests cover success, failure, unknown pricing, and redaction;
- a fake DB failure in metering does not break owner-critical delivery unless configured as fail-closed.

## Phase 3 - Instrument The Chokepoints

Instrument wrappers, not leaf features.

Manager tool route:

- wrap `/manager/tools/:name`;
- record tool invocation for every tool;
- capture latency, status, error code, changed resources, approval id, proof ids.

Model adapter:

- parse provider `usage` from OpenAI-compatible responses;
- record model tokens, model name, provider/base URL, request id if available, latency, cost.

Hermes runtime:

- wrap `deliverToRuntime` and `wakeEmployeeForEvent`;
- record runtime call status/latency;
- store Hermes run/session ids when returned;
- capture token/tool usage from Hermes response or SSE when available.

Provider wrappers:

- Twilio SMS and Verify;
- Gmail token refresh, profile, watch, history, send, message metadata;
- Stripe account/customer/invoice/account-link/webhook replay;
- Supabase Storage upload/download/signed link creation.

Acceptance:

- unit tests prove each wrapper emits meter rows;
- existing tool/provider tests still pass;
- no raw payloads appear in meter metadata.

## Phase 4 - Run Context Propagation

Thread `run_id` through the whole event loop.

Rules:

- owner web/SMS message starts a run;
- provider webhook creates a run or attaches to the existing event run;
- scheduled job creates one run per job execution plus child runs for emitted work events if needed;
- approval resolution attaches to the original run;
- repair replay creates a repair run linked to original event id.

Acceptance:

- Gmail reply -> employee event -> approval -> Stripe invoice can be queried as one work chain;
- duplicate and redelivery paths remain idempotent;
- repair queue records missing run/account context.

## Phase 5 - Rollups And Budgets

Deliver:

- daily rollup job;
- account/employee/provider/model summaries;
- budget policy checks before expensive or noncritical work;
- soft alerts before hard blocks.

Default policy:

- MVP/pilot accounts remain allow-all;
- alert at configured monthly spend threshold;
- never block inbound security/repair handling;
- allow budget policy to batch or degrade noncritical scheduled work.

Acceptance:

- rollups reconcile with raw meter events;
- soft limit produces an operator alert;
- hard limit blocks a test noncritical action but does not block provider webhook recording.

## Phase 6 - Product Surfaces

Operator surface:

- account spend today/month;
- cost by provider/model/tool;
- expensive runs;
- failed runs;
- budget alerts;
- pilot gross margin.

Owner surface:

- "work completed this month";
- high-level usage included in plan;
- provider proof receipts;
- no raw token/cost details unless needed for billing transparency.

Acceptance:

- owner cannot access another account's usage;
- operator can trace a charge back to a run and proof ids;
- summaries match rollups.

## Migration From Current Usage

Current objects:

- `feature_checks`: keep as entitlement-decision audit.
- `usage_events`: keep during transition; later backfill or replace with `meter_events`.
- `audit_log`: keep as compliance/action log, not cost ledger.

Transition:

1. Add new ledgers.
2. Make `record_usage` write both `usage_events` and `meter_events`.
3. Move wrappers to `meter_events`.
4. Keep `usage_events` read-only/deprecated for one release.
5. Remove or alias old usage reads only after rollups are live.

## Risks

- Hermes may not return token usage at first. Store runtime calls and latency anyway; add usage details when Hermes exposes them.
- Some providers do not expose exact cost at request time. Store proof ids and estimate later.
- Cost logging can leak sensitive data if metadata is careless. Use strict metadata schemas and redaction tests.
- Budget blocking can damage trust if it blocks owner-critical work. Start with alerts, batching, and model degradation before hard blocks.

## Implementation Order

1. Types and feature-key vocabulary.
2. Additive DB migration and RLS tests.
3. Metering library and redaction tests.
4. Tool-route wrapper.
5. Model/Hermes wrappers.
6. Provider wrappers.
7. Run-id propagation.
8. Daily rollups and budget alerts.
9. Operator/admin summaries.
10. Owner-safe summaries.

## Done Definition

Metering is production-ready when AMTECH can answer, for any account:

- what work was done;
- which run caused it;
- which model/provider/tool was used;
- how many tokens/SMS/API calls/runtime seconds were consumed;
- what it cost or why exact cost is unknown;
- which owner approval/proof ids justified it;
- whether the customer is profitable this month.
