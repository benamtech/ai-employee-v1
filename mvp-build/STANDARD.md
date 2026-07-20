# AMTECH Standard v0.2 — Ratified Production Standard

Status: **ratified and effective**  
Effective date: **2026-07-19**  
Approved by: **AMTECH human operator through the production-governance directive recorded in draft PR #23**  
Approved source baseline: `employee-production-tuesday@ee006c0d830367a69673e91d7b859226cae62c1f`  
Ratification implementation: `AMTECH-P0-GOV-001` commits on `employee-production-tuesday`  
Scope: `mvp-build/`, its production interfaces, and repository documents that make product or release claims  
Supersedes: `AMTECH STANDARD v0.1 — Draft 2`  
Evolution record: `validation/standard-v0.2-evolution-vector.json`  
Research disposition: `docs/architecture/16-standard-research-basis-and-protocol-disposition.md`

---

## 0. Authority, interpretation, and change control

### STD-0.1 — Purpose

AMTECH is infrastructure for governed AI labor. It creates, assigns, operates, supervises, measures, repairs, and commercializes persistent AI Employees and workforces for owner-operated businesses.

A conforming product preserves separate concepts for:

- human, employee, service, provider, and system principals;
- organization, account, team, assignment, project, and work object;
- ownership, employment, access, authority, custody, benefit, and payment;
- model reasoning, runtime execution, capability discovery, external effects, and human-facing presentation.

Models, Hermes, Hono, PostgreSQL/Supabase, Docker, Caddy, MCP, MCP Apps, AG-UI, OAuth providers, and individual SaaS systems are replaceable mechanisms. Durable AMTECH labor, authority, effect, proof, and recovery contracts are the product boundary.

### STD-0.2 — Normative language

`MUST`, `MUST NOT`, `REQUIRED`, `SHOULD`, `SHOULD NOT`, and `MAY` are normative.

A type, prompt, interface, generated page, architecture document, or passing fixture is not by itself a production implementation. Production conformance requires runtime validation, durable state, authorization, recovery behavior, tests, and evidence appropriate to the claim.

### STD-0.3 — Evidence hierarchy

When sources disagree, authority descends in this order:

1. release-bound deployed behavior with retained, redacted proof;
2. applied database constraints, migrations, grants, policies, and durable transitions;
3. executable source and generated production infrastructure;
4. exact-SHA automated tests, acceptance scripts, and signed build evidence;
5. this Standard and the active production program;
6. current CODEGRAPH and architecture maps;
7. the newest indexed memory handoff;
8. historical records, plans, fixtures, screenshots, demos, and research notes.

No document may upgrade implementation status beyond the strongest available evidence.

### STD-0.4 — Conformance unit

A capability conforms only when its entire boundary conforms:

```text
trigger
→ authenticated principal
→ explicit assignment or approved platform/system context
→ current relationship, grant, policy, entitlement, and authority version
→ durable intent, command, event, or work object
→ Hermes reasoning or deterministic processing
→ bounded capability selection and runtime validation
→ approval when required
→ one idempotent external-effect reservation
→ accepted | failed | ambiguous durable receipt
→ role-safe materialization
→ audit, metering, billing attribution, revocation, recovery, and proof
```

A success response without proof, UI without durable state, tool without assignment scope, authorization token without custody and revocation, or worker without recovery semantics is an incomplete boundary.

### STD-0.5 — Standard evolution

Normative changes MUST:

- retain stable clause identifiers or provide an explicit crosswalk;
- classify each change as `expansion`, `satisfaction`, `narrowing`, `destructive_modification`, `appendix`, or `reorientation`;
- record implementation and supersession references;
- identify lost protection or changed product claims;
- receive human approval when a MUST is removed or weakened;
- update `validation/standard-v0.2-evolution-vector.json`.

Unrecorded destructive modification is prohibited. Git history preserves earlier Standards; current documents must not pretend historical claims were always current.

### STD-0.6 — External frameworks

