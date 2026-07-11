# UI Handoff

Status: active

Purpose: this is the canonical handoff packet for a UI/design implementation agent taking AMTECH from functional MVP surfaces to a coherent product experience. Treat it as a working prompt, source map, and product brief for redesigning and implementing the browser-facing UI across the project.

North star: **the Macintosh of AI agents for the modern American business**. AMTECH should feel like a capable employee inside a precise, legible business machine - not a chatbot skin, developer dashboard, or collection of disconnected automations.

The current UI is mostly scaffolding: inline React styles, small token objects, pragmatic layouts, and enough visual structure to prove the Work Surface, signed Review page, Admin console, and generated-card mechanics. Preserve product semantics, contracts, security, and approval gates. Do not preserve the current visual treatment unless it proves itself.

## Master Handoff Prompt

Use this prompt to orient a cutting-edge AI UI agent before it starts work:

```text
You are taking over UI/design implementation for AMTECH, an AI employee product for small American businesses.

Your job is to work out and implement almost all UI needs for the current project: design direction, information architecture, component system, responsive layouts, artifact previews, action states, and surface-specific UX across every existing AMTECH surface.

The product is not a chatbot, admin dashboard, or automation builder. AMTECH packages Hermes Agent into a trusted employee who can be texted, inspected on the web, produce business outputs, ask for missing details, request approvals before risky work, and leave proof after work is done.

North star: make AMTECH feel like the Macintosh of AI agents for the modern American business - direct, powerful, legible, trusted, and designed for an owner who wants work handled, not software managed.

Before designing or editing code, read the repo-root-relative files in this order:

1. identity.md
2. CODEGRAPH.md
3. mvp-build/CODEGRAPH.md
4. mvp-build/CLAUDE.md
5. mvp-build/AGENTS.md
6. mvp-build/memory/MEMORY.md and the newest dated memory handoffs
7. mvp-build/second-half-plan/README.md
8. wiki/MVP/second-half-current-and-future-state.md
9. mvp-build/ui-handoff/product-grounding.md
10. mvp-build/ui-handoff/data-catalog.md
11. mvp-build/ui-handoff/current-ui-map.md
12. mvp-build/ui-handoff/research-and-principles.md
13. mvp-build/ui-handoff/experiments-and-future-surfaces.md
14. mvp-build/ui-handoff/working-protocol.md

Then inspect the source surfaces and current contracts before making design decisions:

- apps/web/app/page.tsx
- apps/web/app/create-ai-employee/page.tsx
- apps/web/app/login/page.tsx
- apps/web/app/claim/
- apps/web/app/agent/[employeeId]/AgentClient.tsx
- apps/web/app/agent/[employeeId]/review/ReviewClient.tsx
- apps/web/app/admin/AdminClient.tsx
- apps/web/app/agent/[employeeId]/components/McpUiResource.tsx
- apps/manager/src/lib/ui-resources.ts
- packages/shared/src/resource-payload.ts
- packages/shared/src/preview-links.ts
- packages/shared/src/materialization.ts
- packages/shared/src/admin.ts

Design and implement across all current UI surfaces, not just one screen:

- public/root front door;
- create employee flow;
- claim flow;
- login flow;
- owner Work Surface;
- signed mobile Review page reached from SMS links;
- artifact/output/document/media previews;
- MCP-UI generated cards;
- internal Admin console;
- connected account, ability, task, proof, receipt, and resurfacing states already present in the shared contracts.

Hard constraints:

- Keep AMTECH product semantics: one employee, owner-safe language, preview before risky actions, proof after completed work, and a coherent state rendered across web, SMS links, admin, and future clients.
- Preserve approval gates around customer-facing sends, money movement, external writes, deletes, credentials, and other dangerous actions.
- Preserve signed-link scope, artifact security, platform-role checks, support-reason audit, redaction, and Manager/backend contracts unless a coordinated backend change is explicitly needed.
- Do not expose MCP/API/tool/runtime/config/schema/token/stack-trace language in normal owner UI. Admin/operator UI may expose technical state when it is useful and redacted.
- Do not claim provider/runtime/live acceptance unless it actually ran.
- Keep the AMTECH typography direction: Inter for AMTECH logotype/display/body/paragraph text and IBM Plex Mono for mono labels or operational microcopy.
- Obey the two text/background modes: black or near-black text on white, and white text on AMTECH red. Red can accent white surfaces. Black can accent red surfaces. Do not create additional normal text/background combinations.

Creative freedom:

- You may redesign layouts, navigation, motion, component architecture, preview systems, cards, tables, action controls, empty states, and responsive behavior.
- You may choose UI libraries, animation libraries, icon systems, charting tools, CSS architecture, and component extraction patterns if they materially improve the product and do not break the constraints above.
- Existing notes like "Lucide only" or "no other libraries" are not binding for this handoff. Use whatever is best for the product, document new dependencies, and keep tests/build healthy.
- The design-system notes below are a strong starting point, not a locked component recipe except for the typography and text/background color rules.

Implementation expectations:

- Build from current contracts instead of inventing separate one-off data models per surface.
- Prefer reusable WorkResource/action/rendering primitives across the web preview pane, signed Review page, generated cards, and future admin inline previews.
- Improve the visible product, not just tokens. The owner should understand what the employee knows, made, needs, can do, and already proved.
- Use fixture mode for UI development and screenshots. From mvp-build/: npm run ui:dev, npm run ui:browser, npm run ui:test, npm run ui:test:headed.
- Before handoff, run the strongest practical checks: npm run ui:test, npm run typecheck, npm run test:unit, npm run lint, npm run build. If something cannot run, document why.
- After substantial UI work, add a dated memory handoff under mvp-build/memory/ and update mvp-build/memory/MEMORY.md.
```

