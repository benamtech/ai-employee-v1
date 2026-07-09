# Hermes Surface Research And Materialization Strategy

Status: research addendum for implementation

Date: 2026-07-09

Scope: Hermes Workspace, Hermes WebUI, Nous Hermes Desktop, Hermes Agent docs/runtime, and what AMTECH must build so one AI employee can be consumed through web, SMS, desktop, email, admin, signed previews, and future surfaces without per-tool/per-connector rewrites.

## Executive Thesis

AMTECH should not build "a chat app with some connector forms." It should build the small-business materialization layer over Hermes Agent.

Hermes already has the hard substrate: sessions, profiles, skills, toolsets, MCP, gateway platforms, API server runs, structured stream events, approvals, clarification, cron, memory, files, terminal, browser, media generation, messaging delivery, and a desktop JSON-RPC surface. The missing AMTECH layer is a product grammar that turns all of that into business-native resources:

- work items
- customer requests
- approvals
- artifacts
- tasks
- quotes/estimates/invoices
- connected account status
- follow-ups
- receipts/proof
- risks
- next actions
- money/outbound gates

Every AMTECH surface should consume the same materialized employee state. Web, SMS, a native/desktop client, email, customer-facing links, admin, and future channels should differ only in renderer and interaction affordance, not in business logic.

## Sources Researched

Primary public repos:

- Hermes Agent: https://github.com/NousResearch/hermes-agent
- Hermes Desktop app: https://github.com/NousResearch/hermes-agent/tree/main/apps/desktop
- Hermes Workspace: https://github.com/outsourc-e/hermes-workspace
- Hermes WebUI: https://github.com/nesquena/hermes-webui

Local research clones inspected:

- `/tmp/hermes-agent-research`
- `/tmp/hermes-workspace-research`
- `/tmp/hermes-webui-research`

Hermes Agent docs/code inspected:

- `website/docs/user-guide/desktop.md`
- `website/docs/user-guide/sessions.md`
- `website/docs/reference/toolsets-reference.md`
- `website/docs/reference/tools-reference.md`
- `website/docs/guides/use-mcp-with-hermes.md`
- `apps/desktop/src/hermes.ts`
- `apps/shared/src/json-rpc-gateway.ts`
- `tui_gateway/ws.py`
- `gateway/platforms/api_server.py`
- `gateway/stream_events.py`
- `gateway/stream_dispatch.py`
- `gateway/platforms/base.py`
- `tools/registry.py`
- `tools/tool_result_storage.py`
- `tools/approval.py`
- `tools/clarify_tool.py`
- `tools/send_message_tool.py`
- `gateway/platforms/webhook.py`

Hermes Workspace code inspected:

- `src/components/workspace-shell.tsx`
- `src/components/mobile-tab-bar.tsx`
- `src/hooks/use-swipe-navigation.ts`
- `src/routes/mcp.tsx`
- `src/server/mcp-normalize.ts`
- `src/server/mcp-tools-cache.ts`
- `src/routes/jobs.tsx`
- `src/lib/jobs-api.ts`
- `src/lib/tasks-api.ts`
- `src/server/chat-event-bus.ts`
- `src/lib/gateway-api.ts`

Hermes WebUI code inspected:

- `api/streaming.py`
- `api/session_events.py`
- `api/route_approvals.py`
- `api/gateway_chat.py`
- `api/runtime_adapter.py`
- `api/session_lifecycle.py`
- `api/office_documents.py`
- `api/workspace.py`
- `api/terminal.py`

Hermes Desktop code inspected:

- `apps/desktop/DESIGN.md`
- `apps/desktop/src/app/chat/index.tsx`
- `apps/desktop/src/app/chat/composer/index.tsx`
- `apps/desktop/src/app/chat/composer/queue-panel.tsx`
- `apps/desktop/src/app/chat/right-rail/preview.tsx`
- `apps/desktop/src/app/chat/right-rail/preview-pane.tsx`
- `apps/desktop/src/app/messaging/index.tsx`
- `apps/desktop/src/app/cron/index.tsx`
- `apps/desktop/src/app/skills/index.tsx`
- `apps/shared/src/json-rpc-gateway.ts`

