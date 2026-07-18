# CODEGRAPH.md — AMTECH workspace map

Status: active
Updated: 2026-07-18
Active integration branch: `employee-production-tuesday`, based on `research`; draft PR `#23` targets `research`; `main` is untouched

## Read first

1. `identity.md`
2. `AGENTS.md`
3. this file
4. the nearest scoped `identity.md`, `AGENTS.md`, `CLAUDE.md`, and `CODEGRAPH.md`
5. newest relevant memory/handoff
6. source, migrations, scripts, proofs, tests, and current plan/wiki documents

When documentation conflicts, verified source + migrations + scripts + proof artifacts + newest scoped memory win.

## What this repository is

This repository is the AMTECH company brain and implementation home for the flagship AI Employee and its public experience infrastructure.

- `mvp-build/`: product code, runtime, provisioning, owner surfaces, connectors, security, tests, runbooks, and active forward plans.
- `wiki/`: durable product, market, architecture, research, and implementation records.
- `docs/`: root product, design, website, and interaction strategy.
- `GTM-RESEARCH/website-framework/`: hyper-targeted publishing compiler, first-class hyper-vector space, corpus optimizer, agent generation harness, semantic UI contract, edge resolver research, and field-distribution validation.

## Canonical product truth

AMTECH installs always-on intelligent software workers for owner-operated American small businesses. The first beachhead is painting, landscaping, and adjacent service contractors, with professional offices and software/technical operators as extensible use cases.

The employee notices work, remembers business facts, prepares deliverables and communication, follows up, organizes proof, and asks before actions that touch customers, money, reputation, or destructive system boundaries. The owner texts or talks to one employee. Manager remains invisible infrastructure.

AMTECH is not primarily an estimator, chatbot, CRM, automation builder, model marketplace, or collection of AI tools.

## Canonical offer

- **Start free:** one useful employee with bounded usage and no enterprise rollout.
- **Managed AI Employee:** from **$400/month** for managed connections, recovery, scheduled/event-driven work, higher capacity, and support.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

Older $750 setup + $1,000/$1,500 monthly ladder language is superseded where it conflicts with this strategy.

## Canonical normal-employee path

```text
public DNS / Cloudflare Tunnel
-> Caddy
-> production Web + Manager
-> real /create-ai-employee
-> Twilio Verify
-> account creation
-> Start Employee
-> isolated employee runtime
-> owner web client
-> provider-backed reply
-> useful connected-tool proof
```

Authority: `mvp-build/docs/production-normal-employee-live-deploy-runbook.md`.

The public estimator is outdated and non-canonical. It may remain as an acquisition/regression harness, but it is not product UX, pricing, profile, or launch acceptance. Fixture mode, dev login, local `live:*`, and manually injected provider results are not launch proof.

## Current product implementation state

**Overall: standard remediation is in progress; source and CI evidence exist, but the product is not live-accepted or launch-cleared.**

- The approved Phase 2 plan and 29-finding machine registry passed plan-integrity CI on run `29638985374`.
- Lane 1 checkpoint is integrated at `b37d479a70983fcb3e88942b1f36481a07a97d17`: C1/C2 contracts, relationship graph migrations `0039`/`0040`, deterministic compatibility backfill, authorization helpers, and the five-case PostgreSQL relationship/RLS matrix are green.
- Lane 1 is not fully closed: assignment scoping across all routes/resources, real Supabase acceptance, browser/SMS isolation, and the helper privilege-model review remain pending.
- The integrated branch passed plan-integrity run `29639654226` and the existing production-boundary run `29639654276`, including migrations, shared/database/Manager builds, focused tests, and the production Manager image.
- Lane 3 draft PR `#26` has a green C3 shared contract and a PostgreSQL pre-implementation red boundary on run `29639915565`. No command/effect migration has been implemented. One concurrency assertion must be made scheduler-order-independent before the red harness is final.
- Owner product, Model Gateway, reconciler, ambient inbox, runtime boundary, and live-proof harness remain at their previously documented source/CI tiers; no new live provider/runtime/browser/commercial acceptance is claimed.
- Production Supabase still stops at `0031_public_estimator.sql`.

Detailed authority: `mvp-build/CODEGRAPH.md`, `mvp-build/memory/MEMORY.md`, and `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`.

## Website-framework state

Primary category: **agent-first hyper-targeted search-distribution compiler and vector information server**.

Current reality:

- Phase 1 specifications exist.
- A TypeScript research package implements HRR/VSA controls, corpus optimizers, semantic IR, packed vectors/CSR graph, deterministic neutral emissions, synthetic scale fixtures, and runtime scaffolds.
- `GTM-RESEARCH/website-framework/site-manifest.yaml` is now the single declarative corpus authority.
- `reference/src/manifest.ts` compiles feature atoms and prototype sets before page emissions, derives vector neighbors/links, and feeds `SiteSource -> PageIR`.
- The old five-slice Request Mirror is a noindex profile inside the same compiler, not a separate framework.
- The hyper-aware agent harness and UI-scaffold plan are source-wired.

