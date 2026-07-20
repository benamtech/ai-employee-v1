# AMTECH Phase 2 Standard Enforcement — REMEDIATION

**Audit source head:** `d963efcaff9285cdf8ebc6c069213a2cda7d110d`  
**Governing findings:** `mvp-build/GAPS.md`  
**Standard:** approved AMTECH STANDARD v0.1 Draft 2  
**Document purpose:** define the work and proof required to remove the audit blockers. This document does not implement any change.

## 1. Governing remediation principles

1. **Build the relationship graph before adding checks.** Do not patch account-wide authorization with scattered conditionals. Assignment, access, authority, resource custody, payer, beneficiary, and employment/management relationships must become durable first-class records.
2. **One authoritative execution context.** Every human request, employee turn, provider event, tool call, approval, runtime request, memory read/write, connector operation, effect, meter event, and billable item must carry a validated `assignment_id` or explicitly declared platform/system context.
3. **Database ownership of races.** Approval claims, claim-token consumption, phone ownership, turn intent, effect ownership, budget reservation, lease acquisition, revocation, and terminal transitions must use constraints, transactions, compare-and-set functions, or row locks. Application read-then-write logic is not sufficient.
4. **No bearer equals authority.** A session, signed link, internal token, or platform header may authenticate a principal or service, but authorization must be evaluated against a current relationship and policy version.
5. **No successful effect without durable receipt.** Provider acceptance, ambiguous timeout, settlement, and replay status must be persisted before the system reports completion.
6. **No source state may be promoted by documentation.** Built, CI-tested, real-Supabase-tested, production-deployed, provider-accepted, browser-accepted, commercial, and live are separate release states.
7. **Migrations are forward-only and reversible by compensating migration.** Do not rewrite applied migrations. Shadow columns, backfill, dual-read, then hard-gate and remove legacy paths.
8. **Minimize initial launch topology without weakening boundaries.** The first conforming tier may forbid cross-organization sharing and marketplace relationships, but it must still implement explicit assignments, multi-user/multi-employee isolation, authority, revocation, billing attribution, and repair.
9. **Test first at the invariant boundary.** Every remediation begins with a failing negative, concurrency, reboot, or revocation test. Happy-path tests alone do not close a finding.
10. **No launch waiver for P0/P1.** A workaround changes operational risk only; it does not change conformance or release status.

## 2. Immediate P0 launch gate

### REM-P0-01 — Introduce the canonical labor relationship graph
- **finding IDs:** GAP-P0-001, GAP-P0-002, GAP-P0-003, GAP-P1-011, GAP-P1-017
- **phase:** P0-A — ontology and schema foundation
- **owner role:** principal database/security architect
- **files/components:** new migrations after `0038`; `packages/db`; shared relationship schemas; Manager identity/context resolvers; web session context; runtime profile context.
- **design change:** Add `organizations`, account-to-organization relationships, stable employee principals, employment/management relationships, `employee_assignments`, assignment principals/roles, assignment resource grants, assignment authority policies, payer/beneficiary/custody relationships, and assignment-scoped memory/connector/billing partitions. Keep employee identity independent from account ownership. Define a restricted launch policy that permits only same-organization assignments initially while preserving the general graph.
- **migration impact:** additive shadow schema; backfill one default organization and one default assignment per existing account/employee; record inferred provenance; reject ambiguous rows; add foreign keys and uniqueness constraints; do not drop `employees.account_id` until dual-read proof passes.
- **dependency:** none; all other P0 work depends on this.
- **rollback:** disable assignment enforcement feature flag and continue legacy reads while retaining additive tables; rollback must not delete backfilled relationship history.
- **test-first sequence:** (1) schema test proving user/account/employee IDs cannot substitute for assignment; (2) multiple users and employees; (3) user in multiple accounts; (4) employee with two assignments; (5) payer/beneficiary separation; (6) invalid/expired/revoked relationship rejection; (7) migration backfill and rerun idempotency.
- **pass/fail threshold:** all nine required relationship tests pass; zero active work rows without a valid assignment or explicit system context; zero ambiguous backfills.
- **required proof tier:** migrations/constraints plus real-Supabase acceptance.
- **completion definition:** assignment is a required validated execution scope in schema and shared runtime contracts, and existing production data has a reviewed backfill report.