## What Hermes Already Gives Us

Hermes sessions are cross-platform. The docs explicitly frame every conversation from CLI, messaging platforms, email, SMS, webhook, API server, cron, batch, and other sources as a stored session with metadata, full message history, token counts, timestamps, source platform, model config, and parent lineage. That is the exact substrate AMTECH needs for "same employee everywhere."

Hermes toolsets are already platform/session/task configurable. Built-in toolsets include file, terminal, browser, web, memory, skills, cronjob, delegation, session_search, clarify, todo, media, computer_use, project, gateway platform actions, and dynamic MCP/plugin toolsets. AMTECH should not duplicate this as hand-coded connector menus. It should summarize available business capabilities from Hermes toolsets, Manager tools, MCP servers, and account entitlements.

Hermes already has a machine-readable API surface. The API server advertises `/v1/capabilities`, sessions, session messages, session chat streams, `/v1/runs`, run status, run SSE events, approval resolution, stop, models, health, and OpenAI-compatible endpoints. AMTECH should keep Manager as the product control plane but use these Hermes contracts directly instead of inventing per-feature paths.

Hermes has a presentation/event separation. `gateway/stream_events.py` defines typed events such as message chunks, commentary, tool call start/finish, long tool hints, and gateway notices. `gateway/stream_dispatch.py` routes those through platform adapters, and `BasePlatformAdapter` decides whether to stream, edit, collapse, render tool chrome, split messages, send media, or drop presentation-only events. This is the strongest technical signal for AMTECH: one canonical event/resource stream, many renderers.

Hermes approvals and clarification are first-class. Approval state is session-scoped and safety critical; clarification supports structured choices and open-ended responses. AMTECH should map these to owner-safe "approve/send/edit/cancel/answer" primitives across web, SMS, and preview links.

Hermes already persists or spills large tool results. `tool_result_storage.py` writes oversized results to sandbox temp storage and replaces context with a preview plus path reference. AMTECH should add a business artifact layer on top, not rely on raw tool output text as the user-facing record.

Hermes has broad native and optional capabilities. The registry/docs include tools for web/search/browser, file/terminal, memory, skills, session search, delegation, cron, clarify, todo, media generation/analysis, computer use, messaging send/reaction, webhooks, Microsoft Graph, Feishu, Discord, Home Assistant, Spotify, Stripe/payments via optional skills, Shopify/productivity skills, email/agentmail, documents, and dynamic MCP. This is already far beyond estimates.

## What The Three GUI Repos Teach

### Hermes Workspace

Workspace is the "command center" pattern. Its README explicitly positions it as more than chat: chat, files, memory, skills, terminal, jobs, MCP, operations, agent view, swarm/conductor, dashboard, and mobile/PWA in one place.

Patterns AMTECH should adopt:

- persistent shell with a small-business navigation model, not a one-page chat
- mobile-first tab bar with swipe navigation and safe-area handling
- feature gates and graceful unavailable states
- backend probing and cached capability state
- normalized MCP/server/tool payloads with secrets masked
- Jobs/Tasks pages that understand work status outside chat
- live chat event bus and session scoping
- PWA/Tailscale-style remote-friendly operation
- operations dashboard for health, cost, attention, and recovery

Business translation:

- "MCP unavailable" becomes "Needs connection" or "Not included in this plan."
- "Toolset" becomes "Can help with invoices/email/website/ordering."
- "Job" becomes "Work item" with customer, deadline, approval, output, and proof.
- "Operations" becomes internal AMTECH/founder/admin health, not owner-facing infrastructure.

### Hermes WebUI

WebUI is the usability pattern. It is intentionally lightweight, but it contains many owner-grade interaction details that AMTECH currently lacks:

