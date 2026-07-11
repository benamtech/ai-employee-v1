# AI Employee Second-Half Current And Future State

**Status: active** · _Created 2026-07-09; brought current 2026-07-11. This is the wiki companion to [`../../mvp-build/second-half-plan/`](../../mvp-build/second-half-plan/): it summarizes what is actually built in `mvp-build/` today and what remains before free trials and paid pilots. It does not replace implementation records; it points agents to the plan and explains the product architecture. The authoritative per-phase status is `mvp-build/CODEGRAPH.md` §3._

## Why This Exists

The `mvp-build/` backend and the owner surfaces are now much further along than "finish the estimate app." The seven-phase second-half plan reframed the product as **the business-native materialization layer over Hermes Agent**, and Phases 2–5 of that plan are now **`source-wired`** — the surfaces, contracts, and routes exist in code with local typecheck/unit/build/lint proof. What is **not** yet done is (a) **live provider/runtime proof** (blocked on credentials, ~days out) and (b) the **production deploy/runtime-operations layer** that actually keeps the box running — see the readiness review linked below.

The core conclusion from the Hermes Workspace/WebUI/Desktop research still holds:

> AMTECH should not be a chat wrapper or a bespoke estimate app. It should be the business-native materialization layer over Hermes Agent.

The AI Employee is usable through web, SMS, signed preview links, and (as contracts) admin and future desktop/Deno clients, with all of those surfaces rendering the same underlying employee state.

## Current Application State (2026-07-11)

Backend / control plane — `source-wired`:

- **Manager control plane**: provisioning, tools, claims, owner messaging, artifacts, approvals, webhooks, scheduler, repair, metering, and resource routes.
- **Hermes profile package**: `packages/agent-template/` renders `SOUL.md`, `config.yaml`, workspace policy, Manager tool docs, brain files, skills, model config, toolsets, and Manager MCP server config.
- **Manager-as-MCP with scoped per-employee credentials**: the employee calls Manager tools natively over MCP; the shared bearer was replaced by per-employee scoped MCP credentials (`0023`), and `/manager/mcp` derives identity from the credential, not spoofable headers.
- **Schema-first Manager tools**: zod schemas + shared dispatch let HTTP and MCP reuse validation/gates/audit.
- **Runtime/event spine**: Hermes Sessions/Runs client, runtime endpoint records, DB-backed turn queue, channel/session/presence router, generic event ingress (two-door), triage/batching, and metering ledgers.
- **RLS closed and restart-safe**: migrations 0018-0021 (all public tables Manager-only, advisor-verified), turn-claim compare-and-swap, and a stuck-turn reaper.

Owner surfaces — now `source-wired` (live proof pending), not "future":

- **Web Work Surface is a multi-region employee desk**: Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, Settings-lite, and a preview pane, backed by a real Manager read model with SSE + poll fallback.
- **SMS ambient inbox + signed mobile Review**: a signed, scoped, expiring preview/action link mints a `WorkResource` and renders it at `/agent/[employeeId]/review` — a mobile-first page with sticky approve/reject/reply, inline media/document preview, and quiet receipts. SMS carries the link, not a rich payload. Owner approval now wakes the employee through the normal owner-turn path so approved work actually proceeds.
- **Tool-agnostic Connector Center + resurfacing**: `Connected` renders generic connected-business cards (`ConnectionSurface`) before raw connector rows; Today/Daily Brief compute "needs attention" from a `ResurfaceItem` projection over tasks and surface envelopes. This is the product use of the Phase 4 materialization/capability layer — the product thinks in "connected business capabilities," not Gmail/Stripe/QBO rows.
- **MCP-UI generative cards**: the agent emits a typed `table`/`schedule`/`diff`/`form` view that Manager compiles into a sandboxed `ui://` resource, with every action routed back through the approval gate.

Connectors — `source-wired`, live provider proof pending:

- **Gmail** (OAuth/watch/PubSub/history/send), **Stripe** (test-mode deposit invoices), and **QuickBooks Online accounting** (`qbo.stub.ts`: connector lifecycle, entity-name resolution with disambiguation, four approval-gated write previews + a single audited commit path, `query_quickbooks`, and P&L/Balance-Sheet/AR/AP reports, under a new `accounting` capability category).

Operator / factory — `source-wired`, live operator proof pending:

- An internal `/admin` console (dashboard, accounts, provisioning, repairs, providers, billing scaffold, readiness, materialization inspector, audited support actions) behind DB-backed platform roles + support-reason audit + server-side redaction. It is operator-facing, a distinct audience from the owner desk. Billing is a **scaffold** (trial/plan/state model + display), not automated collection or a paywall.

