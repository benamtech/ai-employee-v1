# AMTECH STANDARD v0.1

**Status:** Proposed for human-operator approval  
**Baseline:** `employee-work@f01995fddddff0b2905922ec7b287307be52891e`  
**Effective scope:** `mvp-build/`  
**Effective date:** Not effective until approved by the AMTECH human operator  
**Review consequence:** After approval, this document is the binding contract for the Phase 2 codebase audit.

---

## 0. Purpose, Authority, and Interpretation

AMTECH AI Employee is infrastructure for AI labor. It is a runtime for installing, operating, governing, observing, repairing, and proving the work of persistent AI employees inside owner-operated small businesses. It is not a chatbot, prompt wrapper, workflow builder, CRM skin, estimator widget, or consumer productivity assistant.

A conforming AMTECH system gives a business owner one accountable employee relationship across communication surfaces and connected business systems. The employee performs work, remembers business context, prepares durable outputs, follows up, requests decisions only at legitimate authority boundaries, and leaves evidence that the work occurred. Manager is the invisible control plane. The runtime substrate, model provider, connector provider, and infrastructure topology are implementation details unless the owner must act on them.

This standard formalizes the contracts already expressed by the source, schemas, migrations, runtime scripts, profile package, tests, proof harnesses, and canonical production runbook. It also makes implicit architectural requirements explicit where relying on convention would permit incompatible future implementations.

### 0.1 Normative language

The terms **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

- **MUST / MUST NOT** define conditions required for conformance.
- **SHOULD / SHOULD NOT** define the default design rule. A deviation requires a documented reason and compensating control.
- **MAY** defines an allowed implementation choice.
- An implementation is not conforming merely because a TypeScript type exists. A runtime contract requires validation, persistence rules, authorization, recovery semantics, tests, and acceptance evidence appropriate to its risk.

### 0.2 Evidence hierarchy

When sources disagree, authority descends in this order:

1. deployed behavior with release-bound, redacted proof;
2. migrations, database constraints, grants, and RLS policy;
3. executable source and production infrastructure configuration;
4. automated tests and acceptance scripts;
5. current canonical runbooks and implementation records;
6. current memory handoffs;
7. non-canonical product notes, historical plans, fixtures, and archived documents.

No document may upgrade an implementation state beyond the strongest available evidence.

### 0.3 Scope and exclusions

This standard applies to all active implementation areas under `mvp-build/`, including:

- `apps/web/`;
- `apps/manager/`;
- `packages/shared/`;
- `packages/db/`;
- `packages/agent-template/`;
- `infra/`;
- active `docs/`;
- `ui-redesign/` where it remains an active product direction;
- unit, integration, acceptance, security, and golden-path tests.

The following are informative rather than normative implementation evidence:

- `../wiki/` vision material;
- `../identity.md` brand material;
- `CODEGRAPH.md` repository navigation;
- `docs/archive/` and other historical archives;
- fixtures, dev login paths, manually injected provider events, and the public estimator.

### 0.4 Conformance unit

A feature is conforming only when its entire production boundary conforms. The audit unit is therefore not a component or function in isolation. It is the full chain:

```text
trigger or owner instruction
-> authenticated and scoped intake
-> durable intent or command
-> employee reasoning or deterministic processing
-> approval decision when required
-> bounded side effect
-> provider or runtime receipt
-> owner-safe materialization
-> audit, metering, recovery, and proof
```

A success response without proof, a UI without durable state, a type without runtime validation, or a worker without recovery semantics is an incomplete boundary.

### 0.5 Foundational principles

Every AMTECH implementation MUST preserve these principles:

1. **Labor replacement, not tool usage.** Every feature MUST identify the employee duty it performs, the authority the owner retains, the durable result it produces, and how failure is recovered.
2. **Runtime, not wrapper.** AMTECH MUST add durable identity, memory, policy, lifecycle, routing, observability, repair, and proof around model execution. A thin provider configuration layer is not an AI Employee runtime.
3. **Protocol, not feature.** Cross-component and cross-surface behavior MUST use versioned, validated, recoverable contracts rather than ad hoc payloads.
4. **Governance by default.** No consequential action may occur without authenticated scope, provenance, policy evaluation, and an audit trail.
5. **One employee across surfaces.** Web, SMS, signed review links, connected systems, and future voice MUST project the same employee identity, work state, approvals, and proof.
6. **Lean-business native.** The default experience MUST work for a non-technical owner without enterprise IT knowledge, protocol vocabulary, or manual recovery procedures.
7. **Evidence before claims.** Built, tested, deployed, provider-accepted, runtime-accepted, and live-accepted are distinct states and MUST never be conflated.

---

# 1. Agent Employment Protocol (AEP)

The Agent Employment Protocol defines what constitutes one persistent AMTECH employee and how that employee's work is represented, serialized, continued, and rendered.

## 1.1 Work Surface Contract

### AEP-1.1.1 — Canonical work envelope

Every owner-visible unit of work MUST materialize through a canonical `SurfaceEnvelope` or a versioned successor with at least:

- stable envelope identifier;
- `account_id` and, when employee-specific, `employee_id`;
- semantic kind;
- owner-safe title and summary;
- status and creation time;
- render hints;
- safety metadata;
- proof references;
- an optional `WorkResource`;
- an optional scoped `WorkAction` set.

The envelope MUST contain a contract or schema version when persisted or transmitted across independently deployable components. TypeScript compile-time compatibility alone is insufficient.

### AEP-1.1.2 — Owner-safe projection

Raw provider payloads, secrets, bearer tokens, internal tool names, database implementation details, and untrusted external instructions MUST NOT reach an owner surface. Manager MUST compile provider and runtime events into typed, redacted, owner-safe descriptors.

The owner surface SHOULD use work language such as “estimate prepared,” “payment received,” “needs your approval,” or “employee needs attention,” not protocol language such as “MCP call,” “webhook payload,” or “tool invocation.”

### AEP-1.1.3 — WorkResource lifecycle

A `WorkResource` represents one inspectable unit of employee work. A conforming lifecycle MUST distinguish, where applicable:

```text
draft or observed
-> prepared
-> needs_owner_decision
-> approved | rejected | expired
-> committing
-> delivered | applied | completed
-> failed | ambiguous | superseded
```

The lifecycle MAY be projected from multiple durable records, but it MUST NOT be inferred solely from UI state. A terminal owner action MUST be idempotent and MUST NOT be applied twice.

### AEP-1.1.4 — WorkAction contract

Each `WorkAction` MUST declare:

- action type and owner-facing label;
- target resource and allowed scope;
- whether it is gated;
- authentication requirement;
- expiration and revocation behavior when link-based;
- idempotency or one-time-consumption semantics;
- resulting audit and proof records.

A rendering tier, rich widget, or agent-authored view MUST NOT relax an approval gate or expand the action scope.

### AEP-1.1.5 — Typed work-event grammar

