# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-19  
Active branch: `employee-production-tuesday` → draft PR `#23` → base `research`  
Migration head: `0072`  
Standard: v0.2 ratified and effective  
Active program: `second-half-plan/2026-07-19-ratified-standard-production-program/`

Exact current-head workflow IDs and conclusions belong in PR `#23` and the newest indexed memory handoff after branch movement stops. Documentation commits do not inherit an ancestor's workflow matrix.

## Mandatory cold start

1. `../identity.md`
2. root `../AGENTS.md` or `../CLAUDE.md`
3. root `../CODEGRAPH.md`
4. scoped `AGENTS.md` or `CLAUDE.md`
5. this file
6. ratified `STANDARD.md`
7. `second-half-plan/README.md` and its active program
8. `memory/MEMORY.md`, then the newest relevant handoff
9. `docs/architecture/README.md`
10. `docs/architecture/16-standard-research-basis-and-protocol-disposition.md`
11. relevant UX docs, source, migrations, scripts, workflows, tests, proof, and current diff

Authority order: deployed release-bound proof → applied migrations/durable state → generated production source/deploy config → exact-SHA executable proof → ratified Standard/active program → CODEGRAPH/architecture → newest indexed memory → historical records.

## Product and control-plane boundary

AMTECH installs persistent AI Employees for owner-operated businesses.

- **Hermes** owns reasoning/execution, sessions/runs, transcript continuity, runtime-local memory/behavior, recovery, and rotation.
- **Manager** owns identity, assignment authority, context resources, tool/capability contracts, connector/credential custody, approval, durable command/effect, commercial attribution, revocation, repair, and release proof.
- **Model Gateway** owns employee-scoped model access and provider/commercial evidence.
- **Host Provisioner** is the only canonical service with Docker-host authority.
- **Web/SMS/Review/protocol adapters** are role-safe projections, not authority compilers.
- **PostgreSQL/Supabase** is durable authority, event, evidence, commercial, and reconciliation state.

Fixtures, `/api/dev/login`, manually injected outcomes, public-estimator paths, old containers, trajectory scores, and historical screenshots are diagnostics only.

## Moat and protocol model

The product moat is the governed-labor protocol, not one provider integration:

1. AMTECH labor protocol — assignments, work objects, authority, approval, effects, receipts, recovery, and commercial state.
2. MCP core — tools, resources, prompts, negotiation, and remote authorization profile.
3. MCP Apps — optional negotiated interactive `ui://` resources.
4. AG-UI — optional role-safe agent/user event and state adapter.
5. AMTECH channel adapters — Web, SMS, signed Review, connected systems, and future clients.

Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology.

## Canonical effect boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current role/grant/policy/entitlement/authority version
→ stable durable intent, command, event, or work object
→ Hermes or deterministic work
→ bounded capability selection and runtime validation
→ approval when required
→ one reserved idempotent external effect
→ accepted | failed | ambiguous durable receipt
→ deterministic replay, reconciliation, or repair
→ role-safe materialization
→ audit, metering, commercial attribution, revocation, recovery, release proof
```

## Current status

**`standard_v0_2_ratified__migration_head_0072__manifest_driven_connector_and_capability_control__canonical_deploy_source_wired__gate_0_exact_head_ci_pending__not_live_accepted__not_launch_cleared`**

Pre-ratification implementation checkpoints have complete green workflow matrices. The final Gate 0 authority head must pass the full required matrix after code/document synchronization stops.

## Current canonical runtime topology

```text
Public Internet
  → Caddy on Linux host network
      → 127.0.0.1:3000 Web
      → 127.0.0.1:8080 Manager-approved public routes
      → 127.0.0.1:<employee-port> Hermes employee gateway

amtech_control bridge
  Manager
  Model Gateway
  Host Provisioner
  Web

Manager
  → signed Unix socket
  → Host Provisioner
  → Docker socket / host lifecycle

per employee: amtech-employee-<employee_id> internal bridge
  Hermes runtime
  Manager alias: amtech-manager
  Model Gateway alias: amtech-model-gateway
```

Canonical sources:

- `infra/deploy/docker-compose.production.yml`
- `infra/scripts/production-topology.mjs`
- `infra/caddy/production.Caddyfile`
- `infra/scripts/local/start-hermes-container.sh`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`

Production, production-like, smoke, and rollback entrypoints import `infra/scripts/production-topology.mjs`. This closes source/config convergence only; target-host proof remains open.

