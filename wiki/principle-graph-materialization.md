# Principle — Graph Materialization (One Business Brain, Every Surface)

**Status: complete** · _Created 2026-06-28. The unifying theory under the product: the Employee, the Estimate skill, and the ~24 catalog skills are not separate apps — they are **materializations of one business graph**. This is the frontier concept the founder asked to push, and it is already half-built inside AMTECH's own published skills. Companion to [`principle-agent-leverage.md`](principle-agent-leverage.md) and [`product-ai-employee-context.md`](product-ai-employee-context.md); applied in [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md) and [`offers/skill-catalog.md`](offers/skill-catalog.md)._

## The idea in one move

A contractor's business is a **knowledge graph** — call it the *business brain*. Its nodes are the things the business is made of (customers, leads, properties, jobs, estimates, line items, materials, suppliers, crews, invoices, payments, reviews, the owner's pricing rules) and its edges are how they relate (*this lead → wants → this job*; *this estimate → prices → this scope*; *this scope → requires → these materials*; *this invoice → bills → this completed job*).

Given that graph, two definitions make everything else fall into place:

- **A skill is a *traversal*** — a path through the graph that reads some nodes and writes a new one. "Estimate" = (job + photos + pricing rules) → an *estimate* node. "Invoice" = (approved estimate + completion note) → an *invoice* node. The 24 skills are 24 traversals over the **same** graph, which is exactly why they compose and why land-and-expand is cheap ([`offers/skill-catalog.md`](offers/skill-catalog.md)).
- **A surface is a *materialized view*** — the same node, *projected and rendered* for a specific actor at a specific moment, and editable back into the graph. One estimate node materializes as: a line-item PDF for the homeowner, an SMS approval card for the owner, a Stripe deposit page for payment, a crew packet for the field, a row in the owner's dashboard. **Same data, many surfaces, each shaped to who is looking and what they're allowed to see.**

"Materialization" is borrowed precisely from data systems (a *materialized view* is a query result computed and stored so it can be served cheaply and repeatedly). Here the query is "what does this actor need to see/do right now," and the agent computes the view on demand.

## This is already native to AMTECH — not a new invention

The founder's instinct ("apply graph materialization concepts to user experiences") is not a leap; it is **naming a pattern already shipping in AMTECH's published skills** [S057]:

- **Knowledge Graph Builder** turns a business/site/topic into **typed entities and relationship edges** (with explicit relations like *solves, requires, cites, belongs-to*), plus pillar pages and JSON-LD scaffolding [S058]. That *is* building the graph.
- **OKF Audit** literally scores **"materialized views"** as a first-class quality dimension — *"alternative representations of the same core knowledge designed for different consumers: human page, static prerendered HTML, markdown/OKF concept files, JSON/manifest view, sitemap"* — recognizing that "search engines, AI systems, developers, and humans each need different surfaces to access identical information" [S059].

So AMTECH already builds graphs and already materializes multiple views of them — **for SEO/agent-readability.** The whole move on this page is to **lift that exact pattern off the marketing website and onto the entire business**: the same graph + materialized-views discipline applied to *leads, estimates, jobs, money, and the owner's decisions.* The genius idea is the one lying in front of us; we are extending our own skill, not importing a stranger's.

## Why the constraint is taste, not engineering

The reason this is the right bet *now* is the founder's own principle: **technically, serving the same brain across surfaces is almost trivial.** Hermes ships 500+ skills, native connectors and MCPs, trivial custom-MCP authoring, and easy multi-surface serving; the profile factory turns *one prompt into a complete installable profile* with bundled skills, isolation, and single-command install [S060, S061, S062]. Adding a new materialization — a new widget, a new alert channel, a new decision view — is a projection, not a product build.

When the engineering cost of a new surface approaches zero, **the scarce input becomes judgment: *which* materializations actually move the owner's life** — which ones get him jobs, give him evenings back, or sharpen a decision. That is a Tier-D / taste question ([`principle-agent-leverage.md`](principle-agent-leverage.md)), and it is where the founder should spend, not on plumbing. "Nothing holds us back technically" is liberating *only if* it's paired with the discipline to materialize the few surfaces that matter and resist the infinite ones that don't (the same anti-sprawl rule as connectors — [`product-ai-employee-context.md`](product-ai-employee-context.md)).

## The whole catalog is one graph, materialized

Read the [`skill-catalog.md`](offers/skill-catalog.md) again through this lens — every lane is a traversal that writes a node, surfaced where it's needed:

| Lifecycle | Skill (traversal) | Node written | Materialized for |
|---|---|---|---|
| Win | **Estimate** | estimate | homeowner PDF · owner approval card · deposit page |
| Win | Photo takeoff | quantities | the estimate traversal (internal) |
| Win | Proposal / quote doc | proposal | homeowner good-better-best doc |
| Run | Materials takeoff & order | supplier order | supplier email · crew packet |
| Run | Crew job packet | packet | the crew's phone |
| Run | Daily job log | log entry | owner digest · homeowner update |
| Get paid | Invoice / deposit / AR | invoice, payment | homeowner pay page · owner AR view |
| Keep | Follow-up · review · warranty | message, review | owner-approved customer send |
| Back office | Receipts · COI · permits · handoff | expense, doc, brief | owner ledger · bookkeeper package |
| Grow | Lead intake · reputation · pricing scan | lead, digest, brief | the walled-off intake widget · owner brief |

