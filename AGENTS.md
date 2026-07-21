# AGENTS.md — Repository contract

Status: active  
Updated: 2026-07-20

## Start here

1. Read `identity.md`.
2. Read this file, `CONTRIBUTING.md`, and `CODEGRAPH.md`.
3. For product work, read `mvp-build/AGENTS.md`, `mvp-build/CODEGRAPH.md`, and the ratified Standard.
4. Read only the active program record, active decision trace, newest relevant indexed handoff, and exact source/test/proof needed for the task.

Do not recursively absorb historical plans, audits, or handoffs as current instructions.

## Authority

```text
deployed release proof
→ applied durable state
→ executable source and generated configuration
→ exact-SHA executable evidence
→ ratified Standard and active production program
→ current CODEGRAPH and architecture
→ newest indexed memory
→ historical records
```

A lower evidence class never promotes itself into a higher one. Source is not CI. CI is not provider proof. Fixtures are not live acceptance. An ancestor SHA is not evidence for the current candidate.

## Repository routing

- `mvp-build/` — executable AI Employee product and production authority.
- `mvp-build/STANDARD.md` plus ratified amendments — normative requirements.
- `mvp-build/decision/` — decision protocol and one active trace per active transaction.
- `mvp-build/production-readiness-program/` — sole active production-readiness route.
- `mvp-build/docs/architecture/` — current source-backed explanation.
- `mvp-build/memory/MEMORY.md` — sole handoff index.
- `mvp-build/second-half-plan/`, old audits, and dated handoffs — historical evidence only.
- `wiki/` — strategy, research, and factual history; never implementation authority.

## Current stack

- PR #34 is the stacked owner-runtime base.
- PR #35 (`agent/ws06-ws07-production`) is the active WS-06/07 candidate with bounded WS-08 groundwork.
- Source migration head is `0076`; applied, managed-platform, and production status require separate proof.
- PR #35 exact-head CI is currently a release gate, not an assumed fact.

## Decision discipline

For non-mechanical work, compute before patching using `mvp-build/decision/README.md`.

Binding rules:

1. No score, graph, spectral term, or predictive model is causal without an ablation that changes the implementation decision or required proof.
2. Graph coverage distinguishes `touch`, `partial`, and `complete`; touch is not completion.
3. Candidate selection must report weight sensitivity and search sensitivity.
4. Every selected dependency transaction maps to a complete behavioral proof or an explicit blocked proof.
5. Predictive models remain disabled when they do not beat a simpler evidence-and-invariants baseline on held-out data.
6. Exploration and implementation compression are separate artifacts.
7. Unknown evidence remains Unknown and increases Unsupported.

Continuous-thought, latent-vector, COCONUT, manifold, BFS, Koopman, or similar language may motivate exploration. It is not repository evidence and must not imply that the running model or product implements those mechanisms.

## Product invariants

1. Manager owns identity, assignment, authority, custody, approvals, effects, commercial state, repair, and proof. Hermes reasons and executes only inside those bounds.
2. Identity, ownership, employment, access, authority, payer, beneficiary, and custody remain separate.
3. Consequential work binds exact account, employee, assignment, authority/entitlement, request or work revision, approval, command/effect, provider receipt, accounting receipt, output, and proof.
4. Reconnect and retry never repeat accepted intent or an accepted external effect.
5. Accepted-but-unrecorded outcomes remain ambiguous and reconcile against the original effect identity before retry.
6. Cross-account, stale-assignment, stale-entitlement, stale-approval, duplicate, and reordered requests fail closed.
7. Applied migrations are immutable; additions are forward-only.
8. Public and release claims never exceed exact-candidate evidence.

## Contributor gate

From `mvp-build/`:

```bash
npm ci
npm run hooks:install
npm run repo:rubric -- ./task-contract.json
npm run repo:verify:quick
npm run repo:verify:full
npm run test:unit
```

Run only tests that prove the selected transaction and affected regression surface. Do not create ceremonial tests for rejected candidates, duplicate structural prose checks, or weaken assertions to make CI green.

## Git discipline

Work on the reviewed branch/base, never directly on `main`. Every commit references the task. Stop downstream claims on red exact-head CI. Merge only when source, active program, handoff, PR description, and exact evidence agree.
