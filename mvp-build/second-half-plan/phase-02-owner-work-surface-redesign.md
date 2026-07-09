# Phase 2 - Owner Work Surface Redesign

Status: source-wired

Goal: replace the skeletal owner web UI with a powerful small-business employee desk that renders Hermes capability as usable work, not as a developer dashboard.

## Summary

The current Work Surface proves data flow, but it is not a product. Rebuild it around the owner jobs-to-be-done:

- see what needs attention;
- talk to the employee;
- watch current work;
- inspect outputs;
- approve or reject safely;
- connect business systems;
- understand what the employee can do next;
- recover when something breaks.

Borrow interaction patterns from Hermes Desktop/WebUI/Workspace: streaming, interrupt, side-by-side previews, task/activity panes, skills/memory/capability visibility, and graceful degraded mode. Translate all of it into small-business owner language.

Use `surface-research-hermes-gui-and-materialization.md` as the design companion for this phase. The web surface should be the first high-fidelity renderer of the same materialized employee state that SMS, admin, customer links, and optional desktop clients will consume later.

## Product Shape

The first screen should be the working employee surface, not a marketing page or blank chat.

Desktop layout:

- Left rail: Today, Inbox, Jobs, Tasks, Outputs, Connected, Abilities, Activity.
- Center: conversation and live activity timeline.
- Right pane: selected output/task/approval/connector preview.

Mobile layout:

- Bottom or top segmented navigation for Today, Chat, Jobs, Outputs.
- Preview opens full-screen.
- Approval controls remain sticky when reviewing a gated item.

## Key Changes

- Replace the single-column `AgentClient.tsx` layout with a persistent multi-region app shell.
- Persist and render conversation history from `employee_messages`; stop using local-only chat as the source of truth.
- Upgrade live progress from one text line to a timeline of owner-safe work verbs.
- Add a selected-item model so any work card, artifact, task, connector, or output can open in the preview pane.
- Add an output library that lists all artifacts and structured deliverables, not just job-folder estimates.
- Add a task/work queue view for in-progress, blocked, needs-you, done, and failed work.
- Add a connector center that uses owner language: "Email", "Payments", "Files", "Calendar", "Website", "Browser", not implementation/provider jargon.
- Add a capabilities/abilities view from Phase 4 data; until Phase 4 lands, stub it from current Manager/Hermes discovery with a clear internal TODO.
- Add real empty/loading/error/degraded states.
- Add responsive constraints and test mobile widths.

Hermes GUI patterns to explicitly include:

- queue an instruction while the employee is busy;
- stop/cancel where the runtime supports it;
- edit/retry/regenerate a recent owner instruction where feasible;
- right-rail preview tabs for estimates, invoices, emails, website previews, generated media, files, connector repair, and generic structured resources;
- status chips for healthy/degraded/needs owner/needs connection states;
- graceful reconnect/offline states for SSE or future WebSocket streams.

## Interface Rules

- Never show raw tool names by default.
- Never show raw JSON.
- Never mention MCP, API, bearer, token, `config.yaml`, toolset, runtime, or stack trace to the owner.
- Show provider proof as quiet receipts: sent, paid, connected, delivered, synced, with optional proof id disclosure.
- Approval cards must show exactly what will happen before approval.
- Failures should read like a coworker offering repair: "Email disconnected. Reconnect it?" not "runtime_401".
- Default state should be calm, but never barren.

## Minimum Screens/States

- Today: summary, urgent approvals/questions, active work, recent results.
- Chat: persistent conversation, streaming reply/progress, stop/cancel affordance when supported.
- Jobs: grouped job folders across estimate, email, invoice, payment, reminder, and events.
- Outputs: artifact/output library with preview and signed-link actions.
- Connected: connector status, consent/reconnect/test results.
- Capabilities: what the employee can do now, what needs connection, what is policy-gated, and what is unavailable.
- Settings-lite: owner profile, business profile, employee status, billing/account link once Phase 5 exists.

## Tests And Acceptance

- Unit/component tests for grouping, selected preview routing, and empty states.
- Playwright desktop screenshot for the happy path.
- Playwright mobile screenshot for the SMS-link style review path.
- Browser test that sends a message, receives employee reply, and sees persisted history after refresh.
- Browser test that a pending approval opens in preview and resolves through the existing approval route.
- Accessibility check for keyboard focus on approval controls.

Acceptance:

- A nontechnical owner can open the page and understand what the employee has done, what needs a decision, what is in progress, and what the employee can do next.
- The surface feels like a working product even when there is no data yet.
- The same underlying work event can appear as a card, a preview, and a job-folder timeline item without bespoke duplication.

## Assumptions

- The current inline-style approach can be replaced or organized locally without adopting a large design framework.
- Existing tokens can seed the redesign, but the final UI should not be constrained by the current sparse card layout.
- This phase may add small client-side state abstractions if they reduce complexity and enable selection/preview behavior.
