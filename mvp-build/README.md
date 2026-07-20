# mvp-build — AMTECH AI Employee implementation home

Status: **active on current main; WS-01 source/CI closed; not live-accepted or launch-cleared**  
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

- PR `#29` merged the post-cutover roadmap into `main`.
- Current baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`.
- WS-01/WS-02 implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`.
- New work starts on reviewed task branches from current `main`.
- Cutover and `research` branches are historical context.
- Migration head: `0072`.
- Standard: ratified v0.2.
- Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`.
- WS-01 source/CI scope is closed: broad unit passes 106 files / 613 tests with no exclusions.
- WS-02 provider-authority manufacture is locked for source/CI: Manager alone resolves registered provider routing and credentials.
- Current next dependency is the remaining remote MCP, MCP Apps, AG-UI, effective-capability, and live connector lifecycle work.
- Canonical topology: `infra/scripts/production-topology.mjs` → `infra/deploy/docker-compose.production.yml`.

Source/CI does not imply target-host, managed-platform, live identity/connector/provider, fixture-free channel, commercial, recovery, rollback, capacity, deployment, or launch acceptance.

## Product and protocol boundary

AMTECH is governed persistent AI labor, not a generic chat, workflow builder, CRM, or collection of provider integrations.

- Hermes supplies reasoning, runs, session continuity, memory behavior, runtime-local tools, and employee execution.
- Manager owns identity/assignment authority, context/resources, capability/tool contracts, connector custody, provider routing/credential custody, approval, durable command/effect, commercial attribution, repair, and proof.
- Web, SMS, signed Review, MCP Apps, and AG-UI are role-safe projections; they do not create authority.
- Caddy is public ingress; Host Provisioner alone has Docker-host authority; PostgreSQL/Supabase is durable authority/effect state.

The moat is the reusable protocol spanning identity, assignment, capabilities, connectors, work objects, approval, effects, receipts, recovery, and commercial attribution. Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.

## Active production program

- [`second-half-plan/2026-07-19-ratified-standard-production-program/04-dependency-ordered-production-plan.md`](second-half-plan/2026-07-19-ratified-standard-production-program/04-dependency-ordered-production-plan.md) — Phases 1.1–1.9, frozen exact candidate, pilot, expansion.
- [`.../08-production-issue-vector.json`](second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json) — immutable 38-issue baseline vector.
- [`.../13-resolution-ledger.json`](second-half-plan/2026-07-19-ratified-standard-production-program/13-resolution-ledger.json) — current issue/control resolution state.
- [`.../09-workstream-execution-map.md`](second-half-plan/2026-07-19-ratified-standard-production-program/09-workstream-execution-map.md) — nine workstream contracts.
- [`.../10-test-suite-disposition.md`](second-half-plan/2026-07-19-ratified-standard-production-program/10-test-suite-disposition.md) — current test evidence classification and WS-01 closure.

## Connector, capability, and provider rules

- `packages/shared/src/connector-registry.ts` owns connector identity, risk axes, and custody.
- `packages/shared/src/connector-setup.ts` owns setup protocol, exact managed-tool ownership, permissions, hosts, continuation, readiness, and owner copy.
- `apps/manager/src/lib/model-provider-registry.ts` owns registered model-provider profiles and host-private route resolution.
- Runtime model requests use only the stable AMTECH alias.
- Browser/model/MCP Apps/AG-UI payloads cannot select provider identity, endpoint, upstream model, headers, tokens, or credentials.
- Signed Model Gateway claims must match the current durable credential policy.
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

`test:unit` builds shared/database workspace dependencies before running the complete surviving aggregate. Main Integration reports broad unit independently from named source contracts, build, archaeology, and fixture browser regression.

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
6. Provider master credentials stay outside employee profiles/runtimes and caller payloads.
7. Capability discovery is broad; execution custody is conservative and evidence-backed.
8. Generated UI/protocol adapters are presentation, not authority.
9. Ambiguous consequential outcomes reconcile before retry.
10. Production-ready means every non-waivable Standard gate passes on the exact signed deployed SHA.
