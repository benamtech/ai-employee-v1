# 07 — Emergent Product Capability and Use-Case Manifold

Status: **[VERIFIED] primitive interactions; [INFERRED] product experiences derived from those interactions; [HYPOTHESIS] explicitly testable future basins**

This document maps product behavior that emerges only when multiple implemented dimensions interact. A single feature does not establish a product experience. Every trajectory below names the interacting source dimensions, the resulting experience, the business benefit, and the remaining acceptance condition.

## Primitive dimensions

| Dimension | Source-backed primitive |
|---|---|
| Identity | user, account, organization, principal, verified identity snapshot |
| Relationship | membership, employment, management, assignment, payer, beneficiary |
| Authority | assignment principal, resource grant, policy, approval, command/effect |
| Runtime | rendered profile, Hermes container, session/run, runtime endpoint |
| Context | manifest, business facts, live Manager resources, session history |
| Work | task, loop, active save, delegated unit, decision, artifact, event |
| Channel | Web, SMS, signed Review, provider event, future voice/customer surface |
| Capability | observed Hermes toolsets, Manager tools/resources, connector health |
| Effect | provider adapter, Model Gateway, provisioner, durable receipt |
| Commercial | payer/beneficiary/price, metering, provider/accounting receipt |
| Evidence | audit, work run, receipt, checksum, runtime health, deployment proof |
| Experience | operating layout, WorkResource, generated view, action grammar |

## Experience trajectories

### TRAJECTORY-EXP-001 — goal-level delegation

**Dimensions:** Context × Hermes runtime × Manager resources × Work projections.

- [VERIFIED] Manager can provide bounded business-brain resources, live connector/work/approval state, session continuity, and current operating context to a bound Hermes employee.
- [INFERRED] The owner can express a business goal without selecting a specific tool because Hermes can reason over the goal while Manager materializes task-agnostic loops, saves, decisions, outputs, and evidence.
- [INFERRED] The owner benefit is reduced workflow translation: the owner states desired business movement; the system preserves current work and returns only decisions or exceptions.
- [HYPOTHESIS] Provider-backed acceptance will show lower owner command count and fewer repeated context statements than a tool-first dashboard for the same multi-step job.

Acceptance: one fixture-free goal that invokes at least two capability classes, creates a durable active save or delegated unit, returns a decision, executes one approved effect, and leaves proof IDs.

### TRAJECTORY-EXP-002 — ambient office employee

**Dimensions:** Provider ingress × ambient inbox × Hermes wake × channel router × owner surface.

- [VERIFIED] Verified provider events can enter a durable inbox or normalized ingress, deduplicate, wait for binding, wake the employee or deliver directly, and materialize owner work.
- [INFERRED] The employee can notice and carry incoming office work without requiring the owner to open the application first.
- [INFERRED] The business benefit is asynchronous labor: replies, payments, reminders, accounting changes, and connector failures can become active saves, decisions, or proof.
- [HYPOTHESIS] A bounded triage policy can reduce unnecessary owner interruptions while preserving all high-risk, returned, failed, or ambiguous items.

Acceptance: live Gmail/Twilio/Stripe/QuickBooks packets through dedupe, ordering, effect receipt, owner projection, and replay/dead-letter evidence.

### TRAJECTORY-EXP-003 — one work object across channels

**Dimensions:** WorkResource × approval × signed preview × Web/SMS × receipt.

- [VERIFIED] A durable approval or artifact can materialize as one WorkResource and appear in Web, SMS-linked signed Review, and generated/native presentations.
- [INFERRED] Channel changes do not change the underlying decision or authority resource.
- [INFERRED] The owner benefit is continuity: review can begin in SMS and complete on mobile or Web without duplicate approvals or divergent copies.
- [HYPOTHESIS] Cross-channel proof will reduce approval abandonment compared with forcing all decisions into the full Web application.

Acceptance: the same approval ID and assignment/policy version observed across SMS, signed Review, Web, terminal effect, and receipt.

### TRAJECTORY-EXP-004 — generated operating artifact

**Dimensions:** typed WorkView × Manager compiler × sandboxed UI × host action intersection × approval/effect.

