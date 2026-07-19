# Current UX System Map

Status: active  
Updated: 2026-07-19  
Purpose: map current UX surfaces to implementation, contracts, evidence level, and release boundary

## Primary Owner Surface

The current owner route is `/agent/[employeeId]`. It is an adaptive operating surface built from:

- guidance;
- owner attention and decisions;
- persistent work loops;
- active saves with return conditions;
- meaningful system changes;
- bounded delegated work;
- evidence and outcomes;
- connected systems that materially affect work;
- inspectable owner-safe context and layout rationale;
- contextual command.

The browser consumes `ResourcePayload`, `OperatingContextManifest`, `OperatingSurfaceState`, `AdaptiveLayoutPlan`, `WorkResource`, `WorkAction`, `ConnectionSurface`, `CapabilityGraphNode`, `SurfaceEnvelope`, and `ResurfaceItem`.

The surface does not infer emotion, personality, fatigue, vulnerability, or persuasion susceptibility. Adaptation uses typed work/risk state, explicit owner experience/density, bounded owner-safe context, viewport, and accessibility preferences.

## Signed Mobile Review

`/agent/[employeeId]/review?t=...` is the no-login scoped approval surface. It renders one `WorkResource`, reuses the approval/reply grammar, and must remain visually aligned with owner Home. It is the mobile permission moment for SMS.

## Fixture Operating Lab

`/ui-lab` and `/ui-lab/[scenario]` are fixture-only experimental surfaces. They are unavailable unless the fixture guard allows the environment.

Current scenarios:

- contractor employee;
- employee as website;
- multi-person, multi-role office;
- personal operating brain;
- research employee;
- independent clothing operations employee with Shopify, email, business-brain context, material requirements, supplier pricing, production capacity, fulfillment risk, margin impact, and a held purchase decision.

The lab uses typed operating state and deterministic owner-safe heartbeat frames. It can simulate a heartbeat gap, stalled projection, fresh-snapshot recovery without replay, fixture commands, delegation, decisions, active saves, and draft evidence.

Evidence level is always `fixture_demonstration`. The lab cannot create a provider, customer, money, publishing, inventory, credential, runtime, or durable external effect. It does not count as fixture-free acceptance.

The compiled browser matrix may enable fixture data in a Next production build only through the exact CI-only tuple defined by `app/_lib/ui-fixtures.ts`. Staging, pod, and production environment names remain denied.

## Hermes Stream Boundary

The current owner stream vocabulary remains:

- snapshot;
- work event;
- work progress;
- approval update;
- run completed.

`docs/ui/HERMES_HEARTBEAT_UI_ARCHITECTURE.md` defines the fixture-first optional heartbeat projection. Heartbeats indicate liveness only; they do not prove authority, correctness, completion, an external effect, or a durable receipt. Raw tool logs, CPU/RSS/PID data, private context layers, and browser-triggered recovery remain outside the owner surface.

## Admin

`/admin` is operator-facing, not owner-facing. It may expose readiness, proofs, repairs, support actions, and diagnostics behind role, support reason, and redaction. It may be denser than owner UI.

Future support diagnostics may retain exact run/session/profile/assignment identity, transport state, sequence, bounded throughput, dropped-line counts, failure class, and recovery records. They remain separately authorized and do not turn the owner surface into an engineering console.

## Generative UI Layer

Manager can compile typed work views into MCP-UI `ui://` resources using `@mcp-ui/server`. The owner web client renders those resources in a sandboxed iframe and routes intents back through the same host approval/respond handlers.

This is source-wired and locally unit-tested, but live LLM-driven exercise is pending funded provider/Hermes tool-loop proof. Generative UI is not raw model HTML. Manager owns templates, action grammar, sandbox, approval binding, fallback, and proof path.

## Surfaces Needing Alignment

- Public front door and real create/claim/login/account flows.
- Customer estimate portal.
- Billing and connected-account setup pages.
- Admin visual language.
- Artifact/output HTML.
- Public marketing site and clearly labeled product demonstrations.
- Provider-backed owner-safe runtime heartbeat and long-running progress proof.

The public estimator is outdated and non-canonical. Preserve it only as a clearly separated regression/acquisition harness where useful; do not treat it as a product surface, flagship UX, pricing authority, profile authority, or launch-acceptance path.
