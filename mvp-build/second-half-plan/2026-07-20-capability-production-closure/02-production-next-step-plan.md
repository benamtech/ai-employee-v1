# Production Next-Step Plan

Status: **P0/P1 execution companion; no feature expansion**  
Authority: current source/migrations/executable proof → exact-SHA workflows → `mvp-build/STANDARD.md` and active remediation plan → current CODEGRAPH/architecture → newest memory.

## Starting state

The owner capability surface is source-wired and its current Web nullability blocker is closed. Connector setup remains explicit and fail-closed. Gmail and QuickBooks can produce owner setup actions; unknown connectors and intentionally unsupported Stripe OAuth cannot. Capability discovery remains presentation and task guidance only; it does not bypass assignment authority, approvals, C3, connector custody, or durable effects.

Migration head is `0072` at `mvp-build/packages/db/migrations/0072_artifact_revision_scope_guards.sql`. The canonical deployment family is already source-wired through `mvp-build/infra/scripts/production-topology.mjs` and `mvp-build/infra/deploy/docker-compose.production.yml`; the obsolete deploy-fork finding must not be repeated as an open source-code task. Target-host proof remains open.

## P0-1 — Converge and freeze exact-head CI

**Goal:** every required workflow that applies to the final code/document head completes successfully without relying on a prior SHA.

Implementation references:

- `mvp-build/apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx`
- `mvp-build/tests/unit/capability-drawer-setup-contract.test.ts`
- `mvp-build/tests/unit/employee-stream-strict.test.ts`
- `mvp-build/tests/unit/production-topology-acceptance.test.ts`

Required workflows:

- `.github/workflows/ui-agent-operating-surface.yml`
  - job `source-contracts`
  - steps `Typecheck web`, `Validate UI source contracts`, `Run npm run test:ui:contracts`, and `Run npm run build --workspace @amtech/web`
  - job `browser-fixture`
  - step `Run compiled adaptive fixture and product-shell browser matrices`
- `.github/workflows/employee-work-production-boundary.yml`
  - job `boundary`
  - steps `Apply and verify migration ledger`, `Manager and Hono contracts`, `Production boundary unit and source proofs`, and `Production image inclusion`
- `.github/workflows/lane10-integrated-ci-release-evidence.yml`
- `.github/workflows/lane-relationships-auth.yml`
- `.github/workflows/s2-s7-s9-production-boundary.yml`
- `.github/workflows/s10-onboarding-identity.yml`
- `.github/workflows/phase-2-remediation-plan.yml`
- `.github/workflows/repository-archaeology.yml`

Exit criteria:

1. Record exact SHA, run ID, workflow filename, job, and failing/passing step for every required run.
2. No run may be inherited from an ancestor SHA as proof for a modified code path.
3. A cancelled run is not a pass; rerun or advance to a later exact head whose complete matrix passes.
4. Preserve diagnostics artifacts for Web typecheck, Manager typecheck, migration verification, production-boundary tests, image build, and browser evidence.

## P0-2 — Synchronize document authority to current source

**Problem:** `mvp-build/CODEGRAPH.md`, `mvp-build/memory/MEMORY.md`, `mvp-build/second-half-plan/README.md`, the newest 2026-07-19 handoff, and PR `#23` still contain stale migration-head, deploy-fork, and evidence-anchor claims.

Required transaction:

1. Update migration head from `0069` to `0072` and reference:
   - `mvp-build/packages/db/migrations/0070_effective_capabilities_and_artifact_revisions.sql`
   - `mvp-build/packages/db/migrations/0071_artifact_policy_seed_and_contract_guards.sql`
   - `mvp-build/packages/db/migrations/0072_artifact_revision_scope_guards.sql`
2. Mark canonical production entrypoint convergence as source-wired, grounded by:
   - `mvp-build/infra/scripts/production-topology.mjs`
   - `mvp-build/infra/scripts/production-normal-up.mjs`
   - `mvp-build/infra/scripts/prod-like-normal-employee-up.mjs`
   - `mvp-build/infra/scripts/deploy-smoke.mjs`
   - `mvp-build/infra/scripts/deploy-rollback.mjs`
   - `mvp-build/tests/unit/production-boundary-source.test.ts`, describe `canonical production deployment topology`