NIST AI RMF, NIST SSDF, OWASP Agentic Top 10, IETF OAuth RFCs, MCP specifications, MCP Apps, AG-UI, OpenTelemetry semantic conventions, SLSA, in-toto, and Sigstore are research and interoperability inputs. AMTECH MUST state whether it conforms, partially maps, profiles, or merely references each framework. Reference does not equal certification or legal compliance.

---

## 1. Foundational product principles

### STD-1.1 — Labor replacement, not tool exposure

Every production capability MUST identify:

1. the human duty reduced or replaced;
2. the information a competent worker needs;
3. the work the employee performs without interruption;
4. retained human authority;
5. the durable artifact, communication, decision, or system change proving completion;
6. the exception and recovery path;
7. remaining human review burden.

A tool catalog alone is not an employee.

### STD-1.2 — Runtime, not wrapper

AMTECH MUST add durable identity, assignment, context, policy, lifecycle, routing, observability, repair, and proof around model execution.

### STD-1.3 — Protocol, not provider feature

Cross-component and cross-provider behavior MUST use versioned, runtime-validated AMTECH contracts. Provider response shapes may be retained as evidence but MUST NOT become the product ontology.

### STD-1.4 — Governance by default

Consequential action requires provenance, assignment scope, authority evaluation, policy, durable effect state, and audit.

### STD-1.5 — Workforce, not singleton

The architecture MUST support multiple employees, humans, organizations, accounts, assignments, payers, beneficiaries, and explicitly shared labor relationships without collapsing them into one identifier.

### STD-1.6 — One employee identity across surfaces

A given assignment MUST project consistent work state, approvals, context, and proof across Web, SMS, signed Review, connected-system events, and future channels.

### STD-1.7 — Lean-business native

Owners MUST NOT need to understand Docker, Caddy, PostgreSQL, MCP, MCP Apps, AG-UI, OAuth internals, JSON Schema, webhooks, provider IDs, or environment variables. Those details remain inspectable by authorized operators.

### STD-1.8 — Evidence before claims

`planned`, `source-wired`, `locally-proven`, `ci-accepted`, `database-accepted`, `runtime-accepted`, `provider-accepted`, `browser/channel-accepted`, `commercial-accepted`, `live-accepted`, and `production-ready` are distinct states.

### STD-1.9 — Moat definition

AMTECH's defensibility MUST come from reusable, measured labor protocols:

- assignment and authority graphs;
- connector and capability manifests;
- work-object grammars;
- approval and effect policies;
- provider and failure adapters;
- recovery playbooks;
- business-process context;
- outcome and cost evidence.

It MUST NOT depend on hiding provider-specific code, claiming a generic agent wrapper is proprietary, or binding the product to one model laboratory.

---

## 2. Agent Employment Protocol

### AEP-2.1 — Stable employee identity

An AI Employee MUST have a stable platform identity independent of a browser session, model provider, runtime container, account membership, or one customer's ownership claim.

### AEP-2.2 — Assignment is execution scope

Every employee action MUST resolve through an explicit assignment, engagement, or access grant defining:

- employee and organization/account scope;
- authorized human and system principals;
- task, capability, resource, connector, and memory scope;
- approval authority;
- effective, expiration, suspension, and revocation state;
- payer, beneficiary, pricing, provenance, and audit policy.

### AEP-2.3 — Shared and fractional employees

Shared access MUST be explicit, revocable, policy- or time-bounded, and resource-scoped. Memory, credentials, provider context, and work products MUST NOT cross assignments without an exact shared-resource grant.

### AEP-2.4 — Per-employee turn lane

Only one state-mutating reasoning turn MAY execute for one employee at a time unless a future version specifies parallel sub-turns with deterministic merge semantics. Different employees MAY execute concurrently.

A turn MUST carry stable intent, turn/job ID, assignment, initiating principal, channel, idempotency key, run ID, claim and lease, attempt count, terminal state, and durable output or safe error.

### AEP-2.5 — Duplicate suppression

Duplicate owner messages, provider events, approval resolutions, schedules, delegated tasks, and effect commits MUST converge on canonical durable records. Lost responses MUST NOT repeat irreversible effects.

### AEP-2.6 — Session rotation and recovery