Not accepted:

- production UI renderer or functioning public website framework;
- deployed/indexed 200–2,000-page corpus;
- search ranking/citation or conversion/revenue lift;
- Zig/Wasm or Cloudflare runtime performance;
- browser, accessibility, Core Web Vitals, or load acceptance.

The prior 2,000-page result is a synthetic compiler benchmark, not a deployed SEO corpus.

Framework authority:

- `GTM-RESEARCH/website-framework/identity.md`
- `GTM-RESEARCH/website-framework/AGENTS.md`
- `GTM-RESEARCH/website-framework/CODEGRAPH.md`
- `GTM-RESEARCH/website-framework/README.md`
- `GTM-RESEARCH/website-framework/16-unified-hypervector-manifest-agent-harness.md`
- `GTM-RESEARCH/website-framework/site-manifest.yaml`
- newest scoped research and memory notes

## Source-of-truth map

| Question | Authority |
|---|---|
| What are we building? | `identity.md`, this file, `docs/amtech-website-rewrite-brief.md` |
| How should agents operate? | root `AGENTS.md` plus nearest scoped instructions |
| What is actually wired? | `mvp-build/CODEGRAPH.md`, source, migrations, implementation records |
| What is the current handoff? | `mvp-build/memory/MEMORY.md` and newest relevant memory |
| How is a normal employee launched? | `mvp-build/docs/production-normal-employee-live-deploy-runbook.md` |
| What are the security/runtime boundaries? | `mvp-build/docs/security/host-private-runtime-hardening-plan.md` |
| What is the GTM/pricing strategy? | `mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md` |
| What remains now-to-live? | `mvp-build/CODEGRAPH.md`, runbook, wiki current/future state |
| What is the public website product/copy brief? | `docs/amtech-website-rewrite-brief.md` |
| What is the visual system? | `docs/AMTECH_WEB_DESIGN_SYSTEM.md` |
| How do agentic/generative web interfaces work? | `docs/AMTECH_AGENTIC_GENERATIVE_WEB_DESIGN_ADDENDUM.md` |
| What controls the website corpus and vector space? | `GTM-RESEARCH/website-framework/site-manifest.yaml`, scoped CODEGRAPH, file `16` |
| What feeds the first UI pass? | `reference/src/ui-scaffold.ts`, `reference/UI-DESIGN-SYSTEM-HANDOFF.md` |
| How do agents propose pages? | `reference/src/agent-harness.ts`, `reference/src/manifest.ts` |
| How is search/commercial evidence measured? | `reference/src/distribution.ts`, files `15` and `16` |

## Non-negotiable invariants

1. Read the applicable identities and instructions before acting.
2. Do not claim provider/runtime acceptance without real proof IDs/artifacts.
3. The owner experiences one employee; Manager remains invisible.
4. Provider master credentials never enter employee profiles/runtimes.
5. Customer-, money-, reputation-, and destructive-action gates require owner approval.
6. The public estimator is non-canonical.
7. `mvp-build/second-half-plan/` is the active product forward-plan family; older plans are historical unless explicitly revived.
8. Every major session updates durable memory and keeps current docs contradiction-free.
9. Public copy leads with owner pain, work, proof, control, and value—not generic AI or architecture.
10. Website materialization is research until explicit correctness, relevance, compiler, performance, SEO, privacy, security, accessibility, experiment, autonomy, and truth gates pass.
11. The website framework must not become a named customer dossier, covert fingerprint, identity graph, or sensitive/financial/household/lifestyle inference engine.
12. Canonical pages remain complete without resolver, JavaScript, consent, vectors, databases, or experiments.
13. HRR/VSA is classical computation. Quantum language must remain technically bounded.
14. Generated content and design are typed, deterministic, versioned, reversible, and evidence-bounded.
15. Feature atoms and prototype geometry precede page emissions; HTML is never canonical source truth.
16. Agent-generated pages enter noindex research state and cannot bypass the unified manifest or publication gate.

## Next major frontiers

### Product

Correct and recapture Lane 3's scheduler-order-independent red harness, then implement the reusable command/effect kernel without weakening the tests. In parallel, continue assignment scoping and real-Supabase isolation work required for complete Lane 1 closure.

### Public experience

```text
unified manifest + passing CI
-> ingest supplied design system
-> derive and implement semantic renderer superset
-> browser/accessibility/metadata/JS-disabled validation
-> generate first hyper-aware agent page proposals
-> review 20–40 field candidates
-> publish matched cohorts only after explicit gate
-> measure indexing, compatible discovery, qualified pipeline, gross profit, and lifecycle return
```

## Validation state

Product remediation control and the Lane 1 checkpoint are CI-accepted at the exact runs listed above. Lane 3 is contract-accepted and intentionally pre-implementation; its final red harness correction remains pending. Production Supabase, real providers, employee runtimes, browsers/channels, commercial reconciliation, and market validation remain unaccepted unless a later release-bound proof packet explicitly records them.