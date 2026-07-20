# Phase 2 Standard Remediation — Production Execution Program

Status: approved for execution

Date: 2026-07-18  
Deadline: 2026-07-21  
Branch: `employee-production-tuesday`  
Baseline: `571ab08bbf7c84071ee97da1a71d89027618597f`  
Audited implementation: `d963efcaff9285cdf8ebc6c069213a2cda7d110d`  
Standard: approved AMTECH STANDARD v0.1 Draft 2, blob `21a4d3c0e155e91592b60747252ede48efe6f97a`  
Governing findings: `../GAPS.md`  
Governing remediation: `../REMEDIATION.md`

## 1. Objective and non-negotiable scope

Deliver the complete standard-conforming MVP through the canonical normal-employee path. MVP does not mean a reduced feature set. Execution is compressed through contract-first parallel agentic development, bounded ownership, continuous integration, and release-bound proof.

The canonical path remains:

```text
public DNS / Cloudflare Tunnel
-> Caddy
-> production Web + Manager
-> real /create-ai-employee
-> Twilio Verify
-> account creation
-> Start Employee
-> durable provisioning request
-> leased reconciler
-> signed host-private provisioner
-> isolated Hermes runtime
-> owner web/SMS/voice surfaces
-> provider-backed work and reply
-> governed connected-tool effects
-> commercial attribution and proof
```

`main` is never edited. The public estimator remains non-canonical.

## 2. Plan validation result

The supplied lane plan was reviewed against `GAPS.md`, `REMEDIATION.md`, the canonical runbook, repository instructions, existing CI, and the pre-spike baseline.

Corrections applied before implementation:

1. Lane 4's Saturday red suite was incorrectly assigned gateway/provider/connector tests. It now owns onboarding duplicate-submit, claim races, Auth timeout, Auth-success/DB-failure, DB-success/session-failure, and repair replay.
2. Lanes 5–10 do not wait for lanes 1–4 to become fully green. They begin immediately with contract consumption, red tests, adapters, fixtures, and proof machinery. They may not merge production behavior until their required upstream contracts are frozen and their dependency tests pass.
3. Source-text assertions may guard file shape but cannot close a finding. Every finding requires behavioral, database, concurrency, fault, browser, provider, release, or research-vector evidence appropriate to the boundary.
4. P4 closure means instrumentation, baseline ownership, falsifiers, decision records, and claim gating. It does not falsely claim long-term market validation by Tuesday.
5. Cross-organization sharing may be policy-disabled for the first launch, but the ontology must represent it safely and tests must prove the disabled boundary fails closed.

validation-vector((pass-vector:
- all 29 findings have one primary lane, explicit dependencies, an executable validation method, and a numeric or binary pass threshold;
- all six shared contracts have one owner and consumer compatibility tests;
- shared files have one merge owner;
- every P0/P1 implementation begins after a failing invariant test exists;
- all standard-required product lanes execute in parallel after contract freeze;
- production promotion requires every hard gate, not an aggregate score
)(fail-vector:
- any finding is unmapped, multiply owned without one accountable owner, or lacks a measurable threshold;
- a lane invents its own actor, assignment, retry, version, receipt, or evidence vocabulary;
- a source-text test is used as closure evidence;
- a failed authority, isolation, accounting, protocol, migration, provider, or release gate is waived;
- documentation upgrades implementation or live state
))

## 3. Six frozen shared contracts

### C1 — Labor/domain relationship contract

Owner: Lane 1.

Must define organization, account, human principal, employee principal, assignment, employment/management, access, authority, resource custody, payer, beneficiary, supervisor, lifecycle, provenance, and restricted launch policy.

Pass:
- one normative schema and TypeScript contract;
- every consequential resource names `assignment_id` or explicit platform/system context;
- employee identity is not deleted when an assignment ends;
- same-org and cross-org policy outcomes are explicit;
- old account/employee fields are marked compatibility inputs, not authority.

Fail:
- account membership, `employees.account_id`, phone ownership, or caller-selected IDs can independently authorize work;
- ambiguous backfill is silently accepted.

### C2 — Authorization decision contract

Owner: Lane 1; Lane 2 co-reviews principal/session semantics.

Decision input: authenticated actor, actor class, assignment/platform context, resource, action, current relationship/grant, policy version, environment/risk. Decision output: allow/deny, reason, policy version, actor provenance, correlation ID.

Pass: one evaluator is used by RLS helpers, server routes, SMS/channel resolution, signed resources, connectors, and admin customer-resource access.

Fail: any enabled path authorizes solely from bearer possession, account membership, caller headers, or mutable request IDs.

### C3 — Durable command/effect contract

Owner: Lane 3.

Pipeline:

```text
stable intent -> immutable command -> atomic claim -> attempt
-> provider/local effect -> accepted|failed|ambiguous receipt
-> reconciliation -> deterministic replay response
```

Pass: one command per intent; one terminal claim; never two committed irreversible effects; success always has a durable receipt.

Fail: application read-then-write owns a race; timeout is reported as success without receipt; replay can create a second effect.

### C4 — Consequential protocol envelope

Owner: Lane 9; kernel implementation shared with Lane 3.

Required fields: protocol name/version, schema version, producer, actor, assignment/platform context, intent/command ID, correlation/causation IDs, policy version, created time, compatibility range, payload hash, original payload provenance.

Pass: unknown major versions reject; supported old versions deterministically upcast and preserve the original hash.

Fail: replay after deployment can silently acquire new semantics.

### C5 — Provider capability and receipt contract

Owner: Lane 6; consumed by Lanes 3, 4, 5, and 7.

Every effect is classified as `native_idempotency`, `queryable_receipt`, `consumer_dedupe`, or `non_idempotent_ambiguous`.

Pass: provider signature/authentication is verified before processing; capability class determines retry/reconciliation; ambiguity is durable and visible.

Fail: all providers are treated as exactly-once; ambiguous external acceptance is overwritten as failure or success without evidence.

### C6 — Release-state and proof contract

Owner: Lane 10.

States remain separate: theory, source-wired, CI-accepted, real-Supabase-accepted, runtime-accepted, provider-accepted, browser/channel-accepted, commercial-accepted, production-deployed, market-validated.

Pass: immutable proof manifest binds SHA, environment, timestamp, script version, digest, redaction state, and required evidence IDs.

Fail: docs, confidence, fixtures, the estimator, old containers, or a narrow CI slice promote release state.

## 4. Parallel lanes and item-level gates

### Lane 1 — Relationships, authorization, and RLS

Closes: P0-001, P0-002; foundations for P0-003, P1-006, P1-011, P1-017, P2-019, P3-026, P4-029.

1. L1.1 Freeze C1 ontology.
   - Pass: decision record resolves every overloaded meaning of account/user/employee/assignment/custody/payer/beneficiary.
   - Fail: one identifier retains two conflicting authority or accounting meanings.
2. L1.2 Write red relationship and authorization matrix.
   - Pass: at least nine required relationship cases fail for the audited reason, including two users/two employees, user in two accounts, employee with two assignments, payer/beneficiary split, revoked relationship, and disabled cross-org policy.
   - Fail: tests fail from harness setup or only inspect source text.
3. L1.3 Add forward-only shadow schema and reviewed backfill.
   - Pass: rerunnable migration; zero active rows without assignment/system context; zero ambiguous backfills.
   - Fail: applied migrations rewritten, history deleted, or ambiguity auto-resolved.
4. L1.4 Implement one authorization evaluator and assignment-aware RLS/routes.
   - Pass: zero unauthorized reads/writes/actions in the matrix; authorized cases retain access; revocation denial <=60 seconds.
   - Fail: any route or policy falls back to account-wide access.
5. L1.5 Prove real Supabase and browser/channel isolation.
   - Pass: real project packet with cross-account, cross-employee, wrong-role, signed-resource, and SMS/channel denial.
   - Fail: CI PostgreSQL is substituted for Supabase acceptance.

### Lane 2 — Approvals, sessions, links, service and admin identity

Closes: P0-003, P0-004, P1-005, P1-006, P1-016.

1. L2.1 Write red authority suite.
   - Pass: unauthorized resolver, employee self-approval, changed snapshot, role revocation, forged/wrong-purpose token, and header spoof fail for the expected reason.
   - Fail: bearer possession still resolves authority.
2. L2.2 Principal-bound immutable approval request.
   - Pass: request stores assignment, requester, required resolver grant, policy/version, risk, expiry, immutable snapshot/hash, command/effect key, and channels.
   - Fail: execution uses caller-mutated amount, recipient, content, or resource.
3. L2.3 Atomic resolution and lease claim.
   - Pass: 100 concurrent resolves produce exactly one terminal claim and one effect or durable ambiguous state.
   - Fail: two claims/effects or post-effect token consumption.
4. L2.4 Revocable sessions and signed resources.
   - Pass: invalid/revoked/replayed credentials denied 100%; revocation <=60 seconds; one atomic action claim.
   - Fail: possession remains sufficient after role/relationship change.
5. L2.5 Scoped service principals and independent platform admin auth.
   - Pass: wrong audience/capability/replay/expired/service spoof denied; every customer admin access has minimum role, reason, active support lease, and audit event.
   - Fail: shared Manager token or caller header impersonates a human/admin.

### Lane 3 — Durable command/effect kernel

Closes shared mechanism behind P0-004, P1-007, P1-008, P1-009, P1-010, P2-021.