- three-panel layout: sessions/nav, chat, workspace/file browser
- streaming SSE with reconnect
- queued sends while the agent is busy
- edit past user message and regenerate
- retry assistant response
- cancel running task
- tool call cards with args/result snippets
- subagent cards
- reasoning/thinking cards
- approval cards
- context/cost indicator
- session search, pin, archive, projects, tags, duplicate, import/export
- CLI session bridge
- attachments that persist across reloads
- file previews, Office previews, syntax highlighting
- voice input
- profile/model/status controls
- PWA/mobile testing

Business translation:

- queued sends become "Add another instruction while your employee is working."
- retry/regenerate becomes "Try another draft."
- edit past user message becomes "Correct the job details and rerun."
- tool cards become business progress chips, not raw tool logs.
- approval cards become "Review before it sends/spends/changes."
- context/cost becomes owner-safe "working time/cost guardrails" and internal billing/metering.
- profile controls become employee/business/customer context, not developer profiles.

### Hermes Desktop

Desktop is the north-star interface pattern. It uses the same Hermes core as CLI/gateway, launches or connects to a backend, and exposes chat, right-rail previews, file browser, voice, cron, profiles, messaging, skills, settings, command palette, and update flow.

Important implementation patterns:

- shared JSON-RPC/WebSocket client with typed events
- connection states and request timeouts
- `gateway.ready`, `session.info`, `message.start/delta/complete`, `thinking.delta`, `reasoning.delta`, `status.update`, `tool.start/progress/complete/generating`, `clarify.request`, `approval.request`, `secret.request`, `background.complete`, `error`
- token coalescing around 30fps so streams render smoothly
- robust composer: attachments, voice, URL, queued prompts, mid-turn steering, slash/@ completions, draft persistence, history, popout, IME handling
- queue panel with edit/send/delete while busy
- right rail preview tabs with web/file/tool outputs, reload, close, dirty state, console, local server restart
- messaging setup as master/detail with status pills and restart action
- cron/job UI with pause/resume/trigger/delete and output/run viewing
- skills/toolsets/MCP/hub tabs with filter/sort, usage analytics, visible toolset count, optimistic toggles
- design system rule: flat over boxed, tokens over literals, one primitive per concern, no card-in-card

Business translation:

- right rail should render estimates, invoices, website previews, marketing drafts, order carts, forms, task boards, customer threads, emails, proofs, and signed previews.
- messaging setup becomes "Where can your employee talk?" with connected/needs attention states.
- cron becomes "Recurring work" such as weekly follow-ups, monthly invoice reminders, ad reports, and supplier checks.
- skills/toolsets become "Employee abilities" with plain-language categories and setup buttons.
- command palette can become owner power search: "find customer," "make invoice," "connect Stripe," "show work waiting for approval."

## The Missing AMTECH Layer

AMTECH needs a canonical product contract above raw Hermes. Proposed concepts:

### SurfaceEnvelope

Every thing emitted to a user-facing or operator-facing surface should be wrapped in a surface envelope:

```ts
type SurfaceEnvelope = {
  id: string;
  accountId: string;
  employeeId: string;
  sessionId?: string;
  runId?: string;
  workItemId?: string;
  source: "web" | "sms" | "email" | "webhook" | "desktop" | "admin" | "cron" | "api";
  kind:
    | "message"
    | "progress"
    | "tool_activity"
    | "artifact"
    | "approval"
    | "clarification"
    | "task"
    | "capability"
    | "connection_status"
    | "receipt"
    | "error"
    | "handoff";
  priority: "low" | "normal" | "high" | "urgent";
  title: string;
  summary: string;
  body?: unknown;
  actions: WorkAction[];
  renderHints: RenderHints;
  safety: SafetyEnvelope;
  proof: ProofEnvelope;
  createdAt: string;
  expiresAt?: string;
};
```

This is not a replacement for Hermes events. It is the AMTECH projection of Hermes plus Manager plus provider events into business-owned state.

### WorkResource

