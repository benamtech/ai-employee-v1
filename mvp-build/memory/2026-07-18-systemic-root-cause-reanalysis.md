# 2026-07-18 — systemic root-cause reanalysis

Branch: `employee-work` based on `research`; PR #19 remains draft; `main` untouched.

## Correction

The assignment-focused source pass after `571ab08bbf7c84071ee97da1a71d89027618597f` moved into implementation before a full causal model and behavioral test harness existed. Treat migrations `0039`/`0040` and related credential changes as an unvalidated architecture spike. Do not apply, deploy, merge, or claim them as remediation.

The added assignment test is primarily a source-shape test. No current-head CI status, database apply, RLS matrix, concurrency run, provider packet, browser packet, or commercial validation exists.

## Analysis completed

Created `SYSTEMIC-ROOT-CAUSE-ANALYSIS.md`, covering all 29 P0-P4 findings. The findings cluster around seven systemic causes:

1. domain semantic collapse;
2. bearer possession treated as authority;
3. request/response code acting as a workflow engine;
4. feature-local protocols rather than a canonical execution envelope;
5. evidence-state conflation;
6. product-model/implementation-model divergence;
7. operational concentration and fail-open pressure.

The analysis distinguishes bugs, feature gaps, architecture defects, design-pattern defects, verification defects, product debt, and research hypotheses. It also records research applicability vectors and a deliberately aggressive unknown-space register.

## Revised next move

Freeze further remediation implementation. Approve domain/threat/authorization/command-effect/protocol/release-state decisions, then create failing behavioral tests against the audited implementation. The next code change should be a failing behavioral test or harness, not another migration.

## Validation

Repository and research inspection only. No build, typecheck, test, database, deployment, provider, browser, SMS, or destructive validation ran.
