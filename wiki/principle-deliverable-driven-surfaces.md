# Principle — Deliverable-Driven Surfaces (the Type System for Interaction)

**Status: complete** · _Created 2026-06-28. The operational layer beneath [`principle-graph-materialization.md`](principle-graph-materialization.md): if a surface is a *materialized view* of the business graph, then **the deliverable's type is what selects which view to materialize, how to preview it, and how to accept it.** This is how AMTECH runs hundreds of different skills, across many departments and verticals, on a handful of surfaces — without hand-designing a screen for each one. Companion to the build-plan's Work Surface vision ([`MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`](MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md)) and the platform architecture ([`product-agent-platform-architecture.md`](product-agent-platform-architecture.md), Plane 2). Grounded in current generative-UI / agent-UX standards [S090–S094]._

> **The one-line principle.** _Don't design screens for skills. Type the deliverable, and let the type drive the preview, the proof, and the gate — so one interaction grammar serves a thousand tasks across every department, surface, and owner._

---

## 1. The problem the MVP doesn't yet feel — but the platform must solve

The current build (`../mvp-build/`) already renders the **typed set** — the `WorkEventDescriptor` contract with a fixed component per deliverable type, the move/acceptance grammars, and gate-by-type — for the estimate document, the Gmail outbound message, the Stripe money movement, and the job-folder bundle ([`MVP/event-driven-office-and-generative-ui.md`](MVP/event-driven-office-and-generative-ui.md) §4). But those descriptors are *Manager-authored for a handful of flows*. This page is about the part that isn't solved yet: **what happens when the same employee runs not one task but hundreds of them, across departments, in formats that have nothing in common** — which needs the *agent* to author the typed descriptor, over the message-to-agent event path, not a human hand-coding each one.

Picture the real product a year out. One owner's employee, in one week, produces:

- an **estimate** (PDF, leaves the business, money-adjacent) →
- a **supplier order** (email to a vendor, external send) →
- a **week-ahead cashflow brief** (a glanceable recommendation, internal) →
- a **batch of 40 enriched leads** (a data table, internal, reviewable in bulk) →
- a **rescheduled job** (a calendar mutation, reversible) →
- a **deposit invoice** (money movement, hard gate) →
- a **before/after photo set for a review post** (media, external publish) →
- a **monthly books package for the bookkeeper** (a multi-file bundle, internal handoff).

Now multiply by **every vertical** (painters, landscapers, bookkeepers, and the bowling-pin segments after them — [`strategy-4-year-implications.md`](strategy-4-year-implications.md)), by the **~24+ skills per vertical** ([`offers/skill-catalog.md`](offers/skill-catalog.md)), and by **every owner's idiosyncratic way of working.** You cannot hand-build a screen, a preview, and an approval flow for each of the thousands of (skill × vertical × surface) cells. That is the combinatorial wall every agent product hits — and the industry has named it: _"most agent experiences still rely on chat, even when the task clearly needs forms, previews, controls, or step-by-step feedback"_ [S090, doc 15 §1].

**The answer is not more screens. It is a type system.** Each deliverable declares *what kind of thing it is*; the surfaces know how to render, preview, and gate each kind. Add a new skill and you don't design a new UI — you **pick a deliverable type that already has a humane interaction**, the way a new file on a Macintosh desktop already knows how to show an icon, a preview, and a "are you sure?" before it's thrown away.

---

## 2. The core move — the deliverable is a typed object, and the type drives the interaction

Extend the graph-materialization definitions ([`principle-graph-materialization.md`](principle-graph-materialization.md)) by one notch:

- A **skill is a traversal** that writes a node. (already established)
- A **surface is a materialized view** of a node. (already established)
- **The deliverable is the typed node a task produces — and its type is the selector that picks the view, the preview, the proof, and the gate.**

This is the same idea that runs the whole computing stack: a **MIME type** (`application/pdf`, `image/png`) tells any client how to render bytes it has never seen; a file extension tells the desktop which icon and which "open with." The agent industry is rediscovering exactly this. MCP Apps now lets a tool _"return interactive UI components that render directly in the conversation: dashboards, forms, visualizations, multi-step workflows"_ by attaching a typed UI resource (`ui://…`, rendered in a sandboxed iframe) to the tool's output — **the output's declared type determines the rendered interface** [S091]. Generative-UI frameworks formalize the same thing as a spectrum: _static_ (the agent picks a pre-built component and fills it), _declarative_ (the agent returns a typed JSON description of the UI), and _open-ended_ (the agent emits raw markup) [S090].

