# Current UI Map

Status: active

This document maps the current UI implementation so a UI contributor can work without rediscovering the whole backend.

## Source Roots

Main web app:

- `apps/web/app/page.tsx` — root route into the product.
- `apps/web/app/create-ai-employee/page.tsx` — web front door for creating an employee.
- `apps/web/app/claim/` — claim flow after SMS/link verification.
- `apps/web/app/login/page.tsx` — owner login surface.
- `apps/web/app/agent/[employeeId]/page.tsx` — authenticated employee Work Surface route.
- `apps/web/app/agent/[employeeId]/AgentClient.tsx` — main Work Surface client.
- `apps/web/app/api/*` — browser-facing API route proxies to Manager.

Work Surface files:

- `apps/web/app/agent/[employeeId]/AgentClient.tsx` — current shell, navigation, views, composer, preview pane, inline CSS.
- `apps/web/app/agent/[employeeId]/surface-types.ts` — web-facing exports for the shared resource payload.
- `apps/web/app/agent/[employeeId]/surface.tokens.ts` — small current token object used by older Work Surface components, and by the Review surface (see below).
- `apps/web/app/agent/[employeeId]/fixtures.ts` — representative local `ResourcePayload` for UI-only fixture mode.
- `apps/web/app/agent/[employeeId]/lib/surface-model.ts` — nav counts, default preview selection, connector labels, status tones.
- `apps/web/app/agent/[employeeId]/lib/group-by-job.ts` — groups artifacts/events/invoices/reminders into job folders.
- `apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts` — output route for stored files and safe HTML artifact fallback. See "Artifact/Output Route" below and `data-catalog.md` §5.

Reusable Work Surface components:

- `components/DailyBrief.tsx` — summary card for current approvals/reminders/work/invoices.
- `components/WorkCard.tsx` — typed work event card for notify/question/review moves.
- `components/ApprovalCard.tsx` — approval decision card.
- `components/JobFolder.tsx` — grouped job timeline/folder.
- `components/Receipt.tsx` — proof/receipt rendering for work descriptors.
- `components/McpUiResource.tsx` — sandboxed MCP-UI resource renderer with postMessage intents. See "MCP-UI Generative Cards" below.
- `components/deliverables/index.tsx` — deliverable-type renderers used by `WorkCard`.

Signed mobile Review surface (Phase 3, source-wired):

- `apps/web/app/agent/[employeeId]/review/page.tsx` — server component: resolves the signed token via `/manager/preview/resolve` into a `WorkResource`, passes it (or an error state) to the client.
- `apps/web/app/agent/[employeeId]/review/ReviewClient.tsx` — renders one `WorkResource`: title/subtitle/amount/recipient/summary/fields header, inline `media` (image/video) or `body_html` (sandboxed iframe) body, quiet `receipts` links, and a sticky bottom action bar (approve/reject/respond/view). No owner login — the signed token is the only credential. Uses `surface.tokens.ts`.
- `apps/web/app/api/employee/[employeeId]/preview/action/route.ts` — proxies owner-authenticated preview actions to `/manager/preview/action`.
- This is the mobile-first target for links sent over SMS; see `data-catalog.md` §3 for the full `WorkResource` shape and §8 for the route map.

Admin console (Phase 5, source-wired, operator-facing not owner-facing):

- `apps/web/app/admin/page.tsx`, `apps/web/app/admin/AdminClient.tsx` — internal console with views: dashboard, accounts, provisioning, repairs, providers, billing, plus an employee detail panel (readiness checks, support actions) and a materialization inspector.
- `apps/web/app/api/admin/[...path]/route.ts` — proxy to Manager `/manager/admin/*`; requires `AMTECH_ADMIN_BROWSER_TOKEN` in production before attaching an operator identity; Manager still enforces platform role + support reason.
- Distinct design/vocabulary target from the owner Work Surface — technical proof IDs and health states are appropriate here; raw secrets/provider payloads/stack traces are never appropriate anywhere. See `data-catalog.md` §7.

MCP-UI generative cards (source-wired, part of Phase 5's generative-UI slice):

- `apps/manager/src/lib/ui-resources.ts` — compiles an agent-emitted typed `view` (`table`/`schedule`/`diff`/`form`) into AMTECH-templated HTML wrapped as a real MCP-UI `ui://` resource. The model never emits raw HTML.
- `apps/web/app/agent/[employeeId]/components/McpUiResource.tsx` — renders that resource in a sandboxed `iframe` (`sandbox="allow-scripts"`, no `allow-same-origin`) and relays its `postMessage` intents (`accept`/`accept_all`/`reject`/`respond`) through the same approval/respond handlers as any other action.
- See `data-catalog.md` §6 for the full mechanism and where to improve it (styling in `ui-resources.ts`, iframe behavior in `McpUiResource.tsx`).

Shared contracts that drive UI:

- `packages/shared/src/resource-payload.ts` — Work Surface snapshot contract: account, employee, runtime health, artifacts, approvals, messages, connectors, invoices, reminders, job commitments, work events, abilities, capabilities, surface envelopes, **connection surfaces**, **resurface items**, outputs, tasks. See `data-catalog.md` §2 and §4.5. Note: `Connected` now renders generic `connection_surfaces` cards before raw connector rows, and `Today`/`DailyBrief` compute attention from `resurface_items` — `AgentClient.tsx` (`ConnectionDetails`, `ResurfaceRow`) + `lib/surface-model.ts` (`selectionForResurface`).
- `packages/shared/src/work-events.ts` — `WorkEventDescriptor`, deliverable types (incl. `tool_activity`), move types, acceptance grammar, `WorkView` (table/schedule/diff/form for MCP-UI), SMS rendering helper (grammar-aware, carries a signed `preview_url`), schema-to-form helper.
- `packages/shared/src/preview-links.ts` — the `WorkResource`/`WorkAction` contract every preview surface renders, plus `defaultActionsFor`/`actionScopeFor` helpers. See `data-catalog.md` §3.
- `packages/shared/src/materialization.ts` — `SurfaceEnvelope`, `RenderHints`, `SafetyEnvelope`, `ProofEnvelope`, `CapabilityGraphNode`, `EmployeeEventStreamEvent`, `MaterializedWork` — the Phase 4 generic materialization contract. See `data-catalog.md` §4.
- `packages/shared/src/admin.ts` — admin/operator contracts (dashboard, account/employee summaries, readiness, support actions). See `data-catalog.md` §7.
- `packages/shared/src/tool-schemas.ts` — Manager tool schemas; important for future generic forms/renderers.
- `packages/shared/src/routes.ts` — route builders, including `artifactRoute`, `reviewRoute`, and `MANAGER_API.admin.*`. See `data-catalog.md` §8.

Manager read model and routes:

- `apps/manager/src/lib/employee-stream.ts` — builds the resource snapshot consumed by the Work Surface and returns SSE deltas.
- `apps/manager/src/lib/preview-render.ts` — builds a `WorkResource` for a signed preview link from the same read model as the web desk (kind-agnostic artifacts: stored file / payload HTML / media).
- `apps/manager/src/lib/materialization.ts` — Phase 4 generic materialization projection into `SurfaceEnvelope`/`WorkResource`/`WorkAction` lists.
- `apps/manager/src/lib/capability-registry.ts` — builds the owner-language capability graph; owns the raw-tool-name → owner-safe label mapping.
- `apps/manager/src/lib/admin.ts` — admin read/action layer: platform-role checks, redaction, dashboard/account/employee/readiness views, support actions.
- `apps/manager/src/server.ts` — routes for resources, events, messages, approvals, artifact resolve, preview resolve/action, admin, Manager MCP, and tools.
- `apps/manager/src/lib/artifact-view.ts` — safe generic HTML renderer for structured artifact payloads (zero per-artifact-kind code).
- `apps/manager/src/lib/artifacts.ts` — Supabase Storage upload/signed-URL helpers for stored artifact files.
- `apps/manager/src/lib/ui-resources.ts` — compiles agent-emitted typed views into MCP-UI `ui://` resources.

## Current Work Surface Shape

`AgentClient.tsx` currently renders:

- left rail with employee identity, navigation, and runtime/stream health;
- center panel with view-specific content;
- right preview pane for selected work/resource;
- views: Today, Chat, Jobs, Tasks, Outputs, Connected, Abilities, Activity, Settings-lite;
- persisted conversation from `employee_messages`;
- short-lived optimistic messages while sending;
- EventSource connection to `/api/employee/[employeeId]/events`;
- polling fallback to `/api/employee/[employeeId]/resources`;
- approval resolve calls through `/api/employee/[employeeId]/approval/resolve`;
- owner messages through `/api/employee/[employeeId]/message`;
- artifact/output links through `/agent/[employeeId]/output/[artifactId]`.

The current layout is source-wired, not final. It proves the product shape: persistent employee desk, work views, output library, connected state, ability state, and selected preview.

## Current Styling State

There is no finished design system.

Current styling comes from:

- inline CSS string `WORK_SURFACE_CSS` inside `AgentClient.tsx`;
- `surface.tokens.ts` for older typed cards and deliverable components;
- inline style objects inside components such as `WorkCard.tsx`, `ApprovalCard.tsx`, and `JobFolder.tsx`;
- basic Next.js app-level CSS/layout.

Treat these as utilities and scaffolding. It is fine to consolidate them, replace them, or move toward a cleaner component/style structure. The important part is preserving the product semantics: owner-safe language, preview before risky action, same state rendered across views, and no raw developer vocabulary in owner UI.

Avoid turning this packet into hard visual rules. The app still needs real design taste work.

## Current Data Flow

High-level web path:

```text
browser Work Surface
  -> apps/web/app/api/employee/[employeeId]/*
  -> Manager server routes
  -> buildEmployeeSnapshot / Manager tools / approval resolver / owner turn delivery
  -> Supabase + Hermes runtime + provider connectors
```

Resource snapshot:

```text
Manager tables
  -> apps/manager/src/lib/employee-stream.ts buildEmployeeSnapshot()
  -> ResourcePayload
  -> web AgentClient views + preview pane
```

Current derived fields:

- `employee` — name/status/profile/web route.
- `runtime_health` — latest endpoint/check summary.
- `outputs` — artifacts, invoices, delivered-message receipts.
- `tasks` — approvals, work events, runtime/connector issues, reminders, job commitments.
- `abilities` — current temporary owner-language summary from Manager policy, runtime, and connector state.

These derived fields are Phase 2 groundwork. `capabilities`/`surface_envelopes` (Phase 4) now exist as
the real capability registry/generic materialization contract alongside them — see `data-catalog.md`
§2 and §4 for how the two generations relate and which to prefer in new work.

## UI-Only Fixture Flow

For UI-only work, set `NEXT_PUBLIC_AMTECH_UI_FIXTURES=1` or use the `ui:*` scripts from `mvp-build/package.json`.

```text
browser Work Surface
  -> apps/web/app/agent/[employeeId]/fixtures.ts
  -> AgentClient views + preview pane
```

In fixture mode:

- `AgentClient` does not call `/api/employee/*`;
- heartbeat and EventSource are skipped;
- chat sends are simulated in local React state;
- approval resolve buttons update local state;
- artifact/output links return a fixture HTML preview from the output route;
- Playwright can inspect the real browser UI without Manager, Supabase, Docker, Hermes, Twilio, Gmail, Stripe, or model credentials.

`npm run ui:test` warms `/agent/emp_ui_fixture` before Playwright assertions and saves screenshots at `infra/.local/ui-fixtures/work-surface-desktop.png` and `infra/.local/ui-fixtures/work-surface-mobile.png`.

Fixture mode is representative of the product surface contract, but it is not acceptance proof for runtime/provider/backend behavior.

## What Is Implemented But Still Thin

- Chat history now persists through `employee_messages`, but streaming reply state is still simple.
- SSE exists with reconnect and polling fallback, but browser/runtime proof is pending.
- Jobs group related rows, but customer/job identity is still inferred from current records.
- Outputs list artifacts/invoices/message receipts, but generic non-estimate resource handling is still early.
- Abilities are owner-language summaries; `capabilities` (Phase 4) is the real capability graph but the web Work Surface doesn't fully render from it yet.
- Settings-lite is a status/profile view, not an account/admin control center (that's now the separate Admin console, itself thin — see below).
- Artifact fallback renders safe HTML for structured payloads when no stored file exists.
- The signed Review page (Phase 3) renders `WorkResource` well for approvals/artifacts, but has no thumbnail/poster/OG-image pipeline — `media.url` must already point at a directly-renderable file (see `data-catalog.md` §5.3).
- The Admin console (Phase 5) covers dashboard/accounts/provisioning/repairs/providers/billing-scaffold/employee support actions/readiness, but does not render `WorkResource`/artifact previews inline for operator triage, and billing is a scaffold only (no paywall).
- MCP-UI generative cards render real agent-emitted tables/schedules/diffs/forms, but the compiled HTML/CSS (`ui-resources.ts`) is intentionally minimal — no real design system applied yet.

## Good UI Refactor Boundaries

Good candidates:

- Split `AgentClient.tsx` into view components and layout primitives.
- Extract the inline CSS into a local stylesheet or small style module.
- Normalize status chips, empty states, list rows, preview sections, and shell layout.
- Improve mobile layout for the rail/nav/preview pane.
- Add mock/demo fixtures for UI-only development if clearly separated from acceptance proof.
- Add component or Playwright tests for selected states.
- Build one shared `WorkResource` renderer that `ReviewClient.tsx`, the web preview pane, and (eventually) an admin inline preview all call, instead of three separate ad hoc renderings — see `data-catalog.md` §3 for the target shape.
- Design a real visual system across Work Surface + Review + MCP-UI cards (owner-facing, one language) while keeping Admin visually/vocabulary-distinct (operator-facing).

Use care:

- Changing `ResourcePayload` requires Manager/shared/test updates.
- Changing `WorkResource`/`WorkAction`/`SurfaceEnvelope` requires shared/Manager/test updates across web, Review, and MCP resource consumers.
- Changing approval flows must preserve Manager approval records and auditability.
- Changing output links must preserve signed artifact security.
- Changing copy around connectors/abilities should keep owner language and hide implementation vocabulary.
- Admin console changes must preserve platform-role gating, support-reason audit, and redaction — never relax these for UI convenience.

## Useful Commands

From `mvp-build/`:

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

For the full local runtime/browser gate, follow `infra/scripts/local/test/` and current memory notes. Do not fake live proof if Docker, model provider, bridge, or credentials are unavailable.
