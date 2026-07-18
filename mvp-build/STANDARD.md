# AMTECH STANDARD v0.1 — Draft 2

**Status:** Proposed for human-operator approval  
**Source baseline:** `employee-work@f01995fddddff0b2905922ec7b287307be52891e`  
**Effective scope:** `mvp-build/`  
**Effective date:** Not effective until approved by the AMTECH human operator  
**Enforcement gate:** Phase 2 code review MUST NOT begin until this document is approved.

---

# 0. Purpose, Authority, and Grounding

AMTECH is infrastructure for AI labor. It is a runtime and governance system for creating, assigning, operating, supervising, measuring, repairing, and commercializing persistent AI employees and AI workforces.

AMTECH is not limited to one user, one account, one organization, or one employee. A conforming implementation MUST support the following without collapsing them into one identifier:

- one organization with one or more accounts;
- one account with one or more human users;
- one account with one or more AI employees;
- one user participating in multiple accounts or organizations;
- one AI employee assigned to multiple users, teams, accounts, or organizations under explicit grants;
- one organization accessing an AI employee that it does not own or employ;
- shared, managed, fractional, delegated, marketplace, contractor-like, or experimental AI labor arrangements;
- multiple payers, beneficiaries, supervisors, operators, and resource owners for the same unit of work.

The standard therefore treats **identity**, **ownership**, **employment**, **assignment**, **access**, **authority**, **resource custody**, **benefit**, and **payment** as separate relationships.

A conforming AMTECH system lets authorized humans experience accountable labor through web, SMS, signed review surfaces, connected business systems, future voice, and administrative controls. The employee performs work, remembers only the context it is authorized to retain, produces durable outputs, asks for decisions at real authority boundaries, and leaves proof. Manager is the invisible labor control plane. Models, Hermes, Hono, Supabase, Docker, Caddy, and individual providers are replaceable implementation mechanisms.

## 0.1 Normative language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

A TypeScript type, interface, prompt, document, or UI mock is not a protocol implementation. A production protocol requires runtime validation, durable state, authorization, recovery semantics, tests, and evidence appropriate to the claim.

## 0.2 Evidence hierarchy

When sources disagree, authority descends in this order:

1. deployed behavior with release-bound, redacted proof;
2. database constraints, migrations, grants, RLS, and durable state transitions;
3. executable source and production infrastructure configuration;
4. automated tests and acceptance scripts;
5. current canonical runbooks and implementation records;
6. current memory handoffs;
7. non-canonical plans, historical notes, fixtures, demos, and archived documents.

No document may upgrade an implementation state beyond the strongest available evidence.

## 0.3 Memory grounding used for this draft

This draft was reconciled against the six newest handoff summaries in `memory/MEMORY.md`:

1. `2026-07-17-employee-work-production-boundary-reconciler-pass.md`;
2. `2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md`;
3. `2026-07-17-website-framework-phase-1-closure.md`;
4. `2026-07-17-holographic-website-framework-v0.1.md`;
5. `2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md`;
6. `2026-07-16-ws1-ws2-production-boundary-pass.md`.

The two newest full handoffs were read as primary narrative grounding:

- `memory/2026-07-17-employee-work-production-boundary-reconciler-pass.md`;
- `memory/2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md`.

The research framework clauses additionally incorporate the documented HRR/VSA, typed compiler, deterministic benchmark, pass/fail-vector, privacy, and baseline-comparison discipline from the third and fourth handoffs. Those research concepts are not treated as validated product capabilities merely because they are documented.

## 0.4 Scope

This standard applies to active implementation under `mvp-build/`, including:

- `apps/web/`;
- `apps/manager/`;
- `packages/shared/`;
- `packages/db/`;
- `packages/agent-template/`;
- `infra/`;
- active `docs/`;
- `ui-redesign/` where it remains active;
- tests, migrations, scripts, proof manifests, and production configuration.

The following are informative, not implementation proof:

- `../wiki/` vision material;
- `../identity.md` brand material;
- `CODEGRAPH.md` navigation;
- historical archives;
- fixtures, dev login, manually injected events, Quick Tunnels, and the public estimator.

## 0.5 Conformance unit

A feature conforms only when its entire production boundary conforms:

```text
human, employee, provider, schedule, or system trigger
-> authenticated principal and relationship resolution
-> authorized organization/account/assignment scope
-> durable intent, command, inbox event, or work object
-> employee reasoning or deterministic processing
-> policy and authority evaluation
-> approval when required
-> bounded idempotent effect
-> provider/runtime receipt
-> owner-safe and role-safe materialization
-> audit, metering, billing attribution, recovery, and proof
```

A success response without proof, a UI without durable state, an access check without relationship scope, a type without runtime validation, or a worker without recovery semantics is an incomplete boundary.

## 0.6 Foundational principles

Every AMTECH implementation MUST preserve these principles:

1. **Labor replacement, not tool usage.** Every capability MUST identify the human duty displaced, the retained human authority, the durable output, the exception path, and the recovery path.
2. **Runtime, not wrapper.** AMTECH MUST add durable identity, context, policy, lifecycle, assignment, routing, observability, repair, and proof around model execution.
3. **Protocol, not feature.** Cross-component, cross-tenant, cross-employee, and cross-surface behavior MUST use validated and versioned contracts.
4. **Governance by default.** Consequential action requires provenance, scope, authority, policy evaluation, and audit.
5. **Workforce, not singleton.** The architecture MUST support multiple employees, multiple humans, multiple accounts, and explicitly shared labor relationships.
6. **One employee identity across authorized surfaces.** A given employee assignment MUST project consistent work state, approvals, context, and proof across channels.
7. **Lean-business native.** Technical complexity MUST be abstracted from ordinary operators while remaining inspectable by AMTECH operators and researchers.
8. **Research before mythology.** Novel mathematics, generative UI, autonomous planning, and labor-displacement claims MUST be hypotheses until they pass declared validation vectors.
9. **Hard gates before weighted scores.** No composite score, model confidence, or business enthusiasm may override a failed safety, authority, privacy, accounting, or deployment gate.
10. **Evidence before claims.** Built, tested, deployed, provider-accepted, runtime-accepted, commercially validated, and live-accepted are distinct states.

---

# 1. Agent Employment Protocol (AEP)

The Agent Employment Protocol defines what constitutes an AMTECH employee, assignment, work object, turn, and cross-surface presence.

## 1.1 Employment and Assignment Contract

### AEP-1.1.1 — Employee identity is not tenant ownership

An AI employee MUST have a stable platform identity independent of any one UI session, human user, or account membership.

The system MUST separately represent:

- employee identity;
- employing or owning entity, when one exists;
- assigned organization, account, team, user, customer, or project;
- supervisors and approval authorities;
- service provider or managing operator;
- payer and billing beneficiary;
- data and resource scopes available within each assignment.

