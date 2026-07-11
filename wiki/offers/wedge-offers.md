# Wedge Offers — Consultative Work → Tuned Package → AI Employee

**Status: active** · _Revised 2026-07-10: QuickBooks connector tier is now built (Phase A source-wired, live creds pending). See [`../00-decision.md`](../00-decision.md), [`../gtm/consulting-sales-surface.md`](../gtm/consulting-sales-surface.md), and [`../MVP/old-build-plan/`](../MVP/old-build-plan/)._

## The core motion

AMTECH does not sell a one-off artifact. It sells a ladder where every rung is an easy yes that earns the next, and where the through-line is: **more context -> less owner effort -> more of the office loop handled by the Employee behind a visible approval gate.** The Estimate skill is the first proof object; the **connected Employee and Work Surface are the product**. The full menu of back-office lanes the Employee grows into is the [Skill Catalog](skill-catalog.md).

| Rung | Buyer-facing name | What changes | Commercial role |
|---|---|---|---|
| **0 — Consultative first work** | "Let's run it on a real job" | Founder/front-door agent captures context and produces a useful first work object: estimate draft, intake summary, or next-action card. | Free diagnostic/demo |
| **1 — Tuned package** | **Your Estimate, Tuned** | 20-min interview loads pricing, markup, materials, suppliers, assemblies, format, and owner rules into the skill/profile package. | **$300-class paid discovery** |
| **2 — Employee (Starter)** | **Your AI Estimator** | Own SMS/web surface + estimate artifact + approval + Gmail send/reply. Voice memo/job notes -> draft -> approve -> send. | Setup + monthly |
| **3 — Employee (Office)** | **Your AI Office** | Adds deposit invoices, reminders, follow-up, job folders, QuickBooks/Drive/Calendar lanes, standing policies where safe. | Expansion/retention |

## Connector tiers (what each rung plugs in)

The Employee's value is staged by connector. Each one is a capability the owner can *feel*, a reason to climb, and a price tier. **Do not wire everything before the first sale** — every connector is a support surface that can break for a non-technical owner. Sell email + estimate first; expand once he trusts it.

| Tier | Connectors live | New capability | Why he pays for it |
|---|---|---|---|
| Consultative skill | none or demo account | Drafts a line-item estimate from supplied context | Sees the proof on his own job |
| Employee · email | Dedicated SMS/web surface + Gmail | Voice memo/job notes in -> it pulls/sends through Gmail and watches replies | Stops re-typing context; estimates off a text/voice note from the truck |
| Employee · deposit | + Stripe Connect test/prod path | Drafts/sends a deposit invoice after owner approval and watches payment events | Closes the money loop, same approval gate |
| Employee · + QuickBooks | + QuickBooks Online (native Manager connector, **built — source-wired, live creds pending**; see [`../../mvp-build/docs/quickbooks-connector-architecture.md`](../../mvp-build/docs/quickbooks-connector-architecture.md)) | Records expenses/bills/invoices/payments by vendor/customer *name* (never an ID; asks instead of guessing on ambiguity), reads P&L/balance sheet/aging on request, flags uncategorized bills and paid invoices — every write still behind the same owner-approval gate | Not a "bigger business" tier — QBO is the default small-business accounting tool even well under $500k/yr, and it's the bookkeeper's (Beachhead #2) whole world. This is the connector that lets the Employee stop being a bystander to the books. |
| Employee · + Drive/Calendar | + operating context | Knows past estimates, pricing sheets, photos, schedules | It already knows his business; he just approves exceptions |
| (later) browser/research | + browser-use | Live material lookups, job/permit research | Adds back-office reach — only when the workflow needs it, not by default |

> `browser-use`, a GitHub/workspace repo, and similar belong to **AMTECH's profile factory**, not a contractor's daily flow. Give the Employee what the *workflow* needs; resist max-connector sprawl.

## The line-item / accuracy rule (non-negotiable in delivery)

The Estimate skill, with proper context loaded, lands within ~5% of what the contractor would charge and produces the document a good contractor would. Sell that as **proof**, and deliver it so the proof is visible:

- **Always output itemized line items** — scope, quantity, unit price, and the assumption/source behind each — never a bare bottom-line number. This is how the owner *sees* the accuracy and how the one-tap approval becomes an easy yes.
- **Flag low-confidence items** for review instead of guessing silently.
- **The professional document is a second ROI axis:** he looks more legitimate than a hand-scratched competitor → wins more bids, on top of the time saved.
- **The accuracy is conditional on context**, so the real engineering target — and the reason the Employee exists — is making context capture effortless (voice → email → Drive). Accuracy is largely solved; *getting it the right inputs without the owner's effort* is the product.

## Risk sequencing & confirmation gate

- **Safe-to-get-wrong-first (internal, no gate needed):** drafting estimates, pulling context, organizing job info, research. The owner reviews everything.
- **Behind a one-tap approval gate (anything leaving the business):** sending an estimate to a customer, invoices, follow-up messages. Nothing leaves without "yeah, looks good."
- **TCPA:** no cold outbound. Customer follow-up is only to existing/inbound leads, owner-directed and approved before send.

## Beachhead offer (paint/landscape) — the one to sell now

**Rung 0 consultative first work:** pick a job the contractor recently quoted; run the Estimate skill or front-door flow on his photos + the customer's messages; show the line-item draft, the approval gate, and the next action the Employee would take. Frame it as *the first loop*, not a detached demo.
**Rung 1 close on the call:** "If that's close, I'll tune it to your exact pricing and format for $300, then it becomes the pricing brain your Employee uses." Book the 20-minute interview; collect via payment link before the build unless this is a free MVP provisioning test.
**Interview captures:** markup %, labor rates, crew/day costs, material & supplier pricing, standard assemblies/line items, service area, document format/branding.
**Rung 2 trigger:** once the first work is trusted, "Want it to just *do* this — text it the job, it writes the estimate, sends after you approve, watches the reply, and asks about the deposit?" -> Starter Employee.

## Beachhead #2 wedge (bookkeepers) — build, don't sell yet

Same ladder, different first skill. **Requires building a doc-sorter / missing-docs skill first** (not owned today), so it's a weeks-8–12 project, not a parallel cold motion.

| Rung | Bookkeeper version |
|---|---|
| 0 — Demo | Run a missing-docs / month-end-prep sort on a sanitized client folder |
| 1 — Custom skill | Tuned to the firm's checklist and client types — **$300–$500** |
| 2 — Employee | Connected to email + Drive/QBO: chases client docs, preps the close, drafts client follow-up behind approval — **setup + monthly, anchored to a bookkeeper/admin salary [S009, S010]** |

## Other segments (parked — same ladder if revisited)

Insurance, property management, freight/staffing, real estate, and general contractors outside paint/landscape are **not** the current motion. If revisited, apply the identical ladder (consultative first work → tuned package → live Employee → managed office loop) and the line-item/approval discipline. Prior per-segment notes live in [`../segments/`](../segments/).

## Revision / scope boundary

- **Included** at Rung 1: one 20-minute interview, one tuned estimate package, one document format, one revision after feedback, and business-brain/profile updates usable by the Employee.
- **Included** at Rung 2+: provisioning, listed connectors, the estimate/send/reply/deposit/reminder lanes named in the tier, ongoing tuning as pricing changes, and absorbing model/runtime drift.
- **Not included:** final-number ownership (the contractor always approves), autonomous sending, contract/lien/legal language, lead generation, or cold outbound.
