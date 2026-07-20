# mvp-build — AMTECH AI Employee implementation home

Status: **active; exact source/test evidence only; live acceptance incomplete**  
Updated: 2026-07-20

`mvp-build/` contains the executable product: owner operating environment, Manager control plane, Hermes integration, PostgreSQL authority/effect state, connectors and capability protocols, Model Gateway, provisioning, deployment, tests, and release proof.

## Contributor start

1. Read root [`../CONTRIBUTING.md`](../CONTRIBUTING.md), [`../AGENTS.md`](../AGENTS.md) or [`../CLAUDE.md`](../CLAUDE.md), and [`../CODEGRAPH.md`](../CODEGRAPH.md).
2. Read scoped [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md), then [`CODEGRAPH.md`](CODEGRAPH.md).
3. Read ratified [`STANDARD.md`](STANDARD.md) and [`production-readiness-program/README.md`](production-readiness-program/README.md).
4. Read only the newest relevant indexed handoff and source/test/proof needed for the task.

```bash
npm ci
npm run hooks:install
npm run repo:verify:quick
```

Authority order: deployed proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests/acceptance → Standard/current program → CODEGRAPH/architecture → newest indexed memory → history.

## Current integration boundary

- Current main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- PR #33/source/tests are newer authority than stale plan-status prose but establish only their exact evidence.
- Migration head remains `0072` unless current source proves otherwise. Standard v0.2 remains ratified.
- Active program: `production-readiness-program/`.
- `second-half-plan/` is historical and non-canonical.
- WS-05/WS-06 are active but incomplete. WS-07/08/09 remain downstream.
- Source wiring does not imply exact-head CI, target-host, managed-platform, live provider/channel, commercial, recovery, deployment, pilot, or production acceptance.

## Product and protocol boundary

- Hermes supplies reasoning, runs, session continuity, memory behavior, runtime-local tools, and employee execution.
- Manager owns identity/assignment authority, context/resources, capability/tool contracts, connector/provider custody, approvals, durable commands/effects, metering, repair, and proof.
- Web is an employee operating environment: durable workspace plus low-latency conversation/activity, connected apps, approvals, artifacts, proof, and recovery.
- SMS, signed Review, MCP Apps, and AG-UI are role-safe projections; they do not create authority.
- Caddy is public ingress; Host Provisioner alone has Docker-host authority; PostgreSQL/Supabase is durable authority/effect state.

## Active production-readiness program

- `production-readiness-program/04-dependency-ordered-production-plan.md` — dependency order.
- `production-readiness-program/08-production-issue-vector.json` — issue baseline.
- `production-readiness-program/13-resolution-ledger.json` — current resolution state.
- `production-readiness-program/09-workstream-execution-map.md` — completion contracts.
- `production-readiness-program/10-test-suite-disposition.md` — test evidence classification.
- `production-readiness-program/07-verification-and-handoff-matrix.md` — evidence boundary.

## Owner runtime invariants

- Initial snapshots install atomically only after exact account, employee, assignment, and authority validation.
- Cursor/version is established before ordered deltas.
- Duplicate, stale, reordered, cross-account, or stale-assignment projections fail closed.
- Reconnect does not resubmit accepted owner intent.
- Web, SMS, and signed Review converge on one durable work object and exact revision.
- Approval binds to that revision; one idempotent external effect terminates with accepted, failed, or ambiguous receipt.
- Ambiguous effects reconcile before retry; completion is receipt-backed; proof remains refindable and assignment-isolated.
- Fixture state cannot satisfy fixture-free acceptance.

## Development and verification

```bash
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
npm run test:integration
npm run test:production-boundary
npm run build
```

Routine database engineering uses production-shaped local/CI PostgreSQL. Disposable managed Supabase is required only for named platform-specific and release-candidate gates. Production is never the routine test target.

## Root ownership map

| File/folder | Responsibility |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` | contributor behavior and executable gates |
| `CODEGRAPH.md` | current topology and evidence boundary |
| `STANDARD.md` | ratified normative requirements |
| `production-readiness-program/` | current dependency order, workstreams, issues, and test authority |
| `second-half-plan/` | historical non-canonical plans |
| `docs/architecture/` | current explanatory architecture |
| `memory/MEMORY.md` | newest-first handoff index |
| source/migrations/tests/workflows | implementation and acceptance truth |

## Directory map

```text
apps/web/                       owner operating environment and public surfaces
apps/manager/                   authority, runtime, connectors, effects, repair, proof
packages/shared/                contracts and connector/capability manifests
packages/db/                    migrations, clients, generated types
infra/                          topology, deploy, lifecycle, acceptance, release operations
tests/                          unit/source, PostgreSQL, and browser matrices
validation/                     Standard, rubric, upstream, and evidence artifacts
docs/architecture/              current cross-system explanation
memory/                         durable handoffs; MEMORY.md is the sole index
production-readiness-program/   single active production-readiness program
second-half-plan/               historical plans only
```