### REM-P0-02 — Replace account-wide RLS and route authorization
- **finding IDs:** GAP-P0-002, GAP-P1-006, GAP-P1-011
- **phase:** P0-B — isolation enforcement
- **owner role:** database security engineer
- **files/components:** RLS migrations; `amtech_account_ids()` successors; owner web routes; employee stream/resource routes; SMS sender resolution; artifact/preview access; connector queries; business brain; messages; approvals; runtime endpoints.
- **design change:** Add stable security-invoker helpers that resolve current user/session to authorized assignments and resource grants. Every user-facing table must enforce assignment-aware policies. Server routes must evaluate the same authorization function and project role-safe data. SMS must resolve a verified phone to a human principal and explicit assignment grant, not an account.
- **migration impact:** new RLS policies and helper functions; old account-wide policies retained only during shadow evaluation, then dropped in the enforcement migration; add required assignment foreign keys/indexes.
- **dependency:** REM-P0-01.
- **rollback:** policy switch can return to legacy account policies only in an isolated non-production environment; production rollback requires disabling affected surfaces rather than reopening account-wide access.
- **test-first sequence:** unauthorized cross-account read/write; unauthorized cross-employee read/write in one account; authorized shared employee; user in two accounts; resource-class grant; role-specific projection; assignment revocation; SMS wrong sender; signed artifact wrong assignment.
- **pass/fail threshold:** zero unauthorized rows/actions in real-Supabase matrix; revocation denial within 60 seconds; authorized cases retain required access.
- **required proof tier:** real Supabase, canonical browser, and real SMS/provider packet.
- **completion definition:** no owner-facing or provider-facing path authorizes solely on account membership or `employees.account_id`.

### REM-P0-03 — Rebuild approval as a principal-bound command protocol
- **finding IDs:** GAP-P0-003, GAP-P0-004, GAP-P1-005, GAP-P1-006
- **phase:** P0-C — authority and terminal effects
- **owner role:** principal application security/distributed-systems engineer
- **files/components:** approvals migration; shared approval envelope; `estimate.stub.ts`; QuickBooks/Gmail/Stripe gates; preview links; signed links; owner session; Manager HTTP/MCP transports; audit/effect receipts.
- **design change:** Approval request stores assignment, requester principal/service, required resolver role/grant, immutable action snapshot and hash, policy/version, risk class, expiry/revocation, command/effect key, and permitted channels. Resolution requires an authenticated current principal and an atomic database claim. The approved command is executed from the stored snapshot, not caller-submitted mutable fields. Terminal effect receipt is linked to the approval and command.
- **migration impact:** additive approval version/actor/snapshot/claim/effect columns or new v2 tables; migrate pending approvals to expired/legacy-review-required unless exact snapshot can be proven; no automatic approval carryover.
- **dependency:** REM-P0-01 and REM-P0-02.
- **rollback:** stop approval execution and retain read-only history; never restore the global-token owner path.
- **test-first sequence:** employee self-approval; account member without role; delegated approver; revoked role; expired approval; changed amount/recipient/content after request; 100 concurrent resolves; double tap; lost response; crash before provider call; crash after provider acceptance; contradictory outcomes.
- **pass/fail threshold:** zero unauthorized approvals; exactly one terminal claim; exactly one provider effect or durable `ambiguous` state; approved snapshot hash equals executed snapshot hash.
- **required proof tier:** database concurrency proof, provider-backed effect packet, canonical browser/SMS approval packet.
- **completion definition:** every consequential action proves who requested, who authorized, under which assignment/policy, what exact action was approved, and what provider effect occurred.

### REM-P0-04 — Make signed links and sessions revocable relationship leases
- **finding IDs:** GAP-P0-003, GAP-P0-004, GAP-P1-006
- **phase:** P0-D — human credential hardening
- **owner role:** identity/security engineer
- **files/components:** `owner_web_sessions`, `preview_links`, artifact links, claim tokens, signed token claims, web API proxies.
- **design change:** Bind links/sessions to human principal, assignment, audience, action set, policy version, nonce/JTI, session version, and current relationship. Add explicit revoked/consumed/claim state. Resolve and claim in one RPC. Use short-lived action credentials and step-up for money/accounting/customer sends.
- **migration impact:** add session/link version and revocation fields; invalidate all legacy action links; retain legacy artifact read links only if scoped and read-only.
- **dependency:** REM-P0-01 through REM-P0-03.
- **rollback:** disable signed actions and require authenticated web review; no rollback to post-effect consumption.
- **test-first sequence:** forged token, wrong purpose, wrong employee, wrong assignment, wrong principal, revoked relationship, role downgrade, expired token, consumed token, two concurrent claims, session theft and rotation.
- **pass/fail threshold:** 100% denial of invalid/revoked/replayed credentials; one atomic claim per action; session revocation SLA under 60 seconds.
- **required proof tier:** real-Supabase plus canonical browser/mobile review packet.
- **completion definition:** possession of a token is never sufficient without a current authorized relationship, and terminal use is atomic.