Runtime restart, session rotation, channel change, delegation, and supervisor change MUST preserve a bounded handoff containing current scope, unresolved decisions, active work, latest authorized state, proof references, last completed step, and next safe action.

### AEP-2.7 — Work object and lifecycle

Material work MUST use a versioned `SurfaceEnvelope`, `WorkResource`, or compatible successor containing stable identity, assignment scope, semantic kind, state, timestamps, role-safe summary, render hints, actions, safety metadata, and proof references.

Lifecycle state derives from durable records, including as applicable:

```text
observed | drafted
→ prepared
→ needs_information | needs_authority | needs_connection | needs_approval
→ approved | rejected | expired
→ committing
→ delivered | applied | completed
→ failed | ambiguous | superseded | cancelled
```

### AEP-2.8 — Work actions

Every action MUST declare target, assignment, required actor, policy/approval requirement, expiration, revocation, idempotency, resulting transition, audit, and proof.

### AEP-2.9 — Role-safe projection

Raw provider payloads, credentials, bearer tokens, untrusted instructions, hidden internal prompts, and unrelated tenant data MUST NOT reach human surfaces. Authorized viewers MAY receive different projections of the same work object.

---

## 3. Organization, tenancy, identity, and access

### OTIAP-3.1 — Relationship graph

Identity, organization, account, assignment, ownership, employment, management, custody, payer, beneficiary, and access are separate durable relationships.

### OTIAP-3.2 — Access is not ownership

Account membership, employee ID possession, phone ownership, bearer possession, mutable headers, and caller-selected IDs are not complete authority.

### OTIAP-3.3 — Relationship-bound credentials

Every credential MUST identify holder, assignment or approved platform context, resource audience, action scope, authority version, issue/expiry, revocation, and audit provenance.

### OTIAP-3.4 — Least relationship privilege

Authorization MUST evaluate the minimum applicable relationship and role. Viewer principals remain read-only. Support and platform authority are explicit, purpose-bound, and auditable.

### OTIAP-3.5 — Partitioning

Memory, work queues, connectors, artifacts, approvals, receipts, commercial attribution, and runtime resources are assignment-partitioned unless an exact shared grant exists.

### OTIAP-3.6 — Database enforcement

Authorization-sensitive invariants SHOULD be enforced in PostgreSQL constraints, RLS, grants, policies, or security-definer functions where practical. Browser projections and TypeScript checks are defense in depth, not substitutes.

### OTIAP-3.7 — Revocation

Relevant authority-version changes MUST fail closed across owner sessions, employee credentials, signed resources, connectors, approvals, runtime credentials, and queued consequential work.

---

## 4. Trust, approval, effects, and provenance

### TGP-4.1 — Internal work and approval

Internal drafting, analysis, and reversible preparation SHOULD proceed without interruption when policy allows. Customer-facing, monetary, destructive, credential, reputation, or broad external effects require explicit policy and, where specified, assignment-aware approval.

### TGP-4.2 — No self-approval

The employee, model, browser, provider callback, tool result, or UI component MUST NOT manufacture or resolve human approval.

### TGP-4.3 — Exact approval binding

Approval MUST bind exact resource identity, content/hash/version, action, actor class, assignment, policy, expiry, and relevant authority version. Resource mutation invalidates stale approval.

### TGP-4.4 — Durable effect contract

Consequential effects use stable intent, immutable command, atomic claim/lease, effect reservation, idempotency key, accepted/failed/ambiguous receipt, retry policy, repair path, audit, and commercial attribution.

An uncertain provider outcome is `ambiguous`, not a retryable failure. Reconcile before retry.

### TGP-4.5 — Untrusted content

Provider content, documents, web pages, emails, tool descriptions, MCP resources, and generated UI are untrusted inputs. They cannot alter authority, policy, secrets, or system instructions.

### TGP-4.6 — Proof-bearing success

Provider-backed success requires matching provider/effect evidence. “Completed” without the receipt appropriate to the boundary is prohibited.

### TGP-4.7 — Signed resources and attestations

