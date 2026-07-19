# mvp-build — AMTECH AI Employee implementation home

Status: **active integration; source/CI work in progress; not live-accepted or launch-cleared**  
Updated: 2026-07-19

`mvp-build/` contains the executable AMTECH AI Employee product: owner surfaces, Manager control plane, Hermes runtime integration, PostgreSQL authority/effect state, connectors, ambient inbox, Model Gateway, provisioning, deployment, tests, and release proof.

## Agent start

Read in this order:

1. [`../identity.md`](../identity.md)
2. root [`../AGENTS.md`](../AGENTS.md) or [`../CLAUDE.md`](../CLAUDE.md), then root [`../CODEGRAPH.md`](../CODEGRAPH.md)
3. scoped [`AGENTS.md`](AGENTS.md) or [`CLAUDE.md`](CLAUDE.md)
4. [`CODEGRAPH.md`](CODEGRAPH.md)
5. [`memory/MEMORY.md`](memory/MEMORY.md), then the newest relevant handoff
6. [`STANDARD.md`](STANDARD.md)
7. [`second-half-plan/phase-2-standard-remediation-execution.md`](second-half-plan/phase-2-standard-remediation-execution.md)
8. [`docs/architecture/README.md`](docs/architecture/README.md)
9. [`docs/architecture/11-agent-orientation-and-role-map.md`](docs/architecture/11-agent-orientation-and-role-map.md)
10. applicable [`docs/ux/`](docs/ux/), deployment/runbook, source, migrations, scripts, tests, workflows, proof, and current diff

Source, applied migrations, executable proof, and newest scoped memory outrank historical prose.

## Current branch boundary

- Integration branch: `employee-production-tuesday`
- Base: `research`
- Draft integration PR: `#23`
- Migration head: `0069`
- `main` remains outside the integration shortcut
- The exact current implementation/proof anchor and workflow IDs live in `CODEGRAPH.md`, the newest handoff, and PR `#23`
- Real Supabase, target-host runtime/network, live identity/provider, fixture-free Web/SMS/Review, commercial reconciliation, cumulative budgets/shared rate limits, fleet capacity/fairness, crash/repair, rollback, attestation, deployment, and launch acceptance remain separate live gates unless named evidence closes them

Do not count fixtures, `/api/dev/login`, local `live:*`, manually injected provider results, or `prod-like:public-estimator:*` as launch proof.

## Canonical normal-employee path

Use [`docs/production-normal-employee-live-deploy-runbook.md`](docs/production-normal-employee-live-deploy-runbook.md).

```text
public DNS / approved ingress
→ Caddy
→ production Web + Manager
→ real owner authentication and identity verification
→ canonical activation
→ durable desired-resource graph and reconciler
→ isolated Hermes runtime + scoped Manager/Model Gateway access
→ owner Web/SMS/Review
→ governed provider-backed work
→ durable receipts, proof, recovery, and release evidence
```

## Architecture and documentation map

- [`docs/architecture/README.md`](docs/architecture/README.md) — current source-backed cross-system map.
- [`docs/architecture/09-current-bug-risk-and-production-gap-register.md`](docs/architecture/09-current-bug-risk-and-production-gap-register.md) — current P0/P1/P2 register.
- [`docs/architecture/trajectories/`](docs/architecture/trajectories/) — source-grounded dependency/bifurcation analysis; never acceptance authority.
- [`docs/architecture/11-agent-orientation-and-role-map.md`](docs/architecture/11-agent-orientation-and-role-map.md) — role-specific source hubs, invariants, and proof requirements.
- [`docs/architecture/12-document-control-memory-and-handoff-map.md`](docs/architecture/12-document-control-memory-and-handoff-map.md) — root/scoped CODEGRAPH, memory, plans, implementation records, and Markdown organization.
- [`docs/ux/`](docs/ux/) — owner UX system, coverage audit, validation, fixture policy, research disposition, and Hermes/UI decision records.
- [`memory/MEMORY.md`](memory/MEMORY.md) — sole newest-first handoff index.
- [`../wiki/MVP/implementation-records/README.md`](../wiki/MVP/implementation-records/README.md) — historical factual implementation records.

Historical handoffs and implementation records stay in place to preserve point-in-time evidence and links. Current indexes tell agents what to read first.

## Product and runtime boundary

