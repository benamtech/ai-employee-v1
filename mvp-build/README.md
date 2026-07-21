# mvp-build — AMTECH AI Employee

Status: active implementation home  
Updated: 2026-07-20

This directory contains the executable product: Manager, Hermes integration, owner web surface, PostgreSQL authority, connectors, Model Gateway, commercial/effect state, provisioning, deployment, tests, decision traces, memory, and release proof.

Exact branch, candidate, migration, workstream, and acceptance status lives in [`CODEGRAPH.md`](CODEGRAPH.md).

## Contributor route

```text
../AGENTS.md + ../CONTRIBUTING.md
→ AGENTS.md + CODEGRAPH.md
→ STANDARD.md + ratified amendments
→ decision/README.md
→ production-readiness-program/README.md
→ current transaction
→ exact source, tests, workflows, and proof
```

```bash
npm ci
npm run hooks:install
npm run repo:verify:quick
```

## Product boundary

- **Hermes:** reasoning, runs, sessions, runtime-local memory, and tool execution.
- **Manager:** identity, assignment authority, capability/tool contracts, connector/provider custody, approvals, durable effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI:** bounded projections.
- **PostgreSQL/Supabase:** shared durable identity, rate, budget, effect, receipt, accounting, lineage, and reconciliation authority.

## Canonical transaction

```text
exact principal and assignment
→ immutable request/work revision
→ current capability and approval
→ atomic shared rate/budget admission
→ one command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ effect-bound accounting
→ output and owner proof
→ original-effect reconciliation or projection repair
```

## Active authority

- [`STANDARD.md`](STANDARD.md) plus ratified amendments — normative requirements.
- [`decision/README.md`](decision/README.md) — computation protocol.
- [`decision/trace007/`](decision/trace007/) — current decision trace; candidate and software topology are separate.
- [`production-readiness-program/`](production-readiness-program/) — single active production route.
- [`docs/architecture/`](docs/architecture/) — source-backed explanation.
- [`memory/MEMORY.md`](memory/MEMORY.md) — sole handoff index.
- [`second-half-plan/`](second-half-plan/), `GAPS.md`, and `REMEDIATION.md` — historical provenance only.

## Verification entrypoints

```bash
python decision/trace007/compute.py
npm run test:ws07-ws08
npm run db:verify:commercial-effect-migrations
npm run test:production-boundary
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
npm run test:integration
npm run build
```

Each command proves only the boundary and exact candidate it exercises. Missing managed database, provider, browser/channel, target-host, commercial, signed-release, pilot, or production prerequisites remain blocked rather than mocked into acceptance.

## Directory map

```text
apps/web/                       owner operating environment and public surfaces
apps/manager/                   authority, runtime, connectors, effects, commercial state, repair, proof
packages/shared/                contracts and connector/capability manifests
packages/db/                    forward migrations, clients, generated types
infra/                          topology, deploy, lifecycle, acceptance, release operations
tests/                          behavioral unit, PostgreSQL integration, browser matrices
decision/                       protocol and computed traces
validation/                     Standard evolution, rubric, upstream, evidence artifacts
docs/architecture/              current explanatory architecture
memory/                         durable handoffs; MEMORY.md is sole index
production-readiness-program/   single active production route
second-half-plan/               historical plans
```
