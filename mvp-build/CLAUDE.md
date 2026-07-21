# CLAUDE.md — AI Employee Implementation Rules

Status: active  
Updated: 2026-07-20

> Tool-specific mirror of `AGENTS.md`. Root rules and `../CONTRIBUTING.md` also apply.

## Required start

1. Read root/scoped `AGENTS.md`, `CODEGRAPH.md`, ratified `STANDARD.md`, `STANDARD-V0.2-AMENDMENT-001.md`, and [`decision/README.md`](decision/README.md).
2. Read `production-readiness-program/README.md`, then only the newest relevant indexed handoff and source/test/proof needed for the task.
3. Resolve the exact branch, base, head, migration head, applicable workstreams, and evidence contradictions.
4. Select the computation tier and verify the required decision record before planning implementation.
5. Validate the task contract and run the quick gate before editing.

The amendment controls where the base Standard still shows the superseded execution loop, old document-family routing, migration `0072`, or the earlier source map.

```bash
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
```

Current main baseline is `48b917389ed85b9652eca43a8e4a8f60b52e917b`. PR #34 exact head `e04ace7bd6fafa9e2eadaeec3f04e70043513e3a` is the stacked owner-runtime base. PR #35 branch `agent/ws06-ws07-production` is the current WS-06/07 source candidate with bounded WS-08 groundwork. Source migration head is `0076`. `second-half-plan/` is historical and non-canonical.

## Computation-first rule

No non-mechanical decision proceeds directly from inspection to patching.

```text
authority/evidence extraction
→ applicable possible-decision spaces
→ independent candidate batches
→ Unknown/Unsupported accounting
→ invariant and feasibility filtering
→ computed comparison
→ selected exploration
→ separate implementation compression
→ red behavioral proof
→ implementation
→ exact-head verification
```

Use the proportional tiers in `decision/README.md`:

- `T0`: mechanical, no material choice;
- `T1`: bounded choice, at least four vectors;
- `T2`: consequential boundary, at least sixteen vectors and computed comparison;
- `T3`: production/cross-workstream, at least sixty-four vectors, multi-way dependency analysis, feasible baselines, causal graph/diversity classification, and a deterministic verifier.

Do not collapse bug, feature, user, operator, architecture, protocol, commercial, failure, proof, weird, and constraint spaces. Do not use decorative hypergraphs, Hodge theory, or Koopman language. Unknown evidence remains Unknown. Scores prioritize only. Exploration does not equal the patch list.

## Boundary

Hermes owns employee reasoning/runtime behavior. Manager owns identity, assignment authority, capability/tool contracts, connector/provider custody, approvals, durable effects, shared rate/budget admission, commercial accounting, revocation, reconciliation, repair, and proof.

Unknown, stale, revoked, cross-account, or mismatched connector/capability/assignment evidence fails closed. MCP Apps, AG-UI, Web, SMS, and signed Review are projections, not authority. Initial snapshots install only after exact scope validation; cursor/version precedes deltas; reconnect never replays accepted owner intent.

## Execution

- Work on the specified reviewed branch/base; never edit `main` directly.
- No feature expansion while a prerequisite P0 is unresolved.
- Compute first, then use Red → Green → Refactor for one coherent selected transaction.
- Every commit references the task ID.
- Stop on red exact-head CI and do not weaken tests for green.
- Never report a curated suite as proof of a broader aggregate or live boundary.
- Preserve exact request/work revision, approval, command/effect, provider receipt, accounting receipt, recovery, output, and proof identity.
- After three failed attempts on one concrete step, preserve diagnostics and escalate.
- Treat schemas, migrations, fixtures, contracts, harnesses, decision traces, diagnostics, proof, and runbooks as implementation. Fixtures do not satisfy fixture-free acceptance.

Before pushing:

```bash
npm run repo:verify:full
```

## Hermes upstream review

Before changing Hermes images, launchers, profiles, sessions, delegation, gateway/client behavior, tool discovery, runtime-native capabilities, or Hermes-derived UI, run `npm run hermes:upstream:check` when repository policy requires it. Upstream never auto-upgrades the production pin.

## Database and evidence

Use production-shaped local/CI PostgreSQL for routine migration, RLS, grant, function, negative-isolation, concurrency, backfill, and rollback work. Use disposable managed Supabase only for material platform-specific or release-candidate proof. Production is never the routine test target.

Computation, documentation, source, fixture, local database, old proof, and ancestor-SHA evidence cannot satisfy a stronger boundary they did not exercise. `production-ready` requires every non-waivable Standard gate on one exact signed deployed release.

## Authority files

- `STANDARD.md` plus `STANDARD-V0.2-AMENDMENT-001.md` — ratified normative requirements and current computation/document/status amendment.
- `decision/README.md` and `decision/protocol-v1.json` — mandatory computation-first decision contract.
- `CODEGRAPH.md` — source topology, migration head, and evidence boundary.
- `production-readiness-program/` — single active production-readiness route.
- `docs/architecture/` — current source-backed explanatory map.
- `second-half-plan/` — historical non-canonical material.
- `memory/MEMORY.md` — sole handoff index.
- source, migrations, tests, workflows, and proof — implementation and acceptance authority.
