# 05 — Web Client, Work Surfaces, and Tool-Agnostic Generated UI

Status: **[VERIFIED] source and browser-contract behavior; [INCOMPLETE] fixture-free provider-backed acceptance**

## Web role

Web is the high-fidelity owner surface and a server-side custody boundary. Browser code does not receive Manager's internal bearer, Hermes credentials, provider credentials, or the raw owner-session token.

Primary source:

- `apps/web/app/api/_lib/manager.ts`
- `apps/web/app/api/auth/login/route.ts`
- `apps/web/app/api/employee/[employeeId]/*`
- `apps/web/app/agent/[employeeId]/AgentSurface.tsx`
- `apps/web/app/agent/[employeeId]/components/WorkObjectRenderer.tsx`
- `apps/web/app/agent/[employeeId]/components/McpUiResource.tsx`
- `apps/manager/src/lib/employee-stream.ts`
- `apps/manager/src/lib/employee-stream-strict.ts`
- `apps/manager/src/lib/materialization.ts`
- `apps/manager/src/lib/operating-surface.ts`
- `apps/manager/src/lib/ui-resources.ts`

## Session and proxy custody

### Login

The Next login route authenticates email/password directly with Supabase Auth. It sends the resulting access token to Manager's owner-login route. Manager verifies the user, membership, and selected account, then returns an owner session.

Before Web returns JSON to the browser, it:

- extracts `owner_session_token`;
- deletes it from the response payload;
- stores it as an HttpOnly, SameSite Lax cookie;
- marks the response `Cache-Control: no-store`.

### Browser-to-Manager requests

Browser API requests terminate at Next routes. Server routes read the HttpOnly cookie and call Manager using the internal Manager bearer plus the owner session in the request body or private internal header required by that Manager route.

### SSE

The browser opens `EventSource` against a Next route with no token in the URL. Next forwards the owner session only in `X-AMTECH-Owner-Session` on the Manager hop. The proxy:

- disables caching and buffering;
- streams Manager bytes to the browser;
- aborts after a bounded authorization lifetime so a reconnect re-authorizes the session;
- cancels the upstream reader when the browser disconnects.

## Authoritative snapshot

`buildEmployeeSnapshotStrict` wraps the read model with a strict Supabase proxy. Any awaited query result with `error` throws before normal empty-array fallbacks can apply.

The snapshot includes:

- employee identity and profile pointer;
- artifacts;
- pending approvals;
- owner/employee messages;
- connector accounts and connection surfaces;
- Stripe state and invoices;
- reminders and job commitments;
- normalized work events;
- runtime health;
- capabilities and abilities;
- work resources and actions;
- tasks and outputs;
- resurfacing items;
- assignment ID.

The operating-snapshot route adds `OperatingSurfaceState` after resolving exact owner assignment authority for action `materialize`.

## Task-agnostic operating surface

`operating-surface.ts` turns shared work primitives into an experience organized around business progress rather than tool names.

### Context

The context manifest carries:

- account, assignment, and employee identity;
- employee and business names;
- business kind;
- profile key/version;
- session and last-active information;
- runtime context version;
- doctrine versions;
- dominant business domains;
- owner experience level and density preference;
- bounded owner-safe signals with source, confidence, freshness, and semantic kind.

### Work projections

- **loops** — ongoing or bounded units of work with state, horizon, domain, next step, return condition, target, and proof;
- **active saves** — work the employee is carrying forward until a time, event, owner answer, approval, connector repair, or external response;
- **decisions** — exact owner choices tied to approvals/resources;
- **changes** — recent system or business changes;
- **delegated work** — bounded sub-work with state and relationship to the parent loop;
- **evidence** — artifacts, receipts, messages, runtime state, and other proof;
- **guidance** — one computed owner-facing orientation and suggested prompt;
- **layout** — deterministic region ordering, density, prominence, and focus loop.

This allows the same UI to represent estimates, invoices, customer messages, accounting, calendar coordination, connector repair, research, documents, and future work without a page per tool.

## Owner turn lifecycle

`AgentSurface.tsx`:

1. creates a stable intent ID for a new owner direction;
2. preserves the same intent ID after an ambiguous connection failure or rejected response;
3. POSTs message and intent ID to the Next route;
4. Manager resolves session, assignment, grant, and policy;
5. durable owner-turn execution claims the intent;
6. Hermes receives current operating context and direction;
7. the API returns accepted, ambiguous/reconciling, or failed state;
8. browser refreshes the authoritative snapshot.

The browser never assumes a connection failure means the command was not accepted. The UI explicitly tells the owner not to resend when terminal state is unknown.

## Live update lifecycle

`AgentSurface.tsx` maintains one EventSource and handles:

- `open`
- `snapshot`
- `work_event`
- `work_progress`
- `approval_update`
- reconnect with exponential backoff capped at 15 seconds.

A work event can be inserted optimistically into the current list, but a scheduled full snapshot refresh follows. The snapshot remains authoritative.

## Materialization model

### SurfaceEnvelope

An envelope describes an owner-facing unit of state:

- account/assignment/employee scope;
- kind, title, summary, status, and time;
- render hints;
- safety envelope;
- proof envelope;
- optional resource and actions.

### WorkResource

A resource is the channel-agnostic representation of one inspectable work object. It includes identity, assignment, title, summary, fields, amount, recipient, risk, body kind, generated UI resource, document/media pointers, actions, receipts, and expiry state.

