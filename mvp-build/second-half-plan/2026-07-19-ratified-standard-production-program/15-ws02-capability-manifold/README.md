# WS-02 15-Dimensional Capability Manifold

Status: implementation companion for `AMTECH-P0-WS02-002`  
Scope: Remote MCP, MCP Apps, AG-UI, connectors, effective capabilities, Hermes-derived Web surfaces, and Manager authority.

## Reflected identity vector X′

### Mirror Face A — structural logic

```text
user trigger
→ Web / MCP App / AG-UI projection
→ authenticated owner session or employee MCP credential
→ exact employee assignment + policy + authority version
→ broad tool/capability discovery
→ current effective-capability intersection
→ Hermes reasoning or deterministic Manager processing
→ finite authorized AMTECH command
→ approval when required
→ one idempotent effect reservation
→ provider adapter
→ accepted | failed | ambiguous receipt
→ replay/reconciliation
→ durable WorkResource + ordered streaming projection
```

Potential bypass nodes are exactly the transitions from a presentation payload to `tools/call`, from broad `tools/list` discovery to execution, from OAuth discovery to token exchange, from AG-UI client state to a command, and from a generated `ui://` resource to a host call. Each is intercepted by Manager using current assignment, authority version, effective capability, action set, idempotency, and receipt state.

### Mirror Face B — semantic boundary

The surface-level stack can look more permissive than policy because Hermes advertises tools broadly, AG-UI transports mutable state, MCP Apps execute JavaScript, and OAuth returns bearer tokens. The hardened boundary treats all four as untrusted discovery/presentation mechanisms. Provider secrets remain sealed in Manager custody; generated views submit finite intents; shared state is projection only; tool execution is re-derived from current durable evidence.

`Δv_boundary` is reduced by five explicit gates:

1. remote MCP authorization server and audience derive from protected-resource metadata;
2. MCP App iframe has opaque origin, no direct network, a content hash, bounded host methods, and an authority projection;
3. AG-UI events carry assignment and authority metadata but cannot write durable state;
4. `tools/call` passes an effective-capability interceptor after credential verification;
5. consequential effects require one durable reservation and terminal receipt.

### Mirror Face C — identity reflection

An MCP App cannot escalate through discovery because the host ignores arbitrary tool names and accepts only `amtech.surface.intent`, then intersects it with current WorkActions. AG-UI cannot mutate authority version because authority metadata is projection-only and client commands are checked against current Manager state. A connector cannot select its authorization server, redirect, scope, or token custody mode from tool text.

Current source-level confidence that Manager authority is non-bypassable: **0.93**. This is not production acceptance. Exact-head CI, managed database proof, compliant host/browser testing, remote provider authorization, revocation, and live effect/receipt evidence remain separate gates.

## Enumeration contract

- All **105 pairwise** combinations are enumerated.
- **357 triple-wise** combinations are enumerated: every triple with at least two direct dependency edges, plus every hazard-bearing triple with at least one direct edge.
- Total candidate dreams: **462**.
- No combination is marked out of scope.
- A zero-edge pair includes an impossibility proof: direct coupling cannot occur without an unauthorized hidden edge across Manager or the transport-neutral adapter.
- Each entry contains one-sentence hypothesis, exact API-surface trajectory, verification tag, DEF-001–DEF-004 mapping, business value, risk, and expected utility.

Weights:

```text
λQ = 0.30
λI = 0.15
λN = 0.10
λC = 0.20
λK = 0.10
λR = 0.15
```

Utility component values use a normalized `0–5` scale. A hard authority or receipt gate cannot be overridden by a high weighted score.

## Top-k implementation dreams

