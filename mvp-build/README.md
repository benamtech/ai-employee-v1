# mvp-build — AMTECH AI Employee

Status: active implementation home  
Updated: 2026-07-23

This directory contains the executable product and its repository-native software experiment compiler.

Current structural status lives in [`CODEGRAPH.md`](CODEGRAPH.md). Exact transient SHA, workflow run, and conclusion live in the current PR, workflows, or retained release records.

## Agent route

```text
../identity.md
→ ../AGENTS.md + AGENTS.md
→ authority-map.json + CODEGRAPH.md
→ STANDARD.md and amendments
→ decision/active.json
→ decision/engine/repoctl.mjs
→ generated task capsule
→ admitted plan
→ exact source, tests, workflows, and evidence
```

For every non-mechanical task, create `task.json` and run:

```bash
node decision/engine/repoctl.mjs start --task task.json --out decision/<trace-or-transaction>
```

Then admit the plan before source edits, evaluate after implementation, and finish the transaction. The same interface works for Claude Code, Codex, Cursor, Pi, local models, deterministic scripts, humans, and future agents.

For UI Lab or full UI-variant work, begin at [`ui-lab/README.md`](ui-lab/README.md) after the task capsule is generated.

## Product boundary

- **Hermes:** reasoning, runs, sessions, runtime-local memory, and tool execution.
- **Manager:** identity, assignment authority, capabilities, connector/provider custody, approvals, durable effects, commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI/UI Lab/UI variants:** bounded projections.
- **PostgreSQL/Supabase:** shared durable identity, rate, budget, effect, receipt, accounting, lineage, and reconciliation authority.
- **Host Provisioner:** sole Docker and target-host lifecycle authority.

Provider and connector adapters do not create authority.

## Proof and evidence

```text
P0 representation calculation
P1 verified formal-model property
P2 verified representation correspondence
P3 exact-candidate executable evidence
P4 external/production acceptance
```

No class silently promotes itself.

## Core verification

```bash
node decision/trace013/compute.mjs
node decision/engine/repoctl.mjs doctor
node decision/engine/repoctl.mjs self-test
node decision/trace013/retrospective_benchmark.mjs
npm run repo:agentic:check
npm run repo:verify:full
npm run test:unit
npm run test:integration
npm run build
node scripts/ui-variant.mjs doctor
```

Each command proves only its exact boundary and candidate. Managed database, live provider, browser/accessibility, target-host, commercial lifecycle, recovery rehearsal, trusted signing, pilot, deployment, and production remain separate unless explicitly verified.

## Active authority

- `authority-map.json` — machine router.
- `CODEGRAPH.md` — sole current structural-status owner.
- `STANDARD.md` plus amendments — normative requirements.
- `decision/active.json` — current/no-open transaction router.
- `decision/engine/` — executable experiment compiler.
- `decision/trace013/` — completed compiler implementation record.
- `production-readiness-program/` — single active production route.
- `memory/MEMORY.md` — handoff index.
- `second-half-plan/`, `GAPS.md`, and `REMEDIATION.md` — historical provenance.

Trace014 is reserved for the first new task on a post-merge branch and does not yet exist.
