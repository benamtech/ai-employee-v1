# Skill Catalog — The Contractor Back-Office Surface Area

**Status: complete** · _Created 2026-06-27. Expands the product within the one beachhead (paint/landscape). The wedge stays the Estimate skill ([`wedge-offers.md`](wedge-offers.md)); this is the full ladder of lanes the connected Employee grows into._

## Why a catalog

The Estimate skill is the front door, not the house. A painting/landscaping owner's whole back office is a stack of recurring, structured tasks — the office-manager job description plus the work he does himself at 9pm. Each task is a productizable skill. The catalog matters for three reasons:

1. **ACV expansion (the $10M lever).** A client who only does first work is ~$300 of paid discovery; a client running six lanes through their Employee is a real monthly account. Revenue = clients × **lanes per client** × retention. The catalog is the "lanes per client" axis.
2. **Supply chain, not bespoke work.** Build each skill once for the trade, sell it to every client in it. Each becomes a bundled capability of the `contractor_estimator` Employee profile package, not a one-off (see [`product-ai-employee-context.md`](../product-ai-employee-context.md)).
3. **Agent leverage.** Most of these are Tier A/B work — agent-deliverable with the founder only at the trust/money gate (see [`../principle-agent-leverage.md`](../principle-agent-leverage.md)).
4. **One interaction grammar, not one screen per skill.** Each skill declares a **deliverable type** (document, outbound message, money movement, job folder, …); the Work Surface renders, previews, and gates it the same trusted way across every lane — so the catalog can grow without new UI (see [`../principle-deliverable-driven-surfaces.md`](../principle-deliverable-driven-surfaces.md)).

**Two rules carried from the wedge** ([`../00-decision.md`](../00-decision.md) §5): every money/customer-facing output is drafted as reviewable line items and held behind a **one-tap owner approval gate**; **Internal** lanes are safe-to-get-wrong (owner reviews, no gate). TCPA: customer follow-up only to existing/inbound contacts, owner-approved — never cold outbound on the customer's behalf.

## The catalog (≈24 skills, by job lifecycle)

Risk: **Internal** = prep, owner reviews. **Gate** = leaves the business / touches money → behind one-tap approval. Tier = agent-runnability ([rubric](../principle-agent-leverage.md)).

### Win the job
| Skill | Trigger → Output | Where it sells | Risk | Tier |
|---|---|---|---|---|
| **Estimate** (wedge) | Job photos + customer messages → line-item estimate, his format, ~5% | $300 custom / Employee | Gate (final # ) | B/C |
| Photo takeoff | Job photos → surface areas, quantities, counts | Employee lane | Internal | B |
| Proposal / quote doc | Approved estimate → branded proposal w/ good-better-best + terms | $300 / Employee | Gate (send) | B |
| Bid follow-up planner | Open bids → ranked follow-up list + approved reminder drafts | Employee lane | Gate | B |
| Scope clarifier | Messy customer notes → clean scope + questions to ask | Employee lane | Internal | B |

### Run the job
| Skill | Trigger → Output | Where it sells | Risk | Tier |
|---|---|---|---|---|
| Scheduling assist | Accepted jobs + crew availability → schedule draft + reminders | Employee lane | Gate | B |
| Materials takeoff & order | Scope/estimate → materials list + supplier order draft | $300 / Employee | Gate (order) | B/C |
| Crew job packet | Job → one-page packet (scope, site notes, materials, access, safety) | Employee lane | Internal | A/B |
| Change-order writer | Change request → priced change-order doc | Employee lane | Gate (#, send) | B |
| Daily job log | Crew voice notes/photos → structured log + customer update draft | Employee lane | Gate (customer send) | A/B |

### Get paid
| Skill | Trigger → Output | Where it sells | Risk | Tier |
|---|---|---|---|---|
| Invoice generator | Approved estimate + completion note → invoice | Employee lane | Gate (send) | B |
| Deposit / progress billing | Milestone reached → payment-request draft | Employee lane | Gate | B |
| Payment follow-up (AR) | Overdue invoices → ranked list + approved reminder drafts | Employee lane | Gate | B |

### Keep customers (existing/inbound only — TCPA)
| Skill | Trigger → Output | Where it sells | Risk | Tier |
|---|---|---|---|---|
| Post-job follow-up | Completed job → thank-you + check-in draft | Employee lane | Gate | A/B |
| Review request | Happy completed job → review-ask draft + link | $300 / Employee | Gate | A |
| Warranty / callback log | Callback request → tracked log + scheduling draft | Employee lane | Internal | A/B |
| Seasonal reactivation | Past customers due (repaint cycle, seasonal cleanup) → approved reach-out list | Employee lane | Gate (existing only) | B |

### Back office
| Skill | Trigger → Output | Where it sells | Risk | Tier |
|---|---|---|---|---|
| Receipt / expense capture | Receipt photos → categorized expense log | Employee lane | Internal | A |
| Subcontractor COI tracker | Sub docs → insurance-certificate tracking + expiry flags | Employee lane | Internal | A/B |
| Permit / research assistant | Job type + location → permit requirements + research brief | $300 / Employee | Internal (owner verifies) | B/C |
| Bookkeeping handoff pack | Month's invoices/expenses → clean package for the bookkeeper | Employee lane | Internal | A/B |

### Grow
| Skill | Trigger → Output | Where it sells | Risk | Tier |
|---|---|---|---|---|
| Lead intake & triage | Web-form / missed-call / voicemail info → structured lead summary to owner | Employee lane | Internal (owner-directed) | A/B |
| Reputation monitor | New reviews → digest + approved response drafts | Employee lane | Gate | B |
| Local pricing/market scan | Trade + area → pricing & positioning brief | $300 / Employee | Internal | C |

## The land-and-expand ladder

```
Land:    Free first work in the onboarding surface → tuned Estimate package ($300 paid discovery) → live Employee provisioned
Expand:  + Gmail send/reply, + Proposal doc, + Materials order → Employee (Starter $1,000/mo)
Deepen:  + Deposit invoice, + Follow-up, + AR chase, + Scheduling, + Reviews, + Job folders → Employee (Pro $1,500/mo)
Own:     the whole back office runs through one textable worker behind the owner's approval
```

Each rung is a felt win that earns the next, and each new lane raises ACV at ~flat COGS. **Deepen to the next lane only when the owner has felt the last one** — the [progressive-trust ladder](../principle-deliverable-driven-surfaces.md). The skill is the proof object and supply chain; the Employee relationship is the product.

## Notes for delivery

- **Bundle, don't blitz.** A handful (Estimate, Proposal doc, Materials order, Review request, Permit research, Pricing scan) work as standalone ~$300 custom skills for fast cash; the rest are best sold as **Employee lanes**, because their value is being always-on, not run-once.
- **Build the template once per trade.** The 20-minute interview that tunes the Estimate skill captures most of what the other lanes need (pricing, suppliers, format, voice) — reuse it.
- **Agent-deliver the build.** Tier A/B lanes can be drafted and assembled by agents; Ben supervises Tier C (pricing/market) and stays the gate on every money/customer output.
