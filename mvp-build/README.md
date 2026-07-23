# mvp-build — AMTECH AI Employee

Status: active implementation home  
Updated: 2026-07-23

This directory contains the executable product: Manager, Hermes integration, owner web surface, PostgreSQL authority, connectors, Model Gateway, commercial/effect state, provisioning, deployment, tests, decision traces, memory, UI Lab, and release proof.

Current structural status lives in [`CODEGRAPH.md`](CODEGRAPH.md). Exact transient SHA, workflow run, and conclusion live in the current PR, workflow, or retained release record.

## Contributor route

```text
../AGENTS.md + ../CONTRIBUTING.md
→ AGENTS.md + authority-map.json + CODEGRAPH.md
→ STANDARD.md + ratified amendments
→ decision/active.json + decision/README.md
→ production-readiness-program/README.md
→ exact source, tests, workflows, and proof
```

```bash
npm ci
npm run hooks:install
npm run repo:verify:quick
```

For UI Lab or full employee UI-variant work, begin at [`ui-lab/README.md`](ui-lab/README.md), the canonical agent entry point.

## Product boundary

- **Hermes:** reasoning, runs, sessions, runtime-local memory, and tool execution.
- **Manager:** identity, assignment authority, capability/tool contracts, connector/provider custody, approvals, durable effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI/UI Lab:** bounded projections.
- **PostgreSQL/Supabase:** shared durable identity, rate, budget, effect, receipt, accounting, lineage, and reconciliation authority.
- **Host Provisioner:** sole Docker and bounded target-host lifecycle authority.

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

- [`authority-map.json`](authority-map.json) — machine-readable authority router.
- [`CODEGRAPH.md`](CODEGRAPH.md) — sole current product/workstream status owner.
- [`STANDARD.md`](STANDARD.md) plus ratified amendments — normative requirements.
- [`decision/active.json`](decision/active.json) — current decision router; currently no new decision transaction is open.
- [`decision/README.md`](decision/README.md) — computation protocol.
- [`decision/trace007/`](decision/trace007/) through [`decision/trace010/`](decision/trace010/) — current production-authority, release, UI-architecture, and connector decisions.
- [`decision/trace011/`](decision/trace011/) and [`decision/trace012/`](decision/trace012/) — completed UI port and UI Lab/folder-first variant decisions.
- [`production-readiness-program/`](production-readiness-program/) — single active production route.
- [`docs/architecture/`](docs/architecture/) — source-backed explanation.
- [`memory/MEMORY.md`](memory/MEMORY.md) — sole handoff index.
- [`second-half-plan/`](second-half-plan/), `GAPS.md`, and `REMEDIATION.md` — historical provenance only.

Trace013 is reserved for a fresh planning computation on the next branch. No incomplete prior Trace013 artifact is active or retained.

## Verification entrypoints

```bash
python decision/trace007/compute.py
python decision/trace008/compute.py
npm run repo:agentic:check
npm run test:ws07-ws08
npm run db:verify:commercial-effect-migrations
npm run test:production-boundary
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
npm run test:integration
npm run build
node scripts/ui-variant.mjs doctor
```

Each command proves only the boundary and exact candidate it exercises. Missing managed database, live provider, browser/channel/accessibility, target-host, commercial lifecycle, recovery rehearsal, trusted signing, pilot, deployment, or production prerequisites remain blocked rather than mocked into acceptance.

## Directory map

```text
apps/web/                       owner operating environment and public surfaces
apps/manager/                   authority, runtime, connectors, effects, commercial state, repair, proof
packages/shared/                contracts and connector/capability manifests
packages/db/                    forward migrations, clients, generated types
infra/                          topology, deploy, lifecycle, acceptance, release operations
tests/                          behavioral unit, PostgreSQL integration, browser matrices
decision/                       protocol, active router, and completed traces
ui-lab/                         canonical agent-first UI Lab entry and source-owned presets
validation/                     Standard evolution, rubric, upstream, evidence artifacts
docs/architecture/              current explanatory architecture
memory/                         durable handoffs; MEMORY.md is sole index
production-readiness-program/   single active production route
second-half-plan/               historical plans
```
