# CODEGRAPH.md — AMTECH AI Employee build map

Status: active  
Updated: 2026-07-19  
Active integration branch: `employee-production-tuesday`, based on `research`; draft PR `#23` targets `research`; `main` is not an integration shortcut

## Cold-session read order

1. `../identity.md`
2. root `../AGENTS.md` or `../CLAUDE.md` and root `../CODEGRAPH.md`
3. scoped `AGENTS.md` or `CLAUDE.md`
4. this file
5. `memory/MEMORY.md`, then the newest relevant handoff
6. `STANDARD.md`
7. `second-half-plan/phase-2-standard-remediation-execution.md`
8. `docs/architecture/README.md`
9. `docs/architecture/11-agent-orientation-and-role-map.md`
10. `docs/production-normal-employee-live-deploy-runbook.md` for launch/live work
11. relevant UX, source, migrations, scripts, tests, workflows, proof, release records, and current diff

Source, applied migrations, executable proof, and newest memory outrank older documentation.

## What AMTECH is building

AMTECH installs a persistent AI Employee for owner-operated small businesses, beginning with painters, landscapers, and adjacent service contractors. The owner experiences one employee through governed Web, SMS, signed Review, and connected-system events. Voice is a future extension, not a launch gate.

Manager is the invisible control plane. Hermes is the managed agent/runtime substrate.

Hermes owns reasoning/execution, sessions/runs, transcript continuity, streaming, memory, runtime-local tools, recovery, and rotation. Manager owns identity/assignment authority, context resources, tool schemas, connector/credential custody, approval, durable command/effect, commercial attribution, revocation, repair, and release proof.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment or approved platform/system context
→ current relationship, role, grant, policy, and authority version
→ stable durable intent
→ immutable command and atomic claim
→ Hermes or deterministic work
→ approval when required
→ one reserved bounded external effect
→ accepted, failed, or ambiguous durable receipt
→ deterministic replay or repair
→ role-safe Web, SMS, signed-Review, or connected-system surface
→ audit, metering, commercial attribution, revocation propagation, and release proof
```

The public estimator, fixtures, `/api/dev/login`, local `live:*`, and manually injected provider results are diagnostics only.

## Acceptance vocabulary

| Status | Meaning |
|---|---|
| `source-wired` | Source/schema/config exists; state exactly which checks ran. |
| `ci-accepted` | Named CI gate passed on named SHA and scope. |
| `real-supabase-accepted` | Approved real database target passed migration and behavior checks. |
| `runtime-accepted` | Real target host/runtime/network proof exists. |
| `provider-accepted` | Real external-provider proof IDs exist. |
| `browser/channel-accepted` | Fixture-free Web/SMS/signed-Review proof exists. |
| `commercial-accepted` | Usage, payer/beneficiary, provider cost, and invoice reconciliation passed. |
| `production-ready` | Every non-waivable Standard gate is green on the exact deployed SHA. |
| `planned` | Designed, not implemented. |
| `pending` | Unattempted, blocked, or missing proof. |

Documentation-only commits, trajectory scores, fixtures, and historical runs do not promote acceptance.

## Current overall status

**`P0_P1_source_review_closures_integrated__migration_head_0069__exact_head_ci_sync_in_progress__not_live_accepted__not_launch_cleared`**

Canonical current handoff: `memory/2026-07-19-repository-archaeology-architecture-and-agent-orientation.md`.

The final exact-head proof SHA and workflow IDs are written into this file, that handoff, and PR `#23` after the final documentation head completes CI.

## Current system topology

```text
Public Internet
  → Caddy on Linux host network
      → 127.0.0.1:3000 Web
      → 127.0.0.1:8080 Manager-approved public routes
      → 127.0.0.1:<employee-port> Hermes employee gateways

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
  Hermes employee runtime
  Manager alias: amtech-manager
  Model Gateway alias: amtech-model-gateway
```

Primary map: `docs/architecture/02-network-container-and-runtime-topology.md`.

## Executable subsystem graph

### 1. Identity, relationships, assignments, and authority

Current source provides:

