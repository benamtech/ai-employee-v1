# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Branch: `employee-production-tuesday` → draft PR `#23` → target `main`  
Historical `research`: retained history, not current authority  
Migration head: `0072`  
Standard: v0.2 ratified and effective  
Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`

Exact workflow IDs belong in PR `#23` after branch movement stops. Documentation never inherits acceptance from an ancestor SHA.

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

**`standard_v0_2_ratified__migration_0072__manifest_driven_connectors__contributor_gates_and_hermes_watch_source_wired__gate_0_ci_accepted__not_live_accepted__not_launch_cleared`**

This wrap-up adds onboarding and enforcement only. P0/P1 product implementation remains next-session work.

## Runtime topology

Public Caddy routes to loopback Web, Manager, and employee gateways. Manager reaches Host Provisioner over a signed Unix socket; only Host Provisioner has the Docker socket. Each employee has an isolated Hermes network/data/workspace plus scoped Manager and Model Gateway access.

Canonical sources: `infra/deploy/docker-compose.production.yml`, `infra/scripts/production-topology.mjs`, `infra/caddy/production.Caddyfile`, provisioner host/client, profile renderer, and provisioning reconciler.

## Subsystem source hubs

| Boundary | Primary hubs | Open acceptance |
|---|---|---|
| identity/assignment | relationship, assignment, authorization, authority-version contracts; owner authority/session; migrations `0039`–`0069`, `0071` | broader live policy/role proof |
| command/effect/artifact | command-effect, durable command, approval, repair, artifact workbench; migrations `0041`, `0048`–`0054`, `0061`, `0070`–`0072` | provider ambiguity and crash repair |
| connectors/events | connector registry/setup/custody, capability registry/catalog, event ingress, ambient inbox, webhooks; migrations `0032`–`0038`, `0043`–`0047` | live authorization, health, revocation, reconciliation |
| model/commercial | commercial attribution and Model Gateway core/HTTP/server | cumulative budget, shared rate, ambiguity |
| provisioning/runtime | reconciler, provisioner host/client, profile renderer/integrity, Caddy activation, topology | target-host isolation, rotation, rollback |
| Hermes/context/MCP | Hermes client, Manager MCP, business brain, profile context, capability evidence; migration `0070` | release-bound capability reconciliation |
| owner/generated UI | strict stream, operating surface, materialization, UI resources, AgentSurface and work renderers | fixture-free provider-backed browser/channel proof |
| governance | `../CONTRIBUTING.md`, PR template, rubric/hooks/governance scripts, ratification workflow, main integration workflow | exact-head cutover proof |

Connector identity, risk, custody, exact tool ownership, readiness, setup protocol, scopes, hosts, and continuation are declarative. Unknown or stale evidence fails closed. Broad categories never select provider identity.

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

- required managed-Supabase platform proof;
- production secret rotation;
- target-host five-service and two-employee isolation;
- live identity/connector/provider acceptance;
- official MCP Apps and full AG-UI conformance;
- provider-backed generated UI through effect and proof;
- cumulative budgets, shared rate limits, and ambiguity control;
- complete crash repair and rollback;
- fixture-free Web/SMS/Review;
- commercial reconciliation;
- accessibility, browser, visual, capacity/fairness, SBOM/provenance, signed deployment, and exact deployment.

## Next dependency order

1. remote MCP authorization, MCP Apps, AG-UI adapter, capability reconciliation;
2. remaining PostgreSQL/RLS/concurrency/rollback matrices;
3. target-host isolation and lifecycle proof;
4. fixture-free owner/connector/golden journeys;
5. shared budget/rate/ambiguity controls;
6. crash/rollback, browser/accessibility, capacity, and signed release evidence.

`STANDARD.md`, the active production program, and exact executable evidence decide whether a gate is closed.
