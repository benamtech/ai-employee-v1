# 06 — Effect Graphs, Failure Semantics, and Observability

Status: **[VERIFIED] durable effect primitives; [INCOMPLETE] full compensation, telemetry, and chaos acceptance**

## Effect doctrine

[VERIFIED] AMTECH separates read, proposal, consequential effect, and repair/reconciliation behavior.

- **Read:** retrieves owner/employee-safe state and creates no command solely for observation.
- **Proposal:** creates a draft, artifact, recommendation, generated view, or approval request without performing the held external consequence.
- **Consequential effect:** changes customer, financial, credential, destructive, runtime, or broad external state.
- **Repair/reconciliation:** determines or restores state after retry, crash, provider ambiguity, drift, or partial execution.

[VERIFIED] A read error fails closed. [VERIFIED] A consequential effect is not represented as terminal success without accepted durable evidence. [VERIFIED] A transport timeout is treated as uncertainty, not proof of non-execution.

## Core identifiers

| Identifier | Purpose |
|---|---|
| account / employee / assignment / principal | authority and ownership scope |
| stable owner intent ID | duplicate-safe user retry |
| command ID | durable command/effect lifecycle |
| work-run ID | correlation from trigger through reasoning and output |
| correlation / causation ID | distributed event lineage |
| idempotency / effect key | provider or host effect uniqueness |
| approval ID | exact human gate resource |
| provider receipt ID | external provider acknowledgement |
| accounting receipt ID | commercial attribution of a provider effect |
| audit ID | immutable operator/owner/system action record |
| profile checksum | runtime configuration identity |
| runtime credential version | scoped credential lineage and rotation |

## Command/effect lifecycle

[VERIFIED] The command/effect kernel is persisted in PostgreSQL and used by owner turns and consequential tools.

```text
requested / registered
  → claimed
  → executing
  → succeeded + accepted receipt
  → failed + failed receipt
  → ambiguous + ambiguous receipt
  → repair / reconciliation
```

[VERIFIED] Command registration captures assignment, principal, policy, intent/effect identity, payload evidence, and correlation state. [VERIFIED] Atomic claims prevent concurrent duplicate execution. [VERIFIED] Application success is downstream of a terminal accepted receipt, not merely an adapter HTTP response.

## Owner-turn effect graphs

### EFFECT-001 — accepted owner turn

```text
owner message + stable intent ID
  → HttpOnly owner session
  → exact assignment / grant / policy authorization
  → durable owner.web.turn command registration
  → atomic claim
  → strict snapshot + current operating context
  → Hermes run/session request
  → runtime response + progress + usage
  → messages / events / artifacts / decisions
  → accepted terminal receipt
  → API terminal response
  → SSE / snapshot owner update
```

External calls: Manager-to-Hermes HTTP/SSE and optional Manager tools/provider adapters.

Durable writes: command/effect state, work runs, employee messages, events, artifacts, approvals, metering, audit, receipts.

### EFFECT-002 — duplicate owner retry

```text
same stable intent ID
  → same deterministic command/effect identity
  → existing claim/receipt returned or reconciled
  → no second Hermes turn
```

### EFFECT-003 — ambiguous runtime transport

```text
turn claimed
  → request sent
  → connection ends before terminal proof
  → command remains non-terminal or ambiguous
  → API 202 / bounded ambiguity
  → browser preserves intent ID and warns against a new resend
  → repair path inspects and reconciles terminal state
```

## Approval and provider effect graph

```text
employee proposes consequential action
  → durable approval request
  → WorkResource / signed Review / SMS decision surface
  → owner decision under current assignment and policy
  → action-specific command/effect claim
  → provider request with stable effect identity where supported
  → provider receipt
  → accounting/commercial receipt
  → audit/work-run evidence
  → accepted / failed / ambiguous terminal state
```

[VERIFIED] Generated UI and native cards converge at the same durable approval and action boundary.

## Model Gateway effect graph

```text
Hermes model request
  → employee-scoped bearer verification
  → token hash/version/expiry/revocation verification
  → employee/assignment binding
  → current payer/beneficiary/price relationship resolution
  → model/provider/rate policy
  → provider request with timeout and bounded retries
  → provider response and receipt extraction
  → provider usage receipt
  → accounting receipt
  → model_gateway_request_audit
  → bounded response with AMTECH proof
```

[VERIFIED] Provider content without a durable provider receipt is recorded as ambiguous and is not returned as proven success.

[INCOMPLETE] `spend_limit_cents` is currently a static positive/zero gate; it is not enforced against cumulative settled usage plus in-flight reservations.

[INCOMPLETE] Per-minute Model Gateway rate buckets are process-local memory. They reset on restart and do not coordinate replicas.

[INCOMPLETE] A provider timeout followed by retry can create duplicate upstream cost when the provider accepted the first request but its response was lost and no provider idempotency key is used.

## Provisioning effect graph

```text
activation / repair / lifecycle request
  → provisioning command/job
  → desired resource graph
  → database lease
  → persist effect keys before host call
  → signed Unix-socket request
  → Host Provisioner nonce/idempotency claim
  → render/checksum profile
  → create employee network and attach scoped peers
  → start Hermes container
  → runtime and Model Gateway acceptance probes
  → write/validate/reload Caddy route
  → persist observed resource state
  → channel/provider binding
  → welcome effect
  → ready
```

