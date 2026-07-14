# First-principles UI redesign implemented

Date: 2026-07-14 23:51  
Status: source-wired  
Scope: UI-only redesign across owner Work Surface, signed Review renderer alignment, fixtures, and UI smoke proof

## What changed

- Replaced the owner Work Surface shell with a first-principles Avery office UI in `apps/web/app/agent/[employeeId]/AgentClient.tsx`.
- Replaced old nav semantics with `Today`, `Ask Avery`, `Work`, `Library`, `Connected`, `History / Proof`, and `Settings` in `lib/surface-model.ts`.
- Added `components/WorkObjectRenderer.tsx` as the shared `WorkResource` renderer for exact previews, fields, documents, media, receipts, expired states, and gated actions.
- Rebuilt `fixtures.ts` from scratch around object-first UI proof: Oak Street estimate approval, low-confidence question, deposit approval, accounting repair, bookkeeping missing docs, website draft, completed proof, and generated table/schedule/diff/form objects.
- Reworked signed mobile `review/ReviewClient.tsx` to use the shared object renderer; refreshed review fixture copy in `review/page.tsx`.
- Updated `infra/scripts/ui/fixture-browser.mjs` to assert the redesigned IA and capture the new screenshots.
- Updated `tests/unit/work-surface-model.test.ts` for the new IA count model.

## Why

The prior UI and fixtures were explicitly rejected as the wrong product frame. This pass treats existing UI only as route/API/contract scaffolding and rebuilds the visible product around the `mvp-build/ui-redesign/` packet:

- one employee, Avery, is the center;
- chat is a command language, not the product;
- work objects carry preview, proof, and action;
- connected accounts explain what Avery can do;
- owner UI avoids internal implementation vocabulary.

## Current status

- `source-wired`.
- UI fixture proof passes on desktop, mobile, and signed review.
- No provider/runtime/live acceptance was claimed.
- Backend contracts, approval gates, signed links, artifact routes, and Manager APIs were preserved.

## Files / seams touched

- Owner surface: `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- Shared UI renderer: `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- Surface model and fixture data: `apps/web/app/agent/[employeeId]/lib/surface-model.ts`, `apps/web/app/agent/[employeeId]/fixtures.ts`
- Signed review: `apps/web/app/agent/[employeeId]/review/ReviewClient.tsx`, `review/page.tsx`
- UI proof: `infra/scripts/ui/fixture-browser.mjs`
- Unit expectation: `tests/unit/work-surface-model.test.ts`

## Carry-forward / next

- Admin is still visually separate and operator-safe, but this pass did not deeply redesign `AdminClient.tsx`.
- Public/create/claim/login pages were not materially changed in this implementation pass.
- Artifact/output route security is preserved; fixture artifact HTML still has its own document styling and can be further aligned with `WorkObjectRenderer`.
- Mobile full-page screenshots show the fixed bottom nav mid-capture because Playwright captures a tall page; actual viewport behavior is bottom-pinned.

## Verification

- `npm install` completed in the worktree; npm reported existing audit issues and blocked optional install scripts, but native packages used by Next loaded.
- `npm run build --workspace @amtech/shared && npm run build --workspace @amtech/db` passed.
- `npm run typecheck --workspace @amtech/web` passed.
- `npm run ui:test` passed.
  - Screenshots: `infra/.local/ui-fixtures/work-surface-desktop.png`, `work-surface-mobile.png`, `review-mobile.png`.
- `npm run lint` passed.
- `npm run build` passed with network access approved for `next/font/google` font fetches.
- `npm run test:unit` passed: 90 files / 569 tests.
- `npm run typecheck` passed across workspaces.