Provider events, scheduled events, employee outputs, owner questions, and approval requests MUST be converted into a small typed grammar. The current normative moves are:

- `notify` — useful information with no immediate owner decision required;
- `question` — one concrete item the employee cannot safely infer;
- `review` — an owner decision required before work can continue;
- `silent` — durably recorded work or monitoring that does not warrant interruption.

Each event MUST include account and employee context, owner-safe copy, and any deliverable, acceptance actions, next action, and proof references.

### AEP-1.1.6 — Deliverable gate derivation

A deliverable MUST require an owner decision when it:

- leaves the business;
- communicates with a customer, prospect, supplier, government body, or other external party;
- moves, requests, commits, refunds, or materially represents money;
- writes to accounting or another system of record;
- deletes or destructively mutates business data;
- grants, rotates, revokes, or exposes credentials or external access;
- is otherwise classified high-risk by policy.

The gate MUST be derived from structured safety fields and centralized policy, not from wording in an LLM response.

### AEP-1.1.7 — CapabilityGraphNode contract

Every advertised capability MUST be represented as a validated `CapabilityGraphNode` or versioned equivalent containing:

- stable key and owner-facing label;
- category and summary;
- readiness status;
- setup requirement when blocked;
- trust source;
- whether it can run now;
- evidence or proof references.

A capability MUST NOT be shown as ready solely because a tool name exists. Readiness requires all necessary connector, credential, policy, entitlement, runtime, and health conditions.

### AEP-1.1.8 — Generic tool materialization

The platform MUST support the long tail of tools without bespoke UI code by compiling validated JSON Schema, bound input, safe output descriptors, and proof into a generic work resource. Native cards and MCP-UI MAY provide richer rendering, but the generic path MUST remain safe, inspectable, and approval-preserving.

### AEP-1.1.9 — Durable work projection

The owner snapshot, polling response, SSE initial frame, signed review resource, admin diagnostic view, and future voice summary MUST derive from the same durable work state. A surface-specific private copy of business state is prohibited.

## 1.2 Session Continuity Contract

### AEP-1.2.1 — One employee brain lane

Only one state-mutating reasoning turn MAY actively execute for a given employee at a time. Owner web turns, owner SMS turns, provider-event wakes, scheduled wakes, and approval follow-ups MUST enter a durable per-employee turn lane.

Concurrency control MUST use a database-backed compare-and-swap, row lock, lease, or equivalent atomic claim. In-process mutexes alone are insufficient for production.

### AEP-1.2.2 — Turn atomicity

A turn MUST have:

- a stable job or turn identifier;
- account and employee scope;
- turn kind and input;
- idempotency key;
- optional or required `run_id` correlation;
- claim owner and lease expiration;
- attempt count;
- terminal status;
- durable output or safe error.

A worker MUST complete a turn only while holding the current claim. A stale worker MUST NOT overwrite a later attempt.

### AEP-1.2.3 — Duplicate intent suppression

Duplicate owner messages, provider deliveries, approval resolutions, scheduled jobs, and action commits MUST converge on the canonical existing record. Duplicate suppression MUST preserve evidence that a duplicate occurred and MUST return or reference the canonical result when safe.

A duplicate request MUST NOT re-run an irreversible side effect merely because the original HTTP response was lost.

### AEP-1.2.4 — Channel, session, and presence model

The system MUST distinguish:

- employee identity;
- durable memory scope;
- transcript session;
- communication channel;
- channel presence;
- individual turn or run.

A stable memory key MUST NOT be mistaken for a transcript identifier. Session rotation MUST preserve durable business facts and an explicit carryover of unfinished work or the next safe action.

### AEP-1.2.5 — Presence-aware routing

Manager MUST record recent channel presence and use it only as a delivery preference, not as a source of truth. Active web presence MAY suppress redundant SMS delivery. The underlying event, work item, approval, and proof MUST remain durable regardless of chosen channel.

### AEP-1.2.6 — Silent event recording

A silent event MUST still produce a durable delivery decision or monitoring record. “Silent” means “do not interrupt the owner,” not “discard evidence.”

### AEP-1.2.7 — Handoff continuity

When a session rotates, a runtime restarts, or delivery moves between SMS and web, the next turn MUST receive enough bounded context to continue the current responsibility without asking the owner to repeat known information.

The handoff MUST preserve at least:

- unresolved approvals and questions;
- latest owner decision;
- active job or deliverable;
- relevant business-brain references;
- last completed step;
- next safe action;
- run and proof references.

### AEP-1.2.8 — Recovery behavior

If a runtime is unreachable, Manager MAY invoke bounded runtime recovery and retry the same claimed turn. Recovery MUST NOT create a second concurrent turn or a second external side effect. Retry limits and terminal failure behavior MUST be explicit.

## 1.3 Multi-Modal Rendering Contract

### AEP-1.3.1 — Surface parity

Every employee function MUST define how it appears on web, SMS, signed mobile review, and admin diagnostics. A function MAY be unavailable on a constrained surface only when a safe handoff is provided to a capable surface without losing identity, context, state, or action scope.

### AEP-1.3.2 — SMS discipline

Owner-facing SMS MUST:

- lead with the result or required decision;
- use plain business language;
- ask no more than one question per message;
- omit tool narration and intermediate reasoning;
- preserve signed links and critical amounts intact;
- target one 160-character GSM segment when no link or necessary context makes that unsafe;
- meter actual segment usage;
- use `[SILENT]` or an equivalent internal signal only to suppress delivery, never as owner-visible content.

The system MUST NOT truncate a signed link, approval scope, amount, recipient, or safety-critical qualification merely to satisfy a character target.

### AEP-1.3.3 — Signed mobile review

An SMS review link MUST resolve to the same owner-safe `WorkResource` rendered on web. The link MUST be:

- cryptographically authenticated;
- scoped to account, employee, resource, and allowed actions;
- expiring;
- revocable;
- resistant to cross-account and cross-resource substitution;
- one-time for terminal actions where replay would be harmful;
- fully audited on access and action.

### AEP-1.3.4 — Web durability and liveness

The web work surface MUST combine:

- a durable snapshot endpoint;
- an SSE or equivalent live stream;
- reconnect catch-up using a stable cursor;
- polling or snapshot fallback when streaming is unavailable;
- owner-session authorization and account scope.

The browser MUST NOT require direct access to privileged database tables to render the employee.

### AEP-1.3.5 — Voice migration contract

Voice is reserved but not live in v0.1. A future voice implementation MUST reuse the same employee identity, turn queue, work-event grammar, approval policy, signed handoff, audit, and materialization contracts. It MUST NOT introduce an independent voice-only business-logic path.

Voice MAY be claimed live only after proving:

- caller and owner identity policy;
- durable transcript and turn IDs;
- interruption and retry semantics;
- explicit handoff for approval and document review;
- replay protection;
- equivalent provider receipts and audit evidence;
- graceful fallback to SMS or web.

---

# 2. Trust & Governance Protocol (TGP)

