# AMTECH visual identity applied across all web surfaces (UI-only restyle)

Date: 2026-07-12 02:10

Status: source-wired

Scope: First real design pass per `ui-handoff/`: the AMTECH visual language (Inter + IBM Plex Mono, ink-on-white / white-on-red, hairlines, sharp corners, 3px spacing grid) implemented across front door, create/claim/login, owner Work Surface, signed mobile Review, and Admin console. No contracts, routes, handlers, approval semantics, or Manager/materialization code changed.

## What changed

- **Foundation (new):** `apps/web/app/globals.css` (tokens as CSS vars, radius-0 reset, red/white `::selection`, red `:focus-visible`), `apps/web/app/layout.tsx` (self-hosted Inter + IBM Plex Mono via `next/font/google`, exposes `--font-inter` / `--font-plex-mono`), `apps/web/app/flow-styles.ts` (shared front-door-flow styles).
- **Token layer:** `surface.tokens.ts` values rewritten in place (same exported shape): accent = AMTECH red `#e11d2a`, ink `#0a0a0a`, wash `#f4f4f4`, alpha-hairline borders, all radii 0, shadows none, ×3 spacing (3/6/12/18/24/36), type scale on ×3 (9/12/15/18/24), new `font.mono`. This restyled every token-consuming card component at once.
- **Work Surface (`AgentClient.tsx`):** full `WORK_SURFACE_CSS` rewrite — hairline-separated rail/topbar/view/preview composition (no floating rounded cards), AMTECH. wordmark brand block, red-left-border active nav with mono counts, segmented status strip, list rows as bordered rows with mono kickers + right-aligned square status tags, dense chat, mono ink composer button. Status pill grammar: attention/needs-you = red outline, failed = white-on-red, ok = ink outline, quiet = muted.
- **Hydration marker:** the topbar kicker renders "Starting" until a mount effect flips it to "Work Surface". This is honest UI *and* makes `ui:test` deterministic — the smoke's first assertion (`getByText("Work Surface")`) now cannot pass until React is interactive, closing a pre-existing race where cold-dev-server clicks landed before hydration and silently did nothing (the Outputs assertion was satisfiable from Today-DOM text, so the failure surfaced 2 steps later at the Chat composer). No test-script changes.
- **Cards:** `DailyBrief` is now the Today hero (mono red DAILY BRIEF kicker, 18px headline, full-width segmented strip of 36px stat numerals — red only when the count needs the owner); `WorkCard`/`ApprovalCard` use 3px move bars + bordered mono move tags + ink-filled Approve / red-outlined "Not yet" buttons; `JobFolder` uses mono step tags (EST/MSG/INV/REM) and square chips; `Receipt` prints a mono PROOF line; `deliverables` emoji icon map replaced with mono text tags (doc/msg/pay/rpt/cal/img/job/ext/plan/tool); `McpUiResource` iframe now hairline + radius 0.
- **Signed Review (`ReviewClient.tsx`):** AMTECH. / SECURE REVIEW header bar, mono risk kicker, 36px amount, mono-labeled field table, 48px mono action buttons (ink-filled Approve, red-outlined Decline), content region flex-grows so the sticky action bar pins to the bottom of the viewport, and a **3px red top rule on the action bar whenever any action is gated** (money/customer-facing consequence signal).
- **Front door (`page.tsx`):** rebuilt — logotype bar, mono red kicker, clamp(3rem→4.5rem) Inter-black hero with red period, truthful capability copy, red filled CTA, 1px-gap divider grid (TEXT IT / IT ASKS FIRST / PROOF AFTER), white-on-red commitment band, hairline footer. Removed the owner-facing dev vocabulary ("Supabase, Twilio, Hermes" note).
- **Create/claim/login:** restyled as numbered hairline step sections (TELL / PROVE / CLAIM / PUT IT TO WORK) with identical state/handlers/fetches; "Provision employee" button label is now owner-language "Start your employee"; login stub explains signed-link access instead of "[ Phase 1: Supabase Auth ... ]".
- **Admin (`AdminClient.tsx`):** operator theme in the same language (ink/mono/red-for-fail, 1px-gap metric grid, bordered nav with red active edge, square pills: pass = ink outline, warn = red outline, fail = white-on-red). Roles, redaction, support-reason, and all handlers untouched.
- **Fixture artifact HTML** (`output/[artifactId]/route.ts`, fixture branch only): estimate/report/media preview docs restyled as AMTECH documents (logotype head, mono meta, hairline tables, ink total rule). The real Manager-side renderer was NOT touched.