AMTECH's version is deliberately **typed and pre-built, not open-ended** — because the painter must never be surprised by a UI, and because trust requires that "send an email" *always* looks and feels the same no matter which of 200 skills produced the email. So every skill, when it finishes, emits a small **deliverable descriptor** alongside its artifact:

```yaml
deliverable:
  type: outbound_message        # the selector (see §4 taxonomy)
  format: email                 # how to render the body
  title: "Estimate for Jane — Smith repaint"
  preview: { inline: pdf, link: signed }   # how to show it before acceptance
  leaves_business: true         # → triggers the confirmation gate
  reversible: false
  money: { involved: false }
  recipients: ["jane@…"]
  acceptance: [approve, edit, reject]       # the offered decisions (§5)
  repeatable: false             # one-off vs standing (§7)
```

That descriptor is the entire contract between an open-ended catalog of skills and a fixed, humane set of surfaces. The skill author thinks about *the work*; the descriptor is how the work tells the surface how to be shown and approved. **This is the buildable heart of "materialize the right view" — the descriptor is the query that selects the materialized view.**

---

## 3. The task interaction lifecycle — every task is the same six moments, typed differently

A task is not one interaction; it is a **sequence of surface moments**, and the deliverable type shapes each one. The owner experiences the same six-beat rhythm whether the deliverable is an estimate or a 200-row lead table — which is exactly why the product stays learnable as the catalog explodes.

| Moment | What the owner does/sees | What the deliverable type controls |
|---|---|---|
| **1. Creation / intake** | States the task in natural language ("estimate the Smith job," "pull me 40 roofers in Scranton") | Whether intake needs a **form** (structured params), a **conversation** (the walkthrough), or **ambient capture** (a voice memo). Conversational/multi-step intake out-converts static forms [S079] — default to talking, escalate to a form only when the type needs precise inputs. |
| **2. Plan / scope confirm** | _(high-stakes or expensive tasks only)_ "Here's what I'll do — go?" | Whether a pre-flight plan-approval is warranted (a 40-call outbound run, a bulk delete) vs. just doing it (a draft). Maps to the proposal-approval loop [S094]. |
| **3. Progress / work-in-progress** | A calm "doing it now" line, not a tool log | The **altitude and verbs** of narration ("pulling your Sherwin pricing," "enriching lead 12 of 40"), and whether progress is worth showing at all (doc 15 §5: only narrate work long enough to matter). |
| **4. Preview / verification** | Looks at the result before it's real | **The preview surface itself** — inline PDF, a data-table with sortable rows, a diff, a map, a one-line verdict with drill-down, a "check your texts" link. This is the §4 taxonomy's core column. |
| **5. Acceptance / approval** | Yes / tweak / no | **Which decisions are offered** (approve · edit · reject · respond [S092]) and **how hard the gate is** (silent auto, one-line yes, typed confirmation for money). |
| **6. Delivery / handoff + follow-through** | The thing happens; a quiet proof; an offered next move | The **proof format** (Twilio SID, Gmail message-id, Stripe receipt — shown as trust, never jargon) and whether the task becomes **repeatable/standing** (§7). |

The MVP collapses moments 2–6 for the estimate into "preview PDF → yes → sent ✓." That's correct *for that type*. The generalization is: **each moment is a function of the deliverable type**, so a new skill inherits the whole lifecycle for free by declaring its type — it never re-implements progress, preview, or approval.

---

## 4. The deliverable type taxonomy — format informs preview, proof, and gate

This is the table the whole page exists to produce: the open-ended, business-wide range of things a skill can deliver, and what each *type* implies for how it's previewed and accepted. It is deliberately small (a dozen types covers nearly everything across every department) because **the power is in the types being few and the skills being many.**