Signed links and tokens are audience-, resource-, action-, assignment-, expiry-, and authority-version-bound. Portable release attestations SHOULD use standard in-toto/SLSA statement formats and managed signing/verifier systems where suitable. HMAC transport tokens are not independently verifiable supply-chain provenance.

### TGP-4.8 — Agentic threat profile

Threat modeling and tests MUST cover goal hijack, prompt injection, tool misuse, excessive agency, identity/privilege abuse, memory poisoning, unsafe inter-agent communication, supply-chain compromise, cascading failure, resource exhaustion, and operator deception.

---

## 5. Runtime and fleet infrastructure

### RIP-5.1 — Manager/Hermes boundary

Hermes owns employee reasoning, runs, transcript/session continuity, runtime-local memory, tool use, and runtime recovery. Manager owns identity, assignments, authority, context resources, capability/tool contracts, connector custody, approvals, durable effects, commercial attribution, revocation, repair, and release proof.

Do not create a parallel agent runtime when Hermes behavior can be constrained or adapted.

### RIP-5.2 — Per-employee isolation

Each employee receives isolated runtime identity, profile, data root, workspace, network, credentials, queues, memory, and audit scope. Cross-employee access requires an explicit collaboration or shared-resource contract.

### RIP-5.3 — Exact image pinning

The v0.2 Hermes baseline is `nousresearch/hermes-agent:v2026.7.1`. Release evidence MUST record the resolved immutable OCI digest. Floating tags such as `latest` cannot satisfy production acceptance.

### RIP-5.4 — Host authority

Manager MUST NOT hold the Docker socket. Host Provisioner is the sole Docker-host authority behind the signed host-private boundary.

### RIP-5.5 — Desired-state reconciliation

Provisioning, replacement, rotation, suspension, restoration, and teardown are desired-state reconciliation operations with durable steps, idempotency, bounded leases, health checks, compensation, and proof.

### RIP-5.6 — Recovery and drift

Profile checksum, runtime revision, connector binding, Caddy state, networks, credentials, and desired resources MUST be observable and repairable. A failed partial transition cannot be presented as healthy.

### RIP-5.7 — Model Gateway

Employee model access is assignment-scoped and commercially attributable. Cumulative budgets, shared rate authority, provider ambiguity, payer/beneficiary resolution, and accounting receipts are release boundaries rather than optional analytics.

---

## 6. Connector, capability, MCP, and interaction protocols

### CCIP-6.1 — Layered protocol model

AMTECH distinguishes:

1. **AMTECH labor protocol** — assignment, work object, authority, approval, effect, receipt, recovery, and commercial state.
2. **MCP core** — tools, resources, prompts, capability negotiation, and remote authorization metadata.
3. **MCP Apps** — negotiated interactive `ui://` resources associated with MCP tools and rendered by a compliant host.
4. **AG-UI** — optional agent↔user event, lifecycle, message, tool-call, and state snapshot/delta transport.
5. **AMTECH generated-view adapters** — typed `WorkResource`/`WorkAction` projections into native Web, SMS, signed Review, MCP Apps, AG-UI, or future clients.

MCP, MCP Apps, and AG-UI are transports/extensions. They do not create assignment authority or durable business state.

### CCIP-6.2 — Capability transport classes

A capability MAY be exposed through:

- `manager_mcp`: employee calls a Manager-owned governed tool;
- `direct_mcp`: direct server access allowed only for explicitly proven read-only, non-money, non-customer-facing capability;
- `runtime_native`: Hermes-native capability subject to exact runtime evidence and policy.

Unknown or consequential connectors default to Manager-mediated custody.

### CCIP-6.3 — Transport-neutral capability descriptor

Every discovered capability MUST preserve stable capability/server identity, transport, tool name, label, description, input/output contract, read/write behavior, risk, approval posture, connector binding, dependency/credential/network requirements, provenance, evidence freshness, and blockers.

Provider names and broad UI categories MUST NOT substitute for connector identity.

### CCIP-6.4 — Effective capability truth

A capability is effective only when advertisement, exact runtime report, dependency, credential, network route, assignment policy, entitlement, connector health, and recent live probe all pass. Missing, skipped, stale, or failed evidence fails closed.