The Trust & Governance Protocol defines retained owner authority, employee delegation, identity, access scope, provenance, and evidence.

## 2.1 Delegation Retention Model

### TGP-2.1.1 — Employment delegation sequence

The governing sequence is:

```text
employee observes or receives work
-> employee performs internal reversible work
-> employee proposes consequential action when required
-> owner approves, rejects, or edits
-> system executes exactly the approved scope
-> provider or runtime returns evidence
-> Manager records audit and materializes proof
```

The owner delegates labor, not ultimate authority over reputation, money, credentials, destructive acts, or legal commitments.

### TGP-2.1.2 — Autonomous internal work

Internal, reversible, non-sensitive work SHOULD execute without owner approval. Examples include:

- reading already authorized business context;
- organizing job information;
- drafting an estimate or email;
- preparing an accounting preview;
- research;
- calculating or rendering an artifact;
- maintaining internal reminders;
- monitoring connector or runtime health.

Requiring approval for routine internal work violates the employee model unless a specific risk, cost, privacy, or policy condition is documented.

### TGP-2.1.3 — Mandatory approval categories

Owner-authenticated approval is REQUIRED before:

- customer-, prospect-, vendor-, or public-facing communication;
- invoice delivery, payment movement, refunds, purchases, or spending;
- QuickBooks or other system-of-record writes;
- destructive mutation or deletion;
- bulk external action;
- connection or permission grants that expose business data or permit writes;
- credential rotation or revocation that can interrupt live work, unless initiated by an authorized operator under an emergency policy;
- any high-risk action designated by policy.

### TGP-2.1.4 — No self-approval

An employee runtime MUST NOT approve its own gated action. Owner-authenticated web sessions, scoped signed review links, or an equivalently strong owner channel MUST resolve owner-required approvals.

### TGP-2.1.5 — Approval binding

An approval MUST bind to:

- account and employee;
- action key;
- resource or pending-write references;
- owner-safe summary;
- risk level;
- intended recipient, amount, or external target where applicable;
- creation and expiration time;
- resolution and resolver identity;
- one execution scope.

A generic “yes” without a bound action and resource MUST NOT authorize an unrelated side effect.

### TGP-2.1.6 — Auto-bound delegation

Standing or auto-bound approvals MAY exist only when they are:

- explicit and owner-authenticated;
- narrow in action, resource class, recipient, amount, frequency, and time;
- revocable;
- visible to the owner;
- evaluated on every action;
- audited with the policy version used;
- incapable of authorizing credentials, destructive actions, or materially novel recipients by default.

Blanket perpetual approval is non-conforming.

### TGP-2.1.7 — Approval wake and continuation

An approval resolution MUST wake or resume the waiting workflow idempotently. Approval does not itself prove that the external action occurred. Completion requires a separate commit and provider receipt.

## 2.2 Identity & Scope Protocol

### TGP-2.2.1 — Bound employee identity

Every employee runtime MUST receive separate, scoped credentials for each privileged control-plane surface. At minimum, Manager MCP and Model Gateway credentials MUST be bound to one account and one employee.

The model MUST NOT supply, choose, or override `account_id` or `employee_id` for privileged calls. Manager MUST inject identity from the authenticated credential.

### TGP-2.2.2 — No shared employee bearer

A platform-global bearer token, provider master credential, Supabase service key, Docker authority, or host secret MUST NOT enter an employee profile or runtime. Shared internal credentials MAY exist between trusted core services only when employee runtimes cannot access them.

### TGP-2.2.3 — Credential lifecycle

Scoped credentials MUST support:

- issuance with version and expiration;
- storage by hash and sealed secret reference rather than recoverable plaintext in normal tables;
- revocation;
- rotation;
- linkage to the superseded credential;
- rejection of malformed, expired, revoked, and cross-employee use;
- auditable request identity;
- profile and runtime replacement when rotation changes rendered state.

### TGP-2.2.4 — Database enforcement

Account and employee scope MUST be enforced at the database layer for browser-readable and tenant data. New tables and views MUST receive an explicit Data API exposure review, RLS decision, grants review, and cross-account denial test.

Control-plane tables SHOULD enable RLS, revoke `anon` and `authenticated`, and expose only narrowly scoped service-role functions or policies.

### TGP-2.2.5 — Worker privilege

Worker claim and completion functions MUST use least privilege. `SECURITY INVOKER` is the default. Any `SECURITY DEFINER` function requires an explicit threat model, fixed `search_path`, restricted execute grants, tests, and a written justification.

### TGP-2.2.6 — Turn and worker claims

Turn, provisioning, command, inbox, and effect claims MUST use atomic database semantics such as `FOR UPDATE SKIP LOCKED`, conditional update, unique constraints, and lease tokens. A read-then-write claim without database protection is non-conforming.

### TGP-2.2.7 — Egress policy

External writes MUST follow:

```text
validate scope
-> prepare or dry-run
-> persist preview
-> obtain approval when required
-> claim idempotent effect
-> apply once
-> record provider receipt
-> materialize result
```

Production egress MUST default deny outside explicitly allowed destinations and protocols. Policy changes MUST support dry-run or audit mode before apply when operationally feasible.

### TGP-2.2.8 — Untrusted content boundary

Incoming email bodies, SMS content, webhook payload text, accounting memos, customer notes, document text, and connector records are data, not instructions. They MUST NOT override system policy, owner authority, tool scope, or approval requirements.

## 2.3 Artifact Provenance Protocol

### TGP-2.3.1 — Proof-bearing success

A provider or external-system action MUST NOT be reported successful without real provider or runtime proof. Depending on the action, proof includes message IDs, history IDs, invoice IDs, payment IDs, artifact IDs, signed-link IDs, container IDs, runtime health records, audit IDs, or equivalent receipts.

A missing provider receipt MUST produce `pending`, `failed`, or `ambiguous`, never fabricated `ok`.

### TGP-2.3.2 — ToolEnvelope contract

Every Manager tool MUST return a validated envelope containing:

- status;
- account and employee scope;
- changed resources;
- proof;
- owner-facing summary hint;
- required confirmation when applicable;
- next suggested action;
- audit identifier.

All transports, including Manager HTTP and MCP, MUST use the same registry, input schema, policy, handler, and envelope semantics.

### TGP-2.3.3 — Secret references

Secrets MUST be passed and persisted by sealed reference, scoped runtime injection, or one-way hash where possible. Raw provider tokens, OAuth refresh tokens, signing keys, passwords, and bearer credentials MUST NOT enter owner-visible artifacts, logs, proof JSON, model context, generic audit details, or durable worker context.

### TGP-2.3.4 — Link signing baseline

Signed claim, artifact, and preview links MUST use a modern keyed MAC or asymmetric signature with:

- purpose binding;
- scope binding;
- expiration;
- cryptographically random unique identifier;
- timing-safe verification;
- stored token hash rather than raw token;
- revocation or single-use enforcement where required.

