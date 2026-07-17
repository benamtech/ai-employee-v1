# MVP Readiness Production Plan

Status: canonical execution plan for production readiness. A feature is not complete because code exists. It advances through evidence-backed acceptance states.

## Acceptance states

1. **Planned**: contracts, threats, invariants, rollback, observability, and validation vectors are approved.
2. **Source-wired**: production code paths exist and deterministic tests pass. No live-provider claim is allowed.
3. **Provider-accepted**: a real provider accepted the request and durable evidence links the provider event to the internal account, employee, idempotency key, and attempt.
4. **Runtime-accepted**: the deployed host completed the end-to-end path under retries, faults, concurrency, restart, and isolation tests.
5. **Release-eligible**: every required vector passes, rollback is rehearsed, dashboards and alerts are active, and no critical waiver remains.

A failed vector blocks promotion. Waivers require an owner, expiry date, bounded blast radius, compensating control, and recorded approval. P0 security and money invariants cannot be waived.

## Universal feature-plan contract

Every production feature plan must contain:

- Problem and user-visible outcome.
- Trust boundaries and assets at risk.
- Commands versus events, authoritative state owner, and prohibited authority.
- Preconditions, postconditions, invariants, and negative assertions.
- Idempotency key, replay behavior, concurrency strategy, timeout, retry budget, and dead-letter behavior.
- State machine with terminal, retryable, and compensating states.
- Data migration and backward-compatibility strategy.
- Logs, metrics, traces, audit records, correlation identifiers, dashboards, and alerts.
- Rollout stages, kill switch, rollback, and recovery procedure.
- Validation vectors and exact pass/fail evidence.

## Validation vector schema

Each vector must declare:

- `id`: stable identifier.
- `class`: contract, unit, integration, fault, concurrency, security, migration, observability, live, rollback, or isolation.
- `setup`: deterministic prerequisites.
- `action`: exact stimulus.
- `expected`: positive assertion.
- `forbidden`: negative assertion.
- `evidence`: artifact, query, log, metric, trace, provider identifier, or host inspection command.
- `pass`: machine-checkable predicate where possible.
- `fail`: explicit failure predicate.
- `acceptance_state`: highest state this vector can prove.

No vector passes solely because an endpoint returned 2xx. Evidence must prove the authoritative state transition and absence of forbidden side effects.

---

# Workstream 1: Model gateway and provider-key elimination

## Objective

Employee runtimes receive only short-lived, employee-scoped gateway credentials. Provider master keys remain exclusively in the model-gateway trust boundary and never enter Manager responses, provisioning requests, rendered profiles, container environment, mounted files, logs, traces, database rows, or crash artifacts.

## Production design

- Deploy a host-private model gateway with a loopback or Unix-socket listener and a separately authenticated employee-facing ingress.
- Store provider master credentials only in the gateway secret store.
- Mint opaque, short-lived employee tokens bound to `account_id`, `employee_id`, allowed models, budget, expiration, and token identifier.
- Validate token status and policy on every request. Deny unknown models, cross-tenant use, expired tokens, replay after revocation, and requests exceeding budget or concurrency limits.
- Forward requests through provider-specific adapters. Normalize usage, latency, provider request ID, finish reason, and error classification.
- Never log authorization headers, prompts by default, provider keys, or full provider payloads. Structured audit records contain hashes and identifiers, not secrets.
- Rotate gateway signing keys and provider keys without rebuilding employee profiles.
- Fail closed in production when a gateway token or gateway URL is absent. Direct provider mode is permitted only in explicitly marked local development and must be impossible when `NODE_ENV=production`.

## Required implementation sequence

1. Complete `runtime-profile-integrity.ts` and invoke it after render and validation, before runtime start.
2. Change `profile-renderer.ts` so production model configuration uses `render_secrets.model_gateway_token` and `MODEL_GATEWAY_BASE_URL`; remove direct provider-key token rendering.
3. Return the deterministic profile checksum and persist it with provisioning evidence.
4. Implement token mint, verify, revoke, and rotate operations.
5. Implement gateway request policy, provider adapters, usage ledger, budget enforcement, redaction, and audit emission.
6. Add gateway health and readiness probes that distinguish process health from provider reachability.
7. Deploy canary employee, then two-employee test cohort, then staged fleet rollout.

