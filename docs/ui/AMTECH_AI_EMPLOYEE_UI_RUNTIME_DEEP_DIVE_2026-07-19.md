# AMTECH AI Employee UI and Runtime Deep Dive

**Status:** active production-readiness research and implementation review  
**Date:** 2026-07-19  
**Branch:** `employee-production-tuesday`  
**Target:** production-shaped live UI testing across distinct employees and accounts without overstating shared-labor or role support

## 1. Product thesis

AMTECH is not a chat frontend for Hermes. It is a system for creating, deploying, assigning, operating, supervising, repairing, measuring, and commercializing persistent AI employees.

The product boundary is:

```text
public visitor, owner, admin, authorized reviewer, or AMTECH operator
-> web/SMS/signed/public surface
-> authenticated identity and relationship resolution
-> exact employee assignment, resource grant, policy, and authority version
-> durable intent and C3 command/effect state
-> Manager work orchestration and projection
-> assignment-owned runtime route
-> Hermes agent/session/tool substrate
-> Model Gateway, Manager MCP, connectors, and sandboxes
-> provider/runtime receipts
-> durable work state, evidence, metering, repair, and role-safe materialization
```

Manager is the labor control plane. Hermes is one replaceable runtime substrate.

## 2. Authoritative research basis

Hermes claims in this review are grounded only in official Nous Research documentation and the `NousResearch/hermes-agent` repository:

- Programmatic Integration: https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration
- Agent Loop Internals: https://hermes-agent.nousresearch.com/docs/developer-guide/agent-loop
- Prompt Assembly: https://hermes-agent.nousresearch.com/docs/developer-guide/prompt-assembly
- Toolsets Reference: https://hermes-agent.nousresearch.com/docs/reference/toolsets-reference
- Tools Reference: https://hermes-agent.nousresearch.com/docs/reference/tools-reference
- MCP Config Reference: https://hermes-agent.nousresearch.com/docs/reference/mcp-config-reference
- Security: https://hermes-agent.nousresearch.com/docs/user-guide/security
- TUI: https://hermes-agent.nousresearch.com/docs/user-guide/tui
- Desktop: https://hermes-agent.nousresearch.com/docs/user-guide/desktop
- repository: https://github.com/NousResearch/hermes-agent

Relevant UI and human-agent research:

- Horvitz, *Principles of Mixed-Initiative User Interfaces*, CHI 1999.
- Magentic-UI, 2025: human-in-the-loop mechanisms including co-planning, co-tasking, action guards, and memory.
- AG-UI official protocol: typed lifecycle, message, tool, state snapshot/delta, and activity events.
- MCP Apps official extension: sandboxed `ui://` resources, host-controlled capabilities, and `postMessage` isolation.
- recent agent-UI governance research emphasizing UI as an enforceable transparency and control boundary.

The Medium article supplied by the operator is useful for generating questions, not proving implementation. Claims are rejected when they do not match official source or AMTECH deployment evidence.

## 3. Protocol selection

Hermes exposes three external integration families:

| Protocol | Correct AMTECH use | Incorrect AMTECH use |
|---|---|---|
| HTTP API server + SSE | Manager-to-runtime turns, run status, run events, capabilities, health, stop/approval when Manager policy permits | direct browser authority or raw customer chat backend |
| TUI gateway JSON-RPC | future privileged operator adapter with selected methods/events | owner web protocol, public surface, or alternate control plane |
| ACP | IDE integration when the IDE already speaks ACP | ordinary AMTECH employee surface |

The current Manager HTTP/SSE direction is correct. It provides the narrowest protocol that supports runs, events, capabilities, health, approval, stop, and session fallback without exposing Hermes-native configuration and process controls.

## 4. Hermes runtime facts that matter to AMTECH UI

### 4.1 Agent loop