Still incomplete:

- **Live provider/runtime acceptance**: no real Twilio/Gmail/Stripe/Intuit/Hermes proof ids yet; the local model bridge returns tool-call JSON as text, so the tool-execution loop is not yet end-to-end proven.
- **Production deploy/runtime-operations layer**: see the readiness review — supervision, employee-container launch, Caddy reload, backups, observability, and egress are essentially unbuilt.

## Production Readiness Gap (2026-07-11)

A source audit found the product layer is far ahead of the **operational** layer. The box is not yet deployable or self-sustaining: nothing in the repo starts/supervises/restarts the core services or the employee containers, employee runtime launch is an undefined env string, a newly provisioned employee subdomain never routes (no `caddy reload`), and there is no backup/observability/egress story. The founder's call is to fix deployability and core-loop reliability **before** any further admin-panel or billing work. Details and sequencing:

- [`../../mvp-build/docs/production-deploy-readiness-review-2026-07-11.md`](../../mvp-build/docs/production-deploy-readiness-review-2026-07-11.md) — evidence-backed gap list.
- [`../../mvp-build/second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`](../../mvp-build/second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md) — the re-sequenced roadmap (docker-compose core + per-account employee containers; admin/billing parked).

## Remaining Work To Trial-Ready

The materialization/capability contracts are done; the remaining path is operational and proof-driven:

1. **Production deploy foundation** (no creds): docker-compose core services, a pinned/concrete employee container launch, Caddy reload wiring, per-employee lifecycle + reboot recovery, and a deploy path.
2. **Core loop working** (no creds): make the model bridge emit real tool calls and reprovision old profiles onto scoped MCP credentials, so a turn → Manager tool → artifact/approval round-trip is deterministically verifiable.
3. **Durability/observability/egress** (no creds): backup of Hermes profiles + workspaces, logs/alerting, default-deny egress from employee containers.
4. **Live provider/runtime acceptance** (on creds): run the Phase 1 harness for real proof ids.
5. **Free Trial / Paid Pilot Gate**: no trial starts until web, SMS, artifact previews, a generic non-estimate resource, live provider/runtime proof, admin repair, usage/cost visibility, and billing/account state are proven or explicitly waived in a dated launch decision.

The capability model the owner sees stays plain-language: "Email is connected," "I can draft invoices and bills," "Payments need setup," "I will ask before sending or spending."

## Relationship To Existing Wiki

This document updates the older Work Surface and graph-materialization framing:

- [`event-driven-office-and-generative-ui.md`](event-driven-office-and-generative-ui.md) remains the event/move/descriptor foundation.
- [`agent-inbox-and-channel-architecture.md`](agent-inbox-and-channel-architecture.md) remains the inbox/channel/session architecture.
- [`old-build-plan/15-interaction-reimagined-the-work-surface.md`](old-build-plan/15-interaction-reimagined-the-work-surface.md) remains the original Work Surface interaction thesis.
- [`principle-graph-materialization.md`](../principle-graph-materialization.md) remains the "one graph, many views" principle.
- [`principle-deliverable-driven-surfaces.md`](../principle-deliverable-driven-surfaces.md) remains the type-system principle for rendering deliverables.
- [`../../mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md`](../../mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md) is the newest detailed research addendum.

## Phase Map (status as of 2026-07-11)

| Phase | What Changes | Status |
|---|---|---|
| 0 | Current-state handoff | done |
| 1 | Preserve and close live gate | `source-wired`; live gate blocked on model/provider path |
| 2 | Owner Work Surface redesign | `source-wired`; live/browser proof pending |
| 3 | SMS ambient inbox and links | `source-wired`; live SMS proof pending |
| 4 | Tool-agnostic capability/rendering | `source-wired` (Connector Center + resurfacing are its product use) |
| 5 | Trial ops/admin/billing | `source-wired`; billing is scaffold only; live operator proof pending |
| 6 | Free trial/paid pilot readiness | planned; gated on live proof + deploy foundation |

The product-surface phases (2–4) are built. What remains before a real owner can be handed a trial is **operational**: the production deploy foundation, the working core tool-loop, durability/observability/egress, and live provider proof.

## Next Concrete Move

Per the [re-sequenced roadmap](../../mvp-build/second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md): build the **production deploy foundation** and get the **core tool-loop deterministically working** (both need no live credentials, and creds are ~days out), then run Phase 1 live acceptance when creds land. Admin-panel polish and billing are **parked** — Phase 5 is already source-wired and sufficient for a founder-operated first pilot. Do not upgrade any live gate without real provider/runtime proof ids.
