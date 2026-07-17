# WS1/WS2 Production Boundary Implementation Record

Date: 2026-07-17
Branch: `research`
Status: source-wired; not provider-accepted; not runtime-accepted

## Scope

This record covers the WS1 Model Gateway / credential-custody pass, the WS2 provisioning reconciler foundation, and the WS3 ambient inbox schema groundwork already present on `research` after it was rebased onto latest `main` through GitHub rebase PR #14.

Rebased research head immediately after PR #14: `0490ae7557e2fd1632c3ef14651747dd34613f83`.

No source implementation was added by the documentation-reconciliation session. This record describes the source that was already on `research` and the remaining acceptance work.

## WS1 source added or changed

- `mvp-build/apps/manager/src/lib/model-gateway.ts`
- `mvp-build/apps/manager/src/model-gateway-server.ts`
- `mvp-build/apps/manager/src/lib/profile-renderer.ts`
- `mvp-build/apps/manager/src/lib/runtime-profile-integrity.ts`
- `mvp-build/packages/shared/src/model-gateway.ts`
- `mvp-build/packages/shared/src/profile-package.ts`
- `mvp-build/packages/shared/src/index.ts`
- `mvp-build/packages/agent-template/config.yaml`
- `mvp-build/packages/agent-template/.env.tpl`
- `mvp-build/infra/deploy/docker-compose.production.yml`
- `mvp-build/infra/scripts/local/start-hermes-container.sh`

### Factual implementation state

- Production profile rendering requires an employee-scoped Model Gateway token unless the explicit non-production local direct-model exception is enabled.
- Profiles render a gateway URL, model alias, scoped token, credential version, and non-secret policy rather than direct provider master keys.
- Gateway credentials bind account, employee, credential ID/version, expiry, allowed providers/models, rate policy, and spend policy.
- Gateway validation checks signature, identity binding, database row, token hash, expiry, revocation, and credential version.
- The gateway exposes OpenAI-compatible chat/responses routes, uses bounded provider timeout/retry, and writes redacted request usage/audit rows.
- Profile integrity checks scan for forbidden secret slots and configured master values, unresolved template tokens, unsafe permissions, and deterministic checksum; the tree is frozen read-only.
- The host-private Model Gateway service is loopback-published on port `8092`; employee runtimes receive an explicit host-gateway mapping.
- Host provisioner supports a model-gateway credential rotation operation that rewrites the rendered token and checksum without rebuilding the full package.

### Not accepted

- employee-to-gateway reachability in the production stack;
- public non-reachability;
- cross-employee/expired/revoked credential negative proof;
- live rotation/reload/revocation behavior;
- production provider request IDs and usage evidence;
- multi-process rate-limit correctness or accumulated-spend enforcement.

## WS2 source added or changed

- `mvp-build/apps/manager/src/lib/provisioning-state-machine.ts`
- `mvp-build/apps/manager/src/tools/provisioning.stub.ts`
- `mvp-build/apps/manager/src/provisioner-host.ts`
- `mvp-build/packages/db/migrations/0032_gateway_reconciler_inbox_foundations.sql`
- `mvp-build/packages/db/migrations/0033_provisioning_operation_key_retry_idx.sql`

Depends on:

- `mvp-build/packages/db/migrations/0031_runtime_boundary_foundations.sql`

### Factual implementation state

- `0032` adds gateway credential/audit tables, provisioning lease/retry/drift fields, resource-state rows, command rows, and `ambient_event_inbox`.
- New control-plane tables enable RLS and revoke anon/authenticated grants.
- `0033` replaces global operation-key uniqueness with uniqueness for non-terminal provisioning jobs.
- The state-machine module defines canonical resource and command vocabularies, retry classification, compare-and-swap transition evidence, lease claiming, resource persistence, and compensation order.
- Inline provisioning mints scoped Manager MCP and Model Gateway credentials before host provisioning and records resource/transition evidence.
- Host operations include ensure, inspect, drift inspect/repair, credential rotation, suspend, remove, replace, and restore.
- Welcome delivery is represented outside host setup as a later idempotent business effect.

### Foundation only

- `provision_employee` still orchestrates inline.
- No continuously running DB-backed reconciler claims jobs and commands.
- No complete fleet scan handles every orphan/missing/stale/expired/stuck resource.
- Admin lifecycle operations are not fully unified through `provisioning_commands`.
- Compensation semantics have not been proven across every transition.

## WS3 groundwork

`ambient_event_inbox` includes provider/source/external identity, tenant binding, schema version, event/correlation/causation/dedupe/ordering fields, payload/header/verification metadata, leases, retries, dead-letter state, and timestamps.

Existing Twilio, Gmail, Stripe, and other provider webhook paths have not been fully migrated to inbox-first acknowledgement and leased-worker processing.

## Static review findings

1. Migrations `0031`–`0033` are structurally additive and security-oriented, but they have not been applied to a disposable production-shaped DB in this session.
2. Shared exports and result contracts appear wired, but no TypeScript compilation was run.
3. Host-provisioner idempotency claims are stored before execution. A failed execution can leave a marker without a cached result, making same-key replay return `idempotency_in_progress` until a new-key or cleanup rule is used.
4. The provisioning tool returns existing compensated jobs as retryable but generates a fresh idempotency key explicitly only for failed jobs; compensated retry needs proof/repair.
5. Gateway rate limiting is process-local. The credential spend limit is a policy gate, not a transactional decrement against accumulated usage.
6. Credential rotation rewrites profile material, but runtime reload/restart and prior-credential revocation sequencing are not established by source alone.
7. Twilio/provider binding and welcome effect ordering require live evidence; code ordering is not acceptance.

## Proof state

No build, typecheck, unit test, integration test, migration application, production Compose run, browser onboarding, provider request, hostile-runtime probe, credential rotation, drift repair, reboot recovery, or proof artifact was produced in this documentation session.

Therefore:

- WS1: `source-wired`, acceptance pending.
- WS2: `source-wired foundation`, reconciler/acceptance pending.
- WS3: `groundwork only`.
- Overall release state: not accepted.

## Required next evidence

1. Apply and review migrations `0031`–`0033`.
2. Run typecheck/build/targeted tests.
3. Start Manager, Model Gateway, host provisioner, Web, and Caddy in the production stack.
4. Provision fresh employees through the canonical public onboarding path.
5. Capture gateway/profile isolation and negative proofs.
6. Implement and prove the DB-backed reconciler and drift repair.
7. Migrate provider ingress to ambient-inbox workers.
8. Capture real provider/runtime/tool proof IDs before changing acceptance status.