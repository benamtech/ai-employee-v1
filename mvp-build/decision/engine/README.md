# Repository-Native Software Experiment Compiler

Status: active executable decision infrastructure.  
Engine version: `1.1.0`.

This engine compiles exact repository truth and a task into a bounded experiment transaction that Claude Code, Codex, Cursor, Pi, local models, deterministic scripts, or a human engineer can execute without a vendor-specific skill.

## Trust model

```text
tracked repository + exact Git SHA
→ content-addressed facts
→ registered typed representations
→ verified transformations
→ task capsule and predeclared predictions
→ admitted plan
→ source change
→ executable evidence and outcomes
→ finished transaction
```

The producer may be an untrusted coding agent. Small repository-owned verifiers check artifact digests, model correspondence, formal certificates, chronology, impact coverage, executable results, prediction outcomes, and evidence-class boundaries.

## Commands

From `mvp-build`:

```bash
node decision/engine/repoctl.mjs doctor
node decision/engine/repoctl.mjs self-test
node decision/engine/repoctl.mjs start --task task.json --out decision/trace014
node decision/engine/repoctl.mjs admit-plan --transaction decision/trace014 --plan plan.json
node decision/engine/repoctl.mjs check --transaction decision/trace014 --strict
node decision/engine/repoctl.mjs evaluate --transaction decision/trace014
node decision/engine/repoctl.mjs finish --transaction decision/trace014
node decision/engine/repoctl.mjs verify --transaction decision/trace014 --phase finished
```

Dirty work is rejected by default. `--allow-dirty` records rather than hides intentional pre-existing paths; it never resets, cleans, stashes, or overwrites work.

Verification commands in a plan are argv arrays, not shell strings.

For modern ledgers (`engine_version >= 1.1.0`), `evaluate` re-extracts current repository facts and rebuilds the authority DAG, dependency graph, invariant hypergraph, and correspondence artifacts before deciding evidence. Hard-edge obligations must be `accepted` with successful `evidence[].argv` command results or explicitly blocked; `planned` remains unresolved.

`evaluate --overrides overrides.json` retains post-hoc overrides, but override entries must reference flagged differential findings. Agent-authored overrides are retained for provenance and do not suppress gates.

`repoctl check --transaction <path> [--strict]` is non-mutating advisory edit-guard context for open transactions. It reports changed-path and hard-edge findings without writing an evidence ledger; `--strict` returns `ok:false` when findings are present.

## Always-on representations

- `repo.fact.v1`
- `authority.dag.v1`
- `dependency.graph.v1`
- `invariant.hypergraph.v1`
- `correspondence.v1`
- `task.diffusion.v1`
- `effect.frontier.v1`
- `experiment.design.v1`

The first specialized representation is `spectral.hypergraph.v1`. It produces a P1 certificate only for the declared normalized-operator eigenpair property and only when its assumptions, P2 correspondence, and independently recomputed residual pass.

Future transition-system, SMT, e-graph, queueing, Koopman, topology, and embedding dialects are registered but not falsely represented as implemented.

## Queries

```bash
node decision/engine/repoctl.mjs query authority --transaction decision/trace014 --entity model-gateway
node decision/engine/repoctl.mjs query impact --transaction decision/trace014 --path apps/manager/src/lib/model-gateway-commercial.ts
node decision/engine/repoctl.mjs query invariants --transaction decision/trace014 --entity ProviderReceipt
node decision/engine/repoctl.mjs query proofs --transaction decision/trace014 --hyperedge <id>
node decision/engine/repoctl.mjs query effects --transaction decision/trace014 --depth 4
node decision/engine/repoctl.mjs query evidence --transaction decision/trace014 --claim <id>
```

Output is structured JSON. `TASK-CAPSULE.md` and `HANDOFF.md` are generated language bridges, not the source of semantics.

## Proof classes

- **P0:** representation calculation or hypothesis.
- **P1:** verified property of an explicit formal model.
- **P2:** verified correspondence between the model and repository facts.
- **P3:** executable evidence on an exact software candidate.
- **P4:** external or production acceptance.

No class silently promotes itself into a stronger class.

`external.acceptance.v1` is the only implemented dialect that can support P4 in a modern evidence ledger, and only when a retained accepted external attestor record validates for the exact candidate. Trace019's self-hosted lifecycle is not evidence of the new gates; the negative suite is the local P3 evidence for the repaired evaluator.
