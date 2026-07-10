# Data Catalog: Everything Available To The UI

Status: active

Purpose: one place that inventories every data shape, route, and rendering primitive the UI can draw
on today, across every surface (web Work Surface, signed mobile review, admin console, MCP-UI
generative cards, artifact/output links). Read this after `product-grounding.md` and alongside
`current-ui-map.md`. This is the reference for "what information do I actually have to design with,"
not a design system.

All shapes below are real, shipped TypeScript in `packages/shared/src/*` and `apps/manager/src/lib/*` —
not aspirational. Where something is still planned, it says so explicitly.

## 1. The Three Layers Of Data

```text
Layer 1 — Raw rows (Manager/Supabase tables)
  ArtifactRow, ApprovalRow, MessageRow, ConnectorRow, StripeInvoiceRow,
  ReminderRow, JobCommitmentRow, WorkEventRow
    -> owner-safe, but still close to storage shape

Layer 2 — Work Surface read model (packages/shared/src/resource-payload.ts)
  ResourcePayload: Layer 1 rows + derived employee/runtime_health/abilities/
  outputs/tasks + Phase 4 capabilities/surface_envelopes
    -> what apps/manager/src/lib/employee-stream.ts buildEmployeeSnapshot()
       actually returns; the web Work Surface's single source of truth

Layer 3 — Surface-agnostic materialization (packages/shared/src/materialization.ts,
  packages/shared/src/preview-links.ts)
  SurfaceEnvelope (source facts + safety + proof + render hints + resource + actions)
  WorkResource / WorkAction (the one shape review/SMS/web/admin can all render)
  CapabilityGraphNode (the "abilities" graph, typed)
    -> what a signed preview link, the MCP `resources/read` surface, and any future
       renderer (admin inspector, desktop, voice) should render from
```

Rule of thumb: if you're building a new renderer (a card, a preview, an admin row), reach for the
narrowest layer that has everything you need. Prefer `WorkResource`/`SurfaceEnvelope` over raw rows —
that's the contract intentionally designed to be surface-agnostic.

## 2. `ResourcePayload` — The Web Work Surface Read Model

Source: `packages/shared/src/resource-payload.ts`. Built by
`apps/manager/src/lib/employee-stream.ts` `buildEmployeeSnapshot()`. Consumed by
`apps/web/app/agent/[employeeId]/AgentClient.tsx` and its views/lib helpers.

| Field | Type | What it is | UI surfaces it |
|---|---|---|---|
| `account_id`, `employee_id` | string | identity | left rail, all views |
| `employee` | `EmployeeSummary` | name/status/profile/web route | Today, left rail header |
| `runtime_health` | `RuntimeHealthSummary \| null` | endpoint/backend/API/SMS-number status | left rail health chip, Settings |
| `artifacts` | `ArtifactRow[]` | estimates/documents; `kind`, `mime_type`, `storage_ref`, `payload` | Outputs, Jobs, preview pane |
| `approvals` | `ApprovalRow[]` | pending owner decisions; `action_key`, `summary`, `risk_level`, `refs`, `expires_at` | Today, Tasks, preview pane |
| `messages` | `MessageRow[]` | persisted chat turns; `direction`, `body`, `status`, `provider_id` | Chat |
| `connectors` | `ConnectorRow[]` | Gmail/Stripe/etc connection state; `connector_key`, `provider`, `status`, `external_email`, `last_error` | Connected |
| `stripe_invoices` | `StripeInvoiceRow[]` | deposit invoices; `deposit_amount`, `hosted_invoice_url`, `status` | Jobs, Outputs |
| `reminders` | `ReminderRow[]` | internal follow-ups; `scheduled_at`, `channel`, `status`, `sent_at` | Tasks, Jobs |
| `job_commitments` | `JobCommitmentRow[]` | scheduled job dates/windows tied to an estimate | Jobs |
| `work_events` | `WorkEventRow[]` | typed events (Gmail reply, Stripe paid, etc) carrying an optional `work_event_descriptor` | Activity, Today |
| `abilities` | `AbilitySummary[]` (optional) | legacy owner-language ability list: `category`, `status`, `summary`, `source` | Abilities (being superseded by `capabilities`) |
| `capabilities` | `CapabilityGraphNode[]` (optional, Phase 4) | the real capability graph — see §4 | Abilities (target shape) |
| `surface_envelopes` | `SurfaceEnvelope[]` (optional, Phase 4) | generic materialized work items — see §4 | future generic Activity/Outputs rendering |
| `outputs` | `WorkOutput[]` (optional) | derived, UI-shaped list: `type` (artifact/invoice/message/generic), `title`, `status`, `href`, `artifact_id`, `summary` | Outputs list/library |
| `tasks` | `WorkTask[]` (optional) | derived, UI-shaped list: `type` (approval/question/reminder/job/connector/runtime/work), `status` (`needs_you`/`in_progress`/`blocked`/`done`/`failed`/`scheduled`), `target_id` | Today, Tasks, Jobs |

