# Hermes Programmatic Integration and WebUI Findings

Status: active decision record  
Updated: 2026-07-19  
Scope: Hermes Agent programmatic surfaces, Hermes messaging MCP server, third-party Hermes WebUI architecture, generated-view congruence, and the AMTECH production boundary

## Decision Summary

AMTECH should not adopt another agent runtime or expose Hermes directly to an owner browser. Manager remains the control plane and Hermes remains the runtime substrate.

The release path stays:

```text
owner/browser/channel
-> Manager identity + exact assignment + role/grant/policy
-> C3 command/effect and approval boundary
-> Manager-mediated Hermes HTTP/SSE runtime
-> connector/provider effect
-> durable receipt, projection, repair, metering, and proof
```

The useful external findings are implementation invariants, not a replacement architecture:

1. keep runtime protocol, persisted state, projection, renderer, and tests congruent;
2. bind every live stream to explicit ownership and cancellation/recovery semantics;
3. read runtime/session stores through bounded read-only projections;
4. fail closed when loaded runtime source identity drifts;
5. keep extensions local, bounded, allowlisted, separately consented, and outside authority;
6. reserve richer Hermes control protocols for a Manager-mediated operator surface;
7. never confuse an MCP-exposed capability with AMTECH assignment, approval, or effect authority.

## Source Disposition

### Official Hermes Agent programmatic surfaces

The current official programmatic-integration guide documents three general external surfaces:

- ACP over stdio for editors and IDEs;
- the TUI gateway over JSON-RPC for rich custom hosts;
- the OpenAI-compatible HTTP/SSE API for web services and language-neutral consumers.

Issue `NousResearch/hermes-agent#360` was closed after those surfaces covered the proposed general RPC use cases. The issue closure maps prompt, steering, interrupt, compression, history, approval, clarification, and model switching onto those shipped protocols.

### Hermes as an MCP server: verified command, corrected semantics

Hermes now also ships a separate messaging-channel MCP bridge.

The verified command is:

```text
hermes mcp serve
```

It is **not** `hermes serve-mcp`. The examined CLI parser accepts `serve`, `--verbose`, and the shared hook-acceptance flag. The examined implementation starts a FastMCP server over **stdio only**. It does not expose the claimed `--transport http` or `--port 8000` options.

The server does not generically expose Hermes' full native tool registry. It exposes a fixed messaging bridge surface:

- `conversations_list`;
- `conversation_get`;
- `messages_read`;
- `attachments_fetch`;
- `events_poll`;
- `events_wait`;
- `messages_send`;
- `channels_list`;
- `permissions_list_open`;
- `permissions_respond`.

Its process reads gateway conversations and message history from the Hermes state/session stores. It maintains event cursors and observed approvals in memory. `messages_send` invokes the Hermes send-message tool directly. `permissions_respond` is explicitly best-effort without gateway IPC: it removes an observed approval from the bridge-local map and emits a bridge-local resolution event, so it is not a durable approval authority.

AMTECH disposition:

- **Do not expose this server to owners, browsers, tenant users, or ordinary employee workflows.**
- **Do not route `messages_send` or `permissions_respond` around Manager, exact assignment, C3, approval, receipts, or revocation.**
- **Do not treat its in-memory cursor, pending-approval map, or resolution event as durable runtime truth.**
- A future platform-operator experiment may wrap a dedicated employee's stdio process and allowlist read-only conversation/history/event methods, but only behind platform authority, tenant/runtime isolation, redaction, bounded output, immutable audit, and independent Manager verification.
- HTTP exposure, remote authentication, broad tool filtering, and production tenancy must not be inferred from the current stdio implementation.

### `nesquena/hermes-webui`

This is a useful third-party implementation reference, not AMTECH runtime authority. It is designed primarily as a lightweight self-hosted browser equivalent of the Hermes CLI and openly documents single-user and concurrency limitations that make direct production reuse inappropriate for AMTECH.

### `jozef-barton/the-kitchen` commit `43adc3efe23c11aa32e295d21b31c006750187bd`

This commit is relevant in one narrow way: it repaired drift between the LLM-produced protocol schema, template registry, gallery preview types, live renderer, and tests. It did not introduce a new authority model. The transferable invariant is that every declared generated section kind must have one compatible runtime renderer and representative fixture/test output.

## Protocol Choice for AMTECH