## Design System Seed

These notes define the intended AMTECH feel. They are source material for the UI agent's design work. The hard rules are the font direction and text/background color modes; other specifics may evolve if the result better serves the product.

### Aesthetic

Bloomberg terminal meets early Stripe: controlled, precise, high-contrast, and typographic. No soft SaaS haze. No generic AI gradients. No rounded friendliness for its own sake. The interface should feel like business machinery made approachable by clarity.

### Hard Typography Rule

- AMTECH logotype, display, body, and paragraph text use Inter.
- Mono labels, small operational labels, IDs where appropriate, and compact CTA text use IBM Plex Mono.
- Weights can vary, but the core posture should stay decisive: black, bold, medium.

Suggested scale:

- Hero: `clamp(3rem,7vw,4.75rem)`, black weight, tight tracking, leading 1.
- Section head: `clamp(1.75rem,3.5vw,3rem)`, black weight, tight tracking.
- Big stat/number: `clamp(6rem,18vw,11rem)`, black weight, leading none.
- Sub-headline: `clamp(1.1rem,2.5vw,1.5rem)`, semibold.
- Body: `1rem`, leading `1.75` to `1.85`.
- Mono label: `0.6rem`, uppercase, wide tracking.
- Mono CTA: `0.7rem`, uppercase, wide tracking.
- Logo: `AMTECH` plus a red period.

### Hard Color Rule

Use only two normal text/background modes:

1. Black or near-black text on white background.
2. White text on AMTECH red background.

Allowed values:

- Text ink: near-black `#0a0a0a`, white `#ffffff`.
- Red: `#E11D2A`; bright red `#FF1A2B` only for hover or active emphasis.
- White background: `#ffffff`.
- Light gray `#f4f4f4` can separate sections or rows when text remains black/near-black.
- Pure black/near-black can be used for hairlines, structural rules, logo marks, or non-reading accents. Do not create a normal text surface that depends on white text over black.
- Borders: `black/5`, `black/10`, `black/15`, and restrained red accents.
- On white: red is an accent for labels, logo period, active borders, alerts, and key CTAs.
- On red: white is the dominant text color; black may accent but cannot become the main reading mode.
- Selection: red background with white text.

### Layout Direction

- Use an 8px spacing system unless a specific component demands tighter density.
- Favor sharp, precise separations: hairline dividers, table-like alignment, strong type hierarchy, disciplined whitespace.
- Common section rhythm: `px-6 py-20 md:py-28`, with larger hero/CTA spacing when the page warrants it.
- Useful container widths: `max-w-3xl` for prose, `max-w-4xl` for hero/detail, `max-w-7xl` for grids and operational surfaces.
- Divider grids can use `grid gap-px bg-black/10` with white cells.
- Mobile-first responsive design, with `md` around 768px as the main breakpoint.
- Keep corners sharp by default. If a new component uses radius, the reason should be interaction-specific, not decoration.

### Interaction And Motion Direction

- Motion should clarify state changes and hierarchy: word reveals, countups, staggered columns, horizontal step tracks, animated 1px borders, and fast operational transitions.
- Vary motion by surface and function. Avoid one repeated fade pattern.
- Keep interaction fast. Owners should feel that the employee is working, not that the app is performing.
- Existing GSAP/ScrollTrigger and framer-motion dependencies are available, but the UI agent may use other tools if justified.

### Buttons And Actions