## 3. P1 launch gate

### REM-P1-05 — Eliminate the global Manager authority bypass
- **finding IDs:** GAP-P1-005, GAP-P0-003
- **phase:** P1-A — service identity convergence
- **owner role:** infrastructure security engineer
- **files/components:** `/manager/tools/:name`, front-door/orchestrator calls, scheduler calls, MCP route, internal service authentication.
- **design change:** Remove direct arbitrary tool invocation or require a signed short-lived service principal token with issuer, audience, service identity, actor class, assignment/capability scope, request hash, nonce, and expiration. Owner approval resolution must never be accepted from a service token unless the stored principal-bound resolution already exists.
- **migration impact:** service-principal/credential tables and audit actor fields.
- **dependency:** P0 relationship and approval context.
- **rollback:** disable legacy route; callers fail closed and queue retryable work.
- **test-first sequence:** leaked token, wrong audience, wrong capability, caller-supplied IDs, replay, expired token, owner-actor spoof.
- **pass/fail threshold:** no global credential can act across assignments; all service calls have immutable actor provenance.
- **required proof tier:** source/security tests plus production network packet.
- **completion definition:** MCP, scheduler, provider processors, and web use one scoped authorization model.

### REM-P1-06 — Transactionalize account creation, phone ownership, and claim consumption
- **finding IDs:** GAP-P1-007
- **phase:** P1-B — identity saga
- **owner role:** identity/database engineer
- **files/components:** identity tool, claim route, Auth integration, onboarding sessions, verified phones, owner sessions, repair commands.
- **design change:** Create a durable onboarding command/saga with idempotency key and explicit states. Use one database RPC for local account/user/membership/phone/assignment creation. Treat Auth as an external effect with receipt and compensation/reconciliation. Claim tokens and phone ownership use conditional transitions and unique constraints.
- **migration impact:** onboarding command/effect tables; uniqueness and terminal-state constraints; repair queue.
- **dependency:** REM-P0-01.
- **rollback:** stop onboarding at retryable/repair-required state; no partial success response.
- **test-first sequence:** duplicate submit, simultaneous claim, Auth timeout, Auth success/DB failure, DB success/session failure, existing email, existing phone, retry after every fault, repair replay.
- **pass/fail threshold:** one account graph per intent; zero orphan untracked Auth users; every partial state has deterministic retry or compensation.
- **required proof tier:** real Auth + real Supabase canonical onboarding packet.
- **completion definition:** onboarding can be retried after any crash without duplicate identity or manual database surgery.

### REM-P1-07 — Build durable gateway budgets, rate limits, usage settlement, and provider idempotency
- **finding IDs:** GAP-P1-008, GAP-P1-017
- **phase:** P1-C — runtime accounting boundary
- **owner role:** distributed-systems/billing engineer
- **files/components:** model gateway, usage audit, meter events, billing ledger, provider proxy, credential policy.
- **design change:** Replace process map with database/Redis-compatible durable token bucket or reservation ledger; reserve spend before provider call; settle actual usage after receipt; release/mark ambiguous on failure; enforce assignment/payer budget; require usage receipt persistence before success; propagate provider idempotency keys where supported and classify unsupported ambiguity.
- **migration impact:** budget accounts, reservations, settlements, provider receipt IDs, immutable usage ledger, assignment/payer foreign keys.
- **dependency:** REM-P0-01 and commercial relationship model.
- **rollback:** fail closed at gateway and use provider dashboard manually; never bypass budget/audit persistence.
- **test-first sequence:** parallel limit race, process restart, multiple replicas, budget boundary, audit DB outage, provider timeout before/after acceptance, malformed usage, duplicate request, credential rotation.
- **pass/fail threshold:** no spend beyond configured tolerance; no successful response without durable receipt; ledger reconciles provider totals within declared rounding threshold.
- **required proof tier:** real provider and live billing reconciliation packet.
- **completion definition:** rate, spend, cost, provider receipt, assignment, payer, and work correlation remain correct across reboot and retry.

