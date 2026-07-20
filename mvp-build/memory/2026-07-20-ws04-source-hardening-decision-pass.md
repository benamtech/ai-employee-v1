# 2026-07-20 — WS-04 source-hardening and decision pass

Status: source-wired; exact-head CI and live target-host acceptance pending

## Coordinates

- Branch: `agent/ws04-target-host-lifecycle`
- Stacked base: PR #32 head `caefb5e253473336514756fb388733ca660332a2`
- Main baseline inherited by PR #32: `48b917389ed85b9652eca43a8e4a8f60b52e917b`
- Migration head: `0072`; no migration changed or added
- Standard: ratified v0.2; no Standard change

## Verified WS-03 state

WS-03 is not mostly complete on current `main`. PR #32 contains DB-P0-01 migration-ledger/hash preflight only. DB-P0-02 through DB-P0-07 remain open, including capability evidence constraints, RLS/grant isolation, authority-version races, effect concurrency, existing-row/rollback compatibility, and disposable managed Supabase proof.

## Decision model

A public decision ledger was created before implementation. Proxy RBF/DPP spectral summary: trace `9.000009`, minimum eigenvalue `0.0235266`, condition number `240.528`, log determinant `-11.3202`. The selected frontier prioritized WS3 adjacency, sole provisioner authority, secret custody/rotation, two-employee isolation, lifecycle safety, immutable digest evidence, and only owner-visible lifecycle projection from WS5.

## Source changes

1. `infra/scripts/employee-lifecycle.mjs`
   - removed direct Docker inspection from the operator CLI;
   - routes inspect, suspend, restore/restart, repair, reprovision, replace, teardown, and rotation through Manager provisioning commands;
   - validates employee IDs;
   - supports caller-supplied idempotency keys and otherwise creates explicit operation keys.

2. `apps/manager/src/lib/secret-custody.ts`
   - defines managed secret descriptors with scope, service, owner, purpose, audience, version, issue/expiry/rotation/revocation, replacement, and rollback bindings;
   - validates audience/version/freshness/revocation;
   - proves sequential rotation continuity and old-token revocation;
   - fingerprints descriptors and redacts raw values.

3. `apps/manager/src/lib/runtime-image-evidence.ts`
   - rejects floating tags;
   - requires exact `sha256:` digest binding, source SHA, resolution time, and HTTPS registry;
   - compares observed runtime image identity with retained evidence.

4. `tests/unit/ws04-host-lifecycle-contract.test.ts`
   - asserts lifecycle CLI cannot directly invoke Docker;
   - asserts Manager command routing;
   - tests secret rotation binding, stale/revoked denial, deterministic descriptor fingerprints, and redaction;
   - tests digest-pinned runtime evidence and floating-tag denial.

## Current/failure/future states

- Current: signed Unix-socket Host Provisioner, per-employee internal networks, target-host isolation proof harness, lifecycle reconciler, and operational scripts already exist.
- Failure found: operator lifecycle inspection bypassed Manager and directly invoked Docker. This pass closes that source bypass.
- Future bug predicted: new lifecycle commands may accidentally regain direct host authority. The source contract now rejects direct Docker use in the lifecycle CLI.
- Alternative use: the secret descriptor and digest evidence contracts can bind managed secret backends and release provenance without changing the authority model.
- Adjacent WS5: owner-facing lifecycle projection may consume durable provisioning state later; no broad fixture-free channel/onboarding work was admitted.

## Evidence boundary

No local checkout or executable CI runner was available in this connected-repository session. No test result is claimed. Existing target-host scripts and historical proofs are not promoted to current exact-head acceptance.

Still required before WS-04 acceptance:

- targeted and broad exact-head CI;
- live managed secret-store inventory and rotation with old-token denial;
- exact candidate on a production-matching Linux target host;
- two-employee network/data/workspace/queue/credential/memory/action isolation proof;
- replace, suspend, restore, rotate, restart, teardown, and neighbor-continuity proof;
- resolved immutable Hermes registry digest retained in release evidence;
- DNS/TLS/Caddy and five-service health proof.

## Unresolved nodes

- `ISS-012`–`ISS-014`: WS-03 beyond DB-P0-01.
- `ISS-015`: managed secret custody/rotation live proof.
- `ISS-016`: five-service/two-employee target-host proof.
- `ISS-017`: lifecycle/neighbor-safe repair exact-candidate proof.
- `ISS-018`: resolved Hermes digest bound to release evidence.
- `ISS-019`–`ISS-021`: WS-05 remain open except future consumption of durable lifecycle state.

## Next dependency move

Run the focused WS-04 unit contract and production-boundary suites on the exact stacked head. Repair any source defect without weakening assertions. Then execute target-host and managed-secret proofs only after PR #32’s WS-03 dependency is accepted or the stacked branch is formally rebased onto its merged result.
