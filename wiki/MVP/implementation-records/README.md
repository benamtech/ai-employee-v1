# MVP Implementation Records

Status: active historical factual ledger  
Updated: 2026-07-20

This folder records point-in-time implementation and proof state for `mvp-build/`. It preserves factual history; it does not define current architecture, branch status, dependency order, or acceptance by itself.

## Read order

1. `../../../identity.md`
2. root `../../../CODEGRAPH.md`
3. `../../../mvp-build/CODEGRAPH.md`
4. ratified `../../../mvp-build/STANDARD.md`
5. active `../../../mvp-build/production-readiness-program/README.md`
6. `../../../mvp-build/memory/MEMORY.md` and the newest relevant handoff
7. `../../../mvp-build/docs/architecture/README.md`
8. the relevant dated implementation record
9. current source, migrations, executable tests, workflows, proof, target-environment evidence, PR, and diff

Everything under `../../../mvp-build/second-half-plan/` is historical and non-canonical. Older implementation records remain point-in-time evidence and must not be silently repeated when current source or exact evidence differs.

## Current factual boundary

- The canonical product path is real owner identity, explicit assignment, canonical activation, durable provisioning, isolated Hermes runtime, governed capabilities/connectors, owner Web/SMS/signed Review, provider-backed work, terminal receipts, recovery, and refindable proof.
- Current main baseline for the active program is `48b917389ed85b9652eca43a8e4a8f60b52e917b`; PR #33/source/tests are newer authority only for their exact evidence.
- Standard v0.2 is ratified; migration head remains `0072` unless current source proves otherwise.
- The single active program is `mvp-build/production-readiness-program/`.
- WS-05 and WS-06 remain incomplete without exact fixture-free owner/channel/cross-account/work/effect/receipt/recovery/proof evidence.
- Target-host, live connector/provider, managed database, commercial, capacity, rollback, deployment, pilot, and production acceptance remain separate gates unless exact current evidence closes them.

## Record requirements

Every new implementation record includes date, branch, PR, exact implementation SHA, exact source/migration files, acceptance vocabulary, exact tests/workflows/proofs, validation not run, unresolved risks, current authority links, and an explicit statement that later source may supersede it.

## Proof rule

Local PostgreSQL, mocks, fixtures, static source review, local screenshots, old containers, manually injected events, trajectory scores, historical records, and the public estimator cannot satisfy provider/runtime/deployment acceptance. Production claims require the exact boundary-specific evidence named by the Standard and active program.

Historical records stay in place to preserve paths and point-in-time facts. Current navigation is provided by this README, root/scoped CODEGRAPH, the active program, `memory/MEMORY.md`, and the architecture document-control map.