| Deliverable type | Examples across departments | Default preview surface | Acceptance form | Risk gate (default) |
|---|---|---|---|---|
| **Document** | estimate, proposal, contract, crew packet, SOW, offer letter | Inline render (PDF/doc) + signed link | approve · edit · reject | Internal: none. Leaves business: gate. |
| **Outbound message** | customer email/SMS, supplier order, follow-up, review request | The exact payload shown (to / subject / body / attachment) | approve · edit · reject | **Always gated** (it leaves the business) |
| **Money movement** | deposit invoice, refund, payment, payout, bill-pay | Amount + party + reason, in plain words | approve only (typed confirm for large/refund) | **Hard gate, always** — the signature interaction (doc 15 §3) |
| **Dataset / report** | enriched lead list, AR aging, win-rate analysis, books export | Sortable/filterable **table** + summary headline; bulk-review affordances | accept-all · edit-rows · reject; sample-and-trust | Internal: light. Export/send: gate. |
| **Recommendation / decision** | "should I take this job?", pricing-drift alert, cashflow brief, daily plan | **One-line verdict**, reasons one tap away (graph-materialization §"decision surfaces") | acknowledge · ask-follow-up (respond [S092]) | None (advisory) — the owner decides |
| **Schedule / calendar mutation** | book job, reschedule, set reminder, dispatch crew | Before→after on a day/week strip | approve · edit | Reversible: light. Customer-visible: gate. |
| **Structured record write** | CRM contact, job status, inventory, lead intake | The field changes ("status: won, $4,200") | approve · auto (if low-risk standing) | Internal reversible: act-then-report |
| **Media asset** | before/after set, generated image, marketing post | Thumbnail/gallery preview | approve · edit · reject | Internal: none. Publish: gate. |
| **Multi-artifact bundle ("job folder")** | estimate→email→deposit→reminder; monthly books package | A **folder view** joining the related artifacts | per-item or whole-bundle approve | Per-item gates roll up |
| **External-system action** | file a permit, order materials on a supplier site, post a listing | The action + target, with a dry-run summary | approve (plan-confirm for multi-step) | **Gated** (acts in the outside world) |
| **Plan / proposal-of-actions** | an outbound campaign, a batch operation, a cleanup | The list of steps it will take | approve-plan · edit-steps · reject | Gate before execution; then progress |

**Read this table as the product's interaction contract.** Two facts make it work:

1. **The same type behaves identically everywhere.** "Outbound message" feels the same whether it's a painter's estimate email or a bookkeeper's client reminder or a future recruiter's candidate note. The owner learns the grammar *once* and it holds across every skill and every vertical — the definition of a Macintosh-grade interface.
2. **The gate is a property of the type, not the skill.** "Does this leave the business / spend money / act in the world?" is answered by the descriptor's `leaves_business` / `money` / `reversible` flags, which means the [`product-ai-employee-context.md`](product-ai-employee-context.md) confirmation gate is enforced *structurally* across the whole catalog — you cannot author a money-touching skill that forgets to ask. That is trust-by-design, embedded in the type system rather than bolted on per skill [S094].

---

## 5. The acceptance grammar — typed decisions, surfaced per format

Acceptance is not a binary. The agent industry has converged on a small decision vocabulary for human-in-the-loop work — **approve · edit · reject · respond**, configurable per tool [S092] — where _"the agent handles the mechanical labor and the human handles the judgment calls."_ AMTECH adopts exactly this vocabulary and lets the **deliverable type choose which decisions to offer** and the **surface choose how to render them**:

- **Outbound message / document** → `approve · edit · reject`. On SMS: "Send it? yes / no / change X." On web: an inline editable preview with an Approve button (sugar over the same "yes" — [`06-interaction-wrapper.md`](MVP/old-build-plan/06-interaction-wrapper.md)).
- **Money movement** → `approve` (and a typed confirm for large/irreversible). Never an "edit the amount inline" affordance that could fat-finger a payout.
- **Dataset** → bulk decisions the type makes possible: `accept-all`, `reject-rows`, or **sample-and-trust** ("I checked 5 of 40, they're good — accept the rest?"). A 200-row table needs a different acceptance shape than a one-line email, and the type is what knows that.
- **Recommendation** → `respond` (ask a follow-up) or `acknowledge` — there's nothing to approve, only to decide on. The gate would be noise; the type says "advisory," so no gate.

**The surface is a renderer of the same acceptance primitive, not a different decision.** "Reply YES" (SMS), tapping Approve (web), and saying "yeah, send it" (voice) all resolve **one** Manager approval record ↔ Hermes `run_approval` (doc 15 §5, [`product-agent-platform-architecture.md`](product-agent-platform-architecture.md)). Start a task on the web and approve it over SMS — no loss, because the decision lives on the deliverable, not the screen.

---

## 6. The five variability axes — one descriptor, many renderings

The user's hardest question: the interaction must differ by business type, by Hermes profile, by the task, by *how each owner uses their setup*, and across present and future surfaces. The type system answers it cleanly: **the descriptor is invariant; the rendering is a pure function of `descriptor × axes`.** Same object, projected through five lenses (this is graph-materialization's "materialized view," made parametric):