- CTAs should feel sharp and operational: square edges, compact mono text, clear active state.
- Primary CTAs can be near-black on white surfaces or red when the action needs emphasis.
- Secondary actions can be underlined mono links or compact text buttons.
- Approval actions must make consequence clear before action. Avoid vague "confirm" language for money, sends, writes, or destructive actions.

## Product Mental Model

AMTECH packages Hermes Agent into a small-business employee. The owner should feel like they hired a competent assistant who:

- knows what work is waiting;
- shows outputs before sending or spending;
- asks clear questions;
- leaves receipts and proof;
- works through web, SMS, signed links, and future surfaces;
- stays behind approval gates for risky actions.

Owner-facing language should say employee, work, abilities, connected accounts, outputs, proof, waiting for you, and recurring work. Keep developer/backend language out of normal owner surfaces.

## Start Here

All paths in this section are repo-root relative.

Read these first, in order:

1. `identity.md` - AMTECH operating identity and voice.
2. `CODEGRAPH.md` - whole workspace map, canonical facts, current context.
3. `mvp-build/CODEGRAPH.md` - MVP build source map and current status.
4. `mvp-build/CLAUDE.md` and `mvp-build/AGENTS.md` - build-home rules. If these lag newer source maps, prefer `mvp-build/CODEGRAPH.md` plus newest `mvp-build/memory/` notes.
5. `mvp-build/memory/MEMORY.md`, then the newest dated handoffs.
6. `mvp-build/second-half-plan/README.md`.
7. `wiki/MVP/second-half-current-and-future-state.md`.
8. This folder.

Then read whichever UI area you are touching:

- [Product Grounding](product-grounding.md) - what AMTECH is and why the UI matters.
- [Data Catalog](data-catalog.md) - read before designing anything. It inventories `ResourcePayload`, `WorkResource`/`WorkAction`, `SurfaceEnvelope`/`CapabilityGraphNode`, admin contracts, routes, surface consumers, artifact links, and preview plumbing.
- [Current UI Map](current-ui-map.md) - source files, data flow, and implementation notes.
- [Research And Principles](research-and-principles.md) - Hermes GUI discoveries, generative UI direction, and product vocabulary.
- [Experiments And Future Surfaces](experiments-and-future-surfaces.md) - artifact previews, SMS links, task progress, media, and cross-surface representation ideas.
- [Working Protocol](working-protocol.md) - checks, handoff rules, memory protocol, and coordination guidance.

## Current Build Position

The current forward plan is `mvp-build/second-half-plan/`. Phases 1-5 below are already `source-wired` in code. Live provider/runtime/operator proof is still `pending` for most of them. Do not fabricate acceptance claims.

Relevant current status, with `mvp-build/CODEGRAPH.md` as authority:

- **Phase 1 - preserve/close live gate:** `source-wired/static-green`; live browser/runtime proof is blocked until a usable model/provider path exists.
- **Phase 2 - owner Work Surface redesign:** `source-wired`. The web Work Surface is a multi-region employee desk with Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, Settings-lite, and a preview pane.
- **Phase 3 - SMS ambient inbox and signed mobile previews:** `source-wired`. A signed, scoped, expiring preview/action link mints a `WorkResource` and renders it at `/agent/[employeeId]/review`.
- **Phase 4 - tool-agnostic capability/materialization layer:** `source-wired`. `SurfaceEnvelope`, `CapabilityGraphNode`, `WorkResource`/`WorkAction`, and a Manager capability registry exist and are exposed via Manager MCP resources. More web UI should move toward these generic contracts.
- **Phase 5 - trial ops/admin/billing:** `source-wired`. An internal `/admin` console exists for dashboard, accounts, provisioning, repairs, providers, billing scaffold, employee support actions, readiness, and materialization inspection.
- **MCP-UI generated cards:** source-wired. The agent can emit typed `table`/`schedule`/`diff`/`form` views that Manager compiles into a sandboxed `ui://` resource rendered in the Work Surface.
- **Connector Center and resurfacing:** source-wired. `ConnectionSurface` and `ResurfaceItem` support generic connected-business cards and attention surfaces.

For UI work, this means:

- The backend shape is good enough to design against.
- The current visual/component work is not final.
- New work should reuse `WorkResource`/`WorkAction` and materialization contracts instead of creating per-surface shapes.
- UI polish should cover the web desk, signed Review page, artifact/document rendering, generated cards, and Admin console.

## Surface Inventory

Design and implementation should account for these current surfaces:

- `apps/web/app/page.tsx` - root/front door.
- `apps/web/app/create-ai-employee/page.tsx` - create employee flow.
- `apps/web/app/claim/` - claim flow after SMS/link verification.
- `apps/web/app/login/page.tsx` - owner login.
- `apps/web/app/agent/[employeeId]/page.tsx` and `AgentClient.tsx` - authenticated employee Work Surface.
- `apps/web/app/agent/[employeeId]/review/` - signed mobile Review page for SMS links.
- `apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts` - output/artifact route.
- `apps/web/app/admin/` - internal operator Admin console.
- `apps/web/app/agent/[employeeId]/components/McpUiResource.tsx` and `apps/manager/src/lib/ui-resources.ts` - generated card rendering.

Important shared contracts:

- `packages/shared/src/resource-payload.ts`.
- `packages/shared/src/work-events.ts`.
- `packages/shared/src/preview-links.ts`.
- `packages/shared/src/materialization.ts`.
- `packages/shared/src/admin.ts`.
- `packages/shared/src/routes.ts`.

## UI-Only Fixture Mode

UI contributors do not need Docker, Supabase, Manager, Hermes, or model/provider credentials just to work on the web client.

From `mvp-build/`:

```bash
npm run ui:dev          # fixture-backed Next dev server on :3000
npm run ui:browser      # starts fixture server on :3200 and opens a headed browser
npm run ui:test         # headless Playwright smoke against fixture data
npm run ui:test:headed  # same smoke in a headed browser
```

Fixture mode sets `NEXT_PUBLIC_AMTECH_UI_FIXTURES=1`. It uses the real `AgentClient` and representative local `ResourcePayload` data: approvals, messages, jobs, outputs, media/report artifacts, connector states, abilities, task progress, resurfacing, and activity. It also simulates chat replies and approval resolution locally.

This is for UI development and UI-only smoke tests. It is not provider/runtime acceptance and does not prove Manager, Hermes, Docker, Supabase, Gmail, Stripe, Twilio, or the model path.

## Safe Scope

Good areas for an independent UI agent:

- Visual hierarchy and layout for every current surface.
- Responsive/mobile behavior for the employee desk, signed Review page, and preview pane.
- Artifact/document/media preview quality.
- Better empty, loading, degraded, failed, completed, and permission states.
- Owner language for tasks, abilities, connectors, outputs, proof, receipts, and activity.
- Component extraction from large files when it reduces complexity.
- A real design system and reusable surface primitives.
- MCP-UI generated card styling and iframe interaction polish.
- Admin console UX, while keeping it operator-facing and redacted.
- UI-only fixtures, screenshots, and browser checks.

Coordinate before changing:

- Manager API contracts.
- Database migrations.
- Auth/session behavior.
- Provider secrets or webhook semantics.
- Approval semantics.
- Runtime delivery.
- Shared contract shapes if backend support is required.
- Artifact/signed-link security.
- Admin platform-role gating, support-reason audit, or redaction.

## Implementation Protocol

1. Build a current surface inventory from source and `data-catalog.md`.
2. Define the cross-surface component/visual language before polishing isolated cards.
3. Implement in slices that leave the app runnable after each slice.
4. Prefer shared renderers for work resources, actions, proof, status, artifacts, and generated views.
5. Keep owner-facing copy business-native.
6. Use fixture mode for visual iteration and screenshots.
7. Run practical checks before handoff.
8. Write a dated memory handoff after substantial multi-file work or major design decisions.

Useful commands from `mvp-build/`:

```bash
npm run ui:dev
npm run ui:browser
npm run ui:test
npm run ui:test:headed
npm run web:dev
npm run typecheck
npm run test:unit
npm run lint
npm run build
```

## Wiki Versus MVP Build

Use `wiki/` for product strategy, market context, principles, architecture rationale, and research. Use `mvp-build/` for actual implementation state, source files, tests, scripts, and current handoffs.

If a wiki vision and the source differ, do not assume the vision is already built. Check `mvp-build/CODEGRAPH.md`, `mvp-build/memory/MEMORY.md`, the newest memory note, and the source.

## Files In This Packet

- `README.md` - this overview, master prompt, and design-system seed.
- `collaborator-meta-prompt.md` - short email-ready note for handing this packet to a collaborator.
- `graphic-design-social-intern-handoff.md` - concise, stricter brand/product brief for graphic design and social media support.
- `product-grounding.md` - product power, owner mental model, and wiki versus `mvp-build/`.
- `data-catalog.md` - full inventory of data shapes, surfaces, routes, and artifact/preview plumbing.
- `current-ui-map.md` - source map and current implementation notes.
- `research-and-principles.md` - research index and design/product principles.
- `experiments-and-future-surfaces.md` - forward UI backlog and near-term preview priorities.
- `working-protocol.md` - checks, handoff rules, memory protocol, and coordination guidance.
