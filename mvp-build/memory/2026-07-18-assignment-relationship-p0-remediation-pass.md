# 2026-07-18 — assignment relationship P0 remediation pass

Branch: `employee-work` based on `research`; draft PR `#19` targets `research`; `main` was not modified.

Starting handoff head: `571ab08bbf7c84071ee97da1a71d89027618597f`.

Audit source head referenced by governing findings: `d963efcaff9285cdf8ebc6c069213a2cda7d110d`.

## Status

`source-wired_not-live-accepted`.

This pass implemented the first production-boundary remediation slice for the approved AMTECH Phase 2 standard: canonical assignment/labor relationship graph, assignment-aware owner RLS, principal-bound approval claim RPC, relationship-scoped link lease RPC, assignment-bound Model Gateway and MCP credentials, and DB triggers that preserve the current normal-employee write path while legacy callers are migrated to explicit `assignment_id` contracts.

No production Supabase migration, live provider packet, canonical browser packet, paid/commercial proof, or destructive recovery test was run.

## validation-vector

validation-vector((pass-vector: every consequential row can resolve one current assignment or explicit `platform_system` context; owner-facing access resolves through assignment principals; approvals and signed links resolve atomically against current principal/assignment relationships; runtime credentials carry `assignment_id`; current legacy insert paths are database-upgraded before assignment constraints fire)-(fail-vector: `account_id`, `employee_id`, bearer token, signed link possession, or caller-submitted mutable fields can authorize work without a current assignment relationship; normal-employee deployment path breaks because callers do not yet submit `assignment_id`; source state is promoted to live/provider/commercial accepted without real proof)).

## Files changed

- `packages/db/migrations/0039_assignment_relationship_authority.sql`
  - Added `organizations`, `organization_accounts`, `employee_principals`, `employee_employment_relationships`, `employee_assignments`, `assignment_principals`, `assignment_resource_grants`, `assignment_authority_policies`, `assignment_commercial_relationships`, and assignment memory/connector/billing partitions.
  - Backfilled deterministic default organizations, employee principals, default assignments, user/employee assignment principals, custody grants, authority policies, and payer/beneficiary/custody/employer relationships.
  - Added `assignment_id` plus explicit `execution_context_type` to existing work/custody tables where present.
  - Replaced owner-facing account policies for `accounts` and `employees` with assignment-aware policies and added assignment-scoped policies for relationship tables and scoped work tables.
  - Added approval v2 columns, `approval_effect_receipts`, and `resolve_assignment_approval(...)` for one atomic principal-bound terminal claim against immutable `action_snapshot_hash`.
  - Added relationship lease columns to link/session/token tables where present and `claim_relationship_lease(...)` for atomic artifact-link consumption under a current assignment principal.
  - Added P1 groundwork tables `assignment_budget_accounts` and `assignment_usage_ledger` without enabling paid launch by default.

- `packages/db/migrations/0040_assignment_scope_runtime_triggers.sql`
  - Added `ensure_employee_relationship_graph(...)`, employee insert/update triggers, generic assignment-context fill triggers, and artifact-link assignment fill trigger.
  - Purpose: preserve the current normal-employee deployment path while old code paths still insert `account_id + employee_id` before all callers explicitly pass `assignment_id`.

- `packages/shared/src/model-gateway.ts`
  - Added `assignment_id` to model-gateway claims and usage records.

- `apps/manager/src/lib/model-gateway.ts`
  - Minting now resolves a current assignment before credential creation.
  - Verification requires token claim, credential row, employee route, and current assignment to agree.
  - Usage audit writes `assignment_id` and `execution_context_type: "assignment"`.

- `apps/manager/src/lib/model-gateway-http.ts`
  - Propagates `X-Amtech-Assignment-Id` to upstream provider calls.
  - Records assignment on every success/deny/provider-unavailable usage path.
  - Returns assignment in `amtech_gateway` response proof metadata.

- `apps/manager/src/lib/mcp-auth.ts`
  - MCP credentials now mint and verify against current assignment rows and return `assignment_id` in identity.

- `tests/unit/model-gateway-http-isolation.test.ts`
  - Test fixture now creates assignment rows and verifies assignment-bound provider headers/response proof.

- `tests/unit/assignment-relationship-boundary.test.ts`
  - New source-boundary tests for relationship graph, assignment-scoped RLS, approval protocol, lease protocol, P1 accounting groundwork, compatibility triggers, Model Gateway assignment binding, and MCP assignment binding.

- `package.json`
  - Adds `tests/unit/assignment-relationship-boundary.test.ts` to `test:production-boundary`.

## Validation run

Not run in this environment.

Reason: no editable checkout was available in the container, `gh` is not installed, and GitHub network resolution from the container failed. Changes were written through the GitHub contents connector. A connector-level PR metadata read after code commits showed PR #19 still open and draft, head `363532b2cc859f012f193a0b09933c6697e9dfb4` at that moment, base `research`, and `main` untouched by this workflow.

## Known risks / next starting point

1. Run a real migration parse/apply against blank PostgreSQL/Supabase-shaped DB immediately. The new migrations are large PL/pgSQL boundary migrations and have not been syntax-validated by `psql` in this pass.
2. Run `npm run typecheck`, `npm run test:production-boundary`, and the worker migration verifier. Expected first failures, if any, will likely be generated Supabase types or SQL syntax details rather than the architectural direction.
3. Start converting route/runtime callers to pass `assignment_id` explicitly. `0040` is a compatibility bridge, not the final P0 contract.
4. Add real negative/concurrency DB tests for `resolve_assignment_approval` and `claim_relationship_lease`: self-approval denial, revoked role, expired approval, changed snapshot, 100 concurrent resolves, replayed link.
5. Apply the schema to a real Supabase staging project and capture a release-bound proof before claiming P0 closure.
6. Continue P1 in order: global Manager authority bypass, transactional onboarding/claim/phone ownership, durable budget reservation/settlement, connector ingress custody, and product-wide release gate.

## Do not overclaim

This pass improves source conformance and lays the correct boundary, but it does not close the live audit finding by itself. P0 remains `source-wired_pending-real-db-and-live-proof` until migration behavior, RLS matrix, browser/session paths, SMS/provider ingress, and approval/link packets are proven against real Supabase/provider/browser surfaces.
