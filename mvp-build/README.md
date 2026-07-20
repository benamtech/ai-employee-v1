# mvp-build — AMTECH AI Employee implementation home

Status: **active on current main; Standard v0.2 ratified; not live-accepted or launch-cleared**  
Updated: 2026-07-20

`mvp-build/` contains the executable AI Employee product: owner/channel surfaces, Manager control plane, Hermes runtime integration, PostgreSQL authority/effect state, connector and capability protocols, Model Gateway, provisioning, deployment, tests, and release proof.

## Contributor start

1. Read root [`../CONTRIBUTING.md`](../CONTRIBUTING.md), [`../AGENTS.md`](../AGENTS.md) or [`../CLAUDE.md`](../CLAUDE.md), and [`../CODEGRAPH.md`](../CODEGRAPH.md).
2. Read scoped [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md), then [`CODEGRAPH.md`](CODEGRAPH.md).
3. Read ratified [`STANDARD.md`](STANDARD.md) and [`second-half-plan/README.md`](second-half-plan/README.md).
4. Read only the newest relevant handoff and source/test/proof needed for the task.

```bash
npm ci
npm run hooks:install
npm run repo:verify:quick
```

Authority order: deployed proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests/acceptance → Standard/active program → CODEGRAPH/architecture → newest indexed memory → history.

## Current integration boundary

- PR `#23` merged the cutover into `main` on 2026-07-20.
- Current baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`.
- Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`.
- New work starts on reviewed task branches from current `main`.
- `employee-production-tuesday` and `research` are historical branch context.
- Migration head: `0072`.
- Standard: ratified v0.2.
- Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`.
- Current next phase: Phase 1.1, repository authority and test-contract truth.
- Canonical topology: `infra/scripts/production-topology.mjs` → `infra/deploy/docker-compose.production.yml`.

Gate 0 source/document/CI is resolved on the final cutover evidence head. The broad historical `npm run test:unit` aggregate is separately red; PR `#23` records 30 files and 112 failed tests from stale/migrating fixtures. Source/CI does not imply target-host, managed-platform, live identity/connector/provider, fixture-free channel, commercial, recovery, rollback, capacity, deployment, or launch acceptance.

## Product and protocol boundary

AMTECH is governed persistent AI labor, not a generic chat, workflow builder, CRM, or collection of provider integrations.

- Hermes supplies reasoning, runs, session continuity, memory behavior, runtime-local tools, and employee execution.
- Manager owns identity/assignment authority, context/resources, capability/tool contracts, connector custody, approval, durable command/effect, commercial attribution, repair, and proof.
- Web, SMS, signed Review, MCP Apps, and AG-UI are role-safe projections; they do not create authority.
- Caddy is public ingress; Host Provisioner alone has Docker-host authority; PostgreSQL/Supabase is durable authority/effect state.

The moat is the reusable protocol spanning identity, assignment, capabilities, connectors, work objects, approval, effects, receipts, recovery, and commercial attribution. Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.

## Active production program

- [`second-half-plan/2026-07-19-ratified-standard-production-program/04-dependency-ordered-production-plan.md`](second-half-plan/2026-07-19-ratified-standard-production-program/04-dependency-ordered-production-plan.md) — Phases 1.1–1.9, frozen exact candidate, pilot, expansion.
- [`.../08-production-issue-vector.json`](second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json) — machine-readable 38-issue vector.
- [`.../09-workstream-execution-map.md`](second-half-plan/2026-07-19-ratified-standard-production-program/09-workstream-execution-map.md) — nine workstream contracts.
- [`.../10-test-suite-disposition.md`](second-half-plan/2026-07-19-ratified-standard-production-program/10-test-suite-disposition.md) — current test evidence classification.

## Connector and capability rules

- `packages/shared/src/connector-registry.ts` owns connector identity, risk axes, and custody.
- `packages/shared/src/connector-setup.ts` owns setup protocol, exact managed-tool ownership, permissions, hosts, continuation, readiness, and owner copy.
- Capability discovery spans Manager MCP, explicitly safe direct MCP, and runtime-native tools.
- Unknown or stale evidence fails closed.
- Direct MCP requires write, money, and customer-facing risk axes explicitly false.
- Broad categories never select provider identity, credentials, account rows, scopes, or setup flow.
- MCP Apps and AG-UI remain bounded adapters, not authority planes.

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

The named curated main gate and broad unit aggregate are separate claims. Phase 1.1 must normalize the broad aggregate without weakening current invariants.

Routine database engineering uses production-shaped local/CI PostgreSQL for the full ledger, constraints, RLS/grants/functions, negative isolation, concurrency, backfills, and rollback. Disposable managed Supabase is required only for material platform-specific or release-candidate behavior. Production is never the routine test target.

## Hermes upstream intelligence

Production remains pinned to an approved Hermes image and immutable digest. Before runtime-, profile-, session-, gateway-, capability-, or Hermes-derived UI changes, run:

```bash
npm run hermes:upstream:check
```

See [`docs/architecture/17-hermes-upstream-review-protocol.md`](docs/architecture/17-hermes-upstream-review-protocol.md). Upstream drift triggers review; it never automatically upgrades production. Do not run the check merely because a session starts.

## Directory map

```text
apps/web/                  owner, review, onboarding, public, admin surfaces
apps/manager/              control plane, tools, events, Hermes, gateway, provisioning
packages/shared/           contracts, connector/capability manifests, finite vocabularies
packages/db/               migrations, clients, generated database types
packages/agent-template/   rendered Hermes profiles, skills, plugins, doctrine
packages/profiles/         profile packages and role definitions
infra/                     Docker, Caddy, deploy, lifecycle, acceptance, release operations
tests/                     unit/source, PostgreSQL, and browser matrices
validation/                machine-readable Standard, rubric, upstream, and evidence artifacts
docs/architecture/         current cross-system map and research disposition
memory/                    durable dated handoffs; MEMORY.md is sole index
second-half-plan/          one active production program plus history
```

## Invariants

1. Manager owns authority; Hermes owns runtime cognition/execution.
2. Account membership is not employee assignment authority.
3. Reads do not create effects; authoritative read failure fails closed.
4. Stable retries do not duplicate irreversible effects.
5. Consequential success requires a durable accepted receipt.
6. Provider master credentials stay outside employee profiles/runtimes.
7. Capability discovery is broad; execution custody is conservative and evidence-backed.
8. Generated UI/protocol adapters are presentation, not authority.
9. Ambiguous consequential outcomes reconcile before retry.
10. Production-ready means every non-waivable Standard gate passes on the exact signed deployed SHA.
