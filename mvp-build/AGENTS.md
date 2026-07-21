# AGENTS.md — AI Employee implementation contract

Status: active  
Updated: 2026-07-20

Root `../AGENTS.md` and `../CONTRIBUTING.md` apply.

## Required start

1. Read `../identity.md`, root rules, and root `CODEGRAPH.md`.
2. Read this file, `CODEGRAPH.md`, `STANDARD.md`, and ratified amendments.
3. Read `decision/README.md` and `decision/protocol-v1.json` before any non-mechanical choice.
4. Read `production-readiness-program/README.md`, the current transaction, and only the exact source/test/proof needed.
5. Resolve branch, base, head, migration head, affected workstreams, contradictions, and evidence class before editing.

## Current candidate

- Stack: PR #34 owner-runtime base → PR #35 WS-06/07 candidate.
- Branch: `agent/ws06-ws07-production`.
- Source migration head: `0076`.
- Active trace: `decision/trace007/`.
- Active program: `production-readiness-program/`.
- Exact-head CI and all stronger external evidence remain gates until demonstrated.

## Compute before patching

Use the smallest tier that honestly represents the decision. A task may not downgrade itself to avoid analysis.

```text
authority/evidence/Unknown extraction
→ independent applicable candidate spaces
→ invariant and prerequisite filter
→ simple evidence-and-invariants baseline
→ computed alternatives
→ dependency coverage: touch / partial / complete
→ weight and search sensitivity
→ selected exploration
→ separate implementation compression
→ complete behavioral proof for each selected dependency transaction
→ implementation
→ exact-head and external verification
```

Binding anti-ritual rules:

- No mathematical term is causal without a counterfactual ablation that changes the implementation set, required proof, or rejection decision.
- A different exploration ranking alone is not an implementation-level causal result.
- Hypergraph edge touch is not partial coverage; partial coverage is not complete coverage.
- Hodge requires a true simplicial complex.
- Koopman or any predictive latent model requires repeated comparable trajectories, held-out evaluation, and superior performance to a simpler baseline. Otherwise it remains disabled.
- Weight sensitivity and search sensitivity are required for `T2/T3` selection claims.
- Unknown remains Unknown and increases Unsupported.
- Exploration may be broad. The patch is the smallest coherent transaction preserving invariants.
- Continuous-thought, latent BFS, COCONUT, manifold, and hidden-state language are inspiration only unless the executable system actually implements and verifies them.

## Execution boundary

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

Manager owns authority, custody, approvals, effects, commercial state, reconciliation, repair, and proof. Hermes owns reasoning/runtime behavior within those bounds. Browser, MCP Apps, AG-UI, SMS, signed Review, models, connectors, and caller payloads cannot mint authority or select credentials/provider/commercial state.

## Engineering rules

- Work only on the specified reviewed branch/base.
- No feature expansion while a prerequisite P0 is unresolved.
- Use Red → Green → Refactor for the selected transaction.
- Add behavioral tests for selected invariants and the minimum failure manifold; do not test every imagined candidate.
- Do not let structural document tests become a second semantic specification.
- Forward migrations only; never rewrite applied migration history.
- Reconnect/retry never repeats accepted intent or effect.
- Ambiguous consequential outcomes reconcile before retry.
- Fixtures, source, local PostgreSQL, CI, managed platform, provider, browser/channel, target-host, commercial, release, pilot, and production are distinct evidence classes.
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

Run the complete applicable matrix available in the environment. Report unavailable dependencies or external gates rather than substituting weaker evidence.

## Document ownership

- `STANDARD.md` and amendments — normative requirements.
- `decision/README.md` — decision method.
- `CODEGRAPH.md` — topology and current evidence.
- `production-readiness-program/` — one active program and transaction ledger.
- `docs/architecture/` — explanatory architecture.
- `memory/MEMORY.md` — sole handoff index.
- `second-half-plan/`, `GAPS.md`, `REMEDIATION.md` — historical routing/provenance only.
- source, migrations, executable tests, workflows, and proof — implementation/acceptance truth.