1. **Business type / vertical.** The type set is shared; the *vocabulary and templates* differ. A painter's "document" is an estimate with line-items and a logo; a bookkeeper's "document" is a reconciliation summary. The **profile package** ([`product-agent-platform-architecture.md`](product-agent-platform-architecture.md): `contractor_estimator` is the first) supplies the vertical's templates, default skills, and brain shape — so the same `document` type renders in the dialect of the trade.
2. **Hermes profile config.** Per-profile connectors, enabled skills, model floor, and `tool_progress` settings change what's *available* and how chatty progress is. The descriptor names the type; the profile decides whether the email connector exists to fulfill it, and whether progress narrates or stays silent [S085–S087].
3. **The task at hand.** Stakes and reversibility ride on the descriptor's own flags (`money`, `leaves_business`, `reversible`), which is why a $50 reminder and a $5,000 refund — both "money movement" — get different confirmation weight from the *same* type.
4. **The individual owner's usage style (trust calibration).** The most overlooked axis and the stickiest. One owner wants to approve every email; another says "just send the routine follow-ups, only ask me on anything over $2k." The system stores **per-owner, per-type policy** — an autonomy setting attached to the (owner × deliverable-type) pair — so the *same* descriptor yields a gate for one owner and an act-then-report for another. This is progressive autonomy made personal (§7).
5. **The surface (present and future).** SMS, web Work Surface, voice — and tomorrow's email-thread, Slack, a partner's embedded panel. Each is a **thin renderer** that knows how to draw each deliverable type at its own fidelity: SMS shows a headline + link, web shows the inline table, voice reads the verdict and texts the artifact. New surfaces are cheap precisely because they only need to implement "how do I show each of ~12 types," not "how do I show each of 1,000 skills."

The payoff: **adding a skill, a vertical, a connector, or a whole new surface never multiplies the design work** — each only has to speak (or render) the same dozen types. The combinatorial wall of §1 collapses into a small matrix of types × surfaces.

---

## 7. Unique vs repeatable — the progressive-trust ladder (and the upsell engine)

The user's "unique or repeatable, depending on…" is the axis that turns interaction design into *revenue*. Some deliverables are one-offs (this estimate); many are standing work (weekly invoices, the daily brief, monthly books). The interaction must **change as a task repeats and earns trust** — and that change is the whole product's flywheel.

The industry frame is **progressive autonomy**: _"AI agents earn expanded permissions over time based on observed performance… trust compounds"_ — agents prove reliability on low-stakes work, which justifies expanding their permissions [S093]. The canonical tiers [S093]: **Level 0 draft-only → Level 1 supervised (auto low-stakes, escalate above a risk threshold) → Level 2 monitored autonomy (act + notify) → Level 3 full autonomy within guardrails.** AMTECH maps this onto the (owner × deliverable-type) policy from §6 axis 4:

| Stage | What the employee does | What the owner feels |
|---|---|---|
| **First run (always)** | Full preview + gate, every time | "It showed me everything before doing anything." |
| **Earned (repeat, low-risk type)** | Offers a **standing approval**: "I've sent 6 of these and you've okayed every one — want me to just send routine follow-ups from now on and only flag the unusual ones?" | "It learned how I work." |
| **Standing (internal/reversible)** | Acts then reports (Level 2): the morning brief, status writes, reminders | A calm, quiet office that just runs |
| **Always gated, forever (by type)** | Money movement and anything irreversible **never** graduate past a one-line confirm — by design, not by oversight | "It never spends my money without asking." |

Two non-negotiables hold this pro-human (`identity.md` §V):

- **The gate that protects money and the customer relationship never disappears.** Repeatability graduates *internal, reversible* work toward autonomy; it never auto-fires an irreversible external action. The type system enforces this because the `money`/`reversible` flags veto graduation.
- **Standing approvals are revocable in one sentence** ("go back to asking me about follow-ups"), and every autonomous action still leaves the quiet proof of §3 moment 6.

