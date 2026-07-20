# AMTECH AI Employee Build Plan Current — Historical Packet

Status: **superseded historical plan**  
Original date: 2026-06-30  
Superseded authority: [`../../../mvp-build/second-half-plan/README.md`](../../../mvp-build/second-half-plan/README.md)

> This folder is retained as a point-in-time module map and historical planning packet. It is not current execution authority. Do not follow its phase ordering, provider-specific “current bar,” migration state, pricing assumptions, or live-database cadence without reconciling them against the ratified Standard, active production program, current source, and exact proof.

## Current routing

Read in this order before using anything in this folder:

1. [`../../../CODEGRAPH.md`](../../../CODEGRAPH.md)
2. [`../../../mvp-build/CODEGRAPH.md`](../../../mvp-build/CODEGRAPH.md)
3. ratified [`../../../mvp-build/STANDARD.md`](../../../mvp-build/STANDARD.md)
4. canonical [`../../../mvp-build/second-half-plan/README.md`](../../../mvp-build/second-half-plan/README.md)
5. [`../../../mvp-build/memory/MEMORY.md`](../../../mvp-build/memory/MEMORY.md) and the newest relevant handoff
6. current source, migrations, workflows, and proof

The single active program is:

[`../../../mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/README.md`](../../../mvp-build/second-half-plan/2026-07-19-ratified-standard-production-program/README.md)

## What remains useful here

This packet still contains:

- the original whole-product packet in [`../old-build-plan/`](../old-build-plan/);
- a historical phase/module dependency map under [`phases/`](phases/);
- earlier provider/runtime acceptance reasoning;
- admin and metering design history;
- factual links to implementation records.

Use those materials to recover intent or identify inherited requirements. Do not use them to declare present status.

## Superseded assumptions

The following statements in this historical family are no longer current authority:

- that this folder is the reconciled current packet;
- that immediate work is ordered by the old Phase 1–13 sequence;
- that Gmail and Stripe define the whole-product connector boundary;
- that a provider integration name defines the connector ontology;
- that repeated live Supabase testing is the normal schema-development loop;
- that migration head is earlier than `0072`;
- that the public estimator or prior pricing ladders are canonical;
- that source/fixture proof establishes live acceptance.

## Ratified current interpretation

- AMTECH's moat is the reusable identity/assignment/capability/connector/work/approval/effect/recovery/commercial protocol.
- Gmail, QuickBooks, and Stripe are shipped adapters, not the ontology.
- MCP core, MCP Apps, and AG-UI are bounded interoperability layers, not authority.
- Routine database TDD uses production-shaped local/CI PostgreSQL.
- Disposable managed Supabase is reserved for material platform-specific and release-candidate evidence.
- Production-ready requires every non-waivable Standard gate on the exact deployed SHA.

## Historical current bar

The original packet used this provider-specific sequence:

```text
signup/claim -> live employee -> estimate PDF -> approved Gmail send
  -> real Gmail customer reply event -> approved Stripe Connect test-mode deposit invoice
  -> internal job reminder
```

That remains a useful historical canary, but the active program generalizes it to fixture-free owner identity, effective capability evidence, managed connector authorization, exact work-object approval, durable effect/receipt, owner-refindable proof, recovery, and commercial reconciliation.

## Organization rule

Do not delete or silently rewrite the historical files beneath this folder. Preserve their dates and inbound paths. Correct current routing through this README, the root/scoped CODEGRAPHs, the active plan index, and `memory/MEMORY.md`.