An `employee_id` MUST NOT imply that every account or user who can access the employee owns it.

### AEP-1.1.2 — Assignment as the execution scope

Every employee action MUST resolve through an explicit assignment, engagement, or access grant. The assignment MUST define at least:

- employee;
- organization and/or account scope;
- authorized human principals or roles;
- task, capability, resource, and connector scope;
- memory and data partition;
- approval authority;
- effective and expiration time;
- revocation state;
- billing attribution;
- provenance and audit policy.

Where the current code uses `account_id + employee_id` as the practical scope, that pair is a v0.1 assignment approximation, not the permanent ontology.

### AEP-1.1.3 — Multiple employees per account

An account or organization MAY have multiple employees. Each employee MUST maintain separate runtime identity, credentials, profile, work queue, context, approvals, and audit trail unless a shared resource is explicitly declared.

Per-employee turn serialization MUST NOT prevent different employees from working concurrently.

### AEP-1.1.4 — Shared or fractional employees

An employee MAY be accessible to multiple accounts, organizations, or users without belonging to them. Shared access MUST be explicit, revocable, time-bounded or policy-bounded, and resource-scoped.

A shared employee MUST NOT merge business memory, customer data, credentials, work products, or provider context across assignments unless an explicit shared-resource grant authorizes that exact data class.

### AEP-1.1.5 — Cross-employee collaboration

Multiple employees MAY collaborate on one work object. Collaboration MUST preserve:

- initiating employee and assignment;
- delegated employee and assignment;
- task boundary;
- context subset transmitted;
- authority inherited or not inherited;
- output and proof returned;
- separate run and tool provenance;
- final accountable employee or supervisor.

Delegation MUST NOT silently transfer connector access, approval authority, secrets, or tenant memory.

### AEP-1.1.6 — Human labor analogy test

Every new employee capability MUST answer:

1. What human role or recurring duty does this replace or reduce?
2. What information would a competent employee need?
3. What work should the employee perform without interruption?
4. What authority would a human employee not possess?
5. What artifact, communication, decision, or system change proves completion?
6. What happens when the employee is uncertain, unavailable, duplicated, or wrong?
7. How much human review remains after deployment?

A feature that only exposes model output without durable work, authority boundaries, or completion evidence fails this contract.

## 1.2 Work Surface Contract

### AEP-1.2.1 — Canonical SurfaceEnvelope

Every materialized unit of employee work MUST use a canonical `SurfaceEnvelope` or versioned successor containing:

- stable envelope ID and schema version;
- employee identity;
- assignment, account, and organization scope where applicable;
- semantic kind;
- owner-safe or role-safe title and summary;
- state and timestamps;
- render hints;
- safety metadata;
- proof references;
- optional `WorkResource`;
- optional scoped `WorkAction` set.

### AEP-1.2.2 — Role-safe projection

Raw provider payloads, secrets, bearer tokens, internal tool names, untrusted instructions, and unrelated tenant information MUST NOT reach a human surface.

Materialization MUST be filtered for the viewing principal's relationship and role. Two authorized viewers MAY receive different projections of the same work object when their authority, privacy, or billing scope differs.

### AEP-1.2.3 — WorkResource lifecycle

A `WorkResource` MUST distinguish, where applicable:

```text
observed | drafted
-> prepared
-> needs_information | needs_authority | needs_approval
-> approved | rejected | expired
-> committing
-> delivered | applied | completed
-> failed | ambiguous | superseded | cancelled
```

Lifecycle state MUST derive from durable records, not UI state alone.

### AEP-1.2.4 — WorkAction contract

Every `WorkAction` MUST declare:

- action type and human label;
- target resource;
- assignment and action scope;
- required actor or role;
- whether it is gated;
- expiration and revocation;
- idempotency and replay behavior;
- resulting state transition;
- audit and proof output.

A rendering tier, generated UI, or agent-authored view MUST NOT expand action scope or relax a gate.

### AEP-1.2.5 — Typed work-event grammar

Work events MUST use a small typed grammar:

- `notify` — useful information, no immediate decision;
- `question` — one concrete missing fact or judgment;
- `review` — an authorized decision is required;
- `silent` — recorded but non-interruptive monitoring or work.

Each event MUST carry employee and assignment context, safe copy, deliverable metadata, next action, and proof references.

### AEP-1.2.6 — CapabilityGraphNode

Every advertised capability MUST have:

- stable key and version;
- employee and assignment scope;
- owner-facing label and summary;
- category;
- readiness status;
- setup requirement;
- source and trust level;
- current executability;
- required authority and approval class;
- evidence.

A tool name alone does not prove capability readiness.

### AEP-1.2.7 — Generic work materialization

The platform MUST support the long tail of tools through schema-driven generic materialization. Validated JSON Schema, bound input, safe result descriptors, proof, and actions MUST be sufficient to render an inspectable work object without bespoke UI.

Native cards and MCP-UI MAY improve rendering but MUST preserve the same gates and durable state.

## 1.3 Session, Turn, and Workforce Continuity Contract

### AEP-1.3.1 — Per-employee brain lane

Only one state-mutating reasoning turn MAY actively execute for one employee at a time unless a future protocol explicitly supports parallel sub-turns with deterministic merge semantics.

Owner web turns, SMS turns, provider wakes, scheduled wakes, delegated tasks, and approval follow-ups MUST enter a durable per-employee lane.

Different employees MAY execute concurrently.

### AEP-1.3.2 — Turn atomicity

A turn MUST include:

- stable turn/job ID;
- employee and assignment scope;
- initiating principal;
- turn kind and input;
- idempotency key;
- `run_id`;
- claim owner and lease;
- attempt count;
- terminal state;
- durable output or safe error.

A stale claimant MUST NOT complete or overwrite a later attempt.

### AEP-1.3.3 — Duplicate intent suppression

Duplicate owner messages, provider events, approval resolutions, scheduled jobs, delegations, and effect commits MUST converge on a canonical record. Duplicate evidence MUST be retained.

A retry caused by a lost response MUST NOT repeat an irreversible effect.

### AEP-1.3.4 — Context dimensions

The system MUST distinguish:

- platform employee identity;
- assignment identity;
- organization/account context;
- durable memory scope;
- shared-resource scope;
- transcript session;
- communication channel;
- channel presence;
- turn/run;
- task/work-object context.

A memory key, account ID, employee ID, and transcript ID are not interchangeable.

### AEP-1.3.5 — Session rotation and handoff

Session rotation, runtime restart, channel change, employee delegation, and supervisor change MUST preserve a bounded handoff containing:

- unresolved approvals and questions;
- current assignment and authority scope;
- latest authorized decision;
- active work object;
- relevant memory/resource references;
- last completed step;
- next safe action;
- run and proof references.