**Why this is the upsell engine, not just UX.** A tool that only drafts is easy to cancel; a coworker you've *trained to run your follow-ups while you sleep* is not. The repeatable-task ladder is the literal mechanism by which the Estimate wedge becomes the always-on AI Employee ([`offers/wedge-offers.md`](offers/wedge-offers.md), [`00-decision.md`](00-decision.md)): the owner feels the glue-work pain dissolve one graduated task at a time, and each graduation deepens the switching cost (the trained policy is part of the graph that can't be exported — graph-materialization §"compounding moat"). Repeatable tasks are Hermes primitives already (a skill + an optional cron/job — [`product-agent-platform-architecture.md`](product-agent-platform-architecture.md) Plane 2.4); the descriptor's `repeatable` flag is what lets the *interaction* graduate with them.

---

## 8. Why this is cheap to build — taste is the scarce input, not code

Graph-materialization's central economic claim — _"when the engineering cost of a new surface approaches zero, the scarce input becomes judgment about which views actually move the owner's life"_ — is what makes this whole type system affordable. The build seam is small and rides standards that the rest of the industry is hardening right now:

- **The descriptor** is a few fields each skill emits (§2) — trivial to author, and it's the *only* new contract.
- **The adapter** already exists in the plan: doc 15 §5's Hermes→Work adapter consumes the run/session SSE stream and emits a small, stable, **AG-UI-shaped** vocabulary the surfaces render. The deliverable descriptor becomes one more event type on that channel.
- **The renderers** lean on generative-UI standards rather than bespoke screens: **static/declarative generative UI** (the agent picks a typed, pre-built component and fills it — never open-ended for our ICP) [S090], and **MCP Apps / MCP-UI** typed UI resources rendered in a sandboxed iframe when a richer interactive component is warranted [S091]. AMTECH ships a fixed component per deliverable type; the agent only ever *selects and fills*, so the painter is never surprised.
- **The acceptance layer** is the existing Manager approval primitive ↔ Hermes `run_approval`, with the decision vocabulary of [S092] mapped per type (§5).

So the marginal cost of the *N-th* skill's interaction is ~zero: it declares a type that already has a humane, trusted lifecycle. **What remains scarce — and where the founder's Tier-D taste must go (`principle-agent-leverage.md`)** — is deciding *which deliverables deserve which preview altitude and which gate*, and which repeatable tasks are worth offering to graduate. That judgment is the product. The plumbing is a solved problem the industry is standardizing under us.

---

## 9. The Macintosh moment, stated precisely

Doc 15 calls AMTECH "the Macintosh to the AI agent's PC" because it renders a developer event stream into a coworker a non-technical owner trusts. This page is the part of the Macintosh that actually made it the Macintosh: **not the windows, but the *consistency*.** Every Mac app, written by anyone, shared the same File menu, the same drag-to-trash, the same "are you sure?" — so a person who learned *one* app could use *every* app. The interface was a contract every program honored, and that contract is what made a room full of Macs in 1985 lightyears ahead of a room full of command lines.

The deliverable type system is that contract for the AI Employee. Across hundreds of skills, in every department, for every vertical, on every surface present and future, the owner meets the **same dozen ways a deliverable can be previewed, proven, and approved.** An office with an AMTECH employee isn't running a thousand unrelated automations the owner has to learn one by one — it's running one coworker who shows every kind of work the same trusted way. That coherence, not any single skill, is the leap. It's the difference between the robot arm bolted to one espresso machine in the SFO terminal and an actual barista who can make anything you order and hand it to you the same way every time.

---

## 10. Design laws (every surface, every deliverable type passes these)

- [ ] **Type before screen.** A new skill declares a deliverable type; it never designs a bespoke preview or approval. If a skill needs a type that doesn't exist, that's a deliberate platform decision, not a one-off screen.
- [ ] **The gate is a property of the type, not the author.** Money / leaves-business / irreversible deliverables are gated structurally — a skill cannot opt out.
- [ ] **One acceptance primitive, many renderings.** SMS "yes," web Approve, voice "send it" resolve the *same* record; start on one surface, finish on another, no loss.
- [ ] **Same type, same feel, everywhere.** "Outbound message" looks and behaves the same across every skill, vertical, and surface — the learnability contract.
- [ ] **Repeatability graduates trust, never the irreversible gate.** Standing approvals only ever cover internal, reversible work; money and external actions keep a confirm forever; every standing action leaves a quiet proof; one sentence revokes.
- [ ] **Preview altitude fits the type.** A one-line verdict for a recommendation; a sortable table for a dataset; the exact payload for a send; never a wall of tool logs (doc 15 §7).
- [ ] **Per-owner policy is honored.** The same descriptor yields a gate or an act-then-report according to *this* owner's trained calibration.

