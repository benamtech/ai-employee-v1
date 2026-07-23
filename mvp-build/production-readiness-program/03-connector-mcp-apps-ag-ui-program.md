# Connector, MCP Apps, and AG-UI Program

Status: P0/P1 protocol execution companion; source/CI implementation accepted, live acceptance incomplete  
Primary Standard clauses: `CCIP-6.1` through `CCIP-6.10`

## Canonical stack

```text
AMTECH labor protocol
  assignment → work object → authority → approval → effect → receipt → recovery
MCP core
  discovery/resources/tools + protected-resource authorization
MCP Apps
  negotiated ui:// interactive resources in an isolated host
AG-UI
  optional ordered run/message/activity/state transport
AMTECH clients
  Web | SMS | signed Review | connected-system events | future channels
```

None of MCP, MCP Apps, AG-UI, OAuth tokens, generated views, or browser state creates AMTECH assignment authority.

## Streaming-first UX contract

- Hermes text deltas and safe activity are forwarded immediately when the runtime supports run events.
- Starting a run is an effectful boundary: stream loss polls the same run; it does not create another run.
- Durable work/messages remain authoritative and repopulate the Web employee OS after reconnect.
- Web, AG-UI, and MCP Apps may be richer than a terminal—workspaces, apps, approvals, artifacts, proof, recovery—but may not be slower through avoidable buffering or artificially restricted discovery.

## Source/CI closure

### P0-C1 — Manifest-driven connector setup

Accepted for source/CI:

- browser setup derives from declarative connector descriptors;
- unknown setup fails closed;
- provider-specific authorization protocols remain honest;
- broad categories do not select provider/tool/scope/host/credential mode;
- connector binding and verification freshness participate in effective capability.

Still open: live authorization, revocation, scope change, outage, repair, deletion, and exact provider proof.

### P0-C2 — Remote MCP authorization

Accepted for source/CI:

- protected-resource and authorization-server metadata discovery;
- exact resource audience and discovered issuer;
- exact redirect allowlist, authorization-code flow, S256 PKCE, state, and scope intersection;
- no automatic redirects during metadata fetch;
- token type/resource/scope/expiry validation;
- sealed Manager access/refresh token custody.

Still open: disposable remote authorization-server exchange, rotation/revocation, DCR/CIMD provider-specific evidence, and exact-candidate proof.

### P0-C3 — MCP Apps host

Accepted for source/CI:

- negotiated `ui://` resource and MCP App MIME/profile metadata;
- SHA-256 content binding;
- opaque-origin `allow-scripts` sandbox without same-origin or direct network;
- bounded host methods and finite `amtech.surface.intent` JSON-RPC;
- assignment/version/resource/action projection;
- under-scoped resources render display-only;
- actions return through existing native Manager boundaries.

Still open: third-party compliant host matrix, live CSP/permissions behavior, and provider-backed consequence/proof evidence.

### P1-C4 — AG-UI adapter

Accepted for source/CI:

- ordered RUN, TEXT, STATE, and ACTIVITY mapping;
- stable run/message IDs and sequence numbers;
- first-party authenticated SSE route with no buffering;
- assignment/authority-version scope on every frame;
- scope drift terminates the connection;
- finite client command shapes return through approval or owner-message authority.

Still open: fixture-free third-party client, reconnect/resume token strategy, duplicate-network delivery, stale delta and revocation race acceptance.

### P0-C5 — Effective capability truth

Accepted for source/CI:

- advertisement, runtime report, dependency, credential, network, policy, entitlement, authority version, connector readiness, live probe, and freshness are independent dimensions;
- missing legacy dimensions remain source-compatible but fail closed;
- evidence reports are persisted with authority/freshness/failed dimensions;
- MCP execution interceptor runs after credential verification and before Manager tool dispatch;
- bootstrap/repair tools remain available to prevent recovery deadlock.

Still open: release-bound reconciliation against real connector/provider lifecycle and managed database evidence.

## Verification

Implementation head `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4` passed Standard `29731384034`, Hermes `29731384166`, and Main Integration `29731384039`, including broad 109/630, build, archaeology, and compiled Chromium.

Release acceptance additionally requires the live connector/protocol/provider/browser evidence above. Source/CI acceptance is not production acceptance.