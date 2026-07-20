# 2026-07-20 — Post-Merge Production Roadmap Reconciliation

Status: **planning/source-document transaction on reviewed branch; not yet CI-accepted; no product runtime behavior changed**

## Coordinates

- Repository: `benamtech/ai-employee-v1`
- Base: current `main`
- Base/merge SHA: `5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`
- Working branch: `agent/amtech-p0-plan-003-production-roadmap`
- Task: `AMTECH-P0-PLAN-003`
- Historical cutover branch: `employee-production-tuesday`
- Historical cutover PR: merged `#23`
- Final cutover evidence head: `d131dd09e216fc9dcf0444afd1eb1494194f52eb`
- Migration head: `0072`
- Standard: ratified v0.2; no normative clause or evolution-vector direction changed in this pass
- Active program: `../second-half-plan/2026-07-19-ratified-standard-production-program/`

Primary role: release architect and production planning integrator.  
Interacting roles: implementation architect, security/authorization reviewer, database engineer, SRE, commercial systems engineer, UI/UX/accessibility lead, test engineer, product lead, and release owner.

## Purpose and invariant

Reconcile the repository after PR `#23` merged, audit current source/test/workflow/evidence state, identify and score credible P0/P1/P2 production issues, deduplicate them into dependency-ordered workstreams, and expand the sole active production plan without creating a competing roadmap.

Invariant: planning and documentation cannot manufacture implementation or live acceptance. Curated green suites cannot conceal a broader red aggregate, and protocol/UI/provider surfaces cannot create assignment, credential, approval, effect, commercial, or release authority.

## Authority-chain read and evidence inspected

Read in required order:

- root `identity.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CODEGRAPH.md`;
- scoped `AGENTS.md`, `CODEGRAPH.md`, and full ratified `STANDARD.md`;
- active-plan router and active program;
- sole memory index and newest relevant ratification handoff;
- architecture index and current gap register;
- current package scripts, main integration workflow, migrations/source maps, PR `#23`, current Git history, exact final-head workflows;
- current Model Gateway source and HTTP provider loop;
- test and release-evidence contracts relevant to branch/test claims.

The wiki was not wandered. Only the explicitly routed historical build-plan index was checked to confirm that it already points to the active program.

## Confirmed post-merge contradictions

1. PR `#23` is merged, but root/scoped authority documents still described `employee-production-tuesday` and draft PR `#23` as current.
2. Active verification material still centered ancestor Gate 0 head `4be092f` despite the final cutover head and merged-main coordinate.
3. Architecture gap metadata still claimed migration head `0069` and an older production ledger while current source head is `0072`.
4. The broad `npm run test:unit` aggregate was explicitly red on final cutover head `d131dd09`; PR `#23` records 30 files and 112 failed tests from pre-ratification assignment, principal, fake-RPC, and environment fixtures.
5. Main Integration Gates intentionally compose current named authority/production/UI suites. Their success does not prove the broad aggregate.

Final cutover evidence on `d131dd09`:

- Ratified Standard and Production Plan Integrity — `29717830698` — success;
- Hermes Upstream Review — `29717830703` — success;
- Main Integration Gates — `29717830737` — success.

Merge SHA `5e5b8d7` is the current `main` coordinate. Neither coordinate proves a live boundary or the red broad aggregate.

## Source-confirmed high-centrality defects

Model Gateway source confirms:

- `apps/manager/src/lib/model-gateway.ts` stores rate authority in a process-local `Map`;
- spend policy only rejects `spend_limit_cents <= 0`, without cumulative atomic reservation/settlement;
- usage/cost audit is recorded after provider execution;
- `apps/manager/src/lib/model-gateway-http.ts` retries timeout/transport exceptions without a generic provider idempotency contract;
- terminal retry exhaustion is recorded failed/provider-unavailable rather than durable ambiguous, even though the provider may have accepted the request.

