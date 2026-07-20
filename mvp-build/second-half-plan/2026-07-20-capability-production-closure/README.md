# Capability Surface Production Closure — Execution Packet

Status: implementation complete; exact-head CI and live acceptance remain separate gates.

Date: 2026-07-20  
Repository: `benamtech/ai-employee-v1`  
Branch: `employee-production-tuesday`  
Draft PR: `#23`  
Implementation anchor: `5b56e6a2249f4b5a650d81badbdd7b95cd6ea2bb`

## Read order

1. `01-standardized-execution-output.md`
2. `02-production-next-step-plan.md`
3. `03-verification-and-handoff-matrix.md`
4. `04-recent-change-reference-map.md`
5. `../../memory/2026-07-20-capability-surface-ci-closure-and-next-plan.md`

## Closed in this execution

- `mvp-build/apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx` now represents connector setup as one nullable `{ href, label }` action.
- `mvp-build/tests/unit/capability-drawer-setup-contract.test.ts`, describe `CapabilityDrawer connector setup action`, test `keeps the connection href and label in one null-safe action`, prevents the split-state regression.
- `mvp-build/tests/unit/employee-stream-strict.test.ts`, describe `employee snapshot strict reads`, test `routes every production owner and employee context entry point through strict reads`, verifies strict reads for capability enrichment and operating-state materialization.
- `mvp-build/tests/unit/production-topology-acceptance.test.ts`, describe `target-host production topology acceptance`, test `binds staging migration proof to the complete current migration range`, derives the expected migration head from the migration ledger.

## Current authority

Migration head is `0072` at `mvp-build/packages/db/migrations/0072_artifact_revision_scope_guards.sql`. Canonical Compose is `mvp-build/infra/deploy/docker-compose.production.yml`. The UI gate is `.github/workflows/ui-agent-operating-surface.yml`, job `source-contracts`, step `Typecheck web`, followed by job `browser-fixture`. The production boundary gate is `.github/workflows/employee-work-production-boundary.yml`, job `boundary`, step `Production boundary unit and source proofs`.

This packet may establish only `source-wired` and named `ci-accepted` scope. It does not establish real database, runtime, provider, fixture-free browser/channel, commercial, deployment, rollback, or production-ready acceptance.
