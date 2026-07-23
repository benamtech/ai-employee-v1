# Canonical Agent Session Onboarding

Status: active pre-task bootstrap  
Scope: Codex, Claude Code, Cursor, Pi, local coding agents, and human operators working on `mvp-build`  

This bootstrap prepares a session to use the repository-native experiment compiler. It is not the task prompt and must not preselect an implementation.

## Required pre-task sequence

Run from any directory inside the repository. Do not edit product source during onboarding.

1. Resolve the repository root and inspect the current worktree:

```bash
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git log -1 --oneline --decorate
```

2. Confirm the session is not coding directly on `main`. The working branch must be a new task branch created from the current merged `main`. Never reset, clean, stash, discard, or overwrite existing work to satisfy this rule.

3. Read only the authority chain needed to orient the session, in this order:

```text
identity.md
AGENTS.md
CONTRIBUTING.md
CODEGRAPH.md
mvp-build/AGENTS.md
mvp-build/authority-map.json
mvp-build/CODEGRAPH.md
mvp-build/STANDARD.md
mvp-build/decision/active.json
mvp-build/decision/README.md
mvp-build/decision/representation-contract.md
mvp-build/decision/engine/README.md
mvp-build/decision/engine/representation-registry.json
mvp-build/production-readiness-program/README.md
mvp-build/memory/MEMORY.md
```

Historical plans, completed traces, audits, and dated handoffs are provenance. Do not treat them as current instructions unless an active router or generated task capsule points to them.

4. Enter `mvp-build`, install dependencies only when missing or stale, then verify the compiler itself:

```bash
cd mvp-build
npm ci
node decision/engine/repoctl.mjs doctor
node decision/engine/repoctl.mjs self-test
```

Do not run operating-system package managers, unattended upgrades, destructive Git commands, or environment-wide installs without explicit evidence and approval.

5. Resolve `decision/active.json`. At onboarding time it should normally report no open transaction and reserve the next trace. Do not create the next transaction until the user supplies the actual task or planning prompt.

6. After the user supplies that task, translate it into a compact `task.json`, then start the transaction before non-mechanical source edits:

```bash
node decision/engine/repoctl.mjs start \
  --task task.json \
  --out decision/<reserved-trace-or-transaction>
```

Use generated machine artifacts as the semantic contract:

```text
task-capsule.json
repository-facts.json
authority-dag.json
dependency-graph.json
invariant-hypergraph.json
correspondence.json
task-diffusion.json
effect-frontier.json
experiment.initial.json
```

`TASK-CAPSULE.md` is only the compact language bridge.

7. Retrieve context by deterministic query instead of reading the repository indiscriminately:

```bash
node decision/engine/repoctl.mjs query authority --transaction <path> --entity <name>
node decision/engine/repoctl.mjs query impact --transaction <path> --path <repo-path>
node decision/engine/repoctl.mjs query invariants --transaction <path> --entity <name>
node decision/engine/repoctl.mjs query proofs --transaction <path> --hyperedge <id>
node decision/engine/repoctl.mjs query effects --transaction <path> --depth 4
node decision/engine/repoctl.mjs query evidence --transaction <path> --claim <id>
```

Prefer machine queries, exact source, tests, and generated provenance over large language-first context dumps or generic skill files.

8. Before implementation, create a plan containing independent candidates, rejected alternatives, predictions and falsifiers, proof obligations, maximum patch, stop conditions, and argv-array verification commands. Admit it before changing source:

```bash
node decision/engine/repoctl.mjs admit-plan \
  --transaction <path> \
  --plan plan.json
```

9. During work, preserve the P0–P4 evidence boundaries. Formal-model proof, representation fidelity, executable software evidence, and external acceptance are separate. Unknown is not zero. A mathematical layer must change a decision, proof obligation, counterexample, or experiment to remain causal to the task.

10. Complete the transaction with executable evidence and calibrated outcomes:

```bash
node decision/engine/repoctl.mjs evaluate --transaction <path>
node decision/engine/repoctl.mjs finish --transaction <path>
node decision/engine/repoctl.mjs verify --transaction <path> --phase finished
```

## Onboarding completion response

Before receiving the task prompt, report only:

- repository root;
- current branch and exact SHA;
- confirmation that the branch descends from current `main`;
- whether the worktree was clean or which pre-existing paths were preserved;
- `repoctl doctor` result;
- `repoctl self-test` result;
- current transaction state and reserved next trace;
- confirmation that no product source or task transaction was created during onboarding;
- `READY FOR TASK PROMPT`.