## Pass/fail vectors

### MG-SEC-001 Master keys absent from runtime
- Setup: all supported provider master keys populated in gateway/host environment.
- Action: render and start two employee profiles.
- Expected: both profiles call the gateway successfully.
- Forbidden: any provider key name assignment or actual master secret value appears in rendered trees, container inspect output, process environment, logs, traces, database rows, or support bundle.
- Pass: automated scanners report zero findings and requests have gateway audit records.
- Fail: one finding or one direct provider request from an employee runtime.
- Acceptance: runtime-accepted.

### MG-AUTH-002 Tenant and employee binding
- Action: use employee A token from employee B and alter account/model claims.
- Expected: 401/403 before provider dispatch.
- Forbidden: provider request ID or billable usage.
- Pass: deny audit exists and provider dispatch count remains zero.

### MG-REVOKE-003 Revocation and rotation
- Action: revoke token during active service and rotate signing/provider keys.
- Expected: revoked token fails within configured cache TTL; newly minted token succeeds; profiles are unchanged.
- Forbidden: old token succeeds after TTL or employee restart is required for provider-key rotation.

### MG-BUDGET-004 Atomic budget enforcement
- Action: issue concurrent requests at the remaining budget boundary.
- Expected: accepted usage never exceeds policy by more than explicitly documented provider uncertainty.
- Forbidden: race-driven unlimited overspend.

### MG-FAULT-005 Provider failure classification
- Action: inject timeout, 429, 5xx, malformed body, connection reset, and partial stream.
- Expected: bounded retry policy, normalized errors, correct usage accounting, no duplicate non-idempotent dispatch where unsupported.
- Forbidden: infinite retry, secret leakage, or false success.

Release gate: all vectors above pass; production renderer has no direct-key branch; master-key scanner is a required CI and deployment gate.

---

# Workstream 2: Provisioning state machine and compensation

## Objective

Provisioning is resumable, single-writer, observable, and safe under duplicate requests, crashes, partial host changes, provider outages, and operator retries.

## Authoritative state machine

`requested -> validating -> rendering_profile -> profile_validated -> creating_runtime -> runtime_started -> routing_configured -> health_verified -> provider_setup -> welcoming -> active`

Failure states retain the failed step and error class. Cancellation or terminal failure enters compensating states in reverse side-effect order:

`compensating_provider -> compensating_routing -> compensating_runtime -> compensating_profile -> compensated`

Manual review is required only when compensation cannot prove the side effect is absent or safely retained.

## Production rules

- One durable job per idempotency key and desired employee generation.
- Workers claim jobs with a lease using an atomic database operation; lease renewal and takeover are explicit.
- Every transition uses compare-and-swap against expected state and records immutable transition evidence.
- Steps are idempotent reconcilers: inspect actual state first, converge to desired state, then transition.
- External side effects persist operation identifiers before waiting for completion.
- Compensation is itself idempotent, retryable, and auditable.
- Runtime activation occurs only after profile checksum, routing, health, and policy checks pass.
- Twilio/provider setup occurs only after runtime health and routing acceptance.

## Required implementation sequence

1. Integrate `provisioning-state-machine.ts` into the actual provisioning command path.
2. Add atomic claim/renew/release database functions and lease-expiry recovery.
3. Split each side effect into a reconciler with inspect/apply/verify/compensate methods.
4. Persist step inputs, output references, profile checksum, runtime/container/network IDs, routing revision, provider IDs, attempts, and error classification.
5. Implement orchestrator loop with bounded retries and compensation policy.
6. Add operator resume, cancel, and retry controls with authorization and audit.
7. Add stale-job sweeper and manual-review queue.

## Pass/fail vectors

### PV-IDEM-001 Duplicate provisioning command
- Action: submit the same idempotency key concurrently 20 times.
- Expected: one logical job and one runtime/routing/provider result.
- Forbidden: duplicate container, port, number, welcome message, or billing effect.

### PV-LEASE-002 Worker crash and takeover
- Action: kill worker after each persisted side effect but before transition.
- Expected: another worker takes the expired lease, inspects state, and resumes without duplication.
- Forbidden: stuck job without alert or duplicate external effect.

