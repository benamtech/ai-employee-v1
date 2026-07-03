# Source Of Truth

Status: active

## Purpose

This reconciled packet prevents future agents from bouncing between the original build plan, implementation records, event-office addenda, and production docs. Use it as the current build plan for the next phase.

## Source Hierarchy

1. [`../../../identity.md`](../../../identity.md) and [`../../../CODEGRAPH.md`](../../../CODEGRAPH.md) - operating identity and workspace map.
2. This folder, [`./`](./) - current reconciled implementation plan. The **forward roadmap is [`phases/`](phases/)** (Phase 0 baseline + Phases 1-13); docs `02`/`03`/`04` are its supporting architecture/acceptance/admin-metering detail, and `05` is the retired Workstream A-H crosswalk.
3. [`../implementation-records/`](../implementation-records/) - factual source-level state and verification history.
4. [`../../../mvp-build/`](../../../mvp-build/) - actual source code and runnable build.
5. [`../event-driven-office-and-generative-ui.md`](../event-driven-office-and-generative-ui.md) - controlling forward design for event bus and Work Surface sequencing.
6. [`../../../mvp-build/docs/admin-system-architecture.md`](../../../mvp-build/docs/admin-system-architecture.md), [`../../../mvp-build/docs/admin-system-implementation-plan.md`](../../../mvp-build/docs/admin-system-implementation-plan.md), [`../../../mvp-build/docs/metering-architecture.md`](../../../mvp-build/docs/metering-architecture.md), and [`../../../mvp-build/docs/metering-implementation-plan.md`](../../../mvp-build/docs/metering-implementation-plan.md) - production operating layer.
7. [`../old-build-plan/`](../old-build-plan/) - original whole-product build packet and mechanics.

When this packet and the original build-plan packet disagree on sequencing, this packet wins. When this packet and implementation records disagree on what is actually wired, the implementation records and source code win.

## What Changed Since The Original Build Plan

- Phase 0-2 are source-wired: schema/security/tool seams, onboarding/account/provisioning, artifact and approval flow.
- Phase 3 Gmail is source-wired: OAuth/token custody, send, watch/history, Pub/Sub verification, reply normalization, work-event delivery.
- Phase 4 Stripe is source-wired: Connect test-mode account/account-link, deposit invoice, send, webhook verification, idempotency.
- Phase 5 is source-wired: owner-confirmed job reminders, due reminder dispatch, Gmail watch renewal, daily brief seam, descriptor-driven Work Surface.
- Phase 6/7 seams are source-wired: repair queue, event suppressions, event batches, Hermes job-run proof table, repair tools, redacted audit, generic source registry, `deliver_only` vs `wake_employee`, triage/batching seams, Work Surface SSE-shaped endpoint.
- Production admin and metering are now part of the build plan, not optional future notes.

## Rules That Still Do Not Move

- The owner only ever talks to one employee.
- Manager is a backend control plane, invisible to the owner.
- AMTECH account, Hermes profile, and runtime containment are separate concepts.
- Creation is not payment-gated in the MVP; entitlement scaffolding defaults to allow.
- Provider test mode is acceptable for Stripe; manually injected provider results are not acceptance.
- Secrets are by reference only.
- Raw provider payloads, tokens, prompts, email bodies, webhook bodies, and signatures do not belong in logs or admin payloads.
- Money/customer-facing actions require an approval gate.
- The Work Surface is typed and conformance-first. No open-ended agent-generated UI.

## Supabase Security Notes

Any new Supabase table in an exposed schema must be reviewed for Data API exposure, grants, and RLS. Do not rely on `user_metadata` for authorization. Use database-backed memberships/platform roles and server-side checks for privileged admin paths.
