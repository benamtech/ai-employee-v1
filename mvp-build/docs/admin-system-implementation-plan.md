# Admin System Implementation Plan

Status: planned

Companion to [`admin-system-architecture.md`](admin-system-architecture.md). This maps the admin design onto the current MVP codebase without rewriting the existing build-plan packet.

## Implementation Principles

- Add admin functionality around current tables before introducing broad schema changes.
- Prefer server-rendered/admin API summaries over broad browser access to raw tables.
- Keep the Manager as the write boundary for operational actions.
- Keep customer owner surfaces separate from operator/admin surfaces.
- Gate admin by database-backed roles, not by user-editable metadata.
- Log every privileged action with a reason and safe details.
- Build health and repair queues before building cosmetic dashboards.

## Phase 0 - Vocabulary And Boundaries

Deliver:

- Shared enum vocabulary for account states, runtime states, connector states, subscription states, health states, admin roles, and support-access reasons.
- Route naming for admin pages and internal admin APIs.
- List of safe account-summary fields that can appear in browser payloads.
- Explicit distinction between AMTECH subscription billing and owner Stripe Connect customer payments.

Acceptance:

- docs, shared types, and table status names agree;
- no new UI or DB migration yet;
- no existing MVP route changes.

## Phase 1 - Operator Read Model

Deliver:

- Admin-only read endpoints for:
  - account list
  - account detail
  - provisioning jobs
  - runtime endpoints
  - connectors
  - repair queue
  - audit log
  - usage summary from current `usage_events`
- Safe SQL queries or server-side joins that avoid returning raw secrets, raw email bodies, raw prompts, and webhook bodies.
- Basic account health computation in code from current rows.

Acceptance:

- platform operator can inspect MVP health without direct SQL;
- endpoints require internal/admin auth;
- returned payloads have no `secret_ref` values unless explicitly labeled safe reference ids;
- unit tests cover one account-safe summary and one cross-account denial.

## Phase 2 - Platform Roles And Support Access

Deliver additive schema:

- `platform_users`
- `platform_roles`
- `platform_user_roles`
- `support_access_sessions`

Behavior:

- platform operators are separate from customer `account_memberships`;
- support access requires account id, reason, role, expiry, and audit row;
- destructive actions require higher role;
- read-only support role cannot trigger repair/replay/provisioning changes.

Supabase rules:

- RLS on exposed admin-safe views if browser-readable;
- raw platform tables remain Manager/service-role only unless a narrow admin client path is intentionally built;
- do not use `user_metadata` for authorization.

Acceptance:

- operator without support access cannot open account detail;
- expired support access fails;
- support access creation writes `audit_log`;
- owner users cannot read platform tables.

## Phase 3 - Admin Panel MVP

Deliver UI:

- `/admin` dashboard
- `/admin/accounts`
- `/admin/accounts/[accountId]`
- `/admin/provisioning`
- `/admin/repairs`
- `/admin/providers`

Account detail tabs:

- Overview
- Users
- Employees
- Provisioning
- Connectors
- Metering
- Billing
- Events
- Repairs
- Audit

Acceptance:

- one operator can inspect an account, employee runtime, connector state, repair rows, and usage rows;
- UI does not show raw payloads or provider secrets;
- every action button has disabled/loading/error states and a confirmation path for privileged actions;
- owner Work Surface remains unchanged.

## Phase 4 - Provisioning Queue

Deliver additive schema:

- `provisioning_steps`
- optional `number_assignments`

Actions:

- retry provisioning job from failed stage
- mark failed stage acknowledged
- resend claim link
- regenerate owner session link
- release/reassign number before employee is live
- rerun runtime health check

Acceptance:

- failed provisioning job shows failed stage and safe logs;
- retry is idempotent or refuses with a clear reason;
- first SMS/Twilio proof remains visible;
- no provisioning action can run without platform role and reason.

## Phase 5 - Provider And Connector Operations

Deliver additive schema:

- `provider_connections`
- `provider_health_checks`
- `provider_rate_limits`
- `oauth_reauth_requests`

Provider health checks:

- Supabase DB/storage/auth check
- Twilio send/status or account capability check
- Gmail OAuth token refresh/profile/watch health
- Gmail watch expiry sweep
- Stripe Connect account retrieval and webhook status
- LLM provider model call or lightweight models/limits check
- Hermes runtime reachability

Actions:

- request Gmail reauth
- renew Gmail watch
- test connector
- suppress source/event type
- replay provider event
- redeliver owner notification
- inspect Stripe Connect requirements
- generate authenticated Stripe account-link only inside account space

Acceptance:

- Gmail watches expiring within 48 hours appear in admin queue;
- missed Gmail notification recovery path is visible;
- Stripe account-link URLs are never sent by SMS/email from admin tooling;
- provider failures become `ops_tasks` or repair queue rows.

## Phase 6 - AMTECH Billing And Account State

Deliver additive schema:

- `plans`
- `subscriptions`
- `subscription_items`
- `billing_invoices`
- `billing_events`
- `billing_credits`