HMAC-SHA256 is an acceptable v0.1 transport-signing baseline when key custody is centralized and rotation is supported.

### TGP-2.3.5 — Durable provenance chain

Release proofs, externally portable artifact attestations, and long-lived provenance claims SHOULD use an asymmetric Ed25519 signing chain so verifiers do not require possession of a platform signing secret. AMTECH MUST NOT describe the current HMAC link mechanism as an Ed25519 or independently verifiable chain.

Before AMTECH claims independently verifiable artifact provenance, the system MUST define signer identity, key rotation, key revocation, signature envelope versioning, canonical serialization, and verification tooling.

### TGP-2.3.6 — Audit minimum

Every privileged or consequential action MUST record, as applicable:

- actor and actor type;
- account and employee;
- action and target resource;
- run, turn, request, approval, and provider IDs;
- safe input and output hashes or summaries;
- policy or credential version;
- result and error code;
- timestamps;
- changed resources;
- redacted evidence.

Audit records MUST be append-oriented and tenant-inaccessible unless an explicit owner-safe projection is defined.

### TGP-2.3.7 — End-to-end provenance

A completed work object SHOULD be traceable through:

```text
owner or provider trigger
-> durable inbox/turn
-> employee run
-> Manager tool invocation
-> approval when required
-> external effect receipt
-> artifact or work resource
-> delivery decision
-> owner-visible proof
```

No single audit table is sufficient if the identifiers required to join the chain are absent.

---

# 3. Runtime Infrastructure Protocol (RIP)

The Runtime Infrastructure Protocol defines the fleet, lifecycle authority, model-provider boundary, reconciliation model, and usage accounting required for persistent AI labor.

## 3.1 Fleet Lifecycle Contract

### RIP-3.1.1 — Per-employee isolation

Each production employee MUST run in an isolated runtime with:

- an employee-specific runtime identity;
- an employee-specific internal network or equivalent isolation boundary;
- no Docker socket;
- no database service credential;
- no provider master key;
- no peer-employee access;
- no direct control-plane access except explicitly scoped routes;
- bounded CPU, memory, processes, capabilities, and writable paths;
- read-only canonical profile files;
- explicit temporary secret storage.

### RIP-3.1.2 — Image pinning

The v0.1 compatibility baseline is `hermes-agent:0.18.0`. Production MUST pin an approved image version and SHOULD pin an immutable digest. A floating tag such as `latest` is prohibited.

Changing the runtime image MUST trigger profile/runtime compatibility validation and release-bound acceptance.

### RIP-3.1.3 — Host authority separation

Manager MUST NOT possess public arbitrary Docker authority. Host lifecycle operations MUST cross a private provisioner boundary with:

- Unix socket or equivalently private transport;
- authenticated and integrity-protected requests;
- short expiry;
- nonce or replay protection;
- idempotency key;
- operation allowlist;
- fixed host-side Docker arguments;
- durable audit evidence.

Only the host provisioner MAY hold the Docker socket in the canonical topology.

### RIP-3.1.4 — Private routing

Employee runtimes MAY reach only explicitly allowed host-private endpoints using employee-scoped credentials. Model Gateway and runtime ports MUST bind to host loopback or a private network and MUST NOT be exposed through public Caddy or Cloudflare routes.

Public employee routing MUST activate only after runtime and gateway health acceptance.

### RIP-3.1.5 — Desired-state reconciliation

Employee fleet state MUST be reconstructed from durable desired state, not from process memory or the current Docker inventory. The reconciler MUST:

1. claim a job or command with a lease;
2. inspect observed resources;
3. calculate the next transition;
4. apply one bounded effect;
5. verify evidence;
6. persist the result;
7. continue, retry, compensate, dead-letter, or terminate.

One worker pass SHOULD apply at most one externally meaningful effect.

### RIP-3.1.6 — Provisioning order

Initial readiness MUST preserve this dependency order or a proven equivalent:

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

Channel/provider binding and owner-facing welcome effects MUST NOT occur before runtime and route acceptance. `ready` MUST be prevented by durable state constraints or checks until the welcome effect is durably processed.

### RIP-3.1.7 — Retry and compensation

Provisioning and lifecycle effects MUST classify failures as retryable, terminal, waiting for dependency, compensating, or ambiguous. Retries MUST be bounded and back off. Compensation MUST be explicit, idempotent, and evidenced.

A failed filesystem marker, stale lease, orphan container, stale route, missing network, missing profile, checksum drift, expired credential, or interrupted Manager process MUST NOT permanently block reprovisioning.

### RIP-3.1.8 — Reboot and drift recovery

A host or Manager restart MUST reconstruct all desired ready employees without manual recreation. Scheduled drift inspection MUST detect and repair at least:

- missing or wrong container;
- missing or wrong employee network;
- stale Caddy route;
- missing, writable, or checksum-mismatched profile;
- unhealthy runtime;
- expired or wrong-version credential;
- stuck provisioning job or command;
- inconsistent provider binding.

### RIP-3.1.9 — Crash resilience

Core services and employee runtimes MUST have explicit restart behavior and health checks. `restart: unless-stopped` is the v0.1 baseline for the Docker deployment. Health checks MUST test the real service boundary, not merely process existence.

### RIP-3.1.10 — Pod Alpha operator contract

The first production operating unit MUST provide scripted, auditable operations for:

- deploy and rollback;
- health inspection;
- employee provision, suspend, resume, replace, reprovision, and teardown;
- credential rotation and revocation;
- backup and restore;
- red-health diagnosis;
- drift inspection and repair;
- ingress and egress policy review;
- capacity reporting;
- proof collection.

Operator commands MUST report exact missing environment requirements and MUST fail closed rather than fabricate partial success.

## 3.2 Provider Abstraction Contract

### RIP-3.2.1 — Business-logic independence

Business logic MUST depend on AMTECH contracts, not provider-specific response shapes. Model and connector provider details MUST terminate at an adapter, gateway, or connector boundary.

A provider swap MUST NOT require rewriting approval policy, work materialization, session continuity, audit semantics, or owner surfaces.

### RIP-3.2.2 — Model Gateway custody

Employee runtimes MUST call a host-private, OpenAI-compatible Model Gateway using a stable model alias and an employee-scoped credential. The gateway MUST own:

- provider master credentials;
- provider and upstream-model selection;
- allowlist enforcement;
- retry and timeout policy;
- rate and spend enforcement;
- circuit breaking or provider-unavailable behavior;
- usage capture and cost attribution;
- redacted request audit.

### RIP-3.2.3 — Configurable orchestrator

Front-door orchestration MAY use an OpenAI-compatible or another explicitly supported provider. Provider, base URL, model, maximum tokens, temperature, and response format MUST be configuration, not embedded business logic.

### RIP-3.2.4 — Structured output

Machine-consumed model output MUST use strict `json_schema` when supported. If a provider rejects that response format, the system MAY retry with `json_object` only when it:

- detects a response-format compatibility failure;
- records the fallback and provider response;
- validates the returned object against the same runtime schema;
- rejects missing, extra, or unsafe fields according to policy;
- does not silently accept free-form text as structured state.

A provider-specific fallback MUST NOT weaken the business contract.

### RIP-3.2.5 — Provider error taxonomy

Provider failures MUST be normalized into stable categories such as authentication or credit, rate limit, unavailable, bad request, timeout, and unknown. Owner-facing copy MUST remain useful and non-technical; operator diagnostics MUST retain provider, model, endpoint, status, and safe error evidence.

### RIP-3.2.6 — Connector two-door invariant

Inbound provider events MUST cross two separate boundaries:

```text
public request
-> provider authenticity verification
-> atomic durable inbox insertion
-> asynchronous business processing
```

The public webhook handler MUST NOT perform the primary business side effect before durable insertion.

## 3.3 Cost Accounting Protocol

### RIP-3.3.1 — Immutable usage facts

Metering MUST record immutable usage facts and MUST NOT be treated as authorization or final billing. A metering write failure SHOULD NOT abort owner-facing work, but the failure MUST be observable through health or reconciliation.

### RIP-3.3.2 — Correlation

A `run_id` MUST thread through the distributed work chain wherever a run exists, including owner turns, provider events, model calls, Hermes runtime runs, Manager tools, provider APIs, SMS, artifacts, scheduler work, and delivery decisions.

### RIP-3.3.3 — Accounting dimensions

The metering foundation MUST support attribution across at least these six dimensions, whether implemented as ledgers, immutable events plus views, or both:

1. employee;
2. conversation or transcript session;
3. run;
4. action or tool invocation;
5. customer, job, or business object when known;
6. provider and feature category.

Per-account aggregation is also REQUIRED.

### RIP-3.3.4 — Meter categories and units

The protocol MUST support model tokens, runtime execution, Manager tools, provider API calls, SMS segments, storage, artifacts, scheduler activity, elapsed time, bytes, and monetary cost. Provider IDs, request IDs, latency, status, and safe metadata SHOULD be captured.

### RIP-3.3.5 — Billing derivation

Billing MUST be derived from immutable usage facts and versioned pricing policy. Base subscription, model usage, SMS, payment/accounting provider costs, storage, and managed service charges MAY be combined, but commercial price points MUST remain configuration rather than hard-coded protocol behavior.

The canonical commercial direction at this baseline is free entry plus a managed AI Employee beginning at $400 per month; the standard does not freeze a price.

### RIP-3.3.6 — Budget enforcement

Employee-scoped spend and rate limits MUST be enforced transactionally before AMTECH claims multi-replica production enforcement. Process-local counters MAY support a single-process baseline but MUST NOT be represented as globally strict.

Budget denial MUST produce a typed, owner-safe state and an operator-visible reason. It MUST NOT silently degrade into unmetered provider use.

---

# 4. Employee Capability Protocol (ECP)

The Employee Capability Protocol defines how employee profiles, skills, connectors, and tools become a coherent worker rather than a collection of prompts.

## 4.1 Profile Package Contract

### ECP-4.1.1 — Base plus overlay

An employee profile MUST consist of:

- a vertical-agnostic employment core;
- a validated profile package or vertical overlay;
- business-specific context rendered from onboarding and durable facts;
- runtime and connector configuration injected by Manager;
- explicit skills and resource pointers.

The constant employment core MUST define accountability, work completion, authority boundaries, communication discipline, untrusted-content handling, and learning behavior.

### ECP-4.1.2 — First package, not platform limit

`contractor_estimator` is the first optimized package for painting, landscaping, and adjacent contractors. It MUST NOT become a hard-coded platform boundary. Provisioning MUST accept additional validated package keys without forking the core runtime.

### ECP-4.1.3 — Deterministic rendering

Profiles MUST be rendered from validated parameters, schemas, and explicit templates. Free-form LLM generation MUST NOT create security-sensitive configuration, credentials, network policy, or runtime command lines.

The render input MUST include account, employee, package, business, owner, timezone, workflows, skills, workspace, runtime backend, gateway policy, and bounded business context.

### ECP-4.1.4 — Fail-closed integrity

Production rendering MUST fail closed on:

- unknown, empty, or unresolved required tokens;
- forbidden secret names or values;
- provider master-key slots;
- unsafe permissions;
- writable canonical profile files;
- checksum mismatch;
- invalid package schema;
- unapproved direct connector custody.

Visible unresolved placeholders MAY be useful during local diagnostics, but a profile containing them MUST NOT start in production.

### ECP-4.1.5 — Runtime backend injection

The profile MUST receive the runtime backend and terminal backend as separate concepts. In the canonical Docker employee, the container is the isolation boundary and Hermes terminal execution is local inside that boundary. Nested Docker or a mounted host Docker socket is prohibited.

### ECP-4.1.6 — Business brain

Durable business facts MUST be stored as sourced facts or resources with confidence and provenance where possible. The employee MUST consult existing business context before asking the owner and MUST distinguish known fact, inferred assumption, and missing information.

### ECP-4.1.7 — Skill learning

A recurring solved procedure SHOULD become a versioned skill, rule, or durable business-brain resource rather than remain only in transient conversation. New skills MUST inherit the same tool, approval, secret, audit, and surface contracts as built-in skills.

## 4.2 Skill Discovery Contract

### ECP-4.2.1 — Capability registry

Manager MUST compile capabilities from validated sources such as:

- Manager tool registry;
- Manager MCP resources;
- Hermes or profile skills;
- connector state;
- runtime health;
- entitlement;
- approval policy.

The employee MAY emit candidate capabilities, but Manager MUST validate them before the owner sees them as available.

### ECP-4.2.2 — MCP discovery

Manager MCP MUST expose `tools/list`, `tools/call`, `resources/list`, and `resources/read` through one authenticated employee-bound transport. Tool input schemas MUST derive from the same runtime validation source used by the handler.

The model MUST NOT construct raw Manager HTTP requests or handle authentication details.

### ECP-4.2.3 — Resource map

At minimum, an employee SHOULD be able to discover owner-scoped resources for:

- business brain and business facts;
- connector status;
- artifacts and outputs;
- approvals;
- work queue and resurfacing;
- runtime health;
- capability registry.

Resources MUST be owner-safe and account-scoped.

### ECP-4.2.4 — ConnectionSurface lifecycle

Every connected system MUST project a `ConnectionSurface` or versioned equivalent with:

```text
not_connected -> needs_you -> connected -> working
```

A connection is not `working` merely because OAuth returned. Connector test, authorization scope, health, and recent successful use MUST be distinguishable.

### ECP-4.2.5 — Connector custody

Read-only connectors MAY be wired directly to the employee only when an explicit custody policy permits it. Write-capable, money-affecting, customer-facing, or sensitive connectors MUST remain behind Manager policy, approval, egress, and audit.

### ECP-4.2.6 — ResurfaceItem contract

