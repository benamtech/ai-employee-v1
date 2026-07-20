# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Current baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`  
WS-01/WS-02 implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Migration head: `0072`  
Standard: v0.2 ratified and effective  
Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`

Exact workflow IDs belong in the active PR/release record after branch movement stops. Documentation never inherits acceptance from an ancestor SHA.

## Cold start

1. root identity, `AGENTS.md`/`CLAUDE.md`, `CONTRIBUTING.md`, and `CODEGRAPH.md`;
2. scoped `AGENTS.md`/`CLAUDE.md` and this file;
3. ratified `STANDARD.md` and the one active program;
4. newest relevant indexed handoff;
5. applicable architecture, source, migrations, tests, workflows, proof, and diff.

Authority order: deployed proof → applied migrations/durable state → executable source/config → exact-SHA tests → Standard/active program → CODEGRAPH/architecture → indexed memory → history.

## Product boundary

- Hermes owns employee reasoning, runs, sessions, runtime-local memory/tool use, and runtime recovery.
- Manager owns identity, assignments, authority, capability/tool contracts, connector custody, approvals, durable effects, commercial attribution, revocation, repair, and proof.
- Model Gateway owns scoped model access and provider/commercial evidence.
- Host Provisioner alone owns Docker-host authority.
- Web, SMS, signed Review, MCP Apps, and AG-UI are role-safe projections, not authority.
- PostgreSQL/Supabase is durable authority, event, evidence, commercial, and reconciliation state.

The moat is the AMTECH labor protocol: assignment → work object → authority → approval → effect → receipt → recovery → commercial proof. Gmail, QuickBooks, and Stripe are adapters, not the connector ontology.

## Canonical effect boundary

```text
trigger → authenticated principal → exact assignment/policy
→ durable intent/command/event/work object → Hermes or deterministic work
→ evidence-backed capability → approval when required
→ one reserved idempotent effect → accepted | failed | ambiguous receipt
→ replay/reconciliation/repair → role-safe projection → audit and proof
```

## Current status

**`standard_v0_2_ratified__migration_0072__ws01_broad_106_files_613_tests_green__provider_authority_manager_locked__remote_protocol_and_live_gates_open__not_launch_cleared`**

Implementation head `1460960` passed Ratified Standard workflow `29725298168`, Hermes upstream review `29725298172`, and Main Integration Gates `29725298163`, including source contracts, broad unit, production build, archaeology, and compiled Chromium fixtures.

WS-01 is complete for source/CI scope. The full surviving aggregate passes 106 files and 613 tests without exclusions. Twenty-seven obsolete pre-assignment/account-owned/direct-provider suites were deleted atomically; reusable assertions were repaired to current contracts.

The WS-02 provider-authority manufacture surface is locked for source/CI scope. Runtime callers use only the stable AMTECH alias. Manager resolves registered provider identity, endpoint, master credential, and upstream model. Caller-supplied routing or credential fields fail before dispatch, and signed claims must match the current durable credential policy.

## Active production map

- Baseline issue vector: `second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json`.
- Resolution ledger: `.../13-resolution-ledger.json`.
- Workstreams: `.../09-workstream-execution-map.md`.
- Test authority: `.../10-test-suite-disposition.md`.
- Roadmap: `.../04-dependency-ordered-production-plan.md`, Phases 1.1–1.9, frozen release candidate, controlled pilot, measured expansion.

## Runtime topology

Public Caddy routes to loopback Web, Manager, and employee gateways. Manager reaches Host Provisioner over a signed Unix socket; only Host Provisioner has the Docker socket. Each employee has an isolated Hermes network/data/workspace plus scoped Manager and Model Gateway access.

Canonical sources: `infra/deploy/docker-compose.production.yml`, `infra/scripts/production-topology.mjs`, `infra/caddy/production.Caddyfile`, provisioner host/client, profile renderer, provisioning reconciler, Model Gateway, and the model-provider registry.

## Subsystem source hubs

| Boundary | Primary hubs | Open acceptance |
|---|---|---|
| repository/test truth | contributor/governance contracts, active program, canonical broad merge gate | source/CI closed; preserve exact-head evidence discipline |
| identity/assignment | relationship, assignment, authorization, authority-version contracts; owner authority/session; migrations `0039`–`0069`, `0071` | fixture-free live policy/role/channel proof |
| command/effect/artifact | command-effect, durable command, approval, repair, artifact workbench; migrations `0041`, `0048`–`0054`, `0061`, `0070`–`0072` | provider ambiguity, output parity, crash repair, proof refinding |
| connectors/events | connector registry/setup/custody, capability registry/catalog, event ingress, ambient inbox, webhooks; migrations `0032`–`0038`, `0043`–`0047` | remote MCP auth, MCP Apps, live authorization/health/revocation/reconciliation |
| model/provider authority | Model Gateway core/HTTP/server and `model-provider-registry.ts` | source/CI lock accepted; provider-backed and target-host proof open |
| model/commercial | commercial attribution and Model Gateway receipts | cumulative budget, shared rate, provider ambiguity, invoice reconciliation |
| provisioning/runtime | reconciler, provisioner host/client, profile renderer/integrity, Caddy activation, topology | managed secrets, target-host isolation/lifecycle, rotation, rollback |
| Hermes/context/MCP | Hermes client, Manager MCP, business brain, profile context, capability evidence; migration `0070` | persisted effective capability and release-bound reconciliation |
| owner/generated UI | strict stream, operating surface, materialization, UI resources, AgentSurface and work renderers | fixture-free Web/SMS/Review, accessibility, supported browsers, recovery UX |
| release/operations | acceptance scripts, proof spine, deploy/rollback/backup/capacity | signed exact-candidate release, recovery, capacity, controlled pilot |

Connector identity, risk, custody, exact tool ownership, readiness, setup protocol, scopes, hosts, and continuation are declarative. Unknown or stale evidence fails closed. Broad categories and caller payloads never select provider identity or credentials.

Production Hermes remains pinned. `validation/hermes-upstream-baseline.json`, `scripts/check-hermes-upstream.mjs`, architecture document 17, and the upstream workflow provide review intelligence without automatic upgrades.

## Migration and database evidence

Applied migrations are immutable; corrections use forward migrations. Current head is `0072`.

Evidence ladder:

1. pure contract/unit tests;
2. production-shaped local/CI PostgreSQL for full ledger, RLS/grants/functions, concurrency, races, and negative isolation;
3. compiled application/browser tests;
4. disposable managed Supabase for material platform-specific/final-candidate behavior;
5. target-host/provider acceptance;
6. production monitoring and reconciliation.

## Not accepted yet

- required managed-Supabase platform/final-candidate proof;
- production secret custody and rotation;
- target-host five-service and two-employee isolation/lifecycle;
- remote MCP authorization, official MCP Apps, persisted effective-capability truth, and full AG-UI conformance;
- live connector authorization/health/revocation/failure-path proof;
- live identity/provider and fixture-free Web/SMS/Review acceptance;
- provider-backed generated UI through effect, parity, and refindable proof;
- cumulative budgets, shared rates, provider ambiguity, and commercial reconciliation;
- complete crash repair, backup/restore, and rollback;
- accessibility, supported-browser, visual, capacity/fairness, controlled-pilot, SBOM/provenance, signed deployment, and exact deployment.

## Next dependency order

1. finish remaining Phase 1.2 remote protocol/capability/live connector work without reopening provider authority;
2. Phase 1.3 database authority;
3. Phase 1.4 secrets/target-host/runtime custody;
4. Phase 1.5 fixture-free owner/channels;
5. Phase 1.6 golden governed work;
6. Phase 1.7 commercial/rate/ambiguity controls;
7. Phase 1.8 crash/rollback/signed release;
8. Phase 1.9 human surfaces/capacity/pilot preparation;
9. frozen exact candidate, controlled pilot, measured fleet expansion.

`STANDARD.md`, the active production program, and exact executable evidence decide whether a gate is closed.
