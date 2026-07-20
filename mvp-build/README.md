# mvp-build — AMTECH AI Employee implementation home

Status: **active on current main; WS-01 and hardened WS-02 source/CI accepted; live acceptance incomplete**  
Updated: 2026-07-20

`mvp-build/` contains the executable product: owner operating environment, Manager control plane, Hermes integration, PostgreSQL authority/effect state, connectors and capability protocols, Model Gateway, provisioning, deployment, tests, and release proof.

## Contributor start

1. Read root [`../CONTRIBUTING.md`](../CONTRIBUTING.md), [`../AGENTS.md`](../AGENTS.md) or [`../CLAUDE.md`](../CLAUDE.md), and [`../CODEGRAPH.md`](../CODEGRAPH.md).
2. Read scoped [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md), then [`CODEGRAPH.md`](CODEGRAPH.md).
3. Read ratified [`STANDARD.md`](STANDARD.md) and [`second-half-plan/README.md`](second-half-plan/README.md).
4. Read only the newest relevant handoff and the source/test/proof needed for the task.

```bash
npm ci
npm run hooks:install
npm run repo:verify:quick
```

Authority order: deployed proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests/acceptance → Standard/active program → CODEGRAPH/architecture → newest indexed memory → history.

## Current integration boundary

- Current merged baseline: current `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`.
- WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`, broad **106 files / 613 tests**.
- Hardened WS-02 implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`.
- Exact implementation workflows: Standard `29735429854`, Hermes `29735429873`, Main Integration `29735429859`.
- Broad current aggregate: **110 files / 635 tests**; source/type/lint/contracts, build, archaeology, and compiled Chromium passed.
- Migration head: `0072`. Standard: ratified v0.2.
- Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`.
- Source/CI resolved: `ISS-007`–`ISS-010`.
- Open WS-02 completion gate: `ISS-011` live connector/provider and external protocol-host lifecycle evidence.
- WS-03 preparation exists in `17-ws03-p0-fisher-frontier.md` and `18-ws03-p0-task-contract.json`; implementation waits for PR `#31` to merge or be formally superseded.
- Canonical topology: `infra/scripts/production-topology.mjs` → `infra/deploy/docker-compose.production.yml`.

Source/CI does not imply target-host, managed-platform, live provider/channel, commercial, recovery, rollback, capacity, deployment, pilot, or production acceptance.

## Product and protocol boundary

- Hermes supplies reasoning, runs, session continuity, memory behavior, runtime-local tools, and employee execution.
- Manager owns identity/assignment authority, context/resources, capability/tool contracts, connector and provider custody, approvals, durable commands/effects, metering, repair, and proof.
- Web is an employee operating environment: durable workspace plus low-latency conversation/activity, connected apps, approvals, artifacts, proof, and recovery.
- SMS, signed Review, MCP Apps, and AG-UI are role-safe projections; they do not create authority.
- Caddy is public ingress; Host Provisioner alone has Docker-host authority; PostgreSQL/Supabase is durable authority/effect state.

Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.

## Active production program

- `04-dependency-ordered-production-plan.md` — Phases 1.1–1.9, frozen candidate, pilot, expansion.
- `08-production-issue-vector.json` — immutable 38-issue baseline.
- `13-resolution-ledger.json` — current issue/control resolution state.
- `09-workstream-execution-map.md` — nine completion contracts.
- `10-test-suite-disposition.md` — test evidence classification.
- `14-ws02-runtime-ui-capability-contract.json` — WS-02 task boundary.
- `15-ws02-capability-manifold/` — pair/triple interaction evidence design.
- `16-ws02-streaming-protocol-source-ci-closure.md` — WS-02 implementation evidence.
- `17-ws03-p0-fisher-frontier.md` and `18-ws03-p0-task-contract.json` — guarded next frontier.

## Current WS-02 controls

- Owner-visible progress channels are keyed by account, employee, and assignment.
- Established Hermes stream failure polls the same run; it never silently creates another run.
- Remote MCP metadata, issuer, resource audience, redirect, scope, PKCE, state, and token custody are Manager-derived.
- MCP Apps use content-bound `ui://` resources, opaque origins, enforceable document CSP, finite host methods, and protocol-action mediation.
- AG-UI carries ordered assignment/version-scoped projection; client commands re-enter existing Manager authority.
- MCP credential verification is followed by a final read of current assignment policy and authority version before dispatch.
- Connector-backed execution requires a current binding and fresh provider-verification evidence.
- Discovery may be broad; unknown, stale, revoked, mismatched, or unprobed execution evidence fails closed.

## Development and verification

```bash
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
npm run test:integration   # environment-gated where declared
npm run test:production-boundary
npm run build
```

Routine database engineering uses production-shaped local/CI PostgreSQL. Disposable managed Supabase is required for named platform-specific and release-candidate gates. Production is never the routine test target.

## Root ownership map

Canonical root files are intentionally few and path-stable:

| File/folder | Responsibility |
|---|---|
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` | contributor behavior and executable gates |
| `CODEGRAPH.md` | current repository routing |
| `STANDARD.md` | ratified normative requirements |
| `second-half-plan/` | current dependency order and issue state |
| `docs/architecture/` | explanatory current architecture |
| `memory/MEMORY.md` | newest-first handoff index |
| source/migrations/tests/workflows | implementation and acceptance truth |

Moving these files merely to reduce visual root count would break scripts, links, and contributor contracts. Organization is maintained through ownership and read-order maps instead.

## Directory map

```text
apps/web/                  owner operating environment and public surfaces
apps/manager/              authority, runtime, connectors, effects, repair, proof
packages/shared/           contracts and connector/capability manifests
packages/db/               migrations, clients, generated types
packages/agent-template/   rendered Hermes profiles, skills, plugins, doctrine
packages/profiles/         profile packages and role definitions
infra/                     topology, deploy, lifecycle, acceptance, release operations
tests/                     unit/source, PostgreSQL, and browser matrices
validation/                Standard, rubric, upstream, and evidence artifacts
docs/architecture/         current cross-system explanation
memory/                    durable handoffs; `MEMORY.md` is the sole index
second-half-plan/          one active production program plus history
```

## Invariants

1. Manager owns authority; Hermes owns runtime cognition/execution.
2. Account membership is not employee assignment authority.
3. Reads do not create effects; authoritative read failure fails closed.
4. Stable retries do not duplicate irreversible effects.
5. Consequential success requires a durable accepted receipt.
6. Provider master credentials stay outside employee profiles/runtimes and caller payloads.
7. Discovery is broad; execution is re-derived from current evidence immediately before dispatch.
8. Generated UI, live streams, and protocol adapters are presentation, not authority.
9. Ambiguous consequential outcomes reconcile before retry.
10. Production-ready means every non-waivable Standard gate passes on the exact signed deployed SHA.
