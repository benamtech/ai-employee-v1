# mvp-build — AMTECH AI Employee implementation home

Status: **active source candidate; exact CI/live acceptance incomplete**  
Updated: 2026-07-20

`mvp-build/` contains the executable product: owner operating environment, Manager control plane, Hermes integration, PostgreSQL authority/effect/commercial state, connectors and capability protocols, Model Gateway, provisioning, deployment, tests, computed decision traces, and release proof.

## Contributor start

1. Read root [`../CONTRIBUTING.md`](../CONTRIBUTING.md), [`../AGENTS.md`](../AGENTS.md) or [`../CLAUDE.md`](../CLAUDE.md), and [`../CODEGRAPH.md`](../CODEGRAPH.md).
2. Read scoped [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md), then [`CODEGRAPH.md`](CODEGRAPH.md).
3. Read ratified [`STANDARD.md`](STANDARD.md) and [`production-readiness-program/README.md`](production-readiness-program/README.md).
4. For WS-06/07/08 work, read [`production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md`](production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md) and [`decision/trace007/decision_record.md`](decision/trace007/decision_record.md).
5. Read only the newest relevant indexed handoff and exact source/test/proof needed for the task.

```bash
npm ci
npm run hooks:install
npm run repo:verify:quick
```

Authority order: deployed proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests/acceptance → Standard/current program → CODEGRAPH/architecture → newest indexed memory → history.

## Current integration boundary

- Current main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a` is the stacked owner-runtime base.
- PR #35 is the WS-06/07 source candidate with bounded WS-08 repair/lineage/observability groundwork.
- Source migration head is `0075`; applied/platform acceptance must be proved separately.
- Standard v0.2 remains ratified.
- Active program: `production-readiness-program/`.
- Active computed WS-06/07/08 trace: `decision/trace007/`.
- `second-half-plan/` and prior complete traces are historical and non-canonical; incomplete duplicate trace transports are removed.
- Source wiring does not imply exact-head CI, target-host, managed-platform, live provider/channel, commercial lifecycle, recovery, deployment, pilot, or production acceptance.

## Product and protocol boundary

- Hermes supplies reasoning, runs, session continuity, memory behavior, runtime-local tools, and employee execution.
- Manager owns identity/assignment authority, context/resources, capability/tool contracts, connector/provider custody, approvals, durable commands/effects, shared commercial admission, accounting, reconciliation, repair, and proof.
- Web is an employee operating environment: durable workspace plus low-latency conversation/activity, connected apps, approvals, artifacts, proof, and recovery.
- SMS, signed Review, MCP Apps, and AG-UI are role-safe projections; they do not create authority.
- Caddy is public ingress; Host Provisioner alone has Docker-host authority; PostgreSQL/Supabase is durable identity, effect, rate, budget, accounting, ambiguity, and repair state.

## Active production-readiness program

- `production-readiness-program/04-dependency-ordered-production-plan.md` — dependency order.
- `production-readiness-program/08-production-issue-vector.json` — issue baseline.
- `production-readiness-program/13-resolution-ledger.json` — current resolution/control state.
- `production-readiness-program/09-workstream-execution-map.md` — completion contracts.
- `production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md` — current source transaction.
- `production-readiness-program/10-test-suite-disposition.md` — test evidence classification.
- `production-readiness-program/07-verification-and-handoff-matrix.md` — evidence boundary.
- `decision/trace007/` — evidence-backed forced-dreaming frontier, hypergraph comparison, and implementation compression.

## Durable execution invariants

- Initial snapshots install atomically only after exact account, employee, assignment, and authority validation.
- Cursor/version is established before ordered deltas.
- Duplicate, stale, reordered, cross-account, stale-assignment, stale-entitlement, or stale-approval requests fail closed.
- Reconnect and retry do not resubmit accepted owner intent or effect.
- Web, SMS, signed Review, output, accounting, and proof converge on one exact revision/effect identity.
- PostgreSQL owns shared rate and budget authority; process-local buckets are forbidden.
- Budget reservation occurs before provider dispatch; settlement commits actual value, releases unused value, and preserves refunds/reversals as immutable adjustments.
- One provider effect terminates with accepted, failed, or ambiguous durable evidence.
- Accepted success requires matching provider, effect, and accounting receipts.
- Ambiguous effects reconcile before retry.
- Crash after accepted effect but before proof projection repairs the projection without repeating the effect.
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

## Root ownership map

| File/folder | Responsibility |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` | contributor behavior and executable gates |
| `CODEGRAPH.md` | current topology and evidence boundary |
| `STANDARD.md` | ratified normative requirements |
| `production-readiness-program/` | current dependency order, workstreams, issues, transactions, and test authority |
| `decision/trace007/` | current mathematically verifiable WS-06/07/08 exploration and compression |
| `second-half-plan/` | historical non-canonical plans |
| `docs/architecture/` | current explanatory architecture |
| `memory/MEMORY.md` | newest-first handoff index |
| source/migrations/tests/workflows | implementation and acceptance truth |

## Directory map

```text
apps/web/                       owner operating environment and public surfaces
apps/manager/                   authority, runtime, connectors, effects, commercial state, repair, proof
packages/shared/                contracts and connector/capability manifests
packages/db/                    forward migrations, clients, generated types
infra/                          topology, deploy, lifecycle, acceptance, release operations
tests/                          unit behavioral, PostgreSQL integration, and browser matrices
decision/trace007/              active computed frontier and implementation contract
validation/                     Standard, rubric, upstream, and evidence artifacts
docs/architecture/              current cross-system explanation
memory/                         durable handoffs; MEMORY.md is the sole index
production-readiness-program/   single active production-readiness program
second-half-plan/               historical plans only
```
