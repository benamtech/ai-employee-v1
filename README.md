# AMTECH AI Employee v1

This repository is the AMTECH company brain plus the build home for the AMTECH AI Employee MVP.

AMTECH AI is building a pro-human, owner-operated SMB AI Employee: a textable, always-on office worker that helps a contractor get estimates, replies, deposit invoices, reminders, and other back-office work done without forcing the owner to learn a new software stack. The first beachhead is owner-operated painting and landscaping contractors.

The repo has two major jobs:

1. **Company brain:** the strategy, market evidence, product decisions, pricing, sales motion, architecture, and operating doctrine live in `wiki/` and the root orientation files.
2. **Product build:** the software for the flagship AI Employee product lives in `mvp-build/`.

Start every agent session with:

1. `identity.md`
2. `CLAUDE.md`
3. `CODEGRAPH.md`

Those files define the operating identity, repo rules, canonical facts, and navigation graph.

## Product Summary

The AMTECH AI Employee is a managed vertical worker for small businesses. For the contractor beachhead, the core loop is:

```text
signup / claim
  -> live employee over SMS + web
  -> walkthrough-to-estimate conversation
  -> estimate PDF artifact
  -> owner approval
  -> Gmail send
  -> real customer reply event
  -> approved Stripe Connect test-mode deposit invoice
  -> internal job reminder
```

The owner experiences one relationship: one employee, one number, one thread. The product is intentionally pro-human. The employee drafts, prepares, organizes, and follows up, while the owner stays in control at trust, customer-facing, and money gates.

The go-to-market wedge is the Estimate skill and the contractor estimate workflow. The recurring product is the connected AI Employee that absorbs the glue work: invoking skills, pasting context, handling connectors, remembering business facts, and bringing decisions back for approval.

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

Current state: Phase 0 baseline, the Phase 1 live-acceptance harness, and new-era Phase 2 runtime/scheduler productionization are source-wired. Live provider/runtime acceptance is still pending real Supabase, Twilio, Hermes, Gmail/PubSub, Stripe, host, and proof IDs.

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
