# AGENTS.md — Repository Agent Rules

Status: active  
Updated: 2026-07-19

## Mandatory read order

1. `identity.md`
2. this file or `CLAUDE.md`
3. root `CODEGRAPH.md`
4. the nearest scoped `AGENTS.md`, `CLAUDE.md`, and `CODEGRAPH.md`
5. `mvp-build/memory/MEMORY.md`, then the newest relevant handoff for product work
6. `mvp-build/STANDARD.md` and the active execution plan for production-boundary work
7. `mvp-build/docs/architecture/README.md`
8. `mvp-build/docs/architecture/11-agent-orientation-and-role-map.md`
9. relevant UX, deployment, source, migrations, scripts, tests, proofs, release records, and current branch diff

Verified source, applied migrations, executable proof, and newest scoped memory outrank stale prose. The narrowest scoped instruction governs its subtree unless it conflicts with source truth or an explicit user instruction.

## Scope routing

- AI Employee product/runtime work: `mvp-build/`.
- Current cross-system architecture, risks, and agent roles: `mvp-build/docs/architecture/`.
- Owner UX doctrine and research disposition: `mvp-build/docs/ux/`.
- Durable session handoffs: `mvp-build/memory/`, indexed only by `mvp-build/memory/MEMORY.md`.
- Historical factual implementation records: `wiki/MVP/implementation-records/`.
- Product and implementation rationale: `wiki/`, verified against current `mvp-build/` source and proof.
- Cross-repository marketing-site framework work lives in `benamtech/hyper-site`; do not recreate it here.
- The public estimator is an outdated, non-canonical acquisition/regression surface.

## Current integration boundary

- Integration branch: `employee-production-tuesday`.
- Base: `research`.
- Draft integration PR: `#23`.
- Migration head: `0069`.
- `main` is not an integration or production shortcut.
- Source/CI progress does not imply real Supabase, runtime, provider, browser/channel, commercial, capacity, recovery, rollback, deployment, or launch acceptance.

Use root/scoped CODEGRAPH and the newest handoff for the exact current proof anchor and workflow IDs.

## Repository invariants

1. Preserve the canonical normal-employee deployment path.
2. Never claim live, provider, runtime, browser, channel, commercial, migration, capacity, recovery, or release acceptance without exact proof bound to the tested and deployed SHA.
3. Every consequential customer-work path resolves an authenticated principal plus explicit assignment or approved platform/system context.
4. Account membership, bearer possession, caller-selected IDs, mutable headers, and phone ownership are never complete authority.
5. Customer-, money-, reputation-, credential-, and destructive actions use assignment-aware approval and durable receipts.
6. Provider master credentials never enter employee profiles or employee runtimes.
7. Consequential success without a matching durable accepted receipt is forbidden; ambiguity remains durable and repairable.
8. Hermes remains the agent/runtime substrate; Manager owns authority, command/effect, custody, commercial provenance, repair, and proof.
9. Generated UI and adaptive layout are presentation systems, not independent authority or hidden psychographic engines.
10. Preserve Start Free, Managed AI Employee from $400, and Workforce custom pricing unless explicitly changed.
11. Voice is a future extension, not a launch gate. Current governed surfaces are web, SMS, signed review, and connected-system events.
12. Keep docs, migrations, contracts, tests, proofs, memory, plan/vector state, PR state, and release claims synchronized.

## Working method

- Inspect before editing.
- State one primary coding-agent role and the interacting subsystems for substantial work; use the role map in `mvp-build/docs/architecture/11-agent-orientation-and-role-map.md`.
- Correct a flawed acceptance contract before implementing against it.
- Prefer the smallest coherent change that closes an invariant without hiding a failed gate.
- Adapt existing Manager, Hermes, reconciler, inbox, provider, provisioning, commercial, and UI machinery to shared contracts rather than building parallel platforms.
- Treat trajectory artifacts as dependency and bifurcation review aids only. They never establish runtime behavior, authority, or acceptance.
- Record what was not validated. `source-wired` is not `production-ready`.
- Update the nearest CODEGRAPH and durable handoff when architecture, authority, branch state, source-of-truth paths, or production risk changes.

## Document and memory discipline

- Root `CODEGRAPH.md` owns repository-level routing and current integration headline.
- `mvp-build/CODEGRAPH.md` owns current implementation topology, migration head, proof boundary, and next dependency gates.
- `mvp-build/memory/MEMORY.md` is the sole handoff index; keep it newest-first.
- `mvp-build/docs/architecture/12-document-control-memory-and-handoff-map.md` defines all document families and update transactions.
- Historical handoffs and implementation records remain point-in-time evidence; do not silently rewrite them into current state.
- Do not physically move Markdown evidence files without rewriting every inbound reference and retaining an archive/index path.

## Git discipline

- Work on the explicitly selected branch; preserve `main` unless the user explicitly directs otherwise.
- Keep specialist lanes narrow and merge through the integration branch.
- Do not force-update shared branches without explicit approval and a safe recovery path.
- Merge only when the target is current, conflicts are resolved, required checks pass, documentation/proof is synchronized, and no P0/P1 gate is hidden.