### AEP-1.3.6 — Silent event recording

A silent event MUST still create durable evidence. “Silent” means no interruption, not no record.

### AEP-1.3.7 — Runtime recovery

Manager MAY recover an unreachable runtime and retry the same claimed turn. Recovery MUST NOT create a second active turn or repeat an external effect.

## 1.4 Multi-Modal Presence Contract

### AEP-1.4.1 — Surface parity

Every employee function MUST define behavior for web, SMS, signed mobile review, admin diagnostics, and future voice. A constrained surface MAY hand off to another surface only without losing identity, assignment, context, state, or action scope.

### AEP-1.4.2 — SMS

SMS MUST:

- lead with the result or required decision;
- use plain business language;
- ask at most one question;
- omit tool narration;
- preserve links, amounts, recipients, and safety qualifications;
- target one 160-character GSM segment when safe;
- meter actual segments;
- suppress low-value notifications rather than manufacture urgency.

### AEP-1.4.3 — Signed review

A signed mobile link MUST be scoped to the viewing principal, assignment, employee, resource, and allowed actions. It MUST be expiring, revocable, replay-resistant, and audited.

### AEP-1.4.4 — Web

The web surface MUST combine durable snapshots, SSE or equivalent live updates, reconnect catch-up, poll fallback, and server-side authorization. The browser MUST NOT require privileged direct database access.

### AEP-1.4.5 — Voice migration

Voice is not live in v0.1. A future voice path MUST reuse the same identity, assignment, turn queue, approval, audit, and materialization protocols. A voice-only business-logic fork is prohibited.

---

# 2. Organization, Tenancy, Identity, and Access Protocol (OTIAP)

## 2.1 Canonical entity model

### OTIAP-2.1.1 — Organization

An organization represents a legal, operational, or commercial grouping. It MAY contain multiple accounts, teams, locations, cost centers, users, employees, and billing arrangements.

### OTIAP-2.1.2 — Account

An account is a tenancy, service, data, or billing boundary. It is not necessarily identical to an organization. One organization MAY have multiple accounts, and one account MAY participate in a larger organization.

### OTIAP-2.1.3 — User

A user is a human principal. A user MAY hold different roles in different organizations, accounts, teams, assignments, and work objects.

### OTIAP-2.1.4 — Employee

An employee is an AI labor principal with runtime identity and durable work history. Employment, ownership, access, assignment, and payment MUST be modeled separately.

### OTIAP-2.1.5 — Relationship graph

Authorization MUST be derived from explicit relationships, not assumed from identifier equality. At minimum, the graph MUST be able to represent:

- organization membership;
- account membership;
- team membership;
- employee ownership or management;
- employee assignment;
- user supervision;
- approval authority;
- shared-service access;
- resource ownership and custody;
- payer and beneficiary;
- operator/support access.

## 2.2 Access and authority

### OTIAP-2.2.1 — Access is not ownership

Permission to view, instruct, approve, audit, pay for, or benefit from an employee MUST NOT imply ownership of the employee or its entire memory.

### OTIAP-2.2.2 — Relationship-bound credentials

Privileged credentials MUST bind at least:

- principal type and ID;
- employee;
- assignment/account/organization context;
- capability/action scope;
- credential version;
- expiration;
- policy version.

Employee MCP and Model Gateway credentials MUST remain employee-scoped. Human sessions and signed actions MUST additionally bind the human principal and relationship context.

### OTIAP-2.2.3 — Authority matrix

The platform MUST support multiple authority roles, including:

- business owner;
- organization administrator;
- account administrator;
- team manager;
- employee supervisor;
- approver by action class;
- finance approver;
- security approver;
- viewer or auditor;
- AMTECH platform operator.

Approval authority MAY vary by amount, recipient, system, resource, project, location, or task.

### OTIAP-2.2.4 — Least relationship privilege

A principal MUST receive only the minimum employee, resource, connector, and action scope granted through its current relationships.

A broad account membership MUST NOT automatically grant access to every employee or every customer record.

### OTIAP-2.2.5 — Explicit cross-account access

Cross-account access is allowed only through an explicit grant. RLS and service logic MUST recognize the grant while preserving denial for unrelated accounts.

The system MUST test both:

- unauthorized cross-account denial;
- authorized shared-employee access without data leakage.

## 2.3 Data and memory partitioning

### OTIAP-2.3.1 — Assignment memory boundary

Employee memory MUST be partitioned by assignment or authorized shared-resource domain. Shared employees MUST NOT retrieve another assignment's facts merely because the platform employee identity is the same.

### OTIAP-2.3.2 — Resource classification

Every durable resource SHOULD declare:

- owner;
- custodian;
- organization/account scope;
- employee assignment scope;
- sensitivity;
- permitted viewers;
- permitted writers;
- retention policy;
- export/deletion authority.

### OTIAP-2.3.3 — Shared resources

A resource MAY be shared across assignments only through an explicit shared-resource object or grant. The grant MUST specify fields, purpose, time, and allowed operations.

### OTIAP-2.3.4 — Revocation

Revoking an assignment or access grant MUST prevent new access immediately and trigger evaluation of cached context, active sessions, signed links, credentials, queued work, and retained materializations.

## 2.4 Database enforcement

### OTIAP-2.4.1 — RLS and grants

New browser-readable tables or views MUST receive Data API exposure review, RLS, grants review, positive authorization tests, and negative isolation tests.

Simple `account_id = current_account` policy is insufficient when explicit shared access is supported. Relationship-aware policies or trusted server projections are REQUIRED.

### OTIAP-2.4.2 — Worker privilege

Worker functions MUST use least privilege and `SECURITY INVOKER` by default. `SECURITY DEFINER` requires a threat model, fixed `search_path`, restricted grants, and tests.

### OTIAP-2.4.3 — Support access

AMTECH support access MUST require a platform role, reason, target scope, audit record, and redaction. Support access MUST NOT become invisible tenant membership.

---

# 3. Trust & Governance Protocol (TGP)

## 3.1 Delegation Retention Model

### TGP-3.1.1 — Governing sequence

```text
employee observes or receives work
-> employee performs internal reversible work
-> policy resolves assignment and authority
-> employee proposes consequential action when required
-> authorized human approves, rejects, or edits
-> system executes exactly the approved scope
-> provider/runtime returns evidence
-> Manager records and materializes proof
```

### TGP-3.1.2 — Autonomous internal work

Internal, reversible, authorized work SHOULD execute without approval. Examples include research, reading permitted context, drafting, calculating, rendering, organizing, monitoring, and preparing previews.

Approval theater that interrupts routine employee work violates the labor model.

### TGP-3.1.3 — Mandatory approval classes

Authorized human approval is REQUIRED before:

- external customer, prospect, vendor, public, or government communication;
- payment movement, purchases, refunds, invoices, or financial commitments;
- accounting or other system-of-record writes;
- destructive mutation or deletion;
- bulk external action;
- sensitive connection or permission grants;
- credential changes that materially affect live work unless emergency operator policy applies;
- high-risk actions designated by policy.

### TGP-3.1.4 — No self-approval

An employee MUST NOT approve its own gated action. A delegated employee MUST NOT inherit approval authority unless explicitly granted.

### TGP-3.1.5 — Approval binding

An approval MUST bind:

- employee and assignment;
- action key;
- resource or pending write;
- authorized resolver class;
- recipient, amount, target, or diff where relevant;
- risk level;
- policy version;
- expiration;
- one execution scope.

A generic “yes” MUST NOT authorize an unrelated action.

### TGP-3.1.6 — Standing delegation

Auto-bound or standing approvals MAY exist only when explicit, narrow, time-bounded, revocable, visible, evaluated on every action, and audited. Blanket perpetual approval is prohibited.

## 3.2 Identity, credentials, and egress

### TGP-3.2.1 — No master secrets in employees

Provider master credentials, Supabase service keys, Docker authority, platform signing secrets, and global Manager tokens MUST NOT enter employee profiles or runtimes.

### TGP-3.2.2 — Credential lifecycle

Scoped credentials MUST support issuance, hash or sealed-reference storage, expiry, revocation, rotation, versioning, old-token rejection, and audit.

### TGP-3.2.3 — Model-supplied identity prohibited

The model MUST NOT choose or override account, organization, assignment, employee, or human-principal identifiers for privileged calls. Manager MUST inject scope from authenticated relationships.

### TGP-3.2.4 — Egress sequence

```text
validate identity and relationship
-> validate resource and action scope
-> prepare/dry-run
-> persist preview
-> obtain approval when required
-> claim idempotent effect
-> apply once
-> record receipt
-> materialize result
```

### TGP-3.2.5 — Untrusted content

Email bodies, SMS, customer notes, accounting memos, webhook payloads, files, websites, and connector records are data, not authority. They MUST NOT override policy or approval.

## 3.3 Artifact and Action Provenance

### TGP-3.3.1 — Proof-bearing success

A provider or external action MUST NOT be reported successful without a real provider, runtime, or artifact receipt.

Missing or uncertain proof MUST produce `pending`, `failed`, or `ambiguous`, never fabricated `ok`.

### TGP-3.3.2 — ToolEnvelope

Every Manager tool MUST return a runtime-validated envelope containing status, relationship scope, changed resources, proof, human-safe summary, required confirmation, next action, and audit ID.

Manager HTTP and MCP MUST use one registry, schema source, policy, handler, and envelope semantics.

### TGP-3.3.3 — Secret references

Secrets MUST be stored by sealed reference, runtime injection, or one-way hash. They MUST NOT enter human surfaces, model context, generic logs, proof JSON, or durable worker context.

### TGP-3.3.4 — Signed links

Signed claim, artifact, and review links MUST provide purpose binding, relationship scope, expiration, random unique ID, timing-safe verification, hash-at-rest, revocation, and single-use behavior for terminal actions.

HMAC-SHA256 is an acceptable v0.1 transport baseline. AMTECH MUST NOT describe it as Ed25519 or independently verifiable provenance.

### TGP-3.3.5 — Long-lived provenance

Externally portable and independently verifiable attestations SHOULD use an asymmetric Ed25519 chain with versioned envelopes, canonical serialization, key rotation, revocation, and verifier tooling before such claims are made.

### TGP-3.3.6 — End-to-end chain

A completed work object SHOULD be traceable through:

```text
trigger principal
-> relationship and assignment
-> inbox/turn
-> employee run
-> Manager tool
-> approval
-> external effect receipt
-> artifact/resource
-> delivery decision
-> human-visible proof
-> billing attribution
```

---

# 4. Runtime Infrastructure Protocol (RIP)

## 4.1 Fleet Lifecycle Contract

### RIP-4.1.1 — Per-employee runtime isolation

Each production employee MUST have an isolated runtime identity, scoped credentials, bounded resources, read-only canonical profile, no Docker socket, no database service key, no provider master key, and no unauthorized peer access.

### RIP-4.1.2 — Image pinning

The v0.1 compatibility baseline is `hermes-agent:0.18.0`. Production MUST pin an approved version and SHOULD pin an immutable digest. Floating `latest` is prohibited.

### RIP-4.1.3 — Host authority separation

Manager MUST NOT own public arbitrary Docker authority. Host lifecycle operations MUST cross a private authenticated provisioner boundary with short expiry, nonce, idempotency, operation allowlist, fixed Docker arguments, and durable audit.

### RIP-4.1.4 — Desired-state reconciliation

Fleet state MUST be reconstructed from durable desired state:

```text
claim
-> inspect
-> decide
-> apply one bounded effect
-> verify
-> persist
-> continue | retry | compensate | dead-letter | terminate
```

### RIP-4.1.5 — Provisioning order

```text
requested
-> resources_reserved
-> credentials_minted
-> profile_rendered
-> runtime_started
-> runtime_healthy
-> routing_activated
-> channel_configured
-> welcome_sent
-> ready
```

Provider binding and welcome effects MUST NOT precede runtime and route acceptance.

### RIP-4.1.6 — Recovery and drift

The reconciler MUST detect and repair missing containers, networks, routes, profiles, checksum drift, unhealthy runtime, expired credentials, stuck jobs, and inconsistent bindings. Host restart MUST reconstruct desired ready employees.

### RIP-4.1.7 — Multiple employees and shared workers

Worker scheduling MUST remain safe with multiple employees, accounts, assignments, and Manager replicas. Claims MUST be atomic and relationship scope MUST be carried into every effect.

### RIP-4.1.8 — Pod Alpha operator contract

The first production operating unit MUST support scripted deploy, rollback, health, provision, suspend, resume, rotate, replace, reprovision, teardown, backup, restore, drift repair, capacity, egress review, and proof collection.

## 4.2 Provider Abstraction Contract

### RIP-4.2.1 — Business logic independence

Approval, work materialization, assignment, audit, and owner surfaces MUST depend on AMTECH contracts, not provider response shapes.

### RIP-4.2.2 — Model Gateway custody

Employee runtimes MUST call a host-private OpenAI-compatible Model Gateway through employee-scoped credentials. The gateway MUST own provider keys, routing, allowlists, retries, timeouts, rate/spend policy, usage capture, and redacted audit.

### RIP-4.2.3 — Structured output

Machine-consumed model output MUST use strict `json_schema` when available. A `json_object` fallback MAY occur only after a recorded compatibility failure and MUST still pass the same runtime schema.