Unfinished approvals, questions, failures, reminders, blocked connectors, runtime degradation, and other obligations MUST be projected as `ResurfaceItem` records with a reason, status, target, channel policy, and proof.

Resurfacing MUST deduplicate the same underlying obligation across surfaces.

## 4.3 Tool Execution Contract

### ECP-4.3.1 — Single registry

Manager HTTP and MCP MUST be transports over one tool registry, one input schema source, one handler, one policy layer, and one envelope contract. Parallel implementations of the same business tool are prohibited.

### ECP-4.3.2 — Runtime validation

Every tool input MUST be validated at runtime. JSON Schema advertised to the model MUST derive from the validation source of truth. Unknown tools, scheduler-only tools, invalid input, unauthorized scope, and unsupported phases MUST return explicit typed failure.

### ECP-4.3.3 — Employee tool loop

The conforming execution loop is:

```text
employee decides work is needed
-> tool schema guides input
-> Manager injects identity
-> Manager validates policy and input
-> tool prepares or executes bounded work
-> Manager returns ToolEnvelope
-> employee reports the envelope result, proof, and next move
```

The employee MUST prefer a real tool action over a conversational promise and MUST NOT claim a provider event or external result that Manager did not return.

### ECP-4.3.4 — Approval-gated writes

Consequential writes MUST use a preview-and-commit pattern:

```text
prepare preview
-> persist pending resource
-> request owner approval
-> owner resolves out of band
-> claim one idempotent commit
-> provider applies
-> receipt recorded
```

The commit MUST verify that the approval matches the pending resource and action.

### ECP-4.3.5 — Query-only paths

Authorized read-only queries generally SHOULD NOT require approval. They MUST still enforce account scope, connector scope, redaction, untrusted-content policy, usage accounting, and audit as appropriate.

### ECP-4.3.6 — Scheduler ownership

Timer-driven dispatch, watch renewal, daily briefs, and other scheduler-only actions MUST NOT be callable by the employee unless explicitly designed for that purpose. The employee may create durable reminders or schedules; the protected scheduler owns firing them.

### ECP-4.3.7 — Repair tools

The operator and Manager MUST support bounded repair capabilities for replay, relink, duplicate marking, redelivery, suppression, regeneration, runtime replacement, reprovisioning, drift repair, and credential rotation.

Repair actions MUST preserve original evidence, create new audit entries, and avoid erasing the causal chain.

### ECP-4.3.8 — Ambiguous effects

When an irreversible provider request may have succeeded but no reliable receipt exists, the system MUST mark the effect `ambiguous` and dead-letter or require operator inspection. It MUST NOT retry blindly.

---

# 5. Human Interface Protocol (HIP)

The Human Interface Protocol defines the owner-manager relationship and the operator surface. It is not a generic application-navigation specification; it is the human control plane for delegated labor.

## 5.1 Owner Work Surface

### HIP-5.1.1 — Owner is the manager

Product language MUST treat the business owner as the employee's manager, not as a software “user.” The owner assigns work, receives results, supplies missing judgment, approves consequential action, and reviews proof.

Configuration terminology SHOULD be hidden unless the owner is intentionally changing employee policy or a connection.

### HIP-5.1.2 — Required owner functions

The owner surface MUST make these functions available, whether as named destinations or equivalent clear projections:

- **Home:** employee status, current work, activity, and useful quick actions;
- **Talk:** direct conversation with the employee;
- **Proof:** artifact and document review;
- **Connected:** connection state and repair needs;
- **Tell Avery / delegation entry:** natural-language assignment to the employee;
- **Needs your say:** exact approvals and questions with context;
- **Watching:** quiet monitoring and work that does not need interruption;
- **Recent proof:** completed work and receipts.

The employee name MAY differ from Avery; the delegation concept is normative, not the literal label.

### HIP-5.1.3 — Work-first hierarchy

The default owner experience MUST prioritize:

1. work that requires the owner's decision;
2. active or blocked work;
3. newly completed results and proof;
4. employee or connection health requiring action;
5. optional configuration.

Dashboard metrics and technical status MUST NOT displace actual work obligations.

### HIP-5.1.4 — Exact approvals

An approval view MUST show enough context to make a decision without opening an unrelated system, including recipient or target, amount where applicable, artifact or diff, risk, expiration, and what will happen after approval.

Buttons such as “Approve” MUST resolve a bound action, not a generic state flag.

### HIP-5.1.5 — Honest state copy

The interface MUST distinguish preparing, pending OAuth, connected, working, awaiting approval, committing, sent, paid, failed, ambiguous, and expired. “Connected,” “sent,” “recorded,” “paid,” “live,” or “ready” MUST NOT be displayed without corresponding evidence.

### HIP-5.1.6 — Non-technical recovery

Owner-facing failures MUST explain what is blocked, whether work was lost, what the employee or AMTECH is doing, and the single next owner action if one exists. Raw stack traces, environment variable names, provider payloads, database codes, and protocol jargon are prohibited on owner surfaces.

## 5.2 SMS Ambient Inbox

### HIP-5.2.1 — Primary role

SMS is primarily the direct owner-to-employee channel. It MUST preserve the same employee identity, memory, turn serialization, and business context as web.

### HIP-5.2.2 — Approval routing

SMS MAY alert the owner to an approval, but consequential resolution SHOULD occur through a scoped signed mobile review unless the SMS identity and reply-binding protocol provides equivalent security and action specificity.

### HIP-5.2.3 — Silent notification policy

Ambient provider events SHOULD interrupt the owner only when they contain a meaningful result, decision, failure, deadline, or next action. Monitoring noise MUST remain silent and visible on web or in a later brief.

### HIP-5.2.4 — Delivery decision

Every attempted owner notification MUST produce a delivery decision containing intent key, move, chosen channel, reason, proof, and fallback. Web presence, missing phone, duplicate intent, SMS provider failure, and silence MUST be distinguishable.

### HIP-5.2.5 — Sender and consent

SMS delivery MUST use the employee's authorized sender identity, a verified owner number, and the applicable consent and compliance policy. Cold outbound is prohibited by default.

## 5.3 Admin Operator Surface

### HIP-5.3.1 — Role separation

The admin surface MUST enforce explicit platform roles such as platform owner, platform operator, support read-only, billing operator, and security reviewer. Role checks MUST occur server-side.

### HIP-5.3.2 — Support access

Support access to account or employee detail MUST require an authenticated platform actor and a recorded support reason. Sensitive content MUST be redacted by default.

### HIP-5.3.3 — Required operator functions

The operator surface MUST support:

- fleet and environment health;
- account and employee readiness;
- provisioning and lifecycle status;
- repairs and replay;
- connector and provider diagnosis;
- proof and audit inspection;
- redacted support access;
- usage and cost visibility;
- billing state when implemented.

### HIP-5.3.4 — Command-mediated mutation