Notes for UI work:

- `outputs` and `tasks` are the fields most view components should prefer — they are already
  UI-shaped and owner-language. Raw `artifacts`/`approvals`/`work_events` are there for grouping
  (see `lib/group-by-job.ts`) and for building richer preview panes, not for primary list rendering.
- `abilities` is legacy; `capabilities` is the Phase 4 replacement and carries proof/trust/status
  fields the old shape didn't have. Prefer `capabilities` when both are present; fall back to
  `abilities`. Neither should show a raw Manager tool name — see §4's capability labeling note.
- `ArtifactRow.payload` is a small structured object (`customer_name`, `job_description`,
  `recommended_total`) used for list previews before a full render; the full render for a
  no-file-yet artifact comes from the artifact/output route (§5), not from this field directly.

## 3. `WorkResource` / `WorkAction` — The One Shape Every Preview Renders

Source: `packages/shared/src/preview-links.ts`. Built for a given resource by
`apps/manager/src/lib/preview-render.ts` `buildWorkResource()` (over the same
`buildEmployeeSnapshot`). Rendered today by the signed mobile Review surface
(`apps/web/app/agent/[employeeId]/review/ReviewClient.tsx`); designed so the web desk's preview pane,
SMS unfurls, and admin inspection can render the same shape later.

```ts
interface WorkResource {
  resource_type: "approval" | "artifact" | "work_event" | "task" | "connector" | "job";
  resource_id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  fields?: { label: string; value: string }[];   // key/value rows
  amount?: string;                                // pre-formatted, e.g. "$4,200.00"
  recipient?: string;
  risk?: "low" | "medium" | "high";
  body_kind?: "document" | "table" | "media" | "structured" | "text";
  body_html?: string;                             // escaped, self-contained — see §5
  open_url?: string;                              // signed URL to the underlying file/media
  media?: { url?: string; kind?: "image" | "video" | "gallery"; caption?: string };
  actions: WorkAction[];                          // approve/reject/respond/acknowledge/edit/view
  receipts?: { label: string; value: string }[];  // quiet proof links, e.g. "View sent email"
  expired?: boolean;
}

interface WorkAction {
  action: "approve" | "reject" | "respond" | "acknowledge" | "edit" | "view";
  label: string;
  style?: "primary" | "danger" | "default";
  gated?: boolean; // true = resolves a money/customer-facing/dangerous approval
}
```

What this buys a UI contributor: a card, a mobile page, an admin row, and (eventually) an SMS unfurl
can all be built as one renderer function that switches on `body_kind` and prints `fields`/`amount`/
`media`/`body_html`/`receipts`/`actions`. `defaultActionsFor()` and `actionScopeFor()` (same file) are
pure helpers that compute the right action set for a resource type/deliverable — reuse them instead of
hand-rolling action lists in a new surface.

`ReviewClient.tsx` is the reference implementation: it renders `amount`/`recipient`/`summary`/`fields`
as a document header, `media` as an `<img>`/`<video>`, `body_html` in a sandboxed `srcDoc` iframe,
`receipts` as quiet links, and `actions` as a sticky bottom action bar (approve/reject inline, respond
opens a reply textarea, `view` with `open_url` is a plain link). Any new WorkResource-consuming surface
should start by copying this switch, not reinventing it.

## 4. Phase 4 Materialization — `SurfaceEnvelope` / `CapabilityGraphNode`

Source: `packages/shared/src/materialization.ts`. Built by
`apps/manager/src/lib/materialization.ts` (envelopes) and
`apps/manager/src/lib/capability-registry.ts` (capability graph). Exposed read-only over Manager MCP
`resources/list`/`resources/read` (`apps/manager/src/lib/mcp-server.ts`) as well as folded into
`ResourcePayload.capabilities`/`surface_envelopes`. This is source-wired but not yet the primary path
the web Work Surface renders from — today's Outputs/Tasks/Abilities views mostly use the
`ResourcePayload` derived fields directly. Treat this layer as the forward contract for any new
generic renderer.