### CCIP-6.5 — Native-level connector manifest

Every AMTECH-supported native connector MUST be described by a declarative setup manifest containing:

- canonical key, aliases, provider, category, and custody;
- actual authorization protocol and setup flow;
- Manager start tool and any descriptor-bound continuation;
- requested scopes or permissions;
- exact permitted authorization/onboarding hosts;
- redirect proof fields;
- credential storage, rotation, health, revocation, and evidence posture;
- owner-safe “can” and “cannot” language.

Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology. Unknown connectors remain discoverable but cannot infer a tool, scope, host, credential mode, or self-service setup.

### CCIP-6.6 — Managed authorization

AMTECH-managed authorization for native connectors MUST follow current OAuth security best practice and provider capabilities:

- exact registered redirect URIs and no open redirectors;
- state bound to provider, employee, assignment/work return path, and short expiry;
- PKCE for authorization-code flows where supported and required by profile;
- authorization-server and protected-resource metadata discovery for standards-compliant remote MCP/OAuth resources;
- resource/audience binding where supported;
- rich authorization details where permissions are transactional and supported;
- sender-constrained tokens where supported and operationally justified;
- least privilege, sealed Manager custody, rotation, revocation, health, and audit.

Providers using hosted onboarding, API keys, service accounts, or operator installation use the same manifest/custody model with their actual protocol stated honestly rather than mislabeled OAuth.

### CCIP-6.7 — MCP authorization

Remote protected MCP resources MUST use the current MCP authorization profile, OAuth 2.1 security posture, protected-resource metadata, authorization-server discovery, exact resource audience, and scope negotiation. Static bearer secrets and caller-selected authorization servers are not the default native integration model.

### CCIP-6.8 — MCP Apps host contract

MCP Apps support MUST be explicitly negotiated. A compliant host MUST:

- associate a tool with an approved `ui://` resource;
- fetch UI only through the negotiated resource contract;
- render in a sandboxed, opaque-origin iframe or equivalent isolation;
- enforce declared CSP and permissions;
- mediate JSON-RPC between UI and host;
- intersect UI-requested actions with current assignment-scoped `WorkAction` authority;
- prevent direct credential, database, MCP-server, or provider access from the UI;
- retain audit and proof for consequential host calls.

MCP Apps UI may explain or collect inputs. It cannot directly mutate AMTECH authority, approval, or effect records.

### CCIP-6.9 — AG-UI adapter contract

An AG-UI adapter MAY expose run lifecycle, text, activity, tool-call, and state snapshot/delta events. It MUST project only role-safe AMTECH state, preserve event IDs and replay order, and map client-side actions back into authorized AMTECH commands.

AG-UI shared state is a synchronized projection, not the source of durable authority.

### CCIP-6.10 — Generic owner connection surface

Owner setup UI is generated from the connector manifest. Browser code MUST NOT contain provider-specific scope, tool, or host selection logic. The browser may begin an approved setup and render status; Manager/provider custody performs authorization, token/onboarding handling, health, binding, revocation, and audit.

---

## 7. Human interface protocol

### HIP-7.1 — Human role

The human acts as employer, supervisor, decision-maker, exception handler, and authority source—not a prompt engineer or infrastructure operator.

### HIP-7.2 — Required functions

The interface MUST make current work, blocked work, needed information, approval decisions, connected capabilities, completed outcomes, proof, and recovery state understandable.

### HIP-7.3 — Honest state

Empty, loading, unauthorized, unavailable, degraded, ambiguous, failed, and completed are distinct. Infrastructure failure MUST NOT render as empty workforce or false success.

### HIP-7.4 — Generated UI

Generated UI uses bounded typed grammar and finite host intents. It is presentation, not authority. Model-authored executable browser code, raw HTML with ambient privilege, and hidden provider calls are prohibited.

### HIP-7.5 — Web

Web sessions are HttpOnly, assignment-authorized, authority-versioned, and role-safe. Browser-readable tokens and token-bearing SSE URLs are prohibited.

### HIP-7.6 — SMS and signed Review

