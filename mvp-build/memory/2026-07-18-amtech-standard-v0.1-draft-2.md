# 2026-07-18 — AMTECH Standard v0.1 Draft 2

Status: Phase 1 standard extraction complete as a proposed draft; human approval pending; Phase 2 not started

Branch: `employee-work`, based on `research`

Draft PR: `#19` into `research`

`main` was not edited.

## Objective

Extract the implicit and explicit AMTECH AI Employee standards into one publishable contract before performing a severity-ranked codebase audit.

The first draft was corrected after the human operator clarified that AMTECH is not a singleton owner/account/employee system. The standard must support multi-user organizations, multiple employees per account, users across accounts, and employees shared with accounts or users that do not own them.

## Grounding read

Read the six newest summaries in `memory/MEMORY.md`:

1. `2026-07-17-employee-work-production-boundary-reconciler-pass.md`;
2. `2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md`;
3. `2026-07-17-website-framework-phase-1-closure.md`;
4. `2026-07-17-holographic-website-framework-v0.1.md`;
5. `2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md`;
6. `2026-07-16-ws1-ws2-production-boundary-pass.md`.

Read the two newest full handoffs:

- `2026-07-17-employee-work-production-boundary-reconciler-pass.md`;
- `2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md`.

Also read the full website-framework Phase 1 and holographic-framework handoffs because they contain the HRR/VSA, deterministic benchmark, evidence-class, baseline-comparison, privacy, and pass/fail-vector discipline required by the operator's clarification.

## Standard produced

Updated:

- `mvp-build/STANDARD.md`

Current document commit:

- `055f4fe0dff161e65170b42b703bffeb6f4cdf20`

## Major contracts added or corrected

### Relationship ontology

The standard now separates:

- organization;
- account;
- human user;
- AI employee;
- employee ownership/employment;
- assignment or engagement;
- access grant;
- approval authority;
- resource ownership and custody;
- payer and beneficiary.

The current `account_id + employee_id` scope is treated as a v0.1 assignment approximation, not the permanent ontology.

### Multi-employee and shared-employee operation

The standard requires:

- multiple employees per account or organization;
- per-employee concurrency and isolation;
- explicit shared/fractional employee grants;
- assignment-partitioned memory and connectors;
- cross-employee delegation with bounded context and authority;
- tests for both unauthorized cross-account denial and authorized shared-employee access without leakage.

### Research and plan auditing

Added a Research, Experimentation, and Plan Validation Protocol with:

- atomic claim decomposition;
- default validation vector dimensions;
- required/optional/not-applicable classification;
- pass/fail/unknown/blocked states;
- hard-gate pass equation;
- separate theory, implementation, validation, deployment, and market vectors;
- explicit evidence classes;
- threshold provenance;
- negative-result retention;
- HRR/VSA and vector-system baseline comparison;
- deterministic fixtures and output hashing;
- privacy and uncertainty fallbacks;
- research-to-production gates.

### Billing and monetization

Added a Commercial, Billing, and Monetization Protocol that separates billing from authorization and supports:

- payer/beneficiary separation;
- managed employee and workforce pricing;
- task-based and work-object billing;
- usage and provider costs;
- experimental pricing policies;
- labor-displacement measurement;
- prohibition on unsupported hours-saved, revenue, or replacement claims.

### Deployment integrity

The standard preserves the current source/CI/live distinction and adds required live matrices for:

- unauthorized cross-employee and cross-account denial;
- authorized shared-employee access;
- assignment-memory isolation;
- relationship-aware Supabase/RLS behavior;
- relationship and billing attribution on provider-backed work objects.

## Validation performed

Documentation/source inspection only.

Verified through GitHub that `mvp-build/STANDARD.md` contains:

- the proposed/unapproved status;
- six-handoff summary grounding and two-full-handoff grounding;
- multi-organization/account/user/employee relationship clauses;
- shared employee and assignment isolation clauses;
- commercial/billing protocol;
- validation-vector and HRR/VSA research protocol;
- Phase 2 approval gate.

No build, typecheck, lint, unit test, integration test, migration apply, Docker build, deployment, provider call, browser onboarding, or live proof was run for this docs-only extraction.

## Current production status remains unchanged

The production-boundary source remains CI-accepted at the previously documented source head, but production Supabase still stops at `0031_public_estimator.sql`. No live migration, runtime, provider, browser, shared-employee, commercial, or generated-work-object acceptance is claimed.

## Next concrete move

1. Human operator reviews and edits `mvp-build/STANDARD.md`.
2. Human operator explicitly approves the standard revision and commit.
3. Only after approval, begin Phase 2 and produce `GAPS.md` and `REMEDIATION.md` against the approved clause set.
