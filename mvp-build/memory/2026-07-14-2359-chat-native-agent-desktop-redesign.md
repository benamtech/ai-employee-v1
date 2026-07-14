# Chat-native agent desktop redesign

Date: 2026-07-14 23:59  
Status: source-wired  
Scope: UI-only second-pass teardown of the owner Work Surface into a chat-native Avery agent desktop

## What changed

- Replaced the first-pass office/dashboard shell in `apps/web/app/agent/[employeeId]/AgentClient.tsx` with a chat-first agent desktop:
  - persistent Avery conversation as the center;
  - live business streams for watching, working, waiting, and proof;
  - contextual canvas for approvals, generated surfaces, work objects, connected accounts, and receipts;
  - mobile order is chat/autonomy first, streams second, object canvas as a sheet.
- Rebuilt `apps/web/app/agent/[employeeId]/fixtures.ts` again around a new Riverbend operator story instead of the prior Oak Street office demo:
  - customer reply and estimate approval;
  - scope question Avery stops to ask;
  - deposit approval;
  - accounting reconnection blocking a prepared write;
  - file/photo context stream;
  - website draft;
  - completed Pine Lane proof;
  - generated table/schedule/diff/form surfaces.
- Rethemed `components/WorkObjectRenderer.tsx` from red/black office styling to a semantic agent palette:
  - blue/cyan for Avery and working state;
  - green for proof/completed;
  - amber for attention/review;
  - AMTECH red reserved for high-risk/destructive states.
- Updated signed review fixture copy in `review/page.tsx` to match the Riverbend approval while preserving scoped review behavior.
- Updated `infra/scripts/ui/fixture-browser.mjs` for the new chat/stream/canvas flow and changed the mobile screenshot to viewport capture so the fixed bottom nav is not misleading.
- Added fixture coverage in `tests/unit/work-surface-model.test.ts` to keep the demo stream-rich and approval/proof-aware.

## Why

The founder rejected the first-pass UI as still too dashboard/office-like and not forward-thinking enough. The corrected direction is closer to an LLM-centered coworker/agent desktop: talk to Avery like a person, see what Avery is independently watching and preparing, and inspect exact approval/proof surfaces when the work reaches a gate.

## Current status

- `source-wired`.
- Owner UI, fixture mode, signed review fixture, shared renderer styling, UI smoke, build, lint, typecheck, and unit tests are green locally.
- No backend contract, Manager behavior, provider integration, approval policy, or signed-scope semantics were changed.
- No live provider/runtime acceptance claimed.

## Files / seams touched

- Owner surface: `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- Shared work renderer: `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- Fixture read model: `apps/web/app/agent/[employeeId]/fixtures.ts`
- Signed review fixture: `apps/web/app/agent/[employeeId]/review/page.tsx`
- UI smoke: `infra/scripts/ui/fixture-browser.mjs`
- Unit fixture coverage: `tests/unit/work-surface-model.test.ts`

## Carry-forward / next

- Admin, public, create, claim, login, billing, connect, and customer estimate portal were not deeply redesigned in this second pass.
- `lib/surface-model.ts` and `review/ReviewClient.tsx` still carry first-pass changes from the previous implementation; they remain compatible but were not the center of this pass.
- The owner UI now proves the product direction in fixture mode. A later pass can split large owner components into smaller files after the product shape stabilizes.
- The fixture dev server may already be running at `http://127.0.0.1:3200/agent/emp_ui_fixture`.

## Verification

- `npm run typecheck --workspace @amtech/web` passed.
- `npm run test:unit -- --run tests/unit/work-surface-model.test.ts` passed: 5 tests.
- `npm run ui:test` passed.
  - Screenshots:
    - `infra/.local/ui-fixtures/work-surface-desktop.png`
    - `infra/.local/ui-fixtures/work-surface-mobile.png`
    - `infra/.local/ui-fixtures/review-mobile.png`
- `npm run lint` passed.
- `npm run typecheck` passed across workspaces.
- `npm run test:unit` passed: 90 files / 570 tests.
- `npm run build` passed.
- Owner-copy scan over the touched owner/review UI files found no banned implementation terms in visible strings.
