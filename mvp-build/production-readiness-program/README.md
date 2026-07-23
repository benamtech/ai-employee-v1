# AMTECH Production Readiness Program

Status: **active and canonical**  
Updated: 2026-07-23  
Structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision transaction: [`../decision/active.json`](../decision/active.json)

This directory is the single active production-readiness route. Exact candidate conclusions belong to the current pull request, exact-head workflows, or retained release records. Historical plans, audits, completed traces, and ancestor workflow results remain provenance only.

## Authority and proof

AMTECH preserves five distinct proof classes:

```text
P0 representation calculation or hypothesis
→ P1 verified formal-model property
+ P2 verified representation-to-repository correspondence
→ P3 exact-candidate executable software evidence
→ P4 external or production acceptance
```

No class silently promotes itself. A valid eigenpair, solver certificate, model-checker result, or other formal object may be decisive P1 proof for its declared model property. It establishes a software property only when the required P2 correspondence makes that implication sound. P3 and P4 remain separately bounded.

Manager is the authority plane. Hermes is the reasoning and runtime substrate. Web, SMS, signed Review, MCP Apps, AG-UI, UI Lab, and UI variants are bounded projections. **Provider and connector adapters do not create authority.** Models, mathematical representations, and coding agents do not create product authority either.

## Current position

The cumulative source candidate includes:

- direct typed Manager composition and current-assignment authority interception;
- immutable forward migrations through `0082`;
- provider-neutral connector discovery, lifecycle, revoke/reconnect, and exact conversational decisions;
- shared rate/budget admission, one effect/provider identity, durable ambiguity, accounting, and reconciliation;
- five-image exact-SHA release identity, independent manifest verification, restore/rollback guards, and capacity groundwork;
- one production owner projection path;
- employee UI presentation adapters;
- the production UI Lab and folder-first full employee UI variants behind `EmployeeExperienceModelV1`;
- Trace013’s repository-native software experiment compiler.

Trace013 replaces the former prose-only methodology layer with executable infrastructure:

```text
exact Git SHA + task
→ content-addressed repository facts
→ authority DAG + dependency graph
→ genuine invariant hypergraph
→ P2 correspondence
→ P1 formal certificate when admitted
→ task diffusion + first-through-fourth-order effect frontier
→ task capsule + predeclared predictions
→ admitted plan before source edits
→ executable verification and P3 evidence ledger
→ prediction/outcome calibration
→ finished transaction
```

The engine is `../decision/engine/repoctl.mjs`; the registered dialects and admission conditions are in `../decision/engine/representation-registry.json`.

## Execution method

For non-mechanical work:

```bash
node decision/engine/repoctl.mjs start --task <task.json> --out decision/<trace-or-transaction>
node decision/engine/repoctl.mjs admit-plan --transaction <path> --plan <plan.json>
# implement only after admission
node decision/engine/repoctl.mjs evaluate --transaction <path>
node decision/engine/repoctl.mjs finish --transaction <path>
```

The compiler always produces content-addressed facts, authority/dependency structures, a genuine software-invariant hypergraph, task-local context diffusion, a typed higher-order effect frontier, and an experiment contract. Specialized state-machine, SMT, e-graph, queueing, Koopman, topology, embedding, and other dialects activate only when their registered prerequisites hold.

Natural language is a generated interoperability and audit view, not the mandatory reasoning substrate. Retained representations expose their generators, input/output digests, dimensions, provenance, assumptions, parameters, residuals or parity checks, proof class, and excluded claims.

## Program route

1. `04-dependency-ordered-production-plan.md` — dependency order and stack-integration checkpoint.
2. `08-production-issue-vector.json` — original issue baseline.
3. `13-resolution-ledger.json` — current resolution and control state.
4. `09-workstream-execution-map.md` — completion and stop contracts.
5. `20-ws06-ws08-commercial-effect-transaction.md` — durable effect and recovery transaction.
6. `10-test-suite-disposition.md` — test and evidence authority.
7. `07-verification-and-handoff-matrix.md` — evidence and handoff boundary.
8. `../decision/active.json` — active transaction router.
9. `../decision/README.md` — executable experiment protocol.
10. `../decision/representation-contract.md` — representation and proof taxonomy.
11. `../decision/engine/` — generators, analyzers, schemas, certificates, and trusted verifiers.
12. `../decision/trace007/` through `../decision/trace013/` — scoped decision and implementation records.
13. current source, immutable migrations, tests, workflows, proof, and newest indexed memory.

## Current trace map

- Trace007 — commercial/effect authority and computation baseline.
- Trace008 — release, recovery, rollback, and capacity groundwork.
- Trace009 — UI projection architecture search and calibration.
- Trace010 — connector operating substrate.
- Trace011 — employee UI port and presentation adapters.
- Trace012 — UI Lab and folder-first employee UI variants.
- Trace013 — repository-native software experiment compiler; active until exact-head closure.

Trace013 uses 64 candidates in four independent batches and selects the smallest complete vertical slice: repository facts, registered representations, P1/P2 certificates, task capsules, plan chronology, executable evaluation, prediction calibration, and deterministic queries. The engine’s causal engineering benefit remains an explicit future outcome experiment; its artifact integrity and lifecycle are executable now.

## Current integration checkpoint

The stack is reconciled top-down:

```text
verify exact PR #40 head
→ merge PR #40 into PR #35 branch
→ verify exact PR #35 head
→ merge PR #35 into PR #34 branch
→ verify exact PR #34 head
→ leave PR #34 as the only ready-to-review integration into main
```

A red ancestor is not promoted independently before the cumulative repair. No ancestor workflow certifies a descendant merge commit.

## Open production gates

The cumulative source and CI candidate do not yet establish:

- disposable managed-platform migration, security, backup, restore, and rollback evidence;
- live OAuth/MCP/provider authorization, refresh, idempotency, response-loss, revocation, outage, and repair;
- target-host secret custody, two-employee isolation, destructive recovery, and trusted signing;
- fixture-free Web/SMS/signed-Review convergence and all three provider-backed golden work journeys;
- supported-browser, manual visual/accessibility, representative 64 GiB capacity, and fairness evidence;
- controlled pilot, deployment, or production acceptance.

These remain P4 gates unless a specific verified correspondence contract legitimately discharges a defined sub-gate.

## Stop rules

- Do not edit source before task-capsule and plan admission for non-mechanical work.
- Do not weaken tests for green.
- Do not compare controls from different feasible domains.
- Do not hand-author operators, graph structure, weights, scores, or certificates to justify a desired patch.
- Do not demote a valid formal result from proof of its exact property.
- Do not promote P1 into P2, P3, or P4 without the missing correspondence and evidence.
- Unknown is not zero.
- Shared rate and budget authority cannot be process-local or caller-sharded.
- Ambiguous provider outcomes reconcile the original effect before retry.
- Repair cannot erase accepted work or invent completion.
- Fixture state cannot satisfy fixture-free acceptance.
- Source-built signing is not trusted production signing or deployment.
