# Avery-first owner UI implemented

Date: 2026-07-14 01:11 EDT  
Status: source-wired  
Scope: UI-only implementation of the active `mvp-build/ui-redesign/` packet for owner MVP surfaces

## What changed

Replaced the rejected agent-desktop owner shell with the active Avery-first direction:

- `apps/web/app/agent/[employeeId]/AgentClient.tsx`
  - new Home / Talk / Proof / Connected IA;
  - mobile-first Home with Avery presence, Tell Avery composer, Needs your say, quiet Watching, and Recent proof;
  - first active permission item renders as an exact compact review directly inside Needs your say;
  - optional work sheet remains available for selected objects, messages, generated surfaces, proof, and connections;
  - removed visible agent-desktop, stream-rail, mode, metric, and dashboard language.
- `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
  - retained the shared `WorkResource` / `WorkAction` behavior;
  - restyled as a warm dimensional review/object surface with less mono-heavy operational styling;
  - kept exact approval, reply/tweak, decline, receipts, media, iframe document, and expired states.
- `apps/web/app/agent/[employeeId]/lib/surface-model.ts`
  - tightened fallback approval action copy (`Approve send`, `Approve payment link`, etc.);
  - kept existing selection/preview contract helpers intact.
- `apps/web/app/agent/[employeeId]/review/ReviewClient.tsx` and `review/page.tsx`
  - aligned signed review visual language with the new calm review surface;
  - fixture approval now uses `Approve send` / `Tweak with Avery`.
- `apps/web/app/agent/[employeeId]/fixtures.ts`
  - kept rich coverage but changed demo vocabulary from agent desktop/streams to Avery Home, watching, stopped permission, and proof.
- `infra/scripts/ui/fixture-browser.mjs`
  - now proves desktop Home, Talk composer, inline approval, Connected, Proof, mobile Home, and signed mobile review;
  - screenshots include `work-surface-desktop.png`, `work-surface-mobile.png`, `proof-desktop.png`, and `review-mobile.png`.
- `ui-redesign/screenshots/`
  - copies the current fixture screenshots into the active redesign packet so the README has durable visual references.
- `tests/unit/work-surface-model.test.ts`
  - updated fixture expectation away from stream-rich agent desktop and toward Avery-first needs/watching/approval/proof coverage.

## Why

The active packet requires a radically simpler LLM-first owner experience. The previous shell still made the user
parse modes, streams, and an operational canvas. The new implementation makes Avery the interface: talk first,
the most important permission is visible immediately, quiet business awareness stays secondary, and proof is
available without forcing a ledger mental model.

## Current status

- `source-wired` locally.
- UI-only change; no Manager/API/shared schema behavior changed.
- No live provider/runtime acceptance claimed.
- Existing safety semantics remain intact: signed review/action routes, protected artifacts, `WorkResource` /
  `WorkAction`, and owner approval gates are reused.

## Files / seams touched

- Owner route: `apps/web/app/agent/[employeeId]/AgentClient.tsx`
- Shared owner/review renderer: `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- Owner model helpers: `apps/web/app/agent/[employeeId]/lib/surface-model.ts`
- Fixtures and signed review: `apps/web/app/agent/[employeeId]/fixtures.ts`, `review/ReviewClient.tsx`, `review/page.tsx`
- UI smoke and unit coverage: `infra/scripts/ui/fixture-browser.mjs`, `tests/unit/work-surface-model.test.ts`

## Carry-forward / next

- Public/create/claim/login/billing/customer portal/admin were intentionally out of scope for this owner MVP pass.
- The desktop Home screenshot is now the main visual target. The extra Proof screenshot is useful for proof/refinding review but not the first-screen target.
- `docs/state-of-progress-2026-07-14.md` is the current declarative progress statement across the whole product,
  second-half plan, and recent context-engineering work.
- Future implementation can split `AgentClient.tsx` into smaller components after the product shape is accepted.
- Artifact/output pages still deserve a separate visual alignment pass if the owner MVP direction is accepted.

## Verification

- `npm run test:unit -- --run tests/unit/work-surface-model.test.ts` passed: 5 tests.
- `npm run typecheck --workspace @amtech/web` passed.
- `npm run ui:test` passed.
- `UI_FIXTURE_BASE_URL=http://127.0.0.1:3200 npm run ui:test:headed` passed after starting an explicit fixture Next server on `127.0.0.1:3200`; the normal headed helper's raw-socket readiness path hit sandbox `EPERM`.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test:unit` passed: 90 files / 570 tests.
- `npm run build` passed.
