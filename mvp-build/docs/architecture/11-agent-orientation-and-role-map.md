# 11 — Coding-Agent Orientation and Role Map

Status: active explanatory map  
Updated: 2026-07-20

This file helps choose an implementation role after authority and decision prerequisites are established. It does not replace root/scoped `AGENTS.md`, `CODEGRAPH.md`, the Standard, the decision protocol, or executable evidence.

## Cold-session route

```text
identity.md
→ root repository contract and routing
→ mvp-build product contract and exact-status CODEGRAPH
→ Standard and ratified amendments
→ decision protocol
→ active program/current transaction
→ exact source, migrations, tests, workflows, and proof
→ newest relevant indexed handoff when needed
→ decision record
→ implementation
```

Do not begin from a screenshot, old handoff, PR description, test name, score, candidate ID, or favored solution.

## One primary role per implementation transaction

Exploration may cross roles. Implementation names one primary role and explicit interfaces so the patch does not become a second architecture.

| Role | Primary boundary | Must preserve | Required proof |
|---|---|---|---|
| repository/document authority | routing, current/historical separation, governance | one repository contract, one product contract, one exact-status owner, structural validation | route/reference/schema/evidence checks and exact-head broad gates |
| shared contracts | schemas, IDs, finite vocabularies, DTOs | one canonical schema/registry and exhaustive consumer parity | type/build, representative contract tests, compatibility evidence |
| database/authority | principals, assignments, RLS, approvals, effects, commercial state | assignment scope, current authority at effect time, forward migrations, durable ambiguity | blank ledger, isolation/concurrency/revocation matrices, managed proof when required |
| runtime/network/provisioning | ingress, Manager↔Hermes, gateway, Docker lifecycle | Host Provisioner authority, employee isolation, scoped credentials, exact image | target-host topology/isolation/lifecycle evidence |
| events/connectors | webhooks, normalization, retries, dead letters | verify before insert, untrusted provider content, event dedupe distinct from effect idempotency | duplicate/order/binding/crash/replay/provider-ID matrix |
| Hermes/context/capability | sessions, profiles, memory, MCP, runtime tools | Manager authority, strict context, observed capability not authority | exact runtime observation and persisted effective-capability evidence |
| owner UI/UX | Web, approvals, signed Review, accessibility | role-safe projection, exact durable IDs, faults remain faults | compiled browser matrix and provider-backed proof for live claims |
| reliability/commercial/proof | idempotency, budgets, rate, receipts, accounting, repair | reserve before dispatch, one effect, accepted receipt before success, conservation | concurrency/crash/provider/accounting/proof reconciliation |
| deployment/release | migrations, secrets, images, DNS/TLS, rollback, attestation | one frozen candidate/digest set, backup/rollback, no fixture shortcut | target-host/provider/channel/commercial/recovery and signed manifest |
| research/decision | candidate generation, topology, controls, sensitivity | evidence labels, baseline, no mathematical promotion | reproducible matrix, equal-feasibility controls, implementation ablation or non-causal result |

## Decision obligations by role

- Repository cleanup that changes authority or current routing is at least `T1`; cross-program cleanup is `T2`.
- Database, security, provider, commercial, durable-effect, and recovery changes are at least `T2`.
- Cross-workstream production or release work is `T3`.
- A deterministic one-line correction may be `T0` when authority, invariant, and exact verification are explicit.

Every role starts from the same evidence matrix. A database engineer cannot infer platform acceptance from docs; a UX engineer cannot promote fixtures; a decision analyst cannot invent provider behavior.

## Candidate and software topology

Decision work uses two structures:

```text
candidate graph
  vertices: candidate trajectories
  use: search diversity, lineage, redundancy, similarity

software invariant hypergraph
  vertices: real entities/obligations
  use: touch, fractional, complete, proved coverage
```

Do not compute software completion from candidate IDs.

## Mathematics discipline

- Mandatory coverage is a feasible-domain constraint, not an objective reward.
- Full, no-graph, no-diversity, evidence baseline, and random controls use the same feasible domain.
- Search restarts and weight perturbations are reported.
- Hodge requires a true simplicial complex.
- Koopman or another predictive model requires comparable trajectories, held-out evaluation, and better performance than the simple baseline.
- COCONUT, continuous hidden-state reasoning, latent BFS, manifold, or phase-switching language is inspiration only without executable implementation.
- A term is selection-influencing when it changes the selected set under equal feasibility.
- A term is causal only when independent implementation outcomes improve in an ablation.

## Implementation and proof discipline

The implementation is smaller than the exploration set. It names:

1. protected invariants;
2. exact source/migration surfaces;
3. coherent transaction identity;
4. high-value alternatives and rejection reasons;
5. software invariant edges represented;
6. complete behavioral proof mapping for each selected edge;
7. affected and broad verification;
8. external evidence still open;
9. documentation and handoff changes.

Do not create tests for every discarded possibility. Test the selected transaction, minimum failure manifold, and exact evidence boundary.

## Handoff minimum

A handoff records:

- exact branch/base/head and source migration head;
- tier and protocol revision;
- authority/evidence contradictions resolved;
- candidate graph and software invariant graph status;
- equal-feasibility controls and sensitivity;
- implementation compression and ablation status;
- source/tests/workflows changed;
- exact commands or CI runs/results;
- unestablished evidence classes;
- next safe action and stop conditions.
