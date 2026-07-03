# CLAUDE.md — AMTECH Living Operating Brain

> **FIRST, EVERY SESSION: read and embody [`identity.md`](identity.md)** — the required operating self-image, voice, and standard for all AMTECH work (lead manager · son of Ogilvy · relentlessly resourceful founder · psycho-cybernetics · the AMTECH spirit). Behavior follows self-image; adopt it before you act. Not optional.

## What this folder is

The **living operating brain for AMTECH AI** — a full, interlinked wiki of markdown files holding the company's current go-to-market decision, offer, segments, and execution plan. It was built from the brief in **`AMTECH-discovery-prompt.md`** (now the historical spec) and is **kept continuously current**.

**Start here:** [`CODEGRAPH.md`](CODEGRAPH.md) — the map of every page plus the canonical facts — then `wiki/00-decision.md`.

## Current state — the brain is built; keep it living

The research is done and the decision is made:

- **Beachhead:** owner-operated **painting & landscaping contractors**. **Beachhead #2:** bookkeepers (sequenced).
- **Offer:** the Estimate skill → **$300 custom skill** → **connected AI Employee** ($750 setup + $1,000–1,500/mo).
- **Positioning:** AMTECH commercializes improving agent intelligence; **pro-human** (never anti-human); **maximize agent leverage** (person-minimal).

**Prime directive — living brain, not archive.** Every page reads as current truth. When anything changes, **rewrite or delete** the affected pages — never leave superseded content, "we used to think X" notes, retired rankings, or stale banners behind (CODEGRAPH §7, invariant 10). Propagate canonical-fact changes per CODEGRAPH §3.

## Prompting and planning protocol

**AI Employee MVP — source of truth & build home.** The single source of truth for the AI Employee MVP is **[`wiki/MVP/`](wiki/MVP/)** (the `wiki/MVP/old-build-plan/` whole-product packet defines the bar). The MVP is **built in the root [`mvp-build/`](mvp-build/) folder** — the only folder beside `wiki/`. The earlier `AI_EMPLOYEE_MVP/` prototype proved the mechanics (now preserved in `wiki/product-ai-employee-context.md` + ledger S081–S085) and has been **removed**; do not treat it or any "code-complete prototype" framing as the current bar.

**Forward plan = real modular phases.** The forward roadmap is **[`wiki/MVP/build-plan-current/phases/`](wiki/MVP/build-plan-current/phases/)** — Phase 0 baseline (current source-wired loop) + dependency-ordered Phases 1–13 (the retired "Workstreams A–H"). Current state: Phase 0 baseline `source-wired`; the **Phase 1 live-acceptance harness is built and locally verified** (gate `pending` live creds — see `wiki/MVP/implementation-records/2026-06-30-phase-01-acceptance-harness-record.md`); Phases 2–13 `planned`.

**Build-home agent guide + durable memory.** When working inside `mvp-build/`, read **[`mvp-build/CLAUDE.md`](mvp-build/CLAUDE.md)** (mirror: `mvp-build/AGENTS.md`) first. `mvp-build/` is a **local-only git repo** (branch `main`, no remotes) with **in-repo durable memory at [`mvp-build/memory/`](mvp-build/memory/)**. Follow the memory writing protocol in `mvp-build/memory/MEMORY.md`: write/update a dated handoff mid-session after substantial multi-feature or architectural work, after a full phase implementation, and after architectural/plan decisions. Keep `wiki/MVP/implementation-records/` for factual code-state and `mvp-build/memory/` for the agentic-dev narrative + decisions.

For major MVP implementation planning, read [`wiki/MVP/prompting-guide.md`](wiki/MVP/prompting-guide.md) and [`wiki/MVP/implementation-plan-prompt-handoff.md`](wiki/MVP/implementation-plan-prompt-handoff.md) before writing prompts or plans. AMTECH currently defaults to **GPT-5.5** for planning, synthesis, prompt design, and wiki/codegraph updates, and frequently uses **Claude Opus 4.8** for heavy multi-file implementation. Use high/deep reasoning for planning work; assume high/xhigh effort for broad implementation work. Do not ask future agents for hidden chain-of-thought in final outputs; ask for source memory, concise rationale, self-checks, pass/fail criteria, tests, and carry-forward notes.

Every implementation plan must be grounded in files already read, preserve the real whole-product MVP bar, name future-phase seams, and specify wiki/codegraph update points.

## Default task — maintain and extend the living brain

The brain is built. When asked to extend it, sharpen the decision, research a new angle, or update anything:

1. Read [`CODEGRAPH.md`](CODEGRAPH.md) first (the map + canonical facts). The original brief `AMTECH-discovery-prompt.md` is the historical spec if you need the original deliverable list.
2. Do real primary-source research for any new claim (see THE SOURCE RULE below).
3. Write changes into `./wiki/` and **propagate** per CODEGRAPH §3/§7 so nothing goes stale.
4. Keep it a **decision-and-call-list brain**, not an academic survey — and **leave nothing as-is that the change touches**.

Persist files incrementally rather than holding everything in context.

## AMTECH in 90 seconds (so you don't lose the plot)

AMTECH AI is a one-person studio (Benjamin Palaskas, near Scranton PA) that needs **cash within ~30 days**. Bias every recommendation toward **speed-to-revenue and speed-to-trust**.

There is a **two-rung product ladder**, and the research covers both:

- **Rung 1 — AMTECH Skills (the wedge):** portable SKILL.md-style skills that run inside the buyer's *existing* tool (Claude, ChatGPT, Cursor) via a signed registry at `amtechai.com/skills`. Cheap, fast to build, near-zero trust barrier. The new trojan horse (replaces the website in that role).
- **Rung 2 — the AI Employee (the recurring flagship):** a self-hosted Hermes agent, one per client, textable on its own number, that does the *internal* back-office labor an owner/admin does and reports back, with a confirmation gate before anything leaves the business. It **absorbs the management pain that skills create** (invoking, pasting context, juggling connectors/subscriptions, model drift).

**The bet, now validated for the beachhead:** land contractors cheap with the Estimate skill, upsell the always-on Employee when they feel the glue-work pain. For paint/landscape contractors the skill-buyer and the Employee-buyer are the **same person** — the owner — so it's a clean upsell, one motion.

Margins are high (cheap VPS hosts many instances, ~$1.15/mo per Twilio number, modest tokens). **Sales is the bottleneck, not infrastructure.**

## THE SOURCE RULE (non-negotiable)

A previous research pass was **ruined by vendor SEO and marketing pages**. Those pages describe pain to sell a fix; they are **not evidence of demand**.

- **Hunt primary-source operator voices:** Reddit (r/smallbusiness, r/Entrepreneur, r/accounting, r/Bookkeeping, r/agency, r/SEO, r/digital_marketing, r/freight, r/recruiting, r/InsuranceProfessional, trade subs), industry forums, FB/LinkedIn/Discord/Slack groups, Indie Hackers, Hacker News, **user-written** G2/Capterra reviews (skip vendor copy), YouTube comments on "day in the life of a [role]" videos, and **job postings** for the admin/ops roles these owners try to hire (the JD is the task list and the budget).
- **The poison test:** if a page's call-to-action is "book a demo" or "start free trial," it is an ad. Demote it. Use vendor pricing pages **only** as price anchors, never as evidence of pain.
- **Cite or it didn't happen:** every pain you assert must link to where a real operator said it, in their words, with the source type noted. If you can only find vendor pages for a claim, label it **`[UNVERIFIED]`** in the wiki.

## Output: the wiki structure

Build under `./wiki/`. Use relative links between pages. Every page starts with a one-line status: `Status: draft | in-progress | complete`.

```
wiki/
  README.md                 # Index + headline decision. Keep current.
  index.html                # Browsable explorer (own FILES manifest — keep in sync).
  00-decision.md            # THE OUTPUT: beachhead, offer, ladder, pitch, list method, warm-path, timebox.
  01-method.md              # How the research was done + the Reddit-evidence quality warning.
  entrepreneurship-playbook.md   # Aulet/PG/Blank/Moore/Hormozi applied; iterative-vs-lateral acquisition; $10M bridge.
  principle-agent-leverage.md    # Maximize agent leverage (person-minimal) + task→model-tier rubric.
  product-ai-employee-context.md # AI Employee architecture + intelligence-curve thesis.
  MVP/prompting-guide.md         # GPT-5.5/Opus 4.8 prompting and Plan Mode protocol.
  MVP/implementation-plan-prompt-handoff.md # Meta-prompt handoff for phase-limited implementation planning.
  strategy-4-year-implications.md# The 4-year arc.
  founder-52-week-operating-plan.md # Week-by-week execution.
  warm-path.md              # Warm-intro inventory + referral prompts.
  segments/
    contractors.md          # THE BEACHHEAD — owner-operated painting & landscaping contractors.
    bookkeeping.md          # Beachhead #2 (sequenced; desk-based professional offices).
    marketing-agencies.md   # Evaluated and rejected (AI-native; won't buy the Employee).
    property-management.md  # Evaluated, parked.
    insurance.md            # Evaluated, parked (regulated).
    freight-staffing.md     # Evaluated, parked (crowded/outbound).
    real-estate.md          # Evaluated, parked (saturated/TCPA).
  competitors/landscape.md  # Competitive tiers, AMTECH whitespace, intelligence-curve differentiator.
  evidence/
    sources.md              # Source ledger S001–S074 (S068–S074 = entrepreneurship craft sources).
    scoring.md              # Current segment scorecard (contractors #1).
    aulet-beachhead-scoring.md # Aulet-lens validation of the contractor beachhead + validation plan.
  offers/
    skill-catalog.md        # ~24 sellable contractor skills + land-and-expand ACV ladder.
    wedge-offers.md         # The skill→custom-skill→connected-Employee ladder + connector tiers.
    pitch-scripts.md        # Contractor call library + the 3 panic redirects.
  gtm/
    outbound-system.md      # The multi-play, agent-run acquisition machine.
    outreach-engine.md      # Phone-first tactical detail.
    channel-map.md          # Channel × receptivity.
  logs/README.md            # Founder operating-log schema (never overwrite logs).
```