| Surface | AMTECH disposition | Reason |
|---|---|---|
| Hermes HTTP/SSE API | Keep for ordinary employee turns | Language-neutral, already compatible with the Manager-mediated owner path, and does not require browser credentials or direct runtime authority. |
| Hermes TUI gateway JSON-RPC | Research a narrow operator adapter | Rich state/control vocabulary is useful for exact-run inspection, interrupt, compression, and recovery, but only behind platform authority, C3, redaction, and immutable audit. |
| `hermes mcp serve` messaging bridge | Verified; do not adopt directly | Stdio-only, process-authority bridge across gateway conversations; includes direct messaging and non-durable best-effort approval tools. A future read-only operator wrapper may be evaluated after live baseline. |
| ACP | Do not use for ordinary owner/product UI | It is optimized for IDE/editor hosts and adds no launch-critical owner capability. |
| In-process `AIAgent` embedding | Reject for the production Manager | It couples Python module identity and process-global/thread context to the web server and increases mixed-revision, concurrency, and restart risk. |
| Direct browser-to-Hermes | Reject | It bypasses exact assignment, grants, approvals, C3, commercial attribution, revocation, and release evidence. |
| `hermes serve-mcp --transport http --port 8000` | Reject as an invalid current contract | The verified syntax and implementation are `hermes mcp serve` over stdio. |

## Hermes MCP Bridge Findings Worth Adapting

### 1. One durable session store should own routing and messages

The bridge now builds its routing index from gateway rows in `state.db`, falling back to the legacy JSON index only for older databases. Its event poller uses the same database-file change signal for routing and messages, explicitly avoiding a prior dual-file race that could miss newly created conversations.

AMTECH interpretation:

- exact employee/runtime/channel routing and accepted message/effect state must converge in durable Manager-owned records;
- a projection should not join independently lagging indexes when one authoritative transaction boundary can exist;
- legacy fallback must remain visible, bounded, and removable rather than silently becoming a second authority.

### 2. MCP tools require a second AMTECH authority layer

The bridge's fixed MCP tools are capability exposure, not assignment or policy enforcement. The process can enumerate active conversations under its Hermes home, read messages, identify targets, and send outbound messages.

AMTECH interpretation:

- every imported MCP method is denied by default;
- tool discovery never implies an owner or operator may call the tool;
- Manager must bind principal, account, assignment, runtime, target, purpose, approval, payer/beneficiary, authority version, idempotency key, and receipt before any consequential call;
- read-only operator projections should return Manager-owned normalized DTOs, not raw session keys, provider payloads, or unrestricted transcripts.

### 3. Process-local events are liveness, not proof

The MCP bridge keeps a bounded in-memory event queue, process-local cursor, waiter event, and observed-approval map while polling the SQLite state store.

AMTECH interpretation:

- bridge cursor continuity cannot prove durable event continuity across restart;
- pending approvals must be reconstructed from Manager's durable approval/effect state;
- reconnect begins from a durable snapshot/version and can use process-local events only as a low-latency hint;
- no completion, approval, or external effect is accepted without durable receipt/proof.

### 4. Approval adapters must not pretend to resolve authority

The examined `permissions_respond` path is best-effort and does not communicate a decision back through gateway IPC. It records only a bridge-local resolution result.

AMTECH interpretation:

- do not use this method for AMTECH approvals;
- a future adapter must map one exact Manager approval to one C3 command/effect, target the accepted runtime request, and persist the provider/runtime acknowledgement or a repairable failure;
- UI must not show an approval as complete because an adapter removed it from local memory.

## Hermes WebUI Findings Worth Adapting

### 1. Runtime revision identity must fail closed

`api/agent_runtime.py` captures the Git revision that supplied the loaded `run_agent` module and refuses to continue after the checkout changes under the running process. This prevents a process from mixing cached Python modules with newly read source.

AMTECH interpretation:

- production runtime images remain immutable and digest/SHA identified;
- capability evidence must include runtime protocol/version identity;
- a running employee must not silently continue after incompatible runtime source drift;
- replacement happens through reconciler-owned rotation/reprovisioning, not hot source mutation.

### 2. Session projection is a read model, not authority

`api/agent_sessions.py` opens the live SQLite state database read-only for projections, refuses to create a ghost database when the path is missing, normalizes raw source values, excludes background/subagent rows from writable interactive treatment, and collapses compression/continuation chains into one logical visible conversation while retaining the latest importable tip.

AMTECH interpretation:

- future operator session views should use read-only, bounded, compatibility-aware projections;
- raw Hermes source/session identifiers must normalize into a stable Manager-owned vocabulary;
- compression segments, retries, child/subagent runs, and transport sessions must not become duplicate owner work objects;
- runtime session visibility never grants assignment or action authority;
- owner views should project durable work and proof, while operator views may expose bounded lineage metadata.

### 3. Stream ownership must outlive the transport

Hermes WebUI separates turn start from SSE attachment, retains stream ownership state, handles browser disconnects, and documents recovery/cancellation behavior. It also demonstrates why in-memory ownership alone is insufficient across reloads or process loss.

AMTECH interpretation:

- C3 intent/command/effect state remains the durable turn owner;
- transport heartbeat is liveness only;
- reconnect installs a current snapshot and resumes from a cursor/version rather than replaying effects;
- interrupt targets one exact accepted run and leaves a durable terminal or repairable state;
- browser disconnect never implies command cancellation or successful completion.