- organizations, users, human/employee/service/platform principals;
- account memberships separated from employee assignment authority;
- employee assignments and labor/management/custody/payer/beneficiary relationships;
- assignment principals, resource grants, policies, and authority versions;
- owner sessions, signed previews/artifacts, MCP credentials, approvals, and revocation bound to current authority versions;
- platform-admin roles, step-up, exact support leases, and audited support actions.

Primary source:

- `packages/shared/src/relationship-contract.ts`
- `packages/shared/src/assignment-resolver.ts`
- `packages/shared/src/authorization-scope-registry.ts`
- `packages/shared/src/authority-version.ts`
- `apps/manager/src/lib/owner-assignment-authority.ts`
- `apps/manager/src/lib/owner-session.ts`
- `apps/manager/src/lib/platform-admin-runtime.ts`
- migrations `0039`, `0040`, `0042`, `0053`–`0069`

### 2. Durable command/effect, approval, and repair

Current source provides:

- stable intent and immutable command identity;
- actor/assignment/policy/payload/correlation provenance;
- atomic claims, bounded leases, effect reservations, and accepted/failed/ambiguous receipts;
- duplicate replay and ambiguity reconciliation without blind second effects;
- immutable approval snapshots, current resolver authority, atomic consumption, execution-time revalidation;
- owner-turn C3 around the existing Hermes path;
- repair and reconciliation entrypoints.

Primary source:

- `packages/shared/src/command-effect.ts`
- `apps/manager/src/lib/durable-command-runtime.ts`
- `apps/manager/src/lib/owner-turn-command.ts`
- `apps/manager/src/lib/owner-turn-repair.ts`
- `apps/manager/src/lib/approval-authority.ts`
- migrations `0041`, `0048`–`0054`, `0061`

### 3. Connectors, provider ingress, ambient inbox, and egress

Current source provides:

- Gmail, QuickBooks, Stripe, and assignment-bound Twilio connector custody;
- provider authenticity verification and safe normalization;
- two ingress doors: normalized employee event ingress and durable ambient inbox;
- provider-event and effect dedupe, ordering keys, leases, waiting-for-binding, retry, dead letter, and replay;
- effect receipts distinct from inbox processing;
- owner-safe work-event descriptors, optional approval binding, direct delivery or Hermes wake.

Primary source:

- `apps/manager/src/events/registry.ts`
- `apps/manager/src/events/ingress.ts`
- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/lib/employee-events.ts`
- `apps/manager/src/lib/connector-custody.ts`
- `apps/manager/src/webhooks/*`
- migrations `0032`–`0038`, `0043`–`0047`

### 4. Commercial attribution and Model Gateway

Current source provides:

- assignment-bound Model Gateway credentials;
- current employee/assignment/payer/beneficiary/price resolution;
- provider proxy, timeout/retry, receipt extraction, usage audit, provider usage receipt, and accounting receipt;
- no successful response when provider/accounting evidence is missing;
- ambiguity when provider content or accounting state lacks durable proof.

Primary source:

- `packages/shared/src/commercial-attribution.ts`
- `apps/manager/src/lib/commercial-attribution.ts`
- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- `apps/manager/src/model-gateway-server.ts`
- commercial migrations `0043`–`0047`

Current source-confirmed gaps:

- cumulative `spend_limit_cents` is not enforced against settled + in-flight usage;
- per-minute rate buckets are process-local and reset/partition across replicas;
- generic provider timeout retry can duplicate upstream cost when the first request was accepted but its response was lost.

### 5. Provisioning, runtime, networks, and routing

Current source provides:

- desired resource graph and leased provisioning reconciler;
- signed, nonce/idempotency-bound Manager → Host Provisioner Unix-socket requests;
- profile package render, secret scan, file manifest, SHA-256 checksum, mode/integrity validation;
- one Hermes container and workspace per employee;
- one internal employee bridge with only the employee, scoped Manager alias, and scoped Model Gateway alias;
- in-container Model Gateway and runtime health acceptance;
- loopback-only employee gateway publication;
- host-network Caddy, per-employee snippets, validate/reload/smoke/rollback;
- credential rotation recreates runtime before old-token revocation;
- runtime inspect, suspend, restart, replace, restore, drift, and repair operations.

Primary source:

- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/lib/caddy-activation.ts`
- `infra/scripts/local/start-hermes-container.sh`
- `infra/deploy/docker-compose.production.yml`
- `infra/caddy/production.Caddyfile`

### 6. Hermes, context, Manager MCP, and capabilities

Current source provides:

- Manager-owned canonical Hermes sessions/runs and stable session keys;
- runtime health, capability, and toolset observation;
- rendered profile doctrine/memory and scoped Manager MCP/Model Gateway configuration;
- business-brain facts with provenance/confidence;
- strict Manager MCP resources for business brain, connectors, work queue, artifacts, approvals, capabilities, and runtime health;
- employee-callable Manager tools generated from the authoritative shared registry with account/employee identity injected from the credential;
- strict context reads that fail closed on database faults.

Primary source:

- `apps/manager/src/lib/hermes-client.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/business-brain.ts`
- `apps/manager/src/lib/profile-context.ts`
- `apps/manager/src/lib/profile-renderer.ts`

Current gap: the complete effective-capability graph is not yet persisted as one hash-bound intersection of observed Hermes toolset, Manager registry, connector health, assignment grants/policy, commercial entitlement, and runtime revision.

### 7. Owner Web, operating surface, and generated UI

Current source provides:

- Supabase Auth → Manager-minted owner session held in HttpOnly cookie;
- server-side Next proxy preserving internal Manager bearer and owner-session custody;
- token-free browser SSE URL with private Manager-hop owner-session header;
- strict snapshot and delta paths;
- task-agnostic context, loops, active saves, decisions, changes, delegated work, evidence, guidance, and deterministic adaptive layout;
- typed `SurfaceEnvelope`, `WorkResource`, `WorkAction`, capability, connection, and resurfacing projections;
- exhaustive typed generated-view compiler to self-contained `ui://` HTML;
- opaque-origin sandboxed iframe and finite host-routed intent vocabulary;
- host intersection with current `WorkResource.actions` and exact durable resource IDs;
- production resources proxy fails with `503` when Manager omits `operating_state`, while fixture mode retains deterministic local state;
- compiled production Next build and fixture/product-shell browser matrices.

Primary source:

- `apps/manager/src/lib/employee-stream-strict.ts`
- `apps/manager/src/lib/operating-surface.ts`
- `apps/manager/src/lib/materialization.ts`
- `apps/manager/src/lib/ui-resources.ts`
- `apps/web/app/agent/[employeeId]/AgentSurface.tsx`
- `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- `apps/web/app/agent/[employeeId]/components/McpUiResource.tsx`
- `apps/web/app/api/employee/[employeeId]/resources/route.ts`

Current gap: no current exact-SHA provider-backed Hermes run has emitted a typed work view, routed an owner action through the exact durable approval/effect, completed a real external effect, and rendered the provider/accounting/command proof.

### 8. Evidence, validation, and repository archaeology

Current source provides:

- work runs, audit, metering, provider/accounting receipts, effect receipts, profile checksums, runtime/resource evidence, release schemas, and exact-head workflow artifacts;
- generated production Manager source from a hash-pinned template;
- unit/source contracts, PostgreSQL integration matrices, image inclusion, compiled Web browser tests;
- `scripts/repository-archaeology-v2.mjs`, which reads every tracked Git object and emits file primitives, relationship map, effect graph, defect audit, and exhaustion ledger;
- exact-branch-head archaeology workflow rather than synthetic PR merge checkout.

Primary map:

- `docs/architecture/06-effect-graphs-failure-semantics-and-observability.md`
- `docs/architecture/08-repository-archaeology-audit-and-cleanup.md`

## Source-confirmed P0/P1 closures in the current pass

1. Production Caddy now shares the Linux host namespace required to reach loopback-only Web, Manager, and employee gateway ports.
2. Manager and Model Gateway now attach to each internal employee bridge with stable aliases; teardown disconnects them before network removal.
3. Employee startup fails closed when the scoped Model Gateway or Hermes health probe fails.
4. Manager MCP uses the strict snapshot path.
5. Business-brain employee/manifest/profile/fact/count reads fail closed instead of converting database faults to empty context.
6. Owner operating-surface auxiliary reads use the strict client.
7. Web rejects successful Manager responses that omit `operating_state`, preventing production protocol drift from becoming a plausible local UI.
8. Tracked Python bytecode, orphaned worktree Gitlink, and superseded archaeology scanner were removed; generated archaeology output and Python caches are ignored.
9. UX coverage documentation now reflects compiled production Next tests and current generated-view design parity.

Current open P0/P1/P2 state is maintained in `docs/architecture/09-current-bug-risk-and-production-gap-register.md`.

## Migration ledger

Current migration head: **`0069`**.

Major ranges:

```text
0032–0038  Model Gateway, reconciler, ambient inbox, effect receipts, grants, welcome gate, duplicate handling
0039–0042  relationships, authorization, assignment scope, release evidence
0043–0047  connector custody and commercial attribution
0048–0054  approval authority, promotion, snapshots, owner/MCP/artifact assignment closure
0055–0059  platform-admin authority and command/session/lease binding
0057a–0059 authority surface categories and authority-version revocation/operational closure
0060–0063  signed artifact/preview authority and ambiguous command reconciliation
0064–0068  onboarding identity and activation authority sequence
0069       canonical owner activation surface grants
```

Do not rewrite or renumber applied migrations. Corrections use new forward migrations.

## Document and memory control

- `docs/architecture/README.md` is the current cross-sectional system map.
- `docs/architecture/11-agent-orientation-and-role-map.md` defines coding-agent roles, source hubs, and validation.
- `docs/architecture/12-document-control-memory-and-handoff-map.md` accounts for root/scoped CODEGRAPH, all handoffs, implementation records, plan families, and Markdown organization.
- `memory/MEMORY.md` is the sole handoff index and remains newest-first.
- `wiki/MVP/implementation-records/README.md` indexes point-in-time factual records.
- Historical files are not moved merely to simplify the tree; current indexes and status banners route readers.

## Evidence boundary and remaining production gates

Not yet accepted:

1. approved real-Supabase application of migrations `0032–0069`, advisors, and behavior matrices;
2. managed production secret custody, least privilege, rotation, old-secret denial, and no-leak proof;
3. target-host Linux Caddy/Docker/employee-network topology, isolation, replacement, and teardown;
4. live identity-provider request/webhook and fixture-free canonical owner activation;
5. live provider-backed generated work object through owner action, external effect, and durable proof;
6. cumulative Model Gateway budget reservation/settlement and replica-safe shared rate limiting;
7. provider timeout idempotency or durable ambiguity/reconciliation policy;
8. complete compensation/deterministic repair and crash-point fault matrix;
9. fixture-free owner Web, SMS, and signed Review acceptance;
10. real connector/provider/accounting/commercial reconciliation;
11. effective-capability graph persistence;
12. shared/fractional employee policy and broader role-safe product perspectives;
13. 100, 250, 500, and 700 employee capacity/fairness with headroom;
14. proof refinding, connector repair UX, WYSIWYG parity, and full WCAG 2.2 AA evidence;
15. rollback, SBOM/attestation, signed deployment manifest, exact deployment, and production acceptance.

## Now-to-production dependency order

1. Freeze one exact candidate SHA and retain all current CI artifacts.
2. Close cumulative budget, shared rate, and provider ambiguity/idempotency source gaps.
3. Prepare managed secrets and approved staging/target-host coordinates.
4. Apply migrations `0032–0069` to approved staging and run advisors/matrices.
5. Prove two-employee network/tenant isolation and target-host Caddy/runtime topology.
6. Run live identity verification and canonical activation.
7. Run one normal owner turn and one provider-backed generated work object with complete receipts.
8. Inject crashes/ambiguity at command, provider, worker, provisioning, routing, and projection boundaries; repair deterministically.
9. Capture fixture-free Web/SMS/Review and connector/commercial reconciliation.
10. Run fleet capacity/fairness and public-workload isolation.
11. Generate signed deployment manifest and proof ledger, deploy only referenced digests, execute rollback, and recompute release acceptance from exact evidence.

The architecture trajectory packet may refine prerequisite order, but `STANDARD.md` and exact live evidence determine whether a gate is closed.
