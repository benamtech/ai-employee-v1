# UI Handoff

Status: active

Purpose: this folder helps a UI-focused contributor work on the AMTECH AI Employee interfaces while the founder continues finishing MVP functionality. It is an orientation packet, not a design system and not a final visual spec.

The app does not yet have a deliberate visual language. Most current styling is pragmatic scaffolding: inline React styles, small token objects, and enough layout to prove the Work Surface shape. Treat the current UI as a working prototype that can be improved, reorganized, and made coherent. Preserve product semantics and safety gates; do not treat current colors, spacing, or component styling as sacred.

## Start Here

Read these first, in order:

1. `../identity.md` — AMTECH operating identity and voice.
2. `../CODEGRAPH.md` — whole workspace map, canonical facts, current second-half context.
3. `../mvp-build/CODEGRAPH.md` — MVP build source map and current status.
4. `../mvp-build/CLAUDE.md` and `../mvp-build/AGENTS.md` — build-home rules. Note: if these lag the newer source map, prefer `mvp-build/CODEGRAPH.md` plus newest `mvp-build/memory/` notes for current status.
5. `../mvp-build/memory/MEMORY.md`, then the newest dated handoffs.
6. `../mvp-build/second-half-plan/README.md`.
7. `../wiki/MVP/second-half-current-and-future-state.md`.
8. This folder.

Then read whichever UI area you are touching:

- [Product Grounding](product-grounding.md) for what AMTECH is, why the product is powerful, and how to distinguish the wiki from `mvp-build/`.
- [Data Catalog](data-catalog.md) — **read this before designing anything.** Full inventory of every data shape available to the UI (`ResourcePayload`, `WorkResource`/`WorkAction`, `SurfaceEnvelope`/`CapabilityGraphNode`, admin contracts), every surface that consumes it (web desk, signed mobile review, admin console, MCP-UI generative cards), and the concrete artifact-link/preview-image plumbing.
- [Current UI Map](current-ui-map.md) for source files, data flow, and existing implementation notes.
- [Research And Principles](research-and-principles.md) for the Hermes GUI discoveries, generative UI direction, and product vocabulary.
- [Experiments And Future Surfaces](experiments-and-future-surfaces.md) for preview media, SMS links, task progress, images/video/artifacts, and cross-surface data representations.
- [Working Protocol](working-protocol.md) for how to work without blocking backend/MVP functionality, what checks to run, and how to write handoffs.

## Current Build Position

The current forward plan is `mvp-build/second-half-plan/`. All of Phases 1-5 below are already
`source-wired` in code — this packet used to describe Phase 3-5 as future work; they are not. Live
provider/runtime/operator proof is still `pending` for all of them (no fabricated acceptance claims),
but the surfaces, contracts, and routes exist today and are designable/buildable against.

Relevant current status (see `mvp-build/CODEGRAPH.md` §3 for the authoritative version):

- **Phase 1** (preserve/close live gate): `source-wired/static-green`; live browser/runtime proof is blocked until a usable model/provider path exists.
- **Phase 2** (owner Work Surface redesign): `source-wired`. The web Work Surface is a multi-region employee desk with Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, Settings-lite, and a preview pane.
- **Phase 3** (SMS ambient inbox + signed mobile previews): `source-wired`. A real signed, scoped, expiring preview/action link mints a `WorkResource` and renders it at `/agent/[employeeId]/review` — a mobile-first page with sticky approve/reject/reply, inline media/document preview, and quiet receipt links. SMS carries the link, not a rich payload.
- **Phase 4** (tool-agnostic capability/materialization layer): `source-wired`. `SurfaceEnvelope`, `CapabilityGraphNode`, `WorkResource`/`WorkAction`, and a Manager capability registry exist and are exposed via Manager MCP `resources/list`/`resources/read`. The web Work Surface's Outputs/Tasks/Abilities views mostly still consume the older `ResourcePayload` derived fields directly — wiring more of the UI through the generic materialization contract is open work.
- **Phase 5** (trial ops/admin/billing): `source-wired`. An internal `/admin` console exists (dashboard, accounts, provisioning, repairs, providers, billing scaffold, employee support actions, readiness). It is operator-facing, not owner-facing, and is a separate audience/vocabulary from the Work Surface.
- Also source-wired: MCP-UI generative cards — the agent can emit a typed `table`/`schedule`/`diff`/`form` view that Manager compiles into a real `ui://` resource, rendered in a sandboxed iframe on the web Work Surface with actions routed through the same approval gate.
- Also source-wired (2026-07-11): a **tool-agnostic Connector Center** (`ConnectionSurface`) and a **resurfacing projection** (`ResurfaceItem`) — `Connected` renders generic connected-business cards before raw connector rows, and `Today`/`Daily Brief` compute attention from resurfacing items. These are the product use of the Phase 4 materialization layer; see `data-catalog.md` §4.5.

For UI work, this means:

- The backend shape is good enough to design against, and it already covers more surfaces than "just the web desk" — read `data-catalog.md` before assuming a surface or data field doesn't exist yet.
- None of the current visual/component work in any of these surfaces is final; all can be improved aggressively, including the signed Review page and the Admin console.
- New work should reuse the `WorkResource`/`WorkAction` contract (see `data-catalog.md` §3) rather than re-deriving resource/action shapes per surface.
- Do not claim live acceptance unless real runtime/provider/operator proof exists.

## UI-Only Fixture Mode

UI contributors do not need to run Docker, Supabase, Manager, Hermes, or model/provider credentials just to work on the web client.

From `mvp-build/`:

```bash
npm run ui:dev          # fixture-backed Next dev server on :3000
npm run ui:browser      # starts fixture server on :3200 and opens a headed browser
npm run ui:test         # headless Playwright smoke against fixture data
npm run ui:test:headed  # same smoke in a headed browser
```

Fixture mode sets `NEXT_PUBLIC_AMTECH_UI_FIXTURES=1`. It uses the real `AgentClient` and real Work Surface components with representative local `ResourcePayload` data: approvals, messages, jobs, outputs, media/report artifacts, connector states, abilities, task progress, and activity. It also simulates chat replies and approval resolution locally.

The browser smoke warms the fixture Work Surface route before assertions, because a cold Next dev server can take time to compile. It writes desktop and mobile screenshots to `infra/.local/ui-fixtures/`.

This is for UI development and UI-only smoke tests. It is not provider/runtime acceptance and does not prove Manager, Hermes, Docker, Supabase, Gmail, Stripe, Twilio, or the model path.

## What UI Work Can Safely Focus On

Good areas for an independent UI contributor:

- Visual hierarchy and layout polish for the Work Surface.
- Responsive/mobile behavior for the employee desk and preview pane.
- Better empty, loading, degraded, and error states.
- Clearer owner language for tasks, abilities, connectors, outputs, and activity.
- Component extraction from the large `AgentClient.tsx` file if it reduces complexity.
- Reusable styling/tokens if they make the UI easier to evolve — including a real design system that
  spans the Work Surface, the signed Review page, and (separately styled, operator-audience) Admin.
- Playwright/browser checks and screenshots once the local surface can run.
- UI-only fixture checks through `npm run ui:test` / `npm run ui:test:headed`.
- Visual/UX polish of the already-built signed mobile Review page (`apps/web/app/agent/[employeeId]/review/`) — it renders a real `WorkResource` today; see `data-catalog.md` §3.
- Visual/UX polish of the already-built Admin console (`apps/web/app/admin/`) — a distinct operator audience/vocabulary; see `data-catalog.md` §7.
- Improving the MCP-UI generative card compiler/renderer (`ui-resources.ts` + `McpUiResource.tsx`) — currently very plain inline HTML/CSS; see `data-catalog.md` §6.
- Experimental preview patterns for images, video, reports, task progress, and other artifacts, as long as the web client remains the first implementation target.

Coordinate before changing:

- Manager API contracts, database migrations, auth, provider secrets, approval semantics, runtime delivery, or Hermes profile behavior.
- The shared `ResourcePayload` shape if the change requires backend support.
- Approval gates around money, customer-facing sends, external changes, deletes, credentials, or dangerous actions.

## Product Mental Model

AMTECH packages Hermes Agent into a small-business employee. The owner should not feel like they are using a developer dashboard or a chatbot wrapper. They should feel like they hired a competent assistant who:

- knows what work is waiting;
- shows outputs before sending or spending;
- asks clear questions;
- leaves receipts and proof;
- can work through web, SMS, signed links, and future surfaces;
- stays behind approval gates for risky actions.

The Manager backend is invisible to the owner. Owner-facing language should say employee, work, abilities, connected accounts, outputs, proof, waiting for you, and recurring work. Keep MCP/API/toolset/runtime/config/token language out of normal owner UI.

## Wiki Versus MVP Build

Use `wiki/` for product strategy, market context, principles, architecture rationale, and research. Use `mvp-build/` for actual implementation state, source files, tests, scripts, and current handoffs.

If a wiki vision and the source differ, do not assume the vision is already built. Check `mvp-build/CODEGRAPH.md`, `mvp-build/memory/MEMORY.md`, the newest memory note, and the source.

## Files In This Packet

- `README.md` — this overview.
- `product-grounding.md` — product power, owner mental model, and wiki versus `mvp-build/`.
- `data-catalog.md` — full inventory of data shapes, surfaces, routes, and artifact/preview plumbing available to the UI today. Read this before designing.
- `current-ui-map.md` — concrete source map and current implementation notes, across all surfaces (Work Surface, Review, Admin, MCP-UI cards).
- `research-and-principles.md` — research index and design/product principles.
- `experiments-and-future-surfaces.md` — forward UI backlog for SMS/media previews and surface representations, marked against what is already source-wired.
- `working-protocol.md` — checks, handoff rules, memory protocol, and coordination guidance.