Free-form text MUST NOT silently become structured state.

### RIP-4.2.4 — Connector two-door invariant

```text
public provider request
-> authenticity verification
-> atomic durable inbox insertion
-> asynchronous business processing
```

The webhook handler MUST NOT perform the primary business effect before insertion.

### RIP-4.2.5 — Ambiguous effects

If an irreversible provider call may have succeeded without a reliable receipt, the effect MUST become `ambiguous` and require dead-letter or operator inspection. Blind retry is prohibited.

## 4.3 Cost and Capacity Accounting

### RIP-4.3.1 — Immutable usage facts

Metering MUST record immutable facts and MUST remain distinct from authorization and final billing.

### RIP-4.3.2 — Correlation

`run_id` MUST thread through model calls, runtime runs, tools, provider APIs, SMS, artifacts, scheduler actions, delivery decisions, and billing attribution.

### RIP-4.3.3 — Required dimensions

Usage and cost attribution MUST support at least:

1. organization;
2. account;
3. employee;
4. assignment;
5. user or triggering principal;
6. conversation/session;
7. run;
8. task/work object;
9. action/tool invocation;
10. customer/job/resource when known;
11. provider and feature;
12. payer and beneficiary.

### RIP-4.3.4 — Transactional limits

Strict multi-replica rate, budget, or quota claims require shared transactional enforcement. Process-local counters MUST be labeled as a limited baseline.

---

# 5. Employee Capability Protocol (ECP)

## 5.1 Profile Package Contract

### ECP-5.1.1 — Base plus overlays

An employee profile MUST combine:

- vertical-agnostic employment core;
- validated role or vertical package;
- assignment-specific policy overlay;
- business or organization context;
- runtime and connector configuration;
- explicit skills and resources.

### ECP-5.1.2 — First package, not platform boundary

`contractor_estimator` is the first optimized package. It MUST NOT become the platform's permanent role ontology.

### ECP-5.1.3 — Deterministic rendering

Security-sensitive profile configuration MUST be rendered from validated schemas and templates, not free-form LLM output.

### ECP-5.1.4 — Fail-closed integrity

Production rendering MUST fail on unresolved tokens, forbidden secret names or values, provider master-key slots, unsafe permissions, writable canonical files, checksum mismatch, invalid package schema, or unauthorized connector custody.

### ECP-5.1.5 — Assignment context

The rendered or runtime-injected context MUST identify the active assignment and MUST exclude memory and resources from unrelated assignments.

### ECP-5.1.6 — Business brain

Durable facts MUST carry source, confidence, assignment/resource scope, and provenance where possible. The employee MUST distinguish fact, inference, assumption, and unknown.

## 5.2 Skill and Capability Discovery

### ECP-5.2.1 — Capability registry

Manager MUST compile capabilities from Manager tools, MCP resources, profile skills, connectors, runtime health, entitlement, assignment, and policy.

The employee MAY propose a capability, but Manager MUST validate it before advertising readiness.

### ECP-5.2.2 — MCP discovery

Manager MCP MUST expose tool and resource discovery through authenticated employee-bound transport. Schemas MUST derive from runtime validation.

### ECP-5.2.3 — ConnectionSurface

Connected systems MUST distinguish:

```text
not_connected -> needs_you -> connected -> working
```

OAuth completion alone does not prove `working`.

### ECP-5.2.4 — Connector custody

Read-only direct connectors MAY be allowed by explicit policy. Write, money, customer-facing, or sensitive connectors MUST remain behind Manager policy and audit.

### ECP-5.2.5 — Resurfacing

Unfinished approvals, questions, failures, reminders, blocked connectors, runtime degradation, and assignment issues MUST materialize as deduplicated resurfacing obligations.

## 5.3 Tool Execution Contract

### ECP-5.3.1 — Single registry

Manager HTTP and MCP MUST be transports over one registry, schema source, handler, policy layer, and envelope.

### ECP-5.3.2 — Runtime validation

Every tool input MUST be validated at runtime. Unknown, scheduler-only, unsupported, unauthorized, or invalid calls MUST return typed failure without side effect.

### ECP-5.3.3 — Tool loop

```text
employee selects work
-> schema guides input
-> Manager injects relationship scope
-> Manager validates authority and policy
-> tool prepares or executes bounded work
-> Manager returns proof-bearing envelope
-> employee reports result and next move
```

### ECP-5.3.4 — Preview and commit

Consequential writes MUST use preview, durable pending resource, approval, idempotent commit, provider receipt, and materialized result.

### ECP-5.3.5 — Query paths

Authorized read-only queries SHOULD NOT require approval but MUST enforce relationship scope, redaction, untrusted-content policy, audit, and metering.

### ECP-5.3.6 — Repair tools

Replay, relink, redeliver, suppress, regenerate, rotate, replace, reprovision, and drift repair MUST preserve original evidence and create new audit records.

---

# 6. Human Interface Protocol (HIP)

## 6.1 Human roles and work surfaces

### HIP-6.1.1 — Human is a supervisor, approver, participant, or operator

The product MUST NOT assume every human is the singular owner. Surfaces MUST adapt to the human's actual role and relationship.

### HIP-6.1.2 — Required work functions

Authorized human surfaces MUST provide equivalents of:

- Home: employee/workforce state and current obligations;
- Talk: direct conversation with an employee;
- Proof: artifact and receipt review;
- Connected: connector state;
- Delegate: natural-language work assignment;
- Needs your say: decisions for which this principal has authority;
- Watching: silent monitoring;
- Recent proof: completed work;
- Workforce: employees, assignments, supervisors, and access;
- Cost: usage, labor displacement, and billing attribution appropriate to role.

### HIP-6.1.3 — Role-filtered obligations

A user MUST see only approvals, questions, employees, and resources authorized by their relationship graph. “Needs your say” MUST not show decisions the viewer cannot resolve.

### HIP-6.1.4 — Exact approvals

Approval views MUST show target, recipient, amount, resource/diff, assignment, risk, expiration, and resulting action.

### HIP-6.1.5 — Honest state copy

The UI MUST distinguish drafted, pending connection, connected, working, awaiting approval, committing, sent, paid, failed, ambiguous, expired, revoked, and unavailable.

### HIP-6.1.6 — Non-technical recovery

Human-facing failures MUST explain what is blocked, whether work was lost, what AMTECH is doing, and the single next human action if one exists. Protocol jargon belongs in operator diagnostics.

## 6.2 SMS Ambient Inbox

### HIP-6.2.1 — Direct relationship

SMS MUST resolve the sender to a human principal and authorized employee assignment. A phone number alone MUST NOT imply authority over every employee in an account.

### HIP-6.2.2 — Approval routing

