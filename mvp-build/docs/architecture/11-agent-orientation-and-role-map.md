# 11 — Coding-Agent Orientation and Role Map

Status: **active operating map**  
Updated: 2026-07-20

This file explains role selection after repository authority and computation have been established. It does not replace `AGENTS.md`, `CLAUDE.md`, `CODEGRAPH.md`, `STANDARD.md`, [`../../decision/README.md`](../../decision/README.md), or exact source/evidence.

## Cold-session sequence

```text
identity.md
→ root/scoped contributor rules and CODEGRAPH
→ STANDARD.md
→ decision/README.md and protocol-v1.json
→ production-readiness-program/README.md
→ memory/MEMORY.md and newest relevant handoff
→ architecture index and applicable subsystem docs
→ source, migrations, executable tests, workflows, proof, PR, and diff
→ computed decision record
→ implementation
```

Do not begin from a screenshot, old handoff, PR description, test name, trajectory score, or favored solution.

## One primary role per implementation compression

An exploration frontier may cross roles. The selected implementation transaction names one primary role and explicit dependency interfaces so the patch does not become a second architecture.

| Role | Primary boundary | Must preserve | Required proof |
|---|---|---|---|
| Repository/document authority | stale routing, source/docs reconciliation, archive cleanup | historical integrity; one active program/trace/index; no status promotion | exact files reviewed, source-backed discrepancies, updated routes, proof boundary |
| Shared contracts | schemas, IDs, finite vocabularies, DTOs | one canonical schema/registry; exhaustive consumer parity; migration/compatibility | type/build of consumers, representative contract tests, packed compatibility when applicable |
| Database/authority | principals, assignments, RLS, approvals, effects, commercial state | assignment is scope; current authority at effect time; forward migrations; durable ambiguity; service RPC isolation | blank ledger, concurrency/RLS/revocation matrices, managed proof when required |
| Runtime/network/provisioning | Docker, Caddy, Manager↔Hermes, gateway, lifecycle | Caddy ingress; Host Provisioner Docker authority; employee isolation; scoped credentials; Hermes substrate | image/source inclusion, target-host topology and isolation, teardown/replacement evidence |
| Events/connectors | webhooks, normalization, inbox, retries, dead letters | verify before insert; raw provider content is untrusted; event dedupe differs from effect idempotency; ambiguity is not success | duplicate/order/binding/crash/retry/dead-letter/replay matrix; provider IDs for provider claims |
| Hermes/context/capability | sessions, profiles, memory, MCP, business brain | Manager authority; strict context; static identity vs live state; observed capability is not authority | exact runtime/capability observation, registry/schema parity, persisted effective-capability evidence |
| Owner UI/UX | Web, WorkResource, approvals, signed Review, accessibility | stable operating point; role-safe projection; exact durable IDs; visible fixtures; protocol faults remain faults | compiled browser matrix, keyboard/target/overflow/responsive/reduced-motion/a11y, provider-backed work proof for live claims |
| Reliability/commercial/proof | idempotency, budgets, rate, receipts, accounting, repair | stable identity before effect; reserve before dispatch; accepted receipt before success; conservation; ambiguity/compensation visibility | concurrency/crash matrix, provider/accounting reconciliation, exact proof IDs |
| Deployment/release | migrations, secrets, images, DNS/TLS, rollback, attestation | one frozen SHA/digest set; approved target; backup/rollback; no fixture shortcut | migration/advisor, secrets/rotation, target-host, provider/channel/commercial/recovery/rollback, signed manifest |
| Research/trajectory | emergent capability, cross-lens possibilities | evidence labels; honest assumptions; no mathematical promotion; no production dependency without approved transition | applicable spaces, candidate frontier, computed comparison, selected implementation compression, acceptance predicate |

## Computation obligations by role

Every role uses the same tier system in `decision/README.md`.

- Repository cleanup is not automatically mechanical. Moving authority files, deleting traces, or changing current status is at least `T1`; cross-program cleanup is `T2`.
- Database, security, provider, commercial, durable-effect, and recovery changes are at least `T2`.
- Cross-workstream production or release work is `T3`.
- A truly deterministic one-line correction may be `T0` when authority, invariant, and exact verification are explicit.

Role-specific candidate generation happens only after the shared evidence matrix. A database engineer cannot score architecture feasibility from stale docs; a UX engineer cannot promote a fixture; a trajectory analyst cannot select provider behavior without source evidence.

## Possible-decision spaces

Select only applicable spaces, but consider them independently before recombination:

```text
bug | feature | user | operator | architecture | protocol
commercial | failure | proof | market | weird | constraint
```

Examples:

- Database/authority: race, stale authority, backfill, rollback, operator repair, future shared-assignment use.
- Runtime: namespace reachability, restart, image drift, secret custody, future fleet scaling.
- UI: owner comprehension, interruption/recovery, proof refinding, accessibility, channel convergence.
- Commercial: reservation, settlement, refund, invoice, suspension, abuse, customer trust.
- Research: adjacent use case, architecture mutation, prerequisite wall, false attractor, future failure from a half-fix.

## Mathematics discipline

- Hypergraphs model genuine multi-way dependencies.
- Pairwise edges are preferred when they preserve the relationship.
- Hodge Laplacians require a true simplicial complex.
- Koopman propagation requires repeated comparable trajectories, a fitted operator, held-out error, and residual/diversity control.
- Spectral entropy, separation, occupancy, and redundancy are useful only when reconstructed by a deterministic verifier.
- A computed result is causal only when it changes selection, coverage, feasibility, or implementation compression.

## Implementation and proof discipline

The selected implementation is smaller than the exploration set. It must name:

1. protected invariants;
2. exact files/migrations;
3. selected candidate IDs;
4. rejected high-value alternatives and why;
5. red behavioral proof;
6. affected and broad verification;
7. evidence classes still open;
8. documentation/handoff updates.

Do not create excessive tests for discarded possibilities. Test the selected transaction, the minimum counterexample manifold, and the exact evidence boundary.

## Handoff minimum

A handoff records:

- branch/base/head and migration head;
- decision tier and trace;
- authority/evidence contradictions resolved;
- selected exploration and implementation IDs;
- source/tests/workflows changed;
- exact commands or CI runs and results;
- unestablished evidence classes;
- next safe action and stop conditions.