Hermes is an interruptible iterative state machine. It assembles prompt state, calls a provider, parses text/tool calls, executes tools sequentially or concurrently, appends results, compresses when needed, persists sessions, and may activate provider fallback.

AMTECH UI implications:

- a model response is not the unit of work;
- a tool call is not completion;
- progress is not proof;
- interruption and retry must preserve the durable AMTECH intent;
- run/session lineage must remain inspectable by operators;
- owner UI should display business state, not the raw agent loop.

### 4.2 Prompt assembly and memory

Hermes builds cached stable/context/volatile prompt tiers. MEMORY.md and USER.md are frozen snapshots for a session. Later memory writes do not continuously mutate the existing cached system prompt; a new session or rebuild path is required.

AMTECH UI should display:

- profile/package version;
- doctrine version;
- business-fact provenance and freshness;
- runtime context version;
- session identity and last accepted activity;
- stale-context or rebuild-needed state.

It should not display or live-edit raw system prompts, MEMORY.md, USER.md, SOUL.md, project instruction files, private retrieved episodes, credentials, or reasoning.

### 4.3 Toolsets and MCP

Hermes toolsets are availability bundles. Dynamic MCP servers produce runtime toolsets and can be filtered with include/exclude policies. Availability can also depend on backend checks.

This is not AMTECH authorization. Effective capability is:

```text
Hermes endpoint feature
∩ installed and available toolset
∩ profile/package
∩ Manager tool schema
∩ exact assignment grant
∩ connector custody and health
∩ approval policy
∩ entitlement and budget
∩ runtime health
```

`/v1/capabilities` is already used as a cached lifecycle probe. It should run after provisioning, restart/recovery/replacement, session establishment, protocol mismatch, and approved image/profile upgrades. It should not be polled as live telemetry.

### 4.4 Streaming

Hermes can emit message deltas, tool lifecycle events, status, clarification, approval, and session events. AG-UI similarly recommends snapshots plus ordered deltas.

AMTECH should reduce runtime streams into:

- stable snapshot;
- owner-safe progress verb;
- work event;
- approval/decision state;
- terminal run/receipt state;
- reconnect resynchronization.

Raw tool arguments, stdout/stderr, reasoning, PID, CPU, RSS, credentials, and hidden prompt data belong only in restricted diagnostics, if retained at all.

## 5. Current UI architecture review

### 5.1 Strong decisions

The recent operating surface correctly replaces fixed app tabs with durable primitives:

- work loops;
- active saves and return conditions;
- decisions;
- system changes;
- delegated work;
- evidence;
- contextual command.

The adaptive layout is deterministic, finite, and volume-dampened. It promotes consequential items rather than inferring emotion or hidden psychology.

The browser does not own approval, assignment, connector, C3, or effect authority. Actions re-enter Manager.

MCP Apps are sandboxed and cannot expand action scope.

The fixture lab exercises ambitious shapes through typed production components while remaining visibly simulation-only.

### 5.2 Confirmed defects corrected

#### Quiet observation created false work

The read model treated every event other than `notify` as active work. The new `observe` move therefore manufactured work loops and resurfacing obligations.

Correction: materialization now removes `observe`-derived tasks while retaining the event as durable evidence and a system change.

#### Long-lived owner stream authorization

Manager authorizes an SSE stream only at connection establishment. The Next proxy now bounds each stream lifetime and forces reconnect/re-authorization. This reduces revocation exposure but does not replace immediate Manager-side authority-version revalidation.

#### Dashboard design-system drift

The owner dashboard still used the superseded IBM Plex Mono/black-shell style and 42px controls. It now uses the canonical Inter/light/soft system, 48px actions, focus-visible treatment, and business-facing labels.

The source validator now scans login and dashboard rather than only the new operating surface.

### 5.3 Remaining UX defects

#### Initial snapshot is ignored

Manager sends a complete SSE snapshot, but AgentSurface schedules another `/resources` fetch instead of installing the frame. This adds latency and can create cursor/state mismatch.

