# Proposed AMTECH Standard Amendment — UI, Runtime Protocols, Roles, and Assignment Partitioning

**Status:** proposed for human-operator approval; not independently effective  
**Date:** 2026-07-19  
**Applies to:** `mvp-build/STANDARD.md`  
**Research and implementation record:** `../docs/ui/AMTECH_AI_EMPLOYEE_UI_RUNTIME_DEEP_DIVE_2026-07-19.md`

This amendment exists because the canonical Standard correctly defines multi-account, multi-role, and shared/fractional labor, but the current UI/runtime implementation does not yet satisfy those claims end to end. It also aligns the typed work-event grammar with the implemented `observe` move and formally separates owner, public, and privileged operator runtime surfaces.

No clause below upgrades current implementation evidence. Approval makes the clauses normative; implementation and exact-SHA proof are still required.

---

## Amendment A — Typed work-event grammar

Replace AEP-1.2.5 and references to `silent` as a work move with:

### AEP-1.2.5 — Typed work-event grammar

Work events MUST use the following small typed grammar:

- `observe` — durable ambient state that is useful in context but creates no active work, interruption, authority request, or external effect;
- `notify` — useful information that may be surfaced but requires no immediate response;
- `question` — one concrete missing fact or human judgment;
- `review` — an authorized decision is required before a consequential transition.

`observe` and `notify` MUST NOT manufacture an active work loop or resurfacing obligation merely because a record exists. `observe` MUST remain available as durable evidence or a meaningful system change.

`question` and `review` MUST identify the exact assignment, target, required actor/role, next action, expiry when applicable, and proof references.

The phrase “silent event” MAY remain as a notification-policy concept, but it MUST NOT name a fifth work-event move unless a versioned protocol revision defines it.

---

## Amendment B — Runtime protocol hierarchy

Add:

### AEP-1.5 — Runtime Integration Protocol Contract

#### AEP-1.5.1 — Manager owns the runtime boundary

All browser, SMS, signed Review, public employee, connector, and operator interactions MUST enter the runtime through Manager or a Manager-authorized adapter.

A runtime-native API, WebSocket, stdio process, TUI gateway, ACP endpoint, CLI command, tool registry, or MCP server MUST NOT become an alternate authority, assignment, approval, C3, connector-custody, billing, or proof path.

#### AEP-1.5.2 — Protocol selection

AMTECH MUST use the narrowest runtime protocol that satisfies the consumer:

- HTTP/SSE API for ordinary Manager-to-runtime work execution and lifecycle discovery;
- TUI-gateway JSON-RPC only for privileged, Manager-mediated operator or development functions requiring richer runtime control;
- ACP only for approved IDE consumers;
- in-process runtime embedding only inside an explicitly controlled service boundary.

Protocol choice MUST be recorded with runtime version, feature discovery, security assumptions, and fallback behavior.

#### AEP-1.5.3 — Capability discovery

Runtime capability discovery MUST be treated as a lifecycle reconciliation probe, not an authorization source or continuous telemetry stream.

It SHOULD occur:

1. after provisioning and route acceptance;
2. after restart, replacement, restore, repair, or credential rotation;
3. at new runtime-session establishment;
4. after protocol-not-supported responses;
5. after approved image/profile upgrades.

The effective capability graph MUST be the intersection of runtime support, installed toolsets, profile/package, Manager schemas, assignment grants, connector custody, approval policy, entitlement, budget, and runtime health.

A runtime capability or toolset MUST NOT expand authority.

#### AEP-1.5.4 — Capability evidence

Lifecycle probes SHOULD create a durable, versioned evidence record containing:

- runtime endpoint and employee;
- assignment where the runtime is assignment-specific;
- runtime image/version and profile checksum/version;
- checked time and trigger;
- capability payload hash;
- Manager-filtered effective capability graph hash;
- missing/degraded endpoints;
- acceptance result.

The owner UI MAY show a safe freshness/status summary. Raw endpoint details remain operator-only.

---

## Amendment C — Snapshot and delta UI protocol

Add:

### AIP-3.4 — State Projection Stream

A role-safe employee UI MUST use a snapshot/delta protocol with explicit synchronization semantics.

Required behavior:

1. a complete validated snapshot establishes one known state and version/cursor;
2. ordered deltas update that state;
3. reconnect retrieves or receives a fresh snapshot when continuity is uncertain;
4. reconnect MUST NOT replay an owner command;
5. duplicate, stale, out-of-order, cross-assignment, or unknown-version deltas MUST fail closed or trigger resynchronization;
6. transient progress MUST NOT be treated as durable work or effect completion;
7. terminal completion MUST agree with durable command/effect and receipt state.

If Manager sends a complete initial snapshot, the browser SHOULD install it directly rather than issue a redundant second snapshot read, unless schema or authorization validation requires a new read.

### AIP-3.5 — Stream authorization lifetime

A long-lived stream MUST NOT rely indefinitely on one connection-time authorization decision.

The implementation MUST either:

- revalidate session, principal authority version, assignment, role/grant/policy, and resource scope during the stream; or
- terminate the stream within a bounded interval and require a fresh authorization decision.

Consequential or sensitive role surfaces SHOULD terminate immediately on relevant authority-version changes.

Owner/session credentials SHOULD NOT appear in URL query strings. Internal headers or short-lived scoped stream tickets SHOULD be used.

### AIP-3.6 — Runtime event reduction

Raw runtime reasoning, token streams, stdout/stderr, tool arguments, credentials, process identifiers, CPU/RSS, private memory, prompts, and provider payloads MUST NOT enter ordinary owner or public surfaces.

Manager MUST reduce runtime events into stable owner-safe or role-safe categories such as:

- work progress;
- work event;
- decision/approval state;
- system change;
- active save/return condition;
- evidence/receipt;
- runtime recovery state.

A separate operator plane MAY expose bounded redacted diagnostics under platform authority and retention policy.

---

## Amendment D — Viewer context and role-safe materialization

Add:

### AEP-1.6 — Viewer Context Contract

Every authenticated human materialization MUST compile a versioned `ViewerContext` or equivalent containing:

- principal identity and class;
- account and exact assignment;
- current relationship roles;
- current resource grants/actions;
- current authority and session versions;
- projection policy version;
- permitted detail level;
- provenance and decision evidence.

The browser MUST NOT infer viewer role or authority from route, query string, component state, account membership label, or employee ownership assumption.

The same durable work object MAY produce different role-safe projections for owner, manager, finance, reviewer, viewer, or platform operator.

Role projection MUST be covered by positive and negative tests.

### AEP-1.6.1 — Current role-claim restriction

Until a real browser session path exists for a relationship role and passes assignment/grant/policy tests, the product MUST NOT claim that role as a supported browser perspective.

An account role and an assignment relationship role MUST NOT be conflated.

---

## Amendment E — Assignment partitioning and shared employees

Replace the v0.1 approximation language in AEP-1.1.2/AEP-1.1.4 with the following additional hard gate:

### AEP-1.1.7 — Assignment-partitioned context and runtime

A shared, fractional, managed, delegated, or cross-account employee MUST NOT enter production until every data and execution class is explicitly partitioned or shared by grant.

The proof matrix MUST cover:

- prompt/profile overlays;
- durable memory and user/business facts;
- transcript sessions and compression lineage;
- artifacts, messages, work objects, approvals, and reminders;
- connectors and credentials;
- capability discovery/cache/evidence;
- runtime endpoint, container/network, filesystem, and sandbox;
- Model Gateway identity, provider usage, and fallback;
- metering, payer, beneficiary, and accounting;
- audit, retention, export, deletion, recovery, and backup.

If any class remains keyed only by employee or by account + employee when exact assignment isolation is required, multiple active business assignments on one runtime MUST fail closed.

### AEP-1.1.8 — Safe near-term shared identity model

AMTECH MAY expose one platform employee identity through separate assignment-specific runtime instances. Each runtime MUST have separate context, memory, credentials, network, work state, capability evidence, and billing attribution.

Cross-assignment learning requires an explicit sanitized shared-resource grant and durable provenance.

---

## Amendment F — Privileged operator/TUI materialization

Add:

### AIP-5 — Privileged Runtime Operator Surface

An AMTECH-owned operator surface MAY consume selected Hermes TUI-gateway methods and events only through a Manager-mediated adapter.

Every operator operation MUST include:

