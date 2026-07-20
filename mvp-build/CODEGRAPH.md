# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-20  
Active branch: `employee-production-tuesday` → draft PR `#23` → base `research`  
Migration head: `0072`  
Complete green predecessor evidence anchor: `55e094e6bffc9f544ecf5fc2e366323c6619feb7`

This CODEGRAPH synchronization commit is documentation-only and does not automatically inherit the predecessor anchor's workflow matrix. The current exact-head workflow IDs and conclusions belong in PR `#23` after the matrix reruns.

## Mandatory cold start

1. `../identity.md`
2. root `../AGENTS.md` or `../CLAUDE.md`
3. root `../CODEGRAPH.md`
4. scoped `AGENTS.md` or `CLAUDE.md`
5. this file
6. `memory/MEMORY.md`
7. `memory/2026-07-20-capability-surface-ci-closure-and-next-plan.md`
8. `STANDARD.md`
9. `second-half-plan/phase-2-standard-remediation-execution.md`
10. `second-half-plan/2026-07-20-capability-production-closure/README.md` when working on capability/owner-surface closure
11. `docs/architecture/README.md`
12. `docs/architecture/11-agent-orientation-and-role-map.md`
13. `docs/architecture/14-infrastructure-deployment-and-test-coverage-audit.md`
14. relevant UX docs, source, migrations, scripts, workflows, tests, proof, and current diff

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

**`capability_surface_and_acceptance_contract_closure_ci_accepted_on_55e094e6__migration_head_0072__canonical_deploy_selection_source_wired__not_live_accepted__not_launch_cleared`**

The primary implementation anchor is `5b56e6a2249f4b5a650d81badbdd7b95cd6ea2bb`. The complete predecessor workflow matrix passed on `55e094e6bffc9f544ecf5fc2e366323c6619feb7`. This is `ci-accepted` only for declared source/fixture scope; it is not real database, runtime, provider, browser/channel, commercial, deployment, rollback, or production-ready acceptance.

## Exact green predecessor workflow matrix

On `55e094e6bffc9f544ecf5fc2e366323c6619feb7`:

- Repository Documentation Archaeology — `29709721661`
- Phase 2 Remediation Plan Integrity — `29709721690`
- S10.1 Onboarding Identity Authority — `29709721646`
- Lane 1 Relationships and Authorization — `29709721689`
- S2 S7 S9 Production Boundary — `29709721656`
- Lane 10 Integrated CI and Release Evidence — `29709721664`
- Employee Work Production Boundary — `29709721665`
- Agent Operating Surface Standard — `29709721702`

All concluded success. Current-head documentation synchronization must rerun the applicable matrix; PR `#23` is the final run ledger.

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
- `infra/scripts/production-topology.mjs`
- `infra/caddy/production.Caddyfile`
- `infra/scripts/local/start-hermes-container.sh`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`

## Production entrypoint convergence

The prior source-level deploy fork is closed.

These entrypoints import the same `infra/scripts/production-topology.mjs` authority and select `infra/deploy/docker-compose.production.yml`:

- `infra/scripts/production-normal-up.mjs`
- `infra/scripts/prod-like-normal-employee-up.mjs`
- `infra/scripts/deploy-smoke.mjs`
- `infra/scripts/deploy-rollback.mjs`

`tests/unit/production-boundary-source.test.ts`, describe `canonical production deployment topology`, enforces canonical selection, five-service health, Unix-socket Docker custody, Caddy topology, employee topology inspection, and rollback recomputation.

This closes source/config convergence only. Do not claim runtime acceptance until the target-host two-employee isolation/replacement/teardown harness passes on the release candidate.

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
- migrations `0039`, `0040`, `0042`, `0053`–`0069`, `0071`

Migration `0069` installs canonical owner employee-surface grants only for explicit human assignment principals. Migration `0071` makes those actions role-specific so viewers remain read-only while owner/manager/operator actions stay assignment-scoped. Account membership does not manufacture employee authority.

### 2. Durable command/effect, approval, artifact history, and repair

Provides stable intent, immutable command provenance, atomic claims, leases, effect reservation, accepted/failed/ambiguous receipts, approval snapshots/current resolver authority, owner-turn C3, replay, repair entrypoints, immutable artifact revisions, validation evidence, and publication state.

Primary hubs:

- `packages/shared/src/command-effect.ts`
- `apps/manager/src/lib/durable-command-runtime.ts`
- `apps/manager/src/lib/owner-turn-command.ts`
- `apps/manager/src/lib/owner-turn-repair.ts`
- `apps/manager/src/lib/approval-authority.ts`
- `apps/manager/src/lib/artifact-workbench-routes.ts`
- migrations `0041`, `0048`–`0054`, `0061`, `0070`–`0072`

Migration `0070` binds artifact publication approval to the exact validated revision. Migration `0072` enforces revision, parent, validation, and current-head scope across artifact/assignment/account/employee boundaries.

### 3. Connectors, ingress, ambient inbox, and egress

Provides Gmail, QuickBooks, Stripe, and Twilio custody; authenticity verification; normalized employee-event ingress; durable ambient inbox; dedupe/order/leases/retry/dead letter/replay; owner-safe work descriptors; optional approval binding; direct delivery or Hermes wake.

Primary hubs:

- `packages/shared/src/connector-setup.ts`
- `apps/manager/src/events/registry.ts`
- `apps/manager/src/events/ingress.ts`
- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/lib/employee-events.ts`
- `apps/manager/src/lib/connector-custody.ts`
- `apps/manager/src/tools/gmail-connect-owner.ts`
- `apps/manager/src/tools/qbo-connect-owner.ts`
- `apps/manager/src/webhooks/*`
- migrations `0032`–`0038`, `0043`–`0047`