### REM-P1-08 — Fail closed on context claims and stabilize human intent IDs
- **finding IDs:** GAP-P1-009, GAP-P1-010
- **phase:** P1-D — turn/context determinism
- **owner role:** runtime reliability engineer
- **files/components:** agent context primer, owner web/SMS turn ingress, turn queue, drain/reaper, runtime session rotation, work materialization.
- **design change:** Primer claim failure returns retryable unavailable and never mutates context. Browser/SMS/API clients supply stable intent IDs; server persists a command receipt before execution. Turn, provider calls, materialization, and reply use one correlation/causation chain.
- **migration impact:** intent/command receipt fields, context version/claim state, unique assignment-scoped idempotency keys.
- **dependency:** assignment context.
- **rollback:** queue intent without execution; surface delayed/retry state.
- **test-first sequence:** DB timeout, duplicate primer, session rotation, double submit, lost HTTP response, browser reconnect, queued older turn, worker crash, downstream timeout.
- **pass/fail threshold:** one primer per transcript version; one turn/effect chain per intent; deterministic replay response.
- **required proof tier:** integration plus live browser/runtime reboot packet.
- **completion definition:** owner intent and employee context converge under retry without duplication or silent loss.

### REM-P1-09 — Assignment-scope every connector and provider ingress path
- **finding IDs:** GAP-P1-011, GAP-P0-002
- **phase:** P1-E — provider custody
- **owner role:** connector/security engineer
- **files/components:** Gmail, Twilio, Stripe, QuickBooks adapters; ambient inbox; connector accounts/tokens; verified phones; channel router; memory writes.
- **design change:** Provider installation and subject binding point to assignment/resource grant. Ingress first verifies provider signature, then resolves provider subject to one authorized assignment or durable waiting-for-binding state. Connector reads/writes and memory ingestion use assignment partition. Outbound effects verify current custody and authority.
- **migration impact:** assignment connector installations, provider subject bindings, custody grant IDs, ambient assignment ID, assignment-scoped uniqueness.
- **dependency:** REM-P0-01/P0-02.
- **rollback:** stop ambiguous provider events in waiting/dead-letter; never fall back to account-wide binding.
- **test-first sequence:** same employee with two Gmail/QBO assignments, wrong Twilio sender, moved connector, revoked grant, duplicate webhook, out-of-order event, provider replay, ambiguous binding.
- **pass/fail threshold:** zero cross-assignment data/effects; every event has verified provider and resolved assignment before processing.
- **required proof tier:** real provider packet for each launch connector.
- **completion definition:** connector custody is explicit, revocable, and auditable independently of employee ownership.

### REM-P1-10 — Apply and prove the production schema
- **finding IDs:** GAP-P1-012
- **phase:** P1-F — deployment database gate
- **owner role:** release/database operator
- **files/components:** migrations 0032 onward plus new remediation migrations; verifier; staging/production Supabase; rollback runbook.
- **design change:** Use an immutable release migration manifest, preflight checks, backup, lock/time budget, grant/RLS/RPC verifier, and post-deploy application compatibility check.
- **migration impact:** all pending and remediation migrations; no destructive test without operator authorization.
- **dependency:** schema design and tests complete.
- **rollback:** compensating migration or release rollback with disabled new code path; backup/restore rehearsal required.
- **test-first sequence:** blank DB, production snapshot clone, rerun idempotency, lock contention, partial migration, grant drift, RLS denial, rollback rehearsal.
- **pass/fail threshold:** exact migration ledger and verifier pass on staging Supabase; production packet bound to release SHA.
- **required proof tier:** deployed release-bound database proof.
- **completion definition:** production schema and executable source are the same release state.

