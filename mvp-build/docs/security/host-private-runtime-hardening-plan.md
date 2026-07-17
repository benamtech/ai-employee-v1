# Host-Private Runtime Hardening Plan

Status: active implementation and acceptance plan
Updated: 2026-07-17
Current state: WS1/WS2 source-wired; live hostile/runtime acceptance pending

## Objective

Keep broad Hermes capability while moving secrets, Docker authority, provider custody, and consequential effects behind explicit host-private boundaries.

## Required invariants

1. Public Manager/Web processes do not receive arbitrary Docker authority. Host lifecycle authority is isolated in the signed Unix-socket provisioner.
2. Provisioner requests are short-lived, signed, idempotent, identity-bound, declarative, and restricted to allowlisted lifecycle operations.
3. Each employee receives a private Docker bridge and loopback-only Hermes gateway port. Peer and unrelated control-service reachability is denied.
4. Employee runtimes retain terminal, files, browser, delegation, MCP, and skills inside their runtime boundary; safety is not implemented by making the employee useless.
5. Canonical rendered profiles are checksummed and read-only. Profile, writable workspace, secrets, runtime state, and temporary storage remain separate.
6. Provider master model credentials never enter employee profiles or containers.
7. Employees call a host-private OpenAI-compatible Model Gateway using an employee-scoped credential bound to account, employee, policy, expiry, and credential version.
8. Provisioning is durable desired-state reconciliation with leases, compare-and-swap transitions, resource evidence, bounded retry, drift repair, and compensation.
9. Twilio/provider bindings and welcome/customer-facing effects occur only after runtime and route acceptance.
10. Provider webhooks verify authenticity and durably insert before acknowledgement; leased workers process asynchronously with retry, dead letter, and replay.
11. No capability becomes production-accepted without hostile/runtime/provider proof artifacts.

## Target topology

```text
Cloudflare -> Caddy -> Web / public Manager API
                         |
                         +-> Manager control-plane workers
                         +-> signed Unix-socket host provisioner -> Docker socket

Employee private bridge -> Hermes runtime
                        -> scoped Manager MCP route
                        -> host-private Model Gateway -> provider master key
```

The Model Gateway is loopback-bound on the host and reached from employee containers through the explicit `host.docker.internal:host-gateway` route. It must not be routed through Caddy, Cloudflare, or public DNS.

## WS1 status — model gateway custody and profile integrity

Source-wired:

- shared gateway policy/token/usage contracts;
- HMAC-bound employee credential mint, verify, revoke, expiry/version checks;
- DB-backed gateway credential and redacted request-audit tables;
- OpenAI-compatible gateway server with bounded timeout/retries and employee-actionable failures;
- production profile rendering of gateway URL, scoped token, model alias, credential version, and non-secret policy only;
- removal of direct provider-key slots from the employee template;
- profile rejection for forbidden secret slots, configured master values, unresolved tokens, unsafe permissions, and checksum drift;
- credential-rotation operation that rewrites token/checksum without rebuilding the full profile package;
- loopback-bound production Compose service and employee host-gateway route.

Not accepted:

- live employee-to-gateway reachability and public non-reachability;
- cross-employee token substitution rejection;
- expired/revoked credential rejection under live runtime traffic;
- runtime reload/restart behavior after rotation;
- transactional spend-budget enforcement and multi-instance rate limiting;
- provider outage/circuit behavior under production load.

## WS2 status — provisioning reconciler foundation

Source-wired:

- canonical resource graph and command vocabulary;
- compare-and-swap transition evidence;
- lease fields and claim helper;
- retry classification and non-terminal operation-key uniqueness;
- resource-state persistence;
- drift inspect/repair lifecycle operations;
- reverse compensation ordering;
- credential rotation, suspend, remove, replace, restore operations;
- RLS-enabled, Manager-only provisioning tables.

Foundation only:

- the current `provision_employee` path still performs inline orchestration;
- there is no continuously running DB-backed reconciler worker claiming jobs and commands;
- fleet-wide orphan/stale/missing-resource scans are not complete;
- admin lifecycle actions are not fully unified through `provisioning_commands`;
- compensation is vocabulary/helper-level, not transition-by-transition production proof.

## Provisioning resource/effect order

```text
account + employee record
-> scoped credentials
-> rendered immutable profile
-> employee network + runtime
-> runtime health
-> gateway/public routing
-> provider/channel bindings
-> welcome/customer-facing effect readiness
-> ready
```

The state helper may persist evidence in a slightly different transition order; acceptance requires proof that no provider/customer-facing effect occurs before runtime + route acceptance.

## WS3 status — ambient inbox

Migration `0032` adds `ambient_event_inbox` with tenant binding, schema version, event/correlation/causation/dedupe/ordering keys, verification metadata, lease/retry/dead-letter state, and timestamps.

This is groundwork only. Existing Twilio, Gmail, Stripe, and other provider routes must be migrated source-by-source to:

```text
bounded raw request
-> signature/provider identity verification
-> atomic inbox insert
-> immediate 200/202
-> leased worker
-> normalize and bind
-> internal event/delivery
-> processed, retry, or dead letter
```

## Acceptance gates

- [ ] Manager public/API service has no Docker socket or equivalent arbitrary host authority.
- [ ] Provisioner is unreachable through public ingress and rejects forged/expired/replayed/non-allowlisted requests.
- [ ] Employee-to-employee and employee-to-control-service probes fail except scoped MCP/model routes.
- [ ] Model Gateway is reachable from employee runtimes and unreachable publicly.
- [ ] Provider master keys and forbidden secret names/values are absent from rendered profiles, runtime env, files, and logs.
- [ ] Profile mutation is detected or discarded on reconciliation; canonical checksum remains authoritative.
- [ ] Credential rotation updates token/checksum, live traffic uses the new credential, and the old credential fails closed.
- [ ] Duplicate/failed provisioning converges safely; interrupted transitions resume or compensate.
- [ ] Host reboot reconstructs every desired `ready` employee.
- [ ] Drift repair covers orphan containers/networks, stale Caddy, missing profile/checksum, expired credentials, and stuck jobs.
- [ ] Duplicate webhooks under concurrency produce one internal event and support bounded replay.
- [ ] Twilio/provider bindings and welcome effects occur only after runtime + route acceptance.

## Static risks recorded 2026-07-17

- Host-provisioner filesystem idempotency markers can survive a failed execution without a cached result, producing `idempotency_in_progress` on same-key replay.
- Compensated provisioning retries require explicit idempotency-path validation.
- Model-gateway rate limiting is process-local; spend limits are not yet decremented transactionally from accumulated usage.
- `0031`–`0033` require disposable-DB migration/constraint/index/grant verification.

## Validation not run

No build, typecheck, unit suite, migration apply, Compose run, hostile network probe, profile scan, credential rotation, provider request, or reboot/recovery proof was run during the 2026-07-17 documentation reconciliation.