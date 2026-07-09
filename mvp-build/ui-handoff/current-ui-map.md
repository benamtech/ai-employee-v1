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
- `apps/web/app/agent/[employeeId]/surface.tokens.ts` — small current token object used by older Work Surface components.
- `apps/web/app/agent/[employeeId]/lib/surface-model.ts` — nav counts, default preview selection, connector labels, status tones.
- `apps/web/app/agent/[employeeId]/lib/group-by-job.ts` — groups artifacts/events/invoices/reminders into job folders.
- `apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts` — output route for stored files and safe HTML artifact fallback.

Reusable Work Surface components:

- `components/DailyBrief.tsx` — summary card for current approvals/reminders/work/invoices.
- `components/WorkCard.tsx` — typed work event card for notify/question/review moves.
- `components/ApprovalCard.tsx` — approval decision card.
- `components/JobFolder.tsx` — grouped job timeline/folder.
- `components/Receipt.tsx` — proof/receipt rendering for work descriptors.
- `components/McpUiResource.tsx` — sandboxed MCP-UI resource renderer with postMessage intents.
- `components/deliverables/index.tsx` — deliverable-type renderers used by `WorkCard`.

Shared contracts that drive UI:

- `packages/shared/src/resource-payload.ts` — Work Surface snapshot contract: account, employee, runtime health, artifacts, approvals, messages, connectors, invoices, reminders, job commitments, work events, abilities, outputs, tasks.
- `packages/shared/src/work-events.ts` — `WorkEventDescriptor`, deliverable types, move types, acceptance grammar, SMS rendering helper, schema-to-form helper.
- `packages/shared/src/tool-schemas.ts` — Manager tool schemas; important for future generic forms/renderers.
- `packages/shared/src/routes.ts` — route builders.

Manager read model and routes:

- `apps/manager/src/lib/employee-stream.ts` — builds the resource snapshot consumed by the Work Surface and returns SSE deltas.
- `apps/manager/src/server.ts` — routes for resources, events, messages, approvals, artifact resolve, Manager MCP, and tools.
- `apps/manager/src/lib/artifact-view.ts` — safe generic HTML renderer for structured artifact payloads.

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

These derived fields are Phase 2 groundwork. Phase 4 should replace the temporary ability derivation with a real capability registry/cache.

## What Is Implemented But Still Thin

- Chat history now persists through `employee_messages`, but streaming reply state is still simple.
- SSE exists with reconnect and polling fallback, but browser/runtime proof is pending.
- Jobs group related rows, but customer/job identity is still inferred from current records.
- Outputs list artifacts/invoices/message receipts, but generic non-estimate resource handling is still early.
- Abilities are owner-language summaries, not yet a true capability graph.
- Settings-lite is a status/profile view, not an account/admin control center.
- Artifact fallback renders safe HTML for structured payloads when no stored file exists.

## Good UI Refactor Boundaries

Good candidates:

- Split `AgentClient.tsx` into view components and layout primitives.
- Extract the inline CSS into a local stylesheet or small style module.
- Normalize status chips, empty states, list rows, preview sections, and shell layout.
- Improve mobile layout for the rail/nav/preview pane.
- Add mock/demo fixtures for UI-only development if clearly separated from acceptance proof.
- Add component or Playwright tests for selected states.

Use care:

- Changing `ResourcePayload` requires Manager/shared/test updates.
- Changing approval flows must preserve Manager approval records and auditability.
- Changing output links must preserve signed artifact security.
- Changing copy around connectors/abilities should keep owner language and hide implementation vocabulary.

## Useful Commands

From `mvp-build/`:

```bash
npm run web:dev
npm run typecheck
npm run test:unit
npm run lint
npm run build
```

For the full local runtime/browser gate, follow `infra/scripts/local/test/` and current memory notes. Do not fake live proof if Docker, model provider, bridge, or credentials are unavailable.
