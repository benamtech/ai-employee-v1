# Dependency-Ordered Production Roadmap

Status: **active execution order**  
Updated: 2026-07-23  
Exact structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision router: [`../decision/active.json`](../decision/active.json)  
Decision protocol: [`../decision/README.md`](../decision/README.md)  
Representation/proof contract: [`../decision/representation-contract.md`](../decision/representation-contract.md)

This is the sole active roadmap. Issue state lives in `08-production-issue-vector.json` and `13-resolution-ledger.json`; workstream exits live in `09-workstream-execution-map.md`; test/evidence authority lives in `10-test-suite-disposition.md` and `07-verification-and-handoff-matrix.md`.

## Current checkpoint

The cumulative source candidate has implemented and historically verified the locally/CI-provable portions of WS-01 through WS-09, including migrations through `0082`, typed Manager authority, connector and commercial substrate, release-image and recovery machinery, the production owner projection, UI presentation adapters, folder-first UI variants, and a first-class machine-native representation/proof contract.

The repository is currently at an **integration checkpoint**, not an external-acceptance checkpoint:

```text
verify cumulative PR #40 head
→ merge PR #40 into PR #35 branch
→ verify cumulative PR #35 head
→ merge PR #35 into PR #34 branch
→ verify cumulative PR #34 head
→ present PR #34 as the single integration into main
→ create a new branch and begin fresh Trace013 planning
```

The lower historical PR #35 coordinate is red while the cumulative PR #40 coordinate is green. Therefore the stack is integrated top-down. No ancestor result certifies a merge commit, and the known-red lower coordinate is not merged independently before the cumulative repair.

## Workstream decision rule

```text
authority and evidence extraction
→ machine-native representation extraction
→ Observed / Inferred / Hypothesis / Unknown / NotApplicable
→ independent candidate batches
→ invariant/prerequisite filter
→ simple evidence-and-invariants baseline
→ candidate and software topology when useful
→ formal/model certificate when useful
→ equal-feasibility controls
→ search and weight sensitivity
→ implementation compression
→ proof plan by declared proof class
→ implementation and exact verification
→ current-document and memory reconciliation
```

A workstream map is not a candidate population. A score is not a patch list. Candidate-edge touch is not software completion. Hypergraph eigenvectors, spectral measures, theorem provers, solvers, and model checkers may provide decisive formal proof for their declared model property. Dependency feasibility remains a hard constraint unless the certificate proves it. P2 representation fidelity is required before a P1 result satisfies the associated software gate, and causal or production claims require their own proof/evidence class.

No new planning transaction is open. Trace012 is the latest completed trace; Trace013 is reserved for a fresh post-merge branch.

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

Delivered in the cumulative source candidate:

- one repository contract, one product contract, short compatibility routers;
- one exact-status owner: `mvp-build/CODEGRAPH.md`;
- machine routers at `authority-map.json` and `decision/active.json`;
- one Standard family, one decision protocol, one machine-native representation contract, one active program, one memory index;
- structural governance based on schemas, references, authority, evidence class, proof class, and reproducibility;
- exact-head broad gates without weakened assertions;
- historical and completed traces separated from the next planning transaction.

Current exit condition: the cumulative merge stack reaches one exact green PR targeting `main`, with active documents and handoff agreeing.

## WS-02 — Connector and protocol authority

Source candidate includes:

- Manager-owned issuer/resource/scope/redirect/PKCE/state/token custody;
- default-deny consequential MCP execution;
- content-bound MCP Apps and bounded host actions;
- effective capability as the intersection of advertisement, runtime, dependencies, credentials, network, assignment, entitlement, health, freshness, and live probe;
- provider-neutral discovery, lifecycle receipts, guided setup, revoke, and reconnect normalization;
- role-safe AG-UI after durable truth exists.

Still required: live connector authorization, scope change, credential refresh/expiry, revocation, outage, repair, deletion, remote MCP/OAuth conformance, and provider-side denial evidence.

Exit: unknown or stale capability fails closed; browser/model cannot select provider authority; required live protocol lifecycle passes.

## WS-03 — Database authority

Source/local candidate includes:

- blank forward migration ledger through `0082`;
- deterministic hashes and forward-only compatibility;
- local PostgreSQL RLS, grants, security-definer, negative-isolation, concurrency, reservation, ambiguity, and receipt-chain tests.

