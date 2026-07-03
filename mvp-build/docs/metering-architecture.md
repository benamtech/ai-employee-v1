# Metering Architecture

Status: planned

Purpose: define how AMTECH should meter AI, tools, providers, runtime, and customer-facing work as a production company. This is the target architecture, not the current implementation.

## Current Reality

The codebase already has the right first seams, but not production metering:

- `HERMES_API_TOKEN` is a server-to-server bearer token used by Manager when calling each employee runtime through `deliverToRuntime` and `wakeEmployeeForEvent`.
- Provisioning stores runtime proof in `runtime_endpoints`, `provisioning_jobs`, and `employee_profile_builds`.
- `feature_checks` records default-allow entitlement decisions.
- `usage_events` exists, and the `record_usage` Manager tool can insert generic usage.
- Manager tools and provider actions write `audit_log`.
- Token usage, model cost, Hermes runtime cost, provider API cost, and tool-call cost are not automatically captured.

The production move is to instrument the chokepoints, not every feature one by one.

## Production Principles

- **Append-only raw meter events.** Never overwrite raw usage. Corrections are new adjustment rows.
- **One run id ties work together.** Every owner message, webhook, scheduled job, repair replay, approval, model call, tool call, artifact, and provider proof belongs to a `work_run`.
- **Meter every external boundary.** Model providers, Hermes, Twilio, Gmail, Stripe, Supabase Storage, PDF generation, and Manager tools all pass through wrappers that record usage.
- **Separate usage from billing.** Raw metering is immutable evidence; daily rollups and invoices are derived views/tables.
- **No sensitive payloads.** Meter rows store hashes, ids, safe labels, counts, token totals, latency, and provider proof ids. Never raw prompts, emails, webhook bodies, tokens, or secrets.
- **Account isolation.** All owner/admin-visible metering views must be account-scoped with RLS. Manager writes through service role; browser reads only safe summaries.
- **Budget enforcement is policy, not logging.** Metering records what happened; entitlement/budget checks decide whether future work is allowed, batched, degraded, or blocked.

## Core Data Model

The ideal schema extends the current `usage_events`/`feature_checks` model into five ledgers.

### `work_runs`

One logical unit of work.

Required fields:

- `id`
- `account_id`
- `employee_id`
- `trigger_type`: `owner_message | provider_event | scheduled_job | repair | provision | system`
- `trigger_ref`: message id, inbound event id, job run id, etc.
- `status`: `started | succeeded | failed | cancelled | needs_approval`
- `started_at`, `finished_at`
- `summary_safe`

Examples:

- owner asks for an estimate;
- Gmail reply wakes the employee;
- Stripe invoice paid event triggers a reminder question;
- daily brief job emits a digest.

### `meter_events`

Immutable raw usage facts.

Required fields:

- `id`
- `run_id`
- `account_id`
- `employee_id`
- `category`: `model | hermes_runtime | manager_tool | provider_api | sms | storage | artifact | scheduler`
- `provider`: `openai | anthropic | xai | hermes | twilio | gmail | stripe | supabase | manager`
- `feature_key`: stable product label such as `front_door_turn`, `wake_employee_event`, `send_sms`, `gmail_send`, `stripe_invoice_send`
- `quantity`
- `unit`: `input_tokens | output_tokens | cached_tokens | tool_call | sms_segment | api_call | byte | second | cent`
- `cost_micros`
- `request_id` / `provider_id`
- `status`
- `latency_ms`
- `metadata_safe`
- `created_at`

### `tool_invocations`

Structured execution trace for Manager/Hermes tools.

Required fields:

- `id`
- `run_id`
- `account_id`
- `employee_id`
- `tool_name`
- `actor`
- `input_hash`
- `output_hash`
- `approval_id`
- `status`
- `latency_ms`
- `provider_proof_id`
- `error_code`
- `created_at`

This complements `audit_log`: audit answers "was this allowed and what changed?"; tool invocation answers "what did it cost and how did it perform?"

### `usage_rollups_daily`

Derived, replaceable/accounting-friendly totals.

Dimensions:

- date
- account
- employee
- category
- provider
- feature_key

Totals:

- quantity by unit
- cost_micros
- succeeded/failed counts
- p50/p95 latency where useful

### `budget_policies`

Operational controls.

Fields:

