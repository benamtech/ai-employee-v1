# AGENTS.md — Repository Agent Rules

Status: active
Updated: 2026-07-18

## Read order

1. `identity.md`
2. `CODEGRAPH.md`
3. the nearest scoped `AGENTS.md`, `CLAUDE.md`, and `CODEGRAPH.md`
4. newest relevant handoff, with `mvp-build/memory/MEMORY.md` read newest-first for product work
5. `mvp-build/STANDARD.md` and the active execution plan for production-boundary work
6. source, migrations, scripts, tests, proofs, and release records

Verified source and proof outrank stale documentation. The narrowest scoped instruction governs its subtree unless it conflicts with source truth or an explicit user instruction.

## Scope routing

- AI Employee product/runtime work: `mvp-build/`.
- Product and implementation history: `wiki/`, with current implementation state verified against `mvp-build/`.
- Cross-repository marketing-site framework work is not part of this repository. It lives independently in `benamtech/hyper-site`; do not recreate `GTM-RESEARCH/website-framework/` here.
- The public estimator is an outdated, non-canonical acquisition/regression surface.

## Repository invariants

1. Preserve the canonical normal-employee deployment path.
2. Never claim live, provider, runtime, browser, channel, commercial, migration, capacity, recovery, or release acceptance without exact proof bound to the tested SHA.
3. Every consequential customer-work path resolves an authenticated principal plus explicit assignment or approved platform/system context.
4. Account membership, bearer possession, caller-selected IDs, mutable headers, and phone ownership are never complete authority.
5. Customer-, money-, reputation-, credential-, and destructive actions use assignment-aware approval and durable receipts.
6. Provider master credentials never enter employee profiles or employee runtimes.
7. Consequential success without a matching durable accepted receipt is forbidden; ambiguity remains durable and repairable.
8. Preserve Start Free, Managed AI Employee from $400, and Workforce custom pricing unless explicitly changed.
9. Voice is a future extension, not a launch acceptance gate. Current governed surfaces are web, SMS, signed review, and connected-system events.
10. Keep docs, migrations, contracts, tests, proofs, memory, and release claims synchronized.

## Working method

- Inspect before editing.
- Correct the acceptance contract before implementing against it.
- Prefer the smallest coherent change that closes an invariant without hiding a failed gate.
- Adapt existing Manager, Hermes, reconciler, inbox, provider, and UI machinery to shared contracts rather than building parallel platforms.
- Record what was not validated. Source-wired is not production-ready.
- Update the nearest CODEGRAPH and durable handoff when architecture, authority, branch state, or source-of-truth paths change.

## Git discipline

- Work on the explicitly selected branch; preserve `main` unless the user explicitly directs otherwise.
- Keep specialist lanes narrow and merge them through the integration branch.
- Do not force-update shared branches without explicit approval and a safe recovery path.
- Merge only when the target is current, conflicts are resolved, required checks pass, and no P0/P1 gate is being hidden.