Still required: disposable managed-platform application, advisors, existing-row/backfill behavior, security verification, backup/restore, and rollback evidence on the exact candidate.

Exit: local/CI PostgreSQL and required managed-platform gates pass; applied migrations remain immutable.

## WS-04 — Secret custody and target-host runtime

Source candidate includes Host Provisioner-only Docker authority, exact-image contracts, fail-closed destructive lifecycle classification, topology descriptors, and isolation/repair acceptance scripts.

Still required:

- managed secret inventory, audience, access, rotation, revocation, audit, rollback;
- no master credential in employee runtime, profile, browser, artifact, image, or logs;
- healthy ingress/Web/Manager/Gateway/Provisioner topology on a production-matching host;
- two-employee network/data/workspace/memory/queue/credential/action isolation;
- replace, suspend, restore, rotate, teardown, and neighbor-safe lifecycle proof.

Exit: least privilege, isolation, lifecycle repair, and exact-image target-host proof pass.

## WS-05 — Fixture-free owner and channels

Source candidate includes exact assignment/authority snapshots, cursor-before-delta streams, no-replay reconnect, Talk-first token streaming, connector setup projection, signed Review contracts, and bounded UI variants.

Still required:

- real owner verification, activation, assignment, runtime readiness, secure session, and first turn;
- assignment/role/authority denial and revocation;
- reconnect and session rotation on live infrastructure;
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

Source contracts exist for revision, approval, effect, output, proof, repair, and replay safety. Still required: provider-backed, fixture-free execution and preview/delivery parity for all three roles.

Exit: all three complete real bounded work; stale approval and duplicate effect fail closed; every success has matching tenant-isolated refindable proof.

## WS-07 — Commercial and provider ambiguity

Source/local candidate includes:

- atomic worst-case reservation before dispatch;
- shared PostgreSQL rate authority;
- one durable request/effect/provider identity;
- accepted, failed, denied, refunded, and ambiguous state;
- effect-bound accounting, immutable adjustments, and conservation;
- original-effect reconciliation before retry.

Still required: provider-sandbox idempotency and accepted-response-loss behavior plus payer, beneficiary, price, entitlement, usage, cost, invoice, refund, suspension, and reactivation reconciliation.

Exit: replicas cannot overspend or multiply rate authority; uncertainty cannot trigger blind replay; commercial state settles exactly once and is never caller-selectable.

## WS-08 — Repair, rollback, observability, release

Source/CI candidate includes:

- deterministic fault-state and safe-next-action contracts;
- database/runtime/profile/ingress/config/image rollback compatibility guards;
- database/filesystem/secret-version backup bundle and proof-refinding verification;
- telemetry and diagnostic lineage;
- five exact-SHA images;
- signed release metadata and independent verification;
- typed Manager composition replacing generated string mutation.

Still required: destructive recovery and rollback rehearsal on production-matching infrastructure, trusted production signing authority, registry retention, incident execution, and accepted-work conservation under real faults.

Exit: faults cannot create false success or duplicate effects; rollback preserves accepted work; signed evidence verifies independently in the target environment.

## WS-09 — Human surface, capacity, and pilot

Source/fixture candidate includes coherent owner/connector/approval/proof/recovery grammar, responsive production and variant surfaces, browser automation infrastructure, capacity/fairness descriptors, and pilot-stop schema.

Still required:

- representative Chromium, Firefox, WebKit, and mobile-Safari execution;
- automated and manual accessibility acceptance, including screen reader, keyboard, zoom, focus, and reflow;
- interruption, reconnect, ambiguity, and recovery UX on live state;
- representative 25–30-runtime capacity, fairness, SSE, and noisy-neighbor measurement on a 64 GiB host;
- pilot eligibility, limits, data handling, incident ownership, rollback, exit thresholds, customer exit, and stop authority.

Exit: supported-browser/WCAG acceptance, declared safe capacity, and complete controlled-pilot packet.

## Frozen candidate rule

Freeze only after every non-waivable gate passes on one exact candidate with migration hashes, image digests, managed database, provider, target-host, browser/channel, commercial, recovery, trusted signing, and pilot evidence. A formal certificate may discharge a gate only when that gate explicitly defines and verifies the required model-to-system correspondence. Pilot is a measured production stage, never a substitute for prerequisites.
