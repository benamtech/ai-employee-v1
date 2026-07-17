# 2026-07-17 — employee-work production boundary reconciler pass

Status: source-wired, not runtime-accepted, not provider-accepted

Branch: `employee-work`, based on `research`

Draft review surface: PR `#18` into `research`

## Objective

Close the highest-value P0/P1 production-boundary gaps without changing `main` or replacing the existing production-like normal-employee deployment path:

1. remove shared/type/API/image ambiguity;
2. prove the model/profile isolation contract in source and unit tests;
3. replace inline provisioning effects with a continuously running DB-backed reconciler;
4. converge provider ingress and lifecycle mutations onto durable inbox/command workers.

## What changed

### Model gateway and profile isolation

- Model Gateway credentials are bound to employee-specific gateway URLs under `/v1/employees/:employeeId`.
- The Hono gateway exports a side-effect-free `buildModelGatewayApp()` entrypoint and starts only when invoked directly.
- Production rejects the legacy unbound OpenAI-compatible routes.
- Credential verification now checks signature, account, employee, employee-bound gateway URL, version, expiry, revocation, and token hash.
- The employee launcher uses an internal per-employee Docker network plus an explicit `host.docker.internal:host-gateway` mapping.
- Provisioning does not advance unless the actual employee container can reach the host-private Model Gateway and its own Hermes API reports healthy.
- Profile rendering continues to reject provider master-secret names/values and unresolved template tokens, freezes canonical files, and records a checksum.
- Model credential rotation rewrites and checksums the profile, recreates the runtime from the new env/profile, verifies the replacement credential, revokes the old credential, and proves the old token fails.

Primary files:

- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/model-gateway-server.ts`
- `apps/manager/src/lib/profile-renderer.ts`
- `apps/manager/src/provisioner-host.ts`
- `infra/scripts/local/start-hermes-container.sh`
- `tests/unit/model-profile-isolation.test.ts`
- `tests/unit/production-boundary-source.test.ts`

### DB-backed provisioning reconciler

- Initial onboarding now persists desired state and returns `pending`; it no longer performs inline host effects.
- Added a continuously running Manager worker around:

  `claim -> inspect -> decide -> apply one bounded effect -> verify -> persist -> retry or compensate`

- Provisioning state order is enforced as:

  `requested -> resources_reserved -> credentials_minted -> profile_rendered -> runtime_started -> runtime_healthy -> routing_activated -> channel_configured -> welcome_sent -> ready`

- Atomic `FOR UPDATE SKIP LOCKED` RPC claims lease jobs, commands, and ambient events.
- Per-effect idempotency keys are persisted before host calls.
- Failed/crashed filesystem idempotency markers are reclaimable when no result exists.
- Compensated retries create a new job, operation key, and effect-key set.
- Sealed MCP and Model Gateway secret references allow worker reconstruction after Manager reboot.
- Fleet drift scans enqueue durable inspection commands; missing runtime/network/profile state is repaired through the same reconciler.
- Runtime, routing, provider binding, and welcome effects are ordered and independently persisted.
- A database gate prevents `ready` until the durable welcome event is processed and an idempotent owner-facing web message exists.

Primary files:

- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/lib/provisioning-state-machine.ts`
- `apps/manager/src/tools/provisioning.stub.ts`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/lib/mcp-auth.ts`
- `packages/db/migrations/0034_reconciler_workers_and_ambient_replay.sql`
- `packages/db/migrations/0035_worker_terminal_claim_and_effect_receipts.sql`
- `packages/db/migrations/0036_worker_service_role_grants.sql`
- `packages/db/migrations/0037_welcome_effect_ready_gate.sql`
- `packages/db/migrations/0038_needs_reprovision_command_trigger.sql`

### Provider ingress and lifecycle convergence

- Twilio, Gmail, Stripe, and QuickBooks webhooks verify provider authenticity before atomically inserting into `ambient_event_inbox`.
- Leased workers enforce ordering keys, retries, waiting-for-binding states, dead letters, and replay.
- Irreversible Twilio sends use durable effect receipts. Applied effects replay; known failures may retry; ambiguous crash windows dead-letter instead of blindly duplicating customer messages.
- Existing provider business handlers run only after the inbox lease is claimed.
- Admin/process-local lifecycle calls now enqueue `provisioning_commands` rather than invoking Docker directly.
- `employees.needs_reprovision` false/null-to-true transitions enqueue a canonical reprovision command, including current MCP rotation/admin flows.
- Manager exposes authenticated internal endpoints for lifecycle command submission and ambient dead-letter replay.

Primary files:

- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/webhooks/twilio.ts`
- `apps/manager/src/webhooks/gmail.ts`
- `apps/manager/src/webhooks/stripe.ts`
- `apps/manager/src/webhooks/quickbooks.ts`
- `apps/manager/src/lib/employee-lifecycle.ts`

