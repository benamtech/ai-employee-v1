# CODEGRAPH.md — AMTECH GTM-RESEARCH workspace map

> **Audience: AI agents.** This is the orientation + structural index for the whole
> `GTM-RESEARCH` workspace. Read this first. It tells you what every file is, how
> they link, which facts are canonical (never contradict them silently), the
> consistency rules that keep the wiki coherent, and exactly which files to touch
> when asked to extend something. It is generated from the corpus, not invented;
> regenerate it when the file set or link graph changes (see **§9 Maintenance**).
>
> Generated: 2026-06-27 (last updated 2026-07-10, **current MVP build plan = `wiki/MVP/build-plan-current/`; current second-half forward plan = `mvp-build/second-half-plan/`; current second-half wiki companion = `wiki/MVP/second-half-current-and-future-state.md`; original build packet = `wiki/MVP/old-build-plan/`; build home = `mvp-build/`; MVP source map = `mvp-build/CODEGRAPH.md`; implementation records = `wiki/MVP/implementation-records/`; production docs include admin + metering plans plus the 2026-07-11 production-deploy-readiness review in `mvp-build/docs/`, and the re-sequenced production-runtime-and-deploy roadmap in `mvp-build/second-half-plan/`** — the AI Employee MVP build packet, prompting guide, implementation handoffs, research addenda, and implementation records under `wiki/MVP/` are the source-of-truth family, and the MVP is built in the root folder `mvp-build/`. The earlier `AI_EMPLOYEE_MVP/` prototype (which proved the mechanics and partly inspired the `wiki/MVP/build-plan` style) has been **REMOVED from the repo**; its mechanics live on in the wiki + ledger S081–S085. The root now holds exactly two folders: `wiki/` and `mvp-build/`, plus root control docs and the root workspace explorer `index.html`) · Corpus: 64+ markdown wiki pages + 1 root HTML explorer + 2 root docs + the `mvp-build/` build home.

---

## 1. What this workspace is (30-second orient)

A **living operating brain** for AMTECH AI — a full interlinked wiki under [`wiki/`](wiki/)
holding the company's current go-to-market decision, offer, segments, and execution plan,
plus the flagship product build in [`mvp-build/`](mvp-build/), **kept continuously current**.

