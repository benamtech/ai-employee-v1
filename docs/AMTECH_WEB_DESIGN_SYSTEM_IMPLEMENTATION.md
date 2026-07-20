# AMTECH Web Design System — Implementation Status

**Branch:** `employee-production-tuesday`  
**Updated:** 2026-07-19  
**Status:** canonical adaptive operating-surface foundation implemented; exact-head login and browser acceptance incomplete

## Authority

1. `AMTECH_WEB_DESIGN_SYSTEM.md` — visual tokens and presentation language.
2. `AMTECH_AGENT_INTERFACE_STANDARD.md` — operating primitives, adaptive layout, delegation, AG-UI, MCP Apps, authority, and evidence.
3. `AMTECH_UI_VALIDATION_STANDARD.md` — pass/fail release gates and required artifact set.
4. This file — implementation ledger only; it cannot redefine the first three documents.

Historical fixed-tab, Home/Talk/Proof/Connected, square-corner, dark-panel, 3px-grid, or provider-dashboard directions are superseded.

## Current product grammar

The owner product is an assignment-scoped operating surface, not a fixed navigation shell.

Canonical primitives:

- work loops;
- active saves with explicit return conditions;
- owner decisions;
- meaningful system changes;
- delegated work units attached to parent outcomes;
- evidence, receipts, artifacts, and recovery state;
- an anchored contextual command.

Manager emits owner-safe operating state and an adaptive layout plan. The browser renders registered regions/components and never reconstructs authority from raw provider events.

## Visual implementation rules

- Light surfaces only: `white` and `canvas`.
- `ink` for primary text.
- AMTECH red for brand and primary action.
- Blue for systems and information.
- Green for verified success and accepted outcomes.
- No orange, amber, gold, beige, rainbow, generic purple-AI treatment, or dark mode.
- Inter/system typography.
- 8px spacing rhythm, 16–24px cards, visible focus, reduced motion, mobile-first controls.
- Every visible object must improve hierarchy, comprehension, trust, action, return-condition awareness, or evidence.

## Surface implementation inventory

| Surface | Source | Current state | Evidence level | Blocking gap |
|---|---|---|---|---|
| Owner operating surface | `mvp-build/apps/web/app/agent/[employeeId]/AgentSurface.tsx` | Adaptive regions replace permanent tabs; work loops, saves, decisions, delegation, changes, evidence, and command are represented | `ci_accepted` at prior green SHA; current head unaccepted | Current merge-ref Manager type failure blocks exact-head UI proof |
| Operating context compiler | `mvp-build/apps/manager/src/lib/operating-surface.ts` | Compiles owner-safe manifest/profile/runtime/session/connector/materialized-work signals into deterministic state and layout rationale | `ci_accepted` at prior green SHA | Current head regression rerun required |
| Owner login API | `mvp-build/apps/web/app/api/auth/login/route.ts` | Supabase password auth delegates owner-session minting to Manager and sets HttpOnly cookie | `source_wired` | Visible login form is not connected; multi-account selection not rendered |
| Owner login form | `mvp-build/apps/web/app/login/page.tsx` | Static placeholder | `concept` | Must submit credentials, handle explicit account selection, and redirect only after durable session creation |
| Business identity onboarding | `BusinessIdentityControl.tsx`; `OnboardingIdentityGate.tsx`; Manager identity routes | Provider-backed identity gate exists and activation fails closed until verified | `source_wired` | Exact-head typecheck currently blocked by owner-session contract drift |
| Signed Review | `review/ReviewClient.tsx` | Light authority-aware review behavior exists | `source_wired` | Browser/mobile/expired/revoked/ambiguous acceptance matrix incomplete |
| MCP Apps resource | `components/McpUiResource.tsx` | Sandboxed registered resource boundary with fallback | `source_wired` | Compatible-host browser evidence incomplete |
| Adaptive browser fixture | `mvp-build/infra/scripts/ui/fixture-browser.mjs` | Existing script requires replacement because deleted tab selectors are invalid | `not_run` | New guided/standard/expert matrix required |
| Research-browser employee | Shared operating primitives support research loops, sources, contradictions, monitoring saves, delegation, synthesis, and evidence | Contract-level only | `concept` | Rendered browser fixture required |
| Ecommerce/growth employees | Generic primitives support orders, inventory, campaigns, thresholds, changes, and evidence | Contract-level only | `concept` | Browser fixtures required |
| Public estimator | `mvp-build/apps/web/app/free-estimator/**` | Explicitly non-canonical diagnostic/acquisition surface | `fixture_demonstration` | Must not be presented as flagship product UI |
| Admin/operator | Manager/admin and platform-authority surfaces | Authority foundation exists | `source_wired` | Production UI inventory and support-action confirmation incomplete |

## Adaptive planning behavior

Deterministic priority:

1. revoked, failed, ambiguous, or blocked authority/effect state;
2. owner decisions;
3. active work loops and material delegation;
4. active-save return conditions;
5. meaningful system changes;
6. evidence and connection detail.

High-volume ingress uses bounded logarithmic contribution. Event count may refine ordering inside a region but cannot displace an owner decision or active work loop.

## Delegation implementation

Subagents, tools, services, connected systems, and humans are first-class execution state and one-and-a-half-class routine presentation state.

Default owner presentation includes:

- delegated goal;
- parent work-loop purpose;
- state;
- material result or block;
- effect on confidence, cost, risk, progress, or next owner action.

Default owner presentation excludes internal prompt trees, chain-of-thought, secret-bearing topology, and decorative agent avatars.

## Current exact-head blocker

PR merge validation resolves a `mintOwnerSession` contract from `research` that returns `{ token, expires_at }`, while the branch implementation exposes `{ session_id, token, expires_at }`. `onboarding-identity-routes.ts` reads `ownerSession.session_id`, causing Manager `TS2339` on the PR merge ref and preventing downstream web, UI, PostgreSQL, image, and release-evidence jobs.

Required finite correction:

- remove the login audit dependency on a return property unavailable in the base contract, or intentionally version the shared contract in a merge-compatible change;
- connect the authored login form to `/api/auth/login`;
- replace deleted-tab browser acceptance;
- add the research-browser rendered fixture;
- rerun all exact-head gates.

## Evidence rules

Each surface must carry one evidence level:

- `live_production_proof`;
- `provider_accepted`;
- `browser_channel_accepted`;
- `ci_accepted`;
- `source_wired`;
- `fixture_demonstration`;
- `concept`.

Fixture, source-wired, or concept content must never imply live provider/customer acceptance.

## Deferred production gates

- approved staging database and migrations through the branch head;
- environment security/performance advisor acceptance;
- real Supabase owner login;
- real identity verification callback;
- verified activation and accepted C3 receipt;
- real Hermes work loop, active-save return, delegated work, signed Review, provider effect, and durable evidence on one deployment SHA;
- capacity, recovery, rollback, attestation, and deployment-manifest closure.