### PV-CAS-003 Illegal transition rejection
- Action: race workers and attempt stale or skipped transitions.
- Expected: database compare-and-swap rejects all illegal transitions.
- Forbidden: two authoritative current states.

### PV-COMP-004 Reverse compensation
- Action: inject failure at every state after side effects.
- Expected: compensation runs in reverse order and proves desired cleanup/retention policy.
- Forbidden: orphaned public route, active provider resource for failed employee, or deleted evidence.

### PV-RECON-005 Reconcile existing state
- Action: pre-create some resources, omit others, then run provisioning.
- Expected: converges without replacing healthy resources unnecessarily.
- Forbidden: destructive recreation due solely to missing local acknowledgment.

Release gate: chaos matrix passes for every transition boundary; no direct imperative “create then assume success” step remains.

---

# Workstream 3: Inbox-first Stripe and provider events

## Objective

Every externally delivered event is authenticated, durably accepted once, processed asynchronously at least once, and converted into idempotent domain commands. Provider delivery timing never controls business transaction boundaries.

## Canonical architecture

1. Receive raw bytes and provider headers.
2. Verify authenticity using the provider-specific verifier before acceptance.
3. Derive stable provider event ID and payload hash.
4. In one short database transaction, insert immutable inbox row with unique `(provider, provider_event_id)` and return 2xx only after commit.
5. Worker atomically claims rows with leases and invokes a provider adapter.
6. Adapter maps the external event to versioned internal commands/events.
7. Domain handler applies idempotent state transitions and an outbox record in one transaction.
8. Worker marks processed only after domain commit. Retry classified transient failures with bounded backoff; terminal failures enter dead-letter storage with replay controls.

Raw payload retention, encryption, and deletion follow provider and privacy requirements. Logs never substitute for the inbox.

## Required implementation sequence

1. Replace Stripe inline business processing with verify-and-insert only.
2. Implement Stripe inbox worker and migrate existing event semantics behind idempotent domain handlers.
3. Add claim leases, attempts, next-attempt scheduling, terminal classification, dead-letter and replay.
4. Add outbox dispatch for downstream notifications and provider calls.
5. Define `ProviderWebhookAdapter` contract and shared conformance suite.
6. Migrate Twilio, billing, calendar, email, and future providers one adapter at a time.
7. Delete or block any remaining inline external-event business mutation path.

## Pass/fail vectors

### WH-DUR-001 Commit before acknowledgment
- Action: interrupt database before and after inbox insert.
- Expected: non-2xx before commit; 2xx only after durable row exists.
- Forbidden: 2xx with no durable row.

### WH-IDEM-002 Duplicate and reordered delivery
- Action: deliver each event 100 times and permute event order.
- Expected: one logical domain effect; state converges according to domain version/timestamp rules.
- Forbidden: duplicate credit, invoice, entitlement, notification, or provider call.

### WH-CRASH-003 Crash matrix
- Action: kill worker before claim, after claim, during handler, after domain commit, and before inbox completion.
- Expected: lease recovery and no duplicate domain effect.

### WH-AUTH-004 Signature and replay defense
- Action: mutate body, timestamp, signature, and replay outside tolerance.
- Expected: rejection before insertion where required.
- Forbidden: unauthenticated event reaches a domain handler.

### WH-DLQ-005 Poison event operation
- Action: deliver schema-invalid and permanently failing events.
- Expected: bounded retries, dead-letter with reason/evidence, alert, authorized replay after correction.
- Forbidden: infinite hot loop or silent drop.

### WH-CONF-006 Provider adapter conformance
- Expected: every adapter passes shared authenticity, dedupe, lease, retry, redaction, dead-letter, replay, and observability tests.

Release gate: Stripe has zero inline domain mutations; generic conformance suite is mandatory for every new provider.

---

# Workstream 4: Host boundary deployment and two-employee isolation

## Objective

Manager has no Docker socket or host CLI authority. The host provisioner accepts only authenticated, short-lived, replay-protected declarative operations. Each employee runtime has an isolated network, immutable profile, separate writable workspace, loopback-published gateway, and controlled ingress/egress.