Repository/source searches and the active protocol program confirm that protected remote MCP authorization, official MCP Apps host negotiation/sandbox/bridge, complete AG-UI replay adapter, persisted effective-capability truth, and live connector authorization/health/revocation proof remain open.

No source implementation of standard SBOM/provenance/signing and independently verifiable signed deployment manifest was found. Existing release-evidence contracts remain source/CI shape, not deployed attestation.

## Issue vector and workstreams

Created a machine-readable 38-issue vector:

- `../second-half-plan/2026-07-19-ratified-standard-production-program/08-production-issue-vector.json`
- human companion `08-production-issue-vector.md`

Each issue records priority, production-blocking severity, evidence confidence, user impact, authority/safety risk, dependency centrality, blast radius, reversibility risk, maintainability drag, production-readiness gap, boundaries, and evidence coordinates.

Deduplicated into nine workstreams:

1. WS-01 repository authority and test-contract truth;
2. WS-02 connector, remote MCP, MCP Apps, AG-UI, and capability truth;
3. WS-03 database authority, migrations, RLS, concurrency, and platform proof;
4. WS-04 secret custody, target host, runtime isolation, and lifecycle;
5. WS-05 fixture-free identity, owner, connector, and channels;
6. WS-06 golden work, output parity, and proof refinding;
7. WS-07 commercial controls, shared rates, provider ambiguity, and reconciliation;
8. WS-08 crash repair, rollback, observability, and signed release evidence;
9. WS-09 human surfaces, accessibility, capacity, and controlled pilot.

`09-workstream-execution-map.md` defines P0/P1/P2 issues, dependencies, acceptance evidence, tests, external prerequisites, stop conditions, and exact completion for every workstream.

## Roadmap change

Expanded the existing canonical `04-dependency-ordered-production-plan.md` in place:

- Phase 1.1 — WS-01 repository/test truth;
- Phase 1.2 — WS-02 connector/protocol/capability truth;
- Phase 1.3 — WS-03 database authority;
- Phase 1.4 — WS-04 secret/runtime custody;
- Phase 1.5 — WS-05 fixture-free owner/channels;
- Phase 1.6 — WS-06 golden governed work;
- Phase 1.7 — WS-07 commercial/rate/ambiguity controls;
- Phase 1.8 — WS-08 crash/rollback/signed release;
- Phase 1.9 — WS-09 human surfaces/capacity/pilot preparation;
- Phase 2 — frozen exact release candidate;
- Phase 3 — controlled pilot;
- Phase 4 — measured 10/100/250/500/700 expansion.

Phase 1.1 is dependency-critical. It must make repository routing post-merge current, classify every suite, normalize the broad red aggregate, fix real source defects it exposes, preserve current curated contracts, and obtain final exact-head evidence before downstream completion claims.

## Test disposition

Created `10-test-suite-disposition.md`.

Current authoritative source-contract suites are preserved: Standard, onboarding, assignment, release evidence, production boundary, UI contracts, governance/type/lint/build, archaeology, and compiled fixture browser gates.

The broad `test:unit` aggregate is classified stale/migrating and red, not unusable and not superseded. Phase 1.1 must map each failure to a current source defect, stale fixture, duplicate contract, environment contract, or invalid test, then repair without weakening the invariant.

Environment-gated database, target-host, provider, channel, recovery, capacity, and release harnesses remain useful but blocked/incomplete until prerequisites exist. Fixture browser and local PostgreSQL evidence remain regression/TDD evidence, not live acceptance.

No suite is labeled proven flaky from current evidence. Potential timing/provider/browser/capacity nondeterminism must be diagnosed before quarantine or retries.

## Documents changed

Active-program files:

- `04-dependency-ordered-production-plan.md`
- `06-document-authority-and-archive-map.md`
- `07-verification-and-handoff-matrix.md`
- `08-production-issue-vector.json`
- `08-production-issue-vector.md`
- `09-workstream-execution-map.md`
- `10-test-suite-disposition.md`
- `11-task-contract.json`
- active program `README.md`
- `second-half-plan/README.md`

