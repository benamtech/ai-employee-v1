# Phase 0 — Baseline (current source-wired MVP)

Status: source-wired

## What this is

The starting line for the next era. Not a build phase — a **complete reference map** of what is
already wired in [`../../../../mvp-build/`](../../../../mvp-build/) and proven locally, so Phases 1–13
state their dependencies against a known base. The next era is scoped to *finishing and operating*
this loop, not rebuilding it. Original build detail: [`../../old-build-plan/`](../../old-build-plan/);
factual wiring history: [`../../implementation-records/`](../../implementation-records/) (current
record: `2026-06-30-phase-6-and-event-bus-record.md`).

## The loop that is source-wired

```text
signup/claim -> live employee -> estimate PDF -> approved Gmail send
  -> real Gmail customer reply event -> approved Stripe Connect test-mode deposit invoice
  -> internal job reminder
```

Source-level wiring exists for the full loop plus Phase-6/7 production seams. **Live provider/runtime
acceptance is not yet done** — that is Phase 1.

## Source tree (where the loop lives)

```text
mvp-build/
  apps/manager/src/        Manager control plane (tools, webhooks, runtime, orchestrator)
    server.ts              HTTP entry; tool route = the universal chokepoint
    orchestrator.ts        LLM-only web/SMS front-door orchestrator
    provisioner.ts         production-shaped HTTP provisioner
    tools/registry.ts      Manager tool registry  (+ types.ts)
    tools/*.stub.ts        tool modules: identity, provisioning, estimate, gmail, stripe, events, repair
    webhooks/{twilio,gmail,stripe}.ts   provider ingress + signature verification
    events/registry.ts     generic event-source registry seam
    lib/*.ts               artifacts, audit, secrets, signatures, gmail, pubsub, runtime, signed-links,
                           owner-session, profile-renderer, entitlements, orchestrator-model, event-triage,
                           employee-events
  apps/web/app/            Owner surfaces (Next.js)
    create-ai-employee/, claim/                    front door
    api/front-door/*                               onboarding APIs (send/check code, create-account, claim, provision, message)
    agent/[employeeId]/                            owner Work Surface (cards, deliverables, job folders, daily brief, receipts)
    api/employee/[employeeId]/*                    message, events, resources, approval/resolve, artifact output
  packages/shared/src/     typed contracts: tool-contracts, work-events, event-types, profile-package, routes, ids, envelope, manifest
  packages/db/             migrations 0001-0008 (+ src/index.ts runner)
  packages/agent-template/ employee workspace template + manager-tools.md
```

## Loop step → implementing modules

