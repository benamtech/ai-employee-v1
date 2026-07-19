# 02 — Pair Trajectories

Status: **[VERIFIED] current coordinates and source controls; [INFERRED] path dynamics; [HYPOTHESIS] testable outcomes**

## TRAJECTORY-P01 — α10 × α11 | SEQUENTIAL

```text
α10 extraction: current 1.0 → target 1.0 | flow 0.0
α11 package purity: current 1.0 → target 1.0 | flow 0.0
smooth cross-partial: 0
```

- [VERIFIED] Current segment is stationary inside the extraction basin.
- [INFERRED] Any reference import or second extraction authority creates a discontinuous jump toward Basin D through W1/W2/W3.
- [VERIFIED] Control: keep no-reference-import, packed-consumer, and one-authority tests mandatory.
- [VERIFIED] Blocker: none for U1 exit; later production dimensions remain gated.
- [INFERRED] Bifurcation: extraction saddle-node already crossed.
- Value: Authority 5 × Connectivity 5 × Bifurcation 5 × Wall Safety 5 → **20/20**.

## TRAJECTORY-P02 — α14 × π56 | GATE

```text
α14 durable store: current 0.75 → target 1.0 | flow +0.50
π56 production PostgreSQL: current 0.0 → target 0.9 after gate | ready flow +1.80
smooth cross-partial: 0; gate discontinuity at live durable acceptance
```

- [VERIFIED] Source migrations and PostgreSQL matrices extend through `0069`; approved production application is absent.
- [INFERRED] Path: `(0.75,0) → (0.9,0) → (1.0,0) → (1.0,0.9)`.
- [INFERRED] Raising π56 before migration, backup, advisor, matrix, and rollback evidence creates a source/schema split attractor.
- [VERIFIED] Control: approved staging target, backup, apply `0032–0069`, schema hash, advisors, all database matrices, rollback checkpoint.
- [VERIFIED] Blockers: π57 managed secrets and π59 live identity coordinate with activation.
- [INFERRED] Bifurcation: saddle-node when durable source and live schema agree.
- Value: **20/20**.

## TRAJECTORY-P03 — σ30 × ρ66 | GATE

```text
σ30 scope lock: current 1.0 → target 1.0 | flow 0.0
ρ66 PDE research: current 0.1 → production target 0.1 | flow 0.0
smooth cross-partial: 0; W6 discontinuity if σ30 drops
```

- [VERIFIED] Research concepts are dispositioned but are not production rendering/authority engines.
- [INFERRED] Explicit research activation may move ρ66 above `0.3` only in an isolated experiment while σ30 remains `1`.
- [VERIFIED] Control: deterministic typed regions remain production authority; PDE/WebGPU artifacts remain outside imports, builds, and release evidence.
- [VERIFIED] Blocker: explicit post-release experiment charter.
- [INFERRED] Bifurcation: transcritical only after explicit basin activation.
- Value: **20/20**.

## TRAJECTORY-P04 — ν46 × ν47 | PARALLEL

```text
ν46 packed-consumer parity: 1.0 → 1.0 | flow 0.0
ν47 legacy compatibility: 1.0 → 1.0 | flow 0.0
smooth cross-partial: 0
```

- [VERIFIED] Both independent gates are occupied and W5-safe.
- [INFERRED] Failure in either returns the system to extraction/compatibility even when source tests pass.
- [VERIFIED] Control: packed artifact, package-consumer, and legacy compatibility matrices remain release-required.
- [VERIFIED] Blocker: none.
- Value: **19/20**.

## TRAJECTORY-P05 — α15 × π58 | FEEDBACK

```text
α15 model-gateway conformance: 0.5 → 1.0 | flow +1.00
π58 live model/provider: 0.0 → 0.9 after gate | ready flow +1.80
smooth cross-partial: 0; mock/live phase transition creates coupling
```

- [VERIFIED] Scoped credentials, provider proxy, commercial scope, receipt extraction, usage audit, timeout, and retries exist.
- [VERIFIED] Cumulative spend, replica-safe rate state, and timeout idempotency remain incomplete.
- [INFERRED] Path: `(0.5,0) → (0.8,0) → (1.0,0) → (1.0,0.9)`.
- [INFERRED] Live traffic before conformance closes creates a pitchfork between accountable usage and overspend/duplicate-cost ambiguity.
- [VERIFIED] Control: durable budget reservation/settlement, shared token bucket, provider idempotency or ambiguity policy, live receipts, credential rotation.
- [VERIFIED] Blockers: π57 secrets and current commercial reconciliation.
- Value: **20/20**.

## TRAJECTORY-P06 — σ40 × π57 | SEQUENTIAL

