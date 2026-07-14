# Handoff Prompt: AI-Native UI/UX Redesign Design Documents

Status: active handoff
Created: 2026-07-14
Intended next session: research and write the complete UI/UX design-document packet for AMTECH's MVP surfaces.

## Copy/Paste Prompt

```text
You are taking over a deep UI/UX research and design-documentation project for AMTECH.

Do not start by writing UI code. Your job is to produce a comprehensive, build-ready design document packet in `mvp-build/ui-redesign/` that could later be handed to an implementation agent to rebuild the entire MVP UI from first principles.

The product is AMTECH: an AI employee platform for small businesses. It packages Hermes Agent by Nous Research into trusted business employees that can be texted, inspected on the web, connected to business tools, produce documents, ask questions, request approvals, perform owner-approved external actions, and leave proof. The first market is owner-operated contractors, but the design must support the general platform: contractors, service businesses, bookkeepers, agencies-as-an-example, future internal AMTECH operators, and eventually high-end AI employees that can help run websites, marketing, files, estimates, bookkeeping, support, and other business work from one operating surface.

The current UI is functional scaffolding. It works, but it can still feel like "AI chat plus dashboards." The target is a new kind of software: a chat-native business operating surface. Chat is the command language. Work objects are the task apps. Events are the office inbox. Approvals are business permissions. Proof is part of the interface. The owner should not learn software; they should learn how to supervise Avery.

You must think deeply. This project needs research, synthesis, product judgment, interaction design, visual design, information architecture, UX psychology, cross-surface notification design, and implementation-aware data modeling. The output must be detailed enough that another agent can build the MVP UI from it without inventing core product decisions.

## Hard Rules

- Work in a non-main checkout. Do not use the main checkout.
- Start by reading the required files below before planning.
- Do not implement UI code in this session unless explicitly asked after the design docs are accepted.
- Do not flatten AMTECH into a conventional SaaS dashboard, a chatbot, a CRM, an automation builder, or a generic admin panel.
- Distinguish current source-wired capability from future design ambition.
- Do not expose implementation vocabulary to normal owners: MCP, tool call, payload, webhook, run, API, schema, bearer token, stack trace, provider event, etc.
- Preserve the product semantics: one employee, owner-safe language, exact previews before risky actions, human approval before customer-facing/money/external writes, proof after completion, and coherent state across web/SMS/signed links/admin/future clients.
- Preserve security assumptions: signed links are scoped and expiring; artifact links stay protected; admin/support views require role/audit/redaction; customer-facing and money actions remain gated.
- Use the repo's real contracts. Do not invent a separate data model when `ResourcePayload`, `WorkResource`, `WorkAction`, `SurfaceEnvelope`, `CapabilityGraphNode`, `ConnectionSurface`, and `ResurfaceItem` already exist.
- If external research is needed, use primary or highly credible sources. Prefer official platform design docs, research papers, and major UX research sources. If a search provider returns 402, find another accessible source for the same article or concept.

## Required Local Reading

Read these first, in order:

1. `identity.md`
2. `CODEGRAPH.md`
3. `mvp-build/CODEGRAPH.md`
4. `mvp-build/CLAUDE.md`
5. `mvp-build/AGENTS.md`
6. `mvp-build/memory/MEMORY.md`
7. Newest dated files in `mvp-build/memory/`
8. `mvp-build/second-half-plan/README.md`
9. `wiki/README.md`
10. `wiki/00-decision.md`
11. `wiki/product-ai-employee-context.md`
12. `wiki/product-agent-platform-architecture.md`
13. `wiki/strategy-4-year-implications.md`
14. `wiki/gtm/free-estimator-funnel.md`
15. `wiki/MVP/ai-native-work-surface-research.md`
16. `wiki/MVP/event-driven-office-and-generative-ui.md`
17. `wiki/MVP/phase-3-generative-ui-reframe.md`
18. `wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`
19. `wiki/MVP/agent-inbox-and-channel-architecture.md`
20. `wiki/principle-graph-materialization.md`
21. `wiki/principle-deliverable-driven-surfaces.md`
22. `wiki/principle-agent-leverage.md`
23. `wiki/offers/estimator-whole-product.md`
24. `wiki/offers/wedge-offers.md`
25. `wiki/segments/contractors.md`
26. `wiki/segments/bookkeeping.md`
27. `mvp-build/ui-handoff/README.md`
28. `mvp-build/ui-handoff/product-grounding.md`
29. `mvp-build/ui-handoff/research-and-principles.md`
30. `mvp-build/ui-handoff/data-catalog.md`
31. `mvp-build/ui-handoff/current-ui-map.md`
32. `mvp-build/ui-handoff/experiments-and-future-surfaces.md`
33. `mvp-build/ui-handoff/working-protocol.md`
34. Relevant current source files after reading the maps:
    - `apps/web/app/agent/[employeeId]/AgentClient.tsx`
    - `apps/web/app/agent/[employeeId]/review/ReviewClient.tsx`
    - `apps/web/app/admin/AdminClient.tsx`
    - `apps/web/app/agent/[employeeId]/components/McpUiResource.tsx`
    - `apps/web/app/agent/[employeeId]/fixtures.ts`
    - `apps/web/app/agent/[employeeId]/lib/surface-model.ts`
    - `packages/shared/src/resource-payload.ts`
    - `packages/shared/src/preview-links.ts`
    - `packages/shared/src/materialization.ts`
    - `packages/shared/src/work-events.ts`
    - `packages/shared/src/admin.ts`
    - `apps/manager/src/lib/employee-stream.ts`
    - `apps/manager/src/lib/preview-render.ts`
    - `apps/manager/src/lib/materialization.ts`
    - `apps/manager/src/lib/capability-registry.ts`
    - `apps/manager/src/lib/ui-resources.ts`

## Required External Research

Use external research where it clarifies first principles. Do not pad the docs with citations. Convert research into AMTECH-specific decisions.

At minimum, research these areas:

- Augmentation and working surfaces:
  - Douglas Engelbart, "Augmenting Human Intellect"
  - J. C. R. Licklider, "Man-Computer Symbiosis"
  - Xerox Alto/Star object-first office UI
- Personal information management and office work:
  - Thomas Malone / desk organization / piles / reminders / personal work context
  - Lucy Suchman / situated action
  - Winograd and Flores / language as action and commitments
- Human action and cognitive ergonomics:
  - Don Norman's gulfs of execution/evaluation, affordances, mapping, feedback, constraints
  - Nielsen usability heuristics, recognition vs recall, system status visibility
- Notification and interruption design:
  - platform guidelines from Apple/Google/Microsoft where available
  - research on timing, urgency, layout, color, interruption cost, and notification overload
  - calm technology and attention management
- AI and agent UX:
  - human-in-the-loop approval design
  - generative UI and adaptive interfaces
  - explainability, confidence, uncertainty, and repair
  - intent capture and delegation boundaries
- Business software and operating surfaces:
  - command palettes, shells, IDEs, Bloomberg/terminal-like density, kanban/task systems, inbox-zero systems, CRM/job folders, accounting workflows, and field-service workflows

Seed external links already identified:

- Engelbart: https://www.dougengelbart.org/content/view/138/
- Licklider: https://groups.csail.mit.edu/medg/people/psz/Licklider.html
- Xerox Star retrospective: https://digibarn.com/friends/curbow/star/retrospect/index.html
- Personal information management background: https://en.wikipedia.org/wiki/Personal_information_management
- Lucy Suchman background: https://en.wikipedia.org/wiki/Lucy_Suchman
- Language/action perspective: https://en.wikipedia.org/wiki/Language/action_perspective
- Nielsen heuristics background: https://en.wikipedia.org/wiki/Jakob_Nielsen_%28usability_consultant%29
- Norman mapping/gulfs background: https://en.wikipedia.org/wiki/Natural_mapping_%28interface_design%29

If you use Wikipedia for orientation, follow its references or search for primary/official versions before relying on the claim. Summarize sources sparingly and cite links in the design docs.

## Design North Star

AMTECH is not:

- a chatbot with tabs;
- a CRM;
- a dashboard;
- a generic automation builder;
- a customer support inbox;
- a developer console;
- a vertical estimating app;
- a website builder;
- a bookkeeping app.

AMTECH is:

- a business operating surface for AI employees;
- an office inbox where business events become typed work;
- a command surface where natural language creates, updates, approves, and repairs work;
- a proof system where the owner can verify what happened;
- a permission system where risky external actions are previewed and approved;
- a materialization layer where the same work object appears as chat, card, document, mobile review, SMS link, admin proof, and future generated UI.

The user should feel:

- "I can tell Avery what happened."
- "Avery knows what to do next."
- "I can see exactly what Avery made."
- "I know what will happen if I say yes."
- "I can find the proof later."
- "This is not just chat; it is how the business work moves."

## Audiences To Design For

Design all docs against these personas:

1. Contractor owner, 45-65, phone-first, low AI sophistication, job-site context, wants estimates done and does not want to learn software.
2. Fresh secretary / office admin, has to help operate the employee, needs teachable workflows, explicit next steps, and low fear.
3. AI-savvy operator, wants to move fast, sees through weak chatbots, needs command speed and visible power.
4. Bookkeeper / service-office user, more desk-based, cares about records, approvals, repeatable client communication, and proof.
5. AMTECH operator/admin, needs diagnostics, redaction, health, support actions, and proof without leaking unsafe details into owner UI.
6. Future high-end user, may use the same employee to work on estimates, website pages, landing tools, marketing assets, bookkeeping, customer follow-up, files, and internal operations from one surface.

## Required Design Document Packet

Create or update files in `mvp-build/ui-redesign/`. The packet should be comprehensive. Use concise writing where possible, but do not omit design decisions. The docs should be good enough that a later implementation agent can build the UI without needing to invent the product model.

Create these documents:

### `00-index-and-reading-order.md`

Explain the purpose of the packet, reading order, current vs future boundaries, and how it relates to `mvp-build/ui-handoff/`.

### `01-research-synthesis.md`

Synthesize all local and external research. This must not be a citation dump. Convert research into AMTECH design principles.

Required sections:

- augmentation and the working surface;
- object-first office UI;
- personal information management: piles, reminders, re-finding context;
- situated action and repair;
- language as action and commitment;
- cognitive ergonomics: feedback, mapping, affordance, recognition, recoverability;
- notification and attention research;
- AI/agent UX: delegation, uncertainty, approval, proof, repair;
- implications for contractors, bookkeepers, and future general business users.

### `02-product-mental-model.md`

Define the core mental model of AMTECH.

Required decisions:

- what is an employee;
- what is a work object;
- what is a job folder;
- what is an approval;
- what is proof;
- what is an ability;
- what is a connected account;
- what is recurring work;
- how chat relates to all of the above;
- how the owner should think about "software spinning up when needed."

Include pass/fail criteria for whether a user has learned the model.

### `03-information-architecture.md`

Design the whole IA across current and near-future surfaces.

Cover:

- public/root front door;
- free public estimator;
- create/claim/login/account setup;
- owner Work Surface;
- Today/Needs Me;
- Chat/command surface;
- Jobs/work folders;
- Outputs/artifacts;
- Tasks/questions/approvals;
- Connected accounts;
- Abilities/capability graph;
- Activity/proof/history;
- Settings/account/status;
- signed mobile Review links;
- artifact/output routes;
- MCP-UI generated cards;
- admin/operator console.

Decide what stays as a top-level view, what becomes a mode, what becomes a preview pane, and what should disappear into object-specific surfaces.

### `04-visual-system.md`

Design the visual system from first principles.

Cover:

- color palette and rationale;
- typography, scale, density, line length, mono usage;
- grid, spacing, responsive breakpoints;
- surface/background model;
- cards vs rows vs panels vs full work surfaces;
- contrast and accessibility;
- status colors and when color is allowed;
- iconography;
- data density;
- empty/loading/error/degraded states;
- mobile treatment;
- motion principles;
- what the UI must never look like.

Current brand direction to evaluate, not blindly accept:

- Inter for AMTECH logotype/display/body/paragraph text.
- IBM Plex Mono for operational labels where useful.
- Black/near-black on white and white on AMTECH red are the strongest current modes.
- Avoid generic AI gradients, purple-blue SaaS haze, decorative blobs, and card-heavy marketing dashboards.

If you change these rules, explain why.

### `05-interaction-model-and-intent.md`

Define how the system understands and responds to user intent.

Cover:

- command language vs chat transcript;
- novice natural-language input;
- expert quick actions / command palette;
- intent classes: create, inspect, approve, edit, reject, ask, repair, connect, schedule, delegate, search, summarize, teach, stop;
- ambiguity handling;
- when Avery asks a question vs takes action;
- how users correct the employee;
- how the interface shows that the employee understood;
- how work appears after a command;
- how to prevent users from thinking they must write perfect prompts;
- how to influence user behavior toward efficient use without instructional clutter.

### `06-notification-and-attention-lifecycle.md`

This is critical. Design the lifecycle of notifications across web, SMS, signed links, email/future channels, admin, and future desktop/mobile clients.

Cover:

- event sources: owner messages, customer replies, Gmail, Stripe, QuickBooks, reminders, connector failures, runtime failures, cron/check-ins, generated outputs, approvals, admin interventions;
- triage: ignore, log, batch, show in Today, SMS, signed link, urgent interruption, admin-only;
- urgency levels and criteria;
- notification anatomy: headline, reason, consequence, action, proof, link;
- lifecycle states: created, delivered, seen, opened, acted, snoozed, expired, resolved, failed, escalated;
- cross-surface continuity: same item in SMS, Today, preview link, work object, admin;
- quiet receipts and proof;
- batching and digests;
- "come back to this" resurfacing;
- channel preferences;
- failure and repair notifications;
- how to avoid attention spam;
- what gets a text vs what stays in web;
- how notifications teach the product model over time.

Use `ResurfaceItem`, `WorkResource`, `SurfaceEnvelope`, and `WorkEventDescriptor` explicitly.

### `07-abilities-and-task-execution.md`

Design how AMTECH communicates what the employee can do and lets users do tasks.

Cover:

- ability catalog vs connected account state vs actual work;
- communicating readiness: ready, needs connection, needs info, degraded, policy gated, unavailable;
- how abilities are discovered naturally from chat and work context;
- task templates without turning into forms;
- generated task surfaces;
- recurring work;
- standing approvals and why some actions can never be standing-approved;
- connector setup and repair;
- examples for contractors, bookkeepers, and future website/marketing workflows.

Use `CapabilityGraphNode`, `ConnectionSurface`, and Manager capability registry concepts.

### `08-work-objects-artifacts-approvals-proof.md`

Design the core work-object system.

Cover:

- estimate drafts;
- outbound messages;
- invoices/deposit links;
- customer replies;
- job folders;
- reminders;
- connector repairs;
- QuickBooks/accounting writes;
- generated documents;
- media/photo galleries;
- website/landing-page drafts;
- data/report outputs;
- proofs and receipts;
- approval previews;
- edit/reject/respond flows;
- expiration and auditability;
- mobile review rendering;
- artifact download/open/copy/send states.

Use `WorkResource` and `WorkAction` as the core contract. Define what a shared renderer should do.

### `09-surface-by-surface-spec.md`

Specify each current UI surface in enough detail to implement.

Required surfaces:

- root/public page;
- free estimator landing/tool;
- create employee;
- claim;
- login;
- owner Work Surface desktop;
- owner Work Surface mobile;
- signed mobile Review page;
- artifact/output page;
- MCP-UI generated card frame;
- Admin console;
- future customer-facing estimate/payment/upload portal;
- future desktop/PWA/command-center client.

For each:

- purpose;
- primary user;
- entry points;
- data available;
- main states;
- actions;
- failure states;
- responsive behavior;
- visual tone;
- what it must not expose.

### `10-future-and-push-to-limits-use-cases.md`

Explore high-end use cases without derailing the MVP.

Cover:

- contractor AI office;
- bookkeeper monthly close/missing-docs employee;
- service business customer-intake employee;
- public estimator/calculator SEO tools;
- next-generation web experiences where AMTECH can generate and manage a contractor's own public estimator or landing page;
- working on a website from the same operating surface where the owner works on estimates;
- marketing assets, images, before/after galleries, job pages, ads, and follow-up campaigns;
- multi-employee businesses;
- internal agency-like operations as an example, not a beachhead;
- what UI architecture choices preserve these futures;
- what not to build yet.

### `11-implementation-translation.md`

Translate the design docs into an implementation-ready plan.

Cover:

- component architecture;
- shared renderers;
- route-level changes;
- data contract changes, if any;
- fixture updates;
- test plan;
- screenshot proof plan;
- accessibility checks;
- rollout strategy;
- files likely to change;
- decisions intentionally left open.

This document should not be code, but it should be concrete enough for a coding agent to implement the redesign.

## Required Current Data Understanding

Before writing design specs, build your own understanding of what the frontend has access to today:

- `ResourcePayload` is the web Work Surface read model.
- `WorkResource` / `WorkAction` is the core preview/review/action shape.
- `SurfaceEnvelope` is the surface-agnostic materialization wrapper.
- `CapabilityGraphNode` is the ability graph.
- `ConnectionSurface` is the generic connected-business card.
- `ResurfaceItem` is the attention queue / come-back-to-this model.
- `WorkEventDescriptor` is the typed event/move grammar.
- MCP-UI cards render typed `table`, `schedule`, `diff`, and `form` views compiled by Manager.
- The signed Review page already renders a `WorkResource`.
- The Work Surface currently uses `AgentClient.tsx` with Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, Settings-lite, and a preview pane.
- Admin has its own contracts and should remain operator-facing.

The design docs must say how these shapes should be used in the future UI. If you propose new fields, explain why existing shapes are insufficient.

## First-Principles Questions To Answer

Answer these directly in the packet:

- What is the minimum screen language that teaches a contractor how to use this new kind of software?
- How does the UI make an AI-savvy user immediately see that this is more than chat?
- How does AMTECH show available abilities without becoming a feature catalog?
- How does the product encourage users to give better inputs without making them learn prompt engineering?
- What should happen when a user says "I walked this job"?
- What should happen when a customer replies?
- What should happen when a connector breaks?
- What should happen when a draft is low-confidence?
- What should happen after approval?
- How does proof travel across surfaces?
- Which notifications interrupt, which wait, and which disappear into history?
- How do we prevent the owner from reconciling chat/tasks/activity/output manually?
- How does the UI make the employee feel proactive but not noisy?
- How does the design support a future where Avery can also work on the owner's website, public estimator, marketing assets, and bookkeeping from the same operating surface?

## Pass / Fail Criteria

The design packet passes if:

- It gives a coherent product model that is not chat plus dashboards.
- It is specific enough to build from.
- It covers colors, typography, layout psychology, interaction patterns, notification lifecycle, intent handling, ability communication, task execution, approvals, proof, artifacts, and cross-surface continuity.
- It respects current source contracts and identifies where future contract changes are actually needed.
- It covers contractors and also generalizes to service businesses, bookkeepers, and future high-end AMTECH employees.
- It distinguishes MVP implementation from future product ambition.
- It includes examples and concrete flows, not only principles.
- It creates a clear bridge from research to implementation.

The packet fails if:

- It reads like generic SaaS UX advice.
- It focuses only on colors/components.
- It leaves notification lifecycle, intent handling, abilities, approvals, proof, or mobile signed links underspecified.
- It ignores the existing data contracts.
- It makes the owner learn internal implementation vocabulary.
- It designs for contractors so narrowly that bookkeepers, service businesses, and future website/marketing workflows would require a second product.
- It claims anything is live/proven without checking source and memory.

## Working Method

1. Read local docs and source maps.
2. Build a short source-of-truth inventory: current capabilities, current surfaces, current contracts, current gaps.
3. Do targeted external research for the areas above.
4. Write a research synthesis and decision log.
5. Draft the document packet in the order listed.
6. Cross-check each design decision against the data catalog and current UI map.
7. Run markdown sanity checks.
8. Add a memory handoff under `mvp-build/memory/` explaining what you wrote and what the next implementation agent should do.

Do not rush to code. This is the design foundation for rebuilding the MVP UI.
```