3. Replace old exact-head workflow claims with the latest complete matrix only after P0-1 passes.
4. Keep the distinction between implementation anchor and later documentation-only commits.
5. Update PR `#23` without claiming live acceptance.

Exit criteria: repository bootstrap documents no longer route an agent to migration `0069` or describe the already-closed Compose selector as an open source defect.

## P0-3 — Apply and prove migrations `0032` through `0072` on approved staging

Primary harness:

- `mvp-build/infra/scripts/acceptance/migration-staging-live-proof.mjs`
- `mvp-build/infra/scripts/acceptance/verify-worker-migrations.mjs`
- `mvp-build/packages/db/migrate.mjs`

Current contract test:

- `mvp-build/tests/unit/production-topology-acceptance.test.ts`
- describe `target-host production topology acceptance`
- test `binds staging migration proof to the complete current migration range`

Required evidence:

1. Apply the complete ledger to an approved non-production Supabase/Postgres target.
2. Verify every migration is reported applied, including `0070`, `0071`, and `0072`.
3. Run database advisors and retain security/performance findings.
4. Exercise artifact revision scope, parent revision scope, validation scope, current-head scope, viewer read-only grants, owner/operator write grants, artifact approval snapshots, and effective-capability evidence isolation.
5. Retain proof JSON with database reference, exact git SHA, migration range, per-file SHA-256, timestamps, and `production_mutated: false`.

Stop conditions: any partial ledger, advisor blocker, cross-account/assignment visibility, malformed existing artifact history, or migration proof not bound to the exact implementation SHA.

## P0-4 — Prove canonical target-host topology and two-employee isolation

Source authority:

- `mvp-build/infra/deploy/docker-compose.production.yml`
- `mvp-build/infra/scripts/production-topology.mjs`
- `mvp-build/infra/scripts/production-normal-up.mjs`
- `mvp-build/infra/scripts/prod-like-normal-employee-up.mjs`
- `mvp-build/infra/scripts/deploy-smoke.mjs`
- `mvp-build/infra/scripts/acceptance/target-host-two-employee-isolation.mjs`

Tests:

- `mvp-build/tests/unit/production-boundary-source.test.ts`
  - describe `canonical production deployment topology`
  - test `routes every production launcher, smoke, and rollback entrypoint through one compose authority`
  - test `requires canonical five-service health, Unix-socket custody, and host-side employee topology inspection`
- `mvp-build/tests/unit/production-topology-acceptance.test.ts`
  - test `defines a two-employee isolation, replacement, and teardown gate with a disposable-target wall`

Required proof:

1. Five canonical services healthy: Manager, Model Gateway, Host Provisioner, Web, Caddy.
2. Manager has no Docker socket; Host Provisioner alone owns Docker authority through the signed Unix-socket boundary.
3. Caddy uses host networking and reaches only intended loopback services.
4. Each employee runtime has one internal bridge with scoped Manager and Model Gateway aliases.
5. Cross-employee reachability and data/action access are denied in both directions.
6. Internet egress policy matches the Standard.
7. Replace and teardown one disposable employee without changing the second employee.
8. Retain exact image digest, container/network inspection, command output, and proof JSON.

## P0-5 — Fixture-free owner, SSE, OAuth, and provider-backed effect journey

Owner/browser source:

- `mvp-build/apps/web/app/login/page.tsx`
- `mvp-build/apps/web/app/dashboard/page.tsx`
- `mvp-build/apps/web/app/agent/[employeeId]/page.tsx`
- `mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx`
- `mvp-build/apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx`
- `mvp-build/apps/web/app/api/employee/[employeeId]/events/route.ts`
- `mvp-build/apps/web/app/api/employee/[employeeId]/message/route.ts`
- `mvp-build/apps/web/app/api/employee/[employeeId]/connect/[connector]/route.ts`

Manager/effect source:

- `mvp-build/apps/manager/src/lib/onboarding-identity-routes.ts`
- `mvp-build/apps/manager/src/lib/tool-capability-catalog.ts`
- `mvp-build/apps/manager/src/lib/durable-command-runtime.ts`
- `mvp-build/apps/manager/src/lib/approval-authority.ts`
- `mvp-build/apps/manager/src/lib/artifact-workbench-routes.ts`
- `mvp-build/apps/manager/src/tools/gmail-connect-owner.ts`
- `mvp-build/apps/manager/src/tools/qbo-connect-owner.ts`

