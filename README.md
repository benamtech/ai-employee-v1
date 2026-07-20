# AMTECH AI Employee v1

AMTECH builds persistent AI Employees for owner-operated businesses. Owners experience accountable labor through governed Web, SMS, signed Review, and connected-system events. Manager is the invisible control plane; Hermes is the managed reasoning/runtime substrate.

This repository contains the AI Employee product implementation and its company/product brain. The Hyper Site framework is independent and lives in `benamtech/hyper-site`; it is not part of this repository.

## Start here

Read in this order:

1. [`identity.md`](identity.md)
2. [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md)
3. root [`CODEGRAPH.md`](CODEGRAPH.md)
4. [`mvp-build/AGENTS.md`](mvp-build/AGENTS.md) or [`mvp-build/CLAUDE.md`](mvp-build/CLAUDE.md)
5. [`mvp-build/CODEGRAPH.md`](mvp-build/CODEGRAPH.md)
6. ratified [`mvp-build/STANDARD.md`](mvp-build/STANDARD.md)
7. canonical [`mvp-build/second-half-plan/README.md`](mvp-build/second-half-plan/README.md) and its active program
8. [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md), then the newest relevant handoff
9. [`mvp-build/docs/architecture/README.md`](mvp-build/docs/architecture/README.md)
10. relevant source, migrations, scripts, tests, workflows, proof, release records, and current diff

Current source, applied migrations, executable proof, and exact-head workflow evidence outrank prose. Historical plans and wiki records remain useful context but do not define current execution order.

## Canonical product and offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month**.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is an outdated acquisition/regression surface. It is not canonical product UX, pricing, profile design, or launch proof.

## Product moat

AMTECH's defensibility is the reusable labor protocol joining:

- stable employee identity and explicit assignments;
- role- and relationship-scoped authority;
- transport-neutral capability and connector manifests;
- internal Manager MCP, explicitly safe direct MCP, and runtime-native capabilities;
- AMTECH-managed OAuth, provider-hosted onboarding, managed secrets/service accounts, and operator installation;
- typed work objects, generated views, approvals, effects, receipts, repair, and commercial attribution;
- bounded adapters for MCP Apps, AG-UI, Web, SMS, signed Review, and future channels.

Gmail, QuickBooks, and Stripe are shipped provider adapters. They are not the connector ontology. Unknown or underspecified connectors remain discoverable but fail closed for setup and direct execution.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current relationship, grant, policy, entitlement, and authority version
→ stable durable intent, command, event, or work object
→ Hermes reasoning or deterministic work
→ bounded capability selection and runtime validation
→ approval when required
→ one reserved idempotent external effect
→ accepted, failed, or ambiguous durable receipt
→ deterministic replay, reconciliation, or repair
→ role-safe Web, SMS, signed-Review, connected-system, MCP Apps, or AG-UI projection
→ audit, metering, commercial attribution, revocation, recovery, and release proof
```

Current governed launch surfaces are Web, SMS, signed Review, and connected-system events. Voice and full external protocol conformance are future extensions unless the active program closes their named gates.

## Current integration state

- Branch: `employee-production-tuesday`
- Base: `research`
- Draft PR: `#23`
- Migration head: `0072`
- Standard: ratified AMTECH Standard v0.2
- Active production program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`
- `main` is not the integration or production shortcut
- Canonical production Compose selection is source-wired through `mvp-build/infra/scripts/production-topology.mjs`
- Local/CI production-shaped PostgreSQL is the database TDD inner loop; disposable Supabase is a platform-specific and release-candidate evidence boundary
- Exact current implementation/proof head and workflow IDs belong in PR `#23` and the newest indexed memory handoff after branch movement stops

Real target-host runtime/network, live connector/provider, fixture-free browser/SMS/Review, commercial reconciliation, cumulative budget/shared-rate enforcement, fleet capacity/fairness, crash/repair, rollback, deployment attestation, and launch acceptance remain separate gates unless exact evidence closes them.

Production-ready means every non-waivable gate in `mvp-build/STANDARD.md` passes on the exact deployed SHA. Source wiring, fixtures, local PostgreSQL, old runs, trajectory scores, and documentation-only commits cannot satisfy a live boundary.

## Repository layout

```text
.
├── identity.md                  AMTECH operating identity
├── AGENTS.md / CLAUDE.md       repository-wide agent rules
├── CODEGRAPH.md                repository-level current map
├── .github/workflows/          exact-SHA CI and release gates
├── docs/                       supporting product/design/operating docs
├── wiki/                       strategy, research, and historical records
├── local-prod/                 exact-SHA local-production evidence orchestration
└── mvp-build/
    ├── apps/web/               owner, review, onboarding, public, admin surfaces
    ├── apps/manager/           control plane, tools, events, runtime, gateway, provisioning
    ├── packages/shared/        contracts, connector manifests, finite vocabularies
    ├── packages/db/            migrations, clients, generated types
    ├── packages/agent-template/ Hermes profile packages and plugins
    ├── infra/                  Docker, Caddy, deploy, operator, acceptance scripts
    ├── tests/                  unit/source, PostgreSQL, and browser matrices
    ├── validation/             machine-readable Standard/evidence artifacts
    ├── docs/architecture/      current cross-system map and research disposition
    ├── docs/ux/                owner UX doctrine and validation
    ├── memory/                 durable handoffs, indexed only by MEMORY.md
    ├── second-half-plan/       one active production program plus history
    ├── STANDARD.md             ratified non-waivable production standard
    └── CODEGRAPH.md            current implementation graph and evidence boundary
```

## Document and memory routing

- [`mvp-build/second-half-plan/README.md`](mvp-build/second-half-plan/README.md) names the single active production program.
- [`mvp-build/validation/standard-v0.2-evolution-vector.json`](mvp-build/validation/standard-v0.2-evolution-vector.json) maps the original Standard to ratified clauses and implementation/supersession references.
- [`mvp-build/docs/architecture/12-document-control-memory-and-handoff-map.md`](mvp-build/docs/architecture/12-document-control-memory-and-handoff-map.md) defines document-family control.
- [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md) is the sole handoff index.
- [`wiki/MVP/implementation-records/README.md`](wiki/MVP/implementation-records/README.md) indexes historical factual implementation records.
- Historical Markdown remains point-in-time evidence; current indexes and supersession banners determine read order.

## Development

From `mvp-build/`:

```bash
npm ci
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration   # production-shaped PostgreSQL; environment-gated where declared
```

Use local/CI PostgreSQL for routine TDD. Use disposable managed Supabase only when its platform-specific Auth, Realtime, Storage, Data API, advisor, or final release behavior is materially under test.

## Core invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Account membership, bearer possession, caller-selected IDs, mutable headers, and phone ownership are not complete authority.
3. Stable retries do not create conflicting commands or duplicate irreversible effects.
4. Consequential success requires a matching durable accepted receipt.
5. Provider master credentials never enter employee profiles or employee runtimes.
6. Customer-, money-, reputation-, credential-, and destructive actions use governed policy and approval.
7. Hermes remains the runtime substrate; Manager owns authority, effect, custody, repair, and proof.
8. Capability discovery is broad; execution custody is conservative and evidence-backed.
9. Generated UI and protocol adapters are presentation, not authority.
10. Revocation, ambiguity, retries, crashes, and partial provider outages remain repairable and observable.
11. Public claims never exceed evidence bound to the exact release SHA.
12. No agent edits `main`, weakens tests to obtain green, or reports unverified code as complete.