- [VERIFIED] Manager compiles typed table/schedule/diff/form views into sandboxed `ui://` resources and routes finite intents through authoritative WorkResource actions.
- [INFERRED] The employee can choose a presentation that fits the work without gaining DOM, credential, link, price, or action authority.
- [INFERRED] The business benefit is higher information density for estimates, schedules, reconciliations, comparisons, and batch decisions while preserving one action kernel.
- [HYPOTHESIS] Generated views will improve decision accuracy and completion time for multi-row work compared with prose-only responses.

Acceptance: provider-backed Hermes emits a typed view from real business context; owner action reaches the intended durable resource; external proof is rendered afterward.

### TRAJECTORY-EXP-005 — active-save continuity

**Dimensions:** tasks/reminders/events × return conditions × session continuity × operating layout.

- [VERIFIED] The surface represents work held for time, event, owner answer, approval, connection repair, or external response.
- [INFERRED] The employee can preserve unfinished business across sessions without relying on transcript memory alone.
- [INFERRED] The business benefit is fewer dropped follow-ups and less owner working-memory burden.
- [HYPOTHESIS] Active-save resurfacing will materially reduce forgotten customer and vendor commitments when measured against manual notes.

Acceptance: crash/restart and multi-day tests showing a held item returns exactly once under its durable condition with proof.

### TRAJECTORY-EXP-006 — exception-managed accounting

**Dimensions:** QuickBooks connector × business context × generated diff/table × approval × accounting receipts.

- [VERIFIED] Manager can read QuickBooks reports/entities, prepare bounded writes, require approval, commit through one audited path, and retain provider/accounting evidence.
- [INFERRED] The employee can prepare bookkeeping work and surface only disambiguation, policy, cash, or exception decisions.
- [INFERRED] The business benefit is reduced repetitive accounting labor without delegating unrestricted ledger authority.
- [HYPOTHESIS] A generated reconciliation view plus exception-only approval can handle a weekly bookkeeping batch with fewer owner interactions than individual form entry.

Acceptance: production-like batch from source documents/events to resolved entity names, generated review, approved writes, provider receipts, and post-write report verification.

### TRAJECTORY-EXP-007 — multi-owner bounded collaboration

**Dimensions:** account membership × explicit assignment principals × canonical grants × stable employee session/work state.

- [VERIFIED] Multiple human principals can receive explicit assignment authority without deriving employee access from account membership alone.
- [INFERRED] A business can let co-owners or managers operate one employee while viewers or unrelated account members remain excluded.
- [INFERRED] The business benefit is collaborative delegation without account-wide privilege expansion.
- [HYPOTHESIS] Explicit assignment roles will support manager/approver/operator separation once the broader role UX is implemented.

Acceptance: fixture-free multi-principal matrix through Web and channel actions, revocation, session invalidation, and audit.

### TRAJECTORY-EXP-008 — managed fractional/shared employee

**Dimensions:** assignment × payer relationship × beneficiary relationship × price version × employee capability/evidence.

- [VERIFIED] Commercial and usage records can distinguish payer and beneficiary relationships from employee assignment and account membership.
- [INFERRED] The data model can represent an employee whose work benefits one organization while another pays or manages the service.
- [INFERRED] Potential benefit: agencies, franchisors, parent companies, and managed-service operators can fund bounded employee capacity for downstream businesses.
- [HYPOTHESIS] A policy layer can support shared/fractional employees without leaking business context or effects between beneficiaries.

Acceptance: explicit product policy, tenant-isolation tests, per-beneficiary context/capability partitions, allocation, metering, and revocation proof.

### TRAJECTORY-EXP-009 — evidence-backed service guarantee

**Dimensions:** work runs × command/effect receipts × provider/accounting receipts × runtime/deployment evidence × owner Proof surface.

- [VERIFIED] Source contains the identifiers and ledgers needed to reconstruct many work and provider effect chains.
- [INFERRED] AMTECH can sell not only automation but inspectable completion and recovery evidence.
- [INFERRED] Potential benefit: support, compliance, dispute handling, billing, and service guarantees share one proof substrate.
- [HYPOTHESIS] A proof-by-job view and exportable evidence packet will materially improve owner trust after ambiguous or failed work.

Acceptance: end-to-end proof packet generated from one exact deployed SHA and one real job, including negative/failure evidence and recovery.

### TRAJECTORY-EXP-010 — operator-assisted runtime recovery

