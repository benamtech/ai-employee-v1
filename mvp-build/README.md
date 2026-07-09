# mvp-build — the AMTECH AI Employee MVP build

Status: **Second-half Phase 1 is source/static-green with live gate blocked by model/provider availability; second-half Phase 2 web Work Surface is source-wired; Phase 3 SMS signed previews, Phase 4 materialization contracts, and trial/admin/billing readiness remain planned/pending.** This is where the AMTECH AI Employee MVP gets built.

**Agent? Start with [`../identity.md`](../identity.md), [`../CODEGRAPH.md`](../CODEGRAPH.md), [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md)** (build-home guide), then [`CODEGRAPH.md`](CODEGRAPH.md) (MVP source map), the current second-half plan **[`second-half-plan/`](second-half-plan/)**, and the in-repo durable memory **[`memory/`](memory/)** (read the newest handoff + the writing protocol).

Current second-half plan: **[`second-half-plan/`](second-half-plan/)**. Current wiki companion: **[`../wiki/MVP/second-half-current-and-future-state.md`](../wiki/MVP/second-half-current-and-future-state.md)**. Older reconciled build plan: **[`../wiki/MVP/build-plan-current/`](../wiki/MVP/build-plan-current/)**. Original whole-product packet: **[`../wiki/MVP/old-build-plan/`](../wiki/MVP/old-build-plan/)**. Implementation records live in **[`../wiki/MVP/implementation-records/`](../wiki/MVP/implementation-records/)**.

For UI contributors, start with **[`ui-handoff/`](ui-handoff/)** after the core orientation docs. It explains the product grounding, current UI source map, research/principles, future surface experiments, and parallel working protocol.

UI contributors can work without full infrastructure:

```bash
npm run ui:dev          # fixture-backed web client on :3000
npm run ui:browser      # headed browser against fixture data on :3200
npm run ui:test         # headless UI-only Playwright smoke
npm run ui:test:headed  # headed UI-only smoke
```

These commands use representative local Work Surface fixtures and do not require Manager, Supabase, Docker, Hermes containers, provider credentials, or model calls. They are for UI development, not provider/runtime acceptance.

Production admin design lives in [`docs/admin-system-architecture.md`](docs/admin-system-architecture.md) and the implementation sequence in [`docs/admin-system-implementation-plan.md`](docs/admin-system-implementation-plan.md). Production metering design lives in [`docs/metering-architecture.md`](docs/metering-architecture.md) and the implementation sequence in [`docs/metering-implementation-plan.md`](docs/metering-implementation-plan.md). Current code has `usage_events`, `feature_checks`, and `audit_log`; production metering still needs run ids, typed meter events, wrapper instrumentation, rollups, and budget policies.

## Hermes boundary

This product leverages **Hermes agent from Nous Research**, an open-source agent substrate. Hermes is the live
employee brain/profile/runtime; AMTECH's code is the product layer around it: provisioning, Manager tools, account
and session boundaries, SMS/web surfaces, connector events, approvals, artifacts, scheduler, repair, admin, and
metering.

Current session-management priority: finalize the layer around the current Hermes employee session. The target model
is one employee, one number, one continuous thread across SMS/web/future voice. Hermes Runs/Sessions are treated as
turn-atomic; durable work should use Jobs/worker lanes and re-enter the Manager's universal inbox. The planned
Channel/Session/Presence router decides where employee output lands: active session wins, ambient preferences apply
when no session is active, silent events record without push, and duplicate intents never double-deliver.

## Product and UI grounding

AMTECH is not selling a model, an estimate generator, or a developer dashboard. AMTECH packages Hermes into a trusted small-business employee. Estimates are the first proof object, but the broader product is an employee that can help with customer intake, estimates, follow-ups, invoices, reminders, connector repair, web/media/document outputs, and future office workflows while asking before customer-facing, money, destructive, credential, or broad external actions.

The UI job is to make that power visible and safe:

- Web is the primary high-fidelity employee desk.
- SMS is the ambient inbox and approval path.
- Signed links are scoped mobile previews/actions.
- Admin is the operator proof/repair surface.
- Future desktop/customer/email surfaces should render the same underlying work/resources/actions.

