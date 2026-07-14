# AI Employee Second-Half Current And Future State

**Status: active** · _Created 2026-07-09; brought current 2026-07-14. This is the wiki companion to [`../../mvp-build/second-half-plan/`](../../mvp-build/second-half-plan/): it summarizes what is actually built in `mvp-build/` today and what remains before free trials and paid pilots. It does not replace implementation records; it points agents to the plan and explains the product architecture. The authoritative per-phase status is `mvp-build/CODEGRAPH.md` §3, [`../../mvp-build/docs/state-of-progress-2026-07-14.md`](../../mvp-build/docs/state-of-progress-2026-07-14.md), and the UX organization layer in [`../../mvp-build/docs/ux/`](../../mvp-build/docs/ux/)._

## Why This Exists

The `mvp-build/` backend and the owner surfaces are now much further along than "finish the estimate app." The seven-phase second-half plan reframed the product as **the business-native materialization layer over Hermes Agent**, and Phases 2–5 of that plan are now **`source-wired`** — the surfaces, contracts, and routes exist in code with local typecheck/unit/build/lint proof. The **production orchestration substrate is now proven on a real Docker host** (compose core builds/starts/healthchecks; per-employee containers provision/teardown/reinstate + run concurrently with Docker-DNS/Caddy routing — see the readiness section below). What is **not** yet done is (a) **live provider/runtime proof** (blocked on credentials, ~days out; incl. the employee LLM tool loop, which closes on a funded provider-backed Hermes model) and (b) taking that substrate to the **real VPS** with crash/reboot recovery, durability/observability, and default-deny egress applied.

The core conclusion from the Hermes Workspace/WebUI/Desktop research still holds:

> AMTECH should not be a chat wrapper or a bespoke estimate app. It should be the business-native materialization layer over Hermes Agent.

The AI Employee is usable through web, SMS, signed preview links, and (as contracts) admin and future desktop/Deno clients, with all of those surfaces rendering the same underlying employee state.

## Current Application State (2026-07-14)

Backend / control plane — `source-wired`:

- **Manager control plane**: provisioning, tools, claims, owner messaging, artifacts, approvals, webhooks, scheduler, repair, metering, and resource routes.
- **Hermes profile package**: `packages/agent-template/` renders `SOUL.md`, `config.yaml`, workspace policy, Manager tool docs, brain files, skills, model config, toolsets, and Manager MCP server config.
- **Manager-as-MCP with scoped per-employee credentials**: the employee calls Manager tools natively over MCP; the shared bearer was replaced by per-employee scoped MCP credentials (`0023`), and `/manager/mcp` derives identity from the credential, not spoofable headers.
- **Schema-first Manager tools**: zod schemas + shared dispatch let HTTP and MCP reuse validation/gates/audit.
- **Runtime/event spine**: Hermes Sessions/Runs client, runtime endpoint records, DB-backed turn queue, channel/session/presence router, generic event ingress (two-door), triage/batching, and metering ledgers.
- **RLS closed and restart-safe**: migrations 0018-0021 (all public tables Manager-only, advisor-verified), turn-claim compare-and-swap, and a stuck-turn reaper.

Owner surfaces — now `source-wired` (live proof pending), not "future":

- **Web owner MVP UI is Avery-first**: Home, Talk, Proof, and Connected, centered on Tell Avery, Needs your say,
  quiet Watching, exact approvals, and proof. This supersedes the older multi-region employee desk and rejected
  chat-native agent desktop directions. The route is backed by the same Manager read model, persisted conversation,
  SSE + poll fallback, `WorkResource` / `WorkAction` review contracts, and local fixture/headed UI proof.