Every output should become a resource, not just text:

```ts
type WorkResource = {
  id: string;
  type:
    | "estimate"
    | "invoice"
    | "payment_link"
    | "email_draft"
    | "sms_draft"
    | "website_preview"
    | "marketing_campaign"
    | "order_cart"
    | "customer"
    | "job"
    | "file"
    | "image"
    | "video"
    | "spreadsheet"
    | "report"
    | "task_list"
    | "connector_setup"
    | "generic";
  title: string;
  status: "draft" | "needs_review" | "approved" | "sent" | "failed" | "archived";
  payload: unknown;
  schema?: unknown;
  artifacts: ArtifactRef[];
  sourceTool?: ToolRef;
  sourceCapability?: CapabilityRef;
  ownerActions: WorkAction[];
  customerVisible: boolean;
};
```

Estimates are one `WorkResource` type. The same renderer must handle email drafts, invoices, web pages, generated images, reports, order carts, customer follow-ups, spreadsheet previews, cron results, and connector setup.

### WorkAction

Actions should be declarative and surface-agnostic:

```ts
type WorkAction = {
  id: string;
  label: string;
  verb:
    | "approve"
    | "send"
    | "edit"
    | "cancel"
    | "retry"
    | "schedule"
    | "connect"
    | "pay"
    | "download"
    | "copy"
    | "open"
    | "answer"
    | "archive";
  risk: "none" | "low" | "money" | "external_send" | "destructive" | "credential";
  requiresConfirmation: boolean;
  inputSchema?: unknown;
  target: {
    envelopeId?: string;
    resourceId?: string;
    toolName?: string;
    connectorId?: string;
  };
};
```

Web renders this as buttons, forms, tabs, previews, or modals. SMS renders this as numbered options, short links, or natural-language replies. Desktop renders this in right rail/toolbars. Admin renders it with proof and override context.

### CapabilityGraph

AMTECH should build a capability graph from:

- employee profile package definition and rendered profile build
- Hermes `/v1/capabilities`
- Hermes `/v1/skills`
- Hermes `/v1/toolsets`
- Manager tools
- installed optional skills
- rendered MCP server config
- account entitlements
- connector credential/status
- provider health
- AMTECH policy gates
- per-employee provisioning image contents

Owner-facing states:

- Available: "I can do this now."
- Needs connection: "Connect Stripe/Square/Gmail first."
- Needs info: "I need your price sheet or tax settings."
- Needs plan: "Upgrade to unlock."
- Degraded: "I can draft this, but cannot send until the connection is fixed."
- Not safe unattended: "I will ask before spending money, sending, deleting, or changing credentials."

Do not expose "MCP," "API," "schema," "toolsets," or raw tool names to normal owners. Keep those in admin/operator views.

## Surface Strategy

### Web Employee Desk

The web UI should be the primary high-fidelity surface.

Recommended structure:

- Left navigation: Today, Inbox, Jobs, Customers, Outputs, Recurring, Connected, Abilities, Activity.
- Center: current conversation and work timeline, with messages, progress, approvals, questions, and receipts.
- Right rail: live preview/artifact tabs, customer/job context, connector status, draft/output preview, and proof.
- Bottom composer: text, voice, attachments, queue, stop, steer, and common quick actions.
- Mobile: bottom tabs, swipe navigation, compact work cards, full-screen preview drawer, native-feeling approval flows.

Required interactions:

- queue message while employee is busy
- stop/cancel run
- edit/rerun recent instruction
- regenerate or ask for another draft
- approve/send/edit/cancel in one place
- preview every artifact before external send
- show "what it is doing" without raw developer logs
- expose connected account status and repair actions
- show work waiting for owner, work in progress, and completed proof

The UI should feel like hiring an employee, not opening a model playground.

### SMS Surface

SMS must be powerful because many small-business owners will live there.

SMS cannot show full state, so it needs a disciplined grammar:

