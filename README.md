# AMTECH AI Employee v1

AMTECH builds persistent AI Employees for owner-operated small businesses. The owner experiences one employee through governed web, SMS, signed review, and connected-system events. Manager is the invisible control plane; Hermes is the agent substrate.

This repository contains the AI Employee product implementation and its company/product brain. The Hyper Site framework is independent and lives in `benamtech/hyper-site`; it is not part of this repository.

## Start here

Read in this order:

1. [`identity.md`](identity.md)
2. [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md)
3. root [`CODEGRAPH.md`](CODEGRAPH.md)
4. [`mvp-build/AGENTS.md`](mvp-build/AGENTS.md) or [`mvp-build/CLAUDE.md`](mvp-build/CLAUDE.md)
5. [`mvp-build/CODEGRAPH.md`](mvp-build/CODEGRAPH.md)
6. [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md), then the newest relevant handoff
7. [`mvp-build/STANDARD.md`](mvp-build/STANDARD.md)
8. [`mvp-build/second-half-plan/phase-2-standard-remediation-execution.md`](mvp-build/second-half-plan/phase-2-standard-remediation-execution.md)
9. [`mvp-build/docs/architecture/README.md`](mvp-build/docs/architecture/README.md)
10. [`mvp-build/docs/architecture/11-agent-orientation-and-role-map.md`](mvp-build/docs/architecture/11-agent-orientation-and-role-map.md)
11. relevant UX, deployment, source, migrations, scripts, tests, workflows, proof, release records, and current diff

Source, applied migrations, executable proof, and newest scoped memory outrank historical prose.

## Canonical product and offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month**.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is an outdated acquisition/regression surface. It is not canonical product UX, pricing, profile design, or launch proof.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current relationship, grant, policy, and authority version
→ stable durable intent
→ immutable command and atomic claim
→ Hermes or deterministic work
→ approval when required
→ one reserved bounded external effect
→ accepted, failed, or ambiguous durable receipt
→ deterministic replay or repair
→ role-safe web, SMS, signed-review, or connected-system surface
→ audit, metering, commercial attribution, revocation, and release proof
```

Current governed launch surfaces are web, SMS, signed review, and connected-system events. Voice is a future extension, not a launch gate.

## Current integration state

- Branch: `employee-production-tuesday`
- Base: `research`
- Draft PR: `#23`
- Migration head: `0069`
- `main` is not the integration or production shortcut
- Current exact implementation/proof anchor and workflow IDs are maintained in root/scoped CODEGRAPH, the newest handoff, and PR `#23`
- Real Supabase, target-host runtime/network, live identity/provider, fixture-free browser/SMS/Review, commercial reconciliation, cumulative budget/shared rate enforcement, fleet capacity/fairness, crash/repair, rollback, deployment attestation, and production acceptance remain separate gates unless exact evidence closes them

Production-ready means every non-waivable gate in `mvp-build/STANDARD.md` passes on the exact deployed SHA. Source wiring, fixtures, old runs, trajectory scores, and documentation-only commits cannot satisfy a live gate.

## Repository layout

```text
.
├── identity.md                  AMTECH operating identity
├── AGENTS.md / CLAUDE.md        repository-wide agent rules
├── CODEGRAPH.md                 repository-level current map
├── .github/workflows/           exact-SHA CI and release gates
├── docs/                        supporting product/design/operating docs
├── wiki/                        strategy, rationale, research, implementation records
├── local-prod/                  exact-SHA local-production evidence orchestration
└── mvp-build/
    ├── apps/web/                owner, review, onboarding, public, admin surfaces
    ├── apps/manager/            control plane, tools, events, runtime, gateway, provisioning
    ├── packages/shared/         contracts and finite vocabularies
    ├── packages/db/             migrations, clients, generated types
    ├── packages/agent-template/ Hermes profile packages and plugins
    ├── infra/                   Docker, Caddy, deploy, operator, acceptance scripts
    ├── tests/                   unit/source and PostgreSQL integration matrices
    ├── docs/architecture/       current cross-system live map and risk/trajectory packet
    ├── docs/ux/                 current owner UX doctrine and validation
    ├── memory/                  durable handoffs, indexed newest-first
    ├── second-half-plan/        active execution program and historical phase family
    ├── STANDARD.md              non-waivable production standard
    └── CODEGRAPH.md             current implementation graph and evidence boundary
```

## Document and memory routing

- [`mvp-build/docs/architecture/12-document-control-memory-and-handoff-map.md`](mvp-build/docs/architecture/12-document-control-memory-and-handoff-map.md) accounts for root/scoped CODEGRAPH, every durable handoff family, implementation records, active/historical plans, architecture, UX, and runbooks.
- [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md) is the sole index for handoff files.
- [`wiki/MVP/implementation-records/README.md`](wiki/MVP/implementation-records/README.md) indexes older factual implementation records.
- Historical Markdown is retained in place to preserve point-in-time evidence and inbound references; current indexes and status banners determine what agents read first.

## Development

From `mvp-build/`:

```bash
npm ci
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration   # environment-gated
```

Use targeted workflows during implementation and exact-head integrated gates before updating proof state.

## Core invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Account membership, bearer possession, caller-selected IDs, mutable headers, and phone ownership are not complete authority.
3. Stable retries do not create conflicting commands or duplicate irreversible effects.
4. Consequential success requires a matching durable accepted receipt.
5. Provider master credentials never enter employee profiles or employee runtimes.
6. Customer-, money-, reputation-, credential-, and destructive actions use governed approval.
7. Hermes remains the runtime substrate; Manager owns authority, effect, custody, repair, and proof.
8. Generated UI is presentation, not authority.
9. Revocation, ambiguity, retries, crashes, and partial provider outages remain repairable and observable.
10. Public claims never exceed evidence bound to the exact release SHA.
