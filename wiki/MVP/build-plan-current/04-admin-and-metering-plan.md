# Admin And Metering Plan

Status: active

> Design detail for the operating-layer phases. Mapping into [`phases/`](phases/): metering -> **Phases 6-8**; admin identity/read-model -> **Phase 9**; admin operations surfaces -> **Phase 10**; AMTECH billing -> **Phase 11**; LLM provider registry -> **Phase 12**; 1000-user operating model -> **Phase 13**. The phase docs own the sequence and acceptance gates; this doc owns the table/field/chokepoint detail.

## Purpose

Admin and metering are now part of the build plan. They are required to operate paid pilots and to scale toward 1000 users. They are not optional dashboards.

## Admin System

The admin system has four surfaces:

| Surface | Audience | Purpose |
|---|---|---|
| Owner Work Surface | owner | use the employee, approvals, artifacts, proof receipts |
| Product Account Space | owner/admin | account settings, users, connectors, plan, billing, usage summaries |
| Operator Admin Panel | AMTECH | support, provisioning, health, repair, billing, metering, provider operations |
| Manager/Admin APIs | backend/internal workers | privileged write boundary and safe read models |

## Admin MVP Scope

Build first:

- `/admin` dashboard;
- `/admin/accounts`;
- `/admin/accounts/[accountId]`;
- `/admin/provisioning`;
- `/admin/repairs`;
- `/admin/providers`;
- admin-safe read endpoints over current tables;
- platform roles and support-access sessions;
- account health summary;
- provisioning queue and retries;
- connector/provider health;
- AMTECH billing state scaffold;
- current usage summary from `usage_events`;
- audit view and privileged-action reason capture.

## Admin Data Additions

Platform access:

- `platform_users`
- `platform_roles`
- `platform_user_roles`
- `support_access_sessions`

Account operations:

- `account_invitations`
- `account_state_transitions`
- `account_health_snapshots`
- `account_exports`
- `account_cancellations`

Provisioning:

- `provisioning_steps`
- `number_assignments`
- `runtime_health_checks`

Provider operations:

- `provider_connections`
- `provider_health_checks`
- `provider_rate_limits`
- `oauth_reauth_requests`

Billing:

- `plans`
- `subscriptions`
- `subscription_items`
- `billing_invoices`
- `billing_events`
- `billing_credits`

Operations:

- `ops_tasks`
- `incidents`
- `incident_events`
- `admin_notifications`
- `diagnostic_bundles`

LLM providers:

- `llm_providers`
- `llm_model_routes`
- `llm_provider_health`
- `llm_rate_limit_observations`
- `llm_pricing_versions`

All additions are additive. Existing MVP tables remain source of truth until migrations intentionally move reads/writes.

## Metering System

The production metering system extends current `usage_events`, `feature_checks`, and `audit_log`.

Core ledgers:

- `work_runs`
- `meter_events`
- `tool_invocations`
- `meter_pricing_versions`
- `usage_rollups_daily`
- `budget_policies`

Chokepoints:

- `/manager/tools/:name`;
- `callOpenAiCompatibleModel`;
- `deliverToRuntime`;
- `wakeEmployeeForEvent`;
- Twilio send/verify/webhooks;
- Gmail OAuth/profile/watch/history/send/message;
- Stripe account/account-link/invoice/webhook/replay;
- Supabase Storage upload/download/signed link;
- scheduler and repair tools.

## Billing Boundary

Admin must keep two rails separate:

- AMTECH subscription billing: setup fee, monthly plan, add-ons, credits, dunning, suspension.
- Owner Stripe Connect payments: contractor deposit invoices and payment links sent to the owner's customers.

Stripe Connect activity is not AMTECH subscription revenue. AMTECH billing state must not block inbound provider event recording, audit, export, cancellation, or repair.

## LLM Provider Registry

Admin must expose provider/model routing as a controlled operating surface:

- provider key/reference;
- base URL;
- model routes by workload;
- fallback policy;
- structured-output support;
- token/cost parsing;
- rate-limit observations;
- health checks;
- max cost per run;
- timeout/retry/backoff.

Workload routes:

- `front_door_onboarding`
- `owner_message`
- `provider_event_triage`
- `daily_brief`
- `repair_summary`
- `artifact_generation`
- `evaluation`

## Security Rules

- Platform operators are not normal members of every customer account.
- Support access is account-scoped, time-limited, reasoned, and audited.
- Owner/account browser reads use safe summaries only.
- Raw meter rows can stay Manager-only; owner/admin surfaces read safe summaries and rollups.
- RLS is enabled on exposed tables.
- Do not authorize off `user_metadata`.
- Do not expose service role, provider keys, Hermes tokens, or raw secret refs to browser code.
- Privileged admin actions require role, reason, confirmation where destructive, and audit row.

## 1000-User Operating Model

Before 1000 users, build:

- queue-based admin dashboard;
- account health snapshots;
- provisioning step retries;
- provider health jobs;
- Gmail watch renewal and fallback history sync;
- metering rollups;
- budget alerts;
- billing sync;
- incident records;
- diagnostic bundle export;
- cancellation/export/retention workflow;
- runtime containment beyond `local`.

The goal is that one operator can scan accounts by health queues, not inspect raw tables.
