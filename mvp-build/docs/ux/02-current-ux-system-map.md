# Current UX System Map

Status: active  
Purpose: map the current UX surfaces to implementation and contracts

## Primary Owner Surface

The current owner route is `/agent/[employeeId]`. It is Avery-first:

- Home: Avery presence, Tell Avery, Needs your say, quiet Watching, Recent proof.
- Talk: the conversational command surface without making the whole app a transcript.
- Proof: refinding receipts, approval results, sent work, and generated records.
- Connected: owner-readable account capability state.

Core implementation uses `ResourcePayload`, `WorkResource`, `WorkAction`, `ConnectionSurface`,
`CapabilityGraphNode`, `SurfaceEnvelope`, and `ResurfaceItem`.

## Signed Mobile Review

`/agent/[employeeId]/review?t=...` is the no-login scoped approval surface. It renders a
`WorkResource`, reuses the approval/reply grammar, and must remain visually aligned with owner Home.
It is the mobile permission moment for SMS.

## Admin

`/admin` is operator-facing, not owner-facing. It may expose readiness, proofs, repairs, support
actions, and diagnostics behind role, support reason, and redaction. It should inherit clarity and
restraint, but it is allowed to be denser than owner UI.

## Generative UI Layer

Manager can compile typed work views into MCP-UI `ui://` resources using `@mcp-ui/server`.
The owner web client renders those resources in a sandboxed iframe and routes intents back through
the same host approval/respond handlers. This is source-wired and locally unit-tested, but live
LLM-driven exercise is pending funded provider/Hermes tool-loop proof.

## Fixture UI

`NEXT_PUBLIC_AMTECH_UI_FIXTURES=1` runs the same route/component tree with representative local data.
It is for UI development and screenshots only. Pod-like and production-like environments must never
enable it.

## Surfaces Needing Alignment

- Public front door and create/claim/login flows.
- Customer estimate portal.
- Billing and connected-account setup pages.
- Admin visual language.
- Artifact/output HTML.
- Website estimator and future marketing/customer surfaces.
