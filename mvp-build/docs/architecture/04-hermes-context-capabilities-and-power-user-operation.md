# 04 — Hermes, Context, Capabilities, and Power-User Operation

Status: **[VERIFIED] managed Hermes integration; [INCOMPLETE] direct external MCP and effective-capability persistence**

## Hermes role in the product

Hermes is the managed cognition and agent-runtime substrate. It provides session continuity, runs, runtime-local tools, memory, job behavior, and agent reasoning. AMTECH does not expose Hermes as the owner authority plane.

Manager remains responsible for:

- account, employee, assignment, principal, and policy authority;
- connector and secret custody;
- tool schemas and business effects;
- approvals and command/effect execution;
- business-brain and live state resources;
- commercial attribution and provider receipts;
- owner-safe materialization and generated UI.

This division permits advanced Hermes behavior without allowing the runtime to manufacture organizational or commercial authority.

## Rendered employee context

`profile-renderer.ts` creates a per-employee generated directory from a profile package and onboarding manifest. The rendered tree includes the Hermes configuration and the files that establish the employee's durable identity and operating context.

The renderer:

- copies the selected profile package;
- renders bounded owner/business values;
- writes generated memory and user context;
- writes Model Gateway URL/token/model policy;
- writes Manager MCP configuration and scoped credential;
- writes workspace/runtime configuration;
- scans for unresolved template tokens;
- scans for forbidden provider master secrets;
- creates a file checksum manifest and aggregate checksum;
- validates file modes and tree integrity;
- records the profile build and generated path;
- recreates the runtime after Model Gateway credential rotation.

The runtime profile is immutable evidence plus a launch input. Mutable business state remains in PostgreSQL and Manager resources.

## Context layers

### Layer 1 — profile doctrine and durable identity

Examples:

- employee name and role package;
- business identity and business kind;
- top workflows and seed skills;
- behavioral constraints and approval doctrine;
- Manager MCP and Model Gateway configuration;
- workspace and session defaults.

Source: profile packages under `packages/agent-template` and `packages/profiles`, plus `profile-context.ts` and `profile-renderer.ts`.

### Layer 2 — generated memory

`business-brain.ts` points Hermes to native memory files such as:

- `memories/MEMORY.md`
- `memories/USER.md`

These contain bounded generated context suitable for the runtime's native recall behavior.

### Layer 3 — durable business facts

`business_brain_facts` stores facts with key, value, category, source, confidence, and update time. `readBusinessFactsResource` returns an owner/employee-scoped fact list. Business-brain reads now fail closed when PostgreSQL returns an error.

Examples include business preferences, operating constraints, UI experience/density preferences, customer or pricing conventions, and learned facts that have been explicitly persisted.

### Layer 4 — live Manager resources

Manager MCP exposes:

- `amtech://manager/business-brain`
- `amtech://manager/business-facts`
- `amtech://manager/connector-status`
- `amtech://manager/work-queue`
- `amtech://manager/artifacts`
- `amtech://manager/approvals`
- `amtech://manager/capability-registry`
- `amtech://manager/runtime-health`

These resources are read from the exact account, employee, assignment, and principal bound to the verified MCP credential. The model cannot override those fields in resource requests.

### Layer 5 — conversation/session recall

`hermes-client.ts` maintains a Manager-owned canonical session ID and stable session key. Business-brain guidance tells the employee to use Hermes `session_search` for prior-turn recall before asking the owner to repeat information.

### Layer 6 — current operating context

`operating-surface.ts` compiles an `OperatingContextManifest` from:

- manifest values;
- profile context slots;
- durable business facts;
- runtime health;
- latest primer/transcript session;
- profile build and validation state;
- doctrine SHAs;
- capability labels and summaries;
- tasks, approvals, connectors, work events, outputs, and resurfacing state.

The same context helps the owner understand the employee and gives Manager a deterministic task-agnostic view of active business work.

## Manager MCP authority

`mcp-server.ts` uses the Model Context Protocol Streamable HTTP transport. The verified credential establishes `McpIdentity`:

```text
account_id
employee_id
assignment_id
principal_id
policy_version
credential_id
```

### Tools

The server lists employee-callable Manager tools from the authoritative shared tool registry and excludes scheduler-only tools. Zod schemas are converted to JSON Schema. Account and employee fields are removed from model-visible schemas and injected from credential identity at execution.

Tool execution calls `runManagerTool` with:

- actor `employee`;
- bound assignment ID;
- bound employee principal;
- authentication provenance referencing the MCP credential.

A tool result is returned as an owner-safe summary and a structured envelope containing status and proof. Unknown or scheduler-only tools return explicit errors.

### Resources

Resource reads require complete identity. The server builds a strict employee snapshot and then returns only the requested Manager-owned projection.

[VERIFIED] Snapshot and business-brain failures fail closed. A database fault is not represented to Hermes as an empty connector list, empty work queue, or absent business fact set.

## Runtime capability discovery

`hermes-client.ts` reads:

- `/health`
- `/v1/capabilities`
- `/v1/toolsets`

Capabilities are cached per runtime endpoint with a bounded TTL. Cache can be invalidated when runtime behavior changes.

The client recognizes:

- session chat;
- runs;
- session-key support;
- endpoint or feature names advertised in the capability response.

