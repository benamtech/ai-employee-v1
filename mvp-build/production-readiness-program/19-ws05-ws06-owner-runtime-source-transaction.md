# WS-05 / WS-06 Owner Runtime Source Transaction

Status: **source implemented; exact-head automation required; live acceptance open**  
Updated: 2026-07-20  
Task branch: `agent/ws05-ws06-owner-runtime`  
Starting main SHA: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Newer stacked source/test authority: PR #33 merge `943f2613243ebcbcc9fb703e6273e83a5edc0a24`

## Computation admission

`mvp-build/decision/trace004/` was committed at `fbf2decfcc369ef2b7f1cbae2f1f6cd3391b2749` before any product or canonical-document edit.

The 64-candidate quality-diversity search selected 16 exploration trajectories and compressed three admitted trajectories into one coherent implementation:

- `A01` — install a validated initial snapshot atomically;
- `A02` — reject snapshots that do not match the route employee and exact account/employee/assignment scope;
- `A03` — establish a tuple cursor before deltas and reject duplicate, stale, or reordered work events.

Koopman held-out validation did not beat both baselines, so the ledger records `koopman_search_proxy: non_predictive` and makes no mode claim.

## Source behavior implemented

Product source commit `f4c0babb8c2ec9b0cb331cb0abee557f0941ef9a`:

1. The owner Web surface no longer discards the validated stream snapshot and immediately refetches.
2. A snapshot installs only after exact account, employee, assignment, authority-version, full-read-model, operating-context, and tuple-cursor validation.
3. The initial cursor equals the newest `(created_at,id)` across snapshot work events and approvals and is established before deltas.
4. Work-event deltas apply only when exact scope matches and the tuple cursor is strictly newer.
5. Duplicate, stale, reordered, malformed, cross-account, cross-employee, stale-assignment, and stale-authority projections fail closed.
6. Reconnect clears projected scope and waits for a new validated snapshot; it does not resubmit accepted owner intent.
7. Owner message and approval requests include the installed assignment ID and authority version. Manager rechecks both against current durable authority before dispatch.
8. Fixture mode remains explicitly separate and cannot establish fixture-free acceptance.
9. Existing adaptive owner UI, work loops, decisions, active saves, artifacts, and evidence surfaces remain intact; this is not a raw Hermes dashboard.

## Executable evidence

- Red harness before the helper existed: TypeScript `TS2307` for the missing owner-stream-state module.
- Focused local behavior after implementation: `owner_stream_behavior_ok` for snapshot scope/cursor validation, ordered delta acceptance, and duplicate/stale/cross-account denial.
- Exact workflow run `29755929434` on head `69fa4808945d639339729e107065d37b1b495ab2`:
  - Standard/connector suite: 5 files, 20 tests passed;
  - repository governance: 13 controls passed, `GOV-03` failed because two program documents (`03` and `05`) remained under the nested path.
- The relocation defect was corrected by removing the nested subtree and restoring both documents unchanged under `mvp-build/production-readiness-program/`.

Final exact-head workflow results must be attached to PR #34. Until then, source behavior is not CI-accepted on the final candidate.

## WS-06 boundary

No WS-06 external-effect trajectory was admitted to product code because the available environment did not establish the required provider, channel, database, or fixture-free prerequisites. The Website, Contractor Office, and Bookkeeping journeys still require exact evidence that one durable work object preserves:

```text
draft revision
→ approval snapshot bound to that revision
→ one idempotent external effect
→ accepted | failed | ambiguous terminal receipt
→ reconciliation or replay-safe recovery
→ assignment-isolated proof the owner can refind
```

Existing source foundations remain useful evidence, but they do not close WS-06.

## Future product possibilities discovered

- account- and employee-aware context switching that warns about stalled or approval-bound work before changing projection;
- a universal proof permalink that reopens the exact approved revision, effect receipt, and recovery state across Web, SMS, and signed Review;
- owner-safe reconnect language that distinguishes not-started, started, ambiguous, stalled, recovering, and terminal work;
- receipt-backed completion language shared by every channel;
- connector repair affordances that preserve the affected work object and resume only after current scope/authority is restored;
- assignment-isolated proof search across Website, Contractor Office, and Bookkeeping work.

## Predicted future bugs

- a non-work-event projection can regress ordering if it mutates durable owner state without the same scoped cursor discipline;
- authority revocation during an open stream can remain visible until a fresh durable event or reconnect unless the server actively terminates/re-snapshots the projection;
- a resources refresh after approval/progress can race a newer delta unless all resource responses carry and validate the same snapshot cursor/version contract;
- Web can be correct while SMS or signed Review still binds an obsolete revision or assignment;
- receipt loss after provider acceptance can produce duplicate effects unless every journey reconciles by the original idempotency identity;
- proof search can leak or hide evidence if account/employee/assignment filters are not enforced at durable query and projection boundaries;
- fixture payloads can create false confidence if acceptance jobs do not assert fixture-free transport, provider, and durable-state origins.

## Explicitly not established

- full WS-05 completion;
- full WS-06 completion;
- live login/account/employee/connector acceptance;
- fixture-free Web, SMS, or signed Review convergence;
- live provider effects or terminal provider receipts;
- managed database or target-host acceptance;
- cross-browser, accessibility, capacity, commercial, recovery, deployment, pilot, or production acceptance;
- independent WS-07, WS-08, or WS-09 implementation.
