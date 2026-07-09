# Research And Principles

Status: active

This is the UI research index for AMTECH's AI Employee surfaces. It is meant to keep UI work aligned with the product architecture while leaving visual direction open.

## The Current Product Thesis

AMTECH should not be a chat wrapper, developer dashboard, or bespoke estimate app. It should be the business-native materialization layer over Hermes Agent.

Hermes supplies the substrate: sessions, profiles, skills, toolsets, MCP, API server runs, jobs, memory, files, terminal/browser/web/media tools, approvals, clarification, and messaging gateways.

AMTECH supplies the product layer:

- small-business owner language;
- account and employee provisioning;
- connector custody;
- approval gates;
- artifacts and previews;
- web, SMS, signed links, admin, and future desktop/client surfaces;
- metering, billing, and support operations;
- trust and proof.

## Research To Read

Newest and most directly relevant:

- `mvp-build/second-half-plan/surface-research-hermes-gui-and-materialization.md` — newest Hermes GUI/runtime research and AMTECH materialization strategy.
- `mvp-build/second-half-plan/README.md` — current seven-phase second-half plan.
- `mvp-build/second-half-plan/phase-02-owner-work-surface-redesign.md` — current web desk target; now `source-wired`, but browser polish/proof remains.
- `mvp-build/second-half-plan/phase-03-sms-ambient-inbox-and-link-previews.md` — next UI surface: SMS and signed mobile previews.
- `mvp-build/second-half-plan/phase-04-tool-agnostic-capability-and-renderer-layer.md` — surface contracts and generic rendering future.
- `wiki/MVP/second-half-current-and-future-state.md` — wiki companion for current/future state.

Foundational UI/product docs:

- `wiki/MVP/event-driven-office-and-generative-ui.md` — event-driven office, typed work descriptors, generative UI frontier.
- `wiki/principle-deliverable-driven-surfaces.md` — deliverable type drives preview, proof, and gate.
- `wiki/principle-graph-materialization.md` — one business graph, many materialized surfaces.
- `wiki/MVP/phase-3-generative-ui-reframe.md` — static/typed generative UI and conformance over novelty.
- `wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md` — original Work Surface thesis.
- `wiki/MVP/agent-inbox-and-channel-architecture.md` — conversation as brain artifact; SMS/web/voice as channels into one employee.

Recent implementation notes:

- `mvp-build/memory/2026-07-09-1050-phase-2-work-surface-source-wired.md` — latest web Work Surface source-wired implementation.
- `mvp-build/memory/2026-07-09-0215-phase-1-static-gates-artifact-fallback-live-blocked.md` — Phase 1 preservation and artifact fallback.
- `mvp-build/memory/2026-07-09-0115-hermes-gui-surface-research.md` — research session summary.
- `mvp-build/ui-handoff/experiments-and-future-surfaces.md` — practical backlog of preview media, signed SMS preview, artifact/media, task progress, and cross-surface representation experiments.

## Recent Hermes GUI Discoveries

Hermes Workspace teaches the command-center pattern:

- persistent shell;
- mobile tab/swipe navigation;
- Jobs/Tasks pages;
- capability probing;
- MCP/tool payload normalization;
- operations/health concepts;
- graceful unavailable states.

Hermes WebUI teaches usability patterns:

- three-panel layout;
- SSE streaming and reconnect;
- queued sends while agent is busy;
- edit/retry/regenerate;
- cancel running task;
- approval cards;
- tool cards and subagent cards;
- attachments and file previews;
- session search and status controls.

Hermes Desktop teaches north-star interaction depth:

- right-rail previews;
- typed stream events;
- queue panel;
- voice and attachments;
- command palette;
- messaging setup/status;
- cron/jobs UI;
- skills/toolsets/MCP views;
- coalesced streaming for smooth rendering;
- flat, tokenized UI primitives.

AMTECH translation:

- "toolsets" become "abilities";
- "MCP unavailable" becomes "needs connection" or "not available";
- "run" becomes "work";
- "artifact payload" becomes "output" or "draft";
- "audit log" becomes "proof";
- "cron" becomes "recurring work";
- "approval.request" becomes "waiting for you".

## Generative UI Direction

Current code is in the safe typed/static stage:

- `WorkEventDescriptor` describes the move: notify, question, review.
- Deliverable type selects the renderer.
- Acceptance grammar is approve, edit, reject, respond, acknowledge.
- Approval gates are structural for money/customer-facing/risky work.
- Manager currently authors most descriptors; later the employee should emit descriptors through the message-to-agent path.

Future direction:

- Phase 3: render the same resource/action state in SMS and signed mobile previews.
- Phase 4: introduce `SurfaceEnvelope`, `WorkResource`, `WorkAction`, and `EmployeeEventStream`.
- Later: richer MCP-UI/schema-derived renderers for tables, diffs, schedules, forms, connector repair, and generic structured artifacts.
- Experimental but important: preview images, video posters/transcripts, PDF thumbnails, report summary cards, website screenshots, generated media galleries, order-cart previews, and task-progress timelines should all become representations of `WorkResource`/`WorkAction`, not separate one-off products.

Core principle: do not design a bespoke screen for every skill. Type the work/output, then let the surface render that type.

## UI Concepts To Preserve

These are product semantics, not visual style rules:

- One employee across surfaces.
- Web, SMS, signed links, admin, and future clients render the same underlying work state.
- The owner sees business language, not implementation language.
- Every risky action has an understandable preview and gate.
- Every completed external action should leave a quiet proof/receipt.
- Failures should offer repair paths where possible.
- Empty states should make the product feel ready, not barren.
- The same work event can appear as a list row, a card, a preview, an SMS line, and an admin record.

## Not A Visual Design System

There are intentionally no hard rules here about exact colors, typography, card radius, density, or brand style. The founder has not done purposeful visual design yet. Current UI work is functional scaffolding.

The UI contributor should feel free to propose and implement a stronger visual direction, as long as it supports the product semantics above and does not break the functional MVP path.

## Future UI Surface Inventory

Current or near-term:

- web Work Surface;
- create/claim/login front door;
- artifact/output route;
- SMS replies and notifications;
- signed mobile preview links;
- admin/operator screens;
- connector consent/repair screens.
- preview-media generation for signed links: thumbnails, posters, summary cards, and mobile-first artifact pages.

Future possible:

- customer-facing estimate/payment/upload portals;
- desktop/Deno/Tauri/PWA client;
- email thread rendering;
- voice renderer;
- internal AMTECH fleet/materialization inspector.

All should converge on the same future materialization contracts rather than creating separate product logic.