**Dimensions:** desired resource graph × runtime inspection × drift × support authority × deterministic repair.

- [VERIFIED] Provisioning jobs/resource states, inspect/repair operations, runtime health, checksums, and operator audit exist.
- [INFERRED] An operator can diagnose a specific employee runtime without obtaining owner credentials or bypassing tenant/assignment context.
- [INFERRED] Business benefit: managed reliability and faster restoration of employee service.
- [HYPOTHESIS] Deterministic repair and rollback can support an explicit recovery SLA once crash-point acceptance is complete.

Acceptance: controlled failures at container, network, profile, route, credential, provider-binding, and worker checkpoints with exact repair evidence.

### TRAJECTORY-EXP-011 — controlled power-user capability compiler

**Dimensions:** observed Hermes toolset × Manager registry × connectors × grants/policy × commercial entitlement × runtime revision.

- [VERIFIED] Each component source exists separately.
- [INFERRED] Their intersection can produce an exact effective-capability graph for one employee at one time.
- [INFERRED] Power users could inspect why an employee can, cannot, or must ask before performing a class of work.
- [HYPOTHESIS] Persisting this graph will reduce capability hallucination, stale UI, and operator debugging time.

Acceptance: persisted hash/proof of authored allowlist, observed runtime registry, connector health, assignment authority, entitlement, policy, and runtime revision.

### TRAJECTORY-EXP-012 — controlled connector-agnostic egress

**Dimensions:** employee isolation × Manager MCP × connector custody × egress policy × receipts.

- [VERIFIED] Current production employee networks allow Manager and Model Gateway peers but not arbitrary Internet egress.
- [INFERRED] A future controlled egress/MCP proxy can preserve isolation while adding tool-agnostic external integrations.
- [INFERRED] Benefit: new providers can enter through one custody, policy, audit, rate, and receipt substrate rather than custom runtime networking.
- [HYPOTHESIS] A declarative connector descriptor plus bounded proxy can add read-only tools without changing employee network topology.

Acceptance: SSRF/private-network denial, DNS pinning policy, credential isolation, assignment binding, schema congruence, rate/spend limits, audit, revocation, and provider receipt tests.

## Relationship manifold

| Interaction | Emergent relationship | Product consequence |
|---|---|---|
| principal × assignment | person/service is bound to one employee scope | exact access and revocation |
| employment × management | employee may be operated by a manager without redefining employer | delegated administration |
| payer × beneficiary | cost and benefit can belong to different organizations | managed/fractional service |
| connector custody × assignment | external account can be usable by one employee scope | bounded integrations |
| approval × resource | human decision targets one durable consequence | cross-channel exact review |
| runtime × profile revision | running cognition is tied to immutable configuration evidence | safe replacement and debugging |
| work run × provider receipt | reasoning/output is connected to external completion | outcome proof and billing |
| support lease × tenant scope | operator can inspect/repair with bounded temporary authority | managed support without owner impersonation |

## Feature-to-experience high-vector map

| Source feature combination | Experience | Benefit | Current basin |
|---|---|---|---|
| strict snapshot + adaptive layout + SSE | live operating point that fails visibly | trust and reduced scanning | source basin; live proof pending |
| ambient inbox + active saves + triage | employee notices and carries office work | asynchronous labor | source basin; load proof pending |
| generated UI + approvals + WorkResource | rich bounded review | faster accurate decisions | source basin; provider proof pending |
| payer/beneficiary + metering + receipts | attributed managed employee economics | new service models | data basin; reconciliation pending |
| isolated runtime + Manager MCP + Model Gateway | powerful employee without provider keys | tenant and credential containment | source basin; target-host proof pending |
| desired resource graph + drift + repair | recoverable employee runtime | reliability/SLA | partial repair basin |
| session continuity + work-run lineage | conversational continuity without transcript authority | durable business execution | source basin |
| proof surface + receipts + audit | evidence-backed completion | support/compliance/trust | partial experience basin |

## Forbidden attractor

[VERIFIED] The product does not enter an attractor where model-authored HTML, inferred psychographics, direct browser-to-Hermes credentials, account membership alone, process-local approvals, or duplicate effect paths become authority.

[INFERRED] Such an attractor would fragment receipts, increase retry ambiguity, conceal current grants/policy, and make cross-channel state irreconcilable.