### REM-P1-11 — Replace narrow CI with a product-wide release gate
- **finding IDs:** GAP-P1-013, GAP-P1-014, GAP-P1-015
- **phase:** P1-G — release engineering
- **owner role:** release/quality engineer
- **files/components:** GitHub workflows, workspace scripts, ESLint config, tests, proof manifest, release ledger.
- **design change:** Required jobs: dependency integrity; shared/db/Manager/web/agent-template typecheck/build; real TypeScript lint; full unit; integration; migration/RLS/relationship matrix; concurrency/fault tests; production images; browser fixture-free smoke; static proof-manifest validation. Live/destructive gates remain manually authorized but must be attached before production promotion.
- **migration impact:** none directly.
- **dependency:** P0/P1 test suites.
- **rollback:** workflow changes can revert, but production promotion remains disabled until equivalent evidence exists.
- **test-first sequence:** seed deliberate failures in web compile, lint, assignment RLS, approval race, unknown protocol version, and missing proof artifact; verify each blocks status.
- **pass/fail threshold:** every active launch component is required and branch-protected; no skipped hard gate; artifacts include head SHA and digest.
- **required proof tier:** CI/release-bound artifacts plus human-authorized live packet.
- **completion definition:** a green release status means the entire approved launch tier, not one backend slice.

### REM-P1-12 — Version every consequential protocol
- **finding IDs:** GAP-P1-015
- **phase:** P1-H — compatibility boundary
- **owner role:** protocol architect
- **files/components:** shared envelopes, DB JSON payloads, approvals, assignments, ambient events, commands, profile packages, tool results, memory resources, billing records.
- **design change:** Canonical envelope fields: protocol name/version, schema version, producer, assignment, correlation/causation, created time, compatibility range, and payload hash. Unknown major versions reject; supported old versions upcast deterministically and retain original payload/hash.
- **migration impact:** version columns/defaults/checks and backfill provenance.
- **dependency:** canonical relationship and command schemas.
- **rollback:** continue old reader in compatibility window; never reinterpret unknown versions.
- **test-first sequence:** old/new producer-consumer matrix, unknown major, malformed payload, replay after upgrade, rolling deploy, deterministic upcast hash.
- **pass/fail threshold:** 100% consequential rows/envelopes versioned; unknown versions fail closed with repair visibility.
- **required proof tier:** compatibility integration and rolling-deploy packet.
- **completion definition:** replayed work cannot silently acquire new semantics.

### REM-P1-13 — Authenticate platform administrators independently
- **finding IDs:** GAP-P1-016
- **phase:** P1-I — operator security
- **owner role:** platform security engineer
- **files/components:** admin proxy, Manager admin routes, platform users/roles, support sessions, sensitive lifecycle/billing/credential actions.
- **design change:** Platform login/session or signed service identity with MFA/step-up, audience, role, session version, expiration, and device/risk metadata. Remove caller-selected identity header as authentication. Enforce active support-access lease on customer data access. Separate readonly, security, billing, operator, and owner actions at route and query level.
- **migration impact:** platform sessions, MFA/step-up records, support lease binding, immutable admin event chain.
- **dependency:** none for authentication; assignment model for customer-resource scope.
- **rollback:** disable admin writes and retain emergency break-glass with offline approval/audit.
- **test-first sequence:** header spoof, session theft, role downgrade, disabled admin, expired support lease, missing reason, readonly write, step-up absence, break-glass audit.
- **pass/fail threshold:** no admin action without independently authenticated actor and minimum role; every customer access has reason/lease/audit.
- **required proof tier:** security integration and production admin-auth packet.
- **completion definition:** shared Manager credentials cannot impersonate a platform user.

### REM-P1-14 — Implement labor-native commercial attribution
- **finding IDs:** GAP-P1-017, GAP-P2-018
- **phase:** P1-J — paid-launch accounting
- **owner role:** billing/product infrastructure engineer
- **files/components:** relationship schema, entitlements, usage/meter events, model gateway ledger, subscription/invoice integration, admin billing view.
- **design change:** Separate entitlement decision, runtime budget, provider cost, labor unit/outcome, payer, beneficiary, employee, assignment, plan/rate, credit/refund, and invoice line. Policy evaluation is versioned and fail-closed for paid limits.
- **migration impact:** labor ledger, rate plans, entitlement policy versions, invoice attribution, reconciliation status.
- **dependency:** REM-P0-01 and REM-P1-07.
- **rollback:** restrict launch to free/internal tier; paid work disabled if reconciliation fails.
- **test-first sequence:** separate payer/beneficiary, shared employee, free allowance, paid overage, plan change, suspension, refund, duplicate usage, provider correction, invoice retry.
- **pass/fail threshold:** every billable provider/work event reconciles to one assignment and payer; invoice/provider ledger difference within declared rounding tolerance; deny policy actually denies.
- **required proof tier:** provider, billing, and paid-pilot commercial packet.
- **completion definition:** paid managed labor can be audited from approved work through provider cost and customer invoice.

