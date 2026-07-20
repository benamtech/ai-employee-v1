# 2026-07-20 — WS-02 Mirror Cabinet hardening and WS-03 frontier

Status: **WS-02 hardened source/CI accepted; live gate open; WS-03 prepared, not started**  
Repository: `benamtech/ai-employee-v1`  
Branch/PR: `agent/ws02-runtime-ui-capability-boundary`, PR `#31`  
Merged base: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
Implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`

## Purpose

Re-audit WS-01/WS-02 before launching database work, reject ancestor-based closure, fix material authority/UX defects, synchronize current repository entrypoints, and prepare a dependency-gated WS-03 P0 frontier without editing the database.

## Mirror Cabinet finding

PR `#31` remained at red head `7736271` even though prior prose cited green ancestor `6f792ea`. The red cause was a deleted canonical connector sentence, but structural review also exposed:

1. owner-visible progress keyed only by employee, allowing cross-assignment live projection;
2. MCP App intents calling native callbacks instead of the first-party protocol-action route;
3. Manager approval/message routes ignoring returned projected authority version;
4. MCP App metadata claiming no network while document CSP did not enforce that claim;
5. final MCP execution interceptor trusting carried policy/version after credential authentication;
6. AG-UI projecting raw internal error messages.

The trajectory was halted before WS-03 implementation and each defect received a focused repair and regression.

## Source changes

- live progress bus and owner-turn runtime now carry account/employee/assignment scope;
- legacy unscoped progress is durable-only and does not broadcast;
- generated Manager stream loads current assignment authority version and scopes every frame;
- MCP App host returns exact authority projection to `WorkCard`;
- `WorkCard` posts finite MCP App actions through `/protocol-action` with stable idempotency keys;
- generated approval/message routes compare returned assignment and authority version with current Manager state;
- MCP App resources include an enforceable deny-by-default document CSP;
- MCP App security metadata rejects external resource domains and permissions;
- AG-UI returns stable public interruption codes;
- final MCP execution re-reads current assignment relationship/policy and authority version;
- connector-backed execution requires current binding and fresh provider-verification evidence;
- generation is de-duplicated at root scripts without reopening the template-hash boundary;
- focused hardening regressions were added.

## Evidence

Implementation head `16dc18e` passed:

- Standard/governance `29735429854`;
- Hermes Upstream Review `29735429873`, pin unchanged;
- Main Integration `29735429859`;
- broad **110 files / 635 tests**;
- source/type/lint/contracts;
- production build;
- repository archaeology;
- compiled Chromium adaptive/product-shell matrices.

No migration, Standard clause, Hermes image, provider pin, or current assertion was weakened.

## Evidence design

A literal Fisher information matrix was impossible because the repository has no empirical likelihood `p(theta)`. An explicit test-design surrogate selected ten trajectories. Spectral result: trace `24.8120`, log determinant `6.0011`, minimum eigenvalue `0.7097`, condition number `10.3449`.

The selected trajectories covered exact-head truth, assignment isolation, final authority revalidation, protocol return paths, UX recovery, OAuth custody/freshness, generation, current documentation routing, migration ledger/RLS isolation, and authority/effect concurrency.

## WS-03 preparation

Created:

- `second-half-plan/2026-07-19-ratified-standard-production-program/17-ws03-p0-fisher-frontier.md`;
- `second-half-plan/2026-07-19-ratified-standard-production-program/18-ws03-p0-task-contract.json`.

Prepared nodes:

1. blank ledger and migration hashes;
2. effective-capability evidence constraints;
3. RLS/grant/security-definer negative isolation;
4. authority-version revocation races;
5. durable command/effect reservation concurrency;
6. existing-row/backfill/rollback compatibility;
7. disposable managed-Supabase trigger proof.

Applied migrations `0001`–`0072` remain immutable. WS-03 must branch from then-current `main` after PR `#31` merges or is formally superseded.

## Documentation organization

Current authority entrypoints were reconciled. Canonical root files were not moved: their exact paths are consumed by governance scripts, contributor read order, and links. Organization is expressed through ownership maps instead of path churn. Historical plans and wiki records were left as historical evidence.

## Remaining risks

- `ISS-011` live connector/provider authorization, health, revocation, staleness, outage, repair, deletion, and external host proof;
- managed secret-manager/KMS acceptance;
- WS-03 database/platform proof;
- target-host isolation/lifecycle;
- fixture-free channels and golden work;
- commercial ambiguity/rates/budgets;
- recovery, signed release, accessibility, capacity, pilot, and production acceptance.

## Next move

Wait for the final documentation head of PR `#31` to pass Standard, Hermes Review, and Main Integration. Then merge or formally supersede it, complete `ISS-011`, and start the guarded WS-03 branch from then-current `main`.
