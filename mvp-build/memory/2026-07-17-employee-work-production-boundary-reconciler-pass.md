# 2026-07-17 — employee-work production boundary reconciler pass

Status: source-wired and CI-accepted; not runtime-accepted; not provider-accepted

Branch: `employee-work`, based on `research`

Draft review surface: PR `#19` into `research`

`main` was not edited.

## Objective

Close the highest-value P0/P1 production-boundary gaps and make every remaining live acceptance item executable, fail-closed, test-driven, and release-bound without replacing the canonical normal-employee deployment path.

## Source implementation completed

### Model Gateway and profile isolation

- Employee-bound Hono routes live under `/v1/employees/:employeeId`.
- `buildModelGatewayApp()` is side-effect-free and injectable for HTTP boundary tests.
- Production rejects legacy unbound OpenAI-compatible routes.
- Credential verification checks signature, token hash, account, employee, employee-bound URL, version, expiry, and revocation.
- Employee containers use private per-employee networks plus explicit host-gateway access.
- Provisioning requires successful in-container Model Gateway and Hermes health probes.
- Profile rendering rejects provider master-secret names/values and unresolved tokens, freezes canonical files, and records a deterministic checksum.
- Rotation rewrites the profile, recreates the runtime from the new environment, verifies the replacement credential, revokes the old credential, and confirms the old token is rejected.

Primary additions:

- `apps/manager/src/lib/model-gateway-http.ts`
- `tests/unit/model-gateway-http-isolation.test.ts`
- `tests/unit/model-profile-isolation.test.ts`

### DB-backed provisioning reconciler

Initial onboarding persists desired state and returns `pending`; host effects are owned by the continuously running worker:

```text
claim
-> inspect
-> decide
-> apply one bounded effect
-> verify
-> persist
-> retry or compensate
```

Implemented:

- atomic `FOR UPDATE SKIP LOCKED` job and command leases;
- one bounded effect per worker cycle;
- persisted effect keys before host calls;
- fresh jobs, operation keys, and effect-key sets after compensated retries;
- sealed credential references for reboot reconstruction;
- fleet drift inspection and repair through the same command path;
- strict runtime, route, binding, welcome, and ready ordering;
- processed-welcome database gate before `ready`;
- reclaimable failed/stale filesystem idempotency markers;
- no redundant second Docker restart during credential rotation.

Primary additions:

- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/lib/provisioner-idempotency.ts`
- `tests/unit/provisioner-idempotency.test.ts`
- migrations `0034` through `0038`

### Provider ingress and lifecycle convergence

- Twilio, Gmail, Stripe, and QuickBooks verify authenticity before inbox insertion.
- Provider identity and custom dedupe keys converge on one inbox row.
- Duplicate delivery count and timestamp are recorded atomically.
- Workers enforce leases, ordering, retries, waiting-for-binding, dead letters, and replay.
- Irreversible Twilio effects use durable effect receipts.
- Known failures can retry; completed effects replay idempotently; ambiguous crash windows dead-letter.
- The lifecycle CLI routes restart, suspend, reprovision, rotate, inspect, and repair through `provisioning_commands`; Docker remains read-only for inspection.
- `employees.needs_reprovision` false/null-to-true transitions enqueue one canonical command.

Primary additions:

- `apps/manager/src/lib/ambient-inbox.ts`
- `tests/unit/ambient-inbox-contract.test.ts`
- `infra/scripts/employee-lifecycle.mjs`
- duplicate-evidence RPC in migration `0038`

## TDD and CI closure

Workflow: `.github/workflows/employee-work-production-boundary.yml`

Green Actions proof:

- run ID: `29618584037`
- commit: `249b4a7c8895449fe87727f0d31af7c7580d9f4d`
- result: success

The gate passed:

1. PostgreSQL 17 with Supabase-compatible backend/browser roles, auth helpers, and Storage tables;
2. shared package typecheck/build;
3. database package typecheck/build;
4. all 39 migrations from a blank database;
5. behavioral migration verification for RLS, grants, invoker functions, job leases, expired-lease recovery, terminal command exclusion, ambient leasing, welcome gating/materialization, and edge-only reprovision triggering;
6. Manager and Hono typecheck/build;
7. syntax validation for every production live-proof script;
8. 27 focused production-boundary tests;
9. the real production Manager Docker image build.

Focused test coverage includes:

- malformed, expired, revoked, and cross-employee credential rejection through real Hono routes;
- rejected credentials never reaching provider upstream;
- public/unbound gateway absence;
- profile master-secret and unresolved-token isolation;
- profile checksum change and token replacement on rotation;
- stale/failed idempotency-marker recovery;
- ambient duplicate evidence, effect receipt reuse, and dead-letter replay reset;
- source ordering and image inclusion contracts;
- live-proof manifest completeness and anti-fixture constraints.

## Live acceptance harness completed

Manifest: `infra/acceptance/production-boundary-live.json`

Release-bound proof phases:

1. `migration-staging`
2. `gateway-two-employee-isolation`
3. `gateway-credential-http-matrix`
4. `credential-rotation`
5. `reboot-and-drift-repair`
6. `compensation-and-marker-recovery`
7. `provider-inbox-reliability`
8. `canonical-browser-onboarding`
9. `provider-backed-work-object`

Commands:

```text
npm run prod:boundary:migrations
npm run prod:boundary:gateway -- --employee-a=<id> --employee-b=<id>
npm run prod:boundary:rotation -- --employee=<id> --allow-destructive
npm run prod:boundary:recovery -- --employee=<id> --allow-destructive
npm run prod:boundary:ambient -- --provider=<name> --external-event-id=<id> --dead-letter-inbox=<id>
npm run prod:boundary:onboarding -- --onboarding-proof=<path>
npm run prod:boundary:work-object -- --account=<id> --employee=<id>
npm run prod:boundary:validate -- --proof=<phase>:<path> ...
```

Every phase:

- requires real environment contracts and identifiers;
- emits a redacted JSON proof;
- rejects dev-login, fixture, and UI-fixture paths;
- is aggregated under one `AMTECH_RELEASE_SHA`;
- fails if required evidence is absent;
- requires an exact disposable-employee allowlist and confirmation for destructive phases.

## Database state

Read-only inspection of the connected production Supabase project confirmed `_migrations` still stops at `0031_public_estimator.sql`.

Migrations `0032`–`0038` were not applied to production.

The CI staging-shaped PostgreSQL apply is green, but an actual Supabase preview branch or staging project apply remains a distinct live step. Supabase branch creation can incur cost and was not performed without explicit approval.

## Not claimed

- no production migration application;
- no production stack deployment or host restart;
- no real two-employee deployed gateway packet;
- no live credential rotation packet;
- no live reboot/drift/compensation packet;
- no real provider duplicate/dead-letter/replay packet;
- no canonical public browser onboarding packet;
- no provider-backed generated work-object packet.

The source is ready to run those tests; their proof IDs do not exist yet.

## Remaining risks

- Model Gateway rate counters remain process-local; strict multi-replica rate/budget enforcement still needs shared transactional metering.
- The worker runs in the Manager process; leases make replicas safe, but dedicated process separation and worker metrics may still be preferable.
- Ambiguous irreversible provider effects deliberately dead-letter. Backend receipt/replay contracts exist; a richer operator inspection UI remains future work.
- Production deployment must apply migrations before starting the new Manager/worker source.

## Next concrete sequence

1. create or select an actual Supabase preview/staging project;
2. run `prod:boundary:migrations` and retain its proof;
3. deploy Manager, Model Gateway, and host provisioner from one release SHA;
4. execute the two-employee gateway and HTTP credential matrix;
5. execute rotation and recovery on explicitly disposable employees;
6. capture real provider duplicate/retry/dead-letter/replay evidence;
7. run canonical public onboarding;
8. produce one provider-backed owner-facing work object;
9. aggregate all proofs with `prod:boundary:validate`;
10. only then mark runtime/provider/browser acceptance.
