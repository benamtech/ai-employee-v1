# 00 - The Decision

**Status: complete**

## 1. Beachhead call

Sell first to **owner-operated residential painting and landscaping / hardscaping contractors** (1–10 person shops). Lead with a no-signup public estimator: **"We give contractors free estimates."** The contractor brings one real job, chats with an AMTECH AI employee, receives a line-item estimate draft, then starts a free trial of a connected, textable **AI Employee** if they want that same estimator to remember their business.

**Two-sentence why:** These owners do high-frequency, money-deciding estimates by hand, are among the least AI-savvy buyers in the market, and AMTECH **already owns the exact skill that does their #1 task** — now wrapped in a public estimator that can produce value before signup and a Work Surface that can later run the whole office loop. The estimate is the first proof object inside the recurring Employee that absorbs the rest of the back office.

## 2. Why contractors, not agencies

Marketing agencies are the tempting default — reachable and AI-comfortable. They are the **wrong buyer**, for structural reasons:

- **AI-native buyers don't need us.** The value of a done-for-you AI worker is *inversely* proportional to the buyer's own AI sophistication. An agency shown an AI skill says "I'd just build that myself." The buyers who need AMTECH are the ones who can't — AI-naive owner-operators.
- **The skill-buyer and the Employee-buyer are opposite people.** Agencies might buy a cheap skill but will not pay $1,000+/mo for a worker they think they could approximate — which caps AMTECH at the low rung. The recurring Employee wants AI-naive, office-drowning owners.
- **AMTECH's biggest asset is contractor-fit.** Ben owns the **Estimate skill** — the contractor's most universal, money-proximate task — and has a local, in-person demo edge that does not transfer to selling agencies nationally.
- **The evidence is strongest where it's first-hand.** The contractor case rests on the owned skill, salary anchors, and product logic — not on the weak Reddit snippets behind the agency read (see [`01-method.md`](01-method.md)).

### Scoring lens (judgment-based, per Aulet: pick one and validate)

Scored on the criteria that actually predict *this* business — who will pay monthly for an always-on worker — not who is easiest to demo to.