## 4. P2 pre-scale work

### REM-P2-15 — Build role-aware workforce and repair surfaces
- **finding IDs:** GAP-P2-019, GAP-P2-021
- **phase:** P2-A
- **owner role:** product infrastructure/frontend lead
- **files/components:** dashboard, employee surface, stream projection, admin readiness, repair queue, runtime health.
- **design change:** Workforce selector; assignment/role projection; pending authority; cost/budget; provider receipt; repair/ambiguous/dead-letter state; audit timeline; accessible lean-operator defaults.
- **migration impact:** projection/read models only after relationship schema.
- **dependency:** P0/P1 relationship and proof envelopes.
- **rollback:** read-only legacy surface; no broadened access.
- **test-first sequence:** role snapshots, empty/degraded states, ambiguous effect, revoked assignment, multiple employees, mobile review.
- **pass/fail threshold:** users see only authorized assignments and can identify required decision, cost, proof, and repair path without operator intervention.
- **required proof tier:** canonical browser packet and moderated operator test.
- **completion definition:** ordinary operators do not need IDs, infrastructure vocabulary, or support to understand work state.

### REM-P2-16 — Separate workers and prove observability/recovery
- **finding IDs:** GAP-P2-021
- **phase:** P2-B
- **owner role:** SRE/platform engineer
- **files/components:** reconciler, ambient worker, turn drain, deployment compose/images, metrics/alerts/runbooks.
- **design change:** Independent worker processes or durable scheduled workers with leader/lease semantics; queue depth, age, attempts, dead letters, ambiguous effects, budget failures, and drift metrics; SLOs and alerts.
- **migration impact:** worker heartbeat/lease/metric records as needed.
- **dependency:** stable P1 queues and commands.
- **rollback:** scale workers to one; Manager remains API-only.
- **test-first sequence:** kill -9, rolling restart, two workers, stalled provider, DB outage, queue surge, alert delivery, repair replay.
- **pass/fail threshold:** no lost work; bounded duplicate claims; alerts within SLO; backlog drains after recovery.
- **required proof tier:** production-like plus authorized live recovery packet.
- **completion definition:** API deployment and worker execution have independent blast radius and observable liveness.

### REM-P2-17 — Enforce claim discipline and remove estimator ambiguity
- **finding IDs:** GAP-P2-020, GAP-P2-023
- **phase:** P2-C
- **owner role:** product/legal/release owner
- **files/components:** public pages, pricing, README, GTM docs, estimator routes/deploy scripts, claim registry.
- **design change:** Every external claim references evidence tier and proof ID. Remove absolute claims until live. Label estimator as non-canonical tool or remove it from primary funnel. Separate estimator metrics/tests/releases from employee acceptance.
- **migration impact:** none.
- **dependency:** release-state ledger.
- **rollback:** conservative static copy.
- **test-first sequence:** automated scan for banned absolute/state claims; broken/missing proof reference; estimator artifact entering employee proof manifest.
- **pass/fail threshold:** zero unsupported public claims; zero estimator evidence counted as employee acceptance.
- **required proof tier:** release/content audit and approved commercial packet.
- **completion definition:** public language cannot exceed the strongest release-bound evidence.

### REM-P2-18 — Reconcile active operational documents automatically
- **finding IDs:** GAP-P2-022
- **phase:** P2-D
- **owner role:** release/documentation engineer
- **files/components:** `CLAUDE.md`, `AGENTS.md`, codegraphs, memory index, PR body template, runbooks.
- **design change:** Generate a single release-state block from branch/head, migration ledger, CI runs, live proof IDs, and standard revision. Add stale-head/status check in CI. Human-authored guidance links to generated state instead of duplicating it.
- **migration impact:** none.
- **dependency:** release ledger.
- **rollback:** fail docs check and require manual correction.
- **test-first sequence:** stale SHA, stale migration number, unapproved standard, missing proof, contradictory deployment state.
- **pass/fail threshold:** all canonical active docs report identical head/migration/proof/status.
- **required proof tier:** CI artifact.
- **completion definition:** agents and operators cannot read contradictory canonical status.

## 5. P3/P4 roadmap