Admin lifecycle actions MUST enqueue durable provisioning commands or invoke a bounded, audited repair contract. Direct mutation of Docker, Caddy, profile files, or terminal employee state from a browser handler is prohibited.

### HIP-5.3.5 — Destructive confirmation

Destructive production operations MUST require:

- exact target employee;
- explicit destructive flag;
- allowlist or equivalent scope check;
- exact confirmation value;
- disposable or approved target policy;
- release and environment binding;
- redacted proof output.

### HIP-5.3.6 — Readiness proof tiers

Admin readiness MUST state the proof tier, such as static, local mirror, limited live infrastructure, or provider/runtime live. A green static check MUST NOT imply a live employee is ready.

---

# 6. Deployment Integrity Protocol (DIP)

The Deployment Integrity Protocol defines what AMTECH may claim, how phases close, and what evidence is required before real businesses depend on the system.

## 6.1 Acceptance Criteria

### DIP-6.1.1 — Exact validation reporting

Every validation report MUST include:

- exact git SHA;
- branch and target environment;
- exact commands or workflow run;
- current migration count and range;
- current test suites and test counts;
- build and typecheck targets;
- proof artifact paths or IDs;
- failures, skips, and missing environment requirements;
- timestamp.

Historical pass counts MUST NOT be repeated as current proof without a rerun on the claimed head.

### DIP-6.1.2 — Static and unit gate

At minimum, the current release candidate MUST pass the applicable:

- shared contract typecheck and build;
- database package typecheck and build;
- Manager/Hono typecheck and build;
- web typecheck and production build;
- lint;
- unit tests;
- acceptance-script syntax checks;
- production image builds.

A narrower production-boundary workflow MAY supplement but MUST NOT silently replace omitted product-wide gates.

### DIP-6.1.3 — Migration gate

All migrations MUST apply from a blank production-shaped database in order. Migration acceptance MUST verify constraints, RLS, grants, functions, leases, terminal claims, welcome gating, effect receipts, and trigger behavior rather than only successful SQL execution.

### DIP-6.1.4 — Supabase integration gate

Before live acceptance, migrations and RLS behavior MUST be applied and tested on an actual Supabase preview, staging, or disposable project with Supabase roles, Auth, Storage, and Data API behavior. A locally emulated PostgreSQL environment is CI evidence, not Supabase live acceptance.

### DIP-6.1.5 — Isolation gate

A deployed test MUST prove:

- two employees cannot use each other's MCP or Model Gateway credentials;
- malformed, expired, revoked, and cross-employee tokens fail closed;
- employee runtimes cannot reach peers, Docker, database, metadata endpoints, public Model Gateway, or unrelated host services;
- intended host-private routes remain reachable.

### DIP-6.1.6 — Rotation and recovery gate

A disposable employee test MUST prove credential rotation, old-token rejection, profile checksum change, runtime replacement, reboot reconstruction, drift repair, compensation, stale-marker recovery, and idempotent convergence.

### DIP-6.1.7 — Provider ingress gate

A real provider test MUST prove authenticity verification, atomic insertion, duplicate evidence, ordering behavior, retry, dead letter, effect receipt, replay, and exactly-once external-effect protection.

### DIP-6.1.8 — Canonical onboarding gate

The only launch-acceptance path is:

```text
public production origin
-> real /create-ai-employee
-> real Twilio Verify
-> real owner account
-> Start Employee
-> durable host-private provisioning
-> isolated runtime
-> owner work surface
-> provider-backed employee reply
-> useful connected-tool proof
```

Fixtures, `/api/dev/login`, host `live:*` helpers, Quick Tunnels, manually injected provider results, and the public estimator MUST be rejected as launch proof.

### DIP-6.1.9 — Generated work-object gate

Live acceptance MUST include at least one provider-backed work object proving:

- owner turn;
- employee runtime run;
- Model Gateway request;
- Manager envelope;
- approval and commit when required;
- provider or artifact receipt;
- owner-safe materialization;
- audit and run correlation.

### DIP-6.1.10 — Release-bound proof

Proof artifacts MUST be redacted and bound to one release SHA and environment. Destructive phases MUST identify the approved target. A consolidated validator MUST reject mixed-release, fixture-derived, missing-ID, or unredacted evidence.

## 6.2 State Discipline

### DIP-6.2.1 — Canonical state vocabulary

AMTECH MUST use these states precisely:

| State | Meaning |
|---|---|
| `planned` | Designed but not implemented. |
| `source-wired` | Source, schema, configuration, and executable seams exist. Exact static checks are stated. |
| `locally-proven` | Behavior passed on a developer or fixture environment. |
| `ci-accepted` | The exact head passed a named reproducible CI workflow. |
| `production-like` | Behavior passed on a production-shaped host with test credentials and no fixture substitution. |
| `provider-accepted` | Real external-provider IDs and receipts exist. |
| `runtime-accepted` | Real deployed employee runtime and host evidence exist. |
| `live-accepted` | Canonical end-to-end production behavior passed with real provider/runtime consequences and retained proof. |
| `pending` | Required work or proof is unattempted, blocked, missing, or not retained. |
| `failed` | The attempted gate did not pass. |

“Production-ready” is prohibited unless the speaker names the exact readiness tier and remaining live gates.

### DIP-6.2.2 — No status inference

Status MUST NOT be upgraded from:

- architecture or design intent;
- TypeScript compilation;
- mocks or fixtures;
- old containers;
- a stale workflow run;
- a manually edited database row;
- confidence or visual inspection;
- a provider request without a retained ID;
- a successful local path when the claim is live.

### DIP-6.2.3 — Built, deployed, and proven

Reports MUST distinguish:

- **built:** implementation exists;
- **tested:** a named automated or manual test passed;
- **deployed:** the exact release is running in a named environment;
- **proven:** the claimed boundary produced retained evidence;
- **accepted:** the designated gate and operator criteria passed.

These words are not interchangeable.

### DIP-6.2.4 — Fail-closed preflight

Preflight scripts MUST print exact missing environment variables, arguments, identifiers, or proof files and exit nonzero. They MUST NOT manufacture placeholder IDs, silently select dev bypasses, or mark a partial phase complete.

### DIP-6.2.5 — Non-canonical estimator

The public estimator and its production-like scripts are acquisition or regression aids only. They MUST NOT define product UX, price, employee profile, normal-employee acceptance, or launch status.

## 6.3 Phase Gate Contract

### DIP-6.3.1 — Phase completion

A phase is complete only when all required work is:

- source-wired;
- runtime-validated where contracts cross boundaries;
- covered by the required tests;
- documented in active implementation records and runbooks;
- accepted at the proof tier defined by that phase;
- free of unresolved blockers designated for that phase.

### DIP-6.3.2 — Starting the next phase

Phase `N+1` MAY begin after Phase `N` is source-wired and its interfaces are stable enough to build against. Phase `N` MUST NOT be reported complete until every completion condition in DIP-6.3.1 is satisfied.

### DIP-6.3.3 — Status integrity