- Notify: "New lead from website: Maria, deck stain, wants Friday. Reply 1 quote, 2 ask for photos, 3 ignore."
- Question: "Need one detail before I price this: walls only or walls + trim?"
- Approval: "Ready to send estimate #1042 for $1,840 to Maria. Reply SEND, EDIT, or open preview: <signed-link>."
- Progress: "Working on the invoice and checking the last approved rate sheet. I will ask before sending."
- Failure: "Square needs reconnecting before I can create a payment link. Open: <signed-link>."
- Receipt: "Sent invoice #203 to Acme. Payment link created. Proof: <signed-link>."
- Digest: "3 things waiting: 1 estimate approval, 1 customer question, 1 Gmail reconnect."

SMS should support:

- signed previews with scoped actions
- action tokens that expire
- natural replies mapped to actions
- batched approvals
- owner-controlled quiet hours and digesting
- "send me preview", "what are you doing", "stop", "call this customer", "remind me tomorrow" commands
- link unfurls containing status, title, amount, recipient, and risk
- no raw stack traces, API language, MCP language, or huge tool logs

Every SMS link should open the same `SurfaceEnvelope`/`WorkResource` rendered in a mobile web preview, not a bespoke estimate-only page.

### Desktop / Deno Consumer

A Deno desktop app is feasible and strategically useful, but it should consume AMTECH Manager contracts, not raw Hermes internals.

Possible implementation paths:

- Tauri shell with a Deno or web frontend consuming Manager HTTP + SSE/WebSocket.
- Deno Fresh/PWA packaged with a system webview.
- Lightweight desktop client that points at a remote AMTECH employee instance.

Do not make the desktop app the core product dependency. The factory may run dozens or hundreds of cloud-hosted employees. A desktop client should be an optional surface that signs in, subscribes to an employee event stream, and renders the same envelopes/resources/actions as web and SMS.

Desktop-specific value:

- always-on notifications
- local file drag/drop
- richer right-rail previews
- keyboard command palette
- local clipboard/download workflows
- optional local browser/computer-use handoff
- owner or AMTECH operator console for power users

The desktop contract should be:

- `GET /employees/:id/surface/bootstrap`
- `GET /employees/:id/surface/events?cursor=...` or WebSocket equivalent
- `POST /surface/actions/:actionId`
- `GET /resources/:resourceId`
- `GET /resources/:resourceId/preview`
- `GET /capabilities`
- `GET /connections`

That keeps Deno/Tauri/Electron/web/mobile all equivalent consumers.

### Email, Customer Links, Webhooks, And Egress

Email should be both ingestion and egress:

- inbound customer email becomes `SurfaceEnvelope(kind="message")` plus customer/job resolution
- outbound draft becomes `WorkResource(type="email_draft")`
- send requires approval unless policy allows auto-send for low-risk categories
- sent email becomes receipt/proof

Customer-facing links should be narrow:

- view estimate
- accept/sign
- pay
- upload photos/files
- answer a question
- book a slot

Do not expose employee internals to customers. The customer surface is an artifact/action portal.

Webhooks should use the same ingestion model:

- Stripe/Square/Gmail/form/website/provider event -> normalized inbound event
- classify/account/customer/job/session
- optionally wake employee or create passive receipt
- materialize any owner-facing state

## Information We Should Be Able To Surface

The goal is not to show everything all the time. It is to make every useful bit of state available to the right renderer when needed.

Employee state:

- employee identity, business, timezone, voice, policies
- profile/config version
- runtime status and health
- model/provider status
- active sessions/runs
- message queue
- current task/progress
- installed skills
- enabled abilities
- connector status
- pending approvals/questions/secrets
- scheduled jobs
- memory/known business facts
- costs/usage
- errors needing repair

Work item state:

- source channel
- customer/contact
- job/location
- current stage
- owner-provided facts
- inferred facts
- missing facts
- attached media/files
- artifacts/drafts
- tool/capability provenance
- approval state
- external-send state
- proof/receipt
- follow-up schedule
- errors/repair path