Use `../wiki/` for product vision, strategy, research, and rationale. Use this `mvp-build/` folder for actual implementation state, source, tests, scripts, memory, and proof. If the wiki vision and source differ, do not assume the vision is built; check `CODEGRAPH.md`, `memory/MEMORY.md`, newest memory notes, and source.

## What works now

- Source-wired onboarding/claim/account/provisioning for a contractor-estimator employee package.
- Source-wired web + SMS employee contact paths that route owner messages to the runtime endpoint.
- Source-wired estimate artifact flow: Manager-backed PDF artifact rows, private storage, signed links, approvals,
  and owner Work Surface rendering.
- Source-wired Gmail connector/event seams: OAuth/token custody, send/watch/history/PubSub verification, reply
  normalization, typed work-event delivery.
- Source-wired Stripe test-mode seams: Connect account/account-link, deposit invoice create/send behind approval,
  signed webhook handling, paid-invoice events.
- Source-wired close-the-loop scheduler/reminder seams: owner-confirmed internal reminders, due reminder dispatch,
  Gmail watch renewal, daily briefs, runtime health snapshots.
- Source-wired repair/event-bus seams: repair tools, source suppression, triage/batching, `deliver_only` vs
  `wake_employee`, generic event-source registry, Work Surface SSE-shaped snapshot route.
- Phase 1 acceptance harness exists and is locally verified; Phase 2 runtime/scheduler productionization is
  source-wired.

## Planned or pending

- Live provider/runtime acceptance is still pending real Supabase/Twilio/Hermes/Caddy/Gmail/PubSub/Stripe
  credentials, host setup, and proof ids.
- Phase 3: generic ingress and event routing is source-wired; live provider proof pending.
- Phase 3A: minimal Channel/Session/Presence router is source-wired; live provider proof pending.
- Phase 4: live employee wake path core is source-wired against Hermes Sessions; runtime proof pending.
- Phase 5: triage, batching, and live Work Surface stream.
- Phases 6-13: metering foundation/instrumentation/rollups, admin foundations/ops surfaces, AMTECH billing scaffold,
  LLM provider registry, and 1000-user operations.

The detailed phase specs live in [`../wiki/MVP/build-plan-current/phases/`](../wiki/MVP/build-plan-current/phases/).

## The MVP bar (whole product)
```
signup/claim → live employee (SMS + web) → walkthrough→estimate → real PDF + signed link
  → approved Gmail send → real Gmail customer-reply event
  → approved Stripe Connect test-mode deposit invoice → internal job reminder
```
Every claimed capability must leave provider-backed proof (Twilio SID, Gmail/Stripe ids, artifact id, approval id, runtime health record). Provider test mode is allowed (Stripe); manually injected provider results are **not** acceptance.