## Why

`ui-handoff/README.md` mandate: Bloomberg-terminal-meets-early-Stripe, Inter/IBM Plex Mono, two text/background modes (near-black on white; white on AMTECH red `#E11D2A`, hover `#FF1A2B`), sharp corners, no decoration. Composition discipline applied: sections separated by hairlines instead of whitespace-gap floating cards, one dominant hero per screen (Daily Brief on Today; amount on Review), uppercase mono operational labels, text glyphs instead of emoji, all spacing/type on a 3px grid.

## Current status

- All owner + operator web surfaces: `source-wired` in the AMTECH language; fixture-mode browser proof captured (screenshots below).
- NOT live/provider/runtime proof: no Manager, Hermes, Twilio, Gmail, Stripe, or model path exercised. Admin was screenshotted chrome-only (no Manager behind it).
- Fonts are self-hosted via `next/font/google` — first build/dev-compile on a new machine needs network once to fetch Inter/IBM Plex Mono.

## Files / seams touched

- New: `apps/web/app/globals.css`, `apps/web/app/flow-styles.ts`.
- Modified (apps/web only): `layout.tsx`, `page.tsx`, `login/page.tsx`, `claim/ClaimClient.tsx`, `create-ai-employee/page.tsx`, `agent/[employeeId]/{AgentClient.tsx, surface.tokens.ts}`, `agent/[employeeId]/components/{DailyBrief,WorkCard,ApprovalCard,JobFolder,Receipt,McpUiResource,deliverables/index}.tsx`, `agent/[employeeId]/review/ReviewClient.tsx`, `agent/[employeeId]/output/[artifactId]/route.ts` (fixture HTML only), `admin/AdminClient.tsx`.
- Untouched on purpose: `packages/shared/*`, `apps/manager/*` (including `ui-resources.ts` card CSS and `artifact-view.ts`), all tests/build scripts, migrations, fixtures data.

## Carry-forward / next

1. **MCP-UI card styling** — `apps/manager/src/lib/ui-resources.ts` `BASE_STYLE`/`tableHtml`/`scheduleHtml`/`diffHtml`/`formHtml` still render the old plain look inside the (now hairline) iframe. Restyling it to the same tokens is the natural next slice; it lives Manager-side, so coordinate per working-protocol.
2. **Real artifact document design** — `apps/manager/src/lib/artifact-view.ts` `renderArtifactHtml()` produces the production estimate/document HTML; apply the AMTECH document treatment proven in the fixture HTML (logotype head, mono meta, hairline tables, ink total rule).
3. **Shared WorkResource renderer** — web preview pane and `ReviewClient` still render separately; unify per `data-catalog.md` §3.
4. **Mobile Work Surface polish** — tab nav + stacked preview work, but the preview-below-content pattern deserves a drawer/full-screen page treatment (`experiments-and-future-surfaces.md`).
5. If UI-fixture cold-start flakes ever recur, remember the root cause found here: assertions passing off server HTML while clicks land pre-hydration; the "Starting" marker is the guard.
6. Fresh clones must `npm run build -w @amtech/shared -w @amtech/db` before web dev/tests (dist packages).

## Verification

- `npm run typecheck` — pass.
- `npm run test:unit` — pass, 84 files / 518 tests (after building `@amtech/db` dist; 15 files fail collection on a fresh clone without it — environment, not code).
- `npm run lint` — pass.
- `npm run build` — pass (Next standalone).
- `npm run ui:test` — pass; screenshots at `infra/.local/ui-fixtures/{work-surface-desktop,work-surface-mobile,review-mobile}.png`.
- Additional fixture-mode eyes-on: front door (desktop + 390px), create, login, claim, admin chrome — rendered and visually reviewed; two defects found and fixed during review (admin logotype line-wrap from a legacy `display:block` span rule; disabled red CTA keeping its red fill).
- No live/provider/runtime acceptance claimed.
