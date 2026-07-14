# Aulet Beachhead — Validation of the Contractor Market

**Status: complete** · _The Bill Aulet beachhead lens applied to the chosen market. Ranking detail: [`scoring.md`](scoring.md). Decision: [`../00-decision.md`](../00-decision.md)._

This page validates **painting & landscaping contractors** as the beachhead through Aulet's seven tests, and lays out the customer-access and validation plan. Aulet's rule: pick one market and validate aggressively — the scorecard guides, judgment decides.

## Aulet-lens summary

| Market | Aulet verdict |
|---|---|
| **Painting & landscaping contractors** | **Chosen.** Passes all seven; AMTECH owns the wedge skill, the buyer can't DIY, whole product is deliverable today. |
| Bookkeeping / accounting | Strong #2; fails only "whole-product now" (wedge skill must be built) → sequenced. |
| Property management | Viable later; support-burden + no owned wedge. |
| Insurance | Later; whole-product/trust risk (E&O, licensing, carriers). |
| Freight / staffing | Crowded; pulls toward outbound (out of scope). |
| Real estate | Saturated; TCPA/lead-gen pressure. |
| Marketing agencies | Rejected; AI-native buyer (weak value prop) who won't buy the Employee. |

## The chosen-market scorecard (contractors, paint/landscape)

**Profile:** owner-operated, 1–10 person residential painting or landscaping/hardscaping shop, owner still writing estimates himself.
**Decision-making unit:** the owner — economic buyer, decision-maker, and end user in one.

| Aulet criterion | Score | Why |
|---|---:|---|
| Well-funded customers | 4 | Pay office managers $40–65k, estimating software, suppliers [S031, S032]; a $300 tool is owner discretion. |
| Ready access | 4 | ~350 contractors in hand (150 phone-only + 200 web), local in-person edge, directories. Field-hours friction is handled by calling at estimate times. |
| Compelling value proposition | 5 | Estimate within ~5% in the owner's format, evenings back, more bids won — and AMTECH already owns the skill [S029, S030]. |
| Whole-product feasibility | 5 | Deliverable now and **largely built**: the onboarding/consulting-sales surface, live Employee, estimate artifact + approval, Gmail send/reply, Stripe test-mode deposit, and reminders exist in [`../../mvp-build/`](../../mvp-build/) (provider acceptance pending). Rung 0 first work → Rung 1 tuned package → Rung 2 Employee → Rung 3 office loop. No new build required for the first sale. |
| Competitive position | 5 | Whitespace: nobody sells done-for-you AI estimating to AI-naive contractors. Rivals are DIY tools, an office hire, or nothing. |
| Strategic leverage | 4 | Bowling-pin into adjacent trades; the profile factory + agent-run GTM compound across clients. |
| Founder alignment | 5 | Owns the asset, local advantage, AI-naive buyer fits the pro-human, demo-led pitch. |

**Fatal flaws:** none. The one real risk — reachability — is a friction, not a flaw, and is addressed operationally (phone list, estimate-hour calling, local demos, one-trade focus).

## Customer-access plan (this week)

Enrich the ~350 names by trade; pull painters/landscapers into a working sheet; flag with-website rows as estimator-email-first and no-website rows as guided-estimator-call-first. Top up from Google Maps and supply-house boards only if a town runs thin. Lead with the free estimator where possible, then follow up warm/local and cold at volume. Detail: [`../gtm/outbound-system.md`](../gtm/outbound-system.md).

## Whole-product requirement

Run the live onboarding surface on the contractor's own job → produce a line-item estimate artifact with the approval gate → provision the Employee → tuned Estimate package (20-min interview captures pricing/markup/materials/format, installed as the business brain) → deepen into Gmail send/reply, Stripe deposit, follow-up, and job folders behind owner approval. The sale is the Employee relationship; the skill is the proof object + supply chain. Lane expansion: [`../offers/skill-catalog.md`](../offers/skill-catalog.md); surface mechanics: [`../gtm/consulting-sales-surface.md`](../gtm/consulting-sales-surface.md).

## Validation experiments

1. ~10–15 live first-work loops on contractors' own jobs (paint or landscape, one trade first), in the real surface.
2. Provision the Employee and convert to the $300 tuned package (paid discovery) on the call.
3. Take ≥1 pilot through the full provider-accepted loop (estimate → approved Gmail send → real reply → Stripe test-mode deposit → reminder).

**Kill criterion:** if ~10–15 real first-work loops produce zero conversions, fix the demo (is it on *their* job, in the real surface?) or narrow to one sub-trade — do not change segment. The course is fixed; only the play varies (see [`../entrepreneurship-playbook.md`](../entrepreneurship-playbook.md)).