| Rank | Dream | Dimensions | Operator | U | Business | Risk | State |
|---:|---|---|---|---:|---:|---:|---|
| 1 | `TRIPLE-Psi9-Psi10-Psi12` | Psi9 + Psi10 + Psi12 | TRANSFORM | 3.050 | 3 | 2 | [VERIFIED] |
| 2 | `TRIPLE-Psi5-Psi6-Psi11` | Psi5 + Psi6 + Psi11 | EMERGENT | 2.950 | 4 | 2 | [VERIFIED] |
| 3 | `TRIPLE-Psi2-Psi6-Psi10` | Psi2 + Psi6 + Psi10 | GATE | 2.900 | 4 | 3 | [VERIFIED] |
| 4 | `TRIPLE-Psi4-Psi5-Psi15` | Psi4 + Psi5 + Psi15 | FEEDBACK | 2.800 | 3 | 3 | [VERIFIED] |
| 5 | `TRIPLE-Psi2-Psi5-Psi9` | Psi2 + Psi5 + Psi9 | SEQUENTIAL | 2.750 | 4 | 2 | [UNVERIFIED] |
| 6 | `TRIPLE-Psi2-Psi5-Psi11` | Psi2 + Psi5 + Psi11 | SEQUENTIAL | 2.750 | 4 | 2 | [UNVERIFIED] |
| 7 | `TRIPLE-Psi2-Psi5-Psi13` | Psi2 + Psi5 + Psi13 | SEQUENTIAL | 2.750 | 4 | 2 | [UNVERIFIED] |
| 8 | `TRIPLE-Psi2-Psi9-Psi10` | Psi2 + Psi9 + Psi10 | TRANSFORM | 2.750 | 3 | 2 | [UNVERIFIED] |
| 9 | `TRIPLE-Psi2-Psi9-Psi11` | Psi2 + Psi9 + Psi11 | EMERGENT | 2.750 | 3 | 2 | [UNVERIFIED] |
| 10 | `TRIPLE-Psi2-Psi9-Psi13` | Psi2 + Psi9 + Psi13 | EMERGENT | 2.750 | 3 | 2 | [UNVERIFIED] |
| 11 | `TRIPLE-Psi2-Psi10-Psi13` | Psi2 + Psi10 + Psi13 | EMERGENT | 2.750 | 3 | 2 | [UNVERIFIED] |
| 12 | `TRIPLE-Psi2-Psi11-Psi13` | Psi2 + Psi11 + Psi13 | EMERGENT | 2.750 | 3 | 2 | [UNVERIFIED] |
| 13 | `TRIPLE-Psi3-Psi5-Psi9` | Psi3 + Psi5 + Psi9 | SEQUENTIAL | 2.750 | 4 | 2 | [UNVERIFIED] |
| 14 | `TRIPLE-Psi3-Psi5-Psi13` | Psi3 + Psi5 + Psi13 | SEQUENTIAL | 2.750 | 4 | 2 | [UNVERIFIED] |
| 15 | `TRIPLE-Psi3-Psi9-Psi10` | Psi3 + Psi9 + Psi10 | TRANSFORM | 2.750 | 3 | 2 | [UNVERIFIED] |
| 16 | `TRIPLE-Psi3-Psi9-Psi12` | Psi3 + Psi9 + Psi12 | TRANSFORM | 2.750 | 3 | 2 | [UNVERIFIED] |
| 17 | `TRIPLE-Psi3-Psi9-Psi13` | Psi3 + Psi9 + Psi13 | EMERGENT | 2.750 | 3 | 2 | [UNVERIFIED] |
| 18 | `TRIPLE-Psi3-Psi10-Psi12` | Psi3 + Psi10 + Psi12 | TRANSFORM | 2.750 | 3 | 2 | [UNVERIFIED] |
| 19 | `TRIPLE-Psi3-Psi10-Psi13` | Psi3 + Psi10 + Psi13 | EMERGENT | 2.750 | 3 | 2 | [UNVERIFIED] |
| 20 | `TRIPLE-Psi3-Psi12-Psi13` | Psi3 + Psi12 + Psi13 | TRANSFORM | 2.750 | 3 | 2 | [UNVERIFIED] |

## Streaming-first product interpretation

The Web client is an employee operating environment rather than a chat wrapper:

- persistent employee workspace and navigation;
- live token-by-token conversation;
- current activity and run lifecycle;
- connected systems and capability health;
- approvals and blocked work;
- artifacts, previews, revisions, and proof;
- recovery and ambiguous-state handling;
- contextual MCP Apps and native generated views.

Harmless text/activity streams immediately from Hermes. Authority checks do not block first-token presentation. They occur when a client or runtime crosses from explanation/discovery into a finite command, approval, credential operation, connector execution, or external effect.

## Hardened interception points

1. **Remote resource discovery:** before following authorization metadata.
2. **Authorization binding:** before constructing `/authorize`; exact resource, AS, redirect, scopes, state, and PKCE.
3. **Token exchange:** before sealing; exact audience/scopes/type/expiry.
4. **Runtime tool discovery:** `tools/list` remains broad and labeled non-authoritative.
5. **Runtime tool execution:** after MCP credential verification and before `runManagerTool`.
6. **MCP App resource load:** before iframe creation; negotiated extension, MIME, hash, CSP, permissions.
7. **MCP App host call:** before native action callback; source window, opaque origin, JSON-RPC method, finite intent, projected authority.
8. **AG-UI projection:** before emission; role-safe AMTECH events only, ordered sequence, no raw provider event.
9. **AG-UI client command:** before Manager command creation; finite schema plus current authority/action intersection.
10. **Generated view action:** before approval/effect endpoint; current WorkAction and authority version.
11. **Connector adapter dispatch:** before provider request; current manifest, custody, binding, health/probe, policy, entitlement.
12. **External effect:** before provider commit; immutable command, idempotency key, reservation, approval.
13. **Provider outcome:** before retry; ambiguous outcomes reconcile instead of silently falling back.
14. **Replay/reconnect:** before state merge; stable event/run/message IDs and monotonic sequence.
15. **Authority drift:** at every credential, capability, projection, queued command, approval, and effect transition.

## Artifact map

- `00-manifest.json` — dimension definitions, utility weights, and enumeration rule.
- `scripts/generate-ws02-capability-manifold.mjs` — deterministic complete pair/triple generator.
- Running the generator emits `01-pairwise.json` and numbered triple files; every generated entry is independently complete and contains no shorthand or repository file path in its investigation trajectory.