SMS and Review resolve the same durable work and authority state as Web. Signed actions are exact-resource, exact-action, assignment, audience, expiry, and authority-version bound.

### HIP-7.7 — Recovery language

Owner surfaces state what failed, what did not happen, whether retry is safe, what AMTECH is doing, and whether human intervention is required. Internal secrets and misleading infrastructure jargon remain hidden.

---

## 8. Commercial and accounting protocol

### CBMP-8.1 — Entity separation

The system separately represents provider, platform, employer, operator, worker, customer, payer, beneficiary, and resource owner.

### CBMP-8.2 — Canonical offer

The canonical offer is Start Free, Managed AI Employee from $400/month, and Workforce at custom pricing. The public estimator is outdated and non-canonical.

### CBMP-8.3 — Billable work

Usage attribution binds employee, assignment, payer, beneficiary, price snapshot, provider usage/cost receipt, platform accounting receipt, and invoice/entitlement outcome.

### CBMP-8.4 — Claims

Revenue, savings, replacement, autonomy, reliability, and capacity claims require measured codebase/product evidence and stated population, period, baseline, uncertainty, and exclusions.

### CBMP-8.5 — Shared limits

Budget and rate authority MUST be atomic and shared across replicas. Process-local counters cannot be the production commercial boundary.

---

## 9. Research, evaluation, and standard vector

### REVP-9.1 — Atomic claims

Each research or product claim declares metric, unit, population, baseline, test, pass/fail threshold, confidence/uncertainty, evidence location, and release relevance.

### REVP-9.2 — Validation vectors

Evaluation separates authority, safety, privacy, correctness, recovery, usability, cost, latency, and capacity. A weighted score cannot override a failed hard gate.

### REVP-9.3 — Codebase measurement

Model or agent performance is measured on AMTECH tasks, failures, fixtures, live proofs, and operating traces. Public coding benchmarks are contextual research, not product acceptance.

### REVP-9.4 — Baselines

Compare against current human workflow, deterministic automation, smaller/cheaper model, no-agent baseline, and prior deployed AMTECH version where applicable.

### REVP-9.5 — Negative evidence

Failures, skips, blocked environment, non-reproduction, and unknown states are retained. They cannot be converted to pass through omission.

### REVP-9.6 — AI risk lifecycle

AMTECH uses NIST AI RMF `Govern`, `Map`, `Measure`, and `Manage` as a risk-organization crosswalk, not certification. Agentic threat testing and release evidence cover intended use, foreseeable misuse, affected parties, measurement validity, monitoring, and incident response.

### REVP-9.7 — Evolution vector

The machine-readable vector maps original Standard clauses to ratified clauses, implementation/supersession references, motion direction, and velocity. Direction basis is:

```text
[expansion, satisfaction, narrowing, destructive_modification, appendix, reorientation]
```

Velocity is normalized `[0,1]` implementation motion since the original baseline. It is not a quality score or production-readiness score.

---

## 10. Database and test-driven evidence protocol

### DTEP-10.1 — Development proof

Database development uses production-shaped local/CI PostgreSQL as the normal inner loop, including full migration-from-blank, constraints, RLS/grants, security-definer behavior, concurrency/race tests, rollback transactions, seed/backfill compatibility, and negative isolation matrices.

A live Supabase project is not required for every schema or query edit. Repeated manual live testing is not a substitute for reproducible tests.

### DTEP-10.2 — Provider-specific database proof

A real disposable Supabase/staging project is REQUIRED:

- before the first release using a new migration class or Data API surface;
- when Supabase-specific Auth, Realtime, Storage, Edge, advisor, or platform behavior is material;
- after security-sensitive RLS/grant/function changes;
- for the final release candidate before deployment;
- when local PostgreSQL cannot reproduce a suspected platform defect.

The proof is a release/staging gate, not the inner development loop.

### DTEP-10.3 — Migration discipline

Applied migrations are immutable and ordered. Corrections use forward migrations. CI applies the full ledger from blank and tests existing-row compatibility. Release proof records migration IDs, file hashes, database target, exact SHA, timestamps, and mutation scope.

### DTEP-10.4 — Test integrity