### 4. Extension systems need strict trust boundaries

`api/extensions.py` defaults to local same-origin assets, rejects arbitrary external URLs and traversal, bounds manifests/state/downloads, uses allowlisted redirect hosts, persists state atomically, and separately records sidecar proxy consent. The same code also acknowledges that loaded extension code can carry full session authority.

AMTECH interpretation:

- ordinary owner UI continues to use registered native components and sandboxed MCP-UI resources, never arbitrary extension scripts;
- generated UI remains data-only and Manager-compiled;
- any future operator extension/sidecar model requires explicit installation authority, immutable package identity, least-privilege capability grants, separate network consent, revocation, audit, and no inherited owner session authority;
- no extension gallery or arbitrary script injection is Tuesday scope.

### 5. Single-user WebUI assumptions are not production tenancy

The WebUI architecture documents process-global environment mutation and historical single-concurrent-user assumptions. Its full CLI toolset and local workspace model are useful for a personal agent UI but do not implement AMTECH principal, organization, assignment, connector custody, approval, payer/beneficiary, or tenant-isolation rules.

Disposition: borrow bounded techniques; do not embed or fork the application as the AMTECH owner client.

## Generated-View Congruence Invariant

The generated UI chain must be one finite contract:

```text
WorkView union
-> exhaustive Manager renderer registry
-> owner-safe HTML compiler
-> sandboxed host renderer
-> approval-bound intent bridge
-> representative contract fixtures
-> focused UI CI path
```

A new `WorkView.kind` must fail typecheck until a renderer is registered. Every registered kind must compile in contract tests. Preview/gallery/fixture output must use the same compiler as the live path; mock-only visual sections cannot claim runtime support.

## Implemented in This Pass

- made adaptive focus-loop selection independent of input order using explicit state precedence, recency, and stable ID tie-breaking;
- bounded volume bonuses so high-volume low-risk changes cannot displace governance-critical work;
- added explicit rationale and precedence for high-risk owner decisions, reached active-save return conditions, and material delegated failures;
- replaced the generated-view switch with an exhaustive typed renderer registry;
- aligned Manager-owned generated HTML with the canonical light surface, AMTECH-red primary action, 44px minimum controls, visible focus, and reduced-motion behavior;
- added contract coverage for every declared `WorkView` kind and canonical generated-surface styling;
- added generated-view tests to `test:ui:contracts`;
- expanded the UI workflow path filter so generated-view compiler and contract-test changes trigger the exact UI gate;
- repaired the compiled Next standalone-server discovery path;
- fixed the browser-discovered undersized login brand link without weakening the 44px assertion.

The implementation scope is `ci-accepted` on SHA `34f67dd4bd3d2a944fd036ca7e818f0857ba9e0e`, including source/type/build contracts and the compiled adaptive fixture plus unauthenticated login/dashboard browser matrices. This does not establish provider-backed generative UI, real staging, fixture-free live browser/channel acceptance, or production readiness.

## Deferred, Worthy Follow-On

1. Persist runtime capability-probe evidence with protocol version, runtime image/SHA, effective-capability graph hash, observed time, and invalidation reason.
2. Define a read-only Manager `RuntimeSessionProjection` that normalizes source, lineage root/tip, state, last activity, compression, delegation, and bounded transport health without exposing transcript secrets or granting authority.
3. Design-spike a Manager-mediated TUI adapter limited initially to read-only state/history/capability/recovery materializations.
4. Separately evaluate a dedicated-runtime, read-only wrapper around `hermes mcp serve`; deny `messages_send` and `permissions_respond`, verify tenant/runtime isolation, and treat event cursors as non-durable hints.
5. Add exact-run interrupt/compress only after platform authority, C3 command/effect semantics, stale-version denial, and duplicate-effect tests exist.
6. Add cursor/version divergence handling and immediate stream authority-version close on the owner SSE path.

## Explicit Rejections for Tuesday

- direct owner/public TUI gateway or Hermes MCP access;
- direct browser-to-Hermes credentials;
- in-process Hermes inside Manager;
- arbitrary CLI or slash-command forwarding;
- unrestricted session switching, model mutation, environment mutation, filesystem/process control, prompt submission, message sending, or approval response outside C3;
- raw Hermes WebUI extension scripts in owner pages;
- raw runtime logs, private reasoning, memory/profile file editing, or subagent transcripts as owner UI;
- treating `hermes mcp serve` as an HTTP service, authenticated multi-tenant API, durable event ledger, or approval authority;
- importing the-kitchen recipe vocabulary into AMTECH without an AMTECH work-state requirement.

## Acceptance Boundary

This record promotes no research concept to production acceptance. The normal-employee release still requires approved real Supabase migration/behavior evidence, distinct runtime isolation, fixture-free owner/browser/channel packets, provider-backed work and effects, durable receipts, recovery, commercial reconciliation, capacity, rollback, and exact deployed-SHA proof.