```ts
interface SurfaceEnvelope {
  id: string;
  kind: "message" | "artifact" | "approval" | "work_event" | "connector" | "reminder"
      | "invoice" | "runtime_health" | "tool_activity" | "task" | "output";
  title: string; summary?: string; status?: string; created_at?: string | null;
  render_hints: { tier: "native_card" | "mcp_ui" | "generic"; component?: string;
                  priority?: "low" | "normal" | "high"; body_kind?: WorkResource["body_kind"] };
  safety: { trust_level: "native_manager" | "manager_mcp" | "runtime" | "connector" | "derived";
            owner_safe: boolean; redacted: boolean; requires_approval: boolean;
            leaves_business?: boolean; money_involved?: boolean };
  proof: { run_id?, audit_id?, artifact_id?, approval_id?, inbound_event_id?,
           preview_link_id?, delivery_decision_id?, source_table?, source_id? };
  resource?: WorkResource;
  actions?: WorkAction[];
}

interface CapabilityGraphNode {
  key: string; label: string; summary: string;
  category: "communication" | "money" | "office" | "documents" | "automation" | "research" | "system";
  status: "ready" | "needs_connection" | "needs_info" | "degraded" | "policy_gated" | "unavailable";
  setup_requirement?: string | null;
  trust_level: SafetyEnvelope["trust_level"];
  can_run_now: boolean;
  sources: Array<"manager_tool" | "manager_mcp" | "hermes" | "connector" | "runtime_health" | "entitlement" | "policy">;
  proof: ProofEnvelope;
}
```

`render_hints.tier` is the key field for a UI contributor: `native_card` means the existing typed
components (`WorkCard`, `ApprovalCard`, `JobFolder`, deliverable renderers) should handle it;
`mcp_ui` means it should render via `McpUiResource` (§6); `generic` means fall back to the
`WorkResource`/`SurfaceEnvelope` generic switch (§3). Don't hardcode per-kind branching in a new
component when `render_hints` already tells you which renderer family to use.

`capability-registry.ts` maps raw Manager tool names to owner-safe `label`/`summary` — never surface a
raw snake_case tool name in owner UI; if you add a new capability source, add its label mapping there,
not inline in a component.

## 5. Artifact Links And Preview Images — The Concrete Plumbing

This is the mechanism behind every "open the estimate," "view the report," "see the photo" link in
every surface.

### 5.1 Two kinds of artifact

- **Stored file** (`ArtifactRow.storage_ref` set): a real file in Supabase Storage (PDF today; the
  contract is kind-agnostic so images/other files fit the same path). Resolving it returns a
  short-lived signed Storage URL (`apps/manager/src/lib/artifacts.ts` `createArtifactStorageSignedUrl`,
  TTL from `ARTIFACT_STORAGE_SIGNED_URL_SECONDS`, capped at 60 min) and the web route redirects to it.
- **Payload-only artifact** (no `storage_ref` yet — e.g. an estimate the employee just drafted before
  a PDF exists): resolved into **generated owner-safe HTML** from the artifact's structured `payload`,
  with zero per-artifact-kind code — `apps/manager/src/lib/artifact-view.ts` `renderArtifactHtml()`.
  Arrays of objects become tables, scalars become key/value rows, nested objects become sections, money
  keys get `$`/2-decimal formatting, everything is HTML-escaped. This is the same "type the work,
  let the renderer render it" principle as `formViewFromJsonSchema` and the MCP-UI compiler (§6) —
  the model fills a payload; the renderer is deterministic and can never be tricked into injecting
  markup.

### 5.2 The route and its three outcomes

`apps/web/app/agent/[employeeId]/output/[artifactId]/route.ts` → `POST /manager/artifacts/:employeeId/:artifactId/resolve`:

1. Manager returns `{ html }` → route serves it directly with a locked-down CSP
   (`default-src 'none'; frame-ancestors 'self'`) — the payload-only path (§5.1).
2. Manager returns `{ signed_url }` → route 302-redirects to Supabase Storage — the stored-file path.
3. Neither → route surfaces the Manager error JSON with Manager's status code.

Auth for this route is dual: an owner session cookie (`amtech_owner_session`) OR a signed token query
param (`?t=...`) — the same route serves both the logged-in Work Surface link and a signed SMS/email
link to the same artifact, scoped by whichever credential is present.

