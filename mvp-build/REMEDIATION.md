# REMEDIATION.md — Historical Plan Router

Status: **historical remediation plan; not current execution authority**  
Original audited source: `d963efcaff9285cdf8ebc6c069213a2cda7d110d`  
Original blob preserved in Git history: `51bae06670bd4b00dc88dca42f13596b78c22923`  
Superseded: 2026-07-20

The original remediation document correctly emphasized relationship graphs, database-owned races, principal-bound authority, durable receipts, forward migrations, and proof-class separation. Those useful invariants were absorbed into Standard v0.2, source, migrations, tests, and the active production-readiness program.

Its numbered remediation sequence is no longer current. Do not execute it directly or use it to infer present implementation status.

## Current remediation route

```text
current source / migrations / tests / proof
→ computation-first decision protocol
→ current issue vector and resolution ledger
→ workstream completion contract
→ selected implementation compression
→ Red → Green → Refactor
→ exact-head evidence
```

Read:

1. [`decision/README.md`](decision/README.md)
2. [`production-readiness-program/04-dependency-ordered-production-plan.md`](production-readiness-program/04-dependency-ordered-production-plan.md)
3. [`production-readiness-program/08-production-issue-vector.json`](production-readiness-program/08-production-issue-vector.json)
4. [`production-readiness-program/13-resolution-ledger.json`](production-readiness-program/13-resolution-ledger.json)
5. [`production-readiness-program/09-workstream-execution-map.md`](production-readiness-program/09-workstream-execution-map.md)
6. [`production-readiness-program/10-test-suite-disposition.md`](production-readiness-program/10-test-suite-disposition.md)
7. current `CODEGRAPH.md`, architecture maps, source, and exact evidence

## Current transaction

The active WS-06/07/08 source transaction is documented in:

- [`production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md`](production-readiness-program/20-ws06-ws08-commercial-effect-transaction.md)
- [`decision/trace007/`](decision/trace007/)

The implementation compression is `D01,D02,D03,D04,D06,D07`: atomic shared admission, durable settlement/conservation, provider idempotency and ambiguity reconciliation, accepted effect/accounting continuity, exact golden-work completion, and convergent proof repair.

## Retained remediation principles

- compute the applicable possible-decision vectors before selecting implementation;
- build durable authority rather than scattered checks;
- let PostgreSQL own shared races and conservation;
- bearer possession is not authorization;
- no accepted effect is reported without the required durable receipts;
- ambiguity reconciles before retry;
- forward migrations preserve history;
- test the selected invariant boundary and minimum failure manifold;
- documentation never promotes evidence class;
- no P0/P1 launch waiver is implied by source progress.

## Historical integrity

The superseded full plan remains available through Git history at the original blob. Any old remediation item must be re-derived from current evidence and pass the applicable computation tier before implementation.