Behavior:

- MVP accounts default to `free_mvp` and allow-all;
- billing state is visible but does not block account creation;
- dunning/suspension policy is modeled before being enforced;
- Stripe Connect deposit invoices remain separate from AMTECH subscription invoices.

Acceptance:

- account detail shows AMTECH subscription state separately from owner Stripe Connect state;
- past-due state can be set manually by platform owner;
- budget/billing blocks only affect noncritical outbound work in tests;
- inbound provider events, audit, export, cancellation, and repair are never blocked.

## Phase 7 - LLM Provider Registry

Deliver additive schema:

- `llm_providers`
- `llm_model_routes`
- `llm_provider_health`
- `llm_rate_limit_observations`
- `llm_pricing_versions`

Admin controls:

- provider enabled/disabled
- model route per workload
- fallback route
- structured-output support flag
- timeout and retry policy
- cost cap per run
- health state and last error
- rate-limit observation capture

Workload routes:

- `front_door_onboarding`
- `owner_message`
- `provider_event_triage`
- `daily_brief`
- `repair_summary`
- `artifact_generation`
- `evaluation`

Acceptance:

- operator can change a nonproduction route without code deploy;
- production route changes require higher role and audit reason;
- failed health check marks route degraded;
- provider usage metadata flows into metering when available;
- unknown pricing is labeled unknown rather than guessed.

## Phase 8 - Metering Ledgers And Rollups

Implement after or alongside [`metering-implementation-plan.md`](metering-implementation-plan.md).

Deliver:

- `work_runs`
- `meter_events`
- `tool_invocations`
- `usage_rollups_daily`
- `budget_policies`
- admin usage/cost dashboards
- owner-safe usage summaries

Acceptance:

- account page can trace a charge or cost spike to a run and proof ids;
- rollups reconcile with raw rows;
- owner cannot read another account's usage;
- operator can see unknown-pricing gaps.

## Phase 9 - 1000-User Operations

Deliver:

- `ops_tasks`
- `incidents`
- `incident_events`
- `admin_notifications`
- `diagnostic_bundles`
- daily worker/scheduler dashboards
- bulk filters and safe bulk actions
- data retention/export/cancellation workflows

Required recurring jobs:

- health checks
- Gmail watch renewal
- Gmail history fallback sync
- billing sync
- metering rollups
- runtime reachability checks
- repair queue sweeps
- provider rate/cost refresh
- stale provisioning sweep

Acceptance:

- operator dashboard has no unbounded raw lists;
- every queue has age/severity filters;
- 1000 accounts can be scanned from summaries;
- one account can be exported or cancelled without direct SQL;
- incidents collect affected accounts, provider, timeline, owner-facing status, and resolution.

## Admin Actions Matrix

| Action | Minimum Role | Reason Required | Audit Required |
|---|---|---:|---:|
| view account summary | support_readonly | yes | yes |
| open support access | platform_operator | yes | yes |
| retry provisioning | platform_operator | yes | yes |
| resend claim link | platform_operator | yes | yes |
| request connector reauth | platform_operator | yes | yes |
| replay provider event | platform_operator | yes | yes |
| suppress event source | platform_operator | yes | yes |
| change model route | platform_owner | yes | yes |
| change billing state | billing_operator | yes | yes |
| suspend account | platform_owner | yes | yes |
| delete/export account | platform_owner | yes | yes |
| grant platform role | platform_owner | yes | yes |

## Testing Plan

Unit tests:

- admin summary redaction
- account health computation
- platform role checks
- support access expiry
- provisioning retry validation
- provider health status mapping
- LLM route fallback decision
- billing block policy for noncritical work

Integration tests with live env when available:

- owner cannot read another account's admin-safe summary
- support access can inspect only the selected account
- Gmail watch renewal updates health state
- Stripe Connect account state sync updates account detail
- Twilio SMS health captures proof id
- LLM provider health captures rate/cost metadata when returned

Manual acceptance:

- create account and employee
- watch provisioning stages
- connect Gmail
- connect Stripe
- produce estimate artifact
- send Gmail estimate
- receive Gmail reply
- send Stripe deposit invoice
- see metering and audit rows
- trigger a repair and resolve it

## Migration Order

1. Shared vocabulary and route contracts.
2. Admin read endpoints over existing tables.
3. Platform roles/support-access schema.
4. Admin panel MVP.
5. Provisioning step schema and retry actions.
6. Provider health/check schemas and jobs.
7. AMTECH billing scaffold.
8. LLM provider registry.
9. Metering ledgers and rollups.
10. 1000-user ops tasks, incidents, diagnostics, retention/export.

## Done Definition

The implementation plan is done when an operator can run the MVP business from admin surfaces:

- inspect account and employee state;
- repair provisioning and provider events;
- see health and billing state;
- manage LLM/provider configuration safely;
- trace metering and proof ids;
- support up to 1000 users from queues and summaries instead of database spelunking.