In **fixture mode** (`NEXT_PUBLIC_AMTECH_UI_FIXTURES=1`), this route never calls Manager — it returns
a local fixture HTML page whose content varies by `artifactId` substring (`"before"` → a before/after
media grid; `"report"` → a table; anything else → an estimate line-item table). Use this to design
document/table/media artifact previews without any backend.

### 5.3 Preview images / media today vs. planned

- **Today, real:** `WorkResource.media` (`§3`) — a signed `url` + `kind: "image" | "video" | "gallery"`
  + `caption` — renders as a plain `<img>`/`<video>` in the Review surface. There is no thumbnail/poster
  generation pipeline yet; `media.url` is expected to already point at a directly-renderable image or
  video file.
- **Today, real:** `WorkResource.body_html` — the same `artifact-view.ts` HTML, embedded via a
  sandboxed (`sandbox=""`, no scripts) `srcDoc` iframe in the Review surface, for a "document" body.
- **Planned, not built:** signed-link Open Graph preview images, PDF first-page thumbnails, video
  poster frames, website screenshots, and any preview-metadata cache (title/subtitle/thumbnail/
  expires_at) described in `experiments-and-future-surfaces.md` §"Preview Media Over SMS". If you
  build these, they should populate `WorkResource.media`/`open_url`, not a new parallel field.

### 5.4 Where artifact/media links surface

| Surface | How it links to an artifact/preview |
|---|---|
| Web Work Surface preview pane | `href`/`artifact_id` on a `WorkOutput`, or a work card's deliverable, points at `artifactRoute()` |
| Signed mobile Review | `WorkResource.open_url` (view action) and `media`/`body_html` render inline |
| SMS | `work-events.ts` grammar-aware rendering embeds a signed `preview_url` (→ the Review route) — SMS itself carries no image, only the link |
| Admin console | Same artifact rows, redacted; admin does not yet render `body_html`/`media` inline (see §7) |
| MCP-UI card | Renders its own compiled HTML (tables/schedules/diffs/forms), not artifact files — see §6 |

## 6. MCP-UI Generative Cards — What The Agent Can Hand The UI Directly

Source: `apps/manager/src/lib/ui-resources.ts` (compiler) +
`apps/web/app/agent/[employeeId]/components/McpUiResource.tsx` (renderer). Source-wired
(2026-07-04/05), part of Phase 5's generative-UI slice.

The agent emits a `view` on a work descriptor (`table`, `schedule`, `diff`, or `form` — typed in
`packages/shared/src/work-events.ts` `WorkView`). Manager compiles that typed view into a real MCP-UI
`ui://` resource — **AMTECH-templated HTML, never raw model HTML** — via `@mcp-ui/server`
`createUIResource`. The web Work Surface renders it in a sandboxed `<iframe sandbox="allow-scripts"
srcDoc=...>` with no `allow-same-origin` (opaque origin: no parent/cookie/network access). Every button
in that iframe posts a typed `intent` (`accept` / `accept_all` / `reject` / `respond`) back via
`postMessage`; the host validates the message source/shape and routes it through the **same**
approval/respond handlers as any other action — an MCP-UI card can never bypass the approval gate.

For a UI contributor, this means: if you want an agent-emitted table/schedule/diff/form to look better,
you likely want to improve `ui-resources.ts`'s `BASE_STYLE`/`tableHtml`/`scheduleHtml`/`diffHtml`/
`formHtml` (still very plain inline HTML/CSS today) and/or `McpUiResource.tsx`'s iframe sizing/loading
state — not add a new one-off React component per view kind.

## 7. Admin Console — Operator-Facing Data (Not Owner-Facing)

Source: `packages/shared/src/admin.ts` (contracts) + `apps/manager/src/lib/admin.ts` (read/action
layer) + `apps/web/app/admin/AdminClient.tsx` (console). Source-wired (2026-07-10), Phase 5.
Proxied browser→Manager via `apps/web/app/api/admin/[...path]/route.ts`, gated by
`AMTECH_ADMIN_BROWSER_TOKEN` in production plus a DB-backed platform role
(`platform_owner` / `platform_operator` / `support_readonly` / `billing_operator` /
`security_reviewer`) and a required support reason on every access.

Current views (`AdminClient.tsx` `View` type): `dashboard`, `accounts`, `provisioning`, `repairs`,
`providers`, `billing`.