- **SMS ambient inbox + signed mobile Review**: a signed, scoped, expiring preview/action link mints a `WorkResource` and renders it at `/agent/[employeeId]/review` — a mobile-first page with sticky approve/reject/reply, inline media/document preview, and quiet receipts. SMS carries the link, not a rich payload. Owner approval now wakes the employee through the normal owner-turn path so approved work actually proceeds.
- **Tool-agnostic Connector Center + resurfacing**: `Connected` renders generic connected-business cards (`ConnectionSurface`) before raw connector rows; Today/Daily Brief compute "needs attention" from a `ResurfaceItem` projection over tasks and surface envelopes. This is the product use of the Phase 4 materialization/capability layer — the product thinks in "connected business capabilities," not Gmail/Stripe/QBO rows.
- **MCP-UI generative cards**: the agent emits a typed `table`/`schedule`/`diff`/`form` view that Manager compiles into a sandboxed `ui://` resource, with every action routed back through the approval gate.

Connectors — `source-wired`, live provider proof pending:

- **Gmail** (OAuth/watch/PubSub/history/send), **Stripe** (test-mode deposit invoices), and **QuickBooks Online accounting** (`qbo.stub.ts`: connector lifecycle, entity-name resolution with disambiguation, four approval-gated write previews + a single audited commit path, `query_quickbooks`, and P&L/Balance-Sheet/AR/AP reports, under a new `accounting` capability category).

Operator / factory — `source-wired`, live operator proof pending:

- An internal `/admin` console (dashboard, accounts, provisioning, repairs, providers, billing scaffold, readiness, materialization inspector, audited support actions) behind DB-backed platform roles + support-reason audit + server-side redaction. It is operator-facing, a distinct audience from the owner desk. Billing is a **scaffold** (trial/plan/state model + display), not automated collection or a paywall.

Still incomplete:

- **Live provider/runtime acceptance**: no real Twilio/Gmail/Stripe/Intuit/Hermes proof ids yet. The employee **LLM tool loop** closes on a real provider-backed Hermes model when funded creds land (the throwaway local model bridge is dead — not used, not fixed); it is a separate concern from the infra layer.
- **Real-VPS run + durability/egress**: the orchestration substrate is proven on a real Docker host locally, but crash/**reboot auto-recovery** (the `--restart=unless-stopped` policy is set + verified, but a sandboxed dev daemon doesn't fire restart-on-kill), **backups/DR + observability**, egress **`--apply`** (needs root), and a **real capacity number** (needs a ~64GB node) still have to be proven on the VPS.

Recent context-engineering substrate — `source-wired`, live Hermes/provider proof pending:

- **CE-1**: business brain is an integrated reference/index layer, with Hermes-native memory files and a once-per-session
  Manager primer rather than per-turn digest injection.
- **CE-2/CE-3**: compression/delegation/hook config, the `amtech-hygiene` plugin, data-driven event routing, and Manager-owned
  session rotation/carryover are in source.
- **CE-4**: connector custody/readiness is generalized through a shared registry; direct read-only MCP projection is allowed
  where safe, while write/money/customer-facing work stays Manager-mediated.

UX organization — active:

- **Master UX system**: `../../mvp-build/docs/ux/` now organizes Aqua HIG translation, current surface map,
  implementation coverage, generative UI frontier, fixture/production policy, and the post-release UI roadmap.

## Production Readiness: Substrate Proven On-Host (2026-07-11)

A source audit on 2026-07-11 found the product layer far ahead of the **operational** layer — nothing started/supervised the core services or employee containers, employee launch was an undefined env string, a newly provisioned subdomain never routed, and there was no backup/observability/egress story. The founder's call was to fix deployability and orchestration reliability **before** any further admin-panel or billing work. Those P0 gaps are now closed and **proven on a real Docker host** (this proves the orchestration substrate, not the employee's intelligence — the LLM tool loop is a separate, funded-creds concern):

- **docker-compose core** (`manager`/`web`/`caddy`) builds, starts, and healthchecks on a host-owned `amtech_runtime` bridge, with `restart: unless-stopped` and correct start-order.
- **Employee-container lifecycle** is real: version-pinned launch (`hermes-agent:0.18.0`), teardown, GC, reinstatement, and concurrent multi-container operation.
- **Docker-DNS + Caddy routing** works fleet-wide: employees join `amtech_runtime` with an `amtech-hermes-<id>` alias, Caddy resolves each by alias, and `employee → manager:8080` resolves. Caddy activation has write → validate → reload → rollback wiring.
- Captured `infra/proofs/*.json`: `deploy-smoke` 8/8, `caddy-proof` (validate/reject/rollback/liveness), `capacity` tier 5 (5 concurrent employees, 0 DNS failures — a small dev-box sample, **not** the 20-25 target), `egress-policy` dry-run (default-deny `DOCKER-USER` design).

Still owed on the **real VPS**: crash/reboot auto-recovery proof (a sandboxed dev daemon doesn't fire restart-on-kill; the policy is configured + verified), backups/DR + observability, egress `--apply` (root), a real capacity number (64GB node), and live provider/runtime acceptance. Details and sequencing:

- [`../../mvp-build/docs/production-deploy-readiness-review-2026-07-11.md`](../../mvp-build/docs/production-deploy-readiness-review-2026-07-11.md) — the original evidence-backed gap list (point-in-time record).
- [`../../mvp-build/second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md`](../../mvp-build/second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md) — the re-sequenced roadmap (docker-compose core + per-account employee containers; admin/billing parked).
- [`../../mvp-build/docs/pod-alpha-runtime-runbook.md`](../../mvp-build/docs/pod-alpha-runtime-runbook.md) — the operator proof runbook + on-host proof scripts.

## Remaining Work To Trial-Ready

The materialization/capability contracts are done and the orchestration substrate is proven on-host; the remaining path is the real VPS plus live proof:

1. **Production deploy foundation** — DONE on a real Docker host: docker-compose core, pinned/concrete employee launch, Caddy activation with reload/rollback, per-employee lifecycle, and Docker-DNS routing. Remaining is to run the same on the **real VPS** and prove crash/**reboot recovery** there.
2. **Durability/observability/egress** (no creds): backup of Hermes profiles + workspaces with a tested restore, logs/alerting, and default-deny egress `--apply`d from employee containers (the rule design is captured; applying needs root on the host).
3. **Real capacity benchmark**: re-run `capacity:pod-alpha` at real tiers on a ~64GB node (run as root for true PSS) to set the pod cap — the on-host tier-5 proof is a small dev-box sample.
4. **Core loop + live provider/runtime acceptance** (on creds): close the employee **LLM tool loop** on a real provider-backed Hermes model (not the dead bridge), reprovision old profiles onto scoped MCP credentials, and run the Phase 1 harness for real proof ids.
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

## Phase Map (status as of 2026-07-14)

| Phase | What Changes | Status |
|---|---|---|
| 0 | Current-state handoff | done |
| 1 | Preserve and close live gate | `source-wired`; live gate blocked on model/provider path |
| 2 | Owner Work Surface redesign | Avery-first UI `source-wired`; local fixture/headed proof passed; live provider/runtime proof pending |
| 3 | SMS ambient inbox and links | `source-wired`; live SMS proof pending |
| 4 | Tool-agnostic capability/rendering | `source-wired` (Connector Center + resurfacing are its product use) |
| 5 | Trial ops/admin/billing | `source-wired`; billing is scaffold only; live operator proof pending |
| 6 | Free trial/paid pilot readiness | planned; deploy foundation proven on-host — now gated on the real-VPS run + live provider proof |

The product-surface phases (2–4) are built and the production deploy foundation is proven on a real Docker host. Phase 2 now means the Avery-first owner UI, not the older desk. What remains before a real owner can be handed a trial is the **real-VPS run** (crash/reboot recovery, durability/observability, egress apply, a real capacity number) and **live provider proof** (incl. the LLM tool loop).

## Next Concrete Move

The production deploy foundation is now proven on a real Docker host (compose core + employee lifecycle + Docker-DNS/Caddy routing, with captured `infra/proofs/*.json`). Next, per the [re-sequenced roadmap](../../mvp-build/second-half-plan/production-runtime-and-deploy-roadmap-2026-07-11.md): stand the same stack up on the **real VPS** and prove reboot recovery + durability/observability + egress `--apply` there, then close the **core tool-loop on a real provider-backed model** and run Phase 1 live acceptance when creds land. Admin-panel polish and billing stay **parked** — Phase 5 is already source-wired and sufficient for a founder-operated first pilot. Do not upgrade any live gate without real provider/runtime proof ids.
