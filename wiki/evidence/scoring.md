# Segment Scoring — Beachhead Selection

**Status: complete** · _The detailed scorecard behind [`../00-decision.md`](../00-decision.md) §2._

Segments are scored 1–5 on the criteria that actually predict AMTECH's business — **who will pay monthly for an always-on AI worker** — not who is easiest to demo to. (The earlier 7-criterion rubric optimized "easy to reach/explain" and is not used.)

## The scorecard

| Criterion (1–5) | Contractors (paint/landscape) | Bookkeeping | Property Mgmt | Insurance | Freight/Staffing | Real Estate | Agencies |
|---|---:|---:|---:|---:|---:|---:|---:|
| Asset fit — AMTECH already owns the skill | 5 | 2 | 2 | 2 | 2 | 2 | 4 |
| Buyer can't DIY / wow factor (AI-naive) | 5 | 4 | 4 | 4 | 3 | 3 | 1 |
| Task decides money / high value | 5 | 4 | 3 | 4 | 3 | 3 | 3 |
| Skill → Employee ladder is *felt* | 5 | 4 | 4 | 3 | 3 | 3 | 2 |
| Phone-reachable + list in hand | 4 | 5 | 4 | 4 | 5 | 4 | 4 |
| Trust-to-close / low regulatory drag | 4 | 3 | 3 | 2 | 3 | 2 | 4 |
| Competitive whitespace | 5 | 4 | 4 | 3 | 2 | 2 | 1 |
| **Total** | **33** | **26** | **24** | **22** | **21** | **19** | **19** |

## Ranking

1. **Painting & landscaping contractors — 33** → the **beachhead**.
2. **Bookkeeping / accounting / tax — 26** → **beachhead #2** (sequenced; needs a doc-sorter skill built first).
3. Property management — 24 (parked: support burden, no owned wedge).
4. Insurance — 22 (parked: regulatory/whole-product risk).
5. Freight/staffing/recruiting — 21 (parked: crowded, pulls toward outbound).
6. Real estate — 19 (parked: saturated, TCPA).
6. Marketing agencies — 19 (rejected: AI-native buyer who DIYs and won't buy the Employee).

## Why the top two win

**Contractors** are the only segment where AMTECH already owns the wedge skill (Estimate), the buyer is AI-naive (so the demo is a wow and they can't DIY), the task decides money, the decision-maker is one person, and the skill→Employee upsell is viscerally felt — at low regulatory drag and in clear whitespace. The one weak score (reachability, 4) is handled by the phone list in hand, estimate-hour calling, and local in-person demos.

**Bookkeeping** scores second on the strength of desk-reachability (its 5) and recurring-client budgets, but loses on asset fit (the wedge skill must be built) — which is exactly why it is sequenced behind contractors, not run in parallel.

## The decisive split

The criterion that reorders everything is **"buyer can't DIY."** AI-native segments (agencies) score 1 there — they don't need a done-for-you AI worker — while AI-naive owner-operators score 4–5. AMTECH's product is worth most to the buyer who can't build it himself. That, plus **asset fit**, is why contractors lead and agencies place last despite agencies being easy to reach. Per-segment detail lives in [`../segments/`](../segments/).
