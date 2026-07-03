# Founding Principle — Maximize Agent Leverage (Person-Minimal by Design)

**Status: complete** · _Created 2026-06-27._

## The principle

> **Leave as much of the company as possible to powerful AI agents. Reserve the founder for what only a human can do: trust, judgment, taste, and relationships.**

AMTECH sells installed AI workers to SMBs. It must **run on the same thing it sells.** Every recurring task inside AMTECH — research, list-building, drafting, sequencing, QA, ops — is a candidate to be done by an agent, not by Ben. The default question for any new work is not "how do I do this?" but **"which agent does this, and where am I the only one who can't be replaced?"**

This is not cost-cutting. It is the **product thesis turned inward** (dogfooding) and the **only way a near-solo company reaches $10M+**: ~97% gross margins survive only if headcount stays near zero, and the parts of the business that prove hardest to delegate to agents are exactly the parts worth productizing and selling.

## Why this is the right bet now

- **The substrate is good enough.** With a capable model floor (GLM-5.2 / Opus 4.8 / GPT-5.5 as *minimums*), the bulk of go-to-market and delivery labor — enrichment, drafting, summarizing, sequencing, dossier-building — is already agent-grade.
- **It compounds with the intelligence curve.** Every model improvement makes more of AMTECH's own operations delegable, at flat cost — the same tailwind AMTECH sells to customers (see [`strategy-4-year-implications.md`](strategy-4-year-implications.md)). Build AMTECH so it *inherits* that gain.
- **It is the schlep that becomes the product.** Per PG, the ugly, repeated back-office work others avoid is where the moat is [S069]. Automating AMTECH's own back office is R&D for the contractor Employee — what you learn to delegate internally becomes a sellable skill or profile.

## The model-tier rubric (task → agent → model floor)

Treat these as **capability tiers**, not fixed model names — stay model-agnostic and route each task to the cheapest tier that clears the quality bar.

| Tier | Work | Examples | Model floor |
|---|---|---|---|
| **A — Bulk / cheap** | High volume, low judgment, verifiable | List enrichment, trade-tagging, data extraction, transcription, dedupe, CRM logging, first-pass drafts | **GLM-5.2** class |
| **B — Mid / synthesis** | Multi-step, moderate judgment | Follow-up sequencing, call dossiers, thread summaries, tuned-output drafting, low-risk skill execution | Mid (Sonnet/GPT-mid) class |
| **C — Frontier judgment** | Ambiguity, nuance, brand voice, final QA | Positioning, offer design, persuasive copy, QA of money-touching output, edge-case reasoning | **Opus 4.8 / GPT-5.5** class |
| **D — Founder-only** | Trust, taste, presence, money | Live demos, the trust close, the relationship, the approval/money gate, brand/strategy taste | **The human (Ben)** |

Rule of thumb: **push work down to the cheapest tier that passes, and escalate only the residue.** Most outbound and delivery steps are A/B; C is the supervisor that checks and polishes; D is the irreducible founder bottleneck.

Current Tier C routing: use **GPT-5.5** by default for planning, synthesis, prompt design, and cross-doc updates; use **Claude Opus 4.8** for heavy implementation when long-context multi-file coding, debugging, or autonomous build work is the main job. See [`MVP/prompting-guide.md`](MVP/prompting-guide.md).

## Guardrails (so leverage never breaks trust)

- **The human stays at every trust and money gate.** Anything that leaves a customer's business, touches money, or shapes a relationship passes a human (Ben, or the *customer* via the product's confirmation gate). This mirrors the product's own approval gate — see [`offers/wedge-offers.md`](offers/wedge-offers.md).
- **Pro-human, internally too.** Agents do the grind so the founder spends his hours on craft, customers, and judgment — never framed as agents being "better than people." Honor the positioning in [`competitors/landscape.md`](competitors/landscape.md).
- **Verifiable-first delegation.** Delegate aggressively where output is checkable (lists, drafts, summaries); supervise tightly where it is not (positioning, pricing, a real estimate's final number).
- **Log everything.** Agent-run steps must be logged and spot-checked; an unsupervised agent touching outbound or money is an incident, not leverage.

## How it shows up in the rest of the wiki

- The [`offers/skill-catalog.md`](offers/skill-catalog.md) tags each sellable skill with its agent-runnability and tier.
- The [`gtm/outbound-system.md`](gtm/outbound-system.md) marks every acquisition step as agent-run vs founder-only and maps the agent-run pipeline.
- The [`entrepreneurship-playbook.md`](entrepreneurship-playbook.md) treats "what can be delegated to agents" as a core lever in the $10M bridge.

## The one-line test

For any task in AMTECH: **"Is this Tier D? If not, an agent should be doing it."** If Ben is doing Tier A/B/C work by hand, that is a bug in the company, not the job.
