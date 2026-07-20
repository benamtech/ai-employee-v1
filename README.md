# AMTECH AI Employee v1

AMTECH builds persistent AI Employees for owner-operated businesses. The product behaves like an employee operating environment: durable workspaces, streaming conversation and activity, connected systems, approvals, contextual apps, artifacts, receipts, proof, and recovery. Manager is the control plane; Hermes is the managed reasoning/runtime substrate.

This repository contains the AI Employee implementation and company/product brain. Hyper Site lives independently in `benamtech/hyper-site`.

## Start here

1. [`identity.md`](identity.md)
2. [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md)
3. [`CONTRIBUTING.md`](CONTRIBUTING.md)
4. root [`CODEGRAPH.md`](CODEGRAPH.md)
5. scoped [`mvp-build/AGENTS.md`](mvp-build/AGENTS.md) or [`mvp-build/CLAUDE.md`](mvp-build/CLAUDE.md)
6. [`mvp-build/CODEGRAPH.md`](mvp-build/CODEGRAPH.md)
7. ratified [`mvp-build/STANDARD.md`](mvp-build/STANDARD.md)
8. active [`mvp-build/production-readiness-program/README.md`](mvp-build/production-readiness-program/README.md)
9. [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md), then only the newest relevant handoff
10. relevant source, migrations, scripts, executable tests, workflows, proof, PRs, and current diff

`mvp-build/second-half-plan/` is historical and non-canonical. Current source, applied migrations, executable proof, and exact-head evidence outrank prose.

## Contributor setup

```bash
git fetch origin
git switch -c task/<task-id> origin/main
cd mvp-build
npm ci
npm run hooks:install
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
```

Before pushing, run `npm run repo:verify:full`. CI is authoritative only for the exact run and exact SHA it exercised.

## Product and offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month**.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is outdated and non-canonical.

## Product moat

AMTECH's defensibility is the reusable labor protocol joining stable employee identity, explicit assignments, scoped authority, connector/capability manifests, durable work revisions, approval snapshots, idempotent effects, terminal receipts, repair, refindable proof, commercial attribution, and bounded MCP Apps, AG-UI, Web, SMS, signed Review, and future-channel projections.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact account / employee / assignment / current policy / authority version
→ stable durable intent and work revision
→ Hermes reasoning or deterministic Manager work
→ current effective-capability intersection
→ approval bound to the exact revision when required
→ one reserved idempotent external effect
→ accepted, failed, or ambiguous durable receipt
→ deterministic reconciliation or replay-safe repair
→ role-safe channel/protocol projection and refindable proof
```

## Current integration state

- Current main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- PR #33/source/tests are newer authority than stale plan-status prose, but establish only their exact source/test boundary.
- Active program: `mvp-build/production-readiness-program/`.
- WS-05 and WS-06 remain incomplete without exact fixture-free owner login/account/employee selection, connector state, atomic snapshot/ordered delta/reconnect, Web/SMS/signed Review convergence, strict cross-account denial, durable work continuity, one effect, terminal receipt, replay-safe recovery, and proof refinding.
- WS-07, WS-08, and WS-09 remain downstream and are not independently implemented by current WS-05/WS-06 work.
- Migration head remains `0072` unless current source proves otherwise. Standard v0.2 remains ratified.
- Exact-head CI, database, target-host, live provider/channel, commercial, recovery, accessibility, capacity, deployment, pilot, and production acceptance remain distinct and open unless exact current evidence closes them.

## Repository ownership map

| Location | Owns | Does not own |
|---|---|---|
| `identity.md` | company/product identity | implementation status |
| `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md` | contributor rules and gates | subsystem design |
| `CODEGRAPH.md` | repository routing/current topology | normative product requirements |
| `mvp-build/STANDARD.md` | ratified non-waivable requirements | current evidence coordinates |
| `mvp-build/production-readiness-program/` | issue state, dependency order, workstream/test contracts | historical narrative |
| `mvp-build/second-half-plan/` | historical plans | current execution authority |
| `mvp-build/docs/architecture/` | current explanatory architecture | execution order |
| `mvp-build/memory/MEMORY.md` | newest-first handoff index | normative authority |
| source/migrations/tests/workflows/proof | executable and acceptance truth | strategy prose |
| `wiki/` | strategy, research, historical records | current implementation authority |

## Core invariants

1. Every consequential action is assignment-scoped or explicitly approved platform/system work.
2. Account membership, bearer possession, caller-selected identifiers, mutable headers, and phone ownership are incomplete authority.
3. Initial snapshots install atomically only after exact scope validation; cursor/version precedes ordered deltas.
4. Reconnect never resubmits accepted owner intent.
5. Stable retries do not duplicate irreversible effects.
6. Consequential success requires a matching durable accepted receipt.
7. Provider master credentials never enter employee profiles or runtimes.
8. Hermes remains runtime; Manager owns authority, effect, custody, repair, and proof.
9. Generated UI, streaming state, and protocol adapters are projections, not authority.
10. Ambiguous outcomes reconcile before retry.
11. Tests are not weakened to obtain green.
12. Production-ready means every non-waivable Standard gate passes on one exact signed deployed release.
