# Pi Ecosystem → AMTECH Interface Concepts (Technical Implementation Layer)

**Status:** draft

**Purpose of this document:** Extract only the *technical implementation tricks and patterns* from the Pi.dev ecosystem (https://taoofmac.com/space/ai/agentic/pi) that can help us build the web client, generative preview surfaces, signed links, SMS/other-channel delivery, and companion UIs.

**Critical separation of concerns:**
- **Philosophical heavy lifting, UX principles, work surface semantics, owner psychology, event-driven office model, conformance rules, and surface contracts** = already defined in AMTECH's own extensive UX research under `wiki/MVP/` (especially `event-driven-office-and-generative-ui.md`, `ai-native-work-surface-research.md`, and `phase-3-generative-ui-reframe.md`).
- **Technical "how" patterns** (web companion architecture, generative widget streaming, signed preview link mechanics, multi-channel routing with gates, approval-before-execute flows) = borrowed from Pi ecosystem projects where useful.

This document is deliberately narrow: it only surfaces Pi techniques that map cleanly onto AMTECH's already-decided UX direction.

## Pi Technical Patterns Worth Borrowing

These are implementation techniques only — the meaning and constraints come from AMTECH's UX docs.

| Pi project | Technical pattern | How it can be used in AMTECH | UX source it must obey |
|------------|-------------------|------------------------------|------------------------|
| **pi-companion** | Lightweight authenticated web + mobile + desktop client that lists workspaces/sessions and renders live state | Build the primary web companion surface that lists active Estimate/Employee sessions and renders WorkEventDescriptors | `ai-native-work-surface-research.md` (Home/Talk/Proof/Connected) |
| **pi-generative-ui + Glimpse** | Streams interactive HTML/SVG widgets into windows via WKWebView + JSON-lines IPC; agent can render live charts, cost breakdowns, schedules | Use the same streaming + widget approach to render typed DeliverableType cards (estimate line items, schedule previews) instead of markdown | `phase-3-generative-ui-reframe.md` (static/typed only; conformance over novelty) |
| **pi-queue** | Webhook task runner that accepts tasks, requires explicit human approval, then executes in isolated worktrees | Implement the confirmation gate: every money/outbound/schedule action prepares a descriptor, sends signed preview, waits for owner resolution before ACT | `event-driven-office-and-generative-ui.md` §2 stages 8–12 |
| **Mercury** | Multi-channel chat routing (WhatsApp/Slack/Discord) with per-space agent orchestration and extension points | Allow the same WorkEventDescriptor to be delivered via SMS today and WhatsApp/Slack later while preserving identical owner approval semantics | `event-driven-office-and-generative-ui.md` §2 (RENDER) + §10 |
| **pi-gui** | Electron desktop shell that lists workspaces, creates conversations, persists UI state | Optional later "pro" desktop shell; must render the same typed descriptors as web/SMS | `event-driven-office-and-generative-ui.md` §5 (TUI adjacency) |
| **pi-acp / pi-mcp-adapter** | JSON-RPC / MCP adapters that expose the agent as a service with UI session support | Use as reference for exposing the employee as a composable service behind the SurfaceEnvelope contract | `event-driven-office-and-generative-ui.md` (second-half SurfaceEnvelope direction) |

## What We Do *Not* Take from Pi

- Any redefinition of what a work surface is
- Any philosophy about agent ownership, confirmation gates, or "pro-human" positioning
- Any generative UI approach that allows open-ended/raw markup for money or customer actions
- Any assumption that chat is the product rather than the command language

All of the above are already settled in AMTECH's UX sources and must not be overridden.

## Technical Surface Implementation Directions (Constrained by UX Docs)

### Web Client
- Thin companion that consumes the existing `deliverEmployeeEvent` / WorkEventDescriptor pipeline.
- Renders the same typed components already used for SMS.
- Adds signed, time-boxed preview deep links that open the identical WorkCard.

### Generative Preview Links & Widgets
- Use the Pi-style streaming/widget technique only to render pre-approved DeliverableType components (document, outbound_message, money_movement, schedule_mutation, etc.).
- Preview URLs are signed JWTs carrying owner + event identity; clicking them resolves the gate and records proof.

### SMS + Multi-Channel Signed Links
- Extend the existing Twilio path (`event-driven-office-and-generative-ui.md` §3) so every high-stakes descriptor includes a signed preview URL.
- Future channels (WhatsApp/Slack) reuse the exact same descriptor + approval contract (Mercury pattern).

### Confirmation Gate
- Implement the pi-queue-style "prepare → signed preview → owner decision → ACT" flow strictly inside the 12-stage lifecycle already defined in `event-driven-office-and-generative-ui.md` §2.

## Implementation Priorities (Technical Only)

1. Phase 0–1: Make the acceptance harness able to emit signed preview tokens for existing WorkEventDescriptors.
2. Early web companion: Minimal `pi-companion`-style surface that lists sessions and renders the same cards SMS already produces.
3. SMS signed-link hardening: Every money/customer action includes a short-lived preview URL.
4. Typed widget streaming: Add the next DeliverableType renderers using the Glimpse-style JSON-lines technique, but only for approved types.
5. Multi-channel routing (later): Once the descriptor contract is stable, add WhatsApp/Slack delivery while keeping the owner gate identical.

## Guardrails

- Every technical choice must be traceable to one of the three canonical UX documents.
- No new surface semantics, no new component types, and no relaxation of the conformance rule without an explicit update to `phase-3-generative-ui-reframe.md`.
- The Pi ecosystem is consulted only for "how to stream a widget," "how to sign a preview link," "how to route across channels," and "how to gate execution behind approval."

This document will be updated only when new technical patterns appear in the Pi ecosystem that solve concrete implementation problems in the AMTECH surface layer. Philosophical or UX changes must originate from the `wiki/MVP/` sources, not from external projects.