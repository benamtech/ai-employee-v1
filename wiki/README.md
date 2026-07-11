# AMTECH AI - Go-To-Market Research Wiki

**Status: complete**

This wiki turns `../AMTECH-discovery-prompt.md` and the current [`../mvp-build/`](../mvp-build/) work into a decision and call plan for AMTECH AI: a one-person studio turning skills into a managed, textable **AI Employee** and a Work Surface that lets owner-led SMBs supervise real work in seconds.

## Headline decision

> Sell first to **owner-operated residential painting & landscaping/hardscaping contractors**. Lead with a real estimate/work loop inside the **onboarding + consulting-sales surface**, then climb the ladder: **consultative first work → tuned Estimate package → live AI Employee → managed office loop.** The **current forward build plan** is [`../mvp-build/second-half-plan/`](../mvp-build/second-half-plan/) (its product surfaces are `source-wired`; the remaining gap is operational + live proof — see [`MVP/second-half-current-and-future-state.md`](MVP/second-half-current-and-future-state.md)). The original whole-product packet is [`MVP/old-build-plan/`](MVP/old-build-plan/), and the current implementation is [`../mvp-build/`](../mvp-build/). Bookkeepers are sequenced beachhead #2 on the same platform. **Note on "phases":** phase numbers appear across several distinct plans in this wiki (the second-half plan 0–6, the earlier reconciled technical plan `MVP/build-plan-current/` 0–13, the original workstreams, and the event-spine 3/3A/4). They are **not** a single sequence — always read a phase number against the plan it belongs to.

## The GTM spine

1. **Best customers** - paint/landscape contractors are the beachhead; bookkeepers are sequenced #2. AMTECH already owns the Estimate skill that does their #1 task. See [`00-decision.md`](00-decision.md), the scorecard in [`evidence/scoring.md`](evidence/scoring.md), and the Aulet-lens validation in [`evidence/aulet-beachhead-scoring.md`](evidence/aulet-beachhead-scoring.md).
2. **The offer** - the Estimate skill is the first proof object, but the sale is now the Employee relationship: consultative first work → tuned package → live Employee → managed office loop. See [`offers/wedge-offers.md`](offers/wedge-offers.md), [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md), and [`gtm/consulting-sales-surface.md`](gtm/consulting-sales-surface.md).
3. **How to reach them** - a multi-play, agent-run outbound system on the ~350 contractors already in hand, now driving prospects into the onboarding/consulting-sales surface rather than only a founder-run skill demo. See [`gtm/outbound-system.md`](gtm/outbound-system.md), [`gtm/outreach-engine.md`](gtm/outreach-engine.md), and [`00-decision.md`](00-decision.md) §11–13.
4. **How content compounds** - volume-first articles should be graph nodes, not blog posts: useful answers across AI agents for SMBs, contractor AI, business setup with AI, current AI news, and agentic SEO, materialized into articles, schema, OKF/concepts, images, Pinterest, social answers, and tool seeds. See [`gtm/agentic-article-research-system.md`](gtm/agentic-article-research-system.md).
5. **How it's built & scaled** - the Work Surface and deliverable-type system are the Macintosh layer for AI agents: one consistent interaction grammar for skills, Employees, connectors, provider events, and approvals. See [`MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`](MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md), [`principle-deliverable-driven-surfaces.md`](principle-deliverable-driven-surfaces.md), and [`strategy-4-year-implications.md`](strategy-4-year-implications.md).

## Index

### Local operating console

- [`../index.html`](../index.html) - root workspace explorer with search, wiki-style left navigation, multi-filetype rendering, footer views, outline, project graph, materialization lab, and founder log writer - `complete`
- [`logs/README.md`](logs/README.md) - agent-readable log schema for the 52-week operating plan - `complete`

### The output

- [`00-decision.md`](00-decision.md) - beachhead, wedge offer, upsell, pitch, list method, warm-path, timebox - `complete`

### Method and evidence