Artifact state:

- type
- schema/payload
- owner-safe summary
- preview HTML/text/media
- downloadable/exportable forms
- customer-visible form
- edit history
- approval/send history
- related task/customer/job

Capability state:

- can run now
- needs connection
- needs owner info
- needs plan/admin
- risky action class
- examples
- last used
- failure reason
- repair action

This state should be queryable/renderable without depending on one chat transcript.

## Implementation Implications For AMTECH

### 1. Build The Materialization Layer

Add Manager-owned tables/types/services for:

- `surface_envelopes`
- `work_resources`
- `work_actions`
- `capability_graph_nodes`
- `surface_delivery_receipts`
- `signed_preview_links`

These can start source-wired and thin. The key is to stop letting chat messages be the only durable product object.

### 2. Convert Hermes Events Into Business Events

Create an `EmployeeEventStream` that merges:

- Hermes run/session events
- Manager tool activity descriptors
- artifact/resource creation
- approval/clarify requests
- connector state changes
- SMS/email/provider inbound events
- cron/job events
- billing/metering events

The stream should preserve raw provenance internally but emit owner-safe envelopes externally.

### 3. Generalize Rendering

Keep the generic renderer work started by prior agents, but widen it:

- JSON-schema form renderer for inputs/actions
- payload-to-section/table/list renderer for unknown structured artifacts
- special renderers only for high-value common resource types
- SMS renderer for every envelope/resource/action
- link-preview renderer for every envelope/resource/action
- admin renderer with raw proof/debug available

Rule: a new Hermes skill or MCP server should become visible as a capability and produce renderable resources without writing a bespoke connector page.

### 4. Make Approvals And Questions Universal

Approvals should not be estimate-specific. They should cover:

- send to customer
- spend money
- issue/refund payment
- order parts
- create/change/delete external record
- change credential/connection
- publish website/marketing content
- dangerous/local command class

Questions should render across:

- web cards/buttons/forms
- SMS numbered choices/natural text
- desktop right rail
- email link
- admin/operator console

### 5. Rename Technical Surfaces For Owners

Owner vocabulary:

- Connected accounts, not connectors/MCP/API.
- Abilities, not toolsets.
- Work, not runs.
- Waiting for you, not pending approvals.
- Proof, not audit log.
- Draft/output, not artifact payload.
- Employee memory, not vector/session store.
- Recurring work, not cron.

Admin vocabulary can remain technical where necessary.

## Competitive Bar

To win, AMTECH needs to do what generic chat products do not:

- make outputs actionable, not just conversational
- remember business context safely
- use existing Hermes skills/toolsets instead of rebuilding integrations
- ask before real-world risk
- work over SMS without feeling crippled
- produce customer-ready artifacts
- operate many employee instances with health, proof, cost, and support visibility
- let the same employee be consumed from web, SMS, desktop, email, and future clients

The strategic product is not "AI estimates." It is "a cloud-hosted AI employee factory with business-native surfaces."

## Next Build Targets

Highest leverage sequence:

1. Define `SurfaceEnvelope`, `WorkResource`, `WorkAction`, and renderer interfaces in shared code.
2. Materialize current Manager tool activity, artifacts, approvals, and owner chat messages into envelopes/resources.
3. Replace the web chat skeleton with the employee desk layout: left work nav, center timeline, right preview rail, serious composer.
4. Build signed mobile previews for every envelope/resource/action, not just estimates.
5. Add SMS renderer and action-token resolver on top of the same envelopes/actions.
6. Build `CapabilityGraph` from Hermes capabilities/skills/toolsets, configured toolsets, Manager tool schemas, MCP tools, skills, connector status, entitlements, and policy.
7. Add an operator/admin event view that can inspect raw provenance, repair connectors, see health, and understand instance cost.
8. Only then add optional Deno/Tauri desktop shell against the Manager surface API.

This sequence aligns the product with Hermes rather than competing with or shrinking it.