### REM-P3-19 — Canonical generic materialization engine
- **finding IDs:** GAP-P3-024
- **phase:** P3-A
- **owner role:** protocol/frontend architect
- **files/components:** materialization, SurfaceEnvelope/WorkResource/WorkAction schemas, web renderers, MCP UI.
- **design change:** Schema-driven safe generic work objects with role projection, action gates, proof, lifecycle, and fallback renderer.
- **migration impact:** versioned materialized work tables/resources.
- **dependency:** assignment and approval protocols.
- **rollback:** render read-only JSON summary; disable actions.
- **test-first sequence:** arbitrary valid schema, invalid/recursive/oversized schema, secret injection, unsafe action expansion, role projection.
- **pass/fail threshold:** launch tool set materializes without bespoke security logic and cannot widen action scope.
- **required proof tier:** provider-backed work-object packet.
- **completion definition:** long-tail tools produce inspectable governed work through one protocol.

### REM-P3-20 — Multimodal continuity and voice
- **finding IDs:** GAP-P3-025
- **phase:** P3-B
- **owner role:** channel/runtime lead
- **files/components:** channel envelope/router, identity resolution, consent, voice provider, transcript/memory projection.
- **design change:** Same assignment/work state across web/SMS/voice; channel-specific identity strength and authority; consent and transcript retention policy.
- **migration impact:** channel identities, consent, transcript/work-event links.
- **dependency:** relationship graph and turn protocol.
- **rollback:** web/SMS only.
- **test-first sequence:** channel handoff, duplicate event, wrong caller, revoked number, partial transcript, approval escalation.
- **pass/fail threshold:** no cross-assignment context; consistent work state and proof across authorized channels.
- **required proof tier:** live multi-channel packet.
- **completion definition:** voice is a governed projection of the employee, not a separate agent.

### REM-P3-21 — Delegation and workforce collaboration
- **finding IDs:** GAP-P3-026
- **phase:** P3-C
- **owner role:** workforce protocol architect
- **files/components:** delegation commands, context subset, authority inheritance, work objects, receipts, billing split.
- **design change:** Explicit initiating/delegated assignments, task boundary, context subset, non-inherited authority by default, separate runs/receipts, final accountable employee/supervisor.
- **migration impact:** delegation relationships and work links.
- **dependency:** complete relationship, approval, billing, and materialization protocols.
- **rollback:** disable delegation; supervisor performs handoff manually.
- **test-first sequence:** secret/connector non-transfer, revoked delegation, circular delegation, partial failure, conflicting outputs, billing split.
- **pass/fail threshold:** no implicit authority/resource transfer and complete provenance.
- **required proof tier:** integration and controlled live workforce packet.
- **completion definition:** collaboration does not collapse employee identities or assignments.

### REM-P3-22 — Durable REVP registry and release evaluator
- **finding IDs:** GAP-P3-027, GAP-P4-028, GAP-P4-029
- **phase:** P3-D/P4 research governance
- **owner role:** research/release lead
- **files/components:** database experiment/vector registry, proof artifacts, CI evaluator, research docs, claim registry.
- **design change:** Store requirement, vector, state, metric, threshold, evidence, confidence, release, baseline, owner, decision, and hard-gate status. Research features remain disabled/qualified until vectors pass.
- **migration impact:** experiment/vector/evidence/decision tables.
- **dependency:** release ledger and claim registry.
- **rollback:** mark vector unknown and remove claim/feature from release.
- **test-first sequence:** missing baseline, failed hard gate, stale evidence, cross-release evidence reuse, changed metric, unsupported claim.
- **pass/fail threshold:** every research/commercial claim has a current release-bound vector set; hard-gate fail always blocks.
- **required proof tier:** research validation plus market proof where applicable.
- **completion definition:** HRR, generative UI, labor displacement, and market value cannot move from hypothesis to product claim without recorded evidence.

## 6. Dependency-ordered phase plan

