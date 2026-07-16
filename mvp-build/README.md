# mvp-build — the AMTECH AI Employee MVP build

> **2026-07-16 launch-run note:** For normal employee live deploy work, the
> default path is now [`docs/production-normal-employee-live-deploy-runbook.md`](docs/production-normal-employee-live-deploy-runbook.md).
> Use public DNS/Cloudflare Tunnel -> Caddy -> Web/Manager -> real
> `/create-ai-employee` -> Twilio Verify -> account creation -> Start Employee
> -> live owner web client -> provider-backed reply. Do **not** count
> `local:*`, `live:*`, fixture mode, `/api/dev/login`, or
> `prod-like:public-estimator:*` as launch proof.

Status: **the second-half plan's product surfaces are `source-wired` and the active owner MVP UI is now Avery-first — Home, Talk, Proof, Connected, Tell Avery, Needs your say, quiet Watching, exact approvals, and proof — with local fixture/headed UI proof. The broader product remains source-wired, not trial-ready: SMS signed Review, materialization/capability contracts, Connector Center/resurfacing, Gmail/Stripe/QuickBooks seams, MCP-UI cards, admin/ops scaffold, metering foundation, context-engineering substrate, and the Docker/Caddy runtime substrate are in source or locally proven as noted, but the remaining gap is the real VPS plus live provider/runtime acceptance (incl. funded provider-backed Hermes tool-loop proof). Admin-panel polish and billing remain parked. See [`docs/state-of-progress-2026-07-14.md`](docs/state-of-progress-2026-07-14.md) and [`CODEGRAPH.md`](CODEGRAPH.md) §3 for authoritative current status.** This is where the AMTECH AI Employee MVP gets built.

**Agent? Start with [`../identity.md`](../identity.md), [`../CODEGRAPH.md`](../CODEGRAPH.md), [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md)** (build-home guide), then [`docs/production-normal-employee-live-deploy-runbook.md`](docs/production-normal-employee-live-deploy-runbook.md) for any live normal-employee launch work, [`CODEGRAPH.md`](CODEGRAPH.md) (MVP source map), the current second-half plan **[`second-half-plan/`](second-half-plan/)**, and the in-repo durable memory **[`memory/`](memory/)** (read the newest handoff + the writing protocol).

Current second-half plan: **[`second-half-plan/`](second-half-plan/)**. Current wiki companion: **[`../wiki/MVP/second-half-current-and-future-state.md`](../wiki/MVP/second-half-current-and-future-state.md)**. Older reconciled build plan: **[`../wiki/MVP/build-plan-current/`](../wiki/MVP/build-plan-current/)**. Original whole-product packet: **[`../wiki/MVP/old-build-plan/`](../wiki/MVP/old-build-plan/)**. Implementation records live in **[`../wiki/MVP/implementation-records/`](../wiki/MVP/implementation-records/)**.

For UI contributors, start with **[`docs/ux/`](docs/ux/)** for the master UX system, research ledger, coverage audit, generative-UI frontier, and fixture/production policy. Then read the active **[`ui-redesign/`](ui-redesign/)** packet for the current owner MVP direction and screenshots. The old UI collaborator packet now lives at **[`docs/archive/ui-handoff-2026-07-14/`](docs/archive/ui-handoff-2026-07-14/)** as historical reference only; do not use it as the current starting point.

UI contributors can work without full infrastructure:

```bash
npm run ui:dev          # fixture-backed web client on :3000
npm run ui:browser      # headed browser against fixture data on :3200
npm run ui:test         # headless UI-only Playwright smoke
npm run ui:test:headed  # headed UI-only smoke
```

These commands use representative local Work Surface fixtures and do not require Manager, Supabase, Docker, Hermes containers, provider credentials, or model calls. They are for UI development, not provider/runtime acceptance. Fixture mode is guarded by [`docs/ux/06-fixture-production-ui-policy.md`](docs/ux/06-fixture-production-ui-policy.md) and must not be enabled in pod-like or production-like environments.

Current fixture-guarded screenshots are copied into [`ui-redesign/screenshots/`](ui-redesign/screenshots/)
from the latest local `npm run ui:test` proof:

![Avery-first desktop Home](ui-redesign/screenshots/work-surface-desktop.png)

![Avery-first mobile Home](ui-redesign/screenshots/work-surface-mobile.png)

![Proof surface](ui-redesign/screenshots/proof-desktop.png)

![Signed mobile Review](ui-redesign/screenshots/review-mobile.png)

Production admin design lives in [`docs/admin-system-architecture.md`](docs/admin-system-architecture.md) and the implementation sequence in [`docs/admin-system-implementation-plan.md`](docs/admin-system-implementation-plan.md). Production metering design lives in [`docs/metering-architecture.md`](docs/metering-architecture.md) and the implementation sequence in [`docs/metering-implementation-plan.md`](docs/metering-implementation-plan.md). Production UX organization lives in [`docs/ux/`](docs/ux/). The Phase 6 metering foundation is source-wired (six Manager-only ledgers + `run_id` threading, `lib/metering.ts` helpers); instrumentation coverage, rollups, and budget-policy enforcement remain later work.

## Hermes boundary

This product leverages **Hermes agent from Nous Research**, an open-source agent substrate. Hermes is the live
employee brain/profile/runtime; AMTECH's code is the product layer around it: provisioning, Manager tools, account
and session boundaries, SMS/web surfaces, connector events, approvals, artifacts, scheduler, repair, admin, and
metering.

Current priority: **run the proven orchestration substrate on the real VPS, then live proof of the core loop.**
The box is now demonstrably deployable and self-sustaining on a real Docker host: the docker-compose core
(`manager`/`web`/`caddy`) builds/starts/healthchecks on a host-owned `amtech_runtime` bridge, employee
containers are pinned (`hermes-agent:0.18.0`), launched, torn down, reinstated, and run concurrently, and
Docker-DNS + Caddy resolve each employee by its `amtech-hermes-<id>` alias. The Pod Alpha operator scripts and
runbook (`deploy:smoke`, `ops:caddy-proof`, `ops:reprovision-scoped-mcp`, `capacity:pod-alpha`, `ops:backup`,
`ops:restore`, `ops:red-health`, `ops:egress-policy`; see
[`docs/pod-alpha-runtime-runbook.md`](docs/pod-alpha-runtime-runbook.md)) captured passing
`infra/proofs/*.json` on-host (`deploy-smoke` 8/8, `caddy-proof`, `capacity` tier 5, `egress` dry-run,
lifecycle stop/gc/restart). What remains is the real VPS: crash/reboot auto-recovery proof
(`--restart=unless-stopped` is configured + verified, but a sandboxed dev daemon does not fire restart-on-kill),
durability/observability, egress `--apply` (root), a real capacity number (64GB node), and live
provider/runtime acceptance of the owner → tool → artifact/approval loop — before further admin/billing work
(see [`second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`](second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md)
and [`docs/production-deploy-readiness-review-2026-07-11.md`](docs/production-deploy-readiness-review-2026-07-11.md)).
The session model — one employee, one number, one continuous thread across SMS/web/future voice, with a Manager-owned
Channel/Session/Presence router (active session wins; ambient preferences when idle; silent events record without
push; duplicate intents never double-deliver) — is already source-wired, along with Hermes Runs/Sessions turn-atomic
handling and Jobs/worker lanes re-entering the Manager inbox.

## Product and UI grounding

AMTECH is not selling a model, an estimate generator, or a developer dashboard. AMTECH packages Hermes into a trusted small-business employee. Estimates are the first proof object, but the broader product is an employee that can help with customer intake, estimates, follow-ups, invoices, reminders, connector repair, web/media/document outputs, and future office workflows while asking before customer-facing, money, destructive, credential, or broad external actions.

The UI job is to make that power visible and safe:

- Web is the primary high-fidelity Avery interaction surface.
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
- Phase 1 acceptance harness exists and is locally verified; runtime/scheduler productionization is source-wired.
- Source-wired live-employee spine: real Hermes Sessions client, DB-backed per-employee turn queue, generic two-door
  event ingress, Channel/Session/Presence router, and Gmail-reply → live wake → validated work-event descriptors.
- Source-wired Avery-first owner MVP UI (second-half Phase 2 reset): Home / Talk / Proof / Connected with Tell Avery,
  inline Needs your say exact review, quiet Watching, Recent proof, optional work sheet, persisted conversation, live
  SSE + poll fallback, and durable screenshots in `ui-redesign/screenshots/`.
- Source-wired SMS ambient inbox + signed mobile Review (`/agent/[id]/review`): signed, scoped, expiring
  preview/action links render a `WorkResource`; approving carries the work forward to execution.
- Source-wired materialization/capability layer: `SurfaceEnvelope`/`WorkResource`/`WorkAction`/`CapabilityGraphNode`,
  a Manager capability registry, MCP `resources/list`+`read`, a tool-agnostic Connector Center (`ConnectionSurface`),
  and a resurfacing projection (`ResurfaceItem`).
- Source-wired QuickBooks Online accounting connector: connector lifecycle, entity-name resolution with
  disambiguation, approval-gated write previews + a single audited commit path, `query_quickbooks`, and P&L/BS/AR/AP
  reports (new `accounting` capability category).
- Source-wired MCP-UI generative cards: the agent emits a typed table/schedule/diff/form view that Manager compiles
  into a sandboxed `ui://` resource; card actions route through the same approval gate.
- Source-wired operator admin console (`/admin`): dashboard/accounts/provisioning/repairs/providers/billing-scaffold/
  readiness/support-actions behind DB-backed platform roles + support-reason audit + server-side redaction.
- Source-wired trust-boundary hardening: per-employee scoped MCP credentials (replacing the shared bearer), RLS
  closure (migrations 0018-0021, advisor-verified), turn-claim compare-and-swap, and a stuck-turn reaper.
- Source-wired Phase 6 metering foundation: six Manager-only ledgers + `run_id` threading.

