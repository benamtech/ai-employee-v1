# AMTECH AI Employee v1

This repository is the AMTECH company brain plus the build home for the AMTECH AI Employee MVP.

AMTECH AI is building a pro-human, owner-operated SMB AI Employee: a textable, always-on office worker that can receive events from the tools a business already uses, understand them against the company's own context, do the safe work, and ask the owner for judgment only when it matters. The first beachhead is owner-operated painting and landscaping contractors, but the architecture is built for vertical employees across many SMB back-office roles.

The repo has two major jobs:

1. **Company brain:** the strategy, market evidence, product decisions, pricing, sales motion, architecture, and operating doctrine live in `wiki/` and the root orientation files.
2. **Product build:** the software for the flagship AI Employee product lives in `mvp-build/`.

Start every agent session with:

1. `identity.md`
2. `CLAUDE.md`
3. `CODEGRAPH.md`

Those files define the operating identity, repo rules, canonical facts, and navigation graph.

## Product Summary

The AMTECH AI Employee is a managed vertical worker for small businesses: one textable employee that receives work from the owner, connected tools, webhooks, scheduled jobs, and future systems; reasons over that work against the business brain; does the safe parts; and brings only the real decisions back to the owner.

For a contractor, that can mean turning job notes, photos, email threads, past pricing, and customer replies into estimates, follow-ups, deposit invoices, reminders, and next-step recommendations. For another business, the same pattern can become a bookkeeping employee, a back-office coordinator, a customer follow-up worker, or any vertical office role where the hard part is not one isolated task but the ongoing flow of events across tools.

The product is not "an estimate generator." It is an **event-driven AI office**:

```text
any source of work
  -> normalized message to the employee
  -> business-brain context
  -> Hermes employee reasoning / skill / Job / tool call
  -> typed work event or artifact
  -> owner surface: SMS, web Work Surface, future voice
  -> approval / edit / reply / acknowledgement
  -> action taken
  -> new events feed back into the same employee
```

The owner experiences one relationship: one employee, one number, one thread. The connected systems become sources that talk to the employee, not dashboards the owner has to monitor. The employee can receive an email reply, a paid invoice, a due reminder, a completed background Job, or an inbound owner message as the same primitive: a message to the agent. The employee then decides whether to notify, batch, ignore, ask, draft, prepare, or escalate.

The power of the product is the **tool-agnostic task flow**:

- Sources are pluggable: Gmail, Stripe, Twilio, Supabase, scheduler ticks, internal Jobs, owner messages, and future connectors can all become event sources.
- Work is type-driven: documents, outbound messages, money movement, schedule mutations, structured record writes, recommendations, job folders, and other deliverables share one preview and approval grammar.
- The gate is structural: customer-facing and money-touching actions require owner approval; internal reversible work can be done and reported.
- The surface follows the owner: SMS for ambient updates, web Work Surface for review and artifacts, future voice for urgent or hands-busy work.
- The business brain compounds: pricing, customers, preferences, assumptions, and repeated workflows become durable context.

The contractor Estimate workflow is the beachhead and proof object, not the ceiling. It proves the product can capture business-specific context, produce a real artifact, ask for approval, send through a real connector, receive the downstream event, and continue the job loop. The broader product is the connected employee that keeps doing this across tasks and tools.

The minimum engineering acceptance path is deliberately narrower than the product promise. The team uses a contractor estimate sequence - signup/claim, live employee, estimate PDF, approved Gmail send, real Gmail reply, approved Stripe test-mode deposit invoice, internal reminder - as the basic "all rails are alive" test before putting pilots live. That sequence proves the foundation works; it should not be mistaken for the full capability model.

## UI And Surface Work

The current product frontier is the owner surface: making the power of the Hermes-backed employee legible to a nontechnical business owner. The backend now has meaningful Manager, MCP, artifact, approval, event, runtime, scheduler, and metering seams. UI work turns that raw power into an employee desk the owner can understand and trust.

For UI contributors, start at `mvp-build/ui-handoff/`. That packet explains:

- what AMTECH is and why this product is powerful;
- how to distinguish `wiki/` product truth from `mvp-build/` implementation truth;
- the current Work Surface source map;
- current styling and component scaffolding;
- Hermes GUI and generative-UI research;
- experimental future surface ideas: SMS signed previews, preview thumbnails, image/video/media artifacts, task progress, reports, and cross-surface representations;
- how to write memories and handoffs while UI work happens in parallel with MVP functionality.

The immediate UI priority is the web Work Surface. SMS, signed preview links, media/video previews, admin, and future desktop clients should be designed as renderers of the same underlying work/resources/actions, but the web client is the richest and most urgent place to make the product understandable.

UI contributors can work without full infrastructure:

```bash
cd mvp-build
npm run ui:dev          # fixture-backed web client
npm run ui:browser      # headed browser for visual work
npm run ui:test         # UI-only Playwright smoke
```

These commands use representative local fixture data and do not require Manager, Supabase, Docker, Hermes containers, provider credentials, or model calls. They are for UI development, not provider/runtime acceptance.
The browser smoke warms the fixture Work Surface route and writes desktop/mobile screenshots to `mvp-build/infra/.local/ui-fixtures/`.

## How The Repo Is Organized

```text
.
├── identity.md                    # required operating identity for AMTECH work
├── CLAUDE.md                      # root agent operating instructions
├── CODEGRAPH.md                   # root workspace map and canonical facts
├── index.html                     # local browser explorer for the brain/codebase
├── wiki/                          # AMTECH strategy, evidence, product plans, build plans
└── mvp-build/                     # AI Employee MVP software build home
```

### Root Documents

- `identity.md` establishes the AMTECH operating self-image and voice.
- `CLAUDE.md` explains how agents should work in this repo.
- `CODEGRAPH.md` is the authoritative orientation map for the whole workspace.
- `index.html` is a local explorer for browsing the wiki and selected source files.

### `wiki/`

`wiki/` is the living operating brain. It contains the beachhead decision, market evidence, sales motion, product strategy, build plans, implementation records, and phase docs.

High-value starting points:

- `wiki/00-decision.md` - current beachhead, offer, pricing, pitch, and execution decision.
- `wiki/product-ai-employee-context.md` - product mechanics and employee thesis.
- `wiki/product-agent-platform-architecture.md` - AMTECH-owned platform layer around Hermes.
- `wiki/MVP/build-plan-current/` - current reconciled AI Employee build plan.
- `wiki/MVP/build-plan-current/phases/` - dependency-ordered implementation phases.
- `wiki/MVP/implementation-records/` - factual record of what is actually wired in `mvp-build/`.
- `wiki/MVP/agent-inbox-and-channel-architecture.md` - current session/channel architecture decision.

Treat the wiki as current truth, not an archive. If a product or strategy fact changes, update every affected page rather than leaving stale history in place.

Use the wiki to understand **why** the product exists, what it should become, what the owner should feel, and what strategic constraints matter. The wiki contains product vision and planning; it does not prove a feature is already implemented.

### `mvp-build/`

`mvp-build/` is the TypeScript/Node monorepo for the AI Employee MVP. It is the software product inside the company brain.

It contains:

- `apps/web/` - Next.js web front door, claim/login routes, owner Work Surface, artifact routes.
- `apps/manager/` - backend Manager control plane, tools, webhooks, orchestrator, provisioner, runtime delivery.
- `packages/shared/` - shared contracts for tools, IDs, manifests, routes, profile packages, and work events.
- `packages/db/` - Supabase clients and SQL migrations.
- `packages/agent-template/` - AMTECH-authored Hermes profile package and employee workspace.
- `infra/` - Caddy, Hermes runbook, acceptance scripts, ops scripts.
- `tests/` - unit, integration, and golden-path acceptance docs.
- `docs/` - planned admin and metering architecture.
- `memory/` - durable agent handoffs and implementation decisions.
- `ui-handoff/` - UI contributor orientation, source map, product grounding, research index, experimental surface backlog, and parallel-work protocol.