SMS MAY alert to approval, but resolution SHOULD use a scoped signed review unless SMS reply binding is equivalently specific and secure.

### HIP-6.2.3 — Delivery decisions

Every notification MUST record intent, assignment, chosen channel, reason, proof, and fallback.

### HIP-6.2.4 — Consent

SMS MUST use verified numbers, authorized sender identity, and applicable consent policy. Cold outbound is prohibited by default.

## 6.3 Admin Operator Surface

### HIP-6.3.1 — Platform roles

Admin functions MUST enforce platform owner, operator, support, billing, and security roles server-side.

### HIP-6.3.2 — Required operator functions

The operator surface MUST support organization/account/user/employee relationships, fleet health, provisioning, assignments, access grants, repairs, proof inspection, redacted support, usage, billing, experiments, and validation vectors.

### HIP-6.3.3 — Command-mediated mutation

Admin lifecycle actions MUST enqueue durable commands or invoke bounded repair contracts. Browser handlers MUST NOT directly mutate Docker, Caddy, profile files, or terminal runtime state.

### HIP-6.3.4 — Destructive confirmation

Destructive operations MUST require exact target, environment, allowlist/scope, confirmation, actor, release binding, and redacted proof.

---

# 7. Commercial, Billing, and Monetization Protocol (CBMP)

AMTECH monetization MUST reflect AI labor, not merely SaaS seats and feature flags.

## 7.1 Commercial entity separation

### CBMP-7.1.1 — Payer, beneficiary, owner, and user

The system MUST separately represent:

- payer;
- invoice recipient;
- employing or owning entity;
- beneficiary organization/account;
- accessing users;
- managed employee or workforce;
- AMTECH operator or reseller;
- cost center or project.

The payer need not own or directly use the employee.

### CBMP-7.1.2 — Billing is not authorization

Billing state, entitlement, access, authority, and tenant membership are separate. A paid invoice MUST NOT grant unauthorized data access. A temporary payment failure MUST follow explicit service policy rather than silently corrupt work or access state.

## 7.2 Labor-native monetization

### CBMP-7.2.1 — Permitted commercial primitives

AMTECH MAY price through combinations of:

- free entry or trial;
- managed employee base price;
- employee or workforce capacity;
- task package;
- completed work object;
- runtime/model/provider usage;
- SMS or connector usage;
- managed operations/support;
- labor-displacement value band;
- custom enterprise or multi-organization arrangement.

The current canonical direction is free entry plus a managed AI Employee beginning at $400/month, with higher-volume workforce pricing custom. This is commercial configuration, not a frozen protocol constant.

### CBMP-7.2.2 — Task-based billing

A billable task MUST bind to a durable work object, assignment, completion state, proof, pricing-policy version, and payer. A model call or tool attempt alone MUST NOT be billed as a completed task unless the commercial policy explicitly says usage-based.

### CBMP-7.2.3 — Outcome and labor-displacement claims

Outcome-based or labor-displacement pricing MAY be tested only when the outcome is objectively defined, attributable, auditable, and not misleading.

AMTECH MUST NOT convert speculative hours saved, revenue generated, or jobs replaced into billing or marketing claims without measured evidence and disclosed methodology.

### CBMP-7.2.4 — Experimental pricing

Pricing experiments MUST be versioned, explainable, reversible, and bounded by organization/account. The experiment assignment, offered terms, consent, effective period, and invoice calculation MUST be auditable.

### CBMP-7.2.5 — Entitlements

Entitlements MUST derive from a versioned commercial policy and MUST not be hand-coded at random call sites. Default-allow MVP behavior MUST be labeled and MUST NOT be represented as mature enforcement.

## 7.3 Labor economics ledger

### CBMP-7.3.1 — Required measures

Where measurable, AMTECH SHOULD track:

- tasks attempted and completed;
- human review minutes;
- exception and escalation rate;
- rework rate;
- time to usable result;
- provider and runtime cost;
- cost per completed work object;
- estimated and validated human time displaced;
- approval burden;
- customer/business outcome where causally supportable.

### CBMP-7.3.2 — No vanity displacement

“Hours saved,” “employee replaced,” or “runs a company” MUST remain hypotheses until a declared measurement protocol passes. Marketing language MUST match the evidence tier.

---

# 8. Research, Experimentation, and Plan Validation Protocol (REVP)

AMTECH is a research-driven system. Plans, architectures, autonomy claims, vector systems, generated interfaces, and monetization concepts MUST be auditable as hypotheses.

## 8.1 Validation-vector model

### REVP-8.1.1 — Plan decomposition

Every material plan MUST be decomposed into atomic claims. Each claim MUST identify:

- hypothesis;
- expected mechanism;
- affected users, employees, assignments, and systems;
- evidence class;
- validation method;
- pass/fail threshold;
- failure consequence;
- owner;
- current status.

### REVP-8.1.2 — Validation vector

Each claim MUST be represented by a validation vector with dimensions appropriate to the work. The default vector is:

```text
V = [
  labor_displacement,
  task_completion,
  authority_retention,
  identity_and_tenancy,
  governance,
  protocol_integrity,
  runtime_reliability,
  recovery,
  privacy_and_security,
  multi_modal_continuity,
  lean_business_usability,
  cost_and_capacity,
  commercial_validity,
  research_evidence,
  deployment_evidence
]
```

Each dimension MUST carry:

- `required | optional | not_applicable`;
- `pass | fail | unknown | blocked`;
- metric or invariant;
- threshold;
- evidence reference;
- confidence;
- validation date and release.

### REVP-8.1.3 — Hard-gate equation

A plan or release passes only when:

```text
PASS = all(required hard gates == pass)
       AND no(required hard gate == fail)
       AND every launch-critical unknown is resolved or explicitly waived
```

A weighted vector score MAY rank alternatives that have already passed hard gates. It MUST NOT convert a safety, authority, privacy, accounting, or deployment failure into a pass.

### REVP-8.1.4 — Plan-auditing matrix

Every major plan MUST expose four separate vectors:

1. **Theory vector** — whether the mechanism is coherent and supported by relevant research;
2. **Implementation vector** — whether contracts and code exist;
3. **Validation vector** — whether tests and benchmarks passed;
4. **Deployment vector** — whether the exact release passed in the intended environment.

Commercial plans SHOULD add a fifth **market vector** for willingness to pay, activation, retention, and real labor displacement.

## 8.2 Evidence classes

### REVP-8.2.1 — Evidence separation

The system MUST distinguish:

- theoretical plausibility;
- peer-reviewed or established research evidence;
- normative platform/provider behavior;
- AMTECH engineering assumption or budget;
- synthetic benchmark evidence;
- local implementation evidence;
- production-like evidence;
- live provider/runtime evidence;
- market/commercial evidence.

