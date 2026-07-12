# Full page inventory: error/404/loading, Admin fixtures, Review variants, MCP-UI fixture card, metadata

Date: 2026-07-12 02:35

Status: source-wired

Scope: Second UI slice after the visual-identity restyle (see `2026-07-12-0210-…`): built every page the web product was still missing and closed the fixture-coverage gaps so all three audiences (owner, operator, signed-link visitor) are fully designable and browser-testable without a backend.

## What changed

- **Global pages (new):** `app/not-found.tsx` (owner-safe 404), `app/error.tsx` (error boundary — plain statement + Try again + home; the error object is deliberately never rendered), `app/loading.tsx` (minimal mono "AMTECH — LOADING" line, not a dominant spinner).
- **Admin fixture mode (new `app/admin/fixtures.ts` + AdminClient short-circuits):** with `NEXT_PUBLIC_AMTECH_UI_FIXTURES=1` the console renders a two-account world (Ferraro green / Miller yellow with open repairs), environment readiness (pass/warn/skipped checks + proof paths), account detail, employee ops, trial-readiness reports (ready vs blocked), and materialization inspector. Support actions set a "simulated locally" status and never call Manager. Data-catalog §9 previously listed Admin as uncovered by fixture mode — now covered.
- **Review fixture variants** (`review/page.tsx` `fixtureResource`): added `fixture-media` (inline-SVG before/after photo, `body_kind: "media"`), `fixture-receipt` (sent-estimate receipt with proof links + Got it), `fixture-failure` (connector failure with owner-safe repair copy). Together with the existing approval/estimate/report tokens, the signed Review page now demos 6 of the preview types from `experiments-and-future-surfaces.md`.
- **MCP-UI fixture card** (`fixtures.ts` new `we_schedule_card` work event): a `schedule_mutation` deliverable carrying a `ui_resource` envelope — AMTECH-styled schedule-confirmation HTML (mono red kicker, hairline slot table, CHOOSE per slot, ink CONFIRM / red-outline NOT YET) whose buttons post `amtech-mcp-ui` intents through the host's normal approval/respond handlers. `McpUiResource` is now exercised in fixture mode (was uncovered), and this card doubles as the **design target** for the Manager-side `ui-resources.ts` compiler restyle.
- **Metadata + favicon:** per-page `metadata` titles on front door, login, claim, create (split into server `page.tsx` + `CreateClient.tsx` for this), agent desk, review, admin (`robots: noindex`), 404; red-square SVG data-URI favicon in `layout.tsx`.

## Why

"Build every page needed for the UI": the product had well-styled happy paths but no 404/error/loading, an operator console that rendered empty without Manager, no way to see media/receipt/failure review states or a generated card during UI work, and untitled tabs.

## Current status

- All web pages + states: `source-wired`, fixture-proven with screenshots. No live/provider/runtime claims; admin fixture data is explicitly labeled UI-only and support actions do not reach Manager.

## Files / seams touched

- New: `app/{not-found,error,loading}.tsx`, `app/admin/fixtures.ts`, `app/create-ai-employee/page.tsx` (server wrapper; old page → `CreateClient.tsx`).
- Modified: `app/admin/{AdminClient,page}.tsx`, `app/agent/[employeeId]/{page,fixtures,review/page}.tsx`, `app/{layout,page}.tsx`, `app/login/page.tsx`, `app/claim/page.tsx`.
- Still untouched: `packages/shared/*`, `apps/manager/*`, tests, migrations, scripts.

## Carry-forward / next

1. Manager-side MCP-UI compiler (`ui-resources.ts`) — port the fixture card's AMTECH styling into `BASE_STYLE`/`scheduleHtml` etc. (coordinate; the design target is proven in fixture).
2. `artifact-view.ts` document treatment (unchanged from prior handoff).
3. The admin fixture world (Ferraro/Miller) is a good base for future admin UX iterations — extend it rather than inventing new shapes.
4. Consider extending `ui:test` to walk the review variants + admin fixture (coordinate first: test scripts are out of UI scope per current ground rules).

## Verification

- `npm run typecheck` — pass. `npm run lint` — pass. `npm run test:unit` — 84 files / 518 tests pass. `npm run build` — pass. `npm run ui:test` — pass.
- Fixture-mode eyes-on: admin dashboard + Miller account detail (readiness FAIL/WARN pills, support actions), review media/receipt/failure variants, MCP-UI schedule card rendered in the sandboxed iframe, 404 page. One probe-side false alarm during review (a `getByText` matched a readiness-warning paragraph instead of the account row — product behavior was correct).