Use `mvp-build/` to understand **what is actually wired**, what commands to run, what source files to edit, and what proof exists. If the wiki vision and source reality differ, check `mvp-build/CODEGRAPH.md`, `mvp-build/memory/MEMORY.md`, newest memory notes, tests, and source before claiming status.

Current state: the second-half plan is active in `mvp-build/second-half-plan/`. Phase 1 preservation is source/static-green with the live gate blocked by model/provider availability. Phase 2 web Work Surface is source-wired. Phase 3 SMS signed previews, Phase 4 generic materialization contracts, and Phase 5/6 trial operations and readiness remain planned/pending. Live provider/runtime acceptance is still pending real proof IDs where required.

## Hermes Agent Boundary

The AI Employee uses **Hermes agent from Nous Research** as the underlying open-source agent substrate. Hermes provides the profile/runtime/agent substrate. AMTECH owns the product layer around it:

- provisioning and profile rendering;
- the invisible Manager backend control plane;
- account/session/approval boundaries;
- web and SMS owner surfaces;
- Gmail, Stripe, Twilio, Supabase, scheduler, repair, and event-mesh integration;
- Work Surface rendering;
- admin, metering, and operations plans.

Important architecture rule: the owner should not experience "Hermes" or "Manager." The owner experiences their employee.

The current major product/software priority is session management around the Hermes employee: one employee, one number, one continuous thread across SMS/web/future voice, with a Manager-owned Channel/Session/Presence router deciding where output lands.

## How Agents Should Navigate This Repo

### 1. Use The Root Codegraph First

Read `CODEGRAPH.md` before making decisions. It tells agents:

- what the whole repo is;
- which facts are canonical;
- which files are highest value;
- how root docs, wiki pages, implementation records, and `mvp-build/` relate;
- what must be updated when a fact changes.

Use the root codegraph when you are answering:

- "What is this repo?"
- "What is the current AMTECH decision?"
- "Where is the source of truth?"
- "Which docs should be updated if this changes?"
- "How does the company brain connect to the product code?"

### 2. Use The Wiki For Product, Strategy, Evidence, And Build Plans

Use `wiki/` when you need intent, rationale, scope, or current product truth. The wiki answers why the product exists, who it is for, what the offer is, what the MVP bar is, and how the next phases should be sequenced.

For implementation work, do not start from source alone. Read:

1. `wiki/MVP/build-plan-current/README.md`
2. `wiki/MVP/build-plan-current/phases/README.md`
3. The relevant phase file.
4. `wiki/MVP/implementation-records/README.md`
5. The latest relevant implementation record.

The original whole-product packet remains in `wiki/MVP/old-build-plan/`; use it for mechanics, not current sequencing.

### 3. Use The MVP Build Codegraph For Software Work

Read `mvp-build/CODEGRAPH.md` before editing source in `mvp-build/`. It maps:

- user-facing workflows to code paths;
- web routes to Manager routes;
- Manager tools to shared contracts and migrations;
- Hermes profile files to provisioning and runtime code;
- provider/event flows to webhooks, event delivery, work events, and Work Surface rendering;
- current source-wired features versus planned/pending phases.

Use it when you are answering:

- "Where is this feature implemented?"
- "Which files are involved in onboarding/provisioning/Gmail/Stripe/reminders/session routing?"
- "What is source-wired versus provider-accepted?"
- "How does `mvp-build/` use Hermes?"
- "Where should the next phase plug in?"

## Development Notes

Inside `mvp-build/`, baseline checks are:

```bash
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration
npm run acceptance:preflight
npm run acceptance:report
```

Integration and acceptance checks are environment-gated. Do not claim provider or runtime acceptance unless the run leaves real proof IDs.

Generated/local folders should not be committed:

- `.claude/`, `.agents/`, `.codex/`
- nested `.git/` directories
- `node_modules/`
- `.next/`
- `dist/`
- acceptance report outputs

## Rule Of Thumb

Root `CODEGRAPH.md` tells you how the whole AMTECH brain fits together.

`wiki/` tells you what AMTECH believes, sells, plans, and has proven.

`mvp-build/CODEGRAPH.md` tells you how the AI Employee software is wired.

When in doubt, read in that order before touching code.
