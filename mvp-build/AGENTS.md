# AGENTS.md — AI Employee implementation contract

Status: active  
Updated: 2026-07-20

Root `../AGENTS.md` and `../CONTRIBUTING.md` apply. Exact branch, candidate, migration, workstream, and gate status lives only in `CODEGRAPH.md`.

## Required start

1. Read `../identity.md`, root rules, and root routing.
2. Read this file and `CODEGRAPH.md`.
3. Read `STANDARD.md` plus ratified amendments.
4. Read `decision/README.md` before any non-mechanical choice.
5. Read the active program/current transaction and only the exact source/test/proof needed.
6. Resolve contradictions by evidence class before editing.

## Compute before patching

Use the smallest tier that honestly represents the decision.

```text
authority/evidence/Unknown extraction
→ independent applicable candidate spaces
→ invariant and prerequisite filter
→ simple evidence-and-invariants baseline
→ candidate search topology when useful
→ software invariant topology when useful
→ equal-feasibility controls
→ search and weight sensitivity
→ selected exploration
→ separate implementation compression
→ complete behavioral proof plan
→ implementation
→ exact-head and external verification
```

Binding rules:

- No mathematical term is causal without an implementation-level ablation that improves independent outcomes over the simple baseline.
- Candidate trajectories and software entities are separate topologies.
- Candidate-edge touch is not software coverage.
- Software coverage distinguishes `touch`, `fractional`, `complete`, and `proved`.
- Mandatory coverage is a feasibility constraint, not an objective bonus.
- `T2/T3` reports weight and search sensitivity; instability is evidence, not noise to hide.
- Hodge requires a true simplicial complex.
- Koopman or another predictive latent model requires repeated comparable trajectories, held-out evaluation, and better performance than the simple baseline. Otherwise it remains disabled.
- Continuous-thought, latent BFS, COCONUT, manifold, and hidden-state language is inspiration only unless the executable system implements and verifies it.
- Unknown remains Unknown and increases Unsupported.
- Exploration may be broad. The patch is the smallest coherent transaction preserving invariants.

## Product authority

```text
trigger
→ authenticated principal
→ exact account / employee / assignment / current authority and entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ atomic PostgreSQL rate and budget admission
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ accepted effect-bound accounting receipt
→ output and proof projection
→ original-effect reconciliation or replay-safe repair
```

- Manager owns identity, assignment authority, connector/provider custody, approvals, durable effects, commercial state, reconciliation, repair, and proof.
- Hermes owns reasoning, runs, sessions, runtime-local memory, and tool execution inside Manager authority.
- Web, SMS, signed Review, MCP Apps, AG-UI, models, connectors, and caller payloads are bounded mechanisms; they cannot mint authority or select credentials/provider/commercial state.
- Initial snapshots install only after exact scope validation; cursor/version precedes ordered deltas.
- Reconnect and retry never repeat accepted owner intent or an accepted effect.
- Ambiguous consequential outcomes reconcile against the original effect identity before retry.
- Cross-account, stale-assignment, stale-entitlement, stale-approval, duplicate, and reordered requests fail closed.
- Applied migrations are immutable; additions are forward-only.

## Engineering execution

- Work only on the reviewed branch/base named in `CODEGRAPH.md` or the task contract.
- No feature expansion while a prerequisite P0 is unresolved.
- Use Red → Green → Refactor for the selected transaction.
- Test selected invariants and the minimum failure manifold; do not create ceremonial tests for rejected candidates.
- Every selected software dependency edge maps to a complete behavioral test or explicit blocker.
- Do not let structural document tests carry product semantics already owned by Standard, source, migrations, and behavioral tests.
- Fixtures, source, unit, integration, CI, managed platform, provider, browser/channel, target host, commercial lifecycle, signed release, pilot, deployment, and production are distinct evidence classes.
- Stop on red exact-head CI and preserve diagnostics.

## Verification

```bash
python decision/trace007/compute.py
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run test:ws07-ws08
npm run repo:verify:full
npm run test:unit
```

Run the complete applicable matrix available in the environment. Report unavailable external prerequisites rather than substituting weaker evidence.

## Document ownership

- `STANDARD.md` and amendments — normative requirements.
- `decision/README.md` — decision method.
- `CODEGRAPH.md` — sole exact current status and executable topology.
- `production-readiness-program/` — one active production route.
- `docs/architecture/` — explanatory architecture.
- `memory/MEMORY.md` — sole handoff index.
- `second-half-plan/`, `GAPS.md`, `REMEDIATION.md` — historical provenance/routing only.
- source, migrations, executable tests, workflows, and proof — implementation/acceptance truth.