Tests encode product contracts, not implementation accidents. A failing test may be corrected only when evidence shows the expectation is stale or wrong; the correction MUST strengthen or preserve the intended invariant. Changing an expectation merely to obtain green is prohibited.

### DTEP-10.5 — Test pyramid for boundaries

Use:

1. pure contract/unit tests for schemas, policy, hashing, state transitions, and adapters;
2. PostgreSQL integration tests for migrations, concurrency, RLS, and durable claims;
3. compiled application/browser tests for role-safe surfaces;
4. disposable target-host/provider/database acceptance for release boundaries;
5. production monitoring and reconciliation for live operation.

---

## 11. Deployment, supply chain, and observability

### DIP-11.1 — Exact release

Reports include branch, SHA, environment, commands/workflows, migrations, image digests, test counts, proof IDs, failures, skips, missing environment, and timestamp.

### DIP-11.2 — Canonical topology

Production uses the canonical five-service topology and one source of Compose selection. Manager has no Docker socket; Host Provisioner owns Docker authority; Caddy, Web, Manager, Model Gateway, and Host Provisioner pass health; employee networks remain isolated.

### DIP-11.3 — Supply-chain evidence

Release artifacts SHOULD achieve at least SLSA Build L2-equivalent signed hosted provenance, with a documented path toward hardened L3 controls. SBOM, provenance, image digests, source SHA, builder identity, migration hashes, and deployment manifest MUST remain bound.

Use standard in-toto/SLSA predicates and verification tooling where possible rather than inventing incompatible attestation formats.

### DIP-11.4 — Observability

Production boundaries answer what work was attempted, by which principal/assignment, under which release/policy, with what capability/provider, authority/approval, change/receipt, retry/repair state, payer, and beneficiary.

AMTECH SHOULD map stable telemetry to current OpenTelemetry conventions. Experimental GenAI conventions are version-pinned adapters, not durable database schema.

### DIP-11.5 — Live gates

Production-ready requires, on one exact deployed release:

- complete CI and build evidence;
- database and migration acceptance;
- target-host runtime/network acceptance;
- identity and relationship isolation;
- connector authorization, health, revocation, ingress, and reconciliation;
- provider-backed work object through approval/effect/receipt/proof;
- commercial reconciliation;
- crash recovery and rollback;
- accessibility and supported-browser acceptance;
- capacity/fairness at the declared operating envelope;
- signed release/deployment evidence.

Fixtures, dev login, manually injected outcomes, historical proof, and the public estimator cannot satisfy these gates.

---

## 12. Engineering execution and document control

### ENG-12.1 — Task contract

Every engineering task MUST declare task ID, branch/repository, concise objective, verifiable success criteria, allowed/forbidden files, required tests, known blockers, and maximum commits when assigned.

### ENG-12.2 — Branch safety

Agents MUST NOT edit `main`. Work stays on the specified branch and integrates through the approved PR/base path.

### ENG-12.3 — Execution loop

```text
Explore → Act with the smallest coherent change → Test → Commit → Verify exact head
```

No feature expansion occurs while a prerequisite P0 blocker is unresolved.

### ENG-12.4 — Self-verification

Tests and required CI must pass before completion is reported. Untested code is unfinished. If CI becomes red after a change, stop downstream work and fix or escalate.

### ENG-12.5 — Three-attempt rule

After three failed attempts on the same concrete step, stop, preserve diagnostics, state assumptions, and escalate the blocker. Silent workarounds are prohibited.

### ENG-12.6 — Commit and rationale

Every commit references its task ID. Every non-obvious code change includes a concise `why` comment at the invariant or boundary it protects; comments must not narrate obvious syntax.

### ENG-12.7 — Scaffolding

Schemas, fixtures, migrations, typed contracts, harnesses, diagnostics, proof capture, and operator runbooks are first-class implementation. A model cannot compensate for missing scaffolding.

### ENG-12.8 — Document families

