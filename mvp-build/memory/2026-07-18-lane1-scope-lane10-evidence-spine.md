# 2026-07-18 — Lane 1 scope inventory and Lane 10 evidence spine

Status: current handoff
Branch: `employee-production-tuesday`
Integration PR: draft `#23` targeting `research`
Base rule: `main` was not edited

## Goal

Advance the next dependency gate after Lane 1 foundation and Lane 3 kernel integration:

1. make Lane 1 assignment/authorization scope concrete across consequential surfaces;
2. establish Lane 10's integrated CI and release-evidence spine;
3. avoid jumping into sessions, approvals, admin revocation, or onboarding saga before the shared foundations are consumable and evidence-gated.

## What changed

### 1. Lane 1 consequential-surface scope registry

Added `packages/shared/src/authorization-scope-registry.ts`.

It defines a typed, executable inventory for:

- consequential tables;
- Manager routes;
- SMS paths;
- signed resources;
- connector bindings;
- owner sessions;
- admin/support actions;
- commercial rows;
- service/worker consumers;
- public claims.

For each surface, the registry records:

- source file or boundary;
- lane owner;
- whether the surface is enabled and customer-consequential;
- required scope: explicit assignment, assignment resolver, approved platform context, approved system context, or noncanonical diagnostic;
- authorization contract: C1/C2/C3/C4/C5/C6;
- allowed authorizers;
- forbidden authorizers;
- required evidence.

The registry explicitly denies the shortcuts named in the current handoff:

- account membership alone;
- `employees.account_id` alone;
- bearer possession alone;
- caller-selected account or employee IDs;
- mutable header identity;
- phone number alone;
- signed payload without durable resource lookup.

The public estimator remains disabled/noncanonical in the registry and cannot contribute release proof.

### 2. Lane 1 registry tests

Added `tests/unit/authorization-scope-registry.test.ts`.

The suite verifies:

- every consequential surface category is represented;
- a forbidden authorizer cannot appear as an allowed authorization basis;
- commercial rows require explicit assignment scope;
- the public estimator remains noncanonical and excluded from proof;
- every enabled customer-consequential surface requires assignment/platform/system context evidence.

### 3. Assignment scope and evidence-spine migration

Added migration `0042_assignment_scope_and_release_evidence_spine.sql`.

It creates durable `assignment_scope_registry` rows and adds nullable `assignment_id` columns to existing consequential tables when those tables exist, including message/session/runtime/artifact/link/approval/audit/work/commercial/connector rows.

The migration intentionally does not force ambiguous legacy data into assignment scope. It backfills only high-confidence rows that already carry both `employee_id` and `account_id` and resolve through `amtech_default_assignment_for_employee_account`.

This preserves forward-only migration discipline and avoids claiming ambiguous backfills as accepted.

### 4. Lane 10 release-evidence contract

Added `packages/shared/src/release-evidence.ts`.

It defines:

- release status vocabulary;
- required release gates;
- release-evidence gate schema;
- release-evidence manifest schema;
- stale cross-SHA evidence rejection;
- missing-gate rejection;
- production-ready and staging-accepted public-claim promotion checks.

Added `tests/unit/release-evidence-contract.test.ts` to verify source/CI-only manifests cannot promote live acceptance, stale SHA evidence fails, production-ready claims require accepted hard gates, and missing gates fail.

### 5. Lane 10 release-evidence generator and workflow

Added `infra/scripts/acceptance/release-evidence-spine.mjs`.

The script emits a release-evidence manifest bound to:

- repository;
- branch;
- exact commit SHA;
- GitHub run ID;
- generated timestamp;
- digest;
- gate states.

It marks source/typecheck/build/unit/relationship/command/blank-migration gates as source/CI evidence and leaves real Supabase, runtime, provider, browser/SMS, commercial, capacity/recovery, rollback, and production acceptance pending.

Added `.github/workflows/lane10-integrated-ci-release-evidence.yml`.

The workflow runs:

- active workspace typecheck;
- active workspace build;
- relationship contract tests;
- assignment-scope registry tests;
- command/effect contract tests;
- release-evidence contract tests;
- remediation plan integrity tests;
- blank PostgreSQL 17 migration application;
- Lane 1 relationship/authorization matrix;
- Lane 3 command/effect matrix;
- release-evidence manifest generation and artifact upload.

Updated `.github/workflows/lane-relationships-auth.yml` so Lane 1 CI includes the assignment-scope registry and targets the integration PR into `research`.

### 6. Docs and exports

Updated:

- `packages/shared/src/index.ts` exports Lane 1 scope and Lane 10 evidence contracts;
- `package.json` adds `test:lane1-scope`, `test:lane10-evidence`, and `release:evidence:spine` scripts;
- root `CODEGRAPH.md` records current source-wired progress and next dependency gates;
- scoped `mvp-build/CODEGRAPH.md` records the new source map, current status, and remaining launch blockers.

## Validation status

Validation has not yet been observed green on GitHub for the new PR head in this handoff.

Expected first acceptance signal:

- `.github/workflows/lane10-integrated-ci-release-evidence.yml` passes on the current `employee-production-tuesday` head;
- `.github/workflows/lane-relationships-auth.yml` passes with the new registry test;
- migration `0042` applies on blank PostgreSQL 17 through the workflow;
- release-evidence artifact is uploaded and remains `source_and_ci_only`.

No real-Supabase, runtime, provider, browser/SMS, commercial, capacity, rollback, deployment, or production acceptance is claimed.

## Current implementation state

Source-wired:

- Lane 1 consequential-surface scope inventory;
- Lane 1 forbidden-authorizer guardrails;
- nullable assignment scope columns/backfill machinery for existing consequential tables;
- Lane 10 release-evidence schemas and manifest generator;
- integrated source/CI workflow that ties Lane 1 and Lane 3 matrices into the release evidence spine.

Not complete:

- every runtime consumer has not yet been migrated to enforce the registry/resolver;
- owner sessions and signed resources still require Lane 2 revocation and immutable authority enforcement;
- SMS/connector paths still require Lane 6 custody and provider packet work;
- commercial rows still require Lane 5 payer/beneficiary/usage/invoice reconciliation;
- onboarding identity saga remains Lane 4;
- real Supabase and live provider/browser/SMS acceptance remain pending.

## Unresolved risks

- Migration `0042` is forward-only and intentionally nullable; launch cannot proceed until active customer-work rows have assignment or approved platform/system context.
- Registry coverage is broad but still an inventory/gate; runtime route enforcement remains a separate consumer migration.
- Existing Manager routes still contain compatibility `account_id + employee_id` checks that must be replaced or wrapped by assignment authorization before launch.
- Release evidence generation is source/CI-only; the script prevents production promotion but does not produce live proof.
- Helper privilege design still requires explicit review for non-recursive Supabase/RLS compatibility.

## Next concrete move

1. Inspect the new GitHub Actions runs for the current PR head and fix any typecheck, migration, or workflow failures.
2. If CI is green, begin the consumer-enforcement pass in this order:
   - owner dashboard/resources/stream/message route assignment resolver;
   - signed artifact/preview link durable assignment lookup;
   - owner session assignment-principal checks and revocation behavior;
   - Twilio SMS assignment/channel resolver;
   - connector binding resolver;
   - commercial assignment/payer/beneficiary row enforcement.
3. Only after those are enforced should Lane 2 approvals/admin/session authority and Lane 4 onboarding identity saga proceed.