The point: there are not 24 codebases. There is **one graph and ~24 traversals**, each rendered to whatever surface the moment calls for. New verticals (landscape, roofing, bookkeepers) are the **same machine** pointed at a graph with different node types — which is why the bowling-pin expansion is cheap [S073] and why the profile factory can stamp each one out.

## The frontier extension — *decision* surfaces, not just document surfaces

The founder asked us to push past the estimating task into **how the owner gets things done, how he thinks, how he decides.** Materialization is the bridge. Most skills today materialize the graph as **documents** (estimates, invoices, packets) — they save *labor*. The frontier is materializing the graph as **judgment surfaces** — they sharpen *decisions*. Same graph, aimed at the owner's mind instead of his inbox:

- **Job-fit / "should I take this?"** — the lead node scored against his capacity, margin history, drive distance, and past-customer signal. A one-line verdict, not a spreadsheet.
- **Pricing-drift detection** — "your last six exterior jobs came in 12% under your own average; you're underpricing trim." The graph knows his history better than he remembers it.
- **Cashflow / week-ahead brief** — outstanding deposits, scheduled jobs, AR aging → a Monday-morning text: *"You have $14k of approved estimates unsigned — want me to nudge the top three?"*
- **The morning brief / "what should I do today"** — the graph materialized as a prioritized day, the single most owner-shaped surface there is.

These are not new data; they are **new views of the graph he already owns.** They are also the stickiest possible product: a tool that helps you *decide* is harder to cancel than a tool that helps you *type*. This is the pro-human line held exactly right — the Employee gives the owner better judgment inputs and his evenings back; it never "decides for him." The gate stays.

## The lateral-innovation catalog (genius ideas in front of us)

Lateral moves — taking a pattern proven in one corner and re-pointing it — are where the cheap breakthroughs are. The materialization frame generates them mechanically; pick a graph object and ask *"who else needs a view of this, and what new traversal writes it?"*

1. **The self-bootstrapping skill.** The generic Estimate skill *contains the traversal that writes its own custom version* (run interview → emit tuned skill). The product climbs the ladder by itself ([`offers/estimator-whole-product.md`](offers/estimator-whole-product.md) §1).
2. **Same brain, two privilege levels.** The homeowner and the owner talk to the *same* Estimate graph — the homeowner through a deliberately thin, walled-off projection (no internals), the owner through the full one. One brain, two materialized views, one security boundary [S062].
3. **Ambient capture → structured node.** The voice-walk: the owner narrates the job, the graph absorbs it as a structured estimate. The cheapest input surface that exists (talking) materialized into the most valuable node (a priced scope).
4. **Reverse materializations.** The *same* job node already paid for once becomes a crew packet, a supplier order, a homeowner project page, and a review request — four more surfaces at ~zero marginal cost.
5. **The funnel itself is a materialization.** SMS → web UI → the call is the *same loaded profile* re-rendered on progressively richer surfaces, each escalation earned by the agent doing more than expected ([`offers/estimator-whole-product.md`](offers/estimator-whole-product.md) §0). GTM is graph materialization applied to the buyer's journey.
6. **Cross-node intelligence (the moat compounding).** Once leads, estimates, jobs, and payments are one graph, *new* traversals become possible that no single-function tool can do — win-rate by job type, which materials blow margins, which neighborhoods convert. These are emergent products you didn't build; they fall out of the graph being whole.

## The compounding moat

This frame explains *why installing early wins* and ties straight to the intelligence-curve thesis ([`strategy-4-year-implications.md`](strategy-4-year-implications.md), [`product-ai-employee-context.md`](product-ai-employee-context.md)):

- **The graph thickens with use.** Every estimate, job, and payment adds nodes and edges. **Every materialized view gets better as the graph behind it gets richer** — at flat price and flat COGS — and the model substrate improving makes each traversal smarter on top of that. Two compounding curves under one product.
- **Switching cost is the graph, not the software.** A contractor can swap a calculator widget in an afternoon. He cannot export two years of his priced history, his materialized decision surfaces, and his approval patterns — *that* is the lock-in, and it's one we build *for* him, not against him.
- **The moat is the packaging, restated precisely:** the moat is **owning the graph and the discipline of materializing the right views of it** between a raw frontier model and a 55-year-old painter. Intelligence commoditizes; a whole, living business graph with the right surfaces does not.

## The one-line principle

> **Build the graph once; materialize the view the moment needs.** Every skill is a traversal, every surface is a view, every new "feature" is a projection — so spend the scarce human judgment on *which* views earn the owner more jobs, more evenings, and better decisions, and let the agent render the rest.

## How it shows up across the brain

- [`principle-deliverable-driven-surfaces.md`](principle-deliverable-driven-surfaces.md) — the operational layer beneath this one: the deliverable's **type** is the selector that picks *which* view to materialize, how to preview it, and how to gate its acceptance — the type system that lets one interaction grammar serve hundreds of skills.
- [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md) — the Estimate brain materialized into every form (skill, widget, voice-walk, PDF, deposit, loaded SMS agent).
- [`offers/skill-catalog.md`](offers/skill-catalog.md) — the 24 traversals over the one graph.
- [`principle-agent-leverage.md`](principle-agent-leverage.md) — who renders the views (agents) and who chooses them (the founder, Tier D).
- [`product-ai-employee-context.md`](product-ai-employee-context.md) — the business brain, profile isolation, and the factory that stamps the graph machine per vertical.
- [`strategy-4-year-implications.md`](strategy-4-year-implications.md) — the graph thickening as the compounding, defensible asset.
