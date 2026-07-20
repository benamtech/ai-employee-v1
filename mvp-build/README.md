# mvp-build — AMTECH AI Employee implementation home

Status: **active integration; Standard v0.2 ratified; not live-accepted or launch-cleared**  
Updated: 2026-07-19

`mvp-build/` contains the executable AI Employee product: owner/channel surfaces, Manager control plane, Hermes runtime integration, PostgreSQL authority/effect state, connector and capability protocols, Model Gateway, provisioning, deployment, tests, and release proof.

## Agent start

1. [`../identity.md`](../identity.md)
2. root [`../AGENTS.md`](../AGENTS.md) or [`../CLAUDE.md`](../CLAUDE.md), then root [`../CODEGRAPH.md`](../CODEGRAPH.md)
3. scoped [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md)
4. [`CODEGRAPH.md`](CODEGRAPH.md)
5. ratified [`STANDARD.md`](STANDARD.md)
6. [`second-half-plan/README.md`](second-half-plan/README.md) and its single active production program
7. [`memory/MEMORY.md`](memory/MEMORY.md), then the newest relevant handoff
8. [`docs/architecture/README.md`](docs/architecture/README.md)
9. applicable source, migrations, scripts, tests, workflows, proof, runbooks, and current diff

Authority order: deployed release-bound proof → applied migrations/durable state → executable source/generated production config → exact-SHA tests and acceptance → ratified Standard/active program → CODEGRAPH/architecture → newest indexed memory → historical records.

## Current branch boundary

- Integration branch: `employee-production-tuesday`
- Base: `research`
- Draft integration PR: `#23`
- Migration head: `0072`
- Standard: ratified v0.2
- Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`
- Canonical topology: `infra/scripts/production-topology.mjs` → `infra/deploy/docker-compose.production.yml`
- `main` remains outside the integration shortcut
- Exact current implementation/proof head and workflow IDs belong in PR `#23` and the newest indexed handoff after branch movement stops

Source/CI does not imply target-host, managed-platform, live identity/connector/provider, fixture-free channel, commercial, recovery, rollback, capacity, deployment, or launch acceptance.

## Product and protocol boundary

AMTECH is governed persistent AI labor, not a generic chat, workflow builder, CRM, or collection of provider integrations.

- Hermes supplies reasoning, sessions/runs, transcript continuity, memory behavior, runtime-local tools, and employee execution.
- Manager supplies identity/assignment authority, context/resources, capability/tool contracts, connector/secret custody, approval, durable command/effect, commercial attribution, repair, and proof.
- Web, SMS, signed Review, MCP Apps, and AG-UI adapters are role-safe projections; they do not create authority.
- Caddy is public ingress; Host Provisioner alone has Docker-host authority; PostgreSQL/Supabase is durable authority/effect state.

The moat is the reusable protocol spanning identity, assignment, capabilities, connectors, work objects, approval, effects, receipts, recovery, and commercial attribution. Gmail, QuickBooks, and Stripe are shipped adapters, not the connector ontology.

## Connector and capability rules

- `packages/shared/src/connector-registry.ts` owns connector identity, risk axes, and custody derivation.
- `packages/shared/src/connector-setup.ts` owns actual setup protocol, exact provider-tool ownership, scopes/permissions, allowed hosts, continuation, readiness evidence, and owner copy.
- Capability discovery spans Manager MCP, explicitly safe direct MCP, and runtime-native tools.
- Unknown/underspecified connectors default to Manager mediation.
- Direct MCP requires every write/money/customer-facing axis explicitly false.
- Broad categories never select provider identity, credentials, account rows, scopes, or setup flow.
- MCP Apps is the official interactive MCP target; current MCP-UI-shaped code is compatibility groundwork until conformance passes.
- AG-UI is an optional event/state adapter, not authority or a generated-UI schema.

## Canonical normal-employee path

Use [`docs/production-normal-employee-live-deploy-runbook.md`](docs/production-normal-employee-live-deploy-runbook.md), verified against current CODEGRAPH and the active program.