| Contract | What it carries |
|---|---|
| `AdminDashboard` | account summaries (`account_state`, `billing_state`, `health`, counts) + platform totals + `readiness_warnings[]` |
| `AdminAccountSummary` | per-account health/billing/employee/approval/repair counts |
| `AdminEmployeeSummary` | per-employee runtime/connector health, `needs_reprovision`, pending approvals/repairs |
| `AdminReadinessReport` | named `checks[]` (`key`, `label`, `status: pass\|fail\|warn\|unknown`, `detail`, `proof`) — the Phase 4/5/6 gate list |
| `AdminSupportAction` / `AdminSupportActionInput` / `AdminSupportActionResult` | suspend/resume/disable employee, mark-needs-reprovision, rotate/revoke MCP credential, rerun runtime health, redeliver event, suppress event source — every action requires a `reason` and returns `changed_resources`, `proof`, `audit_id` |

This is a genuinely different audience than the owner Work Surface: admin may show technical
proof IDs, health states, and provenance the owner should never see, but it still must never show raw
secrets, provider payloads, stack traces, or credential material — `admin.ts`'s redaction layer is the
enforcement point; extend it rather than adding a new ad hoc redaction path if you add a new admin
view. Admin does not currently render `WorkResource`/artifact previews inline (§5.4) — that's an open
improvement area if operator triage needs to see the actual document/photo, not just its metadata.

## 8. Route Map (What Calls What)

From `packages/shared/src/routes.ts`:

| Route builder | Path shape | Auth | Used by |
|---|---|---|---|
| `employeeWebRoute` | `/agent/:employeeId` | owner session | Work Surface |
| `artifactRoute` | `/agent/:employeeId/output/:artifactId` | owner session OR signed `?t=` token | artifact/output links (§5) |
| `reviewRoute` | `/agent/:employeeId/review?t=...` | signed token only, no owner session | SMS/signed mobile preview (§3) |
| `MANAGER_API.artifactResolve` | `/manager/artifacts/:employeeId/:artifactId/resolve` | proxied | artifact route backend call |
| `MANAGER_API.previewResolve` | `/manager/preview/resolve` | token-only | Review page load |
| `MANAGER_API.previewAction` | `/manager/preview/action` | token-only, owner-authenticated for high-risk | Review page actions |
| `MANAGER_API.employeeResources` | `/manager/employee/:employeeId/resources` | owner session | initial `ResourcePayload` load / poll fallback |
| `MANAGER_API.employeeStream` | `/manager/employee/:employeeId/stream` | owner session | SSE updates |
| `MANAGER_API.admin.*` | `/manager/admin/...` | Manager internal token + platform role | Admin console (§7) |

## 9. Fixture Mode Coverage — What You Can Design Against With No Backend

`NEXT_PUBLIC_AMTECH_UI_FIXTURES=1` (or `npm run ui:dev` / `ui:browser` / `ui:test*`) gives you a real
`ResourcePayload` (`apps/web/app/agent/[employeeId]/fixtures.ts`) covering approvals, messages, jobs,
outputs, media/report artifacts, connector states, abilities, task progress, and activity, plus a
fixture artifact/output HTML response (§5.2) and simulated chat/approval-resolve behavior.

Fixture mode does **not** currently cover: the signed Review surface, the Admin console, or MCP-UI
resource rendering — those still need a live/dev Manager (or new fixture data you add) to exercise.
If you're doing focused design work on Review/Admin/MCP-UI, either extend fixture coverage for that
surface first, or work against a local Manager + Docker/Supabase dev stack per
`working-protocol.md`.

## 10. Summary Table — Surface To Primary Data Shape

| Surface | Primary shape | Renderer entry point |
|---|---|---|
| Web Work Surface | `ResourcePayload` (mostly `outputs`/`tasks`/`abilities`/`capabilities`) | `AgentClient.tsx` |
| Web preview pane | `ResourcePayload` rows + per-type deliverable components | `components/deliverables/index.tsx`, `WorkCard.tsx`, `ApprovalCard.tsx` |
| MCP-UI generative card | `WorkView` → compiled `ui://` HTML | `McpUiResource.tsx` |
| Artifact/output link | stored-file signed URL OR `renderArtifactHtml()` | `output/[artifactId]/route.ts` |
| Signed mobile Review | `WorkResource` | `ReviewClient.tsx` |
| SMS | grammar-aware text + `preview_url` (no rich payload) | `work-events.ts` SMS rendering |
| Admin console | `AdminDashboard` / `AdminAccountSummary` / `AdminEmployeeSummary` / `AdminReadinessReport` | `AdminClient.tsx` |
| Future generic renderer (any new surface) | `SurfaceEnvelope` / `CapabilityGraphNode` | not yet built — this is the intended contract |