- [`01-method.md`](01-method.md) - source rule, Firecrawl method, verified vs `[UNVERIFIED]`, gaps - `complete`
- [`evidence/sources.md`](evidence/sources.md) - source ledger for operator language, job posts, price anchors, and reports - `complete`
- [`evidence/scoring.md`](evidence/scoring.md) - segment scorecard (contractors #1) behind [`00-decision.md`](00-decision.md) §2 - `complete`
- [`evidence/aulet-beachhead-scoring.md`](evidence/aulet-beachhead-scoring.md) - Aulet-lens validation of the contractor beachhead + access & validation plan - `complete`

### Product and strategy

- [`product-ai-employee-context.md`](product-ai-employee-context.md) - the AI Employee **product mechanics** (template, per-client factory pattern, the two onboarding doors, security boundary, Estimate skill) that the `MVP/old-build-plan/` spec assumes - `complete`
- [`product-agent-platform-architecture.md`](product-agent-platform-architecture.md) - **the layer AMTECH owns over Hermes**: the front-door onboarding orchestrator, the multi-surface interaction wrapper (SMS/webchat/voice), and the backend "Manager" control plane. Agent-native, lean, own-the-agency - `complete`
- [`ai-employee-mvp-build-plan-handoff.md`](ai-employee-mvp-build-plan-handoff.md) - the **design rationale** (guardrails, workstreams, tool surfaces, anti-patterns) that produced the `MVP/old-build-plan/` packet - `complete`
- [`MVP/build-plan-current/README.md`](MVP/build-plan-current/README.md) - ⭐ **current reconciled build plan** for the AI Employee MVP and first production operating layer: original whole-product bar + current implementation state + provider/runtime acceptance + event-bus/Work Surface frontier + admin system + metering + 1000-user operations - `active`
- [`MVP/second-half-current-and-future-state.md`](MVP/second-half-current-and-future-state.md) - ⭐ **current build state (2026-07-11)**: the second-half plan's product surfaces (web employee desk, SMS ambient inbox + signed Review, tool-agnostic Connector Center, resurfacing, materialization/capability layer, MCP-UI, Gmail/Stripe/**QuickBooks** connectors, operator admin) are all `source-wired`; the remaining gap is **operational** (production deploy foundation, working tool-loop, backups/observability/egress) plus **live provider proof**. Companion to [`../mvp-build/second-half-plan/`](../mvp-build/second-half-plan/), the deploy-readiness review, and the re-sequenced roadmap - `active`
- [`MVP/old-build-plan/README.md`](MVP/old-build-plan/README.md) - original whole-product MVP packet: signup → real employee → estimate PDF → approved Gmail send → real Gmail reply event → Stripe Connect test-mode deposit invoice → internal reminder. Preserved as the original plan packet; current sequencing lives in `MVP/build-plan-current/` - `complete`
- [`MVP/old-build-plan/14-agentic-tooling-research-notes.md`](MVP/old-build-plan/14-agentic-tooling-research-notes.md) - current-docs research addendum for extending Hermes, MCP/Manager tools, provider connectors, artifacts, approvals, and events as the main functional surface - `active`
- [`MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md`](MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md) - interaction research addendum: the Work Surface, ambient SMS inbox, Hermes→Work adapter, and non-technical owner trust layer - `active`
- [`MVP/implementation-records/README.md`](MVP/implementation-records/README.md) - implementation ledger beside the build plan; records what is wired in [`../mvp-build/`](../mvp-build/), what has local proof, and what remains provider-acceptance pending - `active`
- [`MVP/implementation-records/2026-06-29-phase-3-partial-record.md`](MVP/implementation-records/2026-06-29-phase-3-partial-record.md) - factual Phase 3 partial Gmail implementation record: source-level OAuth/send/watch/history/event seams are wired and locally verified, provider proof still pending - `active`
- [`MVP/implementation-records/2026-06-29-phase-5-and-work-surface-record.md`](MVP/implementation-records/2026-06-29-phase-5-and-work-surface-record.md) - **current** implementation record: Phase 0–4 loose ends closed, Phase 5 close-the-loop (owner-confirmed reminders + firing/watch-renewal scheduler seam), the descriptor-driven Work Surface redesign, and the provider-acceptance-pending table - `active`
- [`MVP/event-driven-office-and-generative-ui.md`](MVP/event-driven-office-and-generative-ui.md) - ⭐ forward design + product-state review: the **message-to-agent event flow** (any system/webhook/cron → employee → typed work), **how generative UI is implemented so far** (static, typed, gate-by-type) and the frontier ahead, and the build-plan feature re-sequencing for an entire office running through one AI employee - `active`
- [`MVP/agent-inbox-and-channel-architecture.md`](MVP/agent-inbox-and-channel-architecture.md) - ⭐ load-bearing interaction architecture: the **universal "message to the agent" inbox** (open source-adapter contract; source orthogonal to channel), the **live-session-first conductor + native subagents/Jobs + fallback serialized inbox** execution model, the **presence-aware channel/session router**, and the **conversation-as-brain-artifact** single thread (dedicated number per employee). Locks the Hermes turn-atomic substrate answer without overbuilding out-of-session routing: use the active Hermes session when it preserves UX; use Manager serialization where needed - `complete`
- [`MVP/hermes-run-session-semantics-research.md`](MVP/hermes-run-session-semantics-research.md) - Hermes substrate research note: Runs/Sessions are turn-atomic over the HTTP API, current `delegate_task` supports background in-session subagents that let the user keep working, Jobs/cron run fresh isolated sessions, profiles are state boundaries but not OS sandboxes, and AMTECH should use Manager serialization only where native session/delegation is insufficient - `in-progress`
- [`MVP/build-plan-current/phases/phase-03a-channel-session-presence-layer.md`](MVP/build-plan-current/phases/phase-03a-channel-session-presence-layer.md) - Phase 3A scope for the Channel/Session/Presence router: active-session-wins routing, cross-channel dedupe, one acceptance primitive across renderings, delivery decisions, presence signals, and worker-completion routing through the canonical inbox - `planned`
- [`MVP/phase-3-generative-ui-reframe.md`](MVP/phase-3-generative-ui-reframe.md) - Phase 3 reframing note: build Gmail/event work as typed work events and deliverable-driven generative UI, with conformance tests and one-second approval/edit loops - `active`
- [`MVP/prompting-guide.md`](MVP/prompting-guide.md) - GPT-5.5/Opus 4.8 prompting and Plan Mode protocol for AMTECH implementation agents - `complete`
- [`MVP/implementation-plan-prompt-handoff.md`](MVP/implementation-plan-prompt-handoff.md) - handoff and meta-prompt for a Plan Mode agent that will create phase-limited implementation-plan prompts while preserving the whole-product MVP bar - `complete`
- [`MVP/phase-3-implementation-session-handoff.md`](MVP/phase-3-implementation-session-handoff.md) - copy-ready handoff prompt for a new session that will finish Phase 0-2 loose ends, implement Phase 3 Gmail, and lay Phase 4/5 wiring - `active`
- [`MVP/phase-3-planning-session-handoff.md`](MVP/phase-3-planning-session-handoff.md) - copy-ready prompt for writing a Phase 3 implementation plan using the tooling and Work Surface research - `active`
- [`MVP/phase-3-finish-session-handoff.md`](MVP/phase-3-finish-session-handoff.md) - copy-ready prompt for finishing Phase 3 from the current partial Gmail implementation - `active`
- [`MVP/phase-03a-04-live-session-event-spine-handoff.md`](MVP/phase-03a-04-live-session-event-spine-handoff.md) - ⭐ **current next-session orientation** after the Hermes/subagent/channel decisions: live-session-first event spine, native subagents as MVP leverage, Manager serialization as fallback, Phase 3 generic ingress, Phase 3A Channel/Session/Presence, and Phase 4 wake-path sequencing - `active`
- [`MVP/phase-6-and-event-bus-session-handoff.md`](MVP/phase-6-and-event-bus-session-handoff.md) - prior event-bus implementation handoff: close Phase 5 loose ends, implement Phase 6 pilot hardening, and lay Phase 7 groundwork by closing the event-flow §3 gaps (generic ingress, message-to-agent, triage, live adapter). Superseded for orientation by the Phase 3A/4 live-session handoff above; still useful for implementation detail - `active`
- [`strategy-4-year-implications.md`](strategy-4-year-implications.md) - what the AI Employee, Work Surface, task-level economics, and profile factory mean for AMTECH over four years - `active`
- [`../mvp-build/`](../mvp-build/) - **where the MVP gets built** (the only other root folder beside `wiki/`). Its current plan is [`MVP/build-plan-current/`](MVP/build-plan-current/); the original mechanics packet is [`MVP/old-build-plan/`](MVP/old-build-plan/); implementation state is tracked in [`MVP/implementation-records/`](MVP/implementation-records/); the product mechanics it assumes are in `product-ai-employee-context.md`.
- [`founder-52-week-operating-plan.md`](founder-52-week-operating-plan.md) - bootstrapped founder schedule, weekly quotas, revenue targets, and first-year execution plan - `complete`

### Craft & systems

- [`entrepreneurship-playbook.md`](entrepreneurship-playbook.md) - Aulet/PG/Blank/Moore/Hormozi applied to the beachhead; iterative-vs-lateral client-acquisition method; the $10M bridge - `complete`
- [`principle-agent-leverage.md`](principle-agent-leverage.md) - founding principle: maximize agent leverage (person-minimal), task→model-tier rubric, trust-gate guardrails - `complete`
- [`principle-graph-materialization.md`](principle-graph-materialization.md) - founding principle: one brain/graph materialized for many surfaces, actors, and trust levels (why the catalog is cheap and the upsell natural) - `complete`
- [`principle-deliverable-driven-surfaces.md`](principle-deliverable-driven-surfaces.md) - founding principle: the deliverable's **type** drives its preview, proof, and approval gate - one interaction grammar (~12 types) for hundreds of skills across every department, surface, and owner; the progressive-trust ladder for repeatable tasks - `complete`

### Segments

- [`segments/contractors.md`](segments/contractors.md) - **the beachhead** (paint/landscape contractors) - `complete`
- [`segments/bookkeeping.md`](segments/bookkeeping.md) - beachhead #2 (sequenced) - `complete`
- [`segments/marketing-agencies.md`](segments/marketing-agencies.md) - evaluated and rejected (why agencies aren't our buyer) - `complete`
- [`segments/property-management.md`](segments/property-management.md) - evaluated, parked - `complete`
- [`segments/insurance.md`](segments/insurance.md) - evaluated, parked (regulated) - `complete`
- [`segments/freight-staffing.md`](segments/freight-staffing.md) - evaluated, parked (crowded/outbound) - `complete`
- [`segments/real-estate.md`](segments/real-estate.md) - evaluated, parked (saturated/TCPA) - `complete`

### Competition

- [`competitors/landscape.md`](competitors/landscape.md) - tiers, price anchors, AMTECH whitespace, failure stats - `complete`

### GTM

- [`gtm/consulting-sales-surface.md`](gtm/consulting-sales-surface.md) - the updated GTM spine: onboarding as the consulting-sales surface where the Employee diagnoses, demonstrates, provisions, and escalates - `active`
- [`gtm/sba-sbdc-funding-and-partner-strategy.md`](gtm/sba-sbdc-funding-and-partner-strategy.md) - AMTECH's Scranton/NEPA-first financing path as an SBA/SBDC client, plus the strategy to become the local AI implementation resource for SBDCs/SBA-adjacent partners - `active`
- [`gtm/agentic-article-research-system.md`](gtm/agentic-article-research-system.md) - volume-first article research/writer skill spec: broad AI-agents-for-SMB graph, post-March-2026 research doctrine, query fan-out, evidence ledger, esoteric SEO surface packs, OKF/images/Pinterest/social/tool materialization, and copy-ready website-repo implementation prompt - `active`
- [`gtm/outbound-system.md`](gtm/outbound-system.md) - the multi-play, agent-run acquisition machine (Hormozi Core Four for contractors) + funnel math - `complete`
- [`gtm/outreach-engine.md`](gtm/outreach-engine.md) - contractor phone-first tactical detail (scripts, cadence, benchmarks) under the system - `complete`
- [`gtm/channel-map.md`](gtm/channel-map.md) - contractor channel × receptivity (phone list, local, referrals, supply houses, job-post triggers) - `complete`

### Offers and scripts

- [`offers/skill-catalog.md`](offers/skill-catalog.md) - ~24 sellable contractor skills + the land-and-expand ACV ladder + agent-tier tags - `complete`
- [`offers/wedge-offers.md`](offers/wedge-offers.md) - the consultative-first-work → tuned-package → live-Employee → managed-office-loop ladder, connector tiers, line-item rule - `complete`
- [`offers/estimator-whole-product.md`](offers/estimator-whole-product.md) - Aulet whole-product: every surface of the Estimate wedge (loaded SMS agent, conversational intake, voice-walk, Stripe deposit) + the self-escalating funnel - `complete`
- [`offers/pitch-scripts.md`](offers/pitch-scripts.md) - contractor call library + the three panic redirects - `complete`
- [`warm-path.md`](warm-path.md) - contractor referral prompts and first-10-conversations plan - `complete`

## Source rule

Primary-source operator voices drive pain claims. Vendor pages are used only as price anchors or competitor-positioning evidence. Reddit direct scraping was unavailable through Firecrawl for this account, so Reddit entries are cited as `reddit-search-capture` and this limitation is documented in [`01-method.md`](01-method.md).