Repository and scoped routing:

- root `README.md`, `AGENTS.md`, `CLAUDE.md`, `CODEGRAPH.md`, `CONTRIBUTING.md`;
- scoped `README.md`, `AGENTS.md`, `CLAUDE.md`, `CODEGRAPH.md`.

Architecture/document control:

- `docs/architecture/README.md`;
- `docs/architecture/09-current-bug-risk-and-production-gap-register.md`;
- `docs/architecture/12-document-control-memory-and-handoff-map.md`.

Memory/governance files are completed in the same transaction.

## Hermes review decision

No ad hoc Hermes upstream check was run merely because the session started.

Reason:

- this pass changes planning, document routing, issue/test classification, and governance assertions only;
- it does not change Hermes images, digest pin, launcher, client/gateway behavior, profiles, sessions, tool discovery, runtime-native capabilities, or Hermes-derived UI;
- final cutover head `d131dd09` already passed the scheduled/path-aware Hermes review `29717830703`;
- no pin/baseline mismatch or watched-path drift was identified in the scoped work.

A future WS-04 or Hermes-boundary implementation task must run the repository check when required by policy.

## Verification performed in this pass

Performed through the connected GitHub repository interface:

- verified repository/default branch metadata;
- verified PR `#23` merged state, heads, merge SHA, dates, and body evidence boundary;
- inspected current source/doc/test/workflow files from `main`;
- verified final cutover workflow IDs and success states on `d131dd09`;
- created a reviewed branch from current `main`;
- applied only planning/document/governance files allowed by the task contract;
- maintained task-ID commit messages;
- did not modify Standard clauses, evolution vector, migrations, runtime source, connector source, Hermes source/pin, or historical wiki bodies.

Not yet performed:

- local `npm` commands, because this execution environment operates through the connected GitHub interface rather than a materialized repository/Node workspace;
- exact-head GitHub Actions on the final planning branch, because branch movement was still occurring while this handoff was written;
- broad unit normalization, database, target-host, provider, browser/channel, commercial, recovery, capacity, or deployment implementation/proof, because this is a planning-only transaction.

Those states remain open and must not be reported as pass.

## Unresolved uncertainties

1. The exact current failure list behind the 30 files/112 broad-unit failures must be recovered from retained diagnostics or rerun in Phase 1.1; PR `#23` establishes the aggregate result but not every individual current classification in this pass.
2. The approved staging/managed-Supabase project and its actual applied migration ledger are not resolved from current repository evidence.
3. The production secret manager, target host, immutable registry coordinates, provider sandboxes, billing sandbox, signing service, monitoring backend, accessibility reviewers, and pilot businesses are external prerequisites not present in source.
4. Some historical workflow branch triggers still include cutover/research branches. They are not treated as current plan authority, but Phase 1.1 should decide whether retaining them is useful historical diagnostics or stale CI scope.
5. No source evidence yet selects database versus Redis for shared rate authority; WS-07 must decide using atomicity, outage behavior, operational cost, and existing infrastructure rather than preference.
6. Exact provider idempotency/status/reconciliation capabilities vary; each adapter must declare what is supported and fail ambiguous when it is not.

## Next dependency-ordered move

1. Finish this documentation transaction, stop branch movement, and run task rubric, repository quick/full gates, release-evidence contract, and Main Integration Gates on the final PR head.
2. Do not claim Phase 1.1 complete from this planning pass alone.
3. Begin a bounded Phase 1.1 implementation task from updated `main`: collect broad-unit diagnostics, classify every failure, repair stale fixtures or source defects, and make the aggregate trustworthy and green.
4. Only then begin WS-02 protocol/capability implementation, routing any schema work through WS-03.

## Evidence state

- planning/document structure: source-wired on the working branch;
- final branch CI: pending;
- broad unit aggregate: failed/open on final cutover head;
- database/runtime/provider/browser/channel/commercial/recovery/deployment: not accepted;
- launch clearance: false.