| # | Loop step | Primary modules | Migration |
|---|---|---|---|
| 1 | Owner signs up / claims (web + SMS) | `web/create-ai-employee`, `web/claim`, `web/api/front-door/*`, `manager/webhooks/twilio.ts`, `manager/orchestrator.ts` | `0001` |
| 2 | Verify phone + create AMTECH account | `web/api/front-door/{send-code,check-code,create-account}`, `manager/lib/twilio.ts`, `manager/tools/identity.stub.ts`, `manager/lib/owner-session.ts` | `0001`/`0002` |
| 3 | Manager provisions employee profile/runtime | `manager/provisioner.ts`, `manager/tools/provisioning.stub.ts`, `manager/lib/profile-renderer.ts`, `manager/lib/runtime.ts`, `shared/profile-package.ts` | `0003` |
| 4 | Owner asks for estimate (SMS/web) | `web/api/employee/[employeeId]/message`, `manager/orchestrator.ts`, `manager/lib/runtime.ts` | — |
| 5 | Employee creates PDF estimate artifact + signed link | `manager/tools/estimate.stub.ts`, `manager/lib/artifacts.ts`, `manager/lib/signed-links.ts`, `web/agent/[employeeId]/output/[artifactId]/route.ts` | `0004` |
| 6 | Owner approves Gmail send | `web/api/employee/[employeeId]/approval/resolve`, `web/agent/[employeeId]/components/{ApprovalCard,WorkCard}.tsx` | `0004` |
| 7 | Gmail sends the PDF | `manager/tools/gmail.stub.ts`, `manager/lib/{google-gmail,gmail-tokens,mime,oauth-state,secrets}.ts` | `0005` |
| 8 | Customer reply enters via Gmail Pub/Sub/history | `manager/webhooks/gmail.ts`, `manager/lib/pubsub.ts`, `manager/events/registry.ts`, `manager/lib/event-triage.ts`, `shared/work-events.ts` | `0005` |
| 9 | Employee/Manager notifies owner + proposes next | `manager/lib/employee-events.ts`, `manager/lib/twilio.ts`, `web/api/employee/[employeeId]/events`, `web/agent/[employeeId]/*` (Work Surface) | `0005` |
| 10 | Owner approves Stripe Connect deposit invoice | `web/api/employee/[employeeId]/approval/resolve`, `manager/tools/stripe.stub.ts` | `0004` |
| 11 | Stripe sends hosted invoice + webhook recorded | `manager/tools/stripe.stub.ts`, `manager/lib/stripe-signature.ts`, `manager/webhooks/stripe.ts` | `0001` |
| 12 | Employee records + fires internal reminder | `manager/tools/events.stub.ts` (`set_internal_reminder`, `dispatch_due_reminders`, `dispatch_daily_briefs`, `scheduler:tick`), `manager/tools/gmail.stub.ts` (`renew_expiring_watches`) | `0006` |

## Cross-cutting modules (every step inherits)

- **Tool chokepoint / audit / entitlements** — `manager/server.ts`, `manager/tools/registry.ts`, `manager/lib/audit.ts`, `manager/lib/entitlements.ts`. The tool route is the seam Phase 7 instruments for metering.
- **Secrets & signatures** — `manager/lib/secrets.ts` (by-reference only), `manager/lib/signature.ts` (Twilio), `manager/lib/stripe-signature.ts`, `manager/lib/pubsub.ts` (JWKS/OIDC). Phase 1 §8 forges all of these.
- **LLM front door** — `manager/orchestrator.ts`, `manager/lib/orchestrator-model.ts`. Phase 12 turns this into a registry-driven route.
- **Event-bus / repair seams (Phase 6/7 groundwork)** — `manager/events/registry.ts`, `manager/lib/event-triage.ts`, `manager/tools/repair.stub.ts`, `manager/tools/events.stub.ts`, migration `0007` (repair queue, source suppressions, event batches, `hermes_job_runs`, `deliver_only` vs `wake_employee`). Phases 3–5 promote these from seams to the live spine.
- **Typed contracts** — `packages/shared/src/*` (tool-contracts, work-events, event-types, profile-package, routes, ids, envelope, manifest). New phases extend these, not bypass them.
- **Metering seam (today)** — `usage_events` / `feature_checks` / `audit_log`; Phases 6–8 extend into full ledgers.

## Migration map

`0001_init` · `0002_rls` · `0003_phase1_profile_packages` · `0004_phase2_artifacts` ·
`0005_phase3_gmail` · `0006_phase5_reminders` · `0007_phase6_repair_and_jobs` ·
`0008_phase2_runtime_scheduler`. Phases 6/9/10/11/12/13
add **additive** migrations on top; existing tables stay source of truth until intentionally moved.

## Local proof

- `typecheck`, `build`, `lint` pass.
- **25 files / 124 unit tests pass.**
- RLS cross-account integration test skips cleanly without live Supabase credentials.

Local proof is real but is **not** provider/runtime acceptance.

## Seam handed forward

A source-complete loop with event-bus, repair, metering (`usage_events`), and admin seams already
present as stubs/scaffolds — Phases 1–13 turn these seams into live, instrumented, operable systems.

## Status

`source-wired` — locally green, provider/runtime acceptance pending (Phase 1).
