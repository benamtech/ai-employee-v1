# AMTECH Phase 2 Systemic Root-Cause Analysis

Date: 2026-07-18  
Scope: all 29 findings in `GAPS.md`  
Status: analysis only; no finding is closed

## Correction

The commits after `571ab08bbf7c84071ee97da1a71d89027618597f` are an unvalidated architecture spike, not accepted remediation. Migrations `0039` and `0040` have not been applied or behaviorally tested. The added assignment test mainly checks source text with `readFile(...).toContain(...)`; it does not prove schema correctness, RLS isolation, concurrency, compatibility, or runtime behavior. Do not deploy or apply the spike.

validation-vector((pass-vector: remediation begins with a failing behavioral invariant test and declared evidence tier)(fail-vector: source shape, tables, fields, or helper names are credited as closure))

## Issue classes

- **Bug:** implemented behavior violates an existing invariant.
- **Feature gap:** required capability is absent.
- **Architecture defect:** shared structure or domain boundaries make several requirements impossible or unsafe.
- **Design-pattern defect:** a reusable mechanism for authority, state, concurrency, retry, or compatibility is missing or misapplied.
- **Verification defect:** CI, proof, deployment, or status controls cannot detect or represent product truth.
- **Product debt:** an alternate path or claim redirects work away from the canonical employee product.
- **Research hypothesis:** an unvalidated method or market claim, not an implementation fact.

## Seven systemic causes

### RC-1: Domain semantic collapse

`account_id` and `employee_id` carry tenant, employer, owner, access, assignment, custody, payer, beneficiary, memory, billing, and execution meanings.

Primary findings: P0-001, P0-002, P1-011, P1-017, P2-019, P3-026, P4-029.

This is not primarily a database task. First define account, organization, employee principal, assignment, resource custody, payer, beneficiary, supervisor, and allowed launch relationships in an approved domain ADR.

### RC-2: Bearer possession is treated as authority

Account membership, verified phone, signed link, owner session, shared Manager token, and caller-selected admin header repeatedly become authorization.

Primary findings: P0-002, P0-003, P1-005, P1-006, P1-016.

Required boundary: authenticated principal/service + assignment/platform context + resource + action + current relationship + policy version + decision evidence.

### RC-3: Request/response code is acting as a workflow engine

Several flows assume a request can read state, call a provider, write success, and return a trustworthy result despite retries, concurrent requests, process death, and uncertain provider acceptance.

Primary findings: P0-004, P1-007, P1-008, P1-009, P1-010, P2-021.

Required kernel: stable intent ID, immutable command, atomic claim, recorded attempt, provider-specific idempotency where available, durable receipt or explicit ambiguous state, reconciliation, and deterministic replay.

### RC-4: Feature-local protocols

Assignments, approvals, events, turns, work objects, sessions, and billing independently choose versions, actors, IDs, statuses, and correlation semantics.

Primary findings: P1-015, P3-024, P3-025, P3-026, P3-027.

Required boundary: one minimal consequential envelope with protocol/schema version, producer, actor, assignment/platform context, intent/command ID, correlation/causation, policy version, time, and payload hash. Unknown major versions fail closed.

### RC-5: Evidence-state conflation

Source, focused CI, deployed schema, provider acceptance, browser acceptance, runtime recovery, commercial proof, and public claims are documented as different states but are not enforced as different release gates.

Primary findings: P1-012, P1-013, P1-014, P2-020, P2-022. Related: P2-023, P3-027, P4-028, P4-029.

Required boundary: immutable SHA/digest-bound evidence. Missing required evidence blocks promotion.

### RC-6: Product model and implementation model diverged

The product promises governed persistent labor while prominent implementation and funnel paths still behave as a single-owner SaaS agent or estimator.

Primary findings: P0-001, P1-017, P2-019, P2-023, P4-029.

### RC-7: Operational concentration and fail-open pressure

Manager combines broad API, admin, gateway, orchestration, and worker responsibilities. This encourages shared credentials, in-process loops, fail-open behavior, and narrow release checks.

Primary findings: P1-005, P1-009, P2-021. This does not prove a microservice rewrite is appropriate; separate process roles around one durable execution kernel are the likely first experiment.

## Finding classification