The toolset endpoint is the ground truth for base runtime tools advertised by Hermes. Manager MCP tools are a separate capability source and therefore do not necessarily appear in Hermes' base toolset listing.

## Sessions and runs

### Session path

When session chat is supported, Manager ensures the canonical session and POSTs to the session chat endpoint. The session identity is Manager-owned and scoped to account/employee context.

### Runs path

When runs are supported, Manager:

1. creates a run with input, optional system/instruction message, session ID, and AMTECH work-run metadata;
2. returns immediately if creation produced a terminal result;
3. otherwise consumes runtime progress/stream or bounded polling behavior;
4. maps raw tool activity to owner-safe work verbs;
5. classifies successful, failed, cancelled, timeout, unreachable, and unsupported behavior;
6. falls back to the supported session path where the runtime contract permits.

## Advanced context engineering principles implemented

### Separate static identity from live state

The rendered profile establishes stable employee identity and doctrine. Manager resources carry live business state. This prevents profile regeneration from becoming the only method of updating connectors, approvals, work queues, or runtime health.

### Use typed resources instead of prompt-only context

Manager resources return structured JSON with assignment scope and proof. The employee can selectively retrieve facts, connector state, artifacts, approvals, or work queue rather than injecting every database row into every prompt.

### Preserve uncertainty and provenance

Business facts carry source and confidence. Operating context signals carry source, freshness, confidence, owner-safety, and semantic kind. Runtime capabilities are observed rather than assumed.

### Keep action authority outside context

A prompt, memory, retrieved fact, or runtime capability does not authorize an effect. Manager re-resolves current assignment, grant, policy, approval, and commercial scope when a tool is called.

### Correlate reasoning with durable work

Owner turns, provider events, tool use, messages, artifacts, meter events, approvals, and receipts can share work-run, correlation, source, or command identifiers.

### Bound context size

Profile slots, fact values, context signals, work queues, and resource lists are truncated or limited. The system does not rely on unbounded prompt accumulation.

## Power-user experience

A power user can direct the employee at the level of goals rather than only predeclared tasks:

- “Handle the new estimate requests and bring me the ones with unusual margin risk.”
- “Watch overdue invoices, draft follow-ups, and ask before sending.”
- “Reconcile the job calendar against customer emails and show conflicts.”
- “Prepare the weekly operations review with unresolved decisions and proof.”

The employee can:

1. interpret the goal through Hermes;
2. inspect business-brain and live Manager resources;
3. discover runtime and Manager capabilities;
4. decompose work into loops or delegated units;
5. use read tools and prepare artifacts;
6. surface active saves and return conditions;
7. create a durable approval for consequential work;
8. present a generated table/schedule/diff/form through the owner surface;
9. execute only the approved, assignment-scoped effect;
10. leave durable evidence.

## Effective capability model

The intended effective capability is the intersection of:

```text
observed Hermes runtime toolset
∩ Manager authoritative tool registry/schema
∩ connector custody and health
∩ assignment resource grants
∩ current authority policy
∩ commercial entitlement/budget
∩ runtime/profile revision
∩ channel and approval constraints
```

[INCOMPLETE] Current source exposes component capability registries and observed runtime capabilities/toolsets, but it does not persist one complete effective-capability proof graph containing all of those dimensions at one timestamp. This is required before adding a broad power-user MCP/TUI operator adapter.

## Direct Hermes MCP findings

[VERIFIED] Current public Hermes MCP serving is a messaging/session bridge, not a replacement for Manager authority. Its direct message-send and process-local permission/event semantics do not satisfy AMTECH assignment, C3, receipt, revocation, and commercial boundaries.

Therefore:

- direct owner/browser use is not integrated;
- Hermes remains behind Manager and the employee runtime boundary;
- useful adapter patterns are limited to explicit allowlists intersected with observed tool registries and authoritative schemas.

## Direct external MCP and egress

[INCOMPLETE] The production employee network is internal and permits only Manager and Model Gateway peers. Direct external MCP servers are not reachable unless a controlled egress service is added.

A production direct-MCP substrate would require:

- connector ownership and credential custody;
- domain/IP/DNS policy;
- transport allowlist;
- tenant and assignment binding;
- request/response redaction;
- rate and spend control;
- receipt/audit integration;
- revocation and health state;
- SSRF and private-network denial;
- capability observation and persistence.

## Interaction surfaces

### INTERACTION-HERMES-001: profile memory × live Manager resources | FEEDBACK

Emergent finding: the employee can maintain a stable identity while reacting to current business state without rewriting its profile for every event.

Value: 20/20.

### INTERACTION-HERMES-002: runtime capability discovery × Manager authority | GATE

Emergent finding: a tool can be technically available in Hermes but unavailable to the employee because connector, assignment, policy, entitlement, or approval state denies it.

Value: 20/20.

### INTERACTION-HERMES-003: session continuity × durable work runs | EMERGENT

Emergent finding: conversational continuity and business-effect lineage can coexist without treating transcript history as the source of truth for execution.

Value: 19/20.

### INTERACTION-HERMES-004: task-agnostic goals × typed resources/actions | TRANSFORM

Emergent finding: open-ended reasoning can produce bounded work objects and approvals that remain comprehensible and enforceable across channels.

Value: 20/20.