```text
σ40 secret custody: 0.1 → 1.0 | flow +1.80
π57 managed production secrets: 0.0 → 0.9 after gate | ready flow +1.80
smooth cross-partial: 0; custody-before-deployment gate
```

- [VERIFIED] Source prevents provider master credentials from entering rendered profiles and browser state.
- [VERIFIED] Managed production custody, access audit, rotation, and rollback evidence are absent.
- [INFERRED] Path: inventory → owner/purpose/access matrix → managed injection → no-leak proof → rotation → old-secret denial → π57 activation.
- [INFERRED] Inversion creates a branch where `.env` presence is mistaken for custody.
- [VERIFIED] Control: managed secret mechanism, per-service least privilege, exact rotation evidence.
- [VERIFIED] Blocker: approved deployment target/operator authority.
- Value: **20/20**.

## TRAJECTORY-P07 — χ74 × χ76 | FEEDBACK

```text
χ74 cognitive load: 0.6 → 0.3 | flow -0.60
χ76 approval fatigue: 0.3 → 0.2 | flow -0.20
smooth cross-partial: 0; operational positive feedback loop
```

- [INFERRED] Excess decisions increase fatigue; fatigue increases errors/rework; rework increases load.
- [VERIFIED] Current UX counters this with active saves, exception-first decisions, deterministic prominence, stable landmarks, and silent/batch triage.
- [INFERRED] Path: consolidate low-risk notifications → explain exact consequence → preserve high-risk gates → measure comprehension/error/recovery.
- [INFERRED] Bifurcation: Hopf oscillation when the system alternates between over-notifying and hiding consequential work.
- [VERIFIED] Control: finite decision queues, risk-scaled prominence, batch low-risk work, no inferred pressure.
- [VERIFIED] Blocker: live workload/usability evidence.
- Value: **19/20**.

## TRAJECTORY-P08 — ν52 × π61 | TRANSFORM

```text
ν52 isolation proof: 0.75 → 1.0 | flow +0.50
π61 production outbox/effect durability: 0.0 → 0.9 after gate | ready flow +1.80
smooth cross-partial: 0; isolation gates production effect claims
```

- [VERIFIED] Per-employee networks, ambient inbox, command/effect receipts, provider/accounting receipts, and dead letters exist.
- [INFERRED] Isolation must prove that one employee/account/provider effect cannot leak or duplicate across another before outbox production claims are meaningful.
- [INFERRED] Path: two-employee network/tenant matrix → crash at claim/dispatch/receipt/projection → exactly one final effect → π61 activation.
- [INFERRED] Bifurcation: isolated durable lane versus cross-tenant/duplicate-effect lane.
- [VERIFIED] Control: target-host isolation, PostgreSQL concurrency, crash injection, receipt reconciliation.
- [VERIFIED] Blockers: π56 database, π63 crash, π64 dead-letter/replay.
- Value: **20/20**.

## TRAJECTORY-P09 — α20 × ν53 | PARALLEL

```text
α20 implementation idempotency: 0.6 → 1.0 | flow +0.80
ν53 validation idempotency: 0.6 → 1.0 | flow +0.80
smooth cross-partial: 0
```

- [VERIFIED] Stable owner intents, provisioning idempotency, ambient dedupe, effect receipts, and command claims exist.
- [INFERRED] Source idempotency without concurrency/crash proof leaves a hidden duplicate-effect basin; validation with different keys tests the wrong system.
- [INFERRED] Path: enumerate effect identities → race duplicate claims → kill after each boundary → replay same event/intent → assert one effect and one terminal lineage.
- [INFERRED] Bifurcation: transcritical when validation identity and production identity diverge.
- [VERIFIED] Control: shared deterministic keys, database uniqueness/leases, exact retry code in tests/live proof.
- [VERIFIED] Blocker: provider-specific idempotency/ambiguity support.
- Value: **20/20**.

## TRAJECTORY-P10 — π65 × min(π56…π64) | GATE

```text
π65 deploy readiness: current 0.1 → target min(π56…π64)
minimum production coordinate: current 0.0 → target ≥0.9
ready flow for each zero π56…π64: +1.80
```

- [VERIFIED] Current minimum is `0.0`; deploy readiness cannot exceed the weakest production coordinate.
- [INFERRED] Path: close prerequisites without launch claim → activate production triad/quadruplet → crash/dead-letter/reconciliation proof → deployment/rollback attestation → π65 tracks the accepted minimum.
- [VERIFIED] Control: release manifest computes the minimum from proof IDs, not narrative state.
- [INFERRED] Bifurcation: saddle-node at `min≥0.9`; earlier deployment attempts remain non-production.
- [VERIFIED] Blockers: every π56…π64 coordinate.
- Value: **20/20**.