### Targeted contract and image checks

- Added compile-time proofs for shared exports, Hono gateway entrypoint, Supabase worker row shapes, bounded provisioner operations, and `ProvisionerResult` contracts.
- The production Manager image build now fails if the gateway, reconciler, ambient worker, or typeproof artifacts are missing.
- Added a dedicated GitHub Actions workflow for shared/db/Manager typechecks, boundary unit/source tests, and a real Manager image build.

Primary files:

- `apps/manager/src/typeproofs/production-boundary.ts`
- `packages/shared/src/profile-package.ts`
- `infra/deploy/manager.Dockerfile`
- `.github/workflows/employee-work-production-boundary.yml`
- `vitest.config.ts`
- `tests/unit/setup-env.ts`

## Validation state

### Completed in this pass

- Static repository review against the current source, migrations, scripts, and newest handoffs.
- Read-only inspection of the connected `amtech-ai-employee-mvp` Supabase project.
- Confirmed the live `_migrations` ledger currently stops at `0031_public_estimator.sql`.
- Confirmed the new `0032`–`0038` gateway/reconciler/inbox migrations are not applied live.
- Added source/unit/type/image validation machinery to the branch.
- Opened draft PR `#18` to expose the branch diff and CI surface.

### Not completed or not proven

- GitHub Actions did not start or report a run during this session; no typecheck, test, or image-build pass is claimed.
- Migrations `0032`–`0038` were not applied to production.
- No staging migration apply/rollback proof exists.
- No production stack deploy or host restart occurred.
- No real two-employee Model Gateway HTTP isolation packet was captured.
- No live credential rotation packet was captured.
- No reboot reconstruction, drift repair, compensation, dead-letter replay, or provider duplicate-ingress packet was captured against a deployed stack.
- No canonical browser onboarding run was performed.
- No provider-backed generated work object exists from this pass.

## Deployment ordering

Do not deploy this branch before the database contract exists. The safe next sequence is:

1. run shared/db/Manager typechecks, boundary tests, and Manager image build;
2. apply and review migrations `0032` through `0038` in an isolated Supabase branch or staging project;
3. deploy Manager, Model Gateway, and host provisioner together;
4. verify the Model Gateway remains loopback-only and absent from public Caddy routes;
5. run the two-employee malformed/expired/revoked/cross-employee credential matrix;
6. provision a normal employee and capture every reconciler transition/resource/effect ID;
7. rotate the Model Gateway credential and prove new checksum/live token/old-token rejection;
8. exercise reboot reconstruction, fleet drift repair, failed-marker recovery, compensation, and fresh retry keys;
9. replay verified Twilio/Gmail/Stripe/QuickBooks duplicates and dead letters;
10. complete the canonical browser onboarding and produce one real provider-backed generated work object.

## Remaining risks

- The new migrations are unapplied and are a hard deployment dependency.
- The Actions workflow exists but has not produced an inspectable run.
- The worker currently runs in the Manager process; leases make multiple replicas safe, but operational metrics and dedicated worker process separation may still be preferable.
- Host/runtime/Caddy/provider behavior is source-enforced but not runtime-accepted.
- Ambiguous irreversible provider effects are deliberately dead-lettered; operators need a support surface for receipt inspection and replay decisions.
- Model Gateway rate counters remain process-local; durable or shared metering is still required for multi-replica strictness.
- No real provider-backed generated work object closes the product acceptance loop yet.

## Next agent starting point

Start with draft PR `#18` on `employee-work`. Do not infer acceptance from the source shape. First obtain a clean CI run, then apply `0032`–`0038` in staging and execute the deployment/proof sequence above. Preserve `research` as the PR base and do not edit `main` directly.