1. L3.1 Write red intent/claim/effect/replay tests.
   - Pass: double submit, lost response, concurrent claim, crash before effect, timeout after acceptance, worker restart, and contradictory outcome tests fail for audited behavior.
   - Fail: tests depend only on mocks that cannot represent durable state.
2. L3.2 Implement immutable command and atomic claim ledger.
   - Pass: one assignment-scoped command per stable intent; one active/terminal claim; actor and causation immutable.
   - Fail: application read-then-write remains authoritative.
3. L3.3 Implement effect attempts and durable receipts.
   - Pass: accepted, failed, and ambiguous states persist before response; provider capability class recorded.
   - Fail: success without receipt or ambiguity discarded.
4. L3.4 Implement deterministic replay and reconciliation.
   - Pass: replay returns the same command/effect result without repeating the effect; repair visibility exists.
   - Fail: replay silently creates new semantics or effects.
5. L3.5 Migrate approvals, onboarding, turns, provisioning, connectors, gateway, and delegation incrementally.
   - Pass: each consumer passes its own fault suite before legacy path removal.
   - Fail: big-bang migration with no dual-read/compatibility proof.

### Lane 4 — Identity and onboarding saga

Closes: P1-007 and identity creation portion of P0-001.

1. L4.1 Write onboarding red suite.
   - Pass: duplicate submit, simultaneous claim, Auth timeout, Auth success/DB failure, DB success/session failure, existing email, existing phone, retry after every fault, and repair replay fail for audited behavior.
   - Fail: gateway/provider/connector tests are misclassified as onboarding coverage.
2. L4.2 Implement one local transactional identity/relationship RPC.
   - Pass: one account graph and assignment per intent; uniqueness constraints own phone/claim races.
   - Fail: partial local graph reported as success.
3. L4.3 Model Supabase Auth as an external effect.
   - Pass: durable effect receipt, compensation/reconciliation, retryable/repair-required states; zero untracked orphan Auth users.
   - Fail: Auth and database are treated as one impossible distributed transaction.
4. L4.4 Deterministic claim/session completion.
   - Pass: retries converge to the same account/assignment/session result.
   - Fail: retry requires manual database surgery or creates a second identity.
5. L4.5 Real Auth + Supabase canonical onboarding packet.
   - Pass: fixture-free browser onboarding through Twilio Verify and isolated runtime, bound to release SHA.
   - Fail: dev login, fixture mode, or manually inserted identities are counted.

### Lane 5 — Gateway budgets, commercial attribution, and entitlements

Closes: P1-008, P1-017, P2-018; measurement basis for P4-029.

Pass metrics: zero budget overshoot beyond declared rounding/in-flight tolerance; zero successful provider responses without usage receipt; every billable event reconciles to one assignment and payer; deny policy actually denies; provider/invoice delta within declared rounding threshold.

Fail metrics: process memory is authoritative; entitlement defaults allow; provider cost, labor outcome, payer, beneficiary, and invoice line remain conflated.

### Lane 6 — Connector custody and provider ingress/effects

Closes: P1-011 and connector portions of P0-002/P0-003.

Pass metrics: zero cross-assignment data/effects; every event verifies provider and resolves exactly one assignment or durable waiting-for-binding state; duplicate/out-of-order/replay/revoked binding tests pass; one real packet per launch connector.

Fail metrics: fallback to account-wide binding; unverified event reaches business processing; ambiguous effect is replayed blindly.

### Lane 7 — Turns, context, voice, workers, recovery

Closes: P1-009, P1-010, P2-021, P3-025.

Pass metrics: one primer per transcript version; one turn/effect chain per intent; deterministic browser/SMS replay; no cross-assignment voice context; no lost work under kill/restart; bounded duplicate claims; alerts within SLO; backlog drains.

Fail metrics: primer claim failure mutates context; reconnect duplicates work; voice is a separate agent; worker liveness is inferred from API health.

### Lane 8 — Workforce/product surfaces and generic materialization

Closes: P2-019, P2-020, P2-023, P3-024 and surface portions of P3-025/P3-026.

Pass metrics: role-safe assignment selector; ordinary operator can identify required decision, cost, proof, and repair without IDs/infrastructure vocabulary; all launch tools materialize through governed generic contracts; invalid/recursive/oversized/secret-injected schemas fail closed; estimator evidence never enters employee proof.

Fail metrics: bespoke renderer widens authority; raw internal vocabulary exposed; unsupported public claims remain.

### Lane 9 — Protocols, delegation, and research vectors

Closes: P1-015, P3-024, P3-025, P3-026, P3-027, P4-028, P4-029.

Pass metrics: 100% consequential envelopes versioned; unknown major acceptance = 0; deterministic upcast hash; delegation transfers no implicit secret/connector/authority; every research/commercial claim has current release-bound vector, baseline, threshold, owner, decision, and falsifier; hard-gate failure always blocks.

