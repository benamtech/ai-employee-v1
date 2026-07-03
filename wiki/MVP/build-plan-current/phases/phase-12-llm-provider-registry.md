# Phase 12 — LLM Provider Registry

Status: planned

## Goal / Module

Make model/provider routing an **observable, configurable, metered, credential-safe** operating
surface — not hard-coded env. Workloads route by key; production changes are audited.

## Depends on

- Phase 6–7 (metering, so provider usage/cost attaches to runs).
- Phase 9 (admin foundations, for the controlled surface + audited changes).
- Design detail: [`../04-admin-and-metering-plan.md`](../04-admin-and-metering-plan.md) (LLM Provider Registry).

## Surface (code + schema)

Tables (additive):

- `llm_providers`, `llm_model_routes`, `llm_provider_health`, `llm_rate_limit_observations`, `llm_pricing_versions`.

Workload routes by key: `front_door_onboarding`, `owner_message`, `provider_event_triage`,
`daily_brief`, `repair_summary`, `artifact_generation`, `evaluation`.

## Build tasks

- Add provider/model-route schema; store **secret refs only** (no keys in DB/browser).
- Route each workload by key; add fallback/degrade policy and structured-output support flags.
- Capture health checks + rate-limit observations; parse token/cost into metering (Phase 7).
- Audit production route changes; require elevated role + reason.

## Acceptance proof

- An operator can view and **safely change nonproduction** routes.
- A production route change requires elevated role + reason and leaves an audit row.
- A provider failure **degrades or alerts predictably** (fallback exercised).

## Seam handed forward

Controlled, metered model routing that Phase 13's load tests and incident workflows depend on.

## Status

`planned`.