AMTECH is not selling a model, estimate generator, developer dashboard, CRM, or workflow builder. AMTECH packages Hermes into a managed employee for owner-operated businesses.

- Hermes supplies reasoning, sessions/runs, transcript continuity, memory behavior, runtime-local tools, and employee execution.
- Manager supplies identity/assignment authority, business context/resources, tool schemas, connector/secret custody, approval, command/effect, commercial attribution, repair, and proof.
- Web presents the primary owner operating surface; SMS and signed Review render the same durable work/resources/actions.
- Caddy is public ingress; Host Provisioner is the only service with Docker-host authority; PostgreSQL/Supabase is durable authority/effect state.

Canonical consequential flow:

```text
trigger
→ authenticated principal
→ exact assignment / current grant / policy
→ stable intent and durable command
→ Hermes or deterministic work
→ approval when required
→ bounded external effect
→ accepted / failed / ambiguous receipt
→ repair/replay when needed
→ owner-safe work and proof
```

## Current source capabilities

The branch contains source and tests for:

- relationship, assignment, grant, policy, and authority-version boundaries;
- durable C3 command/effect and ambiguous repair;
- onboarding identity and canonical activation through migration `0069`;
- scoped owner sessions, previews, artifacts, and MCP credentials;
- Gmail, QuickBooks, Stripe, Twilio, connector custody, ambient inbox, and provider event normalization;
- payer/beneficiary/price attribution, Model Gateway, provider/accounting receipts, and usage audit;
- desired resource graphs, reconciler, signed Unix-socket Host Provisioner, profile checksums, isolated employee networks, and Caddy routes;
- task-agnostic operating surface, strict snapshots/context reads, SSE, WorkResource/WorkAction materialization, typed generated UI, and sandboxed host-routed intents;
- admin/support authority, audit, metering, recovery tooling, local-production orchestration, and release-evidence contracts;
- exact-head repository archaeology that reads every tracked Git object and emits file/effect/relationship ledgers.

See `CODEGRAPH.md` and the architecture map for exact source hubs and evidence tiers.

## UI development

```bash
npm run ui:dev
npm run ui:browser
npm run ui:test
npm run ui:test:shell
```

These fixture/product-shell commands are development and CI evidence only. Fixture mode is visibly labeled and guarded from production-like environments. Live generative-UI acceptance requires a provider-backed Hermes run, typed Manager-compiled work view, exact owner action, external effect, and durable proof.

## Development baseline

```bash
npm ci
npm run typecheck
npm run test:unit
npm run build
npm run lint
npm run test:integration   # environment-gated
```

Use targeted checks during a narrow change, then run every integrated workflow required by the changed boundary on the exact branch head.

## Directory map

```text
apps/web/                  owner, review, onboarding, public, admin surfaces
apps/manager/              Manager API, tools, events, Hermes, Model Gateway, provisioning
packages/shared/           contracts, schemas, finite vocabularies, evidence types
packages/db/               migrations, clients, generated database types
packages/agent-template/   rendered Hermes profiles, skills, plugins, doctrine
packages/profiles/         profile packages and role definitions
infra/deploy/              production images and Compose topology
infra/caddy/               public/static and per-employee ingress
infra/scripts/             local, deploy, lifecycle, repair, acceptance, release operations
tests/unit/                deterministic/source/contract gates
tests/integration/         PostgreSQL, authority, concurrency, receipt matrices
docs/architecture/         current cross-system map and production trajectories
docs/ux/                   owner UX doctrine and validation
memory/                    durable session handoffs
second-half-plan/          active execution program plus historical phase family
validation/                machine-readable remediation/acceptance vectors
```

## Invariants

1. Manager owns authority; Hermes owns runtime cognition/execution.
2. Account membership is not employee assignment authority.
3. Reads do not create effects, and authoritative read failures fail closed.
4. Stable retries do not create duplicate irreversible effects.
5. Consequential success requires a durable accepted receipt.
6. Provider master credentials stay outside employee profiles/runtimes.
7. Generated UI is presentation; the host resolves current actions and durable resources.
8. Research/trajectory artifacts cannot create a second renderer, runtime, authority, or production claim.
9. Historical records remain historical; current state is synchronized through CODEGRAPH, architecture, memory, PR, and exact-head proof.
10. Production-ready means every non-waivable Standard gate passes on the exact deployed SHA.