| Findings | Primary class |
|---|---|
| P0-001, P0-002, P0-003, P1-011, P1-017 | Architecture defects |
| P0-004, P1-005, P1-006, P1-009, P1-010, P1-016, P2-018 | Runtime/security bugs |
| P1-007, P1-008, P1-015 | Design-pattern/protocol defects |
| P1-012, P1-013, P1-014, P2-020, P2-022 | Verification/release defects |
| P2-019, P2-021, P3-024, P3-025, P3-026, P3-027 | Feature or operational gaps with architecture dependencies |
| P2-023 | Product/strategy debt |
| P4-028, P4-029 | Research hypotheses |

## Causal leverage

- P0-001 is upstream of P0-002, P1-011, P1-017, P2-019, P3-026, and P4-029.
- P0-003/P0-004 govern every customer, accounting, and money effect.
- P1-007 can corrupt the identity graph, making correct authorization operate on incomplete identities.
- P1-009/P1-010 create duplicate work that the command/effect kernel must contain.
- P1-015 amplifies replay and rolling-deploy risks everywhere.
- P1-013/P1-014 allow every other defect to escape.
- P2-020/P2-022/P2-023 create a feedback loop that steers engineering toward the wrong path.

## Research applicability

### Relationship/attribute authorization

Use relationship records plus subject/resource/action/environment policy inputs. Do not build a globally distributed Zanzibar clone for the initial same-organization launch.

applicable-ness-vector((applies: consistent assignment/resource authorization across DB, web, SMS, connectors, runtime, and admin)(avoid: generic authorization platform before launch roles stabilize)(confidence: high for the model, medium for implementation shape))

### Idempotency and atomic claims

Use stable client intent IDs, uniqueness/CAS/locks, and deterministic replay. A local database claim cannot guarantee exactly-once external effects.

applicable-ness-vector((applies: approvals, claims, turns, onboarding, budgets, provider effects)(avoid: content hashes as universal intent identity)(confidence: high))

### Saga/orchestration

Use only for operations spanning independent transactional systems, such as Auth plus local identity or local command plus provider. Keep ordinary single-database work in ACID transactions.

applicable-ness-vector((applies: partial external/local commit and compensation/repair)(avoid: turning every function into a workflow)(confidence: high for onboarding/provisioning))

### Provider capability matrix

Stripe and QuickBooks expose native idempotency mechanisms. Gmail send does not document an idempotency key. Twilio event delivery is at-least-once and requires consumer deduplication. Define each operation as native-idempotent, queryable-receipt, dedupe-only, or non-idempotent/unknown.

applicable-ness-vector((applies: effect retry and receipt rules)(avoid: one generic retry policy for all connectors)(confidence: high for Stripe/QBO/Twilio ingress, medium for Gmail and Twilio outbound))

### Release provenance

Use build provenance plus a separate deployment/runtime/provider/commercial ledger. Build provenance does not prove live employee behavior.

applicable-ness-vector((applies: preventing source/CI from becoming live status)(avoid: treating stronger build attestations as operational acceptance)(confidence: high))

## Aggressive unknown space

Before architecture approval, resolve or explicitly defer:

- exact launch relationship topology;
- account versus organization semantics;
- production row cardinality and ambiguous backfills;
- real Supabase RLS/Auth behavior;
- operation-level provider idempotency and reconciliation;
- Gmail timeout recovery and Twilio outbound duplicate handling;
- session revocation SLA;
- expected concurrency and budget contention;
- commercial labor unit and payer/beneficiary rules;
- voice identity/consent model;
- whether separate worker processes are sufficient;
- inventory of unversioned stored payloads;
- actual branch protection and required CI status settings.

## Revised sequence

1. Quarantine the current spike and correct status language.
2. Approve domain, threat, authorization, command/effect, protocol, and release-state ADRs.
3. Write failing behavioral tests against the audited implementation.
4. Implement one authorization kernel and one command/effect kernel.
5. Prove them on one narrow web-request -> approval -> non-money draft vertical slice.
6. Migrate sessions/links, onboarding, web/SMS intent, connectors, gateway accounting, admin identity, and workers.
7. Build product-wide CI, real Supabase/provider/browser proof, generated status, estimator demotion, and commercial baselines.
8. Implement P3/P4 only as architecture stress tests and registered experiments.

The next code change should be a failing behavioral test or test harness, not another migration.
