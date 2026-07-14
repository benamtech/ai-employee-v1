# Segment — Painting & Landscaping Contractors (Beachhead)

**Status: complete** · _The beachhead. See [`../00-decision.md`](../00-decision.md)._

Owner-operated residential **painting and landscaping/hardscaping** contractors (1–10 person shops) are AMTECH's beachhead. They do high-frequency, money-deciding estimates by hand, are among the least AI-savvy buyers in the market (so a live demo lands hard and they can't DIY it), and AMTECH already owns the Estimate skill that does their #1 task.

**Current wedge:** the first touch is the free public estimator, not a phone-first demo. The contractor brings one real job, talks to an AMTECH AI employee, receives a line-item estimate draft with assumptions, then optionally tunes it to their pricing or installs their own Employee. See [`../gtm/free-estimator-funnel.md`](../gtm/free-estimator-funnel.md).

## Pain and task shape

Estimating is the recurring, structured, money-proximate task at the center of the day: walk the job, price it, write it up, send it — often at night after the work. Around it sits the rest of the back office: scheduling, materials ordering, change orders, invoicing, payment chasing, follow-up. Operators describe struggling to keep up with new clients, paperwork, scheduling, and physical work all at once [S029, S030].

Best Skill-shaped tasks (the catalog grows from here — see [`../offers/skill-catalog.md`](../offers/skill-catalog.md)):

- **Estimate** from job photos + the customer's messages → line-item estimate in the owner's pricing and format (~5% accuracy).
- Materials takeoff and supplier order list.
- Invoice + payment follow-up; post-job follow-up and review requests.

## Emotional operator language

Struggle, overwhelm, keeping up with clients, paperwork, estimates at 9pm [S029, S030]. The estimate-at-night grind is the felt pain the wedge removes.

## Current substitute behavior and cost

An office manager, a spouse/admin, a bookkeeper, or the owner working after hours. Construction office-manager roles run roughly **$40–65k/yr** and include billing, estimates, and scheduling [S031, S032]. The Employee is priced against that salary (and against lost jobs from slow estimates), not against free AI apps.

## Buying authority

The owner is the whole decision-making unit — economic buyer, decision-maker, and end user in one person. That collapses the sales cycle: no procurement, no committee, fast yes on a few-hundred-dollar tool.

## Trust and risk

Estimate **prep** is safe-to-get-wrong: the owner reviews line items and approves the final number before anything goes out. The confirmation gate covers everything customer-facing (estimates, invoices, follow-up). Low regulatory drag; TCPA handled by keeping follow-up to existing/inbound contacts, owner-approved. The accuracy (~5% with context loaded) is the proof point, not a liability.

## Skill-wedge fit

Strongest of any segment — AMTECH **already owns** the Estimate skill, and it maps to the contractor's single most universal task. The demo runs live on the contractor's own recent job.

## AI Employee upsell logic

Same buyer throughout. The trigger is concrete: the owner is in a customer's kitchen with dirty hands and dreads writing the estimate that night. The connected Employee deletes that — voice-memo the job, it pulls the email thread and past pricing, drafts the line-item estimate, sends an approval link. Lanes expand from there into a whole textable back office.

## Reachability

The known friction, and it's real: the owner may be on a roof at 11am. The free estimator changes the reachability strategy. With-website contractors can be reached by email/SEO/tool pages and asked to try one real estimate asynchronously. Phone still matters for no-website rows, local trust, callbacks, and high-intent follow-up. Ben already holds ~150 phone-only and ~200 with-website contractors; use the with-website group for estimator-email-first and the phone-only group for guided-estimator-call-first. **Discipline:** start with one trade (paint or landscape) so the custom-skill template is ~80% reusable; don't sell "contractors" generically.

## Why this is the beachhead

Highest intersection of: an asset AMTECH already owns, an AI-naive buyer who can't DIY and is wowed by the output, a money-deciding task, a one-person decision-maker, a felt estimator→Employee ladder, a list already in hand, and competitive whitespace. Full rationale and scoring: [`../00-decision.md`](../00-decision.md) §2 and [`../evidence/scoring.md`](../evidence/scoring.md).
