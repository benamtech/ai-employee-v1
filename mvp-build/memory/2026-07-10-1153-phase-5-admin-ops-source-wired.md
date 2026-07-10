# Phase 5 admin/ops source-wired

Date: 2026-07-10 11:53
Status: source-wired; live proof pending
Scope: second-half Phase 5 operator/admin/trial-readiness slice plus owner-surface vocabulary hardening

## What changed

- Added shared admin contracts in `packages/shared/src/admin.ts`, exported through `packages/shared/src/index.ts`, with admin route builders in `packages/shared/src/routes.ts` and new ID prefixes in `packages/shared/src/ids.ts`.
- Added migration `packages/db/migrations/0025_phase5_admin_ops.sql`:
  - additive account/employee trial and lifecycle fields;
  - Manager-only `platform_users`, `platform_user_roles`, `support_access_sessions`, and `admin_action_events`;
  - RLS enabled and anon/authenticated grants revoked for the new admin tables.
- Added `apps/manager/src/lib/admin.ts` as the Manager admin read/action layer:
  - DB-backed platform-role checks with non-production `ALLOW_ADMIN_BOOTSTRAP=1` fallback;
  - support access logging with required support reason;
  - account/employee admin detail views;
  - readiness report for Phase 4/5/6 gates;
  - redaction for secrets, raw provider payloads, auth material, stack traces, and token/hash fields;
  - support actions for suspend/resume/disable/needs-reprovision/MCP credential rotate+revoke/runtime-health/event redelivery/source suppression.
- Added Manager routes in `apps/manager/src/server.ts` under `/manager/admin/*`, protected by `MANAGER_INTERNAL_TOKEN` plus platform role:
  - dashboard/accounts/account detail;
  - employee detail/readiness;
  - support actions.
- Added internal web admin surface:
  - `apps/web/app/api/admin/[...path]/route.ts` proxies to Manager admin routes with platform-user and support-reason headers, and requires `AMTECH_ADMIN_BROWSER_TOKEN` in production before it will attach operator identity.
  - `apps/web/app/admin/page.tsx` and `apps/web/app/admin/AdminClient.tsx` provide a dense internal console for accounts, provisioning, repairs, provider status, billing scaffold, employee operations, readiness, and materialization inspection.
- Hardened owner-facing vocabulary:
  - `apps/manager/src/lib/capability-registry.ts` now maps Manager tools to owner-safe labels instead of raw snake_case tool names.
  - `apps/web/app/agent/[employeeId]/lib/surface-model.ts` adds owner-readable status labels.
  - `apps/web/app/agent/[employeeId]/AgentClient.tsx` uses those labels and stops showing raw `profile_id`/runtime backend in owner settings.
- Added tests:
  - `tests/unit/admin-routes.test.ts` covers auth, support reason, redaction/audit, MCP credential rotation without token/hash return, and readiness honesty.
  - `tests/unit/materialization.test.ts` now asserts capability labels do not expose raw Manager tool names.

## Why

The owner product must remain one employee/work graph, while AMTECH needs an internal operating surface to run trials without direct database surgery. This slice makes the Phase 5 factory layer real enough for an operator to inspect state, prove what is safe, and take limited audited repair/lifecycle actions while preserving the principle that owners never see MCP/API/tool internals.

## Current status

- Phase 5 admin/ops is `source-wired`.
- Billing remains scaffolded/default-allow; no automated AMTECH subscription/paywall system was built.
- Phase 6 groundwork is limited to a readiness report and warnings for known pre-tenant gaps.
- Live acceptance is still `pending`:
  - migrations `0022`, `0023`, `0024`, and `0025` still need live application/advisor proof where the target DB is available;
  - platform operator rows must be seeded before production admin use;
  - old rendered employee profiles still need reprovisioning to prove scoped MCP credentials live;
  - egress control remains unresolved;
  - the real Hermes/model tool-execution gate remains blocked by the current bridge returning tool-call JSON as text.

## Files / seams touched

- Shared contract: `packages/shared/src/admin.ts`, `packages/shared/src/routes.ts`, `packages/shared/src/ids.ts`, `packages/shared/src/index.ts`.
- Database: `packages/db/migrations/0025_phase5_admin_ops.sql`.
- Manager admin: `apps/manager/src/lib/admin.ts`, `apps/manager/src/server.ts`.
- Web admin: `apps/web/app/admin/*`, `apps/web/app/api/admin/[...path]/route.ts`.
- Owner surface vocabulary: `apps/manager/src/lib/capability-registry.ts`, `apps/web/app/agent/[employeeId]/AgentClient.tsx`, `apps/web/app/agent/[employeeId]/lib/surface-model.ts`.
- Tests: `tests/unit/admin-routes.test.ts`, `tests/unit/materialization.test.ts`.

## Carry-forward / next

- Apply migrations `0022`-`0025` live when env/approval allows, then run Supabase advisors and privilege checks.
- Seed a real platform operator user/role and configure `AMTECH_ADMIN_USER_ID` plus `AMTECH_ADMIN_BROWSER_TOKEN`; keep `ALLOW_ADMIN_BOOTSTRAP=1` for local/non-production only.
- Reprovision a fresh employee profile and prove scoped MCP credential usage live.
- Add the missing egress-control layer before tenant use.
- Close the real Hermes/provider tool-loop gate; do not count text-emitted tool-call JSON as runtime acceptance.
- If the admin console is expanded, keep every new endpoint covered for auth, cross-account denial, redaction, and support-action audit.

## Verification

Run from `mvp-build/`:

- `npm run build --workspace=@amtech/shared` — passed.
- `npm run test:unit -- tests/unit/admin-routes.test.ts tests/unit/materialization.test.ts` — passed, 8 tests.
- `npm run typecheck` — passed.
- `npm run test:unit` — passed, 68 files / 406 tests.
- `npm run lint` — passed.
- `npm run build` — passed; Next build includes `/admin` and `/api/admin/[...path]`.
- `npm run test:integration` — passed as env-gated skips, 6 files / 11 skipped.
- `npm run ui:test` — passed; fixture smoke at `http://127.0.0.1:3200/agent/emp_ui_fixture`, screenshots under `infra/.local/ui-fixtures`.
