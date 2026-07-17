# AGENTS.md — Repository Agent Rules

Status: active
Updated: 2026-07-17

## Read order

1. `identity.md`
2. `CODEGRAPH.md`
3. the nearest scoped `AGENTS.md`, `CLAUDE.md`, `CODEGRAPH.md`, and `identity.md`
4. newest relevant memory/handoff
5. source, migrations, scripts, proofs, and tests

When instructions conflict, the narrowest scoped file governs its subtree unless it contradicts verified source or an explicit user instruction.

## Scope routing

- Product/runtime work under `mvp-build/`: read `mvp-build/AGENTS.md`, `mvp-build/CLAUDE.md`, and `mvp-build/CODEGRAPH.md`.
- Holographic website framework work under `GTM-RESEARCH/website-framework/`: read its `identity.md`, `AGENTS.md`, and `CODEGRAPH.md`.
- Public website copy/design: read `docs/amtech-website-rewrite-brief.md`, `docs/AMTECH_WEB_DESIGN_SYSTEM.md`, and `docs/AMTECH_AGENTIC_GENERATIVE_WEB_DESIGN_ADDENDUM.md`.
- Durable product truth: use current source, implementation records, runbooks, GTM strategy, and newest memory rather than stale historical plans.

## Repository invariants

1. Never claim live provider/runtime acceptance without real proof artifacts.
2. Keep the normal AI Employee deployment path intact.
3. Treat the public estimator as outdated and non-canonical.
4. Preserve Start Free, Managed AI Employee from $400, and Workforce custom pricing unless explicitly changed.
5. Keep owner approval at customer, money, reputation, and destructive-action gates.
6. Do not place provider master credentials in employee profiles or runtimes.
7. Do not convert adaptive website research into covert identity profiling, fingerprinting, or sensitive-trait inference.
8. Canonical pages remain complete without personalization, JavaScript, consent, vector infrastructure, or experimentation services.
9. Every generated or adaptive claim must remain bounded by its evidence level.
10. Record validation not run. Source-wired is not live-accepted.

## Working method

- Inspect before editing.
- Prefer the smallest coherent change set that resolves the actual invariant or contradiction.
- Keep schemas, generated artifacts, tests, docs, and memory synchronized.
- Use deterministic generation and versioned manifests for generated content or vectors.
- Benchmark elegant machinery against simpler baselines.
- Fail safely to the canonical baseline.
- Update the nearest CODEGRAPH and durable handoff when architecture or source-of-truth paths change.

## Git discipline

- Work on the user-specified branch.
- Inspect divergence and mergeability before publishing.
- Do not force-update shared branches unless explicitly required and safely backed up.
- Run available static/unit/build checks before merge; document unavailable environment-dependent checks.
- Merge only when the target branch is current, conflicts are resolved, review threads are clear, and no known P0 gate is being hidden.
