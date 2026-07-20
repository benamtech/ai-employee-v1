# AMTECH AI Employee v1

AMTECH builds persistent AI Employees for owner-operated businesses. Owners experience accountable labor through governed Web, SMS, signed Review, and connected-system events. Manager is the control plane; Hermes is the managed reasoning/runtime substrate.

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

Before pushing, run `npm run repo:verify:full`. Pull requests into `main` run the canonical main integration gate with governance, type/lint, unit, production-boundary, build, archaeology, and compiled browser proof.

## Canonical product and offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month**.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is outdated and non-canonical.

## Product moat

AMTECH's defensibility is the reusable labor protocol joining:

- stable employee identity and explicit assignments;
- role- and relationship-scoped authority;
- transport-neutral capability and connector manifests;
- Manager MCP, explicitly safe direct MCP, and runtime-native capabilities;
- AMTECH-managed OAuth, provider-hosted onboarding, managed secrets/service accounts, and operator installation;
- typed work objects, generated views, approvals, effects, receipts, repair, and commercial attribution;
- bounded adapters for MCP Apps, AG-UI, Web, SMS, signed Review, and future channels.

Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology. Unknown or underspecified connectors remain discoverable but fail closed for setup and execution.

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
→ role-safe channel/protocol projection
→ audit, metering, commercial attribution, revocation, recovery, and release proof
```

## Current integration state

- Cutover branch: `employee-production-tuesday`
- Target/base: `main`
- Draft PR: `#23`
- Historical `research`: retained history, not current authority
- Migration head: `0072`
- Standard: ratified v0.2
- Active program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`
- Canonical deployment selection: `mvp-build/infra/scripts/production-topology.mjs`
- Database inner loop: production-shaped local/CI PostgreSQL; managed Supabase only for named platform/release gates
- Product status: Gate 0 source/document/CI resolved; not live accepted or launch-cleared

## Hermes upstream intelligence

Production remains pinned to an approved Hermes image and immutable digest. Before Hermes runtime, profile, session, gateway, tool-discovery, or Hermes-derived UI work:

```bash
cd mvp-build
npm run hermes:upstream:check
```

The scheduled/path-triggered check records official upstream head, watched `hermes_cli/` and `web/src/App.tsx` blobs, and active PR themes. It never upgrades production automatically.

## Repository layout

```text
.
├── CONTRIBUTING.md              executable contributor and agent entrypoint
├── AGENTS.md / CLAUDE.md        repository-wide rules
├── CODEGRAPH.md                 repository current map
├── .github/workflows/           governance, main integration, subsystem, and release gates
├── wiki/                        strategy, research, and historical records
└── mvp-build/
    ├── apps/web/                owner, review, onboarding, public, admin surfaces
    ├── apps/manager/            control plane, tools, events, runtime, gateway, provisioning
    ├── packages/shared/         contracts and connector/capability manifests
    ├── packages/db/             migrations, clients, generated types
    ├── infra/                   Docker, Caddy, deploy, lifecycle, acceptance, release scripts
    ├── tests/                   unit/source, PostgreSQL, and browser matrices
    ├── validation/              Standard, rubric, upstream, and evidence artifacts
    ├── docs/architecture/       source-backed architecture and research disposition
    ├── memory/                  dated handoffs; MEMORY.md is sole index
    ├── second-half-plan/        one active production program plus history
    ├── STANDARD.md              ratified non-waivable production standard
    └── CODEGRAPH.md             implementation graph and evidence boundary
```

## Core invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Account membership, bearer possession, caller-selected IDs, mutable headers, and phone ownership are incomplete authority.
3. Stable retries do not duplicate irreversible effects.
4. Consequential success requires a matching durable accepted receipt.
5. Provider master credentials never enter employee profiles or runtimes.
6. Hermes remains runtime; Manager owns authority, effect, custody, repair, and proof.
7. Capability discovery is broad; execution custody is conservative and evidence-backed.
8. Generated UI and protocol adapters are presentation, not authority.
9. Ambiguous outcomes reconcile before retry.
10. `main` changes only through reviewed merge; tests are not weakened to obtain green.
11. Upstream Hermes drift triggers review, never an automatic production upgrade.
12. Production-ready means every non-waivable Standard gate passes on one exact deployed release.