Required journeys:

1. Real owner login, multi-account selection where applicable, assignment-scoped dashboard, and assigned employee navigation.
2. Operating snapshot and SSE reconnect/rotation without owner token in JSON or URL.
3. Explicit Gmail and QuickBooks connect actions; unknown connector and Stripe OAuth requests fail closed.
4. Capability evidence stale/failed state renders unavailable rather than ready.
5. Stage an instruction from CapabilityDrawer; prove the browser does not call a tool directly.
6. Execute one provider-backed generated work object through approval → immutable snapshot → C3 command/effect → external provider → receipt → owner-refindable proof.
7. Exercise 403, 409, 410, 429, 500, and 503 owner states.

Acceptance must be fixture-free and exact-SHA. Fixture screenshots remain useful regression evidence but cannot satisfy this gate.

## P1-1 — Shared budgets, shared rate limits, and ambiguous provider outcomes

Targets:

- `mvp-build/apps/manager/src/lib/model-gateway.ts`
- `mvp-build/apps/manager/src/lib/model-gateway-http.ts`
- `mvp-build/apps/manager/src/lib/durable-command-runtime.ts`
- `mvp-build/apps/manager/src/lib/owner-turn-repair.ts`
- `mvp-build/packages/shared/src/model-gateway.ts`
- appropriate new migration after `0072`

Required implementation order:

1. Add failing concurrency tests for cumulative budget reservation/settlement.
2. Persist atomic shared rate-limit state; do not use process-local counters for fleet authority.
3. Represent provider timeout after an uncertain write as `ambiguous`, not retryable failure.
4. Reconcile by provider idempotency key/receipt before any retry.
5. Prove duplicate suppression, budget conservation, lease expiry, crash recovery, and bounded owner-facing errors.

## P1-2 — Compensation, repair, rollback, and release attestation

Primary source/harnesses:

- `mvp-build/apps/manager/src/lib/provisioning-reconciler.ts`
- `mvp-build/apps/manager/src/lib/owner-turn-repair.ts`
- `mvp-build/infra/scripts/acceptance/reconciler-recovery-live-proof.mjs`
- `mvp-build/infra/scripts/deploy-rollback.mjs`
- `mvp-build/infra/scripts/acceptance/release-evidence-spine.mjs`

Required evidence:

1. Crash injection at every durable state transition and external-effect boundary.
2. Deterministic repair or explicit terminal manual-repair state.
3. Rollback validates Compose, database compatibility, Caddy, Manager, Web, Model Gateway, Host Provisioner, employee runtime/profile compatibility, and recomputed acceptance.
4. Produce SBOM, provenance/attestation, signed deployment manifest, exact image digests, migration hashes, workflow IDs, and rollback coordinates.

## P1-3 — Accessibility, cross-browser, visual, and fleet acceptance

Extend `.github/workflows/ui-agent-operating-surface.yml` and the browser harnesses under `mvp-build/infra/scripts/ui/` only after fixture-free functional proof exists.

Required matrix:

- Chromium, Firefox, WebKit/mobile Safari-representative execution
- keyboard-only operation and focus order
- WCAG 2.2 AA automated plus manual checks
- reduced motion, zoom, 320px width, long content, error states, and reconnect states
- deterministic visual baselines with explicit review workflow
- 100/250/500/700 employee capacity and fairness, including queue latency, database contention, Model Gateway fairness, reconcilers, SSE fan-out, and noisy-neighbor isolation

## Global stop rules

- Do not deploy from a red or cancelled required workflow.
- Do not infer live acceptance from source shape, mocks, fixtures, synthetic events, historical proof, or an ancestor SHA.
- Do not add connector-specific owner UI when the shared capability/resource/approval primitives can represent the work.
- Do not let browser state create execution authority.
- Do not retry an ambiguous consequential provider operation without reconciliation.
- Do not advance to production-ready language until every non-waivable Standard gate passes on the exact deployed SHA.