Gmail and QuickBooks have explicit owner OAuth setup descriptors and signed owner return bridges. Unknown connectors fail closed. Stripe OAuth is intentionally not fabricated.

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
- `infra/scripts/production-topology.mjs`
- `infra/scripts/local/start-hermes-container.sh`

Open P0/P1 gaps: target-host acceptance, managed secret/rotation evidence, complete crash/compensation matrix, rollback, and release attestation. Canonical entrypoint selection is no longer an open source-code gap.

### 6. Hermes, context, Manager MCP, and capabilities

Provides canonical Hermes session/run keys, runtime health/capability/toolset observation, rendered profile doctrine/memory, business-brain facts, strict Manager MCP resources, employee-callable Manager tools generated from the authoritative registry, assignment-bound capability evidence, and task-to-capability presentation.

Primary hubs:

- `packages/shared/src/task-capabilities.ts`
- `apps/manager/src/lib/hermes-client.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/business-brain.ts`
- `apps/manager/src/lib/profile-context.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/tool-capability-catalog.ts`
- migration `0070`

Capability discovery spans `manager_mcp`, `direct_mcp`, and `runtime_native`, but remains presentation/task guidance only. It cannot create execution authority. Stale runtime evidence fails closed rather than remaining ready.

Open P1 gap: complete release-bound persistence/reconciliation of the effective-capability graph against real runtime, connector, policy, entitlement, and profile evidence.

### 7. Owner Web, operating surface, and generated UI

Provides Supabase Auth → Manager owner session in HttpOnly cookie, private-hop owner header, token-free browser SSE URL, strict snapshots/deltas, task-agnostic operating state, task-mapped capability drawer, typed envelopes/resources/actions, deterministic adaptive layout, typed generated-view compiler, opaque-origin iframe, finite intent vocabulary, and host action intersection.

Primary hubs:

- `apps/manager/src/lib/employee-stream-strict.ts`
- `apps/manager/src/lib/operating-surface.ts`
- `apps/manager/src/lib/materialization.ts`
- `apps/manager/src/lib/ui-resources.ts`
- `apps/manager/src/lib/onboarding-identity-routes.ts`
- `apps/web/app/agent/[employeeId]/AgentSurface.tsx`
- `apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx`
- `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- `apps/web/app/agent/[employeeId]/components/McpUiResource.tsx`
- `apps/web/app/api/employee/[employeeId]/resources/route.ts`

`CapabilityDrawer.tsx` represents connector setup as one nullable `{ href, label }` action and stages editable employee instructions through the existing message/durable-command path; it never calls a provider tool directly from the browser.

Current fixture browser tests exercise the adaptive system. Product-shell tests prove only login and unauthenticated dashboard. No fixture-free provider-backed browser action/effect/receipt chain has passed on the current candidate.

### 8. Evidence, validation, archaeology, and documentation control

Provides audit, metering, provider/accounting/effect receipts, profile checksums, runtime/resource evidence, release schemas, generated production Manager source, PostgreSQL matrices, image inclusion, compiled Web tests, and tracked-object archaeology.

Primary maps:

- `docs/architecture/06-effect-graphs-failure-semantics-and-observability.md`
- `docs/architecture/08-repository-archaeology-audit-and-cleanup.md`
- `docs/architecture/09-current-bug-risk-and-production-gap-register.md`
- `docs/architecture/14-infrastructure-deployment-and-test-coverage-audit.md`
- `second-half-plan/2026-07-20-capability-production-closure/`
- `memory/2026-07-20-capability-surface-ci-closure-and-next-plan.md`

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

Do not rewrite or renumber applied migrations. Corrections are forward migrations.

## Evidence boundary

Not accepted yet:

1. approved real-Supabase `0032–0072` migration/advisor/behavior proof;
2. managed production secrets and rotation;
3. target-host Caddy/Docker/Unix-socket/two-employee isolation;
4. live identity-provider verification and canonical activation;
5. provider-backed generated UI browser action through external effect and proof;
6. cumulative budget, shared rate limiting, and timeout ambiguity control;
7. complete crash/compensation/deterministic repair;
8. fixture-free Web/SMS/signed Review;
9. real connector/provider/accounting reconciliation;
10. release-bound effective-capability graph reconciliation;
11. shared/fractional policy and broader role perspectives;
12. 100/250/500/700 employee capacity and fairness;
13. complete accessibility, cross-browser, visual regression, rollback, SBOM/attestation, signed deployment manifest, and exact deployment.

## Dependency-ordered TDD path

1. Freeze and record a complete exact-head workflow matrix after this CODEGRAPH synchronization.
2. Apply `0032–0072` to approved staging; run advisors and assignment/artifact/capability behavior matrices.
3. Prove canonical target-host five-service health, Docker/Unix-socket custody, two-employee isolation, replacement, and teardown.
4. Capture real authenticated dashboard/SSE/error/OAuth behavior and a fixture-free provider-backed generated-work-object path through approval, C3/effect, receipt, and proof.
5. Add red concurrent Model Gateway budget/rate/ambiguous-timeout tests; implement shared atomic controls and reconciliation.
6. Add provisioning/effect crash injection, deterministic repair, and rollback proof.
7. Add cross-browser, accessibility, visual regression, capacity/fairness, SBOM/provenance, signed manifest, and exact deployment gates.

Trajectory artifacts may refine prerequisite order, but `STANDARD.md` and exact live evidence determine whether a gate is closed.
