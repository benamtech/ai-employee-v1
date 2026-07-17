# CODEGRAPH.md — AMTECH workspace map

Status: active
Updated: 2026-07-17
Active integration branch: `research`, based on current `main`

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
- `GTM-RESEARCH/website-framework/`: adaptive experience compiler, edge resolver, content/design graph, A/Z suite, Request Mirror Lab, and landing-page generation research/specification.

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

**Overall: source-wired, not live-accepted after the WS1/WS2 production-boundary pass.**

- Owner product: Home / Talk / Proof / Connected, persisted conversation, approvals, signed review resources, owner-safe materialization, and connected-capability surfaces are source-wired.
- WS1: model-gateway credential custody and rendered-profile integrity are source-wired.
- WS2: durable provisioning resource graph, transitions, leases, commands, retry/drift/rotation/compensation foundations are source-wired; the true reconciler worker remains pending.
- WS3: `ambient_event_inbox` schema exists; provider ingress migration is not complete.
- Production runtime boundary: host-private provisioner and per-employee isolation exist in source, but hostile/runtime proof is pending.
- Live provider/runtime acceptance requires fresh production credentials, real provider IDs, runtime proof artifacts, and a normal-employee run through the canonical path.

Detailed authority: `mvp-build/CODEGRAPH.md`.

## Website-framework state

Primary category: **adaptive experience compiler and edge decisioning runtime**; commercial shorthand: **Experience Materialization Platform**.

The framework compiles approved knowledge, offers, proof, design grammar, routes, and experiment policy into:

- complete canonical websites;
- finite context-resolved landing experiences;
- structured data and agent resources;
- multi-channel campaign artifacts;
- agentic/generative UI components;
- explainable A/Z experiments.

Phase 1 research/specification is complete. Phase 2 code is pending. No Cloudflare, Next.js, Zig/WASM, browser, SEO, conversion, autonomy, or production acceptance is claimed.

Framework authority:

- `GTM-RESEARCH/website-framework/identity.md`
- `GTM-RESEARCH/website-framework/AGENTS.md`
- `GTM-RESEARCH/website-framework/CODEGRAPH.md`
- `GTM-RESEARCH/website-framework/README.md`
- numbered framework specifications

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
| What is the website software category and architecture? | `GTM-RESEARCH/website-framework/CODEGRAPH.md`, `10-software-category-and-commercial-use-cases.md` |
| How are content/design distributed? | `11-hyper-distributed-content-generative-ui-and-design-collaboration.md` |
| What are the additional compiler/autonomy gates? | `12-compiler-design-and-autonomy-validation-addendum.md` |
| What is v0.1? | `07-v0.1-request-mirror-lab.md` |
| How does a new session create landing pages? | `HANDOFF-LANDING-PAGES.md` |

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

## Next major frontiers

### Product

Close the normal-employee P0 now-to-live checklist and produce real provider/runtime proof through the canonical path.

### Public experience

Begin Phase 2 of the website framework:

```text
generate and validate the 100-slice synthetic fixture
-> implement TypeScript HRR/compiler reference
-> compile at least two real AMTECH landing-page families
-> benchmark rules/facets/HRR and flat/cluster retrieval
-> implement the noindex Worker Request Mirror baseline
-> add shadow-only diagnostics
-> consider Zig/WASM after evidence
```

The AMTECH website category remains:

> Your business gets an employee that lives in the software.

## Validation state

The branch was rebased through GitHub PR #14 and the coordinated work is in PR #15. Documentation and research specifications were updated through GitHub. Environment-dependent product/runtime and website implementation validation remains pending unless explicitly recorded by a later commit and proof artifact.