- `account_id`
- `feature_key` or category/provider wildcard
- `period`: `day | month`
- `included_quantity`
- `hard_limit_cost_micros`
- `soft_limit_cost_micros`
- `action`: `allow | alert | batch | degrade_model | require_approval | block_noncritical`

MVP defaults stay allow-all, but paid pilots should have alerts before hard blocks.

## Metered Boundaries

### Front-door model calls

Wrapper: `callOpenAiCompatibleModel`.

Capture:

- provider/base URL;
- model;
- response id if available;
- prompt/completion/cache tokens if provider returns them;
- latency;
- structured-output retry/failure count;
- cost estimate from a versioned pricing table.

Current gap: provider `usage` metadata is not parsed.

### Hermes runtime calls

Wrappers:

- `deliverToRuntime`
- `wakeEmployeeForEvent`

Capture:

- runtime endpoint id;
- Hermes profile id;
- session/run id if Hermes returns one;
- token usage/events if Hermes exposes them;
- tool events from Hermes SSE;
- latency/status;
- fallback status when Hermes returns no usage.

Important: `HERMES_API_TOKEN` should remain server-only. For production, prefer a per-runtime or per-account token reference instead of one global token.

### Manager tools

Wrapper: `/manager/tools/:name` route.

Capture:

- tool name;
- actor;
- account/employee;
- input/output hashes;
- approval id if present;
- changed resources;
- latency;
- status/error;
- provider proof ids from envelope.

Every tool should be automatically metered even if the tool author forgets.

### Provider APIs

Wrappers:

- Twilio `sendSms`, Verify, webhook status callbacks;
- Gmail OAuth/refresh/profile/watch/history/send/message;
- Stripe account/customer/invoice/account-link/webhook replay;
- Supabase Storage upload/download/signed link creation.

Capture:

- provider request id/proof id;
- count and units;
- latency/status;
- direct provider cost where known;
- estimated cost otherwise.

### Scheduler and repair

Wrappers:

- `dispatch_due_reminders`
- `renew_expiring_watches`
- `dispatch_daily_briefs`
- repair tools

Capture:

- job key;
- candidates/fired/renewed/emitted;
- repair replay count;
- duplicate/suppression counts;
- cost of downstream calls.

## Cost Calculation

Use a versioned pricing table rather than hard-coding costs:

- `meter_pricing_versions`: provider, model/service, unit, effective_at, price_micros_per_unit.
- `meter_events.cost_micros` stores the calculated cost at event time.
- If price is unknown, store `cost_micros = null` and `metadata_safe.pricing_status = "unknown"` so reporting stays honest.

Costs to model:

- model tokens by provider/model;
- Twilio SMS by segment;
- Stripe fees can be reported from Stripe rather than estimated;
- storage bytes and bandwidth;
- Hermes runtime seconds/container minutes if running isolated pilots;
- internal tool calls as zero direct cost unless they cause provider/runtime work.

## Product Features

Operator/admin features:

- live usage by account/employee/run;
- spend by provider/model/tool;
- failed/expensive run drilldown;
- budget alerts;
- repair queue with cost impact;
- per-customer pilot profitability view.

Owner-facing features:

- simple "work done this month" summary;
- approvals and provider proofs;
- no raw token/cost dashboard unless needed for billing trust.

Founder/business features:

- gross margin by customer;
- top cost drivers;
- cost per completed estimate/job/reminder;
- model-routing ROI;
- alerts for runaway loops or noisy sources.

## Security And RLS

- Raw meter tables are Manager-write only.
- Owner/browser reads go through safe account-scoped views or Manager routes.
- RLS policies must combine `TO authenticated` with account membership predicates, not role-only checks.
- Do not use `user_metadata` for authorization.
- Do not expose service-role keys or raw meter payloads to Next.js client code.
- Views exposed to the browser should be `security_invoker` where supported, or remain behind Manager.

## Acceptance Bar

Production metering is accepted when:

- every model/runtime/provider/tool wrapper writes meter events on success and failure;
- every meter event has account context or lands in repair;
- one run id ties together owner-visible work;
- daily rollups match raw events within rounding tolerance;
- budget alerts fire in tests;
- no raw prompts, emails, tokens, secrets, or webhook bodies appear in meter/audit rows;
- owner-facing usage cannot cross account boundaries under RLS.
