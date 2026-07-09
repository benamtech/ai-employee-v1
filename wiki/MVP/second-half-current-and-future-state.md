# AI Employee Second-Half Current And Future State

**Status: active** · _Created 2026-07-09. This is the wiki companion to [`../../mvp-build/second-half-plan/`](../../mvp-build/second-half-plan/): it summarizes the current application state and the forward state after the new seven-phase second-half plan. It does not replace implementation records; it points agents to the plan and explains the product architecture shift._

## Why This Exists

The current `mvp-build/` backend is ahead of the product surface. AMTECH has meaningful Hermes/Manager/runtime/event seams, but the owner-facing web and SMS experiences are not ready for free trials or paid pilots. The second-half plan changes the next development era from "finish the estimate app" to "ship the small-business interface layer over Hermes."

The core conclusion from the Hermes Workspace/WebUI/Desktop research is:

> AMTECH should not be a chat wrapper or a bespoke estimate app. It should be the business-native materialization layer over Hermes Agent.

That means the AI Employee must be usable through web, SMS, signed preview links, email, customer portals, admin, and optional desktop/Deno clients while all of those surfaces render the same underlying employee state.

## Current Application State

Current backend state in `mvp-build/`:

- **Manager control plane exists**: provisioning, tools, claims, owner messaging, artifacts, approvals, webhooks, scheduler, repair, metering, and resource routes are present in source.
- **Hermes profile package exists**: `packages/agent-template/` renders `SOUL.md`, `config.yaml`, workspace policy, Manager tool docs, brain files, skills, model config, toolsets, and Manager MCP server config.
- **Manager-as-MCP exists**: the employee can call Manager tools natively through MCP rather than through owner-visible developer plumbing.
- **Schema-first Manager tools exist**: zod schemas and shared dispatch let HTTP and MCP reuse validation/gates/audit.
- **Runtime alignment exists in source**: Hermes Sessions/Runs-oriented client code, runtime endpoint records, turn queue, channel router, event ingestion, and metering ledgers are wired.
- **Provider/runtime acceptance is incomplete**: live proof ids are still required for free-trial readiness.

Current owner-surface state:

- **Web Work Surface is not trial-grade**. It has cards, resources, approvals, job grouping, a snapshot/SSE route, and MCP-UI sandbox support, but it still reads as a sparse internal prototype.
- **SMS is not yet a complete surface**. Twilio/SMS routing exists, but SMS does not yet provide a full ambient inbox with signed previews and scoped actions for every task/artifact/approval.
- **Onboarding/login are not trial-grade**. The create/claim/login flows remain visibly prototype-shaped.
- **Artifacts are still too estimate-shaped**. The renderer must support every structured deliverable and tool result, not only estimate PDFs.

## Future Application State

After the seven second-half phases, the product should look like this:

1. **One Employee, Many Surfaces**

   The owner experiences one employee across SMS, web, signed links, and eventually voice/desktop. The conversation, work queue, approvals, artifacts, receipts, and connector state are the same objects rendered differently.

2. **Web Employee Desk**

   The web surface becomes a serious small-business desk:

   - left navigation for Today, Inbox, Jobs, Tasks, Outputs, Connected, Capabilities/Abilities, Activity;
   - center conversation and live work timeline;
   - right preview rail for outputs, approvals, connectors, jobs, and generic resources;
   - queue/stop/edit/retry interaction patterns inspired by Hermes WebUI/Desktop;
   - mobile-first review flows.

3. **SMS Ambient Inbox**

   SMS becomes a complete low-friction surface:

   - notify/question/review/failure/receipt grammar;
   - signed preview links for every resource/action;
   - text fallbacks for approvals and edits;
   - delivery receipts and repair paths;
   - continuity with web history.

4. **Materialization Contracts**

   Phase 4 introduces the product contracts:

   - `SurfaceEnvelope` — any user-visible event/action/message rendered for a surface;
   - `WorkResource` — every output as a typed resource, not just chat text;
   - `WorkAction` — approve/send/edit/cancel/retry/connect/download/open/answer as declarative actions;
   - `EmployeeEventStream` — the owner-safe projection of Hermes events, Manager tool events, artifacts, approvals, connector events, scheduler events, and provider events.

5. **Capability Model**

   AMTECH should use the word capability normally. The capability model is not just one endpoint and not just static provisioning. It is a product layer informed by:

   - Hermes `/v1/capabilities`, `/v1/skills`, `/v1/toolsets`;
   - rendered profile/package/toolset config;
   - Manager tools and MCP resources;
   - connector state;
   - skills installed in the employee;
   - entitlements and policy;
   - runtime/provider health.

   The owner sees this as plain-language abilities: "Email is connected," "I can draft invoices," "Payments need setup," "I will ask before sending or spending."

6. **Factory/Admin Layer**

   AMTECH must operate dozens or hundreds of employee instances:

   - account/employee/provisioning/runtimes;
   - connector and runtime health;
   - repair queues and support actions;
   - metering, costs, budgets, and billing states;
   - materialization inspector with raw provenance for support.

7. **Free Trial And Paid Pilot Gate**

   No free trial should start until web, SMS, artifact previews, generic non-estimate resources, live provider/runtime proof, admin repair, usage/cost visibility, and billing/account state are proven or explicitly waived in a dated launch decision.

## Relationship To Existing Wiki

This document updates the older Work Surface and graph-materialization framing:

- [`event-driven-office-and-generative-ui.md`](event-driven-office-and-generative-ui.md) remains the event/move/descriptor foundation.
- [`agent-inbox-and-channel-architecture.md`](agent-inbox-and-channel-architecture.md) remains the inbox/channel/session architecture.
- [`old-build-plan/15-interaction-reimagined-the-work-surface.md`](old-build-plan/15-interaction-reimagined-the-work-surface.md) remains the original Work Surface interaction thesis.
- [`principle-graph-materialization.md`](../principle-graph-materialization.md) remains the "one graph, many views" principle.
- [`principle-deliverable-driven-surfaces.md`](../principle-deliverable-driven-surfaces.md) remains the type-system principle for rendering deliverables.
- [`../../mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md`](../../mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md) is the newest detailed research addendum.

## Phase Map

| Phase | What Changes | Why It Matters |
|---|---|---|
| 0 | Current-state handoff | Cold agents can understand the code/product state without re-reading old plans. |
| 1 | Preserve and close live gate | Stabilizes the tool-enabled employee path before broad UI work. |
| 2 | Owner Work Surface redesign | Converts the web app from sparse proof surface into employee desk. |
| 3 | SMS ambient inbox and links | Makes SMS usable as a primary surface. |
| 4 | Tool-agnostic capability/rendering | Makes every tool/deliverable render without bespoke connector UI. |
| 5 | Trial ops/admin/billing | Makes the employee factory supportable and chargeable. |
| 6 | Free trial/paid pilot readiness | Proves the system can be given to real owners safely. |

## Next Concrete Move

Complete Phase 1 using [`../../mvp-build/second-half-plan/phase-01-handoff-prompt.md`](../../mvp-build/second-half-plan/phase-01-handoff-prompt.md). Do not start the major web/SMS redesign until the interrupted tool-enabled employee path is preserved, tested, and either live-proven or honestly blocked with exact proof gaps.