## Stack (locked)
- **TypeScript/Node monorepo** (npm workspaces — pnpm/corepack weren't available; layout is identical).
- **Hosted Supabase**: Postgres (migrations) + Auth (email/password) + Storage (artifacts).
- **Single VPS** runs Hermes (Python engine), Docker-contained employee runtimes, the Manager, per-employee gateways, Caddy, and the Next.js web app (`next start`). Production-like laptop testing also uses Docker + Caddy/tunnel; the `local` backend is dev/demo only.
- **Twilio Verify** for phone; **10DLC long codes** for employee/front-door numbers (A2P registration is a long-lead item — start Day 1).
- Front door: **web + SMS both** (built in Phase 1).
- Front-door model call: **OpenAI-compatible Chat Completions workflow** with strict `json_schema` structured output by default (`ORCHESTRATOR_API_BASE_URL`, `ORCHESTRATOR_API_KEY`/`XAI_API_KEY`/`OPENAI_API_KEY`, `ORCHESTRATOR_MODEL`) so OpenAI, Grok/xAI, or compatible providers can be swapped without rewriting onboarding state logic.

## Layout
```
apps/
  web/         # Next.js — front door (/create-ai-employee, /claim, /login), owner agent surface, signed artifact route
  manager/     # Node/TS control plane — tool registry, security libs, webhook routes, server
packages/
  shared/      # tool envelope, manifest (7-question), routes, event types, ids, tool contracts
  db/          # full schema migrations (0001 init + 0002 RLS) + migration runner + typed clients
  agent-template/  # the Hermes employee template (agent-as-files), rendered per client in Phase 1
infra/
  caddy/       # Caddyfile + per-client snippet template
  hermes/      # RUNBOOK.md (install + manual smoke test) — gates Phase 0 infra acceptance
  scripts/     # hermes-smoke + number-pool/healthcheck/repair seams
docs/          # production architecture notes, including metering
ui-handoff/    # UI contributor packet: product grounding, current UI map, research, future surfaces
tests/
  unit/        # security boundary, envelope, contracts, signed links, secrets, manifest
  integration/ # RLS cross-account denial (real Supabase) — skeleton
  golden-path/ # Step 1 Create Employee acceptance script — Phase 1
```

## Current Phase 1 slice
Phase 0 foundation remains in place: full data model, Manager tool surface, security helpers, provider setup inventory, Hermes/Caddy runbook, and unit harness.

Phase 1 wires the real claim-to-live-employee path:

- LLM-only front-door orchestrator at `POST /manager/orchestrator/web`, backed by the OpenAI-compatible model adapter in `apps/manager/src/lib/orchestrator-model.ts`; set `ORCHESTRATOR_RESPONSE_FORMAT=json_object` only when a chosen provider rejects strict `json_schema`.
- Web front door and SMS front-door claim flow.
- Twilio Verify tools, inbound SMS proof, single-use claim tokens, account creation, and owner web session.
- Production-shaped HTTP provisioner at `POST /provision`.
- Vertical-agnostic profile package model; first package is `contractor_estimator`.
- Post-claim profile rendering, validation hook, runtime start hook, Caddy snippet, Twilio employee webhook setup, and first live SMS proof.
- Authenticated owner web route `/agent/{employee_id}` and employee SMS webhook both route to the same runtime endpoint.

Phase 2 wires the estimate artifact and approval path:

- Manager tools create estimate artifact rows, accept employee-created PDF bytes, upload them to private Supabase Storage, mint signed artifact links, and audit access.
- `/agent/{employee_id}/output/{artifact_id}` resolves signed links or owner sessions through Manager and redirects to short-lived Supabase Storage URLs.
- Owner web UI lists recent artifacts and pending approvals; approval buttons resolve the same Manager approval primitive used by SMS/web.
- The employee package instructs the Estimate skill to create the PDF file itself, then call Manager for registration, storage, link creation, and approval gates.
- Phase 3 Gmail source wiring now includes Google OAuth token exchange/refresh by sealed secret reference, connector tests, MIME/base64url send with PDF attachments, Gmail watch/history sync, Pub/Sub decoding plus JWKS-backed authenticated push verification, reply dedupe, owner-phone SMS delivery lookup, and typed work-event descriptor delivery.
- Work-event rendering is wired through shared `WorkEventDescriptor` types: Gmail replies, Stripe paid events, approvals, connector status, proof receipts, and messages can render as notify/question/review cards and SMS prompts driven by deliverable/work-event descriptors.
- Phase 4 Stripe source wiring now includes test-mode connected account creation, authenticated account links, onboarding status checks, deposit invoice draft/create/send tools, approval-gated invoice send, idempotency keys, hosted invoice URL proof, signed webhook processing, and typed paid-invoice work events.

Phase 5 closes the loop and adds the first scheduler seam:

- `set_internal_reminder` now takes an owner-confirmation gate (`approval_id` → `set_job_reminder`) and an employee-written `message`, creating `job_commitments` + `reminders` rows (additive migration `0006_phase5_reminders.sql`).
- `dispatch_due_reminders` fires due reminders by SMS (idempotent) and `renew_expiring_watches` renews Gmail watches before expiry.
- The owner Work Surface (`apps/web/app/agent/[employeeId]/`) was rebuilt into a descriptor-driven coworker surface: a daily brief, job folders (estimate→reply→deposit→reminder), notify/question/review cards with an iterative "no, tweak this" feedback loop, the confirmation gate as a decision card, per-`DeliverableType` renderers, and quiet provider-proof receipts — no raw payloads, no tool names.
- Phase 6/7 source seams add `0007_phase6_repair_and_jobs.sql`, repair tools (`replay_*`, relink, duplicate, redeliver, suppress, regenerate onboarding link), safe audit redaction, source suppression, triage/batching, stored `[SILENT]` daily briefs, auto-bound approvals for gated work cards, `deliver_only` vs `wake_employee` routing, a generic event-source registry, and a Work Surface SSE endpoint with polling fallback.

New-era Phase 2 runtime/scheduler productionization is source-wired:

- Docker is the default runtime backend (`HERMES_BACKEND_TYPE=docker`); explicit `local` remains dev/demo only and is reported as degraded runtime health.
- Profile rendering receives `runtime_backend` and writes it into the Hermes profile config instead of hard-coding `local`.
- `/manager/scheduler/run` is the protected scheduler boundary for reminders, Gmail watch renewal, daily briefs, and runtime health snapshots.
- `npm run scheduler:hermes-jobs` is the production-oriented Hermes Jobs entrypoint; `npm run scheduler:tick` is the dev/manual fallback. Both write `hermes_job_runs`; only real Hermes job ids can prove runtime acceptance.
- Migration `0008_phase2_runtime_scheduler.sql` adds `runtime_health_checks` and job-run metadata (`runner_type`, `external_job_id`, `error`).
- `ops:healthcheck` persists runtime health snapshots and updates `runtime_endpoints.health`.

Provider/runtime acceptance still requires real Supabase/Twilio/Hermes/Caddy/Gmail/Stripe environment variables and host setup (see the implementation record's pending table).

Current local checks:

- `npm run typecheck` passes.
- `npm run test:unit` passes: **26 files / 128 tests** (includes forged-request, runtime/scheduler, ingress, router, and wake-path coverage).
- `npm run test:integration` (env-gated RLS + cross-account artifact denial) skips cleanly without live Supabase creds.
- `npm run build` passes.
- `npm run lint` passes.
- `npm run acceptance:preflight` reports all 8 acceptance runs blocked with the exact missing env; `npm run acceptance:report` reports them not-run (no fabricated proof) until live creds are present.

Important boundary: this implementation does **not** run the full
`codegraphtheory/hermes-profile-template` prompt-to-new-profile-repository
authoring loop after claim. It renders a selected AMTECH profile package from
validated params and records the build. New vertical packages can be authored
with a `hermes-profile-template`-style pipeline outside the claim path, then
registered in `profile_packages` for provisioning.

## Run
```
cp .env.example .env        # fill Twilio, Supabase, Hermes, signing secrets
npm install
npm run build               # typecheck/compile all workspaces
npm run test:unit           # security + contract unit tests
npm run db:migrate          # apply migrations to hosted Supabase (needs DATABASE_URL)
npm run test:integration    # real RLS cross-account test (skips without Supabase creds)
npm run smoke:hermes        # env check + manual smoke-test steps
npm run manager:dev         # Manager API on :8080
npm run web:dev             # Next.js on :3000
npm run ui:dev              # UI-only fixture web client on :3000 (no Manager/Docker/env)
npm run ui:browser          # UI-only fixture headed browser on :3200
npm run ui:test             # UI-only Playwright smoke against fixture data
npm run ui:test:headed      # UI-only headed Playwright smoke
npm run scheduler:tick      # fire reminders + renew watches + emit daily briefs (cron/dev fallback)
npm run scheduler:hermes-jobs # Hermes Jobs / production scheduler entrypoint
npm run acceptance:preflight # Phase 1: which acceptance runs are runnable with current env
npm run acceptance:report    # Phase 1: run the 8 verifiers, write infra/acceptance/reports/
```

The `ui:*` commands use fixture data and avoid Manager, Supabase, Docker, Hermes, provider credentials, and model calls. `ui:test` warms the fixture Work Surface route and writes desktop/mobile screenshots under `infra/.local/ui-fixtures/`.

> Before building, read [`../identity.md`](../identity.md) and [`../CODEGRAPH.md`](../CODEGRAPH.md), then `wiki/MVP/`.
