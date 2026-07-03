# Admin System Architecture

Status: planned

Purpose: define the basic admin system AMTECH needs to operate the AI Employee product from MVP through roughly 1000 users. This is a product and operations design, not a source-level implementation record.

Companion docs:

- [`metering-architecture.md`](metering-architecture.md)
- [`metering-implementation-plan.md`](metering-implementation-plan.md)
- [`admin-system-implementation-plan.md`](admin-system-implementation-plan.md)

## Current Reality

The current MVP already has the right first seams for an admin system:

- account/user/member tables: `accounts`, `users`, `account_memberships`, `verified_phones`
- employee/runtime/provisioning tables: `employees`, `employee_manifests`, `business_brain_facts`, `runtime_endpoints`, `provisioning_jobs`, `number_pool`, `profile_packages`, `employee_profile_builds`
- owner surface sessioning: `owner_web_sessions`, signed claim/artifact links, owner web session checks
- connector rows: `connector_accounts`, `gmail_watches`, `stripe_connections`, `stripe_account_links`
- event/ops rows: `inbound_events`, `employee_messages`, `event_repair_queue`, `event_source_suppressions`, `event_batches`, `hermes_job_runs`
- control logs: `audit_log`, `feature_checks`, `usage_events`
- default policy: MVP account/employee creation is not payment-gated; entitlement rows exist but default to allow

The missing piece is a coherent operator-facing system over these seams: an admin panel, account space, provisioning queue, support actions, health checks, billing/subscription state, LLM provider configuration, and operational runbooks.

## Design Goals

- Make the current MVP operable by one founder without direct database surgery.
- Keep the owner-facing product simple: owners talk to their employee; admin tools stay internal.
- Keep AMTECH account identity distinct from Hermes profile identity and runtime process identity.
- Separate customer money movement from AMTECH subscription billing.
- Store secrets by reference, never in logs, rows, browser payloads, or support tickets.
- Make every operator action accountable through `audit_log` and, later, `tool_invocations`.
- Build additive tables and safe views. Do not reshape the current MVP schema for the first admin pass.
- Scale by queues, health summaries, and repair tools before building a large support organization.

## Research Inputs

These design constraints come from current primary/official sources:

- Supabase Auth users issue access tokens that can be constrained with RLS, and user-editable `user_metadata` must not be used for authorization. Use app metadata or database-backed role tables instead. See [Supabase Auth users](https://supabase.com/docs/guides/auth/users), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), and [Supabase RBAC/custom claims](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac).
- Supabase's 2026 changelog includes a breaking change where new tables may not be exposed to the Data API automatically. Admin tables should therefore be explicitly granted only when intentionally browser-readable, with RLS enabled when exposed. See [Supabase changelog](https://supabase.com/changelog.md).
- Stripe Connect account links are single-use and should be delivered only inside an authenticated platform application; returning from onboarding is not proof that all account requirements are satisfied. Inspect `account.updated` webhooks or retrieve the account state. See [Stripe Connect Standard account onboarding](https://docs.stripe.com/connect/standard-accounts). Current Stripe docs also mark legacy account-type pages as deprecated for new Connect platforms, so later Connect work should review the newer interactive platform guide before changing architecture.
- Gmail push notifications require Cloud Pub/Sub, Gmail publish permission, watch renewal at least every 7 days, acknowledgment of push deliveries, and recovery from delayed/dropped notifications with `history.list`. See [Gmail API push notifications](https://developers.google.com/workspace/gmail/api/guides/push).
- Twilio says US application-to-person traffic over 10DLC needs A2P registration, campaign reviews can take 10-15 days, and brand/campaign type affects volume and throughput. See [Twilio A2P 10DLC](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc).
- OpenAI production guidance treats API keys, staging projects, spend limits, rate limits, retries, usage dashboards, and cost controls as production concerns. See [OpenAI production best practices](https://developers.openai.com/api/docs/guides/production-best-practices) and [OpenAI rate limits](https://developers.openai.com/api/docs/guides/rate-limits).
- OWASP ASVS provides a verification baseline for admin security controls, including access control and logging expectations. See [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/).

## Product Boundary

There are four surfaces:

| Surface | Audience | Purpose | Rule |
|---|---|---|---|
| Owner Work Surface | account owner | use the AI employee, approvals, proofs, artifacts | no platform internals |
| Product Account Space | account owner/admin | account profile, users, employee status, connectors, plan, billing, usage summaries | customer-safe summaries only |
| Operator Admin Panel | AMTECH operators | support, provisioning, account health, billing, provider health, repairs | privileged, audited, no raw secrets |
| Manager/Provisioner APIs | employees, web app, internal workers | backend control plane and provisioning actions | token-protected, not directly user-facing |

The admin panel is not the product. The product remains the employee relationship. The admin system exists to keep that relationship provisioned, connected, metered, billed, healthy, and repairable.

## Core Object Model

### Account

The commercial tenant. An account owns users, employees, billing, subscriptions, connectors, usage, artifacts, and operational state.

Required account states:

- `trial`: created and usable before payment gate
- `active`: usable and billable
- `needs_payment`: invoice/payment problem but employee remains accessible unless policy says otherwise
- `suspended`: noncritical work blocked; inbound proof/security/repair still accepted
- `cancelled`: employee disabled, connectors revoked, retention clock started
- `deleted`: hard deletion completed after retention/export policy

### User

A Supabase Auth-backed human identity. Current `users.auth_user_id` remains the bridge from Supabase Auth to AMTECH membership.

User roles should be database-backed, not based on `user_metadata`:

- `owner`: full account control
- `account_admin`: account settings, users, connectors, billing visibility
- `employee_operator`: can operate employee approvals and artifacts but not billing/users
- `billing_contact`: invoices, payment methods, plan
- `viewer`: read-only account and usage summaries

### Platform Operator

An AMTECH internal user. Platform operators must be separated from customer account memberships.

Suggested roles:

- `platform_owner`: full admin, role grants, billing overrides, destructive actions
- `platform_operator`: support, provisioning, repair, health, account state
- `support_readonly`: inspect safe summaries and proof ids only
- `billing_operator`: AMTECH invoices, subscription state, refunds/credits
- `security_reviewer`: audit log, access review, incident review

Do not model AMTECH operators as normal members of every customer account. Use a separate platform-role table and audited support access.

### Employee

The product unit. An employee belongs to one account and has:

- an AMTECH employee id
- a Hermes profile id
- a runtime endpoint
- one or more connected providers
- artifacts, approvals, messages, runs, meter events, and repair history

MVP is one employee per account by default. The 1000-user design should allow multiple employees per account without requiring it now.

### Runtime

The executable worker surface. Current `runtime_endpoints.backend_type = local` is acceptable for MVP, but admin health must keep profile isolation separate from runtime containment. Profile id is not a sandbox.

Runtime states:

- `not_started`
- `starting`
- `live`
- `degraded`
- `unreachable`
- `stopped`
- `failed`
- `retired`

### Connector

An external service connection with token custody, scopes, status, health, and repair instructions.

Connector keys:

- `sms/twilio`
- `email/gmail`
- `payments/stripe_connect`
- `storage/supabase`
- future: `drive/google`, `calendar/google`, `voice/twilio`, `browser/runtime`

Connector states:

- `not_connected`
- `pending_oauth`
- `connected`
- `needs_reauth`
- `degraded`
- `disabled`
- `revoked`

### LLM Provider Connection

The model provider configuration used by front-door onboarding, employee runtime, repair summarization, triage, daily briefs, and future evaluation jobs.

Fields to track:

- provider: `openai | anthropic | xai | local | openai_compatible`
- secret reference, never raw key
- base URL
- default model and fallback model
- enabled capabilities: structured output, tool calling, long context, streaming
- health status, last success, last failure, rate-limit headers or equivalent
- token usage/cost source: provider response, estimate, or unknown
- policy: allowed features, max cost per run, retry/backoff, fallback allowed

Provider keys should be global to AMTECH for MVP unless a customer explicitly brings their own key. Per-customer keys add support and billing complexity and should be a paid/enterprise feature.

## Admin Panel Information Architecture

### Dashboard

Purpose: operator home.

Sections:

- accounts needing attention
- provisioning queue
- connector failures
- runtime health
- unpaid or expiring billing states
- daily cost and gross margin
- repair queue by age/severity
- provider status: Supabase, Twilio, Gmail/PubSub, Stripe, LLM provider, Hermes host

### Accounts

Account list filters:

- state
- plan
- owner email/phone
- employee count
- health
- monthly usage
- payment state
- created date

Account detail tabs:

- Overview: account, owner, timezone, status, plan, MRR, health score
- Users: memberships, invites, roles, last login, MFA/passkey readiness
- Employees: employee cards, runtime, connectors, latest work
- Provisioning: jobs, number assignment, profile build proof, first SMS proof
- Connectors: Gmail, Stripe Connect, Twilio, LLM provider, secret refs
- Metering: work done, costs, rollups, budget policy
- Billing: AMTECH subscription, invoices, credits, tax status, payment method state
- Events: inbound events, employee messages, approvals, provider proofs
- Repairs: repair queue, replay history, suppressions, duplicate decisions
- Audit: operator actions, owner actions, tool actions

### Provisioning

Provisioning is a state machine, not a button.

Stages:

1. account created
2. owner phone verified
3. profile package selected
4. manifest validated
5. employee row created
6. number allocated
7. profile rendered
8. Caddy route written
9. runtime started
10. Twilio employee webhook configured
11. first SMS sent and proof captured
12. owner Work Surface session created
13. employee marked `live`

Every stage needs:

- state
- started/finished time
- proof id
- retryable flag
- repair action
- safe logs

Do not allow provisioning to silently succeed without provider proof. The MVP bar already requires provider-backed proof.

### Account Management

Minimum product-account features:

- update display name, slug, timezone
- invite/remove users
- change account roles
- verify or replace owner phone
- view employee status and connector status
- start OAuth flows for Gmail and Stripe Connect
- view plan, invoices, payment status, usage summaries
- request export/cancellation

Minimum operator features:

- create/update account state
- resend claim/onboarding link
- regenerate owner web session
- reassign phone number before go-live
- retry failed provisioning stage
- pause/resume employee
- force connector reauth
- suppress noisy source/event type
- replay inbound event
- redeliver work card or SMS
- override entitlement/budget policy with reason
- export account-safe diagnostic bundle

Sensitive operator features must require a reason and create an audit row.

### Health

Health should be a materialized summary over proof and checks, not manually edited text.

Health dimensions:

| Dimension | Source | Healthy Condition |
|---|---|---|
| Supabase | DB/storage/auth checks | migrations current, storage signed links work, RLS test passes |
| Manager | `/health`, tool registry | expected tools registered, internal token configured |
| Provisioner | `/provision/health` | authorized, host writable paths ready |
| Runtime | `runtime_endpoints.health`, Hermes smoke | webchat reachable, profile id matches employee |
| SMS | Twilio send/status proof | number assigned, A2P state acceptable, recent send ok |
| Gmail | `connector_accounts`, `gmail_watches` | connected, watch expires beyond threshold, history id advancing |
| Stripe Connect | `stripe_connections` | onboarding status known, `charges_enabled` as needed |
| LLM | provider health checks | model call succeeds, usage parsed or explicitly unknown |
| Metering | `usage_events` and future ledgers | rows emitted for key boundaries, rollup fresh |
| Billing | subscription/invoice state | not delinquent beyond policy |

Health scores:

- `green`: owner work can proceed
- `yellow`: degraded but owner-critical paths continue
- `red`: owner work blocked or trust-threatening
- `gray`: not configured or no signal

### Metering

Admin metering uses the metering architecture docs as source of truth. The admin system should expose:

- account cost today/month
- cost by employee, provider, model, connector, tool, run
- gross margin by pilot/customer
- expensive/failed runs
- budget alerts
- rollup freshness
- unknown-pricing rows

Owner account space should show work completed and plan usage, not raw token dashboards by default.

### Billing

There are two billing rails:

1. AMTECH subscription billing: setup fee, monthly plan, add-ons, credits, dunning, suspension policy.
2. Customer money movement: the owner's Stripe Connect account used by the employee to send deposit invoices and payment links to the owner's customers.

Rules:

- Never use Stripe Connect deposit activity as proof that the AMTECH subscription is paid.
- Never block provider webhook recording, repair, audit, cancellation, export, or security handling because of billing.
- Start with alert-only budget policies; use hard blocks only for noncritical outbound work after owner-visible policy exists.
- Keep MVP creation default-allow until monetization gates are intentionally enabled.

Suggested AMTECH subscription states:

- `free_mvp`
- `trial`
- `setup_due`
- `active`
- `past_due`
- `grace`
- `suspended`
- `cancelled`

### LLM Provider Connections

Admin requirements:

- global provider registry
- model route table per workload
- provider secret refs
- per-provider health check
- rate-limit capture
- retries with jitter/backoff
- fallback policy
- cost attribution
- structured-output support flag
- safe prompt/payload logging policy

Workload routes:

- `front_door_onboarding`
- `owner_message`
- `provider_event_triage`
- `daily_brief`
- `repair_summary`
- `artifact_generation`
- `evaluation`

For each route, store:

- primary provider/model
- fallback provider/model
- max input/output tokens or equivalent
- max cost per run
- timeout
- retry count
- streaming allowed
- strict JSON/structured-output required

### Operations

Core operator queues:

- provisioning failures
- connector reauth needed
- Gmail watch expiring within 48 hours
- Stripe Connect requirements due
- runtime unreachable
- Twilio/A2P pending or rejected
- event repair queue
- high-cost run
- failed provider webhook
- failed owner notification
- billing past due
- suspicious admin/support access

Core recurring jobs:

- Gmail watch renewal
- missed Gmail notification recovery by history sync
- reminder dispatch
- daily briefs
- runtime health checks
- connector health checks
- billing/dunning sync
- metering rollups
- provider cost table refresh
- audit export/archive
- stale provisioning job sweep

## 1000-User Operating Model

Assumption: "1000 users" means up to 1000 owner/users with roughly 500-1000 active accounts and 500-1000 active employees. The schema should not require a different architecture at that level, but operations need queues, summaries, and rate controls.

### Capacity Risks

- Twilio A2P registration and number inventory is a lead-time risk. Start brand/campaign work before volume.
- Gmail watch renewal scales linearly with connected mailboxes. Renew daily and alert before 48-hour expiry.
- Gmail notifications can be delayed or dropped. Keep history sync fallback.
- Stripe Connect onboarding state is asynchronous. Rely on webhooks plus account retrieval.
- LLM rate limits are organization/project/model scoped. Capture rate-limit headers and implement route-level fallback/degradation.
- Supabase RLS and indexes must cover every owner-readable summary. Raw admin ledgers should stay server-only.
- Runtime containment becomes the main scaling/security boundary. `local` backend is MVP only; Docker/VM/SSH backends are the pilot scale target.

### Needed Before 1000 Users

- admin roles and audited support access
- account health summaries
- provisioning queue with stage retries
- background worker for provider health and rollups
- LLM provider/model route table
- budget policies and alerting
- AMTECH subscription billing tables
- daily metering rollups
- admin-safe diagnostic bundles
- account export/cancellation path
- runtime backend migration plan from `local` to isolated workers
- load tests for owner message, provider webhook, scheduler, and Work Surface events

### Support Model

Target support ratios for 1000 users:

- one operator can handle routine health/repair if the admin panel has queueing, bulk filters, and one-click safe repair actions
- founder or senior operator handles payment exceptions, destructive actions, and trust incidents
- no direct production database edits for common support
- no manual provider-dashboard inspection for routine health

## Additive Data Model

These are proposed additions. Keep existing tables as source of truth until migrations are intentionally implemented.

### Platform access

- `platform_users`: Supabase auth user to platform operator profile
- `platform_roles`: role catalog
- `platform_user_roles`: role grants
- `support_access_sessions`: account-scoped support access with reason, expiry, approver, and audit refs

### Account administration

- `account_invitations`
- `account_state_transitions`
- `account_exports`
- `account_cancellations`
- `account_health_snapshots`

### Provisioning

- `provisioning_steps`: one row per stage per job
- `number_assignments`: durable assignment history beyond current `number_pool`
- `runtime_health_checks`

### Provider connections

- `provider_connections`: normalized connector/provider table across Gmail, Stripe, Twilio, LLM, Supabase
- `provider_health_checks`
- `provider_rate_limits`
- `provider_secret_refs`
- `oauth_reauth_requests`

### Billing

- `plans`
- `subscriptions`
- `subscription_items`
- `billing_invoices`
- `billing_payment_methods`
- `billing_events`
- `billing_credits`

### Operations

- `ops_tasks`
- `incidents`
- `incident_events`
- `admin_notifications`
- `diagnostic_bundles`

### LLM providers

- `llm_providers`
- `llm_model_routes`
- `llm_provider_health`
- `llm_rate_limit_observations`
- `llm_pricing_versions`

### Metering

Use the ledgers in [`metering-architecture.md`](metering-architecture.md): `work_runs`, `meter_events`, `tool_invocations`, `usage_rollups_daily`, `budget_policies`, and pricing versions.

## Security Rules

- Enable RLS on every table exposed to browser clients.
- Keep raw provider payloads, tokens, prompts, emails, PDFs, and webhook bodies out of admin logs.
- Store secret references only. Resolve secrets only inside Manager/provider wrappers.
- Never expose Supabase service role, provider keys, or Hermes internal tokens to browser code.
- Admin support access must be account-scoped, time-limited, reasoned, and audited.
- Destructive actions require confirmation, reason, and higher role.
- Prefer safe diagnostic bundles over unrestricted raw table views.
- Use Postgres `security_invoker` views when owner/admin-safe browser views are needed on Postgres 15+.
- Do not authorize off Supabase `user_metadata`.
- Do not assume JWT claims are fresh for immediate revocation; sensitive admin actions should check database role/session state server-side.

## MVP Scope

Build first:

- internal admin dashboard over accounts, employees, provisioning jobs, connectors, repair queue, audit log
- account detail page with safe tabs
- manual account status changes
- provisioning retry/resend actions
- connector reauth indicators
- runtime/provider health checks
- AMTECH billing state scaffold, default free/allow
- LLM provider registry and route config in admin-readable form
- metering summaries linked to current `usage_events`, then upgraded to the metering ledgers

Defer:

- self-service enterprise RBAC
- customer BYO LLM keys
- multi-employee account UI beyond schema support
- full automated dunning blocks
- custom Stripe Connect account onboarding changes
- data warehouse export
- SOC-style compliance reporting

## Done Definition

The admin system is minimally complete when AMTECH can answer and act on these questions without direct SQL:

- who owns this account and which employee is live?
- what stage did provisioning fail at, and can it be retried safely?
- is SMS/Gmail/Stripe/LLM/runtime healthy for this account?
- what work happened, what did it cost, and what proof ids justify it?
- is the AMTECH subscription healthy?
- what provider event failed or needs repair?
- which operator touched the account and why?
- what must be fixed before this account can trust the employee again?
