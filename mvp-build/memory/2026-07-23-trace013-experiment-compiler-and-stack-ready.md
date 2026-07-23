# Trace013 experiment compiler and stack-readiness handoff

Date: 2026-07-23  
Status: current handoff; verify against source, PRs, and exact workflows

## Completed

Trace013 implements the repository-native software experiment compiler at `decision/engine/repoctl.mjs`.

The system now provides:

- content-addressed repository facts;
- authority and dependency graphs;
- genuine software-invariant hypergraphs;
- P2 source/model correspondence;
- P1 spectral certificate and residual verification;
- task-local diffusion and typed first-through-fourth-order effects;
- task capsules, predictions, proof obligations, and maximum patch;
- plan admission before source edits;
- argv-based evaluation, evidence ledger, and outcome calibration;
- finish verification and deterministic queries;
- a six-case Trace007–Trace012 retrospective benchmark;
- an isolated full lifecycle self-test.

Trace013’s implementation coordinate `620c3521dcdee7a67aa27e07487d7f5dae52b3a5` passed merge gates and the complete source/PostgreSQL/image/release workflow. Later closure and merge descendants require their own exact-head evidence.

## Authority state

- `decision/active.json` has no open transaction.
- Trace013 is the latest completed trace.
- Trace014 is reserved and does not exist.
- Natural language is an interoperability/audit view; machine artifacts own semantics.
- P0, P1, P2, P3, and P4 remain non-promoting.

## Stack operation

```text
verify final PR40 head
→ merge PR40 into PR35 branch
→ verify PR35 head
→ merge PR35 into PR34 branch
→ verify PR34 head
→ leave PR34 ready for user merge to main
```

Do not merge a known-red historical lower coordinate independently.

## After the user merges

Create a new branch from current `main`, create a task JSON, and run:

```bash
cd mvp-build
node decision/engine/repoctl.mjs start --task task.json --out decision/trace014
```

Do not preselect Trace014’s plan. Fresh facts, authority, candidate batches, prerequisites, baseline comparison, representations, and predictions must be compiled from the merged coordinate.

## Open evidence

Managed database, live provider, target host, fixture-free channels and golden work, human accessibility, representative capacity, trusted signing, pilot, deployment, and production remain open.