- authenticated platform operator principal;
- support/incident/change reason;
- exact employee, assignment, runtime endpoint, and session/run target;
- allowed method and bounded parameters;
- C3 command/effect classification when state-changing;
- approval when required;
- audit, retention, and result evidence.

Phase-one read materializations MAY include:

- runtime/session status;
- usage;
- delegation status;
- redacted session lineage/history;
- command catalog compatibility;
- reduced tool lifecycle;
- capability diff;
- recovery state.

Manager-mediated actions MAY include:

- interrupt exact run/session;
- compress exact session;
- interrupt exact delegated unit;
- resolve an existing AMTECH approval or question through the authorized record.

The operator surface MUST NOT directly expose or execute:

- arbitrary `cli.exec`;
- unrestricted `command.dispatch`;
- model/provider switching;
- config/environment mutation;
- raw secret or sudo responses;
- unrestricted process control;
- direct prompt submission outside C3;
- unrestricted filesystem/terminal output;
- arbitrary tool enablement;
- direct browser-to-Hermes credentials or WebSocket URLs.

Operator UI is a diagnostic and repair projection, not a second product control plane.

---

## Amendment G — Public employee surfaces

Add:

### AIP-6 — Public AI Employee Surface

An AI-employee-as-website MUST use a separate public assignment or policy scope. Public visitors MUST NOT be treated as owners or inherit owner context.

The public surface MUST define:

- visitor identity/session and abuse controls;
- allowlisted intents and data classes;
- public-only context and memory policy;
- effect and approval boundaries;
- owner/human handoff;
- durable work object and proof;
- cost/rate limits;
- retention and deletion policy.

Owner-private business brain, customer data, internal pricing, work queues, credentials, raw tools, and private evidence MUST NOT be exposed.

---

## Amendment H — Validation gates

Add the following non-waivable UI/runtime vectors:

| Vector | PASS requirement |
|---|---|
| LUI-AUTH-01 | login and account selection bind one real account and current principal/authority version |
| LUI-AUTH-02 | cross-account snapshot, stream, command, output, and review requests fail before runtime/provider access |
| LUI-ROLE-01 | each claimed browser role has positive and negative role-projection proof |
| LUI-STATE-01 | initial snapshot and ordered deltas converge; reconnect does not replay |
| LUI-STATE-02 | `observe` remains evidence but creates no work/interrupt obligation |
| LUI-RUNTIME-01 | not-started, started, stalled, recovering, and terminal states are distinguishable |
| LUI-RUNTIME-02 | runtime recovery preserves one durable intent and no duplicate effect |
| LUI-RECEIPT-01 | completed consequential work has accepted provider/accounting/audit evidence |
| LUI-SHARED-01 | shared employee assignment partitions every required context/runtime class, otherwise fail closed |
| LUI-OPERATOR-01 | TUI/operator adapter is Manager-mediated and method-allowlisted |
| LUI-UX-01 | keyboard, target size, reduced motion, mobile overflow, and production performance budgets pass |
| LUI-LIVE-01 | fixture-free packets exist on the exact deployed SHA |

`blocked`, `not_run`, fixture-only, or manually asserted status MUST NOT count as PASS.

---

## Current implementation conformance

### Source-wired or CI-shaped

- Manager-owned HTTP/SSE runtime integration;
- cached runtime capability discovery and invalidation;
- deterministic operating primitives and layout;
- stable owner intent IDs;
- assignment-aware owner authorization and C3 owner turns;
- sandboxed MCP Apps;
- fixture-only operator/heartbeat concepts;
- quiet `observe` projection correction;
- bounded owner-stream reauthorization mitigation;
- compiled fixture browser gate;
- canonical dashboard correction and widened source validation.

### Blocked or incomplete

- approved real staging environment and fixture-free packet;
- general manager/viewer/finance browser sessions and role projections;
- assignment-partitioned shared/fractional employee runtime;
- immediate Manager-side stream revocation;
- private-hop query-token removal;
- durable lifecycle capability-probe evidence;
- shared progress bus or explicit best-effort contract;
- direct installation of SSE snapshot;
- privileged TUI adapter implementation and acceptance;
- public AI-employee-as-website production policy and packet;
- real clothing-operations connectors and receipts.

Approval of this amendment does not waive those gaps.