| Criterion (1–5) | Contractors (paint/landscape) | Bookkeeping (#2) | Agencies (rejected) |
|---|---:|---:|---:|
| Asset fit — we already own the skill | 5 | 2 (must build) | 4 |
| Buyer can't DIY / wow factor (AI-naive) | 5 | 4 | 1 |
| Task decides money / high value | 5 | 4 | 3 |
| Skill → Employee ladder is *felt* | 5 | 4 | 2 |
| Phone-reachable + list in hand | 4 | 5 | 4 |
| Trust-to-close / low regulatory drag | 4 | 3 | 4 |
| Competitive whitespace (not AI-saturated) | 5 | 4 | 1 |
| **Total** | **33** | **26** | **19** |

Full segment scorecard: [`evidence/scoring.md`](evidence/scoring.md). Aulet-lens validation + the go-validate plan: [`evidence/aulet-beachhead-scoring.md`](evidence/aulet-beachhead-scoring.md).

## 3. What AMTECH actually is (positioning the whole sale rests on)

AMTECH is **the commercialization layer on top of improving agent intelligence** (Hermes/Nous + frontier models). It does not sell intelligence; it sells a **trusted, installed, vertical worker** for a non-technical owner who will never touch Hermes or a model API directly.

This is the durable advantage and it shapes every pitch:

- **The work improves on its own.** As the model/agent substrate gets better, every installed Employee silently delivers higher-quality estimates, follow-up, and admin — at the same price. Unlike most software, which is as good as it'll ever be the day you buy it, this compounds. Frame it on a call as the owner getting his evenings back — never as beating people; the buyer is a person who employs people.
- **The moat is not the intelligence** (that commoditizes and improves on its own — it isn't AMTECH's). The moat is the **packaging**: the loaded business brain, the connectors, the approval/trust UX, the SMS interface, the vertical skill, the local relationship, and being further up the office stack than any self-serve tool. The gap between "frontier capability exists" and "a 55-year-old painter has it reliably running his office" is the permanent business.
- **Rent the intelligence, own the packaging,** and stay model-agnostic so AMTECH can swap the brain underneath and absorb model drift *for* the owner. See [`product-ai-employee-context.md`](product-ai-employee-context.md) and [`strategy-4-year-implications.md`](strategy-4-year-implications.md).

## 4. The ladder (the offer)

Full spec in [`offers/wedge-offers.md`](offers/wedge-offers.md), with the new surface mechanics in [`gtm/consulting-sales-surface.md`](gtm/consulting-sales-surface.md). The through-line: **more context → less of the owner's effort → more of the office loop handled by the Employee behind the same approval gate.**

| Rung | What it is | Commercial role |
|---|---|---|
| **0 — Free public estimator** | Contractor lands from email/SEO/referral, gives one real job to a public AMTECH estimator, gets a line-item estimate draft and assumptions with no signup. | Scalable proof / lead capture |
| **1 — Free AI Employee trial** | The contractor says "make this mine"; the employee learns pricing, markup, materials, service area, logo/template, and format through normal conversation. | Trial / business-brain installation |
| **2 — Paid AI Employee** | Own SMS/web surface, estimate artifact, signed links, approvals, Gmail send/reply, Stripe deposit invoice, reminders. | Setup + monthly managed product |
| **3 — Managed office loop** | Follow-up, invoicing, reviews, AR, job folders, scheduled briefs, Drive/Calendar/QBO-style connectors, standing policies where safe. | Expansion/retention |

The business-brain setup is not a thing to sell before the contractor understands AMTECH. It is what happens when they start the free trial: the employee asks the pricing/format questions a new estimator would ask and remembers the answers for the next job. The free estimator gets them to experience the product; the trial employee makes the estimate match their business; the money is the installed Employee and the managed office loop after the value is felt. Canonical funnel: [`gtm/free-estimator-funnel.md`](gtm/free-estimator-funnel.md).

## 5. The line-item / accuracy rule (how to sell the ~5%)

The Estimate skill, given proper context, lands within ~5% of the contractor's own number and produces the document a good contractor would. That accuracy is the **proof point, not a liability** — so present it as proof:

- Estimates are drafted as **itemized line items** (scope, qty, unit price, assumption/source), never a bare bottom-line number. This is how the contractor *sees* the accuracy and how the approval tap becomes an easy yes.
- **Low-confidence items are flagged** for review rather than guessed silently.
- The professional document is a **second ROI axis**: he looks more legitimate than his hand-scratched competitor → wins more bids, on top of the time saved.
- **The real risk is upstream — context capture, not math.** Accuracy is conditional on proper context, which is exactly why the Employee (voice memo → email pull → Drive of past jobs) is worth paying for.

## 6. Upsell trigger (why the Employee sells itself)

Not abstract "management pain." A concrete, hands-dirty moment: **the contractor is standing in a customer's kitchen, can't type, can't remember which email thread it was, and dreads doing the estimate at 9pm.** The Employee deletes that: voice-memo the job to its number, it pulls the thread and past pricing, drafts the line-item estimate, shows the approval card, sends through Gmail, watches the reply, then asks whether to send the deposit invoice. The interface (SMS + web Work Surface, later voice) is matched to a buyer who will never manage a raw agent dashboard.

## 7. AI Employee price and anchor

- **$750 setup + $1,000/mo (Starter)**, **+ $1,500/mo (Pro)**.
- Anchor against an office manager / estimator / admin at **$40–65k/yr (~$3,300–5,400/mo)** [S031, S032], and against **lost-job math**: winning one extra job a month covers the year. Never anchor against "free" or against cheap AI helper apps.
- ~97% gross margin (VPS share + ~$1.15/mo Twilio number + modest tokens), and the deliverable quality rises with the model at flat COGS.

## 8. Pitch

"We give contractors free estimates. Pick one real job and send the notes, photos, measurements, or customer messages through our estimator. It drafts the line-item estimate, shows the assumptions, and lets you download it without signing up. If it is useful, you can start a free trial and make that estimator your own AI employee: it remembers your pricing and format, you text it from the truck, it writes the estimate, asks before sending, watches replies, and helps with deposits and follow-up."

## 9. Three redirects (for the panic moments)

**"How does it work / what AI is this?"**
"Honestly the tech matters less than the result. You pick a real job, I feed it what you already have, and it writes your estimate. You look at every line and approve it before anything goes anywhere. If it's not as good as yours, you don't pay."

**"Is this just ChatGPT?"**
"No. ChatGPT is a blank box you'd have to feed and babysit every time. This already knows your pricing, your markup, your materials, and your format — so it writes *your* estimate, not a generic one. And it gets better on its own as the AI improves, without you doing a thing."

**"Are you trying to sell me software?"**
"No. Try one estimate for free first. If it saves you the write-up, the next step is just making that same estimator remember your pricing and format in a free trial. You should not buy anything until it has done useful work on your jobs."

## 10. Beachhead #2 — bookkeepers (sequenced, not parallel)

Bookkeepers and desk-based professional offices (tax prep, fractional CFO/CAS, payroll) are the **fast-follow**, and they fix the one real contractor weakness — reachability (they're at a desk during business hours, numbers-literate, ROI-rational, recurring-client budgets). Same platform underneath (Hermes + connectors + a vertical skill + business brain); the only difference is the wedge skill.

- **Lead with contractors anyway** because the Estimate skill exists *now* and the demo is buildable today. The bookkeeper wedge requires **building a doc-sorter / missing-docs skill first** (not yet owned), which costs a week Ben doesn't have for first cash.
- Run bookkeepers as **beachhead #2 in weeks ~8–12** — the proof the model replicates to a second vertical on the same platform — not as a simultaneous second cold motion. One person, one beachhead until first cash.
- "Bookkeepers and similar" names the expansion pattern: **desk-based professional offices with recurring clients and document/admin labor.** Trade #1 → professional-office #1 → adjacent verticals, all on the same platform, each cheaper to launch than the last.

## 11. Where to find buyers (Ben already has the list)

Ben currently holds **~150 contractors with phone numbers but no website**, and **~200 with a website** — trade not yet tagged. The with-website/email cohort should now be driven primarily to the free estimator page; the phone-only cohort remains a call/local follow-up path into the same offer.

- **The 150 phone-only, no-website contractors are call/local-follow-up gold.** No website signals an owner doing everything himself (drowning), the least marketed-to and most AI-naive cohort, and you already have the number — use phone to get them to try one free estimate.
- **The 200 with-website contractors** get the primary cold email: "We give contractors free estimates." The CTA is the no-signup estimator page, not a request to book a demo first.
- **Step 1 is enrichment, not more list-building:** tag each row by trade (paint / landscape / hardscape vs. other), owner first name, and city. Prioritize painting and landscaping; park the rest.

## 12. 40-name list method (this week)

You don't need to *build* 40 — you need to *enrich and rank* the names you have, then top up.

1. From the existing ~350, pull every painter / landscaper / hardscaper into a working sheet. Columns: owner name, phone, website/email, trade, city, source, estimator-start status, draft-completed status, trial-start status, Employee status, objection.
2. Tag trade fast from business name + a 10-second search; flag with-website rows as **estimator-email-first** and no-website phone rows as **guided-estimator-call-first**.
3. Top up from Google Maps ("painters near [town]", "landscaping [town]"), local trade groups, and supply-house bulletin boards if the painting/landscaping count is thin.
4. **Seasonality is in your favor right now:** late June is peak paint/landscape season — estimate volume and the pain are at their annual high. Call early morning and evening; lead with the pain, not the tech.

## 13. Warm-path prompt

"Quick favor — do you know any painters or landscapers running their own crew? I built a free estimator for contractors: they can bring one real job, give it notes/photos/messages like they'd give a secretary, and it drafts the estimate with assumptions. No signup. I just want them to try it and tell me what is right or wrong."

## 14. Hard timebox

Ben should spend **no more than 90 minutes** reviewing this wiki before he starts pushing the free-estimator page to painting/landscaping rows and following up with the highest-intent attempts. The research exists to point real estimate attempts, not replace them. Peak season is now; the list is already in hand.
