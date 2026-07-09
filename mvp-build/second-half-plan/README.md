# AMTECH AI Employee Second-Half Plan

Status: active

Date: 2026-07-09

This folder is the fresh forward plan for taking the current Hermes-backed AMTECH AI Employee from a source-wired prototype to free trials and paid pilots.

The core correction: the backend now has meaningful Hermes, MCP, Manager-tool, artifact, event, runtime, and metering seams, but the owner web and SMS surfaces are not close to the product AMTECH intends to sell. The next half must make AMTECH the small-business interface layer over Hermes, not a hardcoded estimate app and not a developer dashboard.

Deep GUI/runtime research from Hermes Workspace, Hermes WebUI, Hermes Desktop, and Hermes Agent internals is captured in [Hermes Surface Research And Materialization Strategy](surface-research-hermes-gui-and-materialization.md). Treat that document as the surface/materialization companion to the phase plan.

## Product Thesis

AMTECH packages Hermes Agent by Nous Research into an AI employee for small-business owners. Hermes supplies the agent substrate: skills, memory, toolsets, Runs/Sessions/Jobs, MCP, terminal/file/browser/web/media tools, messaging gateways, and learning loops. AMTECH supplies the business-safe product layer: tenancy, provisioning, connector custody, approval gates, artifacts, SMS/web surfaces, operator controls, metering, billing, and trust.

The wedge remains contractor estimates because it creates immediate proof. The product is broader: an employee that can help start or operate a small business across website creation, estimates, parts ordering, invoices, follow-ups, bookkeeping-like organization, marketing campaigns, reminders, and connected-system work, while asking before anything leaves the business or spends money.

## Phase Index

| Phase | File | Outcome |
|---|---|---|
| 0 | [Current State Handoff](phase-00-current-state-handoff.md) | A large handoff describing what exists, what is dirty, what is missing, and what the new plan inherits. |
| 1 | [Preserve And Close Live Gate](phase-01-preserve-and-close-live-gate.md) | Stabilize interrupted work, preserve the tool-enabled employee path, rerun local gates, and capture live runtime proof. |
| 2 | [Owner Work Surface Redesign](phase-02-owner-work-surface-redesign.md) | Replace the skeletal web UI with a real small-business employee desk inspired by Hermes Desktop/WebUI/Workspace. |
| 3 | [SMS Ambient Inbox And Link Previews](phase-03-sms-ambient-inbox-and-link-previews.md) | Make SMS a complete owner surface with signed previews, approvals, artifacts, and task state. |
| 4 | [Tool-Agnostic Capability And Renderer Layer](phase-04-tool-agnostic-capability-and-renderer-layer.md) | Generalize capabilities and rendering across Hermes skills/toolsets, Manager tools, MCP tools, artifacts, and deliverables. |
| 5 | [Trial Operations, Admin, Billing](phase-05-trial-operations-admin-billing.md) | Make the factory operable for many employee instances with admin, support, health, metering, and billing controls. |
| 6 | [Free Trial And Paid Pilot Readiness](phase-06-free-trial-and-paid-pilot-readiness.md) | Finish the proof, policy, UX, and ops gates needed to hand this to real owners and charge. |

## UI Research Coverage

The Hermes GUI research is not a separate idea parked after the plan. It is embedded across all seven phases:

- Phase 0 names the current product gap: backend seams exist, but web/SMS are not yet credible owner surfaces.
- Phase 1 preserves the live tool-enabled employee path and records ids/proof needed for later surface materialization.
- Phase 2 turns the web client into an employee desk: navigation, persistent conversation, live timeline, preview rail, output library, connector center, capabilities/abilities, queue/stop/edit/retry patterns, and mobile review flows.
- Phase 3 makes SMS a first-class ambient inbox with notify/question/review/failure/receipt grammar, signed previews, scoped actions, text fallbacks, and delivery repair.
- Phase 4 introduces the surface contracts: `SurfaceEnvelope`, `WorkResource`, `WorkAction`, `EmployeeEventStream`, capability registry/cache, generic renderer tiers, schema-derived views, generic artifacts, and approval invariants.
- Phase 5 adds the operator version of the desk: fleet/admin health, repair, billing, cost, delivery receipts, materialization inspector, and raw provenance.
- Phase 6 gates launch on proof that web, SMS, generic non-estimate resources, admin, connector repair, billing, and live provider/runtime paths work together.

## Implementation Rules

- Do not rewrite Hermes. Package and surface it.
- Do not build one bespoke connector UI per service. Use capability discovery, MCP, JSON Schema, generic renderers, approval primitives, and connector status.
- Keep Manager invisible to owners. Owners talk to their employee.
- Keep developer vocabulary out of owner-facing surfaces: no MCP, API, token, JSON, config, stack trace, tool catalog, or raw tool log language.
- Treat SMS and web as two renderings of the same employee state.
- Treat estimates as the wedge, not the ceiling.
- Keep customer-facing sends, money movement, broad external changes, deletes, and credential changes behind approval gates.
- Never mark provider or runtime acceptance without proof ids.

## External References Used

- Hermes Agent repo: https://github.com/nousresearch/hermes-agent
- Hermes API Server docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
- Hermes MCP docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
- Hermes Skills docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
- Hermes Tools docs: https://hermes-agent.nousresearch.com/docs/user-guide/features/tools
- Hermes Desktop source: https://github.com/NousResearch/hermes-agent/tree/main/apps/desktop
- Hermes WebUI source: https://github.com/nesquena/hermes-webui
- Hermes Workspace source: https://github.com/outsourc-e/hermes-workspace
