# AMTECH AI Employee Build Plan Current — Historical Packet

Status: **superseded historical plan**  
Original date: 2026-06-30  
Current authority: [`../../../mvp-build/production-readiness-program/README.md`](../../../mvp-build/production-readiness-program/README.md)

This folder remains a point-in-time module map and historical planning packet. It is not current execution authority. Do not follow its phase ordering, provider-specific current bar, migration state, pricing assumptions, or acceptance claims without reconciling them against the ratified Standard, active root-level production-readiness program, current source, and exact proof.

## Current routing

1. [`../../../identity.md`](../../../identity.md)
2. [`../../../CODEGRAPH.md`](../../../CODEGRAPH.md)
3. [`../../../mvp-build/CODEGRAPH.md`](../../../mvp-build/CODEGRAPH.md)
4. ratified [`../../../mvp-build/STANDARD.md`](../../../mvp-build/STANDARD.md)
5. active [`../../../mvp-build/production-readiness-program/README.md`](../../../mvp-build/production-readiness-program/README.md)
6. [`../../../mvp-build/memory/MEMORY.md`](../../../mvp-build/memory/MEMORY.md) and newest relevant handoff
7. current source, migrations, executable tests, workflows, proof, PR, and diff

`../../../mvp-build/second-half-plan/` is also historical and non-canonical. The old second-half build plan was superseded by successful prototype work and never established production readiness.

## What remains useful here

- the original whole-product packet in [`../old-build-plan/`](../old-build-plan/);
- historical phase/module dependency maps under [`phases/`](phases/);
- earlier provider/runtime acceptance reasoning;
- admin and metering design history;
- factual links to implementation records.

Use these materials to recover intent or inherited requirements, not to declare present status.

## Current interpretation

- AMTECH's moat is the reusable identity/assignment/capability/connector/work/approval/effect/recovery/proof/commercial protocol.
- Gmail, QuickBooks, and Stripe are adapters rather than the ontology.
- MCP core, MCP Apps, AG-UI, Web, SMS, and signed Review are bounded projections, not authority.
- Routine database TDD uses production-shaped local/CI PostgreSQL.
- Disposable managed Supabase is a material platform-specific and release-candidate gate.
- Production-ready requires every non-waivable Standard gate on one exact signed deployed SHA.

Preserve the historical files beneath this folder. Correct current navigation through this README and the active authority indexes.
