# Tool-agnostic Connector Center + resurfacing projection

Date: 2026-07-10 23:41 EDT
Status: `source-wired`; live proof still `pending`
Scope: first source-wired product slice that makes Connected and resurfacing generic over capabilities/materialization instead of provider-specific rows. No Business Brain/portal work.

## What changed

Added shared Work Surface contracts in `packages/shared/src/resource-payload.ts`:
- `ConnectionSurface` — owner-safe connected-business cards derived from connector rows, capability categories, and materialized proof.
- `ResurfaceItem` — owner-safe items that should come back in Today/Daily Brief/SMS/admin, derived from tasks and `SurfaceEnvelope`s.

Added Manager derivation helpers in `apps/manager/src/lib/employee-stream.ts`:
- `deriveConnectionSurfaces()` creates generic cards for Email, Payments, Accounting, Files, Calendar, Store, plus custom connector rows.
- `deriveResurfaceItems()` projects approvals, questions/reviews/failures, scheduled reminders, connector attention, runtime issues, and high-priority envelopes into a single attention queue.
- `buildEmployeeSnapshot()` now returns `connection_surfaces` and `resurface_items`.

Updated surfaces:
- Manager MCP `connector-status` and `work-queue` resources include the new projections.
- Admin employee detail/materialization diagnostics include `connection_surfaces` and `resurface_items`.
- Admin readiness now checks generic connection health and resurfacing queue.
- Owner Work Surface `Connected` now renders `connection_surfaces` first and falls back to raw connector rows only for compatibility.
- Today and Daily Brief prefer `resurface_items` for “needs attention” instead of provider-specific approval/reminder counts.
- UI fixtures include generic connection/resurfacing data.

## Why

The prior Connected view was too prewired: it rendered `connector_accounts` rows directly, so the product thought in Gmail/Stripe/QBO rows instead of “connected business capabilities.” Resurfacing had the same risk if it started as a provider-specific ledger too early.

This pass uses the Phase 4 materialization/capability layer already in the codebase:
- capabilities explain what the employee can do;
- connector rows show real custody/health when a provider exists;
- `SurfaceEnvelope`s carry proof/safety/render state;
- `ResurfaceItem`s make “later” visible without creating a table before the projection proves its shape.

## Current status

`source-wired` only. No live migrations, provider tests, runtime acceptance, platform-operator seeding, scoped-MCP reprovision proof, or QBO sandbox proof were attempted or claimed.

This deliberately does **not** build a Business Brain, Brain Portal, CRM read model, or connector marketplace.

## Files / seams touched

Representative source:
- `packages/shared/src/resource-payload.ts`
- `apps/manager/src/lib/employee-stream.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/admin.ts`
- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- `apps/web/app/agent/[employeeId]/components/DailyBrief.tsx`
- `apps/web/app/agent/[employeeId]/lib/surface-model.ts`
- `apps/web/app/agent/[employeeId]/fixtures.ts`

Tests:
- `tests/unit/employee-stream.test.ts`

Docs:
- `CODEGRAPH.md`
- this handoff + `MEMORY.md` index

## Carry-forward / next

Second-half plan reconnection:
- Phase 1 still owns live proof: apply migrations, reprovision scoped MCP, and prove real Hermes Manager tool calls.
- Phase 3 should render `ResurfaceItem`s through SMS signed preview/action links.
- Phase 4 should keep collapsing new tools/connectors into `ConnectionSurface`/`SurfaceEnvelope` instead of adding bespoke React/provider branches.
- Phase 5 admin should continue inspecting these generic projections with proof ids.
- Phase 6 launch readiness should require one generic connection card, one generic resurfaced item, and one non-estimate preview/action path to work before trial/pilot launch.

Likely next implementation step: add signed-preview/resource support for `resurface_items` so SMS can carry the same “come back to this” item as Today.

## Verification

Ran:
- `npm run build --workspace @amtech/shared` — passed; refreshes shared `dist` for downstream workspaces.
- `npm run typecheck` — passed.
- `npm run test:unit -- tests/unit/employee-stream.test.ts tests/unit/admin-routes.test.ts tests/unit/materialization.test.ts` — passed, 3 files / 18 tests.

Still to run before handoff is complete:
- full `npm run test:unit`
- `npm run build`
- `npm run lint`
- `npm run test:integration`
