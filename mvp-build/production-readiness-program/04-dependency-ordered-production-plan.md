# Dependency-Ordered Production Roadmap

Status: **active execution order**  
Exact candidate and migration status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision protocol: [`../decision/README.md`](../decision/README.md)

This is the sole active roadmap. Issue state lives in `08-production-issue-vector.json` and `13-resolution-ledger.json`; workstream exits live in `09-workstream-execution-map.md`; test/evidence authority lives in `10-test-suite-disposition.md` and `07-verification-and-handoff-matrix.md`.

## Workstream decision rule

```text
authority/evidence/Unknown extraction
→ independent candidate batches
→ invariant/prerequisite filter
→ simple evidence-and-invariants baseline
→ candidate and software topology when useful
→ equal-feasibility controls
→ search and weight sensitivity
→ implementation compression
→ complete behavioral proof plan
→ implementation and exact verification
```

A workstream map is not a candidate population. A score is not a patch list. Candidate-edge touch is not software completion. Without implementation-level ablation, mathematics remains descriptive or selection-influencing.

## Dependency spine

```text
WS-01 repository/test/document truth
→ WS-02 connector and protocol authority
→ WS-03 database authority
→ WS-04 target-host/runtime custody
→ WS-05 fixture-free owner/channels
→ WS-06 golden governed work
↘ WS-07 commercial/rate/provider ambiguity
→ WS-08 crash/rollback/observability/signed release
→ WS-09 human surface/capacity/pilot
→ frozen release candidate
→ controlled pilot
→ measured expansion
```

No workstream inherits evidence from another SHA. Downstream preparation is allowed only when it cannot bypass a red prerequisite and is not claimed accepted early.

## WS-01 — Repository, test, and document truth

Deliver:

- one repository contract, one product contract, short compatibility routers;
- one exact-status owner: `mvp-build/CODEGRAPH.md`;
- one Standard family, one decision protocol, one active program, one memory index;
- structural governance based on schemas, references, authority, evidence class, and reproducibility rather than pinned prose or counts;
- exact-head broad gates without weakened assertions.

Exit: active authority is unambiguous, stale entrypoints are historical routers, trace semantics are valid, and exact-head governance/broad checks pass.

## WS-02 — Connector and protocol authority

Deliver:

- Manager-owned issuer/resource/scope/redirect/PKCE/state/token custody;
- default-deny consequential MCP execution;
- content-bound MCP Apps and bounded host actions;
- effective capability as the intersection of advertisement, runtime, dependencies, credentials, network, assignment, entitlement, health, freshness, and live probe;
- role-safe AG-UI after durable truth exists;
- live connector setup, scope change, revocation, outage, repair, and deletion.

Exit: unknown or stale capability fails closed; browser/model cannot select provider authority; required live protocol lifecycle passes.

## WS-03 — Database authority

Deliver:

- blank forward migration ledger through the source head;
- deterministic hashes and existing-row/backfill compatibility;
- RLS, grants, security-definer, and negative-isolation matrices;
- claim/lease/CAS/replay/authority/reservation/ambiguity concurrency proof;
- applicable disposable managed-platform and rollback evidence.

Exit: local/CI PostgreSQL and required managed-platform gates pass; applied migrations remain immutable.

## WS-04 — Secret custody and target-host runtime

Deliver:

- secret inventory, audience, access, rotation, revocation, audit, rollback;
- no master credential in employee runtime, profile, browser, artifact, image, or logs;
- healthy ingress/Web/Manager/Gateway/Provisioner topology;
- Host Provisioner as sole Docker authority;
- two-employee network/data/workspace/memory/queue/credential/action isolation;
- lifecycle and exact Hermes image evidence.

Exit: least privilege, isolation, lifecycle repair, and exact-image target-host proof pass.

## WS-05 — Fixture-free owner and channels

Deliver:

- real owner verification, activation, assignment, runtime readiness, secure session, strict snapshot, and first turn;
- assignment/role/authority denial and revocation;
- reconnect, session rotation, and snapshot recovery;
- live connector lifecycle;
- Web/SMS/signed-Review convergence over one durable work/approval/proof state.

Exit: one real owner supervises one assigned employee with no fixture/manual outcome and failures never render as success.

## WS-06 — Golden governed work

```text
real trigger and assignment
→ Hermes or deterministic work
→ immutable typed revision
→ validation and exact approval
→ durable command/effect
→ one external effect
→ accepted | failed | ambiguous receipt
→ effect-bound accounting when applicable
→ post-effect verification
→ repairable owner proof
→ replay-safe recovery and restart refinding
```

Roles: Website, Contractor Office, and Bookkeeping employees.

Exit: all three complete real bounded work; stale approval and duplicate effect fail closed; every success has matching tenant-isolated refindable proof.

## WS-07 — Commercial and provider ambiguity

Deliver:

- atomic worst-case reservation before dispatch;
- shared PostgreSQL rate authority;
- one durable request/effect/provider identity;
- accepted, failed, denied, refunded, and ambiguous state;
- effect-bound accounting, immutable adjustments, and conservation;
- original-effect reconciliation before retry;
- payer, beneficiary, price, entitlement, usage, cost, invoice, refund, suspension, and reactivation reconciliation.

Exit: replicas cannot overspend or multiply rate authority; uncertainty cannot trigger blind replay; commercial state settles exactly once and is never caller-selectable.

## WS-08 — Repair, rollback, observability, release

Deliver:

- fault injection at claims, dispatch, receipts, publication, provisioning, rotation, migration, and deployment;
- convergent repair or explicit manual terminal states;
- database/runtime/profile/ingress/config/image/application rollback compatibility;
- backup/restore and recovery-time evidence;
- telemetry and incident runbooks;
- SBOM, provenance, signed deployment manifest, and independent verifier;
- typed Manager server composition replacing generated string mutation.

Exit: faults cannot create false success or duplicate effects; rollback preserves accepted work; signed evidence verifies independently.

## WS-09 — Human surface, capacity, and pilot

Deliver:

- coherent owner/public/account/billing/admin/artifact/connector/approval/proof/recovery grammar;
- representative Chromium, Firefox, WebKit, and mobile-Safari execution;
- automated and manual accessibility acceptance;
- interruption, reconnect, ambiguity, and recovery UX;
- measured capacity/fairness progression;
- pilot eligibility, limits, data handling, incident ownership, rollback, exit thresholds, and stop authority.

Exit: supported-browser/WCAG acceptance, declared safe capacity, and complete controlled-pilot packet.

## Frozen candidate rule

Freeze only after every non-waivable gate passes on one exact candidate with migration hashes, image digests, database/provider/target-host/browser/channel/commercial/recovery evidence, and signed release metadata. Pilot is a measured production stage, never a substitute for prerequisites.
