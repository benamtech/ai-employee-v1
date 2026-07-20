# 2026-07-18 — S2–S9 authority and runtime-boundary checkpoint

Status: active branch handoff

Branch: `employee-production-tuesday`
Base: `research`
Integration PR: draft `#23`
Implementation evidence SHA: `a9184be1af68ed6c5372d642928db46b51eb0506`

Documentation commits after the implementation SHA do not change runtime behavior. Do not substitute their SHAs for the implementation proof anchor unless the required gates are rerun.

## Executive state

The branch has moved materially beyond the earlier Lane 1/Lane 3 foundation checkpoint. It now contains source, migration, unit, blank-PostgreSQL, generated-Manager, and production-image closure for the major S2–S9 authority boundaries implemented in this pass.

Current state:

`standard-remediation_s2-s9-branch-ci-postgres-image-accepted_not-live-accepted_not-launch-cleared`

This is branch-level source/CI/PostgreSQL/image acceptance only. It is not real-Supabase, live-runtime, external-provider, fixture-free browser/SMS, commercial-reconciliation, capacity, rollback, deployment, or production acceptance.

## Architectural invariant preserved

Hermes remains the runtime substrate. Manager constrains and coordinates Hermes rather than replacing it.

Hermes continues to own:

- agent execution;
- transcript/session continuity;
- streaming and turn processing;
- runtime recovery and rotation;
- employee-local materialization and memory behavior.

Manager owns:

- authenticated principal and exact assignment resolution;
- durable command/effect registration;
- approval and platform authority;
- credential issuance and revocation;
- connector/commercial provenance;
- durable accepted, failed, or ambiguous receipts;
- repair and release evidence.

The owner web path now wraps the existing Hermes turn delivery in C3 without introducing a parallel agent runtime.

## Recent branch changes

### S2/S3 — owner and signed-resource assignment enforcement

Primary source:

- `packages/shared/src/assignment-resolver.ts`
- `packages/shared/src/session-enforcer.ts`
- `apps/manager/src/lib/owner-assignment-authority.ts`
- `apps/manager/src/lib/owner-session.ts`
- `apps/manager/src/middleware/assignment-guard.ts`
- `apps/web/src/middleware/assignment-guard.ts`
- `apps/manager/src/lib/preview-links.ts`
- `apps/manager/src/lib/signed-links.ts`

Implemented:

- owner requests resolve one current human principal, employee assignment, role, resource grant, action, and policy version;
- owner sessions carry and verify durable human-principal authority versions;
- account membership, bearer possession, caller-selected employee/account IDs, phone ownership, and mutable headers are not complete authority;
- all newly issued preview/action links require one exact assignment;
- assignment-bound preview links and artifact links carry the authority version current at issuance;
- stale signed resources are synchronously revoked after security-relevant assignment changes;
- historical unscoped preview rows are not promoted into authority.

### Owner web turns through C3

Primary source:

- `apps/manager/src/lib/owner-turn-command.ts`
- `apps/manager/src/lib/owner-turn-repair.ts`
- `apps/manager/src/lib/durable-command-runtime.ts`
- `apps/manager/scripts/generate-production-server.mjs`

Implemented:

- browser-provided stable intent IDs produce deterministic command/effect identities;
- owner messages register one durable `owner.web.turn` command before Hermes execution;
- duplicate retries replay the terminal receipt rather than invoking Hermes again;
- queued or uncertain Hermes turns become durable `ambiguous` receipts, never fabricated success;
- the repair endpoint inspects `employee_turn_jobs` and reconciles accepted or failed state without re-running the model/provider effect;
- inbound/outbound employee messages remain assignment-bound and idempotent.

### S5 — connector custody

Primary source:

- `packages/shared/src/connector-custody.ts`
- `apps/manager/src/lib/connector-custody.ts`
- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/webhooks/gmail.ts`
- `apps/manager/src/webhooks/quickbooks.ts`
- `apps/manager/src/webhooks/stripe.ts`
- `apps/manager/src/webhooks/twilio.ts`
- migrations `0043`–`0047`

Canonical ingress:

```text
provider authenticity
-> durable ambient inbox
-> connector binding
-> exact assignment and resource grant
-> stable dedupe
-> C3 command/effect
-> durable receipt
```

Gmail, QuickBooks, Stripe, and assignment-bound Twilio paths now bind provider resources to durable connector custody rather than selecting authority from account membership or route hints.

### S6 — commercial attribution and Model Gateway receipts

Primary source:

- `packages/shared/src/commercial-attribution.ts`
- `apps/manager/src/lib/commercial-attribution.ts`
- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- migrations `0043`–`0047`

Canonical commercial dimensions:

```text
assignment_id
+ current payer
+ current beneficiary
+ immutable price_version
+ provider receipt
+ accounting receipt
```

Successful Model Gateway responses are not returned as `ok` until provider and accounting evidence is durable. Provider success with uncertain accounting state is `ambiguous`, not fabricated success. Billing state remains separate from authorization.

### S7 — approval authority and execution

Primary source:

- `packages/shared/src/approval-authority.ts`
- `apps/manager/src/lib/approval-authority.ts`
- `apps/manager/src/lib/approval-promotion.ts`
- `apps/manager/src/tools/approval-authority.stub.ts`
- `apps/manager/src/tools/approved-actions.stub.ts`
- `apps/manager/src/tools/qbo-approval-promotion.stub.ts`
- migrations `0048`–`0054`

Implemented:

- immutable approval snapshots bind assignment, action, resource, policy, risk class, resolver roles, and required resolver action;
- legacy approval rows require explicit promotion and cannot silently gain authority;
- preview resolution validates durable assignment/human authority, current role/grant/policy, expiry, revocation, and single-use state;
- approval consumption is atomic under concurrency;
- provider execution revalidates the approved snapshot and assignment authority immediately before the effect;
- one approval cannot authorize a different assignment, resource, action, policy, or changed snapshot.

### S8 — platform admin and support authority

Primary source:

- `packages/shared/src/platform-admin-authority.ts`
- `apps/manager/src/lib/platform-admin-runtime.ts`
- `apps/manager/src/lib/admin.ts`
- `infra/scripts/platform-admin-session.mjs`
- `.github/workflows/lane8-platform-admin-authority.yml`
- migrations `0055`–`0059` with the `platform_*` names

Implemented/source-wired:

- durable `pad_` platform sessions store only token hashes;
- current platform principal, role, audience, session version, expiry, revocation, and bounded step-up are enforced;
- customer detail/support reads require an exact expiring support lease;
- consequential support writes require step-up, exact account/employee/assignment lease scope, stable intent, C3 command/effect, and accepted receipt;
- legacy mutable identity headers are denied and audited;
- platform command actor/session/lease binding is durable.

The dedicated Lane 8 workflow is present and exact-SHA gated. The current implementation checkpoint passed shared/Manager typecheck, complete migrations, and the broad production source suite; do not claim a current-head dedicated Lane 8 dispatch unless its run ID is separately recorded.

### S9 — authority-version revocation spine

Primary source:

- `packages/shared/src/authority-version.ts`
- `apps/manager/src/lib/mcp-auth.ts`
- `apps/manager/src/lib/owner-session.ts`
- `apps/manager/src/lib/preview-links.ts`
- migrations `0057a`, `0058_authority_version_revocation_spine.sql`, `0059_authority_version_operational_closure.sql`, and `0060`–`0063`

Implemented:

- durable authority versions exist for human principals and employee assignments;
- security-relevant relationship, role, resource-grant, policy, principal, lifecycle, or credential changes bump one authoritative version;
- owner sessions, Hermes Manager MCP credentials, approval rows, preview links, and artifact links carry issuance-time authority versions;
- stale MCP credentials, signed resources, owner sessions, and pending approvals are synchronously denied/revoked at the relevant boundary;
- an outbox provides leased, skip-locked operational propagation for cache invalidation, runtime teardown, alerting, and evidence delivery without making authorization depend on an in-process event bus;
- approval execution checks current authority immediately before provider effect;
- all new preview credentials require an exact assignment.

### Generated Manager production surface

Primary source:

- `apps/manager/src/server.template.ts`
- `apps/manager/scripts/generate-production-server.mjs`
- `apps/manager/scripts/production-admin-block.mjs`
- `apps/manager/src/server.ts`

The large Manager route surface is generated from a hash-pinned template. The generator injects the current owner, approval, admin, command, and repair closures and fails when the template blob or required markers drift. `server.ts` remains a minimal entrypoint rather than an independently edited parallel server.

### Local-production and SDRT tooling

Primary source:

- root `package.json`
- `mise.toml`
- `local-prod/**`
- `scripts/local-prod/**`
- `scripts/sdrt/sdrt_validator.py`
- `scripts/sdrt/sdrt_mcp_server.py`

Added:

- exact-SHA local production preflight, audit, build, test, verify, start, and go/no-go orchestration;
- package-manager authority: root pnpm for orchestration, `mvp-build/package-lock.json` plus npm for application dependencies;
- bounded SDRT-v2 parser, canonical round trip, query tooling, and read-only MCP exposure;
- production topology checks for Manager, Model Gateway, host provisioner, web, and Caddy;
- explicit separation between local exact-SHA evidence and later remote/live acceptance.

### Manager image and build-context closure

Primary source:

- `infra/deploy/manager.Dockerfile`
- `mvp-build/.dockerignore`
- `.github/workflows/employee-work-production-boundary.yml`

The Manager Docker build now copies the complete hash-pinned generator input closure before root `npm ci`, so the root `prepare` lifecycle cannot run against a partial source tree. The Docker context excludes host `node_modules`, build outputs, logs, mutable reports, local secrets, memory/wiki/docs, and editor state. The production boundary retains plain Docker diagnostics as an artifact.

## Forward migration ledger added after the former `0042` checkpoint

- `0043_connector_custody_and_commercial_attribution.sql`
- `0044_connector_binding_scope_dimensions.sql`
- `0044b_connector_compatibility_timestamps.sql`
- `0045_connector_consumer_and_commercial_rows.sql`
- `0046_connector_binding_lifecycle.sql`
- `0047_gateway_ambiguous_audit_state.sql`
- `0048_approval_authority_and_execution.sql`
- `0049_approval_legacy_promotion.sql`
- `0050_atomic_preview_approval_consumption.sql`
- `0051_immutable_approval_snapshots.sql`
- `0052_fix_approval_resolution_namespace.sql`
- `0053_owner_assignment_consumer_closure.sql`
- `0054_mcp_artifact_assignment_closure.sql`
- `0055_platform_admin_authority_groundwork.sql`
- `0056_platform_admin_authority_activation.sql`
- `0057_platform_command_actor_enforcement.sql`
- `0057a_authority_surface_categories.sql`
- `0058_platform_command_session_lease_binding.sql`
- `0058_authority_version_revocation_spine.sql`
- `0059_platform_command_exact_lease_resolution.sql`
- `0059_authority_version_operational_closure.sql`
- `0060_signed_artifact_authority_closure.sql`
- `0061_ambiguous_command_reconciliation.sql`
- `0062_all_preview_authority_versions.sql`
- `0063_preview_assignment_required.sql`

Do not renumber or rewrite these applied forward migrations. Resolve future defects with new forward migrations.

## Exact branch-level proof on implementation SHA

Implementation SHA: `a9184be1af68ed6c5372d642928db46b51eb0506`

- Phase 2 Remediation Plan Integrity run `29662757178`: **success**
- Lane 1 Relationships and Authorization run `29662757194`: **success**
- S2 S7 S9 Production Boundary run `29662757252`: **success**
- Lane 10 Integrated CI and Release Evidence run `29662757197`: **success**
- Employee Work Production Boundary run `29662757204`: **success**

Observed proof includes:

- canonical generated Manager source;
- shared, database, and Manager typecheck/build;
- source/unit contract suites;
- complete forward migration ledger through `0063` on blank PostgreSQL 17;
- Lane 1 relationship/RLS matrix;
- Lane 3 command/effect matrix;
- S5 connector/S6 commercial matrix;
- S7 approval resolution and execution matrix;
- S9 authority-revocation matrix;
- assignment-bound signed preview/artifact revocation and unscoped-preview denial;
- ambiguous Hermes-turn reconciliation without a second effect;
- worker migration/recovery regression;
- release-evidence manifest generation;
- production Manager Docker image inclusion.

## Evidence boundary

Not yet proven on the implementation SHA:

- real Supabase staging application and behavior;
- live external provider packets for Gmail, QuickBooks, Stripe, Twilio, or Model Gateway accounting;
- fixture-free browser/SMS/signed-review acceptance;
- current-head dedicated Lane 8 workflow dispatch evidence;
- remote host/runtime, reboot, drift, recovery, and compensation packets;
- commercial invoice reconciliation against real provider costs;
- 100/250/500/700 provisioned-agent capacity and fairness;
- rollback rehearsal, SBOM/attestation, exact deployment, or production readiness.

## Next concrete move

1. Treat `a9184be1af68ed6c5372d642928db46b51eb0506` as the implementation proof anchor for this checkpoint.
2. Apply the complete migration ledger to the approved real Supabase staging target and retain exact-SHA behavior evidence.
3. Run the dedicated Lane 8 exact-SHA workflow if S8 is the next acceptance target.
4. Capture fixture-free owner web/SMS/signed-review and real connector/provider packets through the new assignment/C3/revocation boundaries.
5. Continue S10 onboarding identity saga, then capacity/recovery/commercial reconciliation and release gates in dependency order.
6. Do not merge to `main` or claim launch readiness from branch CI alone.