[VERIFIED] Runtime, routing, channel, welcome, and ready transitions are ordered. [VERIFIED] Profile rotation recreates the runtime before old Model Gateway credential revocation.

[INCOMPLETE] Full compensation and deterministic repair for every partial resource graph remain production gates.

## Ambient-event effect graph

```text
provider delivery
  → signature verification
  → ambient inbox insert / duplicate record
  → lease and ordering check
  → account/employee binding
  → provider dispatch
  → effect receipt claim
  → applied / failed / ambiguous receipt
  → processed / retryable_failed / waiting_for_binding / dead_letter
  → owner work materialization
```

[VERIFIED] Inbox processing and effect idempotency are separate durable primitives. [VERIFIED] Ambiguity and dead-letter state are explicit.

## Evidence layers

### Source and build evidence

- generated production source checks;
- TypeScript builds/typechecks;
- migration application and PostgreSQL matrices;
- source-contract tests;
- production image inclusion;
- exact-head workflow records.

### Runtime evidence

- profile checksum and file manifest;
- runtime endpoint and health observation;
- capability and toolset observations;
- credential version;
- provisioning resource-state evidence;
- container/network/Caddy inspection output.

### Business-effect evidence

- approval decision;
- command/effect terminal receipt;
- provider receipt;
- accounting receipt;
- artifact ID/link;
- work-run and correlation IDs;
- owner-safe event/message projection.

### Deployment evidence

[INCOMPLETE] Exact deployed SHA, image digests, migration ledger, environment/secret manifest, target-host network proof, DNS/TLS, provider packets, fixture-free browser/channel evidence, rollback result, and deployment attestation are not yet complete for this branch.

## Observability substrate

[VERIFIED] Current observability is domain-ledger oriented:

- `audit_log` and support/operator audit;
- work runs and meter events;
- model request audit;
- provider/accounting receipts;
- ambient inbox/dead letters/effect receipts;
- provisioning jobs/resource states/commands;
- runtime health snapshots;
- local container log rotation;
- CI artifact bundles.

[INCOMPLETE] There is no complete OpenTelemetry/Prometheus trace-metric-log pipeline, service-level objective dashboard, or fleet alert policy in source.

## Failure taxonomy

| Class | Meaning | Required behavior |
|---|---|---|
| authorization denied | principal/assignment/grant/policy does not permit action | deny, audit, no effect |
| validation failure | input/schema/business constraint invalid | bounded error, no effect |
| dependency unavailable | database/runtime/provider/network unavailable | retry or fail, preserve intent/effect identity |
| duplicate | same provider event or owner intent observed again | return existing state, no duplicate effect |
| ambiguous | request may have been accepted but receipt is absent | do not report success; repair/reconcile |
| drift | observed runtime/resource differs from desired state | inspect, record, repair through reconciler |
| dead letter | retry budget exhausted or ambiguity requires intervention | durable operator-visible record |
| stale revision | runtime/process/protocol identity differs from expected | fail closed and replace/reprovision |

## Crash points requiring production proof

1. [INCOMPLETE] process death after command claim but before provider dispatch;
2. [INCOMPLETE] provider accepts before receipt persistence;
3. [INCOMPLETE] receipt persists before owner projection;
4. [INCOMPLETE] Host Provisioner starts container before resource-state update;
5. [INCOMPLETE] Caddy reload succeeds before route evidence persists;
6. [INCOMPLETE] worker dies while an ambient effect receipt is claimed;
7. [INCOMPLETE] Model Gateway restarts with process-local rate state lost;
8. [INCOMPLETE] Manager restarts during a Hermes run or SSE attachment;
9. [INCOMPLETE] database failover occurs during lease/terminal receipt transitions;
10. [INCOMPLETE] rollback runs after migrations or provider bindings have partially changed.

## Interaction surfaces

### INTERACTION-EFFECT-001: idempotency × receipt | EMERGENT

[VERIFIED] Idempotency prevents duplicate dispatch when identity is known; receipts determine whether an earlier dispatch reached a terminal external state. Together they support safe retry.

Value: Authority 5 × Connectivity 5 × Bifurcation Awareness 5 × Wall Safety 5 → **20/20**.

### INTERACTION-EFFECT-002: strict reads × live UI | FEEDBACK

[VERIFIED] A database read failure becomes explicit degraded state rather than an empty owner surface, preserving trust and incident visibility.

Value: **19/20**.

### INTERACTION-EFFECT-003: commercial scope × provider receipt | TRANSFORM

[VERIFIED] Provider usage becomes attributable business cost only after current assignment/payer/beneficiary/price scope and receipt evidence agree.

Value: **20/20**.

### INTERACTION-EFFECT-004: runtime drift × reconciler | FEEDBACK

[VERIFIED] Desired resource state and observed runtime state form a repair loop. [INCOMPLETE] Deterministic live compensation/repair acceptance is not complete.

Value: **19/20**.