## Executable subsystem map

### 1. Identity, relationships, assignments, and authority

Primary hubs:

- `packages/shared/src/relationship-contract.ts`
- `packages/shared/src/assignment-resolver.ts`
- `packages/shared/src/authorization-scope-registry.ts`
- `packages/shared/src/authority-version.ts`
- `apps/manager/src/lib/owner-assignment-authority.ts`
- `apps/manager/src/lib/owner-session.ts`
- `apps/manager/src/lib/platform-admin-runtime.ts`
- migrations `0039`, `0040`, `0042`, `0053`–`0069`, `0071`

Viewer principals are read-only. Owner/manager/operator actions remain explicit-assignment scoped. Account membership does not manufacture employee authority.

### 2. Durable command/effect, approval, artifact history, and repair

Primary hubs:

- `packages/shared/src/command-effect.ts`
- `apps/manager/src/lib/durable-command-runtime.ts`
- `apps/manager/src/lib/owner-turn-command.ts`
- `apps/manager/src/lib/owner-turn-repair.ts`
- `apps/manager/src/lib/approval-authority.ts`
- `apps/manager/src/lib/artifact-workbench-routes.ts`
- migrations `0041`, `0048`–`0054`, `0061`, `0070`–`0072`

Artifact revisions use compare-and-swap heads, exact-revision validation, approval snapshot binding, durable publication effects, and verification receipts.

### 3. Connectors, authorization, ingress, and egress

Primary hubs:

- `packages/shared/src/connector-registry.ts`
- `packages/shared/src/connector-setup.ts`
- `apps/manager/src/lib/capability-registry.ts`
- `apps/manager/src/lib/tool-capability-catalog.ts`
- `apps/manager/src/lib/connector-custody.ts`
- `apps/manager/src/lib/artifact-workbench-routes.ts`
- `apps/manager/src/events/registry.ts`
- `apps/manager/src/events/ingress.ts`
- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/webhooks/*`
- migrations `0032`–`0038`, `0043`–`0047`

Normative behavior:

- connector identity, category, risk axes, and custody are declarative;
- exact managed-tool ownership and readiness source live in the setup manifest;
- broad categories never imply provider identity;
- direct MCP requires `writes`, `money`, and `customer_facing` explicitly false;
- unknown/underspecified connectors fail closed;
- OAuth, provider-hosted onboarding, managed secrets/service accounts, and operator installation are distinct setup protocols;
- browser code never chooses scopes, tools, credentials, or authorization hosts.

### 4. Model Gateway and commercial attribution

Primary hubs:

- `packages/shared/src/commercial-attribution.ts`
- `apps/manager/src/lib/commercial-attribution.ts`
- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- `apps/manager/src/model-gateway-server.ts`

Open P0/P1 gaps:

- cumulative settled plus reserved budget is not atomically enforced;
- rate buckets are process-local;
- uncertain provider acceptance needs durable ambiguity/reconciliation before retry.

### 5. Provisioning, profiles, runtime, networks, and routing

Primary hubs:

- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/runtime-profile-integrity.ts`
- `apps/manager/src/lib/caddy-activation.ts`
- `infra/scripts/production-topology.mjs`
- `infra/scripts/local/start-hermes-container.sh`

Open gates: target-host acceptance, managed secret/rotation evidence, crash/compensation matrix, rollback, and release attestation.

### 6. Hermes, context, MCP, and effective capabilities

Primary hubs:

- `packages/shared/src/task-capabilities.ts`
- `apps/manager/src/lib/hermes-client.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/business-brain.ts`
- `apps/manager/src/lib/profile-context.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/tool-capability-catalog.ts`
- `apps/manager/src/lib/effective-capability-evidence.ts`
- migration `0070`

Capability discovery spans `manager_mcp`, `direct_mcp`, and `runtime_native`. A capability is effective only when advertisement, exact runtime report, dependency, credential, network, assignment policy, entitlement, connector health, and recent live probe pass. Stale or missing evidence fails closed.

### 7. Owner Web, work surfaces, MCP Apps compatibility, and AG-UI profile

Primary hubs:

- `apps/manager/src/lib/employee-stream-strict.ts`
- `apps/manager/src/lib/employee-stream.ts`
- `apps/manager/src/lib/operating-surface.ts`
- `apps/manager/src/lib/materialization.ts`
- `apps/manager/src/lib/ui-resources.ts`
- `apps/web/app/agent/[employeeId]/AgentSurface.tsx`
- `apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx`
- `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- `apps/web/app/agent/[employeeId]/components/McpUiResource.tsx`

Current typed generated-view and sandboxed intent machinery is useful compatibility groundwork. Do not claim official MCP Apps conformance until extension negotiation, resource/tool association, JSON-RPC host lifecycle, CSP/permissions, and action-intersection tests pass. Do not claim full AG-UI conformance until a versioned adapter and snapshot/delta/replay/resync matrix pass.

### 8. Evidence, validation, archaeology, and documentation control

Primary maps:

- `STANDARD.md`
- `validation/standard-v0.2-evolution-vector.json`
- `docs/architecture/06-effect-graphs-failure-semantics-and-observability.md`
- `docs/architecture/09-current-bug-risk-and-production-gap-register.md`
- `docs/architecture/16-standard-research-basis-and-protocol-disposition.md`
- `second-half-plan/README.md`
- `memory/MEMORY.md`

## Migration ledger

Current head: **`0072`**.

```text
0032–0038  Model Gateway, reconciler, ambient inbox, effects, grants, welcome, duplicate handling
0039–0042  relationships, authorization, assignment scope, release evidence
0043–0047  connector custody and commercial attribution
0048–0054  approval authority, snapshots, owner/MCP/artifact assignment closure
0055–0059  platform-admin authority and command/session/lease binding
0057a–0059 authority surface categories and authority-version operational closure
0060–0063  signed artifact/preview authority and ambiguous command reconciliation
0064–0068  onboarding identity and activation sequence
0069       canonical explicit-assignment owner surface grants
0070       effective capability evidence; artifact revisions, validation, publication approval snapshots
0071       artifact policy lifecycle seed; role-specific owner-surface contract guards
0072       artifact revision/parent/validation/current-head cross-row scope guards
```

Applied migrations are immutable. Corrections use forward migrations.

## Database evidence ladder

1. Pure unit/contract tests for schema builders, policies, hashing, state transitions, and adapters.
2. Production-shaped local/CI PostgreSQL for full migration ledger, RLS/grants, functions, concurrency, races, and negative isolation.
3. Compiled application/browser tests for role-safe projections.
4. Disposable managed Supabase only for material platform-specific Auth, Realtime, Storage, Data API, advisor, security-sensitive, or final release-candidate behavior.
5. Target-host/provider acceptance for release boundaries.
6. Production monitoring and reconciliation after release.

A live database is not the routine development loop. Local PostgreSQL does not waive platform-specific release proof.

## Evidence boundary

Not accepted yet:

1. final Gate 0 exact-head workflow matrix;
2. platform-specific disposable Supabase release proof where required by the ratified database policy;
3. managed production secrets and rotation;
4. target-host Caddy/Docker/Unix-socket/two-employee isolation;
5. live identity and connector authorization/revocation;
6. official MCP Apps and full AG-UI conformance;
7. provider-backed generated UI/browser action through external effect and proof;
8. cumulative budget, shared rate limiting, and timeout ambiguity control;
9. complete crash/compensation/deterministic repair;
10. fixture-free Web/SMS/signed Review;
11. real connector/provider/accounting reconciliation;
12. release-bound effective-capability graph reconciliation;
13. shared/fractional live policy and broader role perspectives;
14. 100/250/500/700 employee capacity and fairness;
15. complete accessibility, cross-browser, visual regression, rollback, SBOM/provenance, signed deployment manifest, and exact deployment.

## Dependency-ordered path

1. Complete Gate 0 repository authority reconciliation and exact-head CI.
2. Close connector manifest/custody and protocol-adapter source contracts without widening authority.
3. Complete local/CI PostgreSQL migration, RLS, and concurrency matrices; run disposable Supabase only at named platform/release boundaries.
4. Prove target-host five-service health, Host Provisioner custody, and two-employee isolation/replacement/teardown.
5. Prove fixture-free owner identity, capability evidence, managed authorization, approval/effect/receipt, and owner-refindable golden work.
6. Implement shared budget/rate/ambiguity controls with concurrent failure tests.
7. Add crash/repair/rollback, accessibility/cross-browser/visual, capacity/fairness, and signed release/deployment evidence.

`STANDARD.md`, the active production program, and exact executable evidence determine whether a gate is closed.
