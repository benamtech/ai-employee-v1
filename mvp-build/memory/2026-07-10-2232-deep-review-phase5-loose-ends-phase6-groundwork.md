# Deep review loose ends + Phase 6 groundwork

Date: 2026-07-10 22:32
Status: `source-wired`; live proof still `pending`
Scope: deep source review fixes across Work Surface event visibility, approval execution handoff, admin scoping, QBO review carry-forwards, and a Save For Later / resurfacing UX research note.

## What changed

Fixed the owner-visible Work Surface starvation bug in `apps/manager/src/lib/employee-stream.ts`.
`buildEmployeeSnapshot()` and `fetchWorkEventsSince()` now filter `inbound_events` by `account_id` and
`employee_id` in the database before ordering/limiting, then keep the descriptor filter as defense in
depth. This uses the existing `idx_inbound_events_account_employee` migration intent instead of global
recent-50 plus JS filtering.

Fixed the approve-to-execute handoff in `apps/manager/src/server.ts`. Both signed SMS preview actions
and the generic `/manager/tools/resolve_approval` path now wake the employee after a successful owner
approval/denial by sending a normal owner-turn/runtime message with a stable idempotency key:
`approval-resolution:<approval_id>:<approved|rejected>`. The route also signals the Work Surface change
bus so open desks refresh promptly. The resolve envelope records only real handoff proof
(`approval_followup_turn_status`, `approval_followup_turn_job_id`, `approval_followup_run_id`) and does
not pretend the gated provider action has completed.

Fixed another limit-before-scope issue in `apps/manager/src/lib/admin.ts`. Account detail now loads
runtime endpoints with `.in("employee_id", accountEmployeeIds)` instead of fetching a global first-100
and filtering in JS, so support/readiness views cannot miss a target runtime behind unrelated tenants.

Closed the three lower-severity QBO review carry-forwards without claiming sandbox proof:
- `qbo-tokens.ts`: contended refresh wait now spans the 30-second lease instead of giving up after ~1s.
- `qbo-lookup.ts`: module cache is bounded; full/truncated 1000-row lookup pages fail closed instead
  of returning a false `not_found` or unsafe single match.
- `qbo.stub.ts`: truncated lookup results are folded into a validation rejection asking for a more
  specific QuickBooks entity name before writing.

Added focused regressions:
- `tests/unit/employee-stream.test.ts`: unrelated tenants cannot starve snapshot or SSE delta windows.
- `tests/unit/approval-resolve-route.test.ts`: web approval resolution wakes the employee.
- `tests/unit/preview-action.test.ts`: signed approve/reject wakes with stable approval-resolution keys.
- `tests/unit/admin-routes.test.ts`: account detail scopes runtimes before support-detail limits.
- `tests/unit/qbo-lookup.test.ts` and `tests/unit/qbo-tokens.test.ts`: QBO cache/truncation/contention fixes.

## Why

These were real cross-surface bugs in the launch path:
- owners need to see the most recent relevant work, not whichever tenant filled the global event limit;
- owner approval must resume the gated workflow, or "Approve" only changes a DB row and the send/write
  never happens;
- operator views must not silently hide the very runtime they are supposed to diagnose;
- QBO name resolution and token rotation must fail closed under scale/contention.

The approval fix deliberately wakes the employee rather than direct-dispatching the gated tool. That
keeps agency, conversation context, proof capture, and tool execution inside the same Manager/Hermes
path the rest of the product uses.

## Save For Later / No Later research note

The product insight is strong: "Save for later" usually creates no actual later. AMTECH already has
pieces that can become a resurfacing system instead of a dead bookmark pile:
- `set_internal_reminder`, `dispatch_due_reminders`, and daily briefs;
- `WorkTask`, `SurfaceEnvelope`, job folders, approvals, reminders, and work-event descriptors;
- ambient SMS/web presence routing;
- Hermes todo/cron/session-memory style capabilities in the profile/toolset layer.