---

## 11. Phasing — from today's typed renderers to the agent-authored catalog

_Current sequencing lives in [`MVP/event-driven-office-and-generative-ui.md`](MVP/event-driven-office-and-generative-ui.md); this list is kept in step with it._

- **Shipped in code (`../mvp-build/`):** the **deliverable descriptor is a typed object in code** (`WorkEventDescriptor`), with a **fixed renderer for all ~11 types**, the move grammar (notify/question/review), the acceptance grammar (approve/edit/reject/respond/acknowledge), the **job-folder bundle**, and the **gate enforced structurally by type**. This is the **static** stage of generative UI [S090] — the renderer half — and it is *Manager-authored* over a polled snapshot today (the descriptor is built by Manager tools, not yet by the reasoning employee).
- **Next — agent-authored descriptors (declarative generative UI):** wire the **message-to-agent** path + the live Hermes→Work adapter so the *employee* emits the descriptor over an AG-UI-shaped channel (not hand-built per Manager flow), and the surfaces stream "doing it now." This is the move from static/Manager-authored to declarative/agent-authored — the catalog then scales without new screens.
- **Then — per-owner trust calibration (§6 axis 4, §7):** the (owner × deliverable-type) autonomy policy + standing approvals; the upsell engine turned on; money/customer gates stay forever.
- **Later:** **interactive** generative UI via MCP Apps / MCP-UI [S090, S091] for types that warrant real widgets (dataset tables, schedule strips, diffs); **voice** as a third renderer of the same types; **multi-employee / org** where a deliverable can be *handed off* between employees (a new "handoff" sub-type of bundle).

Each step adds **types** (and the *agent's* ability to author them), not screens — and every existing surface picks the new type up for free.

---

## 12. How it shows up across the brain

- [`principle-graph-materialization.md`](principle-graph-materialization.md) — the parent theory: skill = traversal, surface = view. This page adds: **deliverable type = the selector** that picks the view, preview, and gate.
- [`MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`](MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md) — the Hermes→Work adapter and the three move-types (notify/question/review) this type system rides on.
- [`product-agent-platform-architecture.md`](product-agent-platform-architecture.md) — Plane 2's four interaction primitives (progress, preview, feedback, repeatable tasks); profile packages as the per-vertical dialect (§6 axis 1).
- [`offers/skill-catalog.md`](offers/skill-catalog.md) — the ~24 traversals that each declare a deliverable type instead of a bespoke UI.
- [`offers/wedge-offers.md`](offers/wedge-offers.md) / [`00-decision.md`](00-decision.md) — the repeatable-task trust ladder (§7) as the wedge→Employee upsell mechanism.
- [`principle-agent-leverage.md`](principle-agent-leverage.md) — who chooses which previews/gates matter (the founder, Tier D); the agents render the rest.

---

## 13. Sources

Design-pattern / agent-UX ground truth (fetched 2026-06-28), exempt from the operator-pain "source rule" the same way the Hermes capability docs [S086–S089] are — these establish *what the interaction-layer standards do*, not market demand:

- **[S090]** Generative-UI patterns 2026 — static / declarative / open-ended generative UI; the agent selects-and-fills a typed component; chat alone fails tasks that need forms/previews/controls. <https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026>, <https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces>, A2UI / Open-JSON-UI declarative schemas.
- **[S091]** MCP Apps / MCP-UI — tools attach typed UI resources (`ui://…`, sandboxed-iframe render); _the output's declared type determines the rendered interface_. <https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/>, <https://mcpui.dev/guide/introduction>.
- **[S092]** Human-in-the-loop decision vocabulary — **approve · edit · reject · respond**, configurable per tool; agent does mechanical labor, human makes judgment calls. <https://docs.langchain.com/oss/python/langchain/human-in-the-loop>.
- **[S093]** Progressive autonomy — trust compounds as agents earn permissions; Levels 0–3 (draft-only → supervised → monitored → full-within-guardrails); risk-tiered gating (auto / log-and-alert / require-approval). <https://www.mindstudio.ai/blog/progressive-autonomy-ai-agents-safe-deployment>.
- **[S094]** Trust-by-design / proposal-approval loop — guardrails and approval logic embedded in the agent's DNA (Governance-as-Code); intermediate autonomy preferred over set-and-forget. <https://www.anthropic.com/research/measuring-agent-autonomy>, UiPath "Trust by Design" 2026.
</content>
</invoke>
