# AGENTS.md — AI Employee Implementation Rules

Status: active  
Updated: 2026-07-20

Root rules and `../CONTRIBUTING.md` apply.

## Mandatory read order

1. `../identity.md`
2. root agent rules, CONTRIBUTING, and CODEGRAPH
3. this file and scoped `CODEGRAPH.md`
4. ratified `STANDARD.md` plus `STANDARD-V0.2-AMENDMENT-001.md`
5. mandatory [`decision/README.md`](decision/README.md) and `decision/protocol-v1.json`
6. `production-readiness-program/README.md`
7. newest relevant indexed handoff
8. architecture index and applicable subsystem documents
9. applicable source, migrations, executable tests, workflows, proof, PRs, and current diff

The amendment controls where the base Standard still shows the superseded `Explore → Act` loop, old document-family routing, migration `0072`, or the pre-computation source map.

## Current implementation state

- Current main baseline: `48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a` is the stacked owner-runtime base.
- PR #35 branch `agent/ws06-ws07-production` is the current WS-06/07 source candidate with bounded WS-08 repair/lineage groundwork.
- Source migration head is `0076`; applied or managed-platform status requires separate proof.
- Active program: `production-readiness-program/`.
- Active computed transaction: `decision/trace007/`.
- `second-half-plan/` is historical and non-canonical.
- CI, live provider/connector, managed database, target-host, fixture-free channel/golden-work, commercial lifecycle, pilot, deployment, and production acceptance remain distinct unless exact current evidence closes them.

## Compute before deciding or implementing

For every non-mechanical task, select the applicable tier in `decision/README.md` before planning a patch.

```text
authority extraction
→ evidence and Unknown matrix
→ independent possible-decision vectors
→ invariant/feasibility filter
→ computed comparison
→ selected exploration
→ separate coherent implementation compression
→ red behavioral proof
→ implementation
→ exact-head verification
```

Rules:

- Do not model one flattened space when bug, feature, user, operator, architecture, protocol, commercial, failure, proof, weird, and constraint spaces are materially different.
- Do not generate recombination candidates until independent current, feature, and counterfactual batches exist.
- Unknown remains Unknown and increases Unsupported.
- Hypergraphs represent genuine multi-way dependencies. Hodge requires a true simplicial complex. Koopman requires repeated comparable trajectories, fitted propagation, held-out error, and diversity control.
- Scores and graphs prioritize; they never establish implementation or acceptance.
- Exploration and implementation are separate artifacts. The patch is the smallest coherent implementation compression, not the full dream frontier.
- Do not create a test for every imagined vector. Test the selected transaction and the smallest failure manifold proving its invariants.
- `T2/T3` work requires a deterministic trace verifier under `decision/traceNNN/`.

`T0 mechanical` may use a compact authority/invariant/verification record. A task may not downgrade itself merely to avoid computation.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact account / employee / assignment / current authority and entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ atomic shared rate and budget admission
→ one durable command/effect and provider idempotency identity
→ accepted | failed | ambiguous durable receipt
→ accepted commercial accounting receipt
→ output and owner/operator proof projection
→ reconciliation or replay-safe repair without repeating an accepted effect
```

Hermes owns reasoning, runs, sessions, memory, and runtime-local tool use. Manager owns identity, assignment, authority, connector/provider custody, approvals, durable effects, shared commercial admission, accounting, revocation, reconciliation, repair, and proof.

## Protocol and projection rules

- Declarative connector registry/setup owns identity, risk, custody, tools, scopes, hosts, continuation, and owner-safe copy.
- Unknown or consequential connectors default to Manager custody and fail closed when stale, revoked, mismatched, or unprobed.
- `tools/list` may be broad; `tools/call` re-authorizes from current effective-capability evidence.
- MCP Apps, AG-UI, Web, SMS, and signed Review are bounded projections. They cannot access raw credentials, databases, provider routing, or direct effects.
- Initial snapshots install atomically only after exact scope validation; cursor/version precedes deltas.
- Duplicate, stale, reordered, cross-account, or stale-assignment deltas fail closed.
- Reconnect does not resubmit accepted owner intent.
- Consequential actions re-enter Manager command, approval, effect, commercial, and proof boundaries.

## Engineering execution

Every task declares ID, branch/base, objective, success criteria, allowed/forbidden files, decision tier, trace location when required, tests, blockers, commit ceiling, and rubric scores.

```bash
npm run repo:rubric -- ./task-contract.json
python decision/trace007/compute.py   # current T3 example
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
```

Do not weaken tests. Stop on red exact-head CI. Use forward migrations. Treat schemas, fixtures, contracts, harnesses, diagnostics, proof, runbooks, and decision traces as first-class code. Fixtures never satisfy fixture-free acceptance.

## Hermes upstream review

Before changing Hermes images, launchers, sessions, streaming, tool discovery, runtime capabilities, gateway behavior, or Hermes-derived UI, run `npm run hermes:upstream:check` when required by repository policy. Production remains pinned until exact-image release gates pass.

## Document authority

- `STANDARD.md` plus `STANDARD-V0.2-AMENDMENT-001.md` — ratified normative requirements and current computation/document/status amendment.
- `decision/README.md` — mandatory computation-first decision protocol.
- `CODEGRAPH.md` — current topology and evidence boundary.
- `production-readiness-program/` — sole active production-readiness route.
- `docs/architecture/` — current source-backed explanation.
- `second-half-plan/` — historical non-canonical plans.
- `memory/MEMORY.md` — sole handoff index.
- executable source and exact evidence decide implementation and acceptance.