- **Identity first.** Read and embody [`identity.md`](identity.md) before acting — the required operating self-image, voice, and standard for all AMTECH work. Enforced by `CLAUDE.md` and invariant #11.
- **Operating instructions** live in [`CLAUDE.md`](CLAUDE.md). It overrides default behavior. Read it before editing.
- **The brain is built and current.** The decision is locked (see §3). Work now is refinement, extension, execution-logging, and keeping every page current (no superseded content — invariant #10).
- **Product code lives in `mvp-build/`.** The whole repo is the AMTECH company brain; `mvp-build/` is the code,
  provisioning, runtime, and acceptance home for the AI Employee flagship. Implementation agents should read
  [`mvp-build/CODEGRAPH.md`](mvp-build/CODEGRAPH.md) before navigating source files.

**Subject in one line:** AMTECH AI is a one-person studio (Benjamin Palaskas, near
Scranton PA, `ben@palaskasconsulting.com`) that needs cash within ~30 days, selling a
a managed **AI Employee + Work Surface** for owner-led SMBs — with portable **Skills**
as the first proof object and supply chain, and the textable, self-hosted **AI Employee**
(Hermes agent) sold through an Employee-like onboarding/consulting-sales surface as the
recurring product. Bias everything toward **speed-to-revenue and speed-to-trust**.

---

## 2. The decision spine (the through-line every page serves)

```
01-method.md ──► evidence/sources.md          (S001–S067 ledger: primary operator voices)
        │                │
        ▼                ▼
segments/*.md  ◄── cite ── sources             (7 candidate markets, brief §3 answered each)
        │
        ▼
evidence/scoring.md  +  evidence/aulet-beachhead-scoring.md   (brief §4 rubric, two lenses)
        │
        ▼
competitors/landscape.md     (brief §5 whitespace + failure stats)
        │
        ▼
00-decision.md  ◄── THE OUTPUT (brief §6): beachhead, wedge offer, upsell, pitch,
        │            list method, warm-path, timebox
        ▼
offers/* + gtm/* + warm-path.md + founder-52-week-operating-plan.md   (execution layer)
        │
        ▼
README.md (index) + index.html (browsable explorer) + logs/ (founder run-log)
```

Read order for a cold agent: **`identity.md`** (become the operator first) →
`README.md → 00-decision.md → offers/wedge-offers.md → gtm/outbound-system.md → offers/pitch-scripts.md`.

---

## 3. Canonical facts (do NOT contradict these without explicit user instruction)

These values are repeated across many pages. If you change one, you must propagate it
(see §7 invariants). Treat them as the single source of truth.

| Fact | Value | Primary page |
|---|---|---|
| **Beachhead segment** | Owner-operated residential **painting & landscaping/hardscaping** contractors (1–10 person) | `00-decision.md` |
| **Beachhead #2 (sequenced)** | Bookkeepers / desk-based professional offices — same platform, requires building a doc-sorter skill first | `00-decision.md` §10 |
| **Wedge** | The **AMTECH Estimate skill** (already owned) — the first proof object + supply chain, shown as free live first work on the contractor's own job inside the onboarding/consulting-sales surface. **The Employee relationship is the product, not the skill.** | `00-decision.md`, `offers/wedge-offers.md`, `gtm/consulting-sales-surface.md` |
| **The ladder** | Rung 0 **consultative first work** (free/diagnostic, in the surface) → Rung 1 **tuned Estimate package $300** (20-min interview, paid discovery that installs the business brain) → Rung 2 **live AI Employee** ($750 setup + $1,000–1,500/mo) → Rung 3 **managed office loop**. Provision the Employee early; the tuned package is not the product. | `offers/wedge-offers.md`, `gtm/consulting-sales-surface.md` |
| **Employee price** | $750 setup + **$1,000/mo Starter** (email + estimate, voice→draft→approve) / **$1,500/mo Pro** (+ Drive + invoicing + follow-up) | `00-decision.md` §7 |
| **Connector tiers** | Skill (paste) → +email (voice memo pulls thread) → +Drive (past jobs/pricing) → +invoicing → (later) browser. More context → less owner effort → same ~5% accuracy. | `offers/wedge-offers.md` |
| **Line-item rule** | Estimates output as itemized line items + assumptions + low-confidence flags; owner approves before anything leaves. Accuracy is the proof point, not a liability. | `00-decision.md` §5 |
| **Core thesis** | AMTECH = commercialization/packaging layer on improving agent intelligence (Hermes/Nous + frontier models). Sells installed vertical worker, not intelligence. Work improves as models improve; moat is packaging/context/trust, not the model. | `00-decision.md` §3 |
| **Operating identity** | Every session reads and embodies `identity.md` before acting: lead manager · son of Ogilvy · relentlessly resourceful founder (PG) · psycho-cybernetics · AMTECH spirit. Behavior follows self-image. | `identity.md` |
| **Operating model** | Maximize agent leverage / person-minimal: agents do Tier A/B/C work; founder reserved for **Tier D** (trust, taste, demo, money gate). Model floor GLM-5.2 / Opus 4.8 / GPT-5.5. AMTECH dogfoods its own product. | `principle-agent-leverage.md` |
| **Prompting/planning protocol** | GPT-5.5 is the default for planning, synthesis, prompt design, and cross-doc updates; Claude Opus 4.8 is the heavy-implementation default for broad multi-file coding/debugging. Use high/deep reasoning for planning, high/xhigh effort for heavy implementation, read files first, avoid asking for hidden chain-of-thought in final outputs, and require source memory + pass/fail checks. | `wiki/MVP/prompting-guide.md` |
| **Product surface area** | ~24 sellable contractor skills across the job lifecycle; land with Estimate, expand lanes → raises ACV. | `offers/skill-catalog.md` |
| **Acquisition** | Multi-play, agent-run outbound system (Hormozi Core Four for contractors); founder is the bottleneck only at demo/close. | `gtm/outbound-system.md` |
| **Acquisition search method** | Course fixed; the winning play is found by experiment — **iterative** (deepen a play) vs **lateral** (switch plays); never switch segment. | `entrepreneurship-playbook.md` |
| **List in hand** | ~150 phone-only (no website) + ~200 with-website contractors; trade untagged → enrich first | `00-decision.md` §11 |
| **Product ladder (product def)** | Skills (first proof object + supply chain) → AI Employee (recurring, self-hosted Hermes, one profile/client, textable) → Work Surface (typed deliverable grammar across lanes) | `product-ai-employee-context.md`, `principle-deliverable-driven-surfaces.md` |
| **AI Employee MVP — source of truth & build home** | **`wiki/MVP/` is the single source-of-truth family** for the AI Employee MVP. The current reconciled build plan is `wiki/MVP/build-plan-current/`; the new second-half forward plan is `mvp-build/second-half-plan/` with wiki companion `wiki/MVP/second-half-current-and-future-state.md`; the original whole-product packet remains `wiki/MVP/old-build-plan/` (17 docs including research addenda); factual implementation state lives in `wiki/MVP/implementation-records/`; prompting/handoff docs remain under `wiki/MVP/`. **The MVP is built in `mvp-build/`** (the only root folder beside `wiki/`). The earlier `AI_EMPLOYEE_MVP/` prototype proved the mechanics (now in the wiki + ledger S081–S085) and has been **REMOVED** — do not treat any "code-complete prototype" framing as the current bar. Current code state is recorded in implementation records; immediate next work starts from `mvp-build/second-half-plan/phase-01-preserve-and-close-live-gate.md`. | `wiki/MVP/build-plan-current/README.md`, `wiki/MVP/second-half-current-and-future-state.md`, `mvp-build/second-half-plan/README.md`, `wiki/MVP/implementation-records/README.md` |
| **Agent platform layer (what AMTECH owns over Hermes)** | Three planes: (1) **front door** = lean **stateless agentic orchestrator** (SMS+webchat now, voice later) that runs onboarding and ends in account setup + a strict `provision_employee` Manager/MCP tool; (2) **interaction wrapper** = multi-surface work-in-progress/preview/NL-feedback/repeatable-tasks over the live employee, using Hermes per-profile API server/Runs/Sessions/Jobs and AMTECH artifact/auth UI; (3) **the "Manager"** = a BACKEND control plane, **invisible to the user** (the owner only ever talks to their employee), reached agent-natively via the employee's tools/MCP — connectors, skills, lifecycle, entitlements, drift, multi-employee/org. Plus **the event mesh**: Gmail replies and Stripe invoice/payment webhooks arrive as real provider events through Manager/Hermes routes, then the employee turns them into human-meaningful, actionable notices — the AMTECH edge. Design rules: **agent-native (tool calls + agent-to-agent messages over APIs), lean, one-relationship, proactive competence** (owner never says "…and test it"); **own-the-agency** (a Hermes advance makes AMTECH stronger). **MVP policy: all capabilities free by default; monetization/paywalls deliberately open; creation requires account setup, not payment; entitlement/paywall scaffolding still exists but defaults to allow.** Critical correction: AMTECH account ≠ Hermes profile ≠ runtime; Hermes profiles isolate state/config, not filesystem/process access on `local`; runtime isolation requires Docker/SSH/VM-style backends. | `product-agent-platform-architecture.md` |
| **Whole-product MVP build plan** | Current reconciled implementation plan at `wiki/MVP/build-plan-current/`: original whole-product bar plus current implementation status, provider/runtime acceptance plan, event-bus/Work Surface frontier, admin system, metering, billing, LLM provider registry, and 1000-user operations. Original mechanics remain in `wiki/MVP/old-build-plan/`: signup/claim/SMS onboarding → live employee → walkthrough-to-estimate conversation → PDF artifact link → approved Gmail send → real Gmail customer-reply event → approved Stripe Connect test-mode deposit invoice/payment link → internal reminder. Provider test mode is allowed for Stripe; manually injected provider results are not MVP acceptance. | `wiki/MVP/build-plan-current/README.md`, `wiki/MVP/old-build-plan/README.md` |
| **Agentic tooling research addendum** | Current-docs research says the functional expansion should be Hermes-first and tool-first: extend Hermes profiles/API/Runs/Sessions/Jobs/messaging/MCP/skills/memory, keep Manager as MCP-compatible control plane for tenancy/provider auth/audit/approval/proof, and treat OpenAI-compatible onboarding as a portability boundary rather than the product architecture. | `wiki/MVP/old-build-plan/14-agentic-tooling-research-notes.md` |
| **MVP prompting guide** | AMTECH internal prompting and planning guide for GPT-5.5/Opus 4.8-class agents: model routing, Plan Mode structure, whole-product MVP non-negotiables, prompt templates, and common failure modes. | `wiki/MVP/prompting-guide.md` |
| **Implementation-plan prompt handoff** | Handoff for an agent that will write a Plan Mode prompt for a future implementation-planning agent. It includes codegraph notation, phase mapping (Phase 0 source/architecture/data/tooling; Phase 1 onboarding/account/provisioning), pass/fail criteria, memory/handoff protocol, and a copy-ready prompt that asks for a decision-complete Phase 0+1 plan while preserving the whole-product MVP. | `wiki/MVP/implementation-plan-prompt-handoff.md` |
| **Implementation records** | Factual companion packet to the original build plan. Current records: Phase 0/1/2 wired; Phase 3 Gmail/work-event source wired; Phase 4 Stripe test-mode source wired; **Phase 5 close-the-loop wired**; **Phase 6 repair/security/runtime hardening + Phase 7 event-bus seams wired** (`0007` repair/jobs migration, repair tools, source suppression, triage/batching, `deliver_only` vs `wake_employee`, generic event-source registry, stored `[SILENT]` daily briefs, binding work-card approvals, Work Surface SSE seam); **new-era Phase 2 runtime/scheduler productionization source-wired** (`0008` runtime health migration, Docker-default backend, scheduler runner, `hermes_job_runs`, `runtime_health_checks`); **Phase 3/3A/4-core live-employee spine source-wired then TDD-hardened** (`0011`/`0012` migrations, real Hermes Sessions client, DB turn queue, generic ingress, channel router, live wake descriptors; fake-supabase now enforces unique indexes + a faithful turn-claim rpc so dedupe/serialization is provable, every new module + an auto-covering adapter-contract test, audit fixes incl. a turn-queue orphan, a `drain_employee_turns` lane, env-gated turn-claim + new-table RLS integration proofs); **Phase 6 metering foundation source-wired** (`0013` six Manager-only ledgers + additive `run_id` columns, `lib/metering.ts` best-effort helpers, one `run_id` threaded ingress→deliver→wake→turn→router→owner-turn); **38 files / 214 passing local unit tests** (+ env-gated integration, 7 skipped clean); provider/runtime acceptance remains pending. Records use CODEGRAPH for orientation and do not rewrite the original build-plan packet. | `wiki/MVP/implementation-records/README.md`, `wiki/MVP/implementation-records/2026-07-03-phase-04-hardening-and-phase-06-record.md` (current), `wiki/MVP/implementation-records/2026-07-03-phase-03-03a-04-core-record.md`, `wiki/MVP/implementation-records/2026-06-30-phase-6-and-event-bus-record.md`, `wiki/MVP/implementation-records/2026-06-30-phase-02-runtime-scheduler-record.md` |
| **Full MVP build-plan handoff** | The agent-team handoff for turning the corrected Hermes-aware architecture into a build plan: non-negotiable guardrails, system model, current source truth, target MVP paths, Manager tool surface, real Gmail/Stripe connector-event slices, required workstreams, open decisions, acceptance criteria, and anti-patterns. | `ai-employee-mvp-build-plan-handoff.md` |
| **Published Skills (4)** | OKF Audit, Knowledge Graph Builder, **Estimate**, Article Research Writer | `product-ai-employee-context.md` (S057) |
| **Founder** | Benjamin Palaskas, near Scranton PA, `ben@palaskasconsulting.com` | `CLAUDE.md` |
| **Cash deadline** | ~30 days | `CLAUDE.md` |
| **Review timebox** | ≤ 90 minutes before Ben starts dialing | `00-decision.md` |
| **Source count** | 94 ledger entries, S001–S094 (S068–S074 = entrepreneurship/craft; S075–S080 = customer-facing intake/whole-product; **S081–S085 = the now-REMOVED `AI_EMPLOYEE_MVP/` prototype** (historical reference only — `wiki/MVP/` is the MVP source of truth); **S086–S089 = Hermes/connector capability docs** — vendor capability ground truth, not demand evidence; **S090–S094 = agent-UX interaction design patterns** (generative UI, MCP Apps/MCP-UI, HITL decision vocabulary, progressive autonomy, trust-by-design) — design-pattern ground truth, not demand evidence; ⚠️ Reddit `reddit-search-capture` rows are weak — see `01-method.md`) | `evidence/sources.md` |

**Beachhead ranking (current — `evidence/scoring.md`, contractor-first lens):**

| Segment | Total |
|---|---:|
| **Painting & landscaping contractors** (beachhead) | **33** |
| Bookkeeping (beachhead #2, sequenced) | 26 |
| Property management (parked) | 24 |
| Insurance (parked) | 22 |
| Freight/staffing (parked) | 21 |
| Real estate (parked) | 19 |
| Marketing agencies (rejected) | 19 |

> **Living brain.** Every page reflects the *current* decision — there is no "superseded" or "retained-history" content (invariant 10, §7). Pages are either current or removed. If you change the decision, rewrite the affected pages to the new reality; don't leave archaeology behind.

---

## 4. Node registry (every file: role · status · key contents)

Status is the page's own first-line marker. `★` = highest-value pages for agents.

### Root (workspace control + spec)
| Path | Role | Status |
|---|---|---|
| `identity.md` | ★ **Read & embody first, every session.** The operating self-image, voice, and standard: lead manager · son of Ogilvy · relentlessly resourceful founder · psycho-cybernetics · AMTECH spirit. | n/a |
| `CLAUDE.md` | ★ Operating instructions for agents. Source rule, structure, guardrails, the living-brain prime directive. **Overrides defaults; points to `identity.md` first.** | n/a |
| `CODEGRAPH.md` | This file. Workspace map for agents. | n/a |
| `mvp-build/` | ★ **Where the AMTECH AI Employee MVP gets built** — the only root folder beside `wiki`. Current reconciled build plan = `wiki/MVP/build-plan-current/`; **current second-half forward plan = `mvp-build/second-half-plan/`**; original build packet = `wiki/MVP/old-build-plan/`; product mechanics = `wiki/product-ai-employee-context.md`. The backend now has meaningful Hermes/Manager/runtime/event seams, and second-half Phase 1-5 are source-wired/static-green: Manager-as-MCP identity binding/resources, tool schema cleanup, profile/runtime rendering, artifact fallbacks, descriptor/materialization contracts, scheduler/runtime health, owner Work Surface, SMS signed previews, capability graph, `SurfaceEnvelope` projection, tuple-cursor SSE, atomic signed-link counters, materialization diagnostics, and a Phase 5 internal admin/ops console with production browser-token gate, platform roles, support-access audit, redacted diagnostics, lifecycle controls, MCP credential rotation/revocation, readiness reporting, and billing scaffold. The second-half plan reframes the next era around a Hermes-backed small-business materialization layer: `SurfaceEnvelope`, `WorkResource`, `WorkAction`, `EmployeeEventStream`, generic renderers, SMS signed previews, serious web employee desk, admin/factory operations, billing, and free-trial readiness. Existing source includes profile-package rendering, Manager tools, Manager-as-MCP, artifacts/approvals, Gmail/Stripe/event seams, runtime health, turn queue, channel router, metering ledgers, local live-test tooling, and a UI-only fixture browser flow for web work without Docker/Supabase/Manager/Hermes/model credentials. A per-employee scoped MCP credential (`mcp-auth.ts`, migration `0023`) replaces the shared Manager internal bearer inside employee containers; follow-on 2026-07-10 work centralized approval `action_key` gating (`packages/shared/src/approval-policy.ts`), closed a turn-claim lock-insert race (migration `0024`) and a stuck-turn-reaper lost-update race, added a real production admission guard against the uncontained `local` runtime backend, and added migration `0025` for admin/ops. Provider/runtime live acceptance, live admin operator seeding, egress control, and real owner-surface polish remain pending. **`mvp-build/` is tracked in the root `GTM-RESEARCH` git repo** (branch `main`; GitHub remote `origin` → `benamtech/ai-employee-v1`) with a build-home agent guide (`mvp-build/CLAUDE.md` + mirror `mvp-build/AGENTS.md`) and in-repo durable memory (`mvp-build/memory/`). | n/a |
| `mvp-build/CODEGRAPH.md` | ★ MVP-specific source map for implementation agents. Explains that `mvp-build/` is the AI Employee product/provisioning/runtime home inside the larger AMTECH brain; maps end-user flows to source files; documents the Hermes/Nous substrate boundary, Manager-owned product layer, working/source-wired features, UI-only fixture workflow, and pending provider/runtime acceptance. | active |
| `mvp-build/docs/admin-system-architecture.md` | Planned admin-system architecture for the AI Employee product: operator/admin panel, owner account space, account/user/employee model, provisioning state machine, health, metering, AMTECH billing vs owner Stripe Connect payments, LLM provider connections, operations queues, security rules, and the path from MVP to roughly 1000 users. Cites current primary docs from Supabase, Stripe, Google Gmail/PubSub, Twilio, OpenAI, and OWASP. | planned |
| `mvp-build/docs/admin-system-implementation-plan.md` | Decision sequence for implementing the admin system without rewriting the MVP build-plan packet: vocabulary, admin read model, platform roles/support access, admin panel MVP, provisioning queue, provider operations, AMTECH billing scaffold, LLM provider registry, metering ledgers, and 1000-user ops queues/incidents/diagnostics. | planned |
| `mvp-build/docs/metering-architecture.md` | Planned production metering architecture: run ledger, raw meter events, tool invocation ledger, pricing versions, rollups, budget policies, wrapper boundaries, product surfaces, and security/RLS rules. Current code only has `usage_events`, `feature_checks`, and `audit_log`; this doc defines the company-grade target. | planned |
| `mvp-build/docs/metering-implementation-plan.md` | Decision-complete implementation sequence for metering: vocabulary/types, additive DB schema, metering library, wrapper instrumentation, run-id propagation, rollups/budgets, and operator/owner surfaces. | planned |
| `index.html` | ★ Root workspace explorer (moved up from `wiki/index.html`): multi-filetype renderer for wiki/root/`mvp-build`, wiki-style left navigation rail, footer view selector for outline/symbols/backlinks/imports/local graph/materialization/logs/notes, conformance lens, pins, and founder/build log writer. Static seed manifest plus File System Access folder scan for future project growth. | complete |

### `wiki/` top level
| Path | Role | Status |
|---|---|---|
| `wiki/README.md` | ★ Index. Links every page, shows headline decision + GTM spine. Keep current when pages are added/finished. | complete |
| `wiki/00-decision.md` | ★ **THE OUTPUT** (brief §6). Beachhead, wedge, price, upsell, pitch, 3 redirects, list method, cadence, warm-path, 90-min timebox. | complete |
| `wiki/01-method.md` | How research was done; source rule applied; verified vs `[UNVERIFIED]`; the Reddit `reddit-search-capture` limitation; coverage gaps. | complete |
| `wiki/founder-52-week-operating-plan.md` | ★ Largest execution doc (~2.9k words). Weekly quotas, revenue targets, daily schedule, Friday review template, "what not to do." | complete |
| `wiki/product-ai-employee-context.md` | ★ AI Employee **product mechanics** the MVP build assumes: the template (agent-as-files), per-client factory pattern, two onboarding doors, `X-Twilio-Signature` security boundary, Estimate skill. Use `MVP/build-plan-current/` for current sequencing, `MVP/old-build-plan/` for original mechanics, and `mvp-build/` as the build home. | complete |
| `wiki/product-agent-platform-architecture.md` | ★ **The layer AMTECH owns over Hermes** — Plane 1 front-door onboarding orchestrator, Plane 2 SMS/webchat interaction wrapper, Plane 3 backend Manager control plane, plus real Gmail reply and Stripe invoice/payment event mesh. Build sequence. | complete |
| `wiki/ai-employee-mvp-build-plan-handoff.md` | ★ **Handoff for the agent team creating the full MVP build plan** — corrected guardrails, account/profile/runtime model, current source truth, target MVP paths, Manager tool surface, real Gmail/Stripe connector-event slices, workstreams, open decisions, acceptance criteria, and anti-patterns. | complete |
| `wiki/MVP/old-build-plan/` | ★ **Original whole-product MVP build packet** — 17 docs covering source rules, milestones, architecture, data model, Manager tools, onboarding, interaction wrapper, runtime, Gmail connector, real event mesh, security/ops, workstreams, tests, backlog, agentic-tooling research (`14`, incl. the efficiency synthesis), and the **interaction-reimagined "Work Surface" vision** (`15` — the Macintosh moment: rendering Hermes's developer event stream into a coworker a non-technical owner trusts; defines the Hermes→Work adapter for Phase 3). The MVP acceptance path remains signup → real employee → estimate PDF → approved Gmail send → real Gmail reply event → Stripe Connect test-mode deposit invoice/payment link → internal reminder, but current sequencing and production/admin/metering workstreams now live in `wiki/MVP/build-plan-current/`. | complete |
| `wiki/MVP/build-plan-current/` | ★ **Current reconciled AI Employee build plan** — the next-start packet that reconciles the original build-plan mechanics, current implementation records, event-driven office/Work Surface sequencing, source state in `mvp-build/`, and production admin + metering docs. The forward work — provider/runtime acceptance, event-bus completion, Channel/Session/Presence routing, admin system, metering, AMTECH billing, LLM provider registry, and 1000-user operations — is authored as a dependency-ordered **modular phase plan in `phases/`** (Phase 0 baseline + Phases 1-13 plus Phase 3A), replacing the retired Workstream A-H framing. Use this before `wiki/MVP/old-build-plan/` for next implementation planning; do not rewrite the original packet unless explicitly asked. | active |
| `wiki/MVP/build-plan-current/README.md` | Index and current bar for the reconciled build plan. Establishes that source is source-wired through Phase 6/7 but provider/runtime acceptance remains pending, and maps the current packet files. | active |
| `wiki/MVP/build-plan-current/00-source-of-truth.md` | Source hierarchy and rules for the reconciled plan: current packet wins on sequencing, implementation records/source win on actual state, original build-plan remains preserved as the original mechanics packet. | active |
| `wiki/MVP/build-plan-current/01-reconciled-scope-and-status.md` | Current scope/status matrix: original contractor office loop, source-wired areas, local proof, live-provider acceptance gaps, and newly in-scope operating layer. | active |
| `wiki/MVP/build-plan-current/02-current-system-architecture.md` | Reconciled architecture: owner surfaces, Manager, event bus, Work Surface, runtime, admin plane, metering plane, billing boundary, and identity separation. | active |
| `wiki/MVP/build-plan-current/03-provider-runtime-acceptance-plan.md` | Exact remaining live acceptance plan with required env vars and proof ids for Supabase/RLS, Twilio, Hermes/runtime, Gmail/PubSub, Stripe, reminders/scheduler, repair/event bus, and security checks. | active |
| `wiki/MVP/build-plan-current/04-admin-and-metering-plan.md` | Admin system and metering folded into the build plan: account space, operator admin panel, platform roles/support access, provider health, AMTECH billing, LLM provider registry, metering ledgers, and 1000-user operating model. | active |
| `wiki/MVP/build-plan-current/05-implementation-workstreams.md` | **RETIRED/superseded** — kept only as the Workstream A-H -> phase crosswalk. Forward sequencing now lives in `phases/`. | superseded |
| `wiki/MVP/build-plan-current/06-next-agent-handoff.md` | Copy-ready prompt for next planning/implementation agent, including read order, non-negotiables, baseline checks, acceptance vocabulary, and update requirements. | active |
| `wiki/MVP/build-plan-current/phases/` | ★ **The forward phase plan** — the next era of development authored as real, dependency-ordered modular phases: `README.md` (era overview + status vocabulary + dependency graph + phase index), `phase-00-baseline.md` (current source-wired starting line), and `phase-01`…`phase-13` plus **Phase 3A** (live provider/runtime acceptance; runtime/scheduler productionization; generic ingress & routing; **Channel/Session/Presence router**; live wake path & descriptors; triage/batching/live Work Surface stream; metering foundation/instrumentation/rollups; admin foundations & operations surfaces; AMTECH billing scaffold; LLM provider registry; 1000-user operations). One module per phase, each with its own acceptance gate in the source-wired/provider-accepted/runtime-accepted/planned/pending vocabulary. Phase 0 is source-wired; Phase 1 harness is source-wired with live gate pending; Phase 2 runtime/scheduler is source-wired with runtime gate pending; Phase 3/3A/4-core are source-wired (TDD-hardened) with live runtime/provider proof pending; **Phase 5 triage/batching/live Work Surface stream + MCP-UI generative UI is source-wired** (migration `0016` + `event_batches` RLS proven live; Hermes `/v1/runs/{id}/events` SSE proof pending); Phase 6 metering foundation is source-wired; Phases 7-13 are planned/pending. | active |
| `wiki/MVP/second-half-current-and-future-state.md` | ★ Current/future state companion for the new second-half plan: backend seams exist, owner web/SMS are not trial-grade, and the forward application should become a surface-agnostic materialization layer over Hermes across web, SMS, signed previews, admin, email/customer links, and optional desktop/Deno clients. | active |
| `wiki/MVP/old-build-plan/14-agentic-tooling-research-notes.md` | Current-docs research addendum for extending Hermes/MCP/Manager/provider tool surface. Clarifies that model/API compatibility is only an onboarding portability constraint; functional surface expansion belongs in Hermes capabilities, Manager/MCP tools/resources, artifacts, approvals, connected tools, and provider event mesh. | active |
| `wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md` | Interaction research addendum: AMTECH's "Macintosh moment" is rendering Hermes's developer event stream into a coworker a non-technical owner trusts. Defines SMS as ambient inbox, web as Work Surface, three move-types (notify/question/review), and the Phase 3 Hermes→Work adapter. | active |
| `wiki/MVP/phase-3-generative-ui-reframe.md` | Phase 3 implementation reframe: turn Gmail/provider/Hermes events into typed work events and deliverable-driven generative UI, with conformance tests, one-second approval/edit loops, and job-folder lifecycle thinking. Read before owner-surface Phase 3 work. | active |
| `wiki/MVP/event-driven-office-and-generative-ui.md` | ★ Forward design + product-state review reconciling docs 09/14/15 + the deliverable-driven principle with what is built. Works out the **message-to-agent event flow** (any system/webhook/cron → Manager verify/normalize/dedupe/triage → `deliver_only` vs wake-the-employee Hermes run → typed `WorkEventDescriptor` → surfaces → gate → act, recursively), states **how generative UI is implemented so far** (static + typed + gate-by-type, Manager-authored over a polled snapshot) and the frontier (agent-authored declarative descriptors, live Hermes→Work SSE adapter, interactive MCP-UI, triage/batching, per-owner trust calibration, Hermes Jobs, voice), and re-sequences the remaining build-plan features so an entire office can run through one employee. **Supersedes the *sequencing* (not the mechanics) of build-plan 15 §8 and principle §11.** | active |
| `wiki/MVP/agent-inbox-and-channel-architecture.md` | ★ The load-bearing interaction architecture: a **universal "message to the agent" inbox** (anything that must enter the brain — provider events, internal Job completions, clock, inbound channel messages, future sub-systems — through an **open source-adapter contract**; source is orthogonal to channel), a **live-session-first conductor + native subagents/Jobs + fallback serialized inbox** execution model, a **presence-aware Channel/Session/Presence router** (active session wins over standing notification preference; never double-deliver), and the **conversation-as-brain-artifact** single thread across SMS/web/voice. **Dedicated number per employee is LOCKED.** Reframes Phase 3 (universal ingress spine, not a connector list), Phase 3A (channel/session/presence router), and Phase 4 (the brain's reason-branch). Hermes substrate answer now locked: HTTP Runs/Sessions are turn-atomic, but current `delegate_task` supports background in-session subagents, so MVP should not overbuild out-of-session routing. | complete |
| `wiki/MVP/hermes-run-session-semantics-research.md` | Hermes substrate research note for the Manager/event architecture: current NousResearch docs show HTTP Runs/Sessions are turn-atomic; current `delegate_task` supports background in-session subagents whose results re-enter the conversation; Jobs/cron run fresh isolated sessions; profiles isolate Hermes state but not OS filesystem on `local`; Manager serialization is the fallback for non-session events and durable/isolated worker lanes. | in-progress |
| `wiki/MVP/build-plan-current/phases/phase-03a-channel-session-presence-layer.md` | Phase 3A module scope for the Channel/Session/Presence router: presence signals, active-session-wins routing, cross-channel dedupe, one acceptance primitive across SMS/web/voice, delivery-decision proof, native in-session subagent completion without duplicate SMS, and durable worker completion routing through the canonical inbox/session. Minimal router source-wired; live proof pending. | source-wired |
| `wiki/MVP/implementation-records/` | ★ **Current implementation ledger** — factual records beside, not inside, the original build plan. Records what is wired in `mvp-build/`, local verification results, provider-acceptance gaps, and what later phases must inherit. Current records cover the Phase 0-2 baseline, the Phase 3 partial Gmail implementation, the Phase 5 close-the-loop + Work Surface redesign, and the **Phase 6 repair hardening + Phase 7 event-bus groundwork** (current). | active |
| `wiki/MVP/implementation-records/README.md` | Index and usage rule for implementation records; read after CODEGRAPH and the original build plan when checking current code state. | active |
| `wiki/MVP/implementation-records/2026-06-29-phase-0-2-record.md` | Phase 0/1/2 implementation record: foundation, onboarding/account/provisioning, artifact/approval wiring, Gmail groundwork, local verification, pending provider proof, and next-phase inheritance. | active |
| `wiki/MVP/implementation-records/2026-06-29-phase-3-partial-record.md` | Phase 3 partial Gmail implementation record: source-level OAuth/token custody, connector test/watch, MIME send, Pub/Sub/history, reply normalization, employee-event delivery, local verification, and remaining live-provider/user-surface gaps. | active |
| `wiki/MVP/implementation-records/2026-06-29-phase-5-and-work-surface-record.md` | Phase 5 record: Phase 0–4 loose ends closed (Pub/Sub env reconciliation, stripe-webhook test, real RLS integration test, golden step3–5, `job_commitments.account_id` fix), Phase 5 close-the-loop (owner-confirmed `set_internal_reminder`, `dispatch_due_reminders` firing, `renew_expiring_watches`, `scheduler:tick` seam driven by Hermes cron), the descriptor-driven Work Surface redesign, and the provider-acceptance-pending table. Historical local result: 20 files / 99 unit tests. | active |
| `wiki/MVP/implementation-records/2026-06-30-phase-6-and-event-bus-record.md` | Phase 6 repair/security/runtime hardening and Phase 7 event-bus seams: repair queue/source suppressions/job-run proof migration, repair tools, safe audit redaction, stored `[SILENT]` daily briefs, binding work-card approvals, `deliver_only` vs `wake_employee`, generic event-source registry, triage/batching, structured Hermes event calls, and Work Surface SSE seam. Historical local result: 22 files / 110 unit tests; provider/runtime acceptance pending. | active |
| `wiki/MVP/implementation-records/2026-06-30-phase-01-acceptance-harness-record.md` | The next-era **Phase 1** provider/runtime acceptance *harness* — env preflight, 8 run-verifiers (assert doc-03 proof ids; run8 live forged-request probe), report writer, ops scripts (number-pool/healthcheck/repair), forged-request unit test + env-gated cross-account artifact denial, golden-path step6/step7. No new schema. Harness `source-wired`; live gate `pending` creds. | active |
| `wiki/MVP/implementation-records/2026-06-30-phase-02-runtime-scheduler-record.md` | ★ **Current** record: new-era **Phase 2** runtime/scheduler productionization — Docker-default backend, profile backend rendering, protected scheduler runner, `hermes_job_runs` proof writes, `runtime_health_checks`, Hermes Jobs runner, healthcheck persistence, Phase 1 `run6`/env hardening, and number-pool decision. Locally verified: typecheck/build/lint pass, **25 files / 124 unit tests**, integration skips clean, preflight/report behave honestly. Source `source-wired`; live runtime gate `pending` Docker/Hermes Jobs proof. | active |
| `mvp-build/CLAUDE.md`, `mvp-build/AGENTS.md` | ★ Build-home agent guide (mirrored) — read order, current phase status, layout, baseline checks, acceptance harness, Realness/security non-negotiables, the durable-memory protocol, and the local-git workflow. | active |
| `mvp-build/memory/` | ★ **In-repo durable memory** for agentic development — dated dev handoffs + the memory writing protocol (`MEMORY.md`): write/update mid-session after substantial/architectural work, after a full phase, and after architectural decisions. Dated handoffs named `YYYY-MM-DD-HHMM-title.md`; current: `2026-07-10-1153-phase-5-admin-ops-source-wired.md`. Complements `wiki/MVP/implementation-records/` (factual code-state). | active |
| `wiki/MVP/prompting-guide.md` | ★ GPT-5.5/Opus 4.8 prompting and Plan Mode protocol for AMTECH implementation agents: model routing, whole-product MVP non-negotiables, prompt patterns, pass/fail expectations, and common failure modes. | complete |
| `wiki/MVP/implementation-plan-prompt-handoff.md` | ★ Handoff + copy-ready meta-prompt for producing a Plan Mode prompt that asks an unaware agent to create a decision-complete implementation plan for Phase 0+1 while carrying the full MVP graph, pass/fail model, and wiki/codegraph update protocol. | complete |
| `wiki/MVP/phase-3-implementation-session-handoff.md` | Copy-ready handoff prompt for a new implementation session: tie Phase 0-2 loose ends, implement Phase 3 Gmail end to end, and lay Phase 4/5 wiring without faking provider acceptance. | active |
| `wiki/MVP/phase-3-planning-session-handoff.md` | Copy-ready prompt for planning Phase 3 implementation using the tooling research and Work Surface design docs. | active |
| `wiki/MVP/phase-3-finish-session-handoff.md` | Copy-ready prompt for finishing Phase 3 from the current partial Gmail implementation, including provider proof, Pub/Sub hardening, owner event delivery, and Work Surface rendering. | active |
| `wiki/MVP/phase-03a-04-live-session-event-spine-handoff.md` | ★ Current next-session orientation after the Hermes/subagent/channel decisions: live-session-first event spine, native background subagents as MVP leverage, Manager serialization as fallback, and how Phase 3 generic ingress, Phase 3A Channel/Session/Presence, and Phase 4 wake path relate to the contractor AI Employee MVP. | active |
| `wiki/MVP/phase-6-and-event-bus-session-handoff.md` | Prior event-bus implementation handoff: close Phase 5 loose ends (provider acceptance, Hermes Jobs scheduler, binding work-card approvals, `[SILENT]` daily-brief digest), implement Phase 6 pilot hardening (repair commands, runtime containment, security/no-secret-logs tests, runbook), and lay Phase 7 groundwork by closing the `event-driven-office-and-generative-ui.md` §3 gaps. Superseded for orientation by `phase-03a-04-live-session-event-spine-handoff.md`, but still useful for implementation detail. | active |
| `wiki/strategy-4-year-implications.md` | Year 1–4 arc: prove one vertical employee → profile library → channel → managed platform. Strategic risks. | complete |
| `wiki/warm-path.md` | Warm-intro inventory + referral/testimonial prompts + first-10-conversations list. The single fastest dollar. | complete |
| `wiki/entrepreneurship-playbook.md` | ★ Craft layer: Aulet 24 steps/6 themes for the beachhead, PG/Blank/Moore/Hormozi, the iterative-vs-lateral acquisition method, the $10M bridge. | complete |
| `wiki/principle-agent-leverage.md` | ★ Founding principle: maximize agent leverage (person-minimal); task→model-tier rubric (GLM-5.2 / mid / Opus 4.8·GPT-5.5 / founder-only); trust-gate guardrails. | complete |
| `wiki/principle-graph-materialization.md` | Founding principle: one brain/graph **materialized** for many surfaces, actors, and trust levels — why the surface catalog is cheap to build and the upsell is natural. Underpins `offers/estimator-whole-product.md`. | complete |
| `wiki/principle-deliverable-driven-surfaces.md` | ★ Founding principle (operational layer beneath graph-materialization): the **deliverable's type** is the selector that drives its preview, proof, and approval gate. A small **deliverable-type taxonomy** (~12 types) + the six-moment task lifecycle (intake/plan/progress/preview/accept/deliver) + the **HITL acceptance grammar** (approve·edit·reject·respond) + five variability axes (vertical/profile/task/owner/surface) + the **progressive-trust ladder** for repeatable tasks (the wedge→Employee upsell engine). One interaction grammar for hundreds of skills across every department/surface. Cites S090–S094; extends `MVP/old-build-plan/15`. | complete |

### `wiki/segments/` (brief §3, one market each)
| Path | Role | Cites | Status |
|---|---|---|---|
| `segments/contractors.md` | ★ **The beachhead** (paint/landscape). Estimate-led wedge; owner = sole DMU. | S029–S032 | complete |
| `segments/bookkeeping.md` | **Beachhead #2** (sequenced). Doc-dump + monthly-close pain; needs a doc-sorter skill built first. | S006–S010 | complete |
| `segments/marketing-agencies.md` | **Rejected** — the current "why agencies aren't our buyer" page (AI-native; won't buy the Employee). | S001–S004 | complete |
| `segments/property-management.md` | Parked. Maintenance triage + owner/tenant/vendor coordination. | S015–S020 | complete |
| `segments/insurance.md` | Parked (regulated). Admin trap; E&O/UPL/licensing slows trust. | S011–S014 | complete |
| `segments/freight-staffing.md` | High phone-reach, crowded/outbound-compliance risk. | S021–S024 | complete |
| `segments/real-estate.md` | Real pain but AI/lead-gen saturation + TCPA. Warm-only first. | S025–S028 | complete |

### `wiki/evidence/`
| Path | Role | Status |
|---|---|---|
| `evidence/sources.md` | ★ **Source ledger** S001–S074 (S068–S074 = entrepreneurship/craft sources). Every pain claim cites ≥1 ID or is `[UNVERIFIED]`. Columns: ID, segment, source type, URL, date, operator language, claim supported. | complete |
| `evidence/scoring.md` | ★ Current segment scorecard (contractor-first lens); contractors #1 (33). The detail behind `00-decision.md` §2. | complete |
| `evidence/aulet-beachhead-scoring.md` | Aulet-lens validation of the contractor beachhead + customer-access & validation plan. | complete |

### `wiki/competitors/`
| Path | Role | Status |
|---|---|---|
| `competitors/landscape.md` | Brief §5. Tiers (toy / DIY-build / single-function DFY / AI agencies / RAG chatbot / human substitutes), price anchors, AMTECH whitespace, MIT/RAND/NBER failure stats, "how to say the difference on a call." | complete |

### `wiki/offers/`
| Path | Role | Status |
|---|---|---|
| `offers/skill-catalog.md` | ★ ~24 sellable contractor skills across the job lifecycle + land-and-expand ACV ladder + agent-tier tags. The product surface area. | complete |
| `offers/wedge-offers.md` | ★ The consultative-first-work → tuned-package → live-Employee → managed-office-loop ladder, connector tiers, line-item/accuracy rule, payment mechanic (contractor beachhead). | complete |
| `offers/estimator-whole-product.md` | Aulet whole-product: every surface of the Estimate wedge (paste/GitHub/hosted skill, loaded SMS agent, conversational intake widget, voice-walk, Stripe deposit) + the self-escalating funnel. The customer-facing intake = the self-serve-funnel-adjacent page (creation requires account setup, not payment; monetization TBD). | complete |
| `offers/pitch-scripts.md` | ★ Contractor call library + the **3 panic redirects** (how it works / is this ChatGPT / price pushback), demo-to-close. | complete |

### `wiki/gtm/`
| Path | Role | Status |
|---|---|---|
| `gtm/agentic-article-research-system.md` | ★ Volume-first article research/writer skill spec: broad AI-agents-for-SMB graph, post-March-2026 research doctrine, query fan-out, evidence ledger, information-gain gate, esoteric SEO surface packs, OKF/images/Pinterest/social/tool materialization, and copy-ready website-repo implementation prompt. Business truth comes from this wiki, not the live AMTECH site. | active |
| `gtm/outbound-system.md` | ★ The multi-play, agent-run acquisition machine (Hormozi Core Four for contractors); agent-run pipeline, funnel math + benchmarks. | complete |
| `gtm/outreach-engine.md` | Contractor phone-first tactical detail under the system: daily targets, scripts, cadence, compliance. | complete |
| `gtm/channel-map.md` | Contractor channel × receptivity: phone list, local in-person, referrals, supply houses, job-post triggers; bookkeeper #2 table. | complete |

### `wiki/logs/`
| Path | Role | Status |
|---|---|---|
| `logs/README.md` | Schema for founder operating logs (week-NN.md, daily-, customer-, experiment-). **Agent rule: never overwrite a founder log; append or create dated file.** | active |

---

## 5. Edge graph

### 5a. Internal document links (`from → to`)
Hub = `README.md` (links all 22 other pages). Cross-links beyond the hub:

```
00-decision.md  → evidence/aulet-beachhead-scoring.md
00-decision.md  → product-ai-employee-context.md
00-decision.md  → strategy-4-year-implications.md
01-method.md    → 00-decision.md
01-method.md    → evidence/scoring.md
01-method.md    → evidence/sources.md
README.md       → (all of: 00-decision, 01-method, founder-52-week, product-ai-employee-context,
                   product-agent-platform-architecture, ai-employee-mvp-build-plan-handoff,
                   strategy-4-year, warm-path, logs/README, competitors/landscape,
                   evidence/{aulet,scoring,sources}, gtm/{channel-map,outreach-engine},
                   offers/{wedge-offers,pitch-scripts}, segments/{all 7})
```

**Observation for agents:** cross-linking is thin — most non-README pages do not link
laterally to their evidence or siblings. If asked to "increase interlinking" (a
`CLAUDE.md` goal: "full, interlinked research wiki"), the highest-value missing edges are:
`segments/*.md → evidence/sources.md` (cite-back), `segments/* → offers/wedge-offers.md`,
`offers/* → segments/*`, `competitors/landscape.md → 00-decision.md`,
`product-ai-employee-context.md ↔ strategy-4-year-implications.md`.

### 5b. Source-citation edges (`page → S-IDs`)
Which pages depend on which ledger entries (drives "if I edit source SNNN, what breaks").

```
00-decision.md ............... S001 S003 S004 S034
competitors/landscape.md ..... S033 S034 S035 S036 S037 S038
evidence/aulet-…scoring.md ... S001 S003 S004 S006 S008 S009 S010 S011 S012 S013 S014
                               S015 S018 S019 S020 S021 S023 S024 S025 S027 S029 S030
                               S031 S032 S034 S039–S050
evidence/scoring.md .......... S001 S003 S006 S008 S011 S014 S015 S018 S021 S024 S025 S028 S029 S032
founder-52-week-….md ......... S063 S064 S065 S066 S067
entrepreneurship-playbook.md . S063 S064 S068 S069 S070 S071 S072 S073
principle-agent-leverage.md .. S069
gtm/outbound-system.md ....... S072 S074
gtm/channel-map.md ........... S001 S003 S004 S006 S008 S009 S010
offers/wedge-offers.md ....... S004 S009 S010 S013 S014 S019 S020 S024 S028 S031 S032
offers/estimator-whole-product S052 S057 S060 S061 S062 S063 S068 S070 S075 S076 S077 S078 S079 S080 S082 S083
product-ai-employee-….md ..... S051 S053 S055 S057 S060 S062 S081 S082 S083 S084 S085
product-agent-platform-….md .. S081 S082 S083 S084 S085 S086 S087 S088 S089
principle-graph-materializ.… . S057 S058 S059 S060 S061 S062 S073
principle-deliverable-driven-surfaces  S090 S091 S092 S093 S094
strategy-4-year-….md ......... S051 S053 S054 S060 S062 S082
segments/marketing-agencies .. S001 S002 S003 S004
segments/bookkeeping ......... S006 S007 S008 S009 S010
segments/insurance ........... S011 S012 S013 S014
segments/property-management . S015 S016 S017 S018 S019 S020
segments/freight-staffing .... S021 S022 S023 S024
segments/real-estate ......... S025 S026 S027 S028
segments/contractors ......... S029 S030 S031 S032
```

**Citation coverage gaps (ledger entries defined but never cited downstream):**
`S005, S007, S016, S017, S022, S026, S056`. These are in the ledger but not referenced
by a conclusion page — candidates to either wire into a claim or prune.

### 5c. Source ledger taxonomy (S001–S089 by type)
- **reddit-search-capture** (primary operator voice, title/snippet only — full-page scrape was unavailable, see `01-method.md`): the bulk of segment pain evidence.
- **job-post / price-anchor**: substitute-cost anchors (coordinator/CSR/bookkeeper/PM salaries; competitor SaaS pricing). Used as anchors, **never as proof of pain**.
- **report** (S036 RAND, S037 NBER, S038 MIT/NANDA): AI-failure macro stats for the credibility-gap pitch.
- **website** (S051–S059): AMTECH's own product/skills surfaces (amtechai.com).
- **GitHub** (S060–S062): Hermes profile-template = upstream profile/skill authoring, not the per-client AI Employee factory.
- **essay/methodology** (S063–S067): Paul Graham, Disciplined Entrepreneurship, YC — operating doctrine behind the 52-week plan.
- **craft** (S068–S074): Aulet 24 steps/6 themes, PG schlep-blindness & get-ideas, Blank customer development, Hormozi Core Four, Moore bowling-pin, home-services benchmarks. Exempt from the operator-pain rule; power the playbook, outbound system, and agent-leverage pages.
- **customer-facing intake / whole-product** (S075–S080): claim/intake/payment-link and wrapper references used by `offers/estimator-whole-product.md`.
- **AI Employee prototype mechanics** (S081–S085): the now-**REMOVED** `AI_EMPLOYEE_MVP/` prototype (template, factory, onboarding doors, security boundary). Historical reference only — `wiki/MVP/` is the MVP source of truth, `mvp-build/` is the build home; do not treat these as live ground truth.
- **Hermes/connector capability docs** (S086–S089): current engine capability ground truth for profiles, API server, MCP, webhook adapter, and connector surfaces. Vendor capability evidence only; not demand evidence.
- **Agent-UX interaction design patterns** (S090–S094): generative UI (static/declarative/open-ended), MCP Apps/MCP-UI typed UI resources, LangGraph HITL decision vocabulary (approve/edit/reject/respond), progressive autonomy + trust-by-design. Design-pattern ground truth for the deliverable-driven-surfaces principle; not demand evidence (same exemption as S086–S089).

---

## 6. Machine-readable graph (for programmatic agents)

```json
{
  "generatedAt": "2026-06-29",
  "root": "/home/georgej/AMTECH/GTM-RESEARCH",
  "mvpSourceOfTruth": "wiki/MVP/ (build-plan-current/ current reconciled implementation plan; old-build-plan/ preserved 17-doc whole-product mechanics packet including agentic-tooling and Work Surface research; phase-3-generative-ui-reframe.md + implementation-records/ factual code-state ledger + prompting-guide.md + implementation-plan-prompt-handoff.md + phase-3 handoffs)",
  "mvpImplementationRecords": "wiki/MVP/implementation-records/ (records actual mvp-build implementation state; current sequencing belongs in build-plan-current/)",
  "mvpBuildCodegraph": "mvp-build/CODEGRAPH.md (MVP-specific source map for implementation agents: end-user flows to files, Hermes/Nous substrate boundary, Manager-owned product layer, working/source-wired features, UI-only fixture workflow, and pending provider/runtime acceptance)",
  "mvpBuildHome": "mvp-build/ (the only root folder beside wiki/; where the MVP is built against wiki/MVP/build-plan-current/ with wiki/MVP/old-build-plan/ preserved for original mechanics. Second-half Phase 1-5 are source-wired/static-green, with provider/runtime live acceptance pending: TS/Node npm-workspaces monorepo — apps/{web,manager}, packages/{shared,db,agent-template}, infra/, tests/; schema/security/tool seams plus real identity/provisioning/brain tools, LLM-only front door, SMS claim links, production-shaped provisioner, vertical-agnostic profile packages with contractor_estimator first, deterministic post-claim profile-package rendering/validation/runtime hooks (not prompt-to-repo authoring after claim), Manager-as-MCP identity injection/resources, artifacts/approvals, Gmail OAuth/token/send/watch/history/PubSub/event seams, typed work-event descriptors, Stripe Connect/deposit invoice tools, owner-confirmed reminders + dispatch_due_reminders/renew_expiring_watches, scheduler/runtime health, the Work Surface (daily brief/job folders/notify-question-review cards/per-deliverable renderers/iterative feedback), signed SMS previews/actions, capability graph, SurfaceEnvelope materialization, internal admin/ops console with audited support actions/readiness/billing scaffold, UI-only fixture browser flow, admin/metering docs, and passing typecheck/unit/build/lint/ui checks as last recorded)",
  "removedPrototype": "AI_EMPLOYEE_MVP/ (earlier in-repo AI Employee prototype: provision_client.py factory, template/, netlify onboarding doors; proved the mechanics and partly inspired wiki/MVP build-plan style; REMOVED from repo 2026-06-28; mechanics preserved in the wiki + ledger S081-S085; do not treat as ground truth)",
  "currentMvpBar": {
    "buildPacket": "wiki/MVP/build-plan-current/README.md",
    "promptingGuide": "wiki/MVP/prompting-guide.md",
    "promptHandoff": "wiki/MVP/implementation-plan-prompt-handoff.md",
    "requiredLoop": [
      "signup_or_claim_or_sms_onboarding",
      "live_employee_over_sms_and_web",
      "walkthrough_to_estimate_conversation",
      "pdf_estimate_signed_link",
      "approved_gmail_send",
      "real_gmail_reply_event",
      "approved_stripe_connect_test_mode_deposit_invoice",
      "stripe_webhook_trace",
      "internal_job_reminder"
    ],
    "defaults": {
      "stripeMode": "provider_test_mode_for_mvp",
      "emailProvider": "gmail_first",
      "calendar": "internal_reminder_required_google_calendar_fast_follow",
      "employeeCreationGate": "account_setup_not_payment"
    }
  },
  "promptingProtocol": {
    "defaultPlanningModel": "GPT-5.5",
    "heavyImplementationModel": "Claude Opus 4.8",
    "planningEffort": "high/deep reasoning",
    "implementationEffort": "high or xhigh for broad multi-file work",
    "requiredBehaviors": [
      "read identity.md and CODEGRAPH.md before planning",
      "read wiki/MVP/prompting-guide.md before writing implementation prompts or plans",
      "ground all plans in inspected files",
      "include pass/fail criteria for each capability",
      "preserve whole-product MVP provider-proof rules",
      "name wiki/codegraph update points",
      "do not ask for hidden chain-of-thought in final outputs"
    ]
  },
  "decision": {
    "beachhead": "paint-landscape-contractors",
    "beachhead2": "bookkeeping (sequenced; needs doc-sorter skill built first)",
    "rejectedBeachhead": "marketing-agencies",
    "wedge": "AMTECH Estimate skill (owned)",
    "ladder": {"rung0": "consultative first work (free, in surface)", "rung1": "tuned Estimate package $300 (paid discovery)", "rung2": "live AI Employee", "rung3": "managed office loop"},
    "customSkillPrice": 300,
    "employeePrice": {"setup": 750, "starterMonthly": 1000, "proMonthly": 1500},
    "operatingModel": "maximize agent leverage (person-minimal); founder reserved for Tier D (trust/taste/demo/money gate)",
    "modelFloor": ["GLM-5.2", "Opus 4.8", "GPT-5.5"],
    "acquisitionMethod": "iterative (deepen a play) vs lateral (switch plays); never switch segment",
    "reviewTimeboxMinutes": 90,
    "controllingDecisionPage": "wiki/00-decision.md",
    "revised": "2026-06-28"
  },
  "nodes": [
    {"id": "identity.md", "type": "identity", "status": "n/a", "readFirst": true},
    {"id": "CLAUDE.md", "type": "control", "status": "n/a"},
    {"id": "CODEGRAPH.md", "type": "map", "status": "n/a"},
    {"id": "mvp-build/", "type": "build-home", "status": "phase-6-7-source-wired-provider-runtime-acceptance-pending", "spec": "wiki/MVP/build-plan-current/", "originalSpec": "wiki/MVP/old-build-plan/"},
    {"id": "index.html", "type": "workspace-explorer", "status": "complete"},
    {"id": "wiki/README.md", "type": "index", "status": "complete"},
    {"id": "wiki/00-decision.md", "type": "output", "status": "complete"},
    {"id": "wiki/01-method.md", "type": "method", "status": "complete"},
    {"id": "wiki/founder-52-week-operating-plan.md", "type": "execution", "status": "complete"},
    {"id": "wiki/product-ai-employee-context.md", "type": "product", "status": "complete"},
    {"id": "wiki/product-agent-platform-architecture.md", "type": "product", "status": "complete"},
    {"id": "wiki/ai-employee-mvp-build-plan-handoff.md", "type": "product", "status": "complete"},
    {"id": "wiki/MVP/old-build-plan/README.md", "type": "mvp-build-plan", "status": "complete"},
    {"id": "wiki/MVP/old-build-plan/14-agentic-tooling-research-notes.md", "type": "mvp-research-addendum", "status": "active"},
    {"id": "wiki/MVP/old-build-plan/15-interaction-reimagined-the-work-surface.md", "type": "mvp-research-addendum", "status": "active"},
    {"id": "wiki/MVP/phase-3-generative-ui-reframe.md", "type": "mvp-implementation-reframe", "status": "active"},
    {"id": "wiki/MVP/event-driven-office-and-generative-ui.md", "type": "mvp-forward-design", "status": "active"},
    {"id": "wiki/MVP/agent-inbox-and-channel-architecture.md", "type": "mvp-architecture", "status": "complete"},
    {"id": "wiki/MVP/hermes-run-session-semantics-research.md", "type": "mvp-research-note", "status": "in-progress"},
    {"id": "wiki/MVP/build-plan-current/phases/phase-03a-channel-session-presence-layer.md", "type": "mvp-phase", "status": "source-wired"},
    {"id": "wiki/MVP/implementation-records/README.md", "type": "mvp-implementation-records", "status": "active"},
    {"id": "wiki/MVP/implementation-records/2026-06-29-phase-0-2-record.md", "type": "mvp-implementation-record", "status": "active"},
    {"id": "wiki/MVP/implementation-records/2026-06-29-phase-3-partial-record.md", "type": "mvp-implementation-record", "status": "active"},
    {"id": "wiki/MVP/implementation-records/2026-06-29-phase-5-and-work-surface-record.md", "type": "mvp-implementation-record", "status": "active"},
    {"id": "wiki/MVP/prompting-guide.md", "type": "prompting-protocol", "status": "complete"},
    {"id": "wiki/MVP/implementation-plan-prompt-handoff.md", "type": "handoff", "status": "complete"},
    {"id": "wiki/MVP/phase-3-implementation-session-handoff.md", "type": "handoff", "status": "active"},
    {"id": "wiki/MVP/phase-3-planning-session-handoff.md", "type": "handoff", "status": "active"},
    {"id": "wiki/MVP/phase-3-finish-session-handoff.md", "type": "handoff", "status": "active"},
    {"id": "wiki/MVP/phase-03a-04-live-session-event-spine-handoff.md", "type": "handoff", "status": "active"},
    {"id": "wiki/MVP/phase-6-and-event-bus-session-handoff.md", "type": "handoff", "status": "active"},
    {"id": "wiki/strategy-4-year-implications.md", "type": "product", "status": "complete"},
    {"id": "wiki/warm-path.md", "type": "execution", "status": "complete"},
    {"id": "wiki/segments/contractors.md", "type": "segment", "status": "complete", "role": "beachhead"},
    {"id": "wiki/segments/bookkeeping.md", "type": "segment", "status": "complete", "role": "beachhead2"},
    {"id": "wiki/segments/marketing-agencies.md", "type": "segment", "status": "complete", "role": "rejected"},
    {"id": "wiki/segments/property-management.md", "type": "segment", "status": "complete", "role": "parked"},
    {"id": "wiki/segments/insurance.md", "type": "segment", "status": "complete", "role": "parked"},
    {"id": "wiki/segments/freight-staffing.md", "type": "segment", "status": "complete", "role": "parked"},
    {"id": "wiki/segments/real-estate.md", "type": "segment", "status": "complete", "role": "parked"},
    {"id": "wiki/evidence/sources.md", "type": "ledger", "status": "complete", "ids": "S001-S094"},
    {"id": "wiki/evidence/scoring.md", "type": "scoring", "status": "complete"},
    {"id": "wiki/evidence/aulet-beachhead-scoring.md", "type": "scoring", "status": "complete"},
    {"id": "wiki/competitors/landscape.md", "type": "competition", "status": "complete"},
    {"id": "wiki/entrepreneurship-playbook.md", "type": "craft", "status": "complete"},
    {"id": "wiki/principle-agent-leverage.md", "type": "principle", "status": "complete"},
    {"id": "wiki/principle-graph-materialization.md", "type": "principle", "status": "complete"},
    {"id": "wiki/principle-deliverable-driven-surfaces.md", "type": "principle", "status": "complete"},
    {"id": "wiki/offers/skill-catalog.md", "type": "offer", "status": "complete"},
    {"id": "wiki/offers/wedge-offers.md", "type": "offer", "status": "complete"},
    {"id": "wiki/offers/estimator-whole-product.md", "type": "offer", "status": "complete"},
    {"id": "wiki/offers/pitch-scripts.md", "type": "offer", "status": "complete"},
    {"id": "wiki/gtm/agentic-article-research-system.md", "type": "gtm", "status": "active"},
    {"id": "wiki/gtm/outbound-system.md", "type": "gtm", "status": "complete"},
    {"id": "wiki/gtm/channel-map.md", "type": "gtm", "status": "complete"},
    {"id": "wiki/gtm/outreach-engine.md", "type": "gtm", "status": "complete"},
    {"id": "wiki/logs/README.md", "type": "logs", "status": "active"}
  ],
  "linkEdges": [
    {"from": "wiki/00-decision.md", "to": "wiki/evidence/aulet-beachhead-scoring.md"},
    {"from": "wiki/00-decision.md", "to": "wiki/product-ai-employee-context.md"},
    {"from": "wiki/00-decision.md", "to": "wiki/strategy-4-year-implications.md"},
    {"from": "wiki/01-method.md", "to": "wiki/00-decision.md"},
    {"from": "wiki/01-method.md", "to": "wiki/evidence/scoring.md"},
    {"from": "wiki/01-method.md", "to": "wiki/evidence/sources.md"},
    {"from": "wiki/README.md", "to": "ALL_OTHER_WIKI_PAGES"}
  ],
  "citationEdges": {
    "wiki/00-decision.md": ["S001","S003","S004","S034"],
    "wiki/competitors/landscape.md": ["S033","S034","S035","S036","S037","S038"],
    "wiki/evidence/scoring.md": ["S001","S003","S006","S008","S011","S014","S015","S018","S021","S024","S025","S028","S029","S032"],
    "wiki/founder-52-week-operating-plan.md": ["S063","S064","S065","S066","S067"],
    "wiki/gtm/channel-map.md": ["S001","S003","S004","S006","S008","S009","S010"],
    "wiki/entrepreneurship-playbook.md": ["S063","S064","S068","S069","S070","S071","S072","S073"],
    "wiki/principle-agent-leverage.md": ["S069"],
    "wiki/gtm/outbound-system.md": ["S072","S074"],
    "wiki/offers/wedge-offers.md": ["S004","S009","S010","S013","S014","S019","S020","S024","S028","S031","S032"],
    "wiki/offers/estimator-whole-product.md": ["S052","S057","S060","S061","S062","S063","S068","S070","S075","S076","S077","S078","S079","S080","S082","S083"],
    "wiki/product-ai-employee-context.md": ["S051","S053","S055","S057","S060","S062","S081","S082","S083","S084","S085"],
    "wiki/product-agent-platform-architecture.md": ["S081","S082","S083","S084","S085","S086","S087","S088","S089"],
    "wiki/principle-graph-materialization.md": ["S057","S058","S059","S060","S061","S062","S073"],
    "wiki/principle-deliverable-driven-surfaces.md": ["S090","S091","S092","S093","S094"],
    "wiki/strategy-4-year-implications.md": ["S051","S053","S054","S060","S062","S082"],
    "wiki/segments/marketing-agencies.md": ["S001","S002","S003","S004"],
    "wiki/segments/bookkeeping.md": ["S006","S007","S008","S009","S010"],
    "wiki/segments/insurance.md": ["S011","S012","S013","S014"],
    "wiki/segments/property-management.md": ["S015","S016","S017","S018","S019","S020"],
    "wiki/segments/freight-staffing.md": ["S021","S022","S023","S024"],
    "wiki/segments/real-estate.md": ["S025","S026","S027","S028"],
    "wiki/segments/contractors.md": ["S029","S030","S031","S032"]
  },
  "uncitedLedgerIds": ["S005","S007","S016","S017","S022","S026","S056"]
}
```

---

## 7. Invariants (consistency rules — break these and the wiki rots)

1. **Every pain claim cites a ledger ID or is labeled `[UNVERIFIED]`.** No bare assertions. (`CLAUDE.md` source rule.)
2. **Vendor/marketing pages are price anchors or competitor evidence only — never proof of demand.** "Book a demo / free trial" CTA = ad = poison. Demote it.
3. **Canonical facts (§3) must agree across pages.** If you change the wedge price, the beachhead, or the upsell, update *every* page in §3's "Primary page" column AND the duplicates: price/offer appears in `00-decision.md`, `offers/wedge-offers.md`, `offers/pitch-scripts.md`, `founder-52-week-operating-plan.md`, `warm-path.md`, `gtm/outreach-engine.md`.
4. **`README.md` is the single entry point.** Adding/finishing/removing a page = update `README.md` the same turn.
5. **Root `index.html` is the workspace explorer.** Its `SEED_PATHS` manifest is root-relative and intentionally spans root docs, wiki pages, and selected `mvp-build/` source files. Add an important page/source file → add a `SEED_PATHS` row. For exhaustive or changing trees, use the explorer's folder picker from the repo root; it scans supported text/code filetypes while skipping generated/heavy folders.
6. **Each wiki page starts with `Status: draft | in-progress | complete`** on line ~3. Keep it truthful.
7. **Never overwrite a founder log** in `wiki/logs/` — append or create a new dated file (`logs/README.md` agent rule).
8. **File naming:** lowercase-hyphenated, relative links between wiki pages, markdown only (the explorer is the one HTML exception).
9. **Scoring pages reflect the current decision** (contractors #1). `evidence/scoring.md` is the canonical scorecard; `evidence/aulet-beachhead-scoring.md` is the Aulet-lens validation. If you re-score, edit both and reconcile `00-decision.md` §2 and §3 here.
10. **Living brain — no superseded/retained content.** Every page reflects the *current* decision. When the plan changes, **rewrite** the affected pages to the new reality (or delete them) — never leave "we used to think X" archaeology, banners, or retired rankings behind. The wiki is an operating brain, not a research archive.
11. **Embody `identity.md` every session, before acting.** It is the required operating self-image, voice (Ogilvy), founder mindset (Paul Graham), psycho-cybernetics frame, and AMTECH spirit. Not optional flavor — behavior follows self-image. Enforced at the top of `CLAUDE.md` and §1 here.

---

## 8. Extension playbook (asked to do X → touch these files)

| Request | Edit | Then propagate to |
|---|---|---|
| Add a new ledger source | `evidence/sources.md` (next ID S075…) | the segment/offer page that uses it (cite it), §5b/§6 of this file |
| Change wedge price or offer | `offers/wedge-offers.md` | `00-decision.md`, `offers/pitch-scripts.md`, `founder-52-week-…`, `warm-path.md`, `gtm/outreach-engine.md`, §3 here |
| Re-score / change beachhead | `evidence/scoring.md` + `evidence/aulet-beachhead-scoring.md` | `00-decision.md`, `README.md` headline, every downstream offer/gtm page, §3 here |
| Add a new segment page | `segments/<name>.md` (answer brief §3) | `README.md`, `evidence/scoring.md`, root `index.html` `SEED_PATHS`, this file §4/§5/§6 |
| Add a new MVP architecture/phase page | `wiki/MVP/...` or `wiki/MVP/build-plan-current/phases/...` | `wiki/README.md`, `CODEGRAPH.md` §4/§6, root `index.html` `SEED_PATHS`, and the relevant phase index/dependency graph |
| Strengthen a segment's evidence | the `segments/*.md` page + `evidence/sources.md` | re-check §5b citation map |
| Add a competitor | `competitors/landscape.md` | `00-decision.md` redirects if positioning shifts |
| Add execution/outreach detail | `gtm/*` or `founder-52-week-…` | keep prices/quotas consistent with §3 |
| Log founder activity | new file in `wiki/logs/` (never overwrite) | — |
| Improve interlinking | add lateral links per §5a "missing edges" | re-run link extraction, update §5a/§6 |
| Refresh this map | regenerate per §9 | — |

---

## 9. Maintenance — regenerate this file when the corpus changes

This map is derived. To rebuild the edge data after edits, from repo root:

```bash
# internal .md link edges (from -> to)
for f in $(find . -name '*.md' | sort); do
  grep -oE '\]\([^)]*\.md[^)]*\)' "$f" \
    | sed -E 's/\]\(([^)#]*\.md)[^)]*\)/\1/' \
    | while read t; do echo "${f#./} -> $t"; done
done | sort -u

# source-citation edges (page -> S-IDs)
for f in $(find wiki -name '*.md' | sort); do
  refs=$(grep -oE 'S0[0-9]{2}' "$f" | sort -u | tr '\n' ' ')
  [ -n "$refs" ] && echo "${f}: ${refs}"
done

# uncited ledger ids = (defined in sources.md) minus (cited anywhere else)
```

Known structural facts at last update: 62 markdown wiki pages, 1 HTML explorer, 2 root
docs (+ this file). Wiki status: **complete**. Largest pages: `founder-52-week-operating-plan.md`,
`evidence/sources.md`, `evidence/aulet-beachhead-scoring.md`. If those numbers no longer
match the tree, this file is stale — regenerate it.