A paper supporting HRR/VSA composition does not prove conversion lift, website performance, employee quality, or commercial value.

### REVP-8.2.2 — Threshold provenance

Every numeric threshold MUST state whether it comes from research, provider constraints, regulation, measured AMTECH data, or an engineering budget. Arbitrary thresholds MUST be labeled as hypotheses.

### REVP-8.2.3 — Negative results

Failed experiments, null results, and simpler baselines that outperform novel methods MUST be retained. Research notes MUST not become success-only narratives.

## 8.3 Vector and HRR/VSA systems

### REVP-8.3.1 — Experimental status

HRR/VSA, graph propagation, vector retrieval, random projections, clustering, and generative experience compilation are experimental mechanisms unless separately accepted for the target use.

They MUST NOT be treated as authority, identity, privacy, anonymization, or proof.

### REVP-8.3.2 — Baseline comparison

A vector or HRR/VSA method MUST be compared against appropriate simple baselines, including as applicable:

- deterministic rules;
- exact flat scan;
- facet cosine;
- keyword or structured filtering;
- authored static UI/content;
- no-personalization baseline;
- human workflow baseline.

Novel complexity is justified only if it beats the relevant baseline on declared metrics without failing hard gates.

### REVP-8.3.3 — Determinism and reproducibility

Reference implementations MUST support deterministic fixtures, stable seeds, canonical serialization, independent parsing, constraint validation, and output hashing where applicable.

### REVP-8.3.4 — Synthetic data

Synthetic datasets MUST be labeled, isolated from live inference, and prohibited from becoming hidden customer profiles or sensitive-trait targets.

### REVP-8.3.5 — Privacy

A hash, embedding, vector, or HRR transform of identifying data remains identifying. Mathematical transformation MUST NOT be described as anonymization.

### REVP-8.3.6 — Uncertainty fallback

Experimental selection or generation systems MUST return a generic, deterministic, or reviewed fallback on error, low confidence, policy conflict, or insufficient evidence.

## 8.4 Experimental system protocol

### REVP-8.4.1 — Experiment registry

Experiments involving autonomy, generated UI, employee planning, pricing, assignment, content selection, or task routing MUST record:

- experiment ID and version;
- hypothesis;
- eligible population and scope;
- control and treatment;
- allocation method;
- metrics and guardrails;
- pass/fail thresholds;
- privacy classification;
- rollback path;
- start/end dates;
- evidence and conclusion.

### REVP-8.4.2 — Generated UI

Generated UI MUST be schema-constrained, Manager-owned, sandboxed where required, explanation-bearing, approval-bound, accessible, and backed by a generic fallback.

The UI MUST explain why it appeared, which authorized business facts were used, what decision is requested, and what action follows.

### REVP-8.4.3 — Autonomy

Autonomy claims MUST be measured as bounded task completion under policy, not conversational fluency. Increasing autonomy MUST not weaken approval, assignment, or proof requirements.

### REVP-8.4.4 — Research-to-production gate

A research artifact becomes a production dependency only after:

- implementation exists;
- deterministic tests pass;
- relevant baselines are compared;
- security/privacy review passes;
- operational cost is measured;
- failure fallback exists;
- target-environment proof is retained;
- operator approves the transition.

---

# 9. Deployment Integrity Protocol (DIP)

## 9.1 Acceptance criteria

### DIP-9.1.1 — Exact reporting

Validation reports MUST include branch, SHA, environment, commands/workflow, migrations, test counts, build targets, proof IDs, failures, skips, missing environment, and timestamp.

### DIP-9.1.2 — Static and unit gate

The release candidate MUST pass applicable shared, database, Manager, Hono, web, lint, unit, integration, acceptance-script, and production-image gates. A narrow workflow MUST not silently replace omitted product-wide validation.

### DIP-9.1.3 — Migration gate

All migrations MUST apply from blank production-shaped PostgreSQL and verify RLS, grants, constraints, leases, terminal claims, welcome gating, effect receipts, triggers, and existing-row compatibility.

### DIP-9.1.4 — Real Supabase gate

Before live acceptance, migrations and relationship-aware authorization MUST pass on an actual Supabase preview, staging, or disposable project. PostgreSQL emulation is CI evidence, not Supabase acceptance.

### DIP-9.1.5 — Identity and isolation matrix

Deployed tests MUST prove:

- unauthorized cross-employee denial;
- unauthorized cross-account denial;
- authorized shared-employee access;
- no unrelated assignment-memory leakage;
- malformed, expired, revoked, and wrong-scope credential rejection;
- intended private reachability and prohibited host/service reachability.

### DIP-9.1.6 — Rotation and recovery

A disposable employee test MUST prove credential rotation, old-token rejection, checksum change, runtime replacement, reboot reconstruction, drift repair, compensation, marker recovery, and convergence.

### DIP-9.1.7 — Provider ingress

A real provider test MUST prove verification, atomic insertion, duplicate evidence, ordering, retry, dead letter, effect receipt, replay, and ambiguous-effect protection.

### DIP-9.1.8 — Canonical onboarding

The canonical launch path is:

```text
public origin
-> real create-employee flow
-> real identity/phone verification
-> real organization/account/user relationship creation
-> employee assignment
-> durable provisioning
-> isolated runtime
-> authorized human work surface
-> provider-backed employee reply
-> useful connected-tool proof
```

Fixtures, dev login, manually injected results, and the public estimator MUST be rejected as launch proof.

### DIP-9.1.9 — Provider-backed work object

Live acceptance MUST include owner/human turn, employee runtime run, Model Gateway request, Manager envelope, approval and commit where required, provider/artifact receipt, materialization, audit, relationship scope, and billing attribution.

### DIP-9.1.10 — Release-bound proof

Proof MUST be redacted and bound to one release SHA and environment. Mixed-release, fixture-derived, missing-ID, or unredacted evidence MUST fail validation.

## 9.2 State discipline

### DIP-9.2.1 — Canonical states

| State | Meaning |
|---|---|
| `planned` | Designed, not implemented. |
| `research-specified` | Research and validation design exist; implementation does not. |
| `source-wired` | Source/schema/config and executable seams exist. |
| `locally-proven` | Passed in local or fixture environment. |
| `ci-accepted` | Exact head passed a named reproducible CI gate. |
| `production-like` | Passed on production-shaped infrastructure with test credentials. |
| `provider-accepted` | Real provider IDs and receipts exist. |
| `runtime-accepted` | Real employee runtime and host evidence exist. |
| `commercially-validated` | Real market/payment/retention evidence satisfies declared criteria. |
| `live-accepted` | Canonical end-to-end production behavior passed with retained proof. |
| `pending` | Required work/proof missing or blocked. |
| `failed` | Attempted gate failed. |

“Production-ready” is prohibited unless the exact tier and remaining gates are named.

