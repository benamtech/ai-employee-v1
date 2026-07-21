# mvp-build — AMTECH AI Employee implementation home

Status: **active source candidate; exact CI/live acceptance incomplete**  
Updated: 2026-07-20

`mvp-build/` contains the executable product, computation-first decision protocol, owner operating environment, Manager control plane, Hermes integration, PostgreSQL authority/effect/commercial state, connectors/capability protocols, Model Gateway, provisioning, deployment, tests, memory, and release proof.

## Contributor start

1. Read root [`../CONTRIBUTING.md`](../CONTRIBUTING.md), [`../AGENTS.md`](../AGENTS.md) or [`../CLAUDE.md`](../CLAUDE.md), and [`../CODEGRAPH.md`](../CODEGRAPH.md).
2. Read scoped [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md), then [`CODEGRAPH.md`](CODEGRAPH.md).
3. Read ratified [`STANDARD.md`](STANDARD.md) plus [`STANDARD-V0.2-AMENDMENT-001.md`](STANDARD-V0.2-AMENDMENT-001.md).
4. Read mandatory [`decision/README.md`](decision/README.md) and [`decision/protocol-v1.json`](decision/protocol-v1.json).
5. Read [`production-readiness-program/README.md`](production-readiness-program/README.md).
6. For WS-06/07/08, read the current transaction and [`decision/trace007/`](decision/trace007/).
7. Read only the newest relevant indexed handoff and exact source/test/proof needed for the task.

The amendment controls where the base Standard still shows the superseded execution loop, old document-family routing, migration `0072`, or the earlier source map.

```bash
npm ci
npm run hooks:install
npm run repo:verify:quick
```

Authority order:

```text
deployed proof
→ applied migrations/durable state
→ executable source/generated production config
→ exact-SHA tests/acceptance
→ Standard/current program
→ CODEGRAPH/architecture
→ newest indexed memory
→ history
```

Computation precedes non-mechanical planning and implementation but does not promote evidence class.

## Current integration boundary

- Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a` is the stacked owner-runtime base.
- PR #35 is the WS-06/07 source candidate with bounded WS-08 repair/lineage/observability groundwork.
- Source migration head is `0076`; applied/platform acceptance requires separate proof.
- Standard v0.2 plus Amendment 001 are effective.
- Active computation protocol: `decision/README.md`.
- Active production program: `production-readiness-program/`.
- Active WS-06/07/08 trace: `decision/trace007/`.
- `second-half-plan/`, old audits, and prior complete traces are historical/non-canonical; incomplete transports are removed.
- Source wiring does not imply exact-head CI, provider, managed-platform, target-host, fixture-free channel/golden-work, commercial lifecycle, recovery, deployment, pilot, or production acceptance.

## Compute before deciding or implementing

Use the proportional tiers in `decision/README.md`:

```text
T0 mechanical
T1 bounded
T2 consequential
T3 production/cross-workstream
```

Required sequence:

```text
authority/evidence/Unknown extraction
→ applicable possible-decision spaces
→ independent candidates
→ invariant/prerequisite filter
→ computed comparison
→ selected exploration
→ separate coherent implementation compression
→ red behavioral proof
→ implementation
→ exact-head/external verification
```

Do not flatten defect, feature, user, operator, architecture, protocol, commercial, failure, proof, weird, and constraint spaces. Unknown remains Unknown. Hypergraphs, Hodge, Koopman, spectral metrics, and manifold language require genuine mathematical prerequisites and must materially affect selection.

## Product and protocol boundary

- Hermes supplies reasoning, runs, session continuity, memory behavior, runtime-local tools, and employee execution.
- Manager owns identity/assignment authority, context/resources, capability/tool contracts, connector/provider custody, approvals, durable commands/effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- Web is an employee operating environment: durable workspace plus low-latency conversation/activity, connected apps, approvals, artifacts, receipts, proof, and recovery.
- SMS, signed Review, MCP Apps, and AG-UI are role-safe projections; they do not create authority.
- Caddy is public ingress; Host Provisioner alone has Docker-host authority; PostgreSQL/Supabase is durable identity, effect, rate, budget, accounting, ambiguity, and repair state.

## Active production-readiness route

- `STANDARD.md` plus `STANDARD-V0.2-AMENDMENT-001.md` — ratified normative requirements.
- `decision/README.md` — computation-first contract.
- `production-readiness-program/04-dependency-ordered-production-plan.md` — dependency order.
- `production-readiness-program/08-production-issue-vector.json` — issue baseline.
- `production-readiness-program/13-resolution-ledger.json` — current resolution/control state.
- `production-readiness-program/09-workstream-execution-map.md` — completion/stop contracts.
- `production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md` — current source transaction.
- `production-readiness-program/10-test-suite-disposition.md` — test evidence classification.
- `production-readiness-program/07-verification-and-handoff-matrix.md` — evidence/handoff boundary.
- `decision/trace007/` — active evidence-backed frontier, hypergraph comparison, and implementation compression.

## Durable execution invariants

- Computation precedes non-mechanical decision modeling and implementation.
- Initial snapshots install atomically only after exact account, employee, assignment, and authority validation.
- Cursor/version precedes ordered deltas.
- Duplicate, stale, reordered, cross-account, stale-assignment, stale-entitlement, or stale-approval requests fail closed.
- Reconnect/retry do not resubmit accepted owner intent or effect.
- Web, SMS, signed Review, output, accounting, and proof converge on one exact revision/effect identity.
- PostgreSQL owns shared rate and budget authority; process-local buckets are forbidden.
- Budget reservation precedes dispatch; settlement commits actual value, releases unused value, and preserves immutable adjustments.
- One provider effect terminates with accepted, failed, or ambiguous durable evidence.
- Accepted success requires matching provider, effect, and accounting receipts.
- Ambiguous effects reconcile the original effect identity before retry.
- Crash after accepted effect but before proof projection repairs projection without repeating the effect.
- Fixture state cannot satisfy fixture-free acceptance.

## Development and verification

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

Routine database engineering uses production-shaped local/CI PostgreSQL. Disposable managed Supabase is required for named platform-specific and release-candidate gates. Production is never the routine test target.

## Ownership map

| File/folder | Responsibility |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` | contributor behavior and executable gates |
| `STANDARD.md`, `STANDARD-V0.2-AMENDMENT-001.md` | ratified normative requirements and current additive amendment |
| `decision/README.md`, `decision/protocol-v1.json` | computation-first decision contract |
| `CODEGRAPH.md` | current topology and evidence boundary |
| `production-readiness-program/` | current dependency order, workstreams, issues, transactions, tests, evidence |
| `decision/trace007/` | active mathematically verifiable WS-06/07/08 frontier and compression |
| `docs/architecture/` | current explanatory architecture |
| `memory/MEMORY.md` | sole handoff index |
| `second-half-plan/`, `GAPS.md`, `REMEDIATION.md` | historical routers/evidence, not current plans |
| source/migrations/tests/workflows | implementation and acceptance truth |

## Directory map

```text
apps/web/                       owner operating environment and public surfaces
apps/manager/                   authority, runtime, connectors, effects, commercial state, repair, proof
packages/shared/                contracts and connector/capability manifests
packages/db/                    forward migrations, clients, generated types
infra/                          topology, deploy, lifecycle, acceptance, release operations
tests/                          unit behavioral, PostgreSQL integration, browser matrices
decision/                       protocol, active/historical computed traces
validation/                     Standard evolution, amendment, rubric, upstream, evidence artifacts
docs/architecture/              current cross-system explanation
memory/                         durable handoffs; MEMORY.md is sole index
production-readiness-program/   single active production program
second-half-plan/               historical plans only
```