## Deployment sequence

1. Build and sign Manager, host provisioner, model gateway, and employee runtime images.
2. Verify SBOM, vulnerability policy, image digest pinning, and provenance.
3. Deploy host provisioner and gateway without employee traffic; validate Unix socket permissions, secrets, audit sink, health, disk, and restart behavior.
4. Deploy Manager without Docker socket/CLI and prove privileged operations fail from Manager.
5. Provision employee A and employee B with separate accounts, tokens, networks, workspaces, routes, and ports.
6. Execute the complete isolation suite.
7. Restart every component independently and repeat critical vectors.
8. Run rollback rehearsal and restore prior deployment without data loss.

## Two-employee isolation vectors

### ISO-NET-001 Network separation
- Action: from A resolve/connect to B container name, IP, gateway port, workspace services, and private Manager paths; repeat B to A.
- Expected: denied except explicitly brokered Manager/model-gateway APIs.
- Forbidden: shared fleet DNS discovery or direct lateral connection.

### ISO-FS-002 Filesystem separation
- Action: attempt read/write/traversal/symlink access from A to B profile/workspace and host paths.
- Expected: denied; profile is read-only; only A workspace is writable.
- Forbidden: cross-employee or host file visibility.

### ISO-AUTH-003 Credential separation
- Action: swap Manager MCP and model gateway credentials.
- Expected: denied before business/provider dispatch.
- Forbidden: cross-account action or usage attribution.

### ISO-ROUTE-004 Routing separation
- Action: send valid and malformed requests to both public routes and loopback ports.
- Expected: each route reaches only its employee; loopback ports are not externally reachable.
- Forbidden: route confusion, host-wide wildcard exposure, or employee port reachable from public interfaces.

### ISO-EGRESS-005 Controlled egress
- Action: access allowed browser/proxy/MCP destinations and arbitrary denied destinations, including metadata and RFC1918 ranges.
- Expected: allowed capabilities continue working through controlled paths; denied destinations fail and emit audit evidence.
- Forbidden: unrestricted direct egress or loss of required Hermes capabilities.

### ISO-HOST-006 Manager privilege denial
- Action: attempt Docker API, socket access, container CLI, host filesystem mutation, and provisioner request forgery from Manager.
- Expected: all fail; forged, expired, replayed, or unauthorized provisioner requests are rejected.

### ISO-FAULT-007 Independent failure domains
- Action: exhaust CPU/memory/disk/request quota in A and restart A.
- Expected: B remains healthy within defined SLO; alerts identify A.
- Forbidden: fleet-wide outage or shared resource corruption.

Release gate: all isolation vectors pass twice, once fresh and once after independent component restarts; rollback rehearsal passes.

---

# Cross-workstream release board

Order is strict because later evidence depends on earlier trust boundaries:

1. Model gateway negative security controls and renderer fail-closed behavior.
2. Provisioning orchestration wired to create gateway tokens and immutable profile evidence.
3. Stripe inbox-first conversion and generic provider adapter contract.
4. Host canary deployment and two-employee isolation.
5. Full end-to-end provisioning including post-health provider setup and welcome event through inbox/outbox paths.

## Global release criteria

- CI: typecheck, unit, integration, migration, static secret scan, image scan, and feature-vector tests all green.
- No provider master credential is present outside its designated gateway/provider worker boundary.
- No duplicate money, communication, provisioning, routing, or runtime side effect under retry/concurrency tests.
- Every externally initiated action has a durable correlation chain.
- Dashboards and alerts are live before canary traffic.
- Backup/restore and rollback are rehearsed.
- Two independent reviewers sign the evidence manifest.
- PR remains draft until source-wired vectors pass; production release requires provider- and runtime-accepted evidence.

## Evidence manifest

For each release candidate store:

- git SHA and image digests;
- migration version and database backup identifier;
- environment and host identifiers;
- validation vector version;
- machine-readable test report;
- redacted logs/traces and audit queries;
- provider request/event identifiers;
- profile checksums and runtime/network/container identifiers;
- operator, reviewer, timestamps, pass/fail, waiver references, and rollback result.

A release with missing evidence is failed, not unknown or provisionally passed.