Fail metrics: cross-release evidence reused without validation; delegated assignment inherits authority by default; hypothesis is promoted to claim from architecture alone.

### Lane 10 — CI, schema deployment, proof, docs, and claims

Closes: P1-012, P1-013, P1-014, P2-020, P2-022.

Pass metrics: all active workspaces typecheck/build; real lint; complete unit/integration and boundary suites; blank and snapshot-clone migration; real Supabase matrix; production image; browser/provider acceptance; artifacts bind SHA/digest; seeded compile/lint/RLS/race/protocol/proof failures each block; canonical docs report identical state.

Fail metrics: skipped hard gate; current head has no status; static proof script counted as live proof; stale SHA/migration/status survives CI.

## 5. Dependency and concurrency rules

- All lanes start immediately with red tests, adapters, schemas, and proof tooling.
- Production behavior cannot merge until required contracts are frozen and compatibility tests pass.
- C1/C2 unblock assignment-aware consumers.
- C3/C4/C5 unblock durable external/consequential behavior.
- C6 is active from the first commit and owns promotion.
- Shared files have one merge owner: migrations (L1 with lane-reviewed contributions), shared envelopes/IDs (L3/L9), Manager registration (integration lead), package scripts/workflow/release manifest (L10).
- Commits remain small and independently reversible. No 24-hour mega-branches.

## 6. Four-day gate schedule

### Saturday — control plane and red boundary tests

Pass:
- integration branch exists from `571ab08...`;
- six contracts frozen and machine-readable validation registry passes;
- all 29 findings mapped;
- every P0/P1 has a failing behavioral test or an explicit environment-gated real test harness;
- P2/P3 acceptance tests exist;
- P4 vectors have baselines/falsifiers;
- Lane 10 CI starts on this branch.

Fail: implementation begins without the relevant red test, plan registry is incomplete, or a shared contract is forked by a lane.

### Sunday — shared kernels and local/integration convergence

Pass:
- relationship graph, authorization evaluator, command/effect kernel, consequential envelope, provider capability model, and release ledger operational;
- P0 behavioral suites green;
- core P1 local/integration suites green;
- every workspace compiles;
- no enabled route treats account membership, bearer possession, or caller identity as complete authorization.

Fail: any P0 invariant remains red or a consumer bypasses the shared kernels.

### Monday — full feature convergence and production-shaped proof

Pass:
- all P0–P3 tests green;
- P4 measurement/claim gates green;
- all standard features operate in staging;
- real Supabase, browser, SMS, voice, provider, approval, gateway, worker recovery, protocol rolling deploy, and commercial reconciliation packets bind one SHA;
- every external effect has accepted/failed/ambiguous receipt.

Fail: any packet is fixture-derived, stale, cross-SHA, or omits a hard gate.

### Tuesday — frozen production promotion

Pass:
- exact staging-accepted SHA deployed;
- production migrations and verifier pass;
- canonical onboarding, runtime, all required channels, approval/effects, connectors, commercial attribution, delegation, and materialization exercised;
- cross-user/employee denial, revocation, duplicate intent/effect, restart/recovery, and receipt reconciliation pass;
- redacted proof ledger published;
- public claims match evidence.

Fail: feature development continues except release-blocker repair, deployed SHA differs from proof SHA, or any hard gate is missing/failed.

## 7. Plan-wide production gate

validation-vector((pass-vector:
- all standard-required features exist;
- P0-P3 findings are behaviorally closed;
- P4 is instrumented, baseline-bound, decision-recorded, and claim-gated;
- production Supabase and executable source share one release manifest;
- real providers, browsers, web, SMS, and voice accept the tested flows;
- concurrency, retry, revocation, protocol, budget, and restart thresholds pass;
- commercial attribution reconciles;
- estimator remains non-canonical;
- release and public claims match the exact evidence tier
)(fail-vector:
- unauthorized access/action count > 0;
- duplicate irreversible effects > 1;
- successful consequential response without durable receipt > 0;
- active work without assignment/system context > 0;
- revoked access after 60 seconds > 0;
- unknown consequential major version accepted > 0;
- budget overshoot above declared tolerance > 0;
- required proof artifact missing, stale, fixture-derived, or bound to another SHA;
- unsupported public/commercial claim remains
))

## 8. Change control

Any change to scope, contracts, finding ownership, thresholds, or release state requires:

1. evidence;
2. assumption being changed;
3. rejected alternatives;
4. downstream impact;
5. reversal trigger;
6. falsification test;
7. updated machine-readable registry;
8. integration-lead review.

No severity waiver or aggregate score can override authority, isolation, privacy, accounting, protocol, migration, provider, or evidence hard gates.
