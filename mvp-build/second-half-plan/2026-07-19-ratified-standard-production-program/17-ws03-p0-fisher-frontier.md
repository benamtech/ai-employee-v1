# WS-03 P0 Fisher-Adjacent Frontier

Status: **prepared; implementation blocked until the final WS-02 exact head is green**  
Task family: `AMTECH-P0-WS03-000`  
Merged base: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
Migration head: `0072`

## Evidence-design model

The repository does not contain an empirical likelihood `p(theta)` from which a literal Fisher information matrix can be estimated. This plan therefore uses an explicit evidence-design surrogate: each trajectory contributes direct information to the dimensions it tests plus smaller interaction information between jointly exercised dimensions. The design is for test selection, not a production-performance claim.

Selected D-optimal design `D*`:

1. assignment-scoped live-stream isolation;
2. final MCP credential/policy/authority revalidation;
3. protocol-action current-authority intersection;
4. live-run and AG-UI recovery/non-obstruction UX;
5. OAuth custody, verification freshness, and revocation truth;
6. canonical production-source generation and de-duplication;
7. root and `mvp-build` authority routing;
8. migration ledger/hash preflight;
9. RLS/grant negative-isolation matrix;
10. authority-version and effect-idempotency concurrency matrix.

Surrogate spectral summary:

- trace: `24.8120`;
- eigenvalues: `[0.7097, 0.7638, 0.9892, 0.9928, 1.1822, 1.6285, 1.7464, 2.0988, 2.2327, 2.4611, 2.6651, 7.3418]`;
- minimum eigenvalue: `0.7097`;
- condition number: `10.3449`;
- log determinant: `6.0011`.

The E-optimal check passes because the minimum eigenvalue is materially positive and the condition number is far below the `10^6` trajectory-rejection threshold.

## Mirror Cabinet result

The prior WS-02 closure claim failed the structural and semantic checks because the current PR head was not the cited green ancestor and its exact-head Standard/Main Integration workflows were red. WS-03 implementation therefore remains blocked until the repaired exact head passes. This document prepares the next work without inheriting ancestor proof.

## Frontier graph

A node is admissible only when it has at least two Fisher-adjacent edges to tested WS-01/02 boundaries.

| Node | P0 deliverable | Fisher-adjacent verified boundaries | Required red tests | Exit evidence |
|---|---|---|---|---|
| `DB-P0-01` | blank migration ledger through `0072` plus forward-only additions | WS-01 test integrity; documentation coherence; version drift | missing/out-of-order migration, altered applied hash, blank-database failure | deterministic ledger and schema hashes on exact head |
| `DB-P0-02` | effective-capability evidence constraints and current-report selection | WS-02 boundary enforcement; Manager authority; version drift | duplicate current report, stale report selected, wrong assignment/account accepted | unique/current assignment-scoped report under concurrent writes |
| `DB-P0-03` | RLS, grants, and security-definer negative-isolation matrix | WS-01 test integrity; WS-02 boundary enforcement; Manager authority; fail-closed connector | cross-account, cross-employee, cross-assignment, revoked-principal reads/writes | reproducible PostgreSQL matrix with every denial explicit |
| `DB-P0-04` | authority-version revocation race closure | MCP credential revalidation; Manager authority; idempotent effect; version drift | version bump between authentication and dispatch; stale approval/action commit | stale transaction cannot execute or commit consequential work |
| `DB-P0-05` | durable command/effect reservation concurrency | WS-01 regression truth; Manager authority; idempotent effect; version drift | duplicate request, lease expiry, accepted-response loss, concurrent retry | exactly one reservation/effect and explicit ambiguous reconciliation |
| `DB-P0-06` | existing-row/backfill and rollback compatibility | WS-01 test integrity; version drift; documentation coherence | null legacy rows, partial backfill, rollback across old/new application | forward migration and compatible rollback packet |
| `DB-P0-07` | managed Supabase trigger/advisor verification | WS-01 exact-head discipline; WS-02 fail-closed authority; WS-03 frontier | platform behavior differs from local PostgreSQL, advisor/security failure | disposable managed-project proof retained for triggered gates |

## Dependency order

```text
WS-02 exact-head green
→ DB-P0-01 ledger/hash preflight
→ DB-P0-02 capability evidence constraints
→ DB-P0-03 RLS/grant isolation
→ DB-P0-04 authority-version races
→ DB-P0-05 effect concurrency
→ DB-P0-06 existing rows and rollback
→ DB-P0-07 managed-platform trigger proof
```

`DB-P0-03` may start after `DB-P0-01`; `DB-P0-04` and `DB-P0-05` require the relevant schema and constraints from `DB-P0-02/03`. No node may be called accepted before its dependency evidence is green on the same candidate.

## Non-negotiable boundaries

- Do not edit migrations `0001` through `0072`.
- Every new migration is forward-only and hash-recorded.
- Local PostgreSQL is the routine TDD loop, not managed-platform acceptance.
- A failed authoritative read is not an empty result.
- Account membership is not assignment authority.
- Authority-version changes must invalidate stale credentials, projections, approvals, queued commands, and effects before commit.
- Consequential retries reserve once and reconcile ambiguous outcomes before replay.
- WS-03 does not reopen provider, connector, MCP App, AG-UI, or browser authority.

## Start condition

Implementation may begin only when:

```text
final WS-02 PR head
AND Standard/governance green
AND broad aggregate green
AND source/type/lint green
AND production build green
AND compiled-browser regression green
AND Hermes review green where watched paths apply
```
