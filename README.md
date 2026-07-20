# AMTECH AI Employee v1

AMTECH builds persistent AI Employees for owner-operated businesses. The product is SaaS-legible but behaves like an employee operating environment: durable workspaces, streaming conversation and activity, connected systems, approvals, contextual apps, artifacts, proof, and recovery. Manager is the control plane; Hermes is the managed reasoning/runtime substrate.

This repository contains the AI Employee implementation and company/product brain. Hyper Site lives independently in `benamtech/hyper-site`.

## Start here

1. [`identity.md`](identity.md)
2. [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md)
3. [`CONTRIBUTING.md`](CONTRIBUTING.md)
4. root [`CODEGRAPH.md`](CODEGRAPH.md)
5. scoped [`mvp-build/AGENTS.md`](mvp-build/AGENTS.md) or [`mvp-build/CLAUDE.md`](mvp-build/CLAUDE.md)
6. [`mvp-build/CODEGRAPH.md`](mvp-build/CODEGRAPH.md)
7. ratified [`mvp-build/STANDARD.md`](mvp-build/STANDARD.md)
8. [`mvp-build/second-half-plan/README.md`](mvp-build/second-half-plan/README.md) and its one active program
9. [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md), then only the newest relevant handoff
10. relevant source, migrations, scripts, tests, workflows, proof, and current diff

Current source, applied migrations, executable proof, and exact-head evidence outrank prose. Historical plans and wiki records remain context, not current execution order.

## Fifteen-minute contributor setup

```bash
git fetch origin
git switch -c task/<task-id> origin/main
cd mvp-build
npm ci
npm run hooks:install
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
```

Before pushing, run `npm run repo:verify:full`. Pull requests into `main` run the canonical Main Integration gate with governance, type/lint, named source contracts, the complete broad unit aggregate, production build, archaeology, and compiled browser regression.

## Canonical product and offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month**.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is outdated and non-canonical.

## Product moat

AMTECH's defensibility is the reusable labor protocol joining stable employee identity, explicit assignments, scoped authority, connector/capability manifests, governed work objects, approvals, idempotent effects, receipts, repair, proof, commercial attribution, and bounded MCP Apps, AG-UI, Web, SMS, signed Review, and future-channel projections.

Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology. Unknown or underspecified connectors remain discoverable but fail closed for setup and execution.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current relationship, policy, entitlement, and authority version
→ stable durable intent, command, event, or work object
→ Hermes reasoning or deterministic work
→ current effective-capability intersection
→ approval when required
→ one reserved idempotent external effect
→ accepted, failed, or ambiguous durable receipt
→ deterministic replay, reconciliation, or repair
→ role-safe channel/protocol projection
→ audit, metering, revocation, recovery, and release proof
```

## Current integration state

- Current merged baseline: current `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`.
- PR `#31` is the reviewed WS-02 branch; it is not merged at this document transaction.
- WS-01 evidence remains **106 files / 613 tests** on `1460960f415fafc20582313b1dd2117b781a63f7`.
- Hardened WS-02 implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`.
- Evidence workflows on that implementation head: Standard `29735429854`, Hermes Review `29735429873`, Main Integration `29735429859`.
- Broad regression: **110 files / 635 tests**; source/type/lint/contracts, build, archaeology, and compiled Chromium passed.
- Source/CI resolved: protected remote MCP authorization, MCP Apps host/resource boundary, AG-UI projection/command return path, persisted effective-capability enforcement, assignment-scoped live projection, and final policy/version revalidation.
- `ISS-011` remains open: live connector/provider authorization, health, revocation, staleness, scope change, outage, repair, deletion, and external protocol-host evidence.
- WS-03 is prepared in the active program but must start from then-current `main` only after PR `#31` is exact-head green and merged or formally superseded.
- Migration head: `0072`. Standard: ratified v0.2.
- Database, target-host, fixture-free channel, commercial, recovery, accessibility, capacity, deployment, pilot, and production acceptance remain open.

## Repository ownership map

Canonical root files remain at root because tooling and contributor contracts address them by exact path. Moving them would break executable governance rather than reduce bloat.

| Location | Owns | Does not own |
|---|---|---|
| `identity.md` | company/product identity | implementation status |
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` | contributor rules and gates | subsystem design |
| `CODEGRAPH.md` | repository routing/current topology | normative product requirements |
| `mvp-build/STANDARD.md` | ratified non-waivable requirements | current evidence coordinates |
| active production program | issue state, dependency order, task contracts | historical narrative |
| `mvp-build/docs/architecture/` | current explanatory architecture | execution order |
| `mvp-build/memory/MEMORY.md` | newest-first handoff index | normative authority |
| source/migrations/tests/workflows/proof | executable and acceptance truth | strategy prose |
| `wiki/` | strategy, research, historical records | current implementation authority |

## Repository layout

```text
.
├── identity.md
├── AGENTS.md / CLAUDE.md / CONTRIBUTING.md
├── CODEGRAPH.md
├── .github/workflows/
├── wiki/
└── mvp-build/
    ├── apps/web/                owner operating environment and public surfaces
    ├── apps/manager/            authority, runtime, connectors, effects, repair, proof
    ├── packages/shared/         contracts and connector/capability manifests
    ├── packages/db/             migrations, clients, generated types
    ├── infra/                   topology, deploy, lifecycle, acceptance, release scripts
    ├── tests/                   unit/source, PostgreSQL, and browser matrices
    ├── validation/              Standard, rubric, upstream, and evidence artifacts
    ├── docs/architecture/       source-backed explanatory architecture
    ├── memory/                  dated handoffs; `MEMORY.md` is the sole index
    ├── second-half-plan/        one active production program plus history
    ├── STANDARD.md              ratified production standard
    └── CODEGRAPH.md             implementation graph and evidence boundary
```

## Core invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Account membership, bearer possession, caller-selected identifiers, mutable headers, and phone ownership are incomplete authority.
3. Stable retries do not duplicate irreversible effects.
4. Consequential success requires a matching durable accepted receipt.
5. Provider master credentials never enter employee profiles or runtimes.
6. Hermes remains runtime; Manager owns authority, effect, custody, repair, and proof.
7. Discovery may be broad; execution is re-derived from current evidence immediately before dispatch.
8. Generated UI, streaming state, and protocol adapters are projections, not authority.
9. Ambiguous outcomes reconcile before retry.
10. `main` changes only through reviewed merge; tests are not weakened to obtain green.
11. Upstream Hermes drift triggers review, never an automatic production upgrade.
12. Production-ready means every non-waivable Standard gate passes on one exact signed deployed release.