- `pending` is not `complete`;
- `blocked` is not `in progress`;
- `source-wired` is not `live`;
- a workaround does not erase a launch blocker;
- an aspirational contract is not an implemented capability.

### DIP-6.3.4 — Approval of this standard

Phase 2 enforcement MUST NOT begin until the human operator approves this document. Approval establishes the clause set and version against which `GAPS.md` and `REMEDIATION.md` are produced.

Any substantive change after approval MUST increment the standard version or record an approved amendment. The audit MUST name the exact standard revision used.

---

# 7. Cross-Cutting Conformance Rules

## 7.1 Contract versioning

Every durable or wire-level protocol that may outlive one deployment MUST define a version and compatibility policy. This includes work envelopes, inbox events, proof manifests, signed tokens, profile packages, provider adapters, and generated work objects.

Breaking changes require migration, dual-read compatibility, or an explicit cutover plan. Silent reinterpretation of an existing persisted field is prohibited.

## 7.2 Runtime schema enforcement

Externally supplied, model-generated, persisted JSON, and cross-service payloads MUST be runtime-validated. Type assertions such as `as SomeType` do not establish conformance.

Schema validation failures MUST produce a stable error classification and MUST NOT execute a side effect.

## 7.3 Idempotency

Every operation that can be retried by HTTP clients, workers, schedulers, providers, owners, or operators MUST define:

- idempotency key scope;
- uniqueness enforcement;
- canonical replay result;
- retryable versus terminal behavior;
- ambiguous-effect behavior;
- expiration or retention policy.

## 7.4 Error and recovery semantics

Errors MUST state whether the operation is safe to retry, waiting on a dependency, permanently denied, failed before effect, failed after effect, or ambiguous. Generic exceptions without recovery meaning are non-conforming at production boundaries.

## 7.5 Observability

Production boundaries MUST expose enough structured telemetry to answer:

- what work was attempted;
- for which account and employee;
- under which release and policy;
- who or what triggered it;
- which provider/runtime handled it;
- whether approval was required and resolved;
- what changed;
- whether retry or repair is safe;
- what proof the owner and operator can inspect.

Logs MUST be redacted and bounded. Owner/customer content SHOULD NOT be logged unless explicitly required and protected.

## 7.6 Lean-business usability

The default owner journey MUST NOT require knowledge of:

- Docker, Caddy, Supabase, MCP, Hono, Hermes, OAuth internals, JSON Schema, webhooks, environment variables, or provider IDs;
- manual database edits;
- command-line recovery;
- enterprise identity administration;
- protocol-specific troubleshooting.

Technical complexity belongs in Manager and the operator surface. When owner action is required, the interface MUST ask for the smallest concrete business decision.

## 7.7 Exception process

A temporary exception to a SHOULD rule requires a documented reason. An exception to a MUST rule requires explicit human-operator approval and MUST record:

- clause ID;
- affected component and release;
- business reason;
- threat or failure analysis;
- compensating control;
- owner;
- expiration or removal milestone;
- proof that the exception is bounded.

An undocumented deviation is a gap, not an exception.

---

# 8. Audit Method Required by This Standard

After operator approval, the Phase 2 audit MUST:

1. inspect every active file under the stated scope;
2. map each applicable clause ID to concrete file-and-line evidence;
3. rate the clause `conforming`, `partial`, `non-conforming`, `not implemented`, or `not applicable`;
4. distinguish source evidence from live proof;
5. identify bypasses, alternate paths, and missing enforcement;
6. assign severity using the approved P0-P4 definitions;
7. produce an actionable remediation with owner, dependency, validation, proof tier, and phase assignment;
8. state explicitly when the architecture cannot support the AI-labor claim without a pivot or scope reduction.

The audit MUST NOT manufacture ten P0/P1 findings to satisfy a quota. It MUST, however, search aggressively enough that a low count is supported by complete evidence rather than optimism.

---

# 9. Normative Source Map

The following active implementation areas are the primary evidence for this standard. This list is navigational and does not exempt unlisted files from audit.

## 9.1 Employment and profile behavior

- `packages/agent-template/SOUL.md`
- `packages/agent-template/workspace/AGENTS.md`
- `packages/agent-template/workspace/manager-tools.md`
- `packages/agent-template/config.yaml`
- `packages/agent-template/README.md`
- `packages/shared/src/profile-package.ts`

## 9.2 Work and surface contracts

- `packages/shared/src/envelope.ts`
- `packages/shared/src/work-events.ts`
- `packages/shared/src/preview-links.ts`
- `packages/shared/src/resource-payload.ts`
- `packages/shared/src/materialization.ts`
- `packages/shared/src/work-stream.ts`
- `packages/shared/src/channel-routing.ts`
- `apps/manager/src/lib/materialization.ts`
- `apps/manager/src/lib/employee-stream.ts`
- `apps/manager/src/lib/channel-router.ts`

## 9.3 Identity, tools, approvals, and provenance

- `packages/shared/src/tool-contracts.ts`
- `packages/shared/src/tool-schemas.ts`
- `packages/shared/src/approval-policy.ts`
- `packages/shared/src/model-gateway.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/mcp-auth.ts`
- `apps/manager/src/lib/model-gateway.ts`
- `apps/manager/src/lib/model-gateway-http.ts`
- `apps/manager/src/lib/signed-links.ts`
- `apps/manager/src/lib/run-tool.ts`

## 9.4 Session and runtime continuity

- `apps/manager/src/lib/runtime.ts`
- `apps/manager/src/lib/turn-queue.ts`
- `apps/manager/src/lib/session-rotation.ts`
- `apps/manager/src/lib/agent-context.ts`
- `apps/manager/src/lib/runtime-recovery.ts`

## 9.5 Fleet and provider ingress

- `apps/manager/src/lib/provisioning-state-machine.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/lib/provisioner-idempotency.ts`
- `apps/manager/src/provisioner.ts`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/ambient-inbox.ts`
- `apps/manager/src/webhooks/`
- `infra/deploy/`
- `infra/caddy/`
- `infra/scripts/employee-lifecycle.mjs`
- `infra/scripts/local/start-hermes-container.sh`

## 9.6 Database enforcement

- `packages/db/migrations/`
- `packages/db/src/`
- `tests/integration/`

## 9.7 Acceptance and deployment integrity

- `.github/workflows/employee-work-production-boundary.yml`
- `infra/acceptance/production-boundary-live.json`
- `infra/scripts/acceptance/`
- `docs/production-normal-employee-live-deploy-runbook.md`
- `tests/unit/`
- `package.json`

---

# 10. Approval Record

This standard is proposed, not yet approved.

Human-operator approval SHOULD record:

- approver;
- approval date;
- approved commit SHA;
- accepted amendments, if any;
- authorization to begin Phase 2 and create `GAPS.md` and `REMEDIATION.md`.

Until that approval exists, this document may guide discussion but MUST NOT be represented as an accepted AMTECH production standard.