Target behavior:

```text
validated snapshot frame
-> atomically replace local state
-> establish cursor/version
-> apply ordered deltas
-> request fresh snapshot only on divergence
```

#### Progress is process-local and best-effort

The Manager progress bus is in-process. Multi-replica or reconnect behavior can lose progress. Correctness must depend on durable snapshots and receipts, not progress frames.

#### Context panel exposes implementation identifiers without role policy

Assignment/session/profile identifiers are useful for support and advanced owners, but role-specific projection is not implemented. The panel needs role-sensitive detail levels before manager/viewer/finance roles are enabled.

#### Surface coherence gate remains incomplete

The compiled browser matrix is strong for AgentSurface, signed Review, and fixture labs. It must add login, dashboard, onboarding, unauthenticated, multi-account selection, expired session, and denied cross-account routes.

## 6. Role and relationship architecture

### 6.1 What the database can model

The relationship schema can represent:

- owners and admins;
- managers, operators, viewers, supervisors, approvers, and finance roles;
- users in multiple accounts;
- shared/fractional employees;
- payers and beneficiaries distinct from owners;
- resource-specific grants.

### 6.2 What the current browser can authenticate

The ordinary owner-session minting path currently requires account membership role `owner` or `admin`.

Therefore production browser claims are currently limited to:

- owner;
- account admin when assignment grants permit;
- exact signed-review resolver;
- separate AMTECH platform-operator path.

The product must not claim a general multi-role office UI yet.

### 6.3 Recommended role-projection model

Do not build separate applications per role. Compile one `ViewerContext` at Manager:

```ts
interface ViewerContext {
  principal_id: string;
  principal_class: "human" | "employee" | "system";
  account_id: string;
  assignment_id: string;
  relationship_roles: string[];
  resource_grants: Array<{ resource_class: string; actions: string[] }>;
  authority_version: number;
  projection_policy_version: string;
  detail_level: "owner" | "manager" | "operator" | "reviewer" | "viewer";
}
```

The same durable work object then compiles into a role-safe projection:

- owner: business consequence, decisions, proof, summarized context;
- manager: team/work status and delegated outcomes, no owner-private credentials;
- finance: money, invoices, approvals, receipts, no unrelated customer content;
- reviewer: one exact resource and allowed action set;
- viewer: read-only status/evidence subset;
- AMTECH operator: runtime/protocol/repair diagnostics under platform authority.

The browser must never infer the role from route, component, or query string.

## 7. Assignment partitioning and shared employees

### 7.1 Current gap

The authorization ontology supports shared employees, but the adaptive context/runtime path is not assignment-partitioned end to end:

- employee manifest lookup is employee-global;
- business-brain facts use account + employee, not exact assignment;
- context-primer session uses account + employee;
- profile and local Hermes memory remain employee/runtime-local;
- runtime endpoint resolution is employee-oriented;
- assignment-specific context deletion, rotation, and capability proof are not demonstrated.

### 7.2 Production rule

Until this is corrected, one live runtime must have one active business assignment. Multiple employees per account are allowed and desirable. One employee shared successfully across accounts is blocked.

Tuesday/live test topology:

```text
Account A -> Employee A1 runtime
Account A -> Employee A2 runtime
Account B -> Employee B1 runtime
```

Required negative test:

```text
Owner A requests Employee B1
-> Manager denies before snapshot, stream, command, runtime, or provider access
```

### 7.3 Future shared-employee architecture

A real fractional employee requires one of two explicit models:

1. **Assignment-isolated runtime sessions and stores**
   - assignment-keyed session, memory, facts, connectors, artifacts, approvals, capability cache, and proof;
   - no cross-assignment retrieval by default;
   - runtime receives a sealed assignment context per run.

2. **One employee identity with per-assignment runtime instances**
   - platform employee identity is shared;
   - each assignment has a separate runtime, profile overlay, memory partition, credentials, and network;
   - cross-assignment learning requires an explicit sanitized shared-resource grant.

