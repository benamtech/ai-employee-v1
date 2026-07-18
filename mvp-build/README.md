# mvp-build — the AMTECH AI Employee MVP build

> **2026-07-18 remediation note:** The active integration branch is
> `employee-production-tuesday`, based on `research`, with draft PR `#23`;
> `main` is untouched. The canonical launch path remains
> [`docs/production-normal-employee-live-deploy-runbook.md`](docs/production-normal-employee-live-deploy-runbook.md):
> public DNS/Cloudflare Tunnel -> Caddy -> Web/Manager -> real
> `/create-ai-employee` -> Twilio Verify -> account creation -> Start Employee
> -> isolated runtime -> owner surface -> provider-backed work and proof. Do not
> count `local:*`, `live:*`, fixture mode, `/api/dev/login`, or
> `prod-like:public-estimator:*` as launch proof.
>
> Current remediation status: the Phase 2 plan/registry is validated; Lane 1's
> relationship and authorization checkpoint is integrated at `b37d479...` with
> migrations `0039`/`0040` and a green five-case PostgreSQL relationship/RLS
> matrix. Lane 1 still requires complete route/resource scoping and real
> Supabase/browser/channel proof. Lane 3 PR `#26` has a green durable
> command/effect contract and a pre-implementation red database boundary; one
> scheduler-order-dependent concurrency assertion must be corrected before SQL
> implementation. Production Supabase still stops at `0031`; no new live
> runtime/provider/browser/commercial acceptance is claimed.

Status: **standard remediation is active. The existing owner product, Manager/Hermes runtime spine, model gateway, reconciler, ambient inbox, and proof harness remain source-wired/CI-accepted at their documented tiers, but the approved standard audit remains launch-blocking until all P0/P1 authority, isolation, durable-effect, protocol, deployment, and proof gates close.** See [`CODEGRAPH.md`](CODEGRAPH.md), [`memory/MEMORY.md`](memory/MEMORY.md), and [`second-half-plan/phase-2-standard-remediation-execution.md`](second-half-plan/phase-2-standard-remediation-execution.md).

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

Current priority: **close the approved standard's authority, isolation, durable-effect, and proof boundaries before production promotion.** The existing Docker/Caddy runtime substrate remains useful and its prior source/on-host evidence remains valid at the recorded tier, but it does not substitute for the new relationship-aware, replay-safe, release-bound acceptance gates.

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