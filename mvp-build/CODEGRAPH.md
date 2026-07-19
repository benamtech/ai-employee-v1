# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-19  
Active branch: `employee-production-tuesday` → draft PR `#23` → base `research`  
Migration head: `0069`  
Complete green code/test evidence anchor: `7492c52ba2dbb97ce57efcda4f8d4b7e839b39ec`

## Mandatory cold start

1. `../identity.md`
2. root `../AGENTS.md` or `../CLAUDE.md`
3. root `../CODEGRAPH.md`
4. scoped `AGENTS.md` or `CLAUDE.md`
5. this file
6. `memory/MEMORY.md`
7. `memory/2026-07-19-final-document-authority-infra-test-production-handoff.md`
8. `STANDARD.md`
9. `second-half-plan/phase-2-standard-remediation-execution.md`
10. `docs/architecture/README.md`
11. `docs/architecture/11-agent-orientation-and-role-map.md`
12. `docs/architecture/14-infrastructure-deployment-and-test-coverage-audit.md`
13. relevant UX docs, source, migrations, scripts, workflows, tests, proof, and current diff

Authority order: applied migrations/current source → generated production source/deploy config → exact-SHA executable proof → Standard/active plan → CODEGRAPH/architecture → newest memory → historical records.

## Product and control-plane boundary

AMTECH installs persistent AI Employees for owner-operated businesses. The owner experiences one employee through governed Web, SMS, signed Review, and connected-system events.

- **Hermes** owns reasoning/execution, sessions/runs, transcript continuity, memory, runtime-local behavior, recovery, and rotation.
- **Manager** owns identity, assignment authority, context resources, tool schemas, connector/credential custody, approval, durable command/effect, commercial attribution, revocation, repair, and release proof.
- **Model Gateway** owns employee-scoped model access and provider/commercial evidence.
- **Host Provisioner** is the only canonical service with Docker-host authority.
- **Web** is an owner/operator projection, not an authority compiler.
- **PostgreSQL/Supabase** is durable authority, event, evidence, commercial, and reconciliation state.

The public estimator, fixtures, `/api/dev/login`, manually injected provider outcomes, old containers, trajectory scores, and historical screenshots are diagnostics only.

## Canonical effect boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current role/grant/policy/authority version
→ stable intent
→ immutable command and atomic claim
→ Hermes or deterministic work
→ approval when required
→ one reserved external effect
→ accepted / failed / ambiguous durable receipt
→ deterministic replay or repair
→ role-safe surface
→ audit, metering, commercial attribution, revocation, release proof
```

## Current status

**`P0_P1_review_closures_ci_accepted_on_7492c52__migration_head_0069__canonical_deploy_entrypoint_fork_open__not_live_accepted__not_launch_cleared`**

The evidence anchor is 81 commits ahead of the starting review head `1affb16d819aad1e8975eb5b4a48e52c78d6b255`.

All named code/test workflows passed on the evidence anchor. Later commits are documentation synchronization and do not automatically inherit a complete workflow rerun.

## Exact green workflow matrix

- Phase 2 Remediation Plan Integrity — `29690964418`
- Repository Documentation Archaeology — `29690964459`
- S2 S7 S9 Production Boundary — `29690964423`
- Lane 1 Relationships and Authorization — `29690964448`
- S10.1 Onboarding Identity Authority — `29690964447`
- Lane 10 Integrated CI and Release Evidence — `29690964445`
- Employee Work Production Boundary — `29690964453`
- Agent Operating Surface Standard — `29690964421`

All concluded success on `7492c52ba2dbb97ce57efcda4f8d4b7e839b39ec`. This is `ci-accepted` only for their declared scope.

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

Canonical topology sources:

- `infra/deploy/docker-compose.production.yml`
- `infra/caddy/production.Caddyfile`
- `infra/scripts/local/start-hermes-container.sh`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`

## Critical deploy fork

The following normal-production helpers still select or default to the legacy `infra/deploy/docker-compose.yml`:

- `infra/scripts/production-normal-up.mjs`
- `infra/scripts/prod-like-normal-employee-up.mjs`
- `infra/scripts/deploy-smoke.mjs`
- `infra/scripts/deploy-rollback.mjs`

The legacy compose mounts Docker socket into Manager, lacks separate Model Gateway and Host Provisioner services, and keeps Caddy on a bridge. It is not equivalent to the canonical topology above.

**Do not deploy through those helpers until red source tests force every production entrypoint onto `docker-compose.production.yml`, canonical names, five-service health, Unix-socket custody, and target-host topology proof.**

## Executable subsystem map

### 1. Identity, relationships, assignments, and authority

Provides organizations, users/principals, memberships, explicit employee assignments, labor/management/custody/payer/beneficiary relationships, assignment principals, grants, policies, authority versions, owner sessions, signed resources, approvals, and platform support authority.

Primary hubs:

- `packages/shared/src/relationship-contract.ts`
- `packages/shared/src/assignment-resolver.ts`
- `packages/shared/src/authorization-scope-registry.ts`
- `packages/shared/src/authority-version.ts`
- `apps/manager/src/lib/owner-assignment-authority.ts`
- `apps/manager/src/lib/owner-session.ts`
- `apps/manager/src/lib/platform-admin-runtime.ts`
- migrations `0039`, `0040`, `0042`, `0053`–`0069`

Migration `0069` installs canonical owner employee-surface grants only for explicit human assignment principals. Account membership does not manufacture employee authority.

### 2. Durable command/effect, approval, and repair

Provides stable intent, immutable command provenance, atomic claims, leases, effect reservation, accepted/failed/ambiguous receipts, approval snapshots/current resolver authority, owner-turn C3, replay, and repair entrypoints.

Primary hubs:

- `packages/shared/src/command-effect.ts`
- `apps/manager/src/lib/durable-command-runtime.ts`
- `apps/manager/src/lib/owner-turn-command.ts`
- `apps/manager/src/lib/owner-turn-repair.ts`
- `apps/manager/src/lib/approval-authority.ts`
- migrations `0041`, `0048`–`0054`, `0061`

### 3. Connectors, ingress, ambient inbox, and egress

Provides Gmail, QuickBooks, Stripe, and Twilio custody; authenticity verification; normalized employee-event ingress; durable ambient inbox; dedupe/order/leases/retry/dead letter/replay; owner-safe work descriptors; optional approval binding; direct delivery or Hermes wake.

Primary hubs:

- `apps/manager/src/events/registry.ts`
- `apps/manager/src/events/ingress.ts`
- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/lib/employee-events.ts`
- `apps/manager/src/lib/connector-custody.ts`
- `apps/manager/src/webhooks/*`
- migrations `0032`–`0038`, `0043`–`0047`

### 4. Model Gateway and commercial attribution

Provides assignment-bound credentials, employee/assignment/payer/beneficiary/price resolution, provider proxy, receipt extraction, request audit, provider usage receipt, and accounting receipt.

Primary hubs:

- `packages/shared/src/commercial-attribution.ts`
- `apps/manager/src/lib/commercial-attribution.ts`
- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- `apps/manager/src/model-gateway-server.ts`

Open P0 gaps:

- cumulative settled + reserved budget is not atomically enforced;
- rate buckets are process-local;
- generic timeout retry can duplicate provider cost when acceptance is ambiguous.

### 5. Provisioning, profiles, runtime, networks, and routing

Provides desired-resource reconciliation, signed Unix-socket provisioner requests, scoped credential minting, rendered profile/context, secret scans, read-only profile tree, SHA-256 checksum, one runtime/workspace per employee, per-employee internal bridge, health acceptance, loopback publication, Caddy snippets, rotation, drift, repair, replace, restore, suspend, and teardown.

Primary hubs:

- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/runtime-profile-integrity.ts`
- `apps/manager/src/lib/caddy-activation.ts`
- `infra/scripts/local/start-hermes-container.sh`

Open P0 gaps: canonical deploy entrypoint convergence, target-host acceptance, complete crash/compensation matrix, rollback, and release attestation.

### 6. Hermes, context, Manager MCP, and capabilities

Provides canonical Hermes session/run keys, runtime health/capability/toolset observation, rendered profile doctrine/memory, business-brain facts, strict Manager MCP resources, and employee-callable Manager tools generated from the authoritative registry.

Primary hubs:

- `apps/manager/src/lib/hermes-client.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/business-brain.ts`
- `apps/manager/src/lib/profile-context.ts`
- `apps/manager/src/lib/profile-renderer.ts`

Open P1 gap: persist one hash-bound effective-capability graph intersecting runtime observations, Manager tools, connector health, assignment policy, commercial entitlement, and runtime/profile revision.

### 7. Owner Web, operating surface, and generated UI

Provides Supabase Auth → Manager owner session in HttpOnly cookie, private-hop owner header, token-free browser SSE URL, strict snapshots/deltas, task-agnostic operating state, typed envelopes/resources/actions, deterministic adaptive layout, typed generated-view compiler, opaque-origin iframe, finite intent vocabulary, and host action intersection.

Primary hubs:

- `apps/manager/src/lib/employee-stream-strict.ts`
- `apps/manager/src/lib/operating-surface.ts`
- `apps/manager/src/lib/materialization.ts`
- `apps/manager/src/lib/ui-resources.ts`
- `apps/web/app/agent/[employeeId]/AgentSurface.tsx`
- `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- `apps/web/app/agent/[employeeId]/components/McpUiResource.tsx`
- `apps/web/app/api/employee/[employeeId]/resources/route.ts`

Current fixture browser tests exercise the adaptive system. Product-shell tests prove only login and unauthenticated dashboard. No fixture-free provider-backed browser action/effect/receipt chain has passed on the current candidate.

### 8. Evidence, validation, archaeology, and documentation control

Provides audit, metering, provider/accounting/effect receipts, profile checksums, runtime/resource evidence, release schemas, generated production Manager source, PostgreSQL matrices, image inclusion, compiled Web tests, and tracked-object archaeology.

Primary maps:

- `docs/architecture/06-effect-graphs-failure-semantics-and-observability.md`
- `docs/architecture/08-repository-archaeology-audit-and-cleanup.md`
- `docs/architecture/09-current-bug-risk-and-production-gap-register.md`
- `docs/architecture/14-infrastructure-deployment-and-test-coverage-audit.md`

## Migration ledger

Current head: **`0069`**.

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
```

Do not rewrite or renumber applied migrations. Corrections are forward migrations.

## Evidence boundary

Not accepted yet:

1. canonical deploy/smoke/rollback entrypoint convergence;
2. approved real-Supabase `0032–0069` migration/advisor/behavior proof;
3. managed production secrets and rotation;
4. target-host Caddy/Docker/Unix-socket/two-employee isolation;
5. live identity-provider verification and canonical activation;
6. provider-backed generated UI browser action through external effect and proof;
7. cumulative budget, shared rate limiting, and timeout ambiguity control;
8. complete crash/compensation/deterministic repair;
9. fixture-free Web/SMS/signed Review;
10. real connector/provider/accounting reconciliation;
11. effective-capability graph persistence;
12. shared/fractional policy and broader role perspectives;
13. 100/250/500/700 employee capacity and fairness;
14. complete accessibility, cross-browser, visual regression, rollback, SBOM/attestation, signed deployment manifest, and exact deployment.

## Dependency-ordered TDD path

1. Add red tests requiring every production/deploy/smoke/rollback script to select `docker-compose.production.yml` and canonical service names.
2. Migrate those scripts; quarantine or explicitly label the legacy compose.
3. Add `docker compose config`, five-service health, Unix-socket, no-Manager-Docker-socket, and host-network Caddy contracts.
4. Prove target-host two-employee isolation/replacement/teardown.
5. Apply `0032–0069` to approved staging and run advisors/matrices.
6. Add red concurrent Model Gateway budget/rate/timeout tests; implement controls.
7. Add provisioning/effect crash injection and deterministic repair.
8. Add real authenticated dashboard/SSE/error-state browser tests.
9. Add provider-backed generated UI browser action through approval/effect/receipts/proof.
10. Add cross-browser, accessibility, visual regression, capacity/fairness, rollback, and signed release-attestation gates.

Trajectory artifacts may refine prerequisite order, but `STANDARD.md` and exact live evidence determine whether a gate is closed.