Quick research pass:
- Composio positions per-user auth, managed token refresh, 1000+ toolkits, triggers, and sandboxed
  execution as the generic agent integration layer: https://docs.composio.dev/docs.
- Composio auth/triggers docs emphasize stable per-user identity, hosted connect links, automatic token
  refresh, signed trigger delivery, retries, and one webhook destination:
  https://docs.composio.dev/docs/authentication and https://docs.composio.dev/docs/triggers.
- Nango similarly frames product integrations around OAuth/API-key custody, generated functions,
  webhooks/schedules/retries/rate limits/checkpoints, MCP/tool schemas, observability, and tenant
  isolation: https://nango.dev/docs/getting-started/intro-to-nango.
- Relevant UX/HCI research direction: "Not Now, Ask Later" shows users repeatedly expect to re-strengthen
  deferred intent later; "Scrapbook" argues retrieval works better when saved items preserve context and
  reconstruct the working state, not just a link.

Recommendation for a later product/design pass: define a Manager-owned **Resurface Ledger**. A saved or
deferred thing should store `(why_saved, next_review_at, trigger_condition, business_object_refs,
owner_channel_policy, done/expired criteria, evidence)`, then materialize through the same Work Surface,
daily brief, and SMS channels. This should sit on the existing reminder/task/materialization seams before
adding any new table. Do not build a generic bookmark manager; make "later" a business-brain obligation
the employee is responsible for resurfacing.

## Current status

All changes are `source-wired` only. No provider or runtime status was upgraded.

Still `pending`:
- migrations `0022`-`0026` applied live + Supabase advisors/privilege checks;
- platform-operator seeding and production admin browser-token configuration;
- reprovision old employees to prove scoped MCP credentials live;
- real Hermes tool-execution loop / funded provider proof;
- QBO sandbox proof via `run10-quickbooks.mjs`;
- egress control.

Supabase changelog check was performed before changes. The relevant 2026 constraint remains that new
public tables are not automatically Data API exposed, reinforcing the current no-new-browser-readable
table/view posture.

## Files / seams touched

Representative source:
- `apps/manager/src/lib/employee-stream.ts`
- `apps/manager/src/server.ts`
- `apps/manager/src/lib/admin.ts`
- `apps/manager/src/lib/qbo-{lookup,tokens}.ts`
- `apps/manager/src/tools/qbo.stub.ts`

Representative tests:
- `tests/unit/employee-stream.test.ts`
- `tests/unit/approval-resolve-route.test.ts`
- `tests/unit/preview-action.test.ts`
- `tests/unit/admin-routes.test.ts`
- `tests/unit/qbo-{lookup,tokens}.test.ts`

Docs:
- `CODEGRAPH.md`
- this handoff + `MEMORY.md` index

## Carry-forward / next

Run real end-to-end approval testing once the Hermes tool loop is live: owner taps Approve on SMS/web,
employee resumes, calls `send_email_draft`/`send_deposit_invoice`/`commit_quickbooks_write`, and the
owner sees the resulting provider proof and work-event receipt.

Keep provider webhook durability on the Phase 6 list: Gmail/Stripe/QBO currently verify and call the
Manager processing path inline before ack; source-wired, but not yet the ideal verify->persist->ack->
async-worker shape for multi-instance/high-latency providers.

Turn the Resurface Ledger note into a design doc before coding it. Start from existing reminders/daily
brief/materialization tables and only add schema if those seams cannot represent the obligation.

## Verification

Baseline before edits:
- `npm run typecheck` — passed.
- `npm run test:unit` — passed, 74 files / 478 tests.
- `npm run build` — passed.
- `npm run lint` — passed.
- `npm run test:integration` — passed as env-gated skips, 6 files / 11 skipped.

After edits so far:
- `npm run typecheck` — passed.
- `npm run test:unit` — passed, 76 files / 487 tests.
- `npm run build` — passed.
- `npm run lint` — passed.
- `npm run test:integration` — passed as env-gated skips, 6 files / 11 skipped.
