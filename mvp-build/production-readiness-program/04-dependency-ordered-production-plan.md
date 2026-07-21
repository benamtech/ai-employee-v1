# Dependency-Ordered Production Roadmap

Status: **active execution order**  
Main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`  
Stacked base: PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a`  
Current source candidate: PR #35  
Source migration head: `0076`  
Decision protocol: [`../decision/README.md`](../decision/README.md)  
Scope: credible P0/P1/P2 production and controlled-pilot gaps under Standard v0.2

This is the sole active execution roadmap. Detailed issue state lives in `08-production-issue-vector.json` and `13-resolution-ledger.json`; completion contracts live in `09-workstream-execution-map.md`; test/evidence authority lives in `10-test-suite-disposition.md` and `07-verification-and-handoff-matrix.md`.

## Compute before opening or changing a workstream

Every non-mechanical workstream decision follows the applicable tier in `decision/README.md`:

```text
current authority and evidence/Unknown extraction
→ independent possible-decision vectors
→ invariant and prerequisite filter
→ computed utility/diversity/dependency comparison
→ selected exploration
→ separate coherent implementation compression
→ red behavioral proof
→ implementation
→ exact-head and external verification
```

Cross-workstream production changes are `T3` unless the record proves a smaller decision space. A workstream map is not a candidate population. A trajectory score is not a patch list. Unknown prerequisites remain Unknown and increase Unsupported.

## Dependency spine

```text
WS-01 repository/test/document truth
→ WS-02 connector and protocol authority
→ WS-03 database authority
→ WS-04 target-host/runtime custody
→ WS-05 fixture-free owner/channels
→ WS-06 golden governed work
↘ WS-07 commercial/rate/ambiguity (starts after stable WS-03 schema; gates final WS-05/06 provider acceptance)
→ WS-08 crash/rollback/observability/signed release
→ WS-09 human surface/capacity/pilot
→ frozen release candidate
→ controlled pilot
→ measured expansion
```

No phase inherits evidence from another SHA. Downstream preparation is allowed only when it cannot bypass a red prerequisite and is not claimed accepted early.

## Current checkpoint

- WS-01/02 retain only exact accepted prior evidence.
- PR #34 is the current owner-runtime base for WS-05/06.
- PR #35 implements the WS-06/07 source transaction and bounded WS-08 groundwork.
- `decision/trace007/` is the active computed T3 record and selects `D01,D02,D03,D04,D06,D07`.
- Exact-head CI, managed database, provider, target-host, fixture-free channel/golden-work, commercial lifecycle, rollback/recovery, signed release, pilot, deployment, and production gates remain open.

## WS-01 — Repository, test, and document truth

Deliverables:

- one Standard, one computation protocol, one active program, one memory index;
- active docs agree on branch/base/head, migration head, workstream state, active trace, and evidence classes;
- historical plans/audits are explicit routers or archives;
- broad and curated suites remain distinct;
- governance/type/lint/build/archaeology/browser gates run on the exact candidate.

Exit:

```text
one active authority route
AND no false-current plan/audit/trace entrypoint
AND exact-head governance and broad gates pass
AND no test expectation is weakened to hide a current defect
```

## WS-02 — Connector, Remote MCP, MCP Apps, AG-UI, and effective capability

Deliverables:

- Manager-owned issuer/resource/scope/redirect/PKCE/state/token custody;
- default-deny direct consequential MCP;
- content-bound MCP Apps and bounded host actions;
- persisted effective-capability graph intersecting advertisement, runtime, dependencies, credentials, network, assignment policy, entitlement, connector health, freshness, and live probe;
- live connector setup, health, scope change, revocation, outage, repair, deletion;
- ordered role-safe AG-UI projection after durable capability/work truth exists.

Exit: unknown/stale capability fails closed; browser/model cannot select provider authority; live connector/protocol lifecycle passes required evidence.

## WS-03 — Database authority and platform closure

Deliverables:

- blank migration ledger through current forward head (`0076` now, plus later additions);
- deterministic hashes and existing-row/backfill compatibility;
- RLS/grant/security-definer/negative-isolation matrices;
- claim/lease/CAS/replay/authority-version/reservation/ambiguity/rollback concurrency proof;
- disposable managed Supabase proof for security-sensitive and release-candidate behavior;
- staging backup, advisor, migration, and rollback evidence.

Exit: reproducible PostgreSQL matrices and applicable managed-platform gates pass; no applied migration is modified; downstream work has an accepted schema boundary.

## WS-04 — Secret custody, target host, runtime isolation, lifecycle

Deliverables:

- managed secret inventory, audience, access, rotation, revocation, audit, rollback;
- no provider/platform master secret in images, employee profiles/runtimes, browser, artifacts, or logs;
- healthy Caddy/Web/Manager/Model Gateway/Host Provisioner topology;
- Host Provisioner is sole Docker authority;
- two-employee network/data/workspace/memory/queue/credential/action isolation;
- lifecycle replacement/suspension/restoration/rotation/restart/teardown;
- immutable Hermes digest bound to candidate evidence.

Exit: topology, least privilege, isolation, lifecycle repair, and exact image evidence pass on target host.

## WS-05 — Fixture-free identity, owner, connector, and channels

Deliverables:

- real owner verification, activation, explicit assignment, runtime readiness, HttpOnly session, strict snapshot, first turn;
- exact assignment/role/authority denial and revocation;
- honest HTTP/state matrix and reconnect/session-rotation/snapshot recovery;
- live generic connector lifecycle;
- Web/SMS/signed-Review parity over one durable work/approval/proof state.

Exit: one real owner supervises one assigned employee on the exact candidate with no fixture/manual outcome; failures never render as success; channels converge on durable truth.

## WS-06 — Golden governed work and proof refinding

Required journey:

```text
real trigger and assignment
→ Hermes or deterministic work
→ typed artifact/work resource
→ immutable revision and validation
→ exact approval snapshot
→ durable command/effect reservation
→ one provider/publication effect
→ accepted | failed | ambiguous receipt
→ effect-bound accounting when applicable
→ post-effect verification
→ repairable owner proof
→ idempotent replay/recovery and restart refinding
```

Roles: Website Employee A, Contractor Office Employee B, Bookkeeping Employee C.

Exit: all three complete real bounded work; preview/delivery parity holds; stale approval and duplicate effect fail closed; every success has matching evidence; proof is tenant-isolated and refindable.

## WS-07 — Commercial controls, shared rate authority, provider ambiguity

PR #35 source candidate provides:

- atomic worst-case reservation before dispatch;
- shared PostgreSQL rate windows;
- one durable request/effect/provider-idempotency identity;
- accepted/failed/denied/refunded/ambiguous states;
- effect-bound commercial accounting;
- immutable adjustments and conservation;
- explicit reconciliation of the original native-idempotency effect identity;
- reconciliation and lineage views.

Still required:

- exact-head unit/PostgreSQL CI;
- managed database proof;
- real provider request ID/idempotency/timeout/accepted-response-loss reconciliation;
- payer/beneficiary/price/entitlement/usage/cost/invoice/refund/suspension/reactivation reconciliation.

Exit: replicas cannot overspend or multiply rate authority; uncertainty cannot trigger blind replay; commercial state settles exactly once and is never caller-selectable.

## WS-08 — Crash repair, rollback, observability, signed release

PR #35 groundwork provides repair/reconciliation state, proof projection, lineage, deterministic seams, and focused workflow wiring.

Still required:

- fault injection at durable claims, dispatch, receipts, publication, provisioning, rotation, migration, deployment;
- forward repair or explicit manual-repair terminal states;
- database/runtime/profile/Caddy/config/image/application rollback compatibility;
- backup/restore integrity and recovery-time evidence;
- telemetry and incident runbooks;
- SBOM, in-toto/SLSA provenance, signed deployment manifest, independent verifier.

Exit: faults cannot create false success or duplicate effect; rollback/restore preserves accepted work; signed evidence verifies independently; alerts distinguish blocked, failed, ambiguous, repaired, recovered.

## WS-09 — Human surface, capacity, and pilot

Deliverables:

- coherent owner/public/account/billing/admin/artifact/connector/approval/proof/recovery grammar;
- Chromium/Firefox/WebKit/mobile-Safari representative execution;
- automated accessibility plus manual NVDA/VoiceOver critical journeys;
- interruption/reconnect/restart/ambiguity/recovery UX;
- measured capacity/fairness progression `1 → 10 → 100 → 250 → 500 → 700`;
- controlled-pilot eligibility, entitlements, limits, data handling, incident ownership, rollback, exit, thresholds, and stop authority.

Exit: supported-browser/WCAG acceptance, declared capacity without unsafe unfair degradation, and complete pilot packet.

## Frozen candidate and pilot rule

A release candidate is frozen only after all non-waivable workstream gates pass on one exact SHA with migration hashes, image digests, provider/database/target-host/browser/channel/commercial/recovery evidence, and signed release metadata.

Pilot is a measured production stage, not a substitute for prerequisites. Stop authority and rollback remain explicit.