```text
approved ingress
→ Caddy
→ Web + Manager
→ real owner identity and explicit assignment
→ durable desired resources and reconciler
→ isolated Hermes runtime + scoped Manager/Model Gateway
→ effective capability evidence and managed connector authorization
→ governed owner work
→ approval and one bounded effect when required
→ provider/effect/accounting receipts
→ owner-refindable proof, recovery, and release evidence
```

## Architecture and documentation map

- [`STANDARD.md`](STANDARD.md) — ratified non-waivable requirements.
- [`validation/standard-v0.2-evolution-vector.json`](validation/standard-v0.2-evolution-vector.json) — original-to-ratified motion and implementation/supersession map.
- [`second-half-plan/README.md`](second-half-plan/README.md) — sole active-plan selector.
- [`docs/architecture/README.md`](docs/architecture/README.md) — current cross-system map.
- [`docs/architecture/16-standard-research-basis-and-protocol-disposition.md`](docs/architecture/16-standard-research-basis-and-protocol-disposition.md) — external standards and protocol decisions.
- [`docs/architecture/12-document-control-memory-and-handoff-map.md`](docs/architecture/12-document-control-memory-and-handoff-map.md) — document authority.
- [`memory/MEMORY.md`](memory/MEMORY.md) — sole handoff index.
- [`../wiki/MVP/README.md`](../wiki/MVP/README.md) — wiki strategy/history routing.

Historical plans and records stay in place. Their indexes and banners route current work here.

## Database evidence policy

Routine database engineering uses production-shaped local/CI PostgreSQL:

- full migration ledger from blank;
- existing-row/backfill compatibility;
- constraints, triggers, indexes, grants, RLS, functions, and negative isolation;
- concurrency, races, compare-and-swap, rollback, and retry behavior;
- migration hashes and deterministic diagnostics.

Disposable managed Supabase is required only when material platform-specific Auth, Realtime, Storage, Data API, advisor, security-sensitive browser behavior, suspected platform differences, new release migration classes, or the final release candidate is under test. Production is never the routine test target.

## Development baseline

```bash
npm ci
npm run test:standard
npm run typecheck
npm run test:unit
npm run test:production-boundary
npm run build
npm run lint
npm run test:integration   # environment-gated; report skip as skip
```

Use targeted checks during narrow work, then run every required exact-head workflow before updating proof state.

## Directory map

```text
apps/web/                  owner, review, onboarding, public, admin surfaces
apps/manager/              control plane, tools, events, Hermes, gateway, provisioning
packages/shared/           contracts, connector/capability manifests, finite vocabularies
packages/db/               migrations, clients, generated database types
packages/agent-template/   rendered Hermes profiles, skills, plugins, doctrine
packages/profiles/         profile packages and role definitions
infra/deploy/              production images and Compose topology
infra/caddy/               public/static and per-employee ingress
infra/scripts/             local, deploy, lifecycle, repair, acceptance, release operations
tests/unit/                deterministic/source/contract gates
tests/integration/         PostgreSQL, authority, concurrency, receipt matrices
validation/                machine-readable Standard/remediation/acceptance vectors
docs/architecture/         current cross-system map and research disposition
docs/ux/                   owner UX doctrine and validation
memory/                    durable dated handoffs; MEMORY.md is sole index
second-half-plan/          one active production program plus history
```

## Invariants

1. Manager owns authority; Hermes owns runtime cognition/execution.
2. Account membership is not employee assignment authority.
3. Reads do not create effects; authoritative read failures fail closed.
4. Stable retries do not create duplicate irreversible effects.
5. Consequential success requires a durable accepted receipt.
6. Provider master credentials stay outside employee profiles/runtimes.
7. Capability discovery is broad; execution custody is conservative and evidence-backed.
8. Generated UI/protocol adapters are presentation, not authority.
9. Ambiguous consequential outcomes reconcile before retry.
10. Historical records remain historical; current status is exact-SHA and index-routed.
11. Production-ready means every non-waivable Standard gate passes on the exact deployed SHA.
12. No agent edits `main`, weakens tests to obtain green, or reports untested code as complete.