For the near term, model 2 is safer and easier to prove.

## 8. Privileged AMTECH TUI gateway adapter

### 8.1 Purpose

A privileged AMTECH-owned surface can use selected Hermes TUI-gateway methods to improve support, runtime inspection, and advanced materialization.

It must sit behind Manager:

```text
AMTECH operator UI
-> platform operator session + support case + reason
-> Manager operator authorization and C3 command
-> assignment/runtime resolver
-> narrow TUI-gateway adapter
-> selected method/event
-> redaction and durable operator evidence
-> operator materialization
```

The browser never receives a direct TUI WebSocket URL or Hermes secret.

### 8.2 Reasonable phase-one methods

Read-only or bounded methods:

- `session.status`;
- `session.history` with strict redaction and retention policy;
- `session.usage`;
- `delegation.status`;
- `session.active_list` only for the resolved runtime process;
- `commands.catalog` for compatibility inspection, not execution;
- selected gateway/session lifecycle events;
- selected tool start/progress/complete metadata after allowlisting and redaction.

Manager-mediated control methods:

- `session.interrupt` for a named active run;
- `session.compress` after a policy decision;
- `subagent.interrupt` for a named delegated unit;
- `approval.respond` only when linked to an existing AMTECH approval and authorized resolver;
- `clarify.respond` only when materialized as a durable AMTECH question.

### 8.3 Prohibited owner/operator shortcuts

Do not expose directly:

- `cli.exec`;
- arbitrary `command.dispatch`;
- `/model` switching;
- `config.set`;
- `reload.env`;
- raw `secret.respond` or `sudo.respond`;
- unrestricted `process.stop`;
- arbitrary `prompt.submit` outside C3;
- raw filesystem or terminal streams;
- unrestricted session branching or activation;
- tools enable/disable as a browser preference.

These would create a second authority/control plane and bypass Manager receipts, policy, cost, and assignment boundaries.

### 8.4 Operator materializations

Useful operator UI objects:

- Runtime Identity Card: employee, assignment, image/profile checksum, endpoint, network, container, session.
- Run Timeline: AMTECH command, Hermes run, reduced tool phases, approval wait, terminal receipt.
- Context Lineage: profile/doctrine version, session lineage, compression/rebuild events, freshness.
- Capability Diff: cached lifecycle probe before/after restart or upgrade, Manager-filtered effective graph.
- Delegation Tree: purpose, assigned executor, context subset, state, result, cost, proof.
- Recovery Panel: unreachable signal, reconciler action, restart/replacement, same-intent proof, no duplicate effect.
- Stream Health: sequence, last frame, reconnect count, reduced/dropped diagnostic events.

These are operator objects, not owner-facing raw Hermes panels.

## 9. Public AI-employee-as-website

A public employee surface is not an unauthenticated owner surface. It is a separate public assignment with a constrained policy and data partition.

Required architecture:

```text
visitor identity/session
-> public employee assignment
-> allowlisted intents and data classes
-> public context only
-> no owner-private business brain or memory
-> no consequential effect without verified handoff/approval
-> durable visitor conversation/work object
-> explicit human/owner escalation
-> abuse, cost, and rate controls
-> proof and retention policy
```

Appropriate public functions:

- answer verified business questions;
- qualify a lead;
- collect bounded intake;
- draft an estimate request;
- schedule only within authorized rules;
- create an owner-review work object;
- expose approved artifacts or status.

Prohibited by default:

- revealing owner memory, customer lists, internal prices, credentials, raw tools, or work queue;
- sending messages, taking payment, committing inventory, or editing systems without the correct public/customer/owner authority chain;
- treating the visitor as the account owner.

## 10. Production use-case evaluation

### 10.1 Contractor operations employee

**Near-term production fit: high.**

Core loop:

```text
lead/customer event
-> estimate/job work loop
-> business-brain and job context
-> draft artifact/message
-> owner question or review when needed
-> approved email/invoice/schedule effect
-> provider receipt
-> active follow-up save
-> evidence
```

Pass requires real email, estimate artifact, approval, provider receipt, follow-up, and cross-account denial.

### 10.2 Clothing operations employee

**Strategic fit: high; current fixture maturity only.**

Required real capabilities:

- Shopify order/event custody;
- SKU/BOM/material requirement model;
- supplier price source and timestamp;
- inventory and work-in-process state;
- production capacity and due-date model;
- purchase authorization and budget;
- fulfillment/shipping connector;
- margin calculation with provenance;
- accepted purchase/fulfillment receipts;
- reconciliation for cancellations, returns, and supplier changes.

The UI should focus on exceptions and decisions:

- orders at risk;
- material shortfall;
- smallest safe purchase;
- capacity conflict;
- margin erosion;
- fulfillment failure;
- evidence after action.

Do not build a generic ERP dashboard before the underlying state and connectors are real.

### 10.3 Multi-person office

**Architecture fit: high; browser-role readiness: blocked.**

The operating surface should show one employee’s work projected for the current role, not a raw multi-agent org chart. Delegation is displayed by purpose/result. Humans receive only the work and actions their relationship grants permit.

### 10.4 Research employee

**Research/controlled production fit: medium.**

Required UI objects:

- research question and decision use;
- source/evidence ledger;
- claim/contradiction matrix;
- delegated searches with bounded scope;
- synthesis and confidence;
- stale-source and missing-source states;
- no hidden chain-of-thought.

### 10.5 Personal operating brain

**Commercial beachhead fit: low; research value: medium.**

Use only explicit preferences, active saves, provenance, and governed integrations. Do not infer personality, fatigue, emotion, or hidden goals.

## 11. Validation model

A useful validation model separates five vector families:

1. **Authority vector** — who can see or act on what.
2. **State vector** — whether the UI matches durable work/receipt state.
3. **Interaction vector** — whether the human can understand, decide, recover, and avoid duplicate action.
4. **Runtime vector** — whether Manager/Hermes/container/stream behavior matches the displayed state.
5. **Experience vector** — accessibility, latency, density, readability, mobile behavior, and task completion.

A vector is PASS only with exact-SHA evidence. `blocked`, `not_run`, fixture, or manually asserted states do not count.

### 11.1 Core live scenarios

#### LUI-01 Owner, Employee A1, normal work

PASS:

- correct account/employee/assignment visible;
- real command accepted once;
- progress never claims completion;
- durable work loop forms;
- evidence links to the same run/assignment;
- refresh/reconnect does not replay.

FAIL:

- wrong employee/context;
- second command/effect on retry;
- completion without receipt;
- raw tool/provider data visible.

#### LUI-02 Multi-account owner selection

PASS:

- login requires explicit account choice;
- session binds one account;
- dashboard shows only authorized employees;
- switching requires a new accepted account session.

FAIL:

- account chosen from query string alone;
- employees from multiple accounts merge;
- stale account session remains usable after authority version change.

#### LUI-03 Cross-account denial

PASS:

- Owner A cannot load Employee B snapshot, SSE, output, review, or command;
- no runtime request occurs;
- denial is durable/auditable where required.

#### LUI-04 Approval and signed Review

PASS:

- exact resolver, assignment, action, expiry, and authority version;
- consequence and target are clear;
- one atomic resolution;
- follow-up uses the same assignment;
- replay fails closed.

#### LUI-05 Runtime interruption/recovery

PASS:

- UI distinguishes not-started, started, stalled, recovering, and terminal;
- owner is told not to resend after accepted start;
- recovery uses the same durable intent;
- no duplicate external effect;
- final state is receipt-backed.

#### LUI-06 Quiet observation

PASS:

- change appears in “What changed” or evidence;
- no active loop, notification burden, or resurfacing obligation is manufactured.

#### LUI-07 Role projection

Current status: BLOCKED for general manager/viewer/finance browser roles.

PASS requires a real role-aware session and different positive/negative projections of the same durable work object.

#### LUI-08 Shared employee

Current status: BLOCKED.

PASS requires assignment-partitioned memory, context, sessions, connectors, runtime, capability, and proof. Until then, multiple active assignments on one runtime must fail closed.

## 12. Pass/fail UX metrics

Measure task outcomes, not aesthetic preference alone:

- time to identify the highest-priority decision;
- time to understand what the employee is doing;
- duplicate-command rate after network interruption;
- wrong-account or wrong-employee navigation rate;
- approval comprehension error rate;
- percentage of completed effects with accessible evidence;
- number of owner interruptions per completed work loop;
- resurfaced item precision;
- stale-context incidents;
- recovery comprehension;
- keyboard-only task completion;
- mobile overflow and target failures;
- initial JS, snapshot bytes, frames/sec, reconnect count, and layout latency.

Do not optimize “engagement,” time-on-page, or notification count.

## 13. Production priorities

### P0

1. Approved real Supabase staging target and migrations through branch head.
2. Fixture-free owner activation and normal employee browser packet.
3. Distinct-employee multi-account denial matrix.
4. Fail closed on shared/fractional runtime use until assignment partitioning is proven.
5. Immediate or bounded stream revocation with exact evidence.
6. End-to-end receipt-backed effect and browser materialization.

### P1

1. Install SSE snapshot directly and add version/cursor checks.
2. Role-aware viewer context and projection policy.
3. Replace private-hop query session token with internal header or short-lived stream ticket.
4. Persist lifecycle capability-probe evidence and effective-graph hash.
5. Define progress as best-effort or move it to a shared bounded bus.
6. Add login/dashboard/onboarding/account-selection/denial browser tests.
7. Record production performance and accessibility budgets.
8. Add operator read-only TUI adapter design spike behind Manager.

### P2

1. Assignment-isolated/fractional employee runtime model.
2. Public AI-employee-as-website production pilot.
3. Real clothing-operations connector/BOM/purchase/fulfillment path.
4. Rich operator capability/context/delegation/recovery materializations.
5. Bounded schema-selected generative components after authored baselines pass.

## 14. Recommended next 20 development hours

### Hours 0–4: live environment and identity boundary

- identify approved staging;
- apply migrations and run advisors;
- prove real login/account selection/dashboard;
- retain exact-SHA packet.

### Hours 4–8: three-runtime test topology

- provision A1, A2, B1 as distinct employees;
- verify container/network/profile/assignment/credential isolation;
- capture capabilities and health after provisioning;
- prove Owner A denial against B1.

### Hours 8–12: real owner work and recovery

- run one harmless real work loop per employee;
- verify snapshot/SSE/reconnect/no replay;
- induce one runtime interruption after accepted start;
- reconcile without duplicate invocation/effect.

### Hours 12–16: approval/effect/evidence

- create one real gated outbound effect;
- resolve through owner web or signed Review;
- prove provider receipt, C3 terminal state, audit, metering, and browser evidence.

### Hours 16–20: release packet and remaining P0/P1

- run compiled UI and production-boundary gates on exact SHA;
- retain browser, runtime, database, provider, and rollback artifacts;
- update blockers honestly;
- do not attempt shared employee or broad role claims.

## 15. Final doctrine

The next-generation AMTECH UI is not “more animated” or “more agent-like.” It is a reliable projection of accountable labor.

It should make five things obvious:

1. Which employee and assignment are active.
2. What outcome the employee is carrying.
3. What changed and what remains uncertain.
4. What human authority is required now, if any.
5. What durable evidence proves completion.

Every advanced UI concept must strengthen one of those five truths without weakening identity, assignment, authority, recovery, or proof.
