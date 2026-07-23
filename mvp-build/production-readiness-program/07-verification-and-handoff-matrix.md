# Verification and Handoff Matrix

Status: **active evidence checklist**  
Updated: 2026-07-23  
Structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)

## Evidence classes

```text
P0 representation calculation
P1 formal-model certificate
P2 representation fidelity
P3 exact-candidate executable evidence
P4 external/production acceptance
```

Within P3 and P4, source, unit, integration, managed database, provider, host, browser/accessibility, commercial, recovery, trusted signing, pilot, deployment, and production remain separately reported.

## Gate matrix

| Gate | Required evidence |
|---|---|
| experiment start | exact SHA, content-addressed facts, registered representations, task capsule, predictions, hard invariants, maximum patch |
| formal certificate | claim, semantics, assumptions, model digest, certificate, verifier, correspondence, residual/tolerance, excluded claims |
| plan admission | predictions and plan predate source edits; hard hyperedges have proof obligations |
| source | exact-candidate contracts and generated parity |
| broad regression | complete unit/lint suites without weakened assertions |
| build | all production workspaces compile |
| local database | blank immutable ledger and security/concurrency/receipt tests |
| release-build identity | Compose, five exact-SHA images, image identity, independent manifest verification |
| managed database | managed application, existing rows, security/advisors, backup/restore/rollback |
| connector/provider | live authorization, health, refresh, revoke, outage, repair, deletion, idempotency, response loss |
| owner/golden work | fixture-free channels and all three revision-to-proof journeys |
| target host/recovery | secrets, isolation, lifecycle, faults, restore, rollback, telemetry, accepted-work conservation |
| browser/accessibility | supported engines plus keyboard, screen reader, zoom, focus, reflow, reduced motion, human visual review |
| capacity/pilot | fairness/noisy-neighbor/SSE measurement and complete pilot packet |
| production | every non-waivable gate on one trusted-signed deployed candidate |

## Current exact-candidate matrix

```text
Trace007–Trace013 deterministic checks
→ experiment compiler doctor and isolated lifecycle self-test
→ Trace007–Trace012 retrospective benchmark
→ agentic and structural governance
→ generated-contract parity
→ typecheck and lint
→ focused production/UI/release/recovery tests
→ complete broad unit regression
→ all workspace builds
→ blank-ledger and complete PostgreSQL integration
→ canonical Compose
→ five exact-SHA images
→ image identity
→ independent release-manifest verification
```

Every documentation or merge descendant reruns this matrix. Ancestor evidence does not certify descendants.

## Handoff transaction

```text
branch/base and migration head
→ task capsule and admitted plan
→ selected representations and P1/P2 certificates
→ source/migration/test changes
→ exact commands and results
→ prediction outcomes and evidence ceiling
→ external blockers
→ CODEGRAPH/program update
→ dated memory handoff
→ PR or release record
```

## Rules

- Candidate-edge touch is not software proof.
- A valid P1 theorem or eigenpair remains proof of its exact model property.
- P2 correspondence is separately verified.
- P3 evidence applies only to the exact candidate executed.
- Fixture browser proof is not fixture-free acceptance.
- Source-built signing is not trusted production signing.
- Skipped, unavailable, and blocked remain visible.
