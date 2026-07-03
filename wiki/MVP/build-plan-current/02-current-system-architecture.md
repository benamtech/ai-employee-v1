# Current System Architecture

Status: active

## Planes

```text
Owner-facing:
  front door onboarding
  owner Work Surface
  SMS employee conversation
  product account space

Backend:
  Manager API/tool plane
  provider webhook ingress
  provisioner/runtime host plane
  event bus and repair plane
  metering/billing/admin plane

Runtime:
  Hermes profile
  employee workspace/template
  runtime endpoint
  future Hermes Jobs/Sessions/Runs stream
```

## Identity Model

```text
AMTECH account
  -> users via account_memberships
  -> verified phones
  -> employees
  -> connectors
  -> billing/subscription
  -> metering and audit

employee
  -> Hermes profile id
  -> runtime endpoint
  -> profile package build
  -> artifacts/approvals/events/messages
```

AMTECH account identity is not Hermes profile identity. Hermes profile identity is not runtime process isolation. The current `local` backend is dev/demo only; first paid pilots need Docker or stronger containment.

## Owner Surfaces

- `/create-ai-employee` - web front door.
- `/claim` - claim entry.
- `/agent/{employee_id}` - owner Work Surface.
- SMS - ambient default inbox for the employee.
- Future account space - account settings, users, plan, connectors, billing/usage summaries.

Owner surfaces must hide platform internals, tool names, raw JSON, raw provider payloads, and secrets.

## Manager Plane

Manager owns:

- identity/account/provisioning tools;
- artifact and approval tools;
- Gmail OAuth/send/watch/history/reply tools;
- Stripe Connect/invoice/webhook tools;
- reminder/scheduler tools;
- repair tools;
- audit/entitlement/usage seams;
- future admin/metering/billing write boundaries.

The current Manager tool route should become the universal metering and audit chokepoint.

## Event Bus

Canonical event lifecycle:

```text
ingress -> verify -> normalize -> dedupe -> triage -> route
  -> deliver_only or wake_employee
  -> emit WorkEventDescriptor -> prove/audit/meter
  -> render SMS/web/account/admin
  -> owner response -> act -> new event
```

Current source has:

- real Gmail/Stripe/Twilio-specific ingress;
- generic event-source registry seam;
- event repair queue;
- source suppressions;
- event batches;
- `deliver_only` vs `wake_employee` route flag;
- structured runtime event call seam;
- Work Surface SSE-shaped snapshot endpoint.

Remaining work:

- promote generic ingress from seam to primary path;
- complete real message-to-agent wake path against live Hermes Runs/Sessions;
- make employee-authored descriptors first-class;
- implement real triage/batching;
- replace snapshot SSE with live Hermes event stream when runtime is available.

## Work Surface

The Work Surface renders `WorkEventDescriptor` records:

- move type: notify/question/review;
- deliverable type;
- acceptance grammar;
- risk flags;
- proof receipts;
- job folder timeline.

The renderer is built before the full live event spine. That is acceptable, but the next architecture step is to feed it with live Hermes/Manager events instead of a polled resource snapshot.

## Admin Plane

Admin is now a first-class plane:

```text
Operator Admin Panel
  -> account list/detail
  -> provisioning queue
  -> repair queue
  -> provider health
  -> runtime health
  -> billing/subscription state
  -> metering/cost/margin
  -> LLM provider routes
  -> audit/support access
```

Platform operators are separate from customer account members. Support access must be account-scoped, time-limited, reasoned, and audited.

## Metering Plane

Metering becomes a set of ledgers:

- `work_runs`
- `meter_events`
- `tool_invocations`
- `meter_pricing_versions`
- `usage_rollups_daily`
- `budget_policies`

Instrument chokepoints:

- Manager tool route;
- model adapter;
- Hermes runtime calls;
- Twilio/Gmail/Stripe/Supabase wrappers;
- scheduler and repair tools;
- artifact storage/signing.

Metering is not billing. Metering records immutable usage facts; billing derives subscription invoices, rollups, budgets, and gross-margin views.

## Billing Boundary

Two rails stay separate:

- AMTECH subscription billing: what the owner pays AMTECH for the employee.
- Owner Stripe Connect payments: what the contractor collects from their own customers.

The MVP remains default-allow. Billing gates must not block inbound provider event recording, repair, audit, export, cancellation, or security handling.