**`CODEGRAPH.md` §4 is the authoritative, always-current file map** — consult it, not this tree, if they ever disagree.

Each `segments/*.md` page must answer brief §3 for that segment: pain & task shape (with operator quotes), money & buying behavior (substitute cost to anchor against), trust & risk (incl. regulatory landmines + TCPA), ladder fit (same buyer or two motions; channel potential for agencies), and reachability for a one-person phone sprint.

You may add pages (e.g., a per-competitor deep dive) if evidence warrants, but do not pad. Add them to `README.md`.

## Research method / workflow

1. **Confirm web access.** This task requires web search + fetch. If web tools are unavailable, stop and tell the user — do not invent findings from training data.
2. **Plan first.** Lay out the segments and create the wiki skeleton (empty pages with status markers + the index).
3. **Research one segment at a time.** Search broad, then narrow to operator communities. Fetch full threads/pages — don't rely on snippets. **Log every primary source to `evidence/sources.md` immediately**, before writing conclusions.
4. **Write evidence before conclusions.** A segment page's claims should trace to ledger entries. No claim without a source or an `[UNVERIFIED]` label.
5. **Score** all segments in `evidence/scoring.md` using the rubric once segments are drafted.
6. **Synthesize the decision LAST** in `00-decision.md`, then update `README.md` with the headline.
7. Aim for **several distinct primary-source operator quotes per priority segment**. Depth on the top 2-3 candidates beats thin coverage of all seven.

## Definition of done

The wiki is complete only when it contains all of: a named **beachhead segment** with the filled scoring table; a concrete **wedge skill offer** with price and upfront cash mechanic; the **upsell trigger** + Employee price (setup fee now + monthly, anchored to that segment's substitute cost); a **phone pitch** + the three panic redirects; the **40-name list-building method** for the beachhead; a **warm-path** prompt; and a **sources ledger** thick with real operator voices.

It is **not done** if it reads like a market-research report with no decision, or if its evidence is vendor pages.

## Guardrails (carry these into every recommendation)

- **Lead with the owner's pain and a dollar number; hold the tech until a live demo.** The seller's failure mode is retreating into explaining the technology under price pressure — write recommendations that prevent that.
- **The beachhead is paint/landscape contractors** (validated — see `wiki/00-decision.md`). The old worry (field-based, hard to reach midday) is real but handled: phone list in hand, estimate-hour calls, local in-person demos, and **one trade at a time** so the skill template stays reusable. Don't sell "all contractors" generically.
- **Sequence by risk:** first tasks are high-value but safe to get wrong (research, drafts, prep); money-touching and outbound actions stay behind the confirmation gate. Mind **TCPA** — owner-directed/inbound work is fine; outbound cold-texting is not.
- **Keep the skill productized,** not bespoke — build once per vertical task, sell many. This is a product business with a services-flavored on-ramp, not an agency.
- **The decision routes phone calls.** End the decision page by reminding Ben to timebox his review of this wiki and start dialing — the research exists to point the calls, not replace them.

## Conventions

- Markdown only. Relative links between wiki pages.
- Short quotes attributed to source + URL; paraphrase otherwise; never reproduce long passages.
- File names lowercase-hyphenated, as in the tree above.
- Keep `README.md` current as the single entry point every time you add or finish a page.