### WorkAction

Actions use a finite vocabulary such as approve, reject, respond, acknowledge, edit, and view. Each action can declare style, gate status, and command/effect requirement.

### CapabilityGraphNode

Capabilities describe what the employee can do, whether it can run now, setup requirements, trust source, category, and proof. They do not directly grant execution authority.

## Generated UI pipeline

```text
Hermes/Manager tool output
  → typed WorkView descriptor
  → Manager schema validation
  → exhaustive view compiler registry
  → self-contained ui:// HTML resource
  → WorkEventDescriptor / WorkResource
  → sandboxed iframe
  → finite intent postMessage
  → host intersects intent with WorkResource.actions
  → owner action/approval/command route
```

### Typed views

The shared generated-view contract defines the supported finite view vocabulary. The Manager compiler has representative coverage for every declared kind and uses an exhaustive typed registry rather than an open switch/default path.

Generated views can represent structures such as:

- tables;
- schedules;
- diffs;
- forms;
- structured review objects.

The compiler owns HTML generation. The model does not send arbitrary executable HTML directly to the browser as authority.

### Iframe boundary

`McpUiResource.tsx` renders the Manager-compiled HTML using:

```html
<iframe sandbox="allow-scripts" srcDoc="...">
```

Without `allow-same-origin`, the iframe has an opaque origin. It cannot read parent cookies or parent DOM state. It can run only the scripts embedded in the compiled resource and communicate with the host through `postMessage`.

The host verifies:

- message source is the exact iframe window;
- payload source is `amtech-mcp-ui`;
- message type is `intent`;
- intent is one of accept, accept_all, reject, respond.

### Intent authority

`WorkObjectRenderer` maps accept/accept_all to approve and then verifies that the mapped action exists in the bound `resource.actions` array. It ignores any iframe attempt to choose a different durable approval resource; the host uses `resource.resource_id`.

A generated review with a durable `approval_id` materializes as an `approval` WorkResource. A consequential descriptor lacking a durable approval ID cannot expose approve/reject; it is reduced to non-terminal response behavior.

Generated UI therefore changes presentation density and interaction efficiency, not authority.

## Signed mobile review

Signed preview links resolve to the same `WorkResource` contract. The signature proves possession of a scoped, expiring link; durable lookup supplies current assignment/resource state. Approve/reject remains current-policy execution rather than a static signed decision embedded in the URL.

## Fixture mode

Fixture mode exists for UI development and browser acceptance. It supplies representative data without Manager, Supabase, Hermes, Docker, or provider effects.

`AgentSurface` explicitly labels fixture actions as demonstrations and does not claim a real effect. Fixture mode is guarded from production-like environments by source validation and policy documentation.

## Web effect graph

### EFFECT-WEB-001 — owner loads employee

```text
browser POST resources
  → Next reads HttpOnly session
  → Manager bearer + owner session
  → Manager authorizes assignment read/materialize
  → strict database snapshot
  → business/operating context compilation
  → JSON response
  → deterministic owner layout
```

### EFFECT-WEB-002 — owner sends direction

```text
browser stable intent
  → Next proxy
  → owner session + assignment/grant/policy
  → durable command claim
  → current context
  → Hermes run/session
  → work progress/events/artifacts/decisions
  → terminal or ambiguous receipt
  → snapshot/SSE refresh
```

### EFFECT-WEB-003 — generated approval

```text
generated card intent accept
  → iframe source/type/intent validation
  → accept maps to approve
  → authoritative action-set intersection
  → resource type/id resolved by host
  → approval resolve API
  → current assignment/policy authorization
  → held external action continues or remains rejected
  → durable proof shown on refresh
```

## Interaction surfaces

### INTERACTION-UI-001: task-agnostic context × adaptive layout | TRANSFORM

Emergent finding: the owner surface can emphasize the current decision or active save without hardcoding the originating tool or provider.

Value: 20/20.

### INTERACTION-UI-002: generated UI × WorkResource actions | GATE

Emergent finding: rich interactive output can be model-shaped while every accepted intent remains finite, host-validated, and resource-bound.

Value: 20/20.

### INTERACTION-UI-003: stable intent × ambiguous transport failure | FEEDBACK

Emergent finding: a user can retry after network loss without creating a second employee turn.

Value: 20/20.

### INTERACTION-UI-004: SSE deltas × strict snapshots | FEEDBACK

Emergent finding: live responsiveness does not require deltas to become the source of truth; every meaningful change converges through a fail-closed snapshot.

Value: 19/20.

## Current incomplete boundaries

- [INCOMPLETE] One real provider-backed generated work object must be proven through typed view, owner action, external effect, provider receipt, accounting/effect receipt, and rendered proof.
- [INCOMPLETE] Deployed browser logs, reverse-proxy logs, and session rotation must prove no owner bearer appears in URLs or browser-readable payloads.
- [INCOMPLETE] Accessibility and browser matrices are fixture/product-shell based; fixture-free owner, SMS, and signed Review evidence is still required.
- [INCOMPLETE] Broader user roles and operator perspectives do not yet have complete production UI coverage.
- [INCOMPLETE] The current utilitarian iframe host is intentionally narrower than a full MCP-UI AppFrame/proxy host. Any upgrade must preserve the same action intersection and credential isolation.
