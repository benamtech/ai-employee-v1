# The Estimator Whole Product — Every Form of the Wedge

**Status: complete** · _Created 2026-06-28. The Estimate skill is the generic product; this page is Aulet's **whole product** — everything wrapped around it so a paint/landscape owner gets the full job-to-cash result, not just a clever skill. Spine for delivery: [`../00-decision.md`](../00-decision.md), [`wedge-offers.md`](wedge-offers.md), [`../product-ai-employee-context.md`](../product-ai-employee-context.md). Surfaces unify under [`../principle-graph-materialization.md`](../principle-graph-materialization.md)._

## Whole product, not a clever skill (Aulet)

Aulet's **whole product** [S068]: the customer doesn't buy your generic product, they buy the *complete solution to their problem*. The generic product here is the **Estimate brain** — pricing rules + a job → a line-item estimate within ~5% of what the owner would charge. By itself that's a smart skill. The contractor's actual problem is bigger: *a lead comes in, it has to be captured and qualified fast, walked or described, priced, sent as a document that looks legit, and turned into a paid deposit — without eating his evening.* The whole product is every surface that closes that loop. We already own the hard part (the brain); this page is the wrapper.

Two things stay invariant across **every** form below, carried from the wedge ([`../00-decision.md`](../00-decision.md) §5):
- **Line-item + owner approval gate.** Every number the customer sees is itemized with assumptions and low-confidence flags, and **nothing money- or customer-facing leaves without the owner's "yeah, looks good."** The accuracy is the proof; the gate is the trust.
- **Inbound / TCPA-safe.** Every customer-facing surface here is *inbound* (the homeowner comes to the contractor's site, or replies to him) or owner-directed. No cold outbound on the customer's behalf.

## 0. The delivery spine — a *loaded agent over text* (the GTM core)

Before the forms, the mechanism that delivers them. **AMTECH's key GTM move is provisioning a "loaded" agent for a person over text** — not selling software they install. This is what makes us *the easiest thing in the market to run with*:

- **[`amtechai.com/claim`](https://amtechai.com/claim)** [S052, S083] — "**Claim Your AI Employee — a textable teammate that knows your pricing, brand, and customers.**" The real flow: seven business questions + consent, phone verified inline (Twilio Verify, or a signed text-in link), then a manifest is built and handed to the host. Output is a live agent on its own number in the owner's text messages.
- **The per-client factory makes it near-free to stand up.** The factory takes that manifest and renders the agent **template** into a live, isolated, textable agent **in under a minute** — a deterministic token-render proven in prototype [S082] and specified in [`../MVP/old-build-plan/07-provisioning-runtime.md`](../MVP/old-build-plan/07-provisioning-runtime.md) (claims a Twilio number, creates the profile, registers the check-ins, maps the subdomain, starts the gateway). The `codegraphtheory/hermes-profile-template` prompt-to-repo system [S060–S062] is the *upstream authoring* tool — it scaffolds **new vertical profiles and custom skills**; it is not the per-client stamp. Either way, a *loaded paint/landscape Estimator agent* is a render-and-provision away, not an engineering project.
- **Why "loaded" matters.** It boots already knowing the trade (and, after the interview, *his* pricing). The owner never sees a blank box. The first message he sends gets a real, trade-aware estimate back.

> **Current implementation caveat.** The SMS/web first-touch routing layer now exists in `mvp-build/`: both surfaces call the same LLM-only onboarding orchestrator, preserve a manifest draft, and move the owner into account setup and provisioning. This is still not a completed live funnel until the real Supabase/Twilio/Hermes/Caddy/provisioner environment passes the golden path. The post-claim profile path renders a selected AMTECH profile package; it does not run the full `hermes-profile-template` prompt-to-repo authoring pipeline during claim.

**The self-escalating funnel** (the founder's words, made canonical): **SMS first touchpoint → it visibly out-performs default ChatGPT and *offers to do more* and *learns like Hermes does* → move him to the web UI (richer surface) → prompt the upgrade, or — better — schedule the call.** Each step is the *same loaded profile re-materialized on a richer surface* (see [`../principle-graph-materialization.md`](../principle-graph-materialization.md)); the agent itself drives the climb because it keeps doing more than he expected. The founder's scarce Tier-D hours ([`../principle-agent-leverage.md`](../principle-agent-leverage.md)) are spent only on the call at the top of the funnel, not on provisioning.

| Funnel step | Surface | What earns the next step |
|---|---|---|
| First touch | **SMS** loaded agent (own/temp number) | Real estimate on his job in his texts; "this already beats ChatGPT and I didn't set anything up" |
| Expand | **Web UI / notifications** | Sees lead history, more skills offered, it remembers and improves |
| Convert | **Upgrade prompt → or a scheduled call** | Felt the value; the call is the trust close, not a cold pitch |

This spine doesn't change the price ladder ([`wedge-offers.md`](wedge-offers.md): consultative first work → $300 tuned Estimate package → $1,000/$1,500-mo Employee → managed office loop). It changes **how the first work is delivered** (in his texts, zero install) and **how the upsell happens** (the agent self-escalates). It is the lowest-friction version of "do things that don't scale / make something people want" [S063, S070] — concierge value in the channel he already uses.

## 1. The three standard skill forms (the portable wedge)

The Estimate skill ships as a portable **SKILL.md** artifact so it works inside whatever tool the buyer already has — near-zero trust barrier, near-zero cost to us ([`../product-ai-employee-context.md`](../product-ai-employee-context.md)). Three forms, increasing in "done-for-you":

| # | Form | What the buyer does | Who it's for |
|---|---|---|---|
| 1 | **Paste-in** | Copy the SKILL.md text into Claude/ChatGPT/Cursor's skill/instructions box, paste a job, get an estimate | DIY-curious owner or a referrer trying it; the lightest possible try |
| 2 | **GitHub-linked** | SKILL.md lives in a versioned repo folder (signed, in the `amtechai.com/skills` registry [S057]); install/reference by link | Tinkerers, agents, and our own Employee loading it as a procedure |
| 3 | **AMTECH-hosted, self-bootstrapping** | Run the hosted skill; it **interviews him and emits his *custom* skill** | The real wedge — the generic skill that upgrades itself |

**Form 3 is the genius idea lying in front of us.** The hosted Estimate skill follows the AMTECH standard *and contains the procedure to become the $300 tuned Estimate package*: it runs the 20-minute pricing interview (markup %, labor rates, crew/day, materials/suppliers, standard assemblies, service area, document format), then **materializes a tuned skill repo for him** via the same profile-factory mechanism that builds Employees [S060, S061]. The wedge literally **bootstraps itself up the ladder** — generic skill → loads his context → tuned skill → ready to drop into his Employee. No human build step for the common case; the founder supervises pricing (Tier C) and stays the gate.

## 2. The customer-facing intake — the layer between SaaS and a form

This is the new surface, and the contractor's whole problem is here: leads arrive, most are tire-kickers, and the fast, legit responder wins. So we put the **same Estimate brain** on the *front* of his business as an embeddable intake. It is **inbound** (his own site/link), so TCPA-safe, and it spans a spectrum — "some layer between typical SaaS and just forms":

- **Static structured form** (low end). Fields + photo upload → brain → ballpark range + a captured lead. Cheapest, works for the simplest jobs. (This is the commodity category — see whitespace below.)
- **Conversational intake widget** (the default). A scoped, ChatGPT-style chat whose system prompt **is the distilled Estimate brain**, using structured outputs and a cheap/fast model (e.g. Grok/xAI-class) — geared narrowly to *describe the project in a couple of messages and upload photos*, then hand off. Conversational/multi-step/photo intake **converts far better than a static form** (Typeform-class conversational completion ~50%+ vs ~20–30% for static; multi-step ~86% higher conversion) [S079], and it qualifies as it goes.
- **Full agent intake** (high end). The widget is just the lead-intake materialization of a real Hermes profile; on the rich end the homeowner is effectively talking to the Employee's *public face*.

The output of any intake variant is the same graph object — **a lead node with the job described, photos attached, and a *suggested* line-item estimate** — handed to the owner.

### The walled-off lead-intake profile (least privilege)

When intake runs inside the AI Employee, it must **not** see the owner's internals. Model it as its **own profile / sub-agent with least privilege**: it can read the Estimate skill + current public knowledge (services, rough pricing bands, service area) and **write to the lead database + fire notifications** — and nothing else. No email, no Drive, no invoicing, no money. The correction: a profile gives separate Hermes state/config, but it is not a filesystem sandbox on the `local` backend [S087]. The public-facing surface needs a deliberately thin profile **plus** filtered tools/MCPs and a contained runtime (Docker/SSH/VM-style backend) before it is a real security boundary. (It maps cleanly onto materialized views — same graph, a deliberately *thin* projection for an untrusted actor; see [`../principle-graph-materialization.md`](../principle-graph-materialization.md).)

## 3. The lead → suggested price → alert → owner-reply loop

A lead lands. The owner gets it **wherever he is**, with the info *and* a suggested price already attached:

1. **Alert** via his choice of channel — **SMS**, the **AMTECH web UI / notifications**, or **email**. (SMS is the default; it's the same number the loaded agent already lives on.)
2. **He replies with literally anything** — that's the point of an LLM front end. "yeah good," "too low, bump it 15%," "we don't do popcorn ceilings, tell her no," "call her, say I'll swing by Tuesday." No buttons to learn, no app to open.
3. The agent does the safe parts itself (logs, drafts) and **holds anything customer-facing behind the one-tap gate**.

This is the **second and third ROI axes** stacked on the wedge's time-savings: he looks instantly responsive (speed-to-lead: replying within ~5 minutes is **~21× more likely to win** the job than 30 minutes [S077]), and he stops driving out to tire-kickers because the ballpark already filtered them — the exact pain contractors describe: *"give them a ballpark to weed out the tire kickers"* and *"getting numbers out in the open at the start exposes tire kickers and saves a lot of wasted time"* [S075]; homeowners, for their part, just want a number before they commit [S076].

## 4. The two on-site flows (where the brain meets the truck)

The intake handles the lead. The **estimate close** happens at the property, and the same brain shows up two ways depending on how integrated the owner wants to be:

**A — The text-to-send flow (default).** He saw the intake lead and its suggested price, called the homeowner ("I saw your project, I'll come take a look — it'll probably run about $X"), and walks the job. When he's done he just **texts his agent**: *"pretty good, but we'll need two coats on the trim and a power-wash — add that and send it."* The agent updates the line items, the owner taps approve, and **the homeowner gets the estimate as a clean PDF plus a link to pay the deposit** per the estimate's terms.

**B — The voice-walk flow (the integrated high end).** As he walks the job with the homeowner he **voice-records into his agent** (the way some guys already take walk-through videos). When he wraps, he sends it; the Hermes Estimator **transcribes, structures it, and texts back notes + a rough price** he can pitch on the spot. Then it converges to the same close as flow A: approve → PDF + deposit link.

Both flows are the wedge's upsell trigger made physical ([`../00-decision.md`](../00-decision.md) §6): *standing in a kitchen, can't type, dreads the 9pm estimate* → the agent deletes that moment. Voice-in is the connector that makes context capture effortless, which is the real product (accuracy is solved; **getting it the right inputs without the owner's effort is the win** — [`wedge-offers.md`](wedge-offers.md)).

## 5. The deposit close (Stripe Connect)

The estimate isn't done until money can move. In the real MVP, after the customer replies that the estimate and deposit terms look good, the Employee asks the owner whether to send the deposit invoice. If Stripe is not connected, the Employee starts Stripe Connect onboarding in provider test mode; if it is connected, the Employee creates the deposit invoice from the approved estimate, asks for final owner approval, and sends the real Stripe invoice/payment link. The deposit terms come straight from the estimate, so the same graph object that priced the job also collects the cash. This closes the loop the whole product promises: **lead → estimate → signed deposit**, all owner-approved, most of it agent-run.

## 6. The surface spectrum (one brain, many forms)

Every form above is the **same Estimate brain materialized for a different actor, surface, and trust level** — which is exactly why the catalog is cheap to build and the upsell is natural (full theory: [`../principle-graph-materialization.md`](../principle-graph-materialization.md)):

| Surface | Actor | Trust/privilege | Sits on the ladder as | Build tier |
|---|---|---|---|---|
| Paste-in SKILL.md | DIY owner | n/a (their tool) | Free try / referral seed | A |
| GitHub-linked skill | tinkerer / our Employee | signed registry | Distribution + Employee procedure | A |
| Hosted self-bootstrapping skill | owner | n/a | **Rung 0→1 auto-upgrade** | B/C |
| Static intake form | homeowner | untrusted, thin | Add-on / commodity floor | A |
| Conversational intake widget | homeowner | untrusted, thin (walled-off profile) | **New customer-facing lane** | B |
| SMS loaded agent | owner | full (his profile) | **Rung 0 demo / first touch** | B |
| Web UI / notifications | owner | full | Expand step in the funnel | B |
| Voice-walk → estimate | owner | full | Rung 2 Employee, felt | B/C |
| PDF + Stripe deposit | homeowner | scoped (pay only) | Closes the money loop | B |

## 7. Demand evidence & competitive whitespace

**Demand (operator + homeowner voices, benchmark anchors):**
- Tire-kicker pain and the *ballpark-to-qualify* tactic are explicit in contractor forums [S075]; too-many-estimates / "is there a better way" is a recurring ask [S075].
- Homeowners want a ballpark before committing and resent "call for a quote" [S076].
- Speed-to-lead is decisive: ~5-min response ≈ **21× win likelihood** vs 30-min; **a web form with no fast system behind it hands the job to the faster competitor** [S077].
- Conversational/multi-step/photo intake **out-converts static forms** materially [S079].

**Whitespace (why we win the customer-facing surface):** an instant-quote-widget category already exists — **QuoteSnap** ($0 up to 10 leads / $19-mo / $179 lifetime), QuickQuote, Calconic, ConvertCalculator [S078]. They are **dumb calculators**: address + material → a range, **no photos, no real conversation, no owner-supervised line items, not connected to anything.** AMTECH's intake is a **materialization of the actual Estimate brain** that produces his real ~5% line items, takes photos and natural language, runs behind the owner's approval gate, and **feeds the same lead graph the Employee then works** — intake, pricing, follow-up, invoicing, and the deposit are one continuous object, not five disconnected tools. Sell the difference plainly: *"That calculator gives a guess and a form. This gives your real estimate, in your pricing, and it's the front door to the worker that does the rest."*

## 8. Where each form sits in the motion (and what to build first)

- **Phone-only, no-website cohort (~150)** [`../00-decision.md`](../00-decision.md) §11: lead with the **SMS loaded agent** + the on-site flows. The intake widget is irrelevant to them until they have a web presence — don't lead with it.
- **With-website cohort (~200):** the **conversational intake widget** is a strong, concrete extra hook ("instant estimates on your own site, and they feed your AI office") and a clean standalone ~$300-class sale that ladders into the Employee.
- **Build order (agent-leverage, Tier-tagged):** (1) the SMS/web loaded-agent first-touch and account claim; (2) walkthrough → estimate PDF artifact; (3) Gmail send + real reply listener; (4) Stripe Connect test-mode deposit invoice + webhook; (5) internal reminder; (6) hosted self-bootstrapping skill and intake widget. The MVP is the real whole-product loop, not a clever estimate demo with manually injected downstream events.

## Scope boundary (unchanged, restated for the new surfaces)

- **Included:** the brain in any form above, the walled-off intake profile, alerts on the owner's channel, owner-approved PDF + deposit link, ongoing tuning.
- **Not included / always the owner's:** final-number ownership, autonomous sending, contract/lien/legal language, cold outbound, and any customer-facing send the owner hasn't approved. The gate does not move because the surface changed.