| Order | Gate | Required outputs | Blocks |
|---:|---|---|---|
| 0 | Freeze and baseline | Approved standard identity, audited source SHA, schema/data inventory, failing relationship/approval tests | All work |
| 1 | P0-A ontology | Relationship tables, backfill, shared contracts | Authorization, connectors, billing |
| 2 | P0-B isolation | Assignment-aware RLS/routes/projections/SMS | Any multi-user/employee use |
| 3 | P0-C authority | Principal-bound approval command/effect protocol | Money/customer/accounting actions |
| 4 | P0-D human credentials | Revocable sessions/links and atomic claims | Browser/SMS approvals |
| 5 | P1 service/identity | Scoped service principals and onboarding saga | Safe canonical onboarding/tooling |
| 6 | P1 runtime determinism | Durable gateway accounting, intent/context idempotency | Provider-backed labor |
| 7 | P1 provider custody | Assignment connector bindings and ingress | Gmail/Twilio/Stripe/QBO launch |
| 8 | P1 commercial ledger | Payer/beneficiary/cost/outcome attribution | Paid $400 managed workforce |
| 9 | P1 deployment | Real Supabase, full CI, version compatibility, admin auth | Production promotion |
| 10 | Live proof | Relationship matrix and all applicable manifest phases | Any live claim |
| 11 | P2 scale | Workforce UX, independent workers, observability, claim/docs discipline | Scale beyond controlled pilots |
| 12 | P3/P4 | Generic materialization, voice, delegation, research registry | Future tiers/claims |

### Initial conforming launch scope

The first release should explicitly prohibit cross-organization sharing, marketplace access, voice, and cross-employee delegation. It should support:

- one organization with one account;
- multiple users and multiple employees;
- explicit user/role-to-employee assignments;
- one assignment-scoped memory and connector partition per employee/account engagement;
- web and SMS;
- one provider-backed generated work-object slice;
- principal-bound approvals;
- durable model/provider accounting;
- manual customer invoicing only until REM-P1-14 passes.

This scope reduction does not waive P0/P1. It removes future relationship types while retaining the core graph.

## 7. Validation and live-proof plan

### Required release packets

1. **Source packet:** exact head SHA, dependency lock digest, shared/db/Manager/web/agent-template builds, TypeScript lint, full unit/integration results.
2. **Database packet:** migration ledger, Supabase project ref redacted, RLS/grants/functions/check constraints, backfill counts, relationship matrix, rollback rehearsal.
3. **Identity/authority packet:** multiple employees, multiple users, user in multiple accounts, cross-account denial, cross-employee denial, authorized shared access where enabled, assignment memory/connector isolation, role-specific approval, payer/beneficiary/owner/user separation.
4. **Concurrency packet:** approval/link 100-way race, phone/claim race, budget race, turn duplicate, provider timeout-after-accept, worker lease/reboot, dead-letter replay.
5. **Runtime packet:** scoped MCP/model credentials, wrong-employee denial, revocation/rotation, restart persistence, budget/rate enforcement, provider receipt and usage settlement.
6. **Provider packet:** real launch connectors only; verified webhook, duplicate, ordering, retry, dead letter, replay, wrong assignment, revoked binding, effect receipt.
7. **Browser/SMS packet:** fixture-free canonical onboarding, owner session, multiple employee selection, role projection, signed review, approval, work object, repair state.
8. **Operations packet:** worker kill/restart, backlog drain, drift/compensation, backup/restore, red-health alert, admin authentication, support lease/audit.
9. **Commercial packet:** payer/beneficiary attribution, provider cost reconciliation, entitlement denial, invoice linkage, paid pilot result, labor baseline and retained human authority.

### Hard pass/fail thresholds

- Unauthorized cross-account, cross-employee, cross-assignment, or wrong-role access/action: **0 allowed**.
- Approval or provider effect under duplicate/concurrent replay: **exactly one committed effect or one durable ambiguous state; never two effects**.
- Successful provider/runtime response without durable receipt/correlation: **0 allowed**.
- Active work without valid assignment or explicit system context: **0 rows**.
- Revoked assignment/session/role access after SLA: **0 allowed after 60 seconds** for initial tier.
- Budget overshoot caused by concurrency/restart: **0 beyond declared provider rounding/in-flight reservation tolerance**.
- Unknown consequential protocol version accepted: **0**.
- Release packet missing a required hard-gate artifact: **release blocked**.
- Real Supabase relationship matrix failure: **release blocked regardless CI PostgreSQL result**.
- Public/commercial claim without current proof ID: **claim blocked**.

### Evidence-state progression

`theory -> implementation -> validation -> deployment -> market`

A phase may move only when its own metric and threshold pass. No score or aggregate can override authority, isolation, privacy, accounting, deployment, or evidence hard gates. All artifacts must bind head SHA, environment, timestamp, tool/script version, redaction status, and digest.

### Stop condition

Human review is required after these audit documents. No remediation implementation, migration, deployment, destructive proof, or standard amendment is authorized by this plan.
