# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active  
Updated: 2026-07-20  
Current integration baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`  
WS-01/WS-02 implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`

## Cold-session read order

1. [`identity.md`](identity.md)
2. [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md)
3. [`CONTRIBUTING.md`](CONTRIBUTING.md)
4. this file
5. [`mvp-build/AGENTS.md`](mvp-build/AGENTS.md) or [`mvp-build/CLAUDE.md`](mvp-build/CLAUDE.md)
6. [`mvp-build/CODEGRAPH.md`](mvp-build/CODEGRAPH.md)
7. ratified [`mvp-build/STANDARD.md`](mvp-build/STANDARD.md)
8. [`mvp-build/second-half-plan/README.md`](mvp-build/second-half-plan/README.md) and its one active program
9. [`mvp-build/memory/MEMORY.md`](mvp-build/memory/MEMORY.md), then the newest relevant handoff
10. [`mvp-build/docs/architecture/README.md`](mvp-build/docs/architecture/README.md)
11. relevant source, migrations, scripts, tests, workflows, proof, release records, and current diff

Authority order: deployed release-bound proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests and acceptance → ratified Standard/active program → CODEGRAPH/architecture → newest indexed memory → historical records.

## Repository boundary

- `mvp-build/` — AI Employee product code, contracts, migrations, Hermes integration, Manager, Web, connectors, security, tests, deployment, proof, Standard, and active program.
- `wiki/` — strategy, rationale, research, and historical records; not current implementation authority.
- `docs/` — supporting product/design/operating documents.
- `local-prod/` and `scripts/local-prod/` — exact-SHA local-production evidence orchestration.
- `.github/workflows/` — subsystem, archaeology, upstream-intelligence, main-integration, and release gates.

Hyper Site lives in `benamtech/hyper-site` and is not AI Employee authority.

## Canonical product truth

AMTECH installs persistent AI Employees for owner-operated businesses. Manager is the labor control plane; Hermes is the reasoning/runtime substrate.

The moat is a reusable governed-labor protocol spanning identity, assignments, capability and connector manifests, work objects, approval, durable effects, provider receipts, recovery, commercial attribution, and protocol/channel adapters. MCP core, MCP Apps, AG-UI, OAuth providers, models, runtimes, and SaaS systems are replaceable mechanisms. Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.

## Canonical offer

- **Start Free:** one bounded useful AI Employee.
- **Managed AI Employee:** from **$400/month**.
- **Workforce:** custom pricing for multiple roles, locations, approval structures, or higher volume.

The public estimator is outdated and non-canonical.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current relationship, role, grant, policy, entitlement, and authority version
→ stable durable intent, command, event, or work object
→ Hermes reasoning or deterministic processing
→ bounded capability selection and runtime validation
→ approval when required
→ one reserved idempotent external effect
→ accepted | failed | ambiguous durable receipt
→ deterministic replay, reconciliation, or repair
→ role-safe channel/protocol projection
→ audit, metering, commercial attribution, revocation, recovery, and release proof
```

## Current integration and evidence headline

- Current base for new work: current `main`; create reviewed task branches and integrate through PRs.
- Merged post-cutover roadmap: PR `#29`, merge SHA `816aae3`.
- WS-01/WS-02 implementation evidence head: `1460960`.
- Evidence workflows: Ratified Standard `29725298168`, Hermes Upstream Review `29725298172`, Main Integration Gates `29725298163` — success.
- Migration head: `0072`.
- Standard: `mvp-build/STANDARD.md` v0.2, ratified and effective.
- Active program: `mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/`.
- WS-01: source/CI resolved; broad unit passes 106 files / 613 tests with no exclusions.
- WS-02 provider authority: source/CI locked; Manager alone resolves registered provider identity, endpoint, upstream model, and master credentials.
- Remaining WS-02: remote MCP authorization, MCP Apps, AG-UI, persisted effective capability, and live connector lifecycle.
- Contributor contract: `CONTRIBUTING.md`, six-point task rubric, installable hooks, and repository-governance checks.
- Main merge gate: `.github/workflows/main-integration-gates.yml`, including independent broad-unit evidence.
- Hermes upstream review: architecture document 17, pinned baseline, and scheduled/path-triggered CI. The pin is unchanged.
- Canonical deployment authority: `mvp-build/infra/scripts/production-topology.mjs` → `mvp-build/infra/deploy/docker-compose.production.yml`.
- Product status: repository/test and provider-authority source/CI controls accepted; database, target-host, live connector/provider/channel, commercial, recovery, accessibility, capacity, deployment, pilot, and production acceptance remain open.

## Contributor verification

From `mvp-build/`:

```bash
npm ci
npm run hooks:install
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
```

Local hooks provide fast feedback. CI remains authoritative. PRs into `main` run governance, type/lint, named source contracts, broad unit, production build, archaeology, and compiled-browser gates.

## Core invariants

1. Manager owns authority; Hermes reasons and executes only within bound capabilities.
2. Account membership is not employee assignment authority.
3. Reads do not create effects; authoritative failures fail closed.
4. Stable retries do not duplicate irreversible effects.
5. Consequential success requires a durable accepted receipt.
6. Provider master credentials stay outside employee profiles, runtimes, and caller payloads.
7. Runtime callers use only the stable AMTECH model alias; Manager resolves provider routing.
8. Capability discovery is broad; execution custody is conservative and evidence-backed.
9. Generated UI and protocol adapters are presentation, not authority.
10. Ambiguous provider outcomes reconcile before retry.
11. Applied migrations are immutable; corrections are forward migrations.
12. Upstream Hermes drift triggers review, never an automatic production upgrade.
13. Production-ready means every non-waivable Standard gate passes on the exact signed deployed SHA.
