# Product Grounding For UI Work

Status: archived reference

Purpose: ground a UI coding agent in what AMTECH is, why the product is powerful, and how to navigate the wiki versus `mvp-build/`.

## The Product In One Sentence

AMTECH packages Hermes Agent by Nous Research into a trusted AI employee and chat-native business work surface for small-business owners, starting with owner-operated painters and landscapers.

The owner should experience one capable employee who can be texted, inspected on the web, and trusted to do office work with approval gates. The owner should not experience a model, a tool catalog, a developer console, or a pile of disconnected automations. The current UI risk is that chat, tasks, outputs, and activity look like separate products; the target is one operating surface where chat creates work objects and those objects carry preview, action, proof, and history.

## Why This Is Powerful

The product is not "AI estimates." Estimates are the first proof object because they are concrete, valuable, and easy for a contractor to judge.

The bigger product is a small-business employee that can:

- intake a customer request;
- ask the owner for missing details;
- create structured estimates and documents;
- draft customer emails and SMS messages;
- prepare invoices and payment links;
- keep the books in order — record expenses, bills, invoices, and payments and read simple P&L/AR/AP summaries (QuickBooks), behind the approval gate;
- track replies, reminders, job status, and receipts;
- connect to email, payments, accounting, files, browser/web, and future systems;
- surface work through web, SMS, signed mobile previews, admin, and future clients;
- keep customer-facing, money, destructive, credential, and broad external actions behind approval gates.

The strategic power is the materialization layer:

```text
Hermes + Manager + provider events + business context
  -> durable work/resources/actions/proof
  -> web desk / SMS / signed preview / admin / customer link / future desktop
```

Every new tool, connector, skill, or event source should eventually become a capability, a work item, an output, a preview, an approval, or a receipt. The UI is the layer that makes raw agent power legible to a nontechnical owner.

## The Owner Mental Model

The owner is not managing software. The owner is managing a coworker.

Good owner-facing UI answers:

- What has my employee done?
- What is it doing now?
- What needs me?
- What did it produce?
- What will happen if I approve this?
- What proof exists that it actually happened?
- What can it do next?
- What is broken, and how do we repair it?

Bad owner-facing UI asks the owner to understand:

- MCP;
- API routes;
- JSON schemas;
- bearer tokens;
- runtime/toolset/config language;
- raw provider payloads;
- stack traces;
- developer logs.

## Wiki Versus `mvp-build/`

The repo has two major knowledge zones:

### `wiki/`

`wiki/` is the AMTECH company brain and product strategy layer.

It contains:

- beachhead and offer decisions;
- product principles;
- market research;
- GTM and sales context;
- MVP architecture and original/current build plans;
- implementation records;
- UI/product research and rationale.

Use the wiki to understand **why** the product exists, what it should become, what the owner should feel, and what strategic constraints matter.

High-value UI/product wiki docs:

- `wiki/README.md`
- `wiki/00-decision.md`
- `wiki/product-ai-employee-context.md`
- `wiki/product-agent-platform-architecture.md`
- `wiki/principle-graph-materialization.md`
- `wiki/principle-deliverable-driven-surfaces.md`
- `wiki/MVP/second-half-current-and-future-state.md`
- `wiki/MVP/event-driven-office-and-generative-ui.md`
- `wiki/MVP/ai-native-work-surface-research.md`
- `wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`

### `mvp-build/`

`mvp-build/` is the actual product implementation.

It contains:

- Next.js owner web app;
- Manager backend;
- shared contracts;
- database migrations;
- Hermes profile template;
- local/runtime scripts;
- tests;
- docs for admin/metering/live testing;
- durable agent handoffs in `memory/`;
- the current second-half implementation plan in `second-half-plan/`.

Use `mvp-build/` to understand **what is actually wired**, what commands to run, what source files to edit, and what proof exists.

Important: if the wiki vision and source reality differ, do not silently assume the vision is already built. Check `mvp-build/CODEGRAPH.md`, `mvp-build/memory/MEMORY.md`, newest memory notes, tests, and source.

## What Is True Right Now

Current source reality:

- Backend seams are meaningful: Manager control plane, Manager-as-MCP, schema-first tools, artifacts, approvals, events, runtime health, scheduler lanes, metering, local live-test tooling.
- Phase 1 preservation is source/static-green; live proof is blocked by model/provider availability.
- Phase 2 web Work Surface is source-wired.
- Phase 3 SMS ambient inbox + signed mobile preview/action surface (`/agent/[employeeId]/review`) is source-wired; live SMS/tool-loop proof is pending.
- Phase 4 generic materialization contracts (`SurfaceEnvelope`, `CapabilityGraphNode`, capability registry) are source-wired; the web Work Surface doesn't fully render from them yet.
- Phase 5 internal Admin console (`/admin`) is source-wired; live operator proof is pending.
- The web UI, signed Review page, and Admin console are none of them final visually.
- SMS carries a grammar-aware summary plus a signed preview link, but is still a compact renderer, not a full second surface.
- See `mvp-build/ui-handoff/data-catalog.md` for the concrete data/route inventory across all of these.

For UI work, this means the job is not to invent a different product. The job is to make the existing product power visible, comprehensible, and trustworthy.

## What A UI Coding Agent Should Preserve

- The owner talks to one employee.
- Web and SMS should render the same underlying work state.
- Every risky action has a preview and approval path.
- The same work can appear in multiple representations: chat message, task, output, job folder, SMS link, preview pane, admin record.
- Empty states should still communicate capability and readiness.
- The interface should feel like an operating desk for a real employee, not a model playground.

## What A UI Coding Agent Can Improve Aggressively

- Information architecture.
- Visual hierarchy.
- Component structure.
- Responsive/mobile layout.
- Preview pane design.
- Output/media artifact presentation.
- Task progress and activity timelines.
- Empty/loading/error/degraded states.
- Owner language.
- Browser tests and screenshots.

The app needs real design taste. Current styling is scaffolding, not a brand law.

## The North Star

A contractor should be able to open AMTECH and understand, in seconds:

> My employee is working. Here is what it knows, what it made, what it needs from me, what it can do next, and what will happen if I say yes.

That is the UI job.

The sharper north star:

> I can tell Avery what happened in plain language, and the right business surface appears: estimate, approval, customer reply, connector repair, deposit, reminder, or proof.