## Planned or pending

- Live provider/runtime acceptance is still pending real Supabase/Twilio/Hermes/Caddy/Gmail/PubSub/Stripe
  credentials, host setup, and proof ids. The employee **LLM tool loop** closes on a real provider-backed
  Hermes model when funded creds land (the local model bridge is dead) — out of scope for the infra layer.
- The **production orchestration substrate is proven on a real Docker host** (compose core builds/starts/
  healthchecks; employee lifecycle + Docker-DNS/Caddy routing across a concurrent fleet; `infra/proofs/*.json`
  captured). What remains before it runs a paid pilot: prove it on the **real VPS** (incl. crash/**reboot
  recovery** — the `--restart=unless-stopped` policy is set + verified but the sandbox dev daemon doesn't fire
  restart-on-kill), **backups/DR + observability**, egress **`--apply`** (needs root), and a **real capacity
  number** (needs a ~64GB node; the tier-5 proof here is a small dev-box sample, not the 20-25 target). See
  [`docs/pod-alpha-runtime-runbook.md`](docs/pod-alpha-runtime-runbook.md).
- Metering instrumentation coverage, rollups, and budgets; further admin operations and AMTECH billing collection —
  all deliberately **parked** behind the deploy + core-loop work.
- Old rendered employee profiles predate the scoped-MCP-credential switch and need reprovisioning before real tenant use.

Two phase-numbered tracks exist and are **not** one sequence: the active **second-half plan**
([`second-half-plan/`](second-half-plan/), Phases 0-6) and the earlier reconciled module map
([`../wiki/MVP/build-plan-current/phases/`](../wiki/MVP/build-plan-current/phases/), Phases 0-13). Read a phase
number against its plan; **[`CODEGRAPH.md`](CODEGRAPH.md) §3 is the authoritative per-phase status.**

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
- Front-door model call: **OpenAI-compatible Chat Completions workflow** with strict `json_schema` structured output by default (`ORCHESTRATOR_API_BASE_URL`, `ORCHESTRATOR_API_KEY`/`XAI_API_KEY`/`xai_api_key`/`OPENAI_API_KEY`, `ORCHESTRATOR_MODEL`/`xai_model`) so OpenAI, Grok/xAI, or compatible providers can be swapped without rewriting onboarding state logic. Current prod default is xAI/Grok.

## Layout
```
apps/
  web/         # Next.js — front door (/create-ai-employee, /claim, /login), owner agent surface, signed artifact route
  manager/     # Node/TS control plane — tool registry, security libs, webhook routes, server
packages/
  shared/      # tool envelope, manifest (7-question), routes, event types, ids, tool contracts
  db/          # schema migrations 0001-0026 + migration runner + typed clients
  agent-template/  # the Hermes employee template (agent-as-files), rendered per client in Phase 1
infra/
  caddy/       # Caddyfile + per-client snippet template
  hermes/      # RUNBOOK.md (install + manual smoke test) — gates Phase 0 infra acceptance
  scripts/     # hermes-smoke + number-pool/healthcheck/repair seams
docs/          # UX system, production notes, admin, metering, QuickBooks connector, archive
ui-redesign/   # active owner MVP UI redesign packet and screenshots
tests/
  unit/        # security boundary, envelope, contracts, signed links, secrets, manifest
  integration/ # RLS cross-account denial (real Supabase) — skeleton
  golden-path/ # Step 1 Create Employee acceptance script — Phase 1
```

## How the base loop was built (history)

This section is the build log for the base whole-product loop (Phases 0-2 of the earlier reconciled plan) and stops
at that era. It is historical detail, not the current frontier — for **current status across all work read
[`CODEGRAPH.md`](CODEGRAPH.md) §3, [`docs/state-of-progress-2026-07-14.md`](docs/state-of-progress-2026-07-14.md),
and the newest [`memory/`](memory/) handoff**, and see "What works now" above for the
second-half surfaces (Avery-first owner UI, SMS Review, materialization/Connector Center/resurfacing, QuickBooks, MCP-UI, admin)
that now sit on top of this base. Migrations have since advanced to `0026`.

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
- The owner Work Surface (`apps/web/app/agent/[employeeId]/`) has since been rebuilt again into the active Avery-first
  MVP shape: Home / Talk / Proof / Connected, Tell Avery, inline Needs your say, quiet Watching, exact approval review,
  and Recent proof. The older descriptor-driven coworker surface and multi-region employee desk are historical context.
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
- `npm run test:unit`: **76 files / 488 tests** pass.
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

The `ui:*` commands use fixture data and avoid Manager, Supabase, Docker, Hermes, provider credentials, and model calls. `ui:test` warms the fixture Work Surface route and writes screenshots under `infra/.local/ui-fixtures/`; current durable packet screenshots are copied into `ui-redesign/screenshots/`.

> Before building, read [`../identity.md`](../identity.md) and [`../CODEGRAPH.md`](../CODEGRAPH.md), then `wiki/MVP/`.
