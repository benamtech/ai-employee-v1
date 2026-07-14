# Complete product page inventory: 12 new pages/states

Date: 2026-07-12 04:00

Status: source-wired

Scope: Built every page the product still needed beyond the restyled existing surfaces, all in the AMTECH design system, fixture-mode. UI-only; no shared contracts, Manager code, tests, or migrations touched.

## What changed (new pages/states)

- **Public:** `/pricing` (offer ladder — free now → $300 tuned package → $1,000/$1,500 live employee → office loop, honest early-access framing), `/terms`, `/privacy` (real minimal legal, owner-safe voice). Shared `app/public-chrome.tsx` (header/footer/prose/pricing-tier styles).
- **Auth:** `/forgot-password`, `/reset-password` (recovery shells on `flow-styles`).
- **Onboarding:** `/welcome` — "meet your employee" success (reads `?name&number&employeeId`, shows the number + first-text nudge + 3 steps + red band). Replaces the raw-JSON end of the create flow (create flow itself unchanged; welcome is a new destination).
- **Owner:** `/agent/[id]/connect/[connector]` — connector consent (will/won't columns, ✓ ink / ✕ red) + `?state=connected|failed` result landings (the OAuth callback destination); `/agent/[id]/billing` — early-access plan view, honest roadmap table, no paywall.
- **Customer-facing (the OTHER side):** `/e/[token]` + `EstimatePortalClient.tsx` — the estimate portal a homeowner opens from the employee's email: business letterhead, line items + assumptions + confirm-flag, deposit, sticky "Accept & pay deposit" bar with the red gated rule; `?token` containing "paid" → paid confirmation. The business is the brand; quiet "on AMTECH." footer.
- **First-run activation:** `FirstRun.tsx` rendered in the Today view when `res.employee` exists but there's no work/connections/approvals. Shows "{name} is ready" + 0/0/0 stat strip + a 3-step get-started checklist (text first job / connect email / connect payments) linking into the real connect flow. Fixture employee `emp_ui_new` (any id containing "new") returns an empty payload to drive it — added a branch at the top of `fixtures.ts` `fixtureResourcePayload`.

## Why

"Make every UI page it will need." The product had well-styled happy paths but no pricing/legal/auth-recovery, no onboarding success, no connector consent/repair, no owner billing, no customer-facing side, and no first-run activation — the surface that most determines whether a trial owner ever sends the first job.

## Files / seams touched

- New: `app/public-chrome.tsx`, `app/{pricing,terms,privacy,forgot-password,reset-password,welcome}/page.tsx`, `app/agent/[employeeId]/{billing/page.tsx, connect/[connector]/page.tsx, components/FirstRun.tsx}`, `app/e/[token]/{page.tsx, EstimatePortalClient.tsx}`.
- Modified: `app/agent/[employeeId]/AgentClient.tsx` (FirstRun import + empty-desk branch in TodayView), `app/agent/[employeeId]/fixtures.ts` (emp_ui_new empty branch).
- Untouched: `packages/shared/*`, `apps/manager/*`, tests, migrations.

## Carry-forward / next

- These are UI surfaces; wiring them to Manager is backend work (OAuth start/callback for connect; real Stripe deposit for `/e/[token]`; real plan/usage for billing; provisioning → `/welcome` redirect with real number). Coordinate per working-protocol.
- The connect page's OAuth is a link-simulated flow (`?state=`); real OAuth needs the Manager start URL + callback wiring.
- `/e/[token]` deposit is local state; real payment is the Stripe deposit already source-wired Manager-side.

## Verification

- `npm run typecheck` — pass. `npm run lint` — pass. `npm run build` — pass (all new routes in the route table). `npm run test:unit` — 90 files / 568 tests pass. `npm run ui:test` — pass.
- Eyes-on (fixture, headless with Liberation-font override): pricing, welcome, first-run desk, connector consent, connected result, billing, customer portal, terms, forgot-password — all render on-system.
- **Dev-cache note (recurring):** two routes 500'd on the long-running dev server with `MODULE_NOT_FOUND`/`ENOENT vendor-chunks/*.js` — stale `.next` incremental cache after many hot recompiles across new routes, NOT code bugs (proven: the same route file's `?state=connected` variant returned 200, and a clean `rm -rf .next` + restart made both 200; production build passed throughout). When new routes 500 on a long-lived dev server, restart clean before diagnosing.