### DIP-9.2.2 — No status inference

Status MUST NOT be upgraded from architecture, mocks, fixtures, stale runs, old containers, synthetic data, papers, confidence, visual inspection, or provider calls without retained IDs.

### DIP-9.2.3 — Built, tested, deployed, proven, accepted

These terms MUST remain distinct and must identify the relevant validation vector.

### DIP-9.2.4 — Fail-closed preflight

Preflight MUST report exact missing environment, arguments, identifiers, grants, or proof files and exit nonzero. It MUST NOT invent IDs or silently select dev bypasses.

### DIP-9.2.5 — Public estimator

The public estimator is a non-canonical acquisition/regression aid. It MUST NOT define product UX, employee model, commercial standard, or launch acceptance.

## 9.3 Phase gates

### DIP-9.3.1 — Completion

A phase is complete only when source, runtime validation, tests, documentation, required proof tier, and designated hard gates pass.

### DIP-9.3.2 — Next-phase work

Phase `N+1` MAY begin when Phase `N` interfaces are source-wired and stable. Phase `N` MUST NOT be called complete until its acceptance vector passes.

### DIP-9.3.3 — Status integrity

- pending is not complete;
- blocked is not in progress;
- research-specified is not implemented;
- source-wired is not live;
- a weighted score does not erase a hard fail;
- a workaround does not erase a blocker;
- an aspirational contract is not a capability.

---

# 10. Cross-Cutting Conformance Rules

## 10.1 Contract versioning

Durable and wire protocols MUST define versions and compatibility policy, including envelopes, events, assignments, grants, proof manifests, signed tokens, profile packages, provider adapters, work objects, and pricing policies.

## 10.2 Runtime schema enforcement

Externally supplied, model-generated, persisted JSON, and cross-service payloads MUST be runtime-validated. Type assertions do not establish conformance.

## 10.3 Idempotency

Every retryable operation MUST define key scope, uniqueness, canonical replay result, retry/terminal behavior, ambiguous-effect behavior, and retention.

## 10.4 Error and recovery semantics

Errors MUST indicate safe retry, waiting dependency, permanent denial, pre-effect failure, post-effect failure, or ambiguity.

## 10.5 Observability

Production boundaries MUST answer:

- what work was attempted;
- by which human, employee, provider, or system principal;
- under which organization/account/assignment;
- under which release, policy, and experiment;
- what authority and approval applied;
- what changed;
- what proof exists;
- whether retry or repair is safe;
- who pays and who benefits where commercially relevant.

## 10.6 Lean-business abstraction

Ordinary business users MUST NOT need Docker, Caddy, Supabase, MCP, Hono, Hermes, OAuth internals, JSON Schema, webhook, environment-variable, or provider-ID knowledge.

Technical complexity MUST remain inspectable in operator and research surfaces.

## 10.7 Exception process

An exception to a MUST rule requires human-operator approval and must record clause, scope, reason, threat/failure analysis, compensating control, owner, expiration, and proof.

An undocumented deviation is a gap.

---

# 11. Required Phase 2 Audit Method

After approval, the audit MUST:

1. inspect every active file under scope;
2. map each applicable clause to file-and-line evidence;
3. map organization/account/user/employee/assignment relationships and identify collapsed concepts;
4. rate each clause `conforming`, `partial`, `non-conforming`, `not implemented`, or `not applicable`;
5. distinguish source, local, CI, production-like, provider, runtime, commercial, and live evidence;
6. identify bypasses, alternate paths, missing runtime validation, and missing relationship enforcement;
7. construct a validation vector for every P0/P1 boundary;
8. assign severity using the approved P0-P4 definitions;
9. produce remediation with owner, dependency, phase, validation method, pass/fail threshold, and proof tier;
10. state explicitly if the architecture cannot support the infrastructure-for-AI-labor claim without a pivot or scope reduction.

The audit MUST search aggressively, but it MUST NOT fabricate findings to satisfy a quota. A low P0/P1 count requires complete evidence, not optimism.

---

# 12. Normative Source Map

Primary implementation evidence includes:

- `packages/shared/src/envelope.ts`;
- `packages/shared/src/work-events.ts`;
- `packages/shared/src/preview-links.ts`;
- `packages/shared/src/resource-payload.ts`;
- `packages/shared/src/materialization.ts`;
- `packages/shared/src/work-stream.ts`;
- `packages/shared/src/channel-routing.ts`;
- `packages/shared/src/tool-contracts.ts`;
- `packages/shared/src/tool-schemas.ts`;
- `packages/shared/src/approval-policy.ts`;
- `packages/shared/src/model-gateway.ts`;
- `packages/shared/src/profile-package.ts`;
- `packages/shared/src/admin.ts`;
- `apps/manager/src/lib/employee-stream.ts`;
- `apps/manager/src/lib/materialization.ts`;
- `apps/manager/src/lib/channel-router.ts`;
- `apps/manager/src/lib/turn-queue.ts`;
- `apps/manager/src/lib/runtime.ts`;
- `apps/manager/src/lib/session-rotation.ts`;
- `apps/manager/src/lib/mcp-server.ts`;
- `apps/manager/src/lib/mcp-auth.ts`;
- `apps/manager/src/lib/model-gateway.ts`;
- `apps/manager/src/lib/model-gateway-http.ts`;
- `apps/manager/src/lib/signed-links.ts`;
- `apps/manager/src/lib/metering.ts`;
- `apps/manager/src/lib/provisioning-state-machine.ts`;
- `apps/manager/src/lib/provisioning-reconciler.ts`;
- `apps/manager/src/lib/ambient-inbox.ts`;
- `apps/manager/src/webhooks/`;
- `apps/manager/src/provisioner.ts`;
- `apps/manager/src/provisioner-host.ts`;
- `packages/agent-template/`;
- `packages/db/migrations/`;
- `infra/deploy/`;
- `infra/caddy/`;
- `infra/scripts/`;
- `infra/acceptance/production-boundary-live.json`;
- `.github/workflows/employee-work-production-boundary.yml`;
- `docs/production-normal-employee-live-deploy-runbook.md`;
- `memory/MEMORY.md` and the current handoffs named in Section 0.3;
- all active tests.

The organization, assignment, shared-employee, validation-vector, and labor-native commercial clauses are binding architectural requirements even where the current source has not implemented them. Phase 2 must classify those areas honestly rather than treating missing ontology as not applicable.

---

# 13. Approval Record

This standard is proposed and not yet approved.

Human-operator approval SHOULD record:

- approver;
- approval date;
- approved commit SHA;
- accepted amendments;
- authorization to begin Phase 2 and create `GAPS.md` and `REMEDIATION.md`.

Until approval, this document may guide discussion but MUST NOT be represented as the accepted AMTECH production standard.
