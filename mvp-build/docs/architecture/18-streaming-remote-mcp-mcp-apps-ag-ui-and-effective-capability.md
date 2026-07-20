# Streaming, Remote MCP, MCP Apps, AG-UI, and Effective Capability

Status: source/CI architecture accepted; external/live acceptance incomplete

## User experience

The Web client is a SaaS-legible employee operating environment. Owners see stable navigation and workspaces, but interaction with Hermes is terminal-fast: text deltas, safe activity, and run completion stream as soon as they are available. Connected systems, approvals, contextual apps, artifacts, proof, and recovery stay in the same durable workspace.

Safety is placed at authority transitions, not as artificial latency:

```text
harmless text/activity → stream immediately
finite user intent → authenticate and bind current assignment/version
connector/tool execution → effective-capability check
consequential action → approval + idempotent reservation + receipt
```

## Runtime flow

```text
POST /v1/runs
→ GET /v1/runs/{runId}/events
→ sanitized assistant/activity events
→ Manager assignment/version-scoped Work Stream
→ native Web live console
→ optional AG-UI projection
→ durable snapshot/event catch-up on reconnect
```

A created run is never recreated merely because its SSE stream fails. Manager polls that same run. This prevents duplicated runtime tool/effect work.

## Remote MCP boundary

The protected resource is the root of trust. Manager—not Hermes, a tool description, browser, or MCP App—discovers protected-resource metadata and authorization-server metadata. Exact resource audience, discovered issuer, exact redirect, scope intersection, S256 PKCE, state, authorization-code response, token type/resource/scope/expiry are validated. Tokens are sealed as Manager secret references.

## MCP Apps boundary

A generated interactive view is an approved resource, not executable authority:

- negotiated `ui://` URI and MCP App MIME/profile;
- content hash;
- opaque origin and no same-origin privilege;
- no direct network/frame capability;
- finite host method set;
- JSON-RPC limited to `amtech.surface.intent`;
- assignment/version/resource/action projection;
- native Manager reauthorization before command/effect.

Under-scoped views remain display-only.

## AG-UI boundary

AMTECH maps its Work Stream into ordered RUN, TEXT, STATE, and ACTIVITY events. Every event carries assignment and authority version under an AMTECH projection marker. Shared state cannot mutate durable authority. A scope change terminates the connection. Client commands use a finite schema and return through native approval or owner-message routes.

## Effective capability boundary

```text
advertised
AND runtime reported
AND dependencies ready
AND credential ready
AND network ready
AND policy ready
AND entitlement ready
AND authority version current
AND connector binding healthy
AND live probe passed
AND evidence fresh
= effective
```

`tools/list` may expose broad possibilities. `tools/call` is intercepted after MCP credential verification and before Manager tool dispatch. The decision and failed dimensions are persisted for diagnostics and proof.

## Hardened interception points

1. protected-resource metadata URL;
2. authorization-server selection;
3. authorization URL binding;
4. token response sealing;
5. runtime tool execution;
6. MCP App resource/hash/sandbox;
7. MCP App host call;
8. AG-UI event projection;
9. AG-UI client command;
10. generated WorkAction projection;
11. connector adapter dispatch;
12. effect reservation;
13. provider receipt classification;
14. stream replay/sequence;
15. authority-version drift.

## Acceptance boundary

Source/CI evidence proves deterministic contracts and compiled first-party behavior. It does not prove a disposable live authorization server, third-party MCP Apps/AG-UI clients, real connector revocation/outage/repair, managed database semantics, target-host isolation, provider effects, or production readiness.