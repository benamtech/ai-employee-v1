# Dependency-Ordered Production Roadmap

Status: **active execution order; post-merge roadmap**  
Repository baseline: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`  
Cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`  
Scope: all credible P0/P1/P2 production and controlled-pilot gaps under Standard v0.2

This file remains the sole canonical execution roadmap inside the active production program. It expands the previous coarse P0/P1 sequence rather than creating a competing plan. Detailed issue scores live in [`08-production-issue-vector.json`](08-production-issue-vector.json), workstream contracts in [`09-workstream-execution-map.md`](09-workstream-execution-map.md), and test authority in [`10-test-suite-disposition.md`](10-test-suite-disposition.md).

## Planning model

The issue graph is reduced into nine dependency-ordered workstreams. Severity is not averaged: one failed non-waivable gate blocks downstream acceptance. Each phase has a primary operating role, but every implementation pass must re-evaluate architecture, security, tests, product behavior, UX, commercial controls, operations, and release evidence.

```text
1.1 repository/test truth
  → 1.2 connector and protocol authority
  → 1.3 database authority
  → 1.4 target-host/runtime custody
  → 1.5 fixture-free owner/channels
  → 1.6 golden governed work
  ↘ 1.7 commercial/rate/ambiguity controls (starts after 1.3; gates final 1.5/1.6 acceptance)
  → 1.8 crash/rollback/signed release
  → 1.9 human-surface/capacity/pilot preparation
  → Phase 2 frozen release candidate
  → Phase 3 controlled pilot
  → Phase 4 measured expansion
```

No phase inherits proof from another SHA. Downstream implementation may be prepared in parallel only where it cannot bypass a red prerequisite and cannot be claimed accepted before dependencies close.

## Phase 1 — Dependency-critical production closure

### Phase 1.1 — Repository authority and test-contract truth

**Primary role:** release owner and test engineer.  
**Workstream:** WS-01.  
**Issues:** P0 `ISS-001`–`ISS-004`; P1 `ISS-005`–`ISS-006`; no independent P2 issue is allowed to remain hidden in this workstream.

Deliverables:

- reconcile every current authority document to the fact that PR `#23` is merged and new work begins from reviewed branches based on current `main`;
- bind Gate 0 claims to final cutover head `d131dd09` and distinguish it from merge coordinate `5e5b8d7`;
- classify every suite/harness using `10-test-suite-disposition.md`;
- normalize pre-ratification assignment, principal, fake-RPC, and environment fixtures;
- fix any real source defect exposed by the broad aggregate;
- make `npm run test:unit` trustworthy and green without weakening current invariants;
- keep curated green suites, broad aggregate, fixture browser, database, provider, and live evidence explicitly separate;
- update governance checks so stale post-merge metadata cannot recur.

Exit predicate:

```text
one active roadmap
AND all current routing is post-merge current
AND broad unit aggregate is green or has an explicit human-approved non-overlapping exception
AND current curated suites remain green
AND repository governance/type/lint/build/archaeology/browser gates pass on the final candidate
AND exact workflow evidence is recorded without inheriting ancestor proof
```

Stop immediately when a supposedly stale test exposes a current authority, safety, data, or runtime defect. That defect becomes Phase 1.1 work; the expectation is not weakened.

### Phase 1.2 — Connector, remote MCP, MCP Apps, AG-UI, and effective capability truth

**Primary role:** security architect and protocol implementation engineer.  
**Workstream:** WS-02.  
**Issues:** P0 `ISS-007`, `ISS-008`, `ISS-010`, `ISS-011`; P1 `ISS-009`.

Deliverables:

- protected-resource metadata and authorization-server discovery with trusted issuer, exact resource audience, PKCE, state, redirect, scope, expiry, and revocation enforcement;
- Manager custody for consequential connector tokens and explicit default-deny direct MCP;
- official MCP Apps negotiation, `ui://` retrieval, opaque-origin sandbox, declared CSP/permissions, bounded JSON-RPC, and assignment-scoped `WorkAction` intersection;
- one persisted timestamped/hash-bound effective-capability graph intersecting advertisement, runtime report, dependencies, credentials, network, assignment policy, entitlement, connector health, evidence freshness, and live probe;
- live connector authorization, health, revocation, stale/scope-change, outage, repair, and deletion evidence;
- versioned role-safe AG-UI lifecycle/message/tool/state adapter only after durable capability/work state is stable.

Exit predicate:

```text
unknown/stale/underspecified capability fails closed
AND browser/model cannot select provider authority, tools, scopes, hosts, issuers, audiences, credentials, or continuations
AND MCP Apps/AG-UI remain projections
AND connector custody/revocation and effective-capability evidence pass deterministic, browser, and disposable-provider tests
```

### Phase 1.3 — Database authority, migration, RLS, concurrency, and platform closure

**Primary role:** database and authorization engineer.  
**Workstream:** WS-03.  
**Issues:** P0 `ISS-012`–`ISS-014`.

Deliverables:

- full blank migration ledger through `0072` and every new forward migration introduced by later workstreams;
- existing-row/backfill compatibility, deterministic schema and migration hashes;
- complete RLS, grants, security-definer, relationship, assignment, artifact, approval, capability, receipt, and commercial negative-isolation matrices;
- concurrent claim/lease, compare-and-swap, duplicate/replay, authority-version, reservation, ambiguity, and rollback tests;
- risk-triggered disposable managed Supabase proof for security-sensitive platform behavior and the final release candidate;
- approved staging backup, migration ledger, advisor output, and rollback evidence without routine production testing.

Exit predicate:

```text
all durable invariants pass reproducible PostgreSQL matrices
AND all applicable managed-platform triggers pass
AND no applied migration was modified
AND downstream runtime/commercial code has a release-accepted schema boundary
```

### Phase 1.4 — Secret custody, target-host topology, runtime isolation, and lifecycle

**Primary role:** infrastructure security and SRE.  
**Workstream:** WS-04.  
**Issues:** P0 `ISS-015`–`ISS-017`; P1 `ISS-018`.

Deliverables:

- managed secret inventory, access policy, audience, rotation, revocation, audit, and rollback;
- proof that provider/platform master secrets never enter images, employee profiles/runtimes, browser state, artifacts, or logs;
- canonical Caddy, Web, Manager, Model Gateway, and Host Provisioner health on the target host;
- Manager without Docker socket and signed Unix-socket Host Provisioner as sole host authority;
- two-employee network, data, workspace, memory, queue, credential, and action isolation;
- employee-to-employee and arbitrary-egress denial with scoped Manager/Model Gateway reachability;
- replacement, suspension, restoration, credential/profile rotation, restart, and teardown without neighbor disruption;
- resolved immutable Hermes OCI digest bound to candidate evidence.

Exit predicate:

```text
five services healthy
AND two employees isolated
AND host/secret authority is least-privileged and rotation-proven
AND every partial lifecycle transition is observable and repairable
AND exact image digest and filesystem persistence are retained
```

### Phase 1.5 — Fixture-free identity, owner, connector, and channel journey

**Primary role:** product engineer, identity/security reviewer, and UX specialist.  
**Workstream:** WS-05.  
**Issues:** P0 `ISS-019`, `ISS-020`; P1 `ISS-021`.

Deliverables:

- real owner verification, canonical activation, explicit assignment selection, runtime readiness, HttpOnly session, strict snapshot, and first owner turn;
- assignment/role/authority-version denial and revocation behavior;
- honest 200/401/403/409/410/429/500/503 state matrix;
- SSE reconnect, session rotation, snapshot recovery, degraded/ambiguous/failure language;
- live generic connector setup, health, revocation, repair, and effective-capability projection;
- Web, SMS, and signed Review parity for the same durable work, approval, and proof state;
- one finite lifecycle grammar for connection, consent, ready, degraded, stale, revoked, scope-changed, repair, and deletion.

Exit predicate:

```text
one real owner activates and supervises one assigned employee on the exact candidate
AND no fixture/manual outcome is used
AND infrastructure failures never render as empty or successful
AND all supported channels resolve identical durable authority/work state
```

### Phase 1.6 — Golden work-object, output parity, and proof-refinding closure

**Primary role:** applied AI/product engineer and test lead.  
**Workstream:** WS-06.  
**Issues:** P0 `ISS-022`; P1 `ISS-023`, `ISS-024`.

Order:

1. Website Employee A manual journey;
2. Website Employee A automated journey and replay;
3. Contractor Office Employee B;
4. Bookkeeping Employee C.

Every journey requires:

```text
real trigger and assignment
→ Hermes reasoning or deterministic work
→ typed artifact/work resource
→ immutable revision and validation
→ exact approval snapshot
→ durable command/effect reservation
→ one provider/publication effect
→ accepted | failed | ambiguous receipt
→ post-effect verification
→ owner-refindable proof
→ idempotent replay and recovery
```

Deliverables additionally include canonical render/content hashes proving approved preview parity across HTML, PDF, email, signed link, and customer-facing output, plus strict proof queries by assignment, job/customer, action, provider, time, state, and failure class.

Exit predicate:

```text
all three employee roles complete real bounded work
AND preview/delivery parity holds
AND stale approval and duplicate effect tests fail closed
AND every success has matching effect/provider/accounting evidence
AND proof is refindable and tenant-isolated
```

### Phase 1.7 — Commercial controls, shared rate authority, and provider ambiguity

**Primary role:** distributed-systems and commercial-accounting engineer.  
**Workstream:** WS-07.  
**Issues:** P0 `ISS-025`–`ISS-028`.

This phase may begin after Phase 1.3 schemas are stable, but Phase 1.5 and Phase 1.6 cannot receive final provider/commercial acceptance until 1.7 closes.

Deliverables:

- atomic worst-case budget reservation before model/provider dispatch;
- actual-cost settlement from durable provider receipt and release of unused reservation;
- shared per-credential/provider/account rate authority across replicas and restarts;
- bounded outage behavior rather than silent unlimited or permanently denied operation;
- one logical request reservation and provider idempotency key where supported;
- timeout/accepted-response-loss recorded durable `ambiguous`, reconciled before retry;
- exactly one provider and accounting settlement;
- payer, beneficiary, assignment, price snapshot, entitlement, usage, cost, invoice, credit/refund, suspension, and reactivation reconciliation;
- explicit Start Free and Managed from $400 controls; public estimator remains non-canonical.

Exit predicate:

```text
concurrent replicas cannot overspend or multiply rate authority
AND provider uncertainty cannot trigger blind replay
AND usage/cost/payer/beneficiary/invoice state reconciles exactly once
AND commercial state is not caller/browser selectable
```

### Phase 1.8 — Crash repair, rollback, observability, and signed release evidence

**Primary role:** SRE, security/release engineer, and incident owner.  
**Workstream:** WS-08.  
**Issues:** P0 `ISS-029`–`ISS-031`; P1 `ISS-032`.

Deliverables:

- fault injection at every durable claim, external dispatch, receipt, publication, provisioning, rotation, migration, and deployment boundary;
- deterministic forward repair or explicit manual-repair terminal state;
- database, runtime, profile, Caddy, config, image, and application rollback compatibility;
- backup/restore integrity and recovery-time evidence;
- SBOM and standard in-toto/SLSA provenance with builder identity;
- signed deployment manifest binding source SHA, image digests, migration hashes, environment/config hashes, resolved Hermes digest, proof IDs, failures/skips, and rollback result;
- independently executable manifest verifier;
- telemetry and incident runbooks covering principal, assignment, release/policy, capability/provider, authority/approval, effect/receipt, retry/repair, payer/beneficiary, and terminal state.

Exit predicate:

```text
fault matrix cannot create false success or duplicate effect
AND rollback/restore preserves accepted durable work
AND signed release/deployment evidence verifies independently
AND alerts and runbooks distinguish blocked, failed, ambiguous, repaired, and recovered
```

### Phase 1.9 — Human-surface acceptance, capacity, and pilot preparation

**Primary role:** UI/UX and accessibility lead, performance engineer, product lead, and release owner.  
**Workstream:** WS-09.  
**Issues:** P1 `ISS-033`–`ISS-035`, `ISS-037`; P2 `ISS-036`, `ISS-038`.

Deliverables:

- coherent interaction grammar across owner, public/create/claim/login, account, billing, admin, artifact, connector, approval, proof, and recovery surfaces;
- Chromium, Firefox, WebKit/mobile-Safari representative execution;
- automated axe and keyboard/focus/zoom/reflow/reduced-motion/contrast/error-announcement tests;
- manual NVDA and VoiceOver critical-journey evidence;
- durable progress, exact-run interruption, reconnect, restart, ambiguity, and recovery UX;
- capacity/admission/fairness sequence with declared envelopes: 1 → 10 → 100 → 250 → 500 → 700;
- measured queue latency, DB pools, SSE fan-out, provider concurrency, Model Gateway fairness, worker leases, reconciler convergence, recovery time, cost, and noisy-neighbor behavior;
- controlled-pilot packet: eligibility, entitlements, known limits, data handling, support/incident ownership, rollback, customer exit, success/failure thresholds, and stop authority;
- defer shared/fractional employee, governed generic egress, and richer operator adapter unless the initial pilot boundary requires them.

Exit predicate:

```text
critical journeys satisfy supported-browser and WCAG 2.2 AA acceptance
AND declared capacity envelope passes without unfairness or unsafe degradation
AND pilot operators can observe, stop, repair, roll back, and exit customers safely
AND no claim exceeds measured evidence
```

## Phase 2 — Frozen exact release candidate

**Primary role:** release owner.

Freeze one candidate SHA and immutable image set after Phase 1.1–1.9 implementation gates close. No metadata-only commit inherits earlier evidence. On the frozen candidate execute:

- full repository and broad regression suite;
- migration and managed-platform acceptance;
- target-host five-service/two-employee acceptance;
- connector authorization/health/revocation/failure matrices;
- fixture-free owner/channel and all golden employee journeys;
- commercial reservation/rate/ambiguity/invoice reconciliation;
- crash/repair/backup/restore/rollback matrix;
- supported-browser/accessibility/visual acceptance;
- declared canary capacity envelope;
- signed SBOM/provenance/deployment manifest and verifier.

Phase 2 completes only when every non-waivable Standard gate is accepted on the same deployed candidate. Any source/config/migration/image change creates a new candidate and reruns affected gates.

## Phase 3 — Controlled pilot readiness and execution

**Primary role:** product lead, customer operator, support/incident owner, and release owner.

Entry requires Phase 2 acceptance. Begin with one bounded canary business and one useful employee under explicit Start Free or Managed from $400 entitlements. Then advance to a ten-employee operating pod only when:

- customer duty, retained human authority, permitted effects, limits, data handling, and exit path are explicit;
- onboarding, daily operation, approval, proof, degraded mode, repair, billing, support, and offboarding runbooks are exercised;
- live monitoring and reconciliation remain healthy for the declared observation period;
- no unresolved P0/P1 exists;
- incident stop authority and rollback can be exercised immediately;
- measured value/reliability/cost claims include population, baseline, period, uncertainty, and exclusions.

Pilot failure is retained as negative evidence and routes to the responsible Phase 1 workstream. It is not hidden by narrowing the report population.

## Phase 4 — Measured fleet expansion

**Primary role:** platform architect, capacity engineer, finance/product lead, and release owner.

Advance only through explicit gates:

```text
10 employee operating pod
→ 100
→ 250
→ 500
→ 700
```

At every step revalidate admission, queue fairness, database saturation, SSE fan-out, provider quotas, shared commercial controls, runtime isolation, recovery time, support load, unit economics, and noisy-neighbor containment. A failed envelope stops expansion and preserves the last accepted operating limit.

Shared/fractional employees, generic governed egress, richer operator adapters, new channels, and additional vertical roles are separate scoped programs after the base governed-labor protocol is production- and pilot-accepted. They cannot be used to evade closure of the initial boundary.

## Global stop and completion rules

- Work occurs on reviewed branches from current `main`; `main` changes only through approved merge.
- No feature expansion ahead of an unresolved prerequisite P0.
- Every task has a validated contract, six-point rubric, success criteria, maximum commits, and task-ID commits.
- Tests are contracts and are not weakened for green.
- Three failed attempts on one concrete step preserve diagnostics and escalate.
- Fixtures, local PostgreSQL, old hosts, manually injected outcomes, ancestor SHAs, and the public estimator cannot satisfy live acceptance.
- Unknown/stale capability evidence fails closed.
- Browser, MCP Apps, AG-UI, SMS, and Review remain projections rather than authority.
- Ambiguous consequential provider outcomes reconcile before retry.
- Production-ready means every non-waivable Standard gate passes on one exact signed deployed release.
