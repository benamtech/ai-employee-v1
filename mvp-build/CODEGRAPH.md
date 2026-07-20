# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Current baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`  
Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`; PR `#23` merged  
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

**`standard_v0_2_ratified__migration_0072__cutover_merged_to_main__gate_0_final_head_ci_accepted__broad_unit_aggregate_red__phase_1_1_repository_and_test_truth_next__not_live_accepted__not_launch_cleared`**

Final cutover head `d131dd09` passed Ratified Standard workflow `29717830698`, Hermes upstream review `29717830703`, and Main Integration Gates `29717830737`. Merge SHA `5e5b8d7` is the current `main` coordinate.

The broad historical `npm run test:unit` aggregate is not green. PR `#23` records 30 files and 112 failed tests from stale/migrating assignment, principal, fake-RPC, and environment fixtures. Phase 1.1 must normalize that aggregate and repair any real defects without weakening current contracts.

## Active production map

- Issue vector: `second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json`.
- Workstreams: `.../09-workstream-execution-map.md`.
- Test authority: `.../10-test-suite-disposition.md`.
- Roadmap: `.../04-dependency-ordered-production-plan.md`, Phases 1.1–1.9, frozen release candidate, controlled pilot, measured expansion.

## Runtime topology

Public Caddy routes to loopback Web, Manager, and employee gateways. Manager reaches Host Provisioner over a signed Unix socket; only Host Provisioner has the Docker socket. Each employee has an isolated Hermes network/data/workspace plus scoped Manager and Model Gateway access.

Canonical sources: `infra/deploy/docker-compose.production.yml`, `infra/scripts/production-topology.mjs`, `infra/caddy/production.Caddyfile`, provisioner host/client, profile renderer, and provisioning reconciler.

## Subsystem source hubs

| Boundary | Primary hubs | Open acceptance |
|---|---|---|
| identity/assignment | relationship, assignment, authorization, authority-version contracts; owner authority/session; migrations `0039`–`0069`, `0071` | fixture-free live policy/role/channel proof |
| command/effect/artifact | command-effect, durable command, approval, repair, artifact workbench; migrations `0041`, `0048`–`0054`, `0061`, `0070`–`0072` | provider ambiguity, output parity, crash repair, proof refinding |
| connectors/events | connector registry/setup/custody, capability registry/catalog, event ingress, ambient inbox, webhooks; migrations `0032`–`0038`, `0043`–`0047` | remote MCP auth, MCP Apps, live authorization/health/revocation/reconciliation |
| model/commercial | commercial attribution and Model Gateway core/HTTP/server | cumulative budget, shared rate, provider ambiguity, invoice reconciliation |
| provisioning/runtime | reconciler, provisioner host/client, profile renderer/integrity, Caddy activation, topology | managed secrets, target-host isolation/lifecycle, rotation, rollback |
| Hermes/context/MCP | Hermes client, Manager MCP, business brain, profile context, capability evidence; migration `0070` | persisted effective capability and release-bound reconciliation |
| owner/generated UI | strict stream, operating surface, materialization, UI resources, AgentSurface and work renderers | fixture-free Web/SMS/Review, accessibility, supported browsers, recovery UX |
| governance/tests | contributor contract, rubric/hooks/governance scripts, active roadmap, main integration workflow | post-merge metadata transaction and broad unit normalization |
| release/operations | acceptance scripts, proof spine, deploy/rollback/backup/capacity | signed exact-candidate release, recovery, capacity, controlled pilot |

Connector identity, risk, custody, exact tool ownership, readiness, setup protocol, scopes, hosts, and continuation are declarative. Unknown or stale evidence fails closed. Broad categories never select provider identity.

Production Hermes remains pinned. `validation/hermes-upstream-baseline.json`, `scripts/check-hermes-upstream.mjs`, architecture document 17, and the upstream workflow provide review intelligence without automatic upgrades. Planning/document work outside watched Hermes boundaries does not require an ad hoc upstream run.

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

- trustworthy green broad unit aggregate;
- required managed-Supabase platform/final-candidate proof;
- production secret custody and rotation;
- target-host five-service and two-employee isolation/lifecycle;
- remote MCP authorization, official MCP Apps, and full AG-UI conformance;
- live identity/connector/provider and fixture-free Web/SMS/Review acceptance;
- provider-backed generated UI through effect, parity, and refindable proof;
- cumulative budgets, shared rates, provider ambiguity, and commercial reconciliation;
- complete crash repair, backup/restore, and rollback;
- accessibility, supported-browser, visual, capacity/fairness, controlled-pilot, SBOM/provenance, signed deployment, and exact deployment.

## Next dependency order

1. Phase 1.1 repository authority and broad test-contract truth;
2. Phase 1.2 connector/protocol/capability truth;
3. Phase 1.3 database authority;
4. Phase 1.4 secrets/target-host/runtime custody;
5. Phase 1.5 fixture-free owner/channels;
6. Phase 1.6 golden governed work;
7. Phase 1.7 commercial/rate/ambiguity controls;
8. Phase 1.8 crash/rollback/signed release;
9. Phase 1.9 human surfaces/capacity/pilot preparation;
10. frozen exact candidate, controlled pilot, measured fleet expansion.

`STANDARD.md`, the active production program, and exact executable evidence decide whether a gate is closed.
