# The Outbound System — Free Estimator Acquisition Machine

**Status: active** · _Updated 2026-07-14. The system view of winning paint/landscape clients now drives prospects into the no-signup free estimator first. Tactical detail lives in [`outreach-engine.md`](outreach-engine.md); canonical funnel is [`free-estimator-funnel.md`](free-estimator-funnel.md)._

## The system in one picture

```
INPUTS                AGENT-RUN CONVEYOR (Tier A/B)                  FOUNDER (Tier D)        OUTPUT
~350 names    ->   enrich -> trade-tag -> estimator email ->  ->   high-intent follow-up +  ->  tuned packages
+ SEO/tools        tool page -> attempt triage -> feedback log      trust/price close          + live Employees
                   phone/local callback -> CRM log
```

The design goal: **the founder is the bottleneck only after a contractor has shown intent by trying a real estimate or by answering a direct call.** Everything upstream (finding, enriching, drafting, sequencing, tool-page publishing, attempt triage, feedback capture) and most downstream logging is agent work. Ben spends his scarce hours on high-intent estimator attempts, closes, and relationships — nothing else (see [`../principle-agent-leverage.md`](../principle-agent-leverage.md)).

## The acquisition portfolio (Hormozi's Core Four, for contractors)

Hormozi's "Core Four" — warm outreach, content, cold outreach, paid ads [S072] — is the menu of *ways to get a client*. Plus referral loops. You run a **portfolio of plays**, and you find the winner by experiment (iterate vs lateral — see the playbook). Each play is an **offer × channel**.

| # | Play (offer × channel) | Core Four | Agent-run steps | Founder-only | Primary metric |
|---|---|---|---|---|---|
| 1 | **Free estimator email -> one real job** | Cold/Content | enrich, draft email, sequence, estimator link, attempt triage | high-intent follow-up + close | sends->estimator starts->drafts->Employees |
| 2 | Phone/local follow-up for no-website rows | Cold | enrich, dossier, draft script, log, prep estimator prompt | the call + guided estimator attempt + close | calls->estimator attempts->Employees |
| 3 | Supply-house / local in-person | Warm | prep one-pager, target list | the relationship, demo | intros→demos |
| 4 | Referral loop ($100 credit after paid close) | Warm | track asks, draft requests | the ask, the trust | referrals→closes |
| 5 | Trade-group value posts (before/after estimate) | Content | draft posts, monitor threads | posting voice, DMs | reach→inbound |
| 6 | Job-post trigger ("before you hire an estimator") | Cold | monitor boards, draft outreach | the call | triggers→demos |
| 7 | Door-knock / drop-by (no-website, local) | Cold/Warm | route, prep packet | the visit | knocks→demos |
| 8 | Adjacent-trade partner (roofer/remodeler refers painters) | Warm | find partners, draft terms | the partnership | partners→referrals |
| 9 | Warm reactivation (past contacts/website clients) | Warm | build list, draft intros | the ask | contacts→intros |

**Start where Hormozi says to start: warm (4, 9, 3), because it converts fastest, then cold at volume (1, 2).** Content (5) and partners (8) compound slower. Paid ads are deferred until a play is proven and you want to pour fuel on it.

## The agent-run pipeline (what the conveyor does)

Each step, its tier, and where the human re-enters:

1. **Enrich** the ~350 rows (owner name, trade, city, website/email) — Tier A.
2. **Trade-tag** paint / landscape / hardscape vs. park-the-rest; flag with-website rows as estimator-email-first and no-website rows as guided-estimator-call-first — Tier A.
3. **Draft first touch** per play (call script, teardown email, post) — Tier A/B.
4. **Drive the first work object through the estimator** — public estimator link for email/SEO; guided estimator attempt for phone/local rows — Tier B.
5. **Build the call dossier** (recent jobs, likely pain, best call time) — Tier B.
6. **Sequence follow-ups** (Day 0/1/3/7/14) and **triage replies** to the founder — Tier B.
7. **Log to CRM** + update metrics — Tier A.
8. **Founder follows up on high-intent estimator attempts, closes, takes payment or provisions the first Employee** — **Tier D**.
9. **QA** of any money/customer-facing draft before it leaves — Tier C supervises, founder gates.

Route each step to the cheapest tier that passes ([rubric](../principle-agent-leverage.md)). The founder touches only steps 8–9.

## Funnel math (conservative, 30-day)

Grounded in home-services benchmarks: cold conversion ~2–3% average, 6–10% with strong targeting; multi-channel (phone + email + social) ≈ 3.5× response; home-services owners answer phones [S074]. With an agent-run conveyor, volume is cheap, so the constraint is founder demo-hours.

- ~350 names enriched + topped up.
- ~1,000 outbound touches over the month, weighted to email/SEO/tool-page CTA plus phone follow-up.
- ~60–100 estimator starts.
- ~25–40 completed estimate drafts with useful inputs.
- ~10–15 tuned estimate packages at $300-class pricing ≈ **$3,000–$4,500**, if the paid package is the chosen close.
- ~2–3 live Employees moved into setup/monthly or serious pilot.

Hormozi's law applies: **~100 primary actions/day, volume negates luck** [S072]. The agent conveyor is what makes 100/day sustainable for one person.

## How this connects

- Tactical scripts, message variants, and the daily cadence: [`outreach-engine.md`](outreach-engine.md).
- Choosing *which* play to run and when to switch: the iterative-vs-lateral method in [`../entrepreneurship-playbook.md`](../entrepreneurship-playbook.md).
- What you're selling once you're in the room: [`../offers/wedge-offers.md`](../offers/wedge-offers.md), [`../offers/skill-catalog.md`](../offers/skill-catalog.md), and [`consulting-sales-surface.md`](consulting-sales-surface.md).
- Weekly keep/kill of plays: [`../founder-52-week-operating-plan.md`](../founder-52-week-operating-plan.md).