- `STANDARD.md` — ratified non-waivable product and engineering requirements;
- `CODEGRAPH.md` — current topology, source hubs, migration head, and evidence boundary;
- `second-half-plan/` — one active production program plus explicitly historical predecessors;
- `docs/architecture/` — explanatory structure and research disposition;
- `memory/` — dated narrative handoffs, indexed only by `memory/MEMORY.md`;
- `wiki/MVP/implementation-records/` — historical factual ledger;
- source, migrations, tests, workflows, and proof — implementation and acceptance authority.

A new active plan MUST supersede or absorb the previous active plan in the same transaction. Scattering “current” status among unindexed files is prohibited.

### ENG-12.9 — Historical integrity

Historical records remain point-in-time evidence and receive a supersession banner or index routing when misleading. They are not silently rewritten to appear current.

---

## 13. Approval and exception record

### STD-13.1 — Ratification

The AMTECH human operator directed finalization and production implementation of `AMTECH-P0-GOV-001` and `AMTECH-P0-DOC-002` on 2026-07-19. This constitutes approval of v0.2 subject to exact-head tests and CI.

The ratification commit, final workflow matrix, vector hash, and active plan coordinates are recorded in draft PR #23 and the newest indexed memory handoff.

### STD-13.2 — Exceptions

An exception to a MUST records clause, scope, reason, threat/failure analysis, compensating control, owner, expiration, evidence, and human approval. An undocumented deviation is a gap.

### STD-13.3 — Current release status

Ratification makes this Standard effective. It does **not** make the product production-ready.

Current implementation remains source-wired and exact-head CI-accepted through migration `0072`; database/provider/runtime/browser/commercial/recovery/rollback/deployment gates remain governed by the active production program and exact evidence.

---

## Appendix A — Status vocabulary

| State | Meaning |
|---|---|
| `planned` | Designed, not implemented. |
| `research-specified` | Research and validation design exist. |
| `source-wired` | Source/schema/config and executable seams exist. |
| `locally-proven` | Passed local deterministic or fixture proof. |
| `ci-accepted` | Exact SHA passed a named reproducible CI gate. |
| `database-accepted` | Approved disposable/staging database passed release-bound behavior proof. |
| `runtime-accepted` | Exact target host/runtime/network proof exists. |
| `provider-accepted` | Real provider IDs and receipts exist. |
| `browser/channel-accepted` | Fixture-free supported-channel proof exists. |
| `commercial-accepted` | Cost, payer/beneficiary, usage, and invoice reconciliation passed. |
| `live-accepted` | Canonical end-to-end deployed behavior passed with retained proof. |
| `production-ready` | Every non-waivable release gate passes on the exact deployed SHA. |
| `blocked` | A prerequisite is absent and the boundary fails closed. |
| `failed` | An attempted gate failed. |

## Appendix B — Current normative source map

Primary implementation evidence includes:

- `packages/shared/src/relationship-contract.ts`
- `packages/shared/src/assignment-resolver.ts`
- `packages/shared/src/command-effect.ts`
- `packages/shared/src/connector-registry.ts`
- `packages/shared/src/connector-setup.ts`
- `packages/shared/src/task-capabilities.ts`
- `packages/shared/src/materialization.ts`
- `packages/shared/src/tool-contracts.ts`
- `packages/shared/src/tool-schemas.ts`
- `packages/shared/src/release-evidence.ts`
- `apps/manager/src/lib/owner-assignment-authority.ts`
- `apps/manager/src/lib/durable-command-runtime.ts`
- `apps/manager/src/lib/approval-authority.ts`
- `apps/manager/src/lib/connector-custody.ts`
- `apps/manager/src/lib/tool-capability-catalog.ts`
- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/provisioning-reconciler.ts`
- `apps/manager/src/provisioner-host.ts`
- `apps/manager/src/lib/employee-stream-strict.ts`
- `apps/manager/src/lib/operating-surface.ts`
- `apps/web/app/agent/[employeeId]/`
- `packages/db/migrations/0032*` through `packages/db/migrations/0072*`
- `infra/deploy/docker-compose.production.yml`
- `infra/scripts/production-topology.mjs`
- `infra/scripts/acceptance/`
- `.github/workflows/`
- current tests and release proof.

The source map is navigational. Current source and proof decide conformance.
