# Hermes Programmatic Integration and WebUI Findings

Status: active decision record  
Updated: 2026-07-19  
Scope: Hermes Agent programmatic surfaces, third-party Hermes WebUI architecture, generated-view congruence, and the AMTECH production boundary

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
6. reserve richer Hermes control protocols for a Manager-mediated operator surface.

## Source Disposition

### Official Hermes Agent

The current official programmatic-integration guide documents three external surfaces:

- ACP over stdio for editors and IDEs;
- the TUI gateway over JSON-RPC for rich custom hosts;
- the OpenAI-compatible HTTP/SSE API for web services and language-neutral consumers.

Issue `NousResearch/hermes-agent#360` was closed after those surfaces covered the proposed RPC use cases. The issue closure explicitly maps prompt, steering, interrupt, compression, history, approval, clarification, and model switching onto those shipped protocols.

### `hermes serve-mcp` claim

No `hermes serve-mcp` command was found in the current official programmatic-integration guide or in the examined Hermes Agent repository search. Hermes supports consuming configured MCP servers, but that does not prove that Hermes itself ships as an MCP server.

Disposition: **do not configure, document, deploy, or build around `hermes serve-mcp` unless an exact official command, source path, version, and protocol contract are later verified.**

### `nesquena/hermes-webui`

This is a useful third-party implementation reference, not AMTECH runtime authority. It is designed primarily as a lightweight self-hosted browser equivalent of the Hermes CLI and openly documents single-user and concurrency limitations that make direct production reuse inappropriate for AMTECH.

### `jozef-barton/the-kitchen` commit `43adc3efe23c11aa32e295d21b31c006750187bd`

This commit is relevant in one narrow way: it repaired drift between the LLM-produced protocol schema, template registry, gallery preview types, live renderer, and tests. It did not introduce a new authority model. The transferable invariant is that every declared generated section kind must have one compatible runtime renderer and representative fixture/test output.

## Protocol Choice for AMTECH

| Surface | AMTECH disposition | Reason |
|---|---|---|
| Hermes HTTP/SSE API | Keep for ordinary employee turns | Language-neutral, already compatible with the Manager-mediated owner path, and does not require browser credentials or direct runtime authority. |
| Hermes TUI gateway JSON-RPC | Research a narrow operator adapter | Rich state/control vocabulary is useful for exact-run inspection, interrupt, compression, and recovery, but only behind platform authority, C3, redaction, and immutable audit. |
| ACP | Do not use for ordinary owner/product UI | It is optimized for IDE/editor hosts and adds no launch-critical owner capability. |
| In-process `AIAgent` embedding | Reject for the production Manager | It couples Python module identity and process-global/thread context to the web server and increases mixed-revision, concurrency, and restart risk. |
| Direct browser-to-Hermes | Reject | It bypasses exact assignment, grants, approvals, C3, commercial attribution, revocation, and release evidence. |
| `hermes serve-mcp` | Unverified; reject as a dependency | No current official command/source contract was established. |

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
- expanded the UI workflow path filter so generated-view compiler and contract-test changes trigger the exact UI gate.

These are source/CI candidates only until the exact-head workflow passes. They do not establish provider-backed generative UI, real staging, fixture-free browser acceptance, or production readiness.

## Deferred, Worthy Follow-On

1. Persist runtime capability-probe evidence with protocol version, runtime image/SHA, effective-capability graph hash, observed time, and invalidation reason.
2. Define a read-only Manager `RuntimeSessionProjection` that normalizes source, lineage root/tip, state, last activity, compression, delegation, and bounded transport health without exposing transcript secrets or granting authority.
3. Design-spike a Manager-mediated TUI adapter limited initially to read-only state/history/capability/recovery materializations.
4. Add exact-run interrupt/compress only after platform authority, C3 command/effect semantics, stale-version denial, and duplicate-effect tests exist.
5. Add cursor/version divergence handling and immediate stream authority-version close on the owner SSE path.

## Explicit Rejections for Tuesday

- direct owner/public TUI gateway access;
- direct browser-to-Hermes credentials;
- in-process Hermes inside Manager;
- arbitrary CLI or slash-command forwarding;
- unrestricted session switching, model mutation, environment mutation, filesystem/process control, or prompt submission outside C3;
- raw Hermes WebUI extension scripts in owner pages;
- raw runtime logs, private reasoning, memory/profile file editing, or subagent transcripts as owner UI;
- an unverified Hermes-as-MCP-server dependency;
- importing the-kitchen recipe vocabulary into AMTECH without an AMTECH work-state requirement.

## Acceptance Boundary

This record promotes no research concept to production acceptance. The normal-employee release still requires approved real Supabase migration/behavior evidence, distinct runtime isolation, fixture-free owner/browser/channel packets, provider-backed work and effects, durable receipts, recovery, commercial reconciliation, capacity, rollback, and exact deployed-SHA proof.
