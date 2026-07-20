# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active  
Updated: 2026-07-20  
Current merged baseline: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Hardened WS-02 implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`

## Cold-session read order

1. `identity.md`
2. root `AGENTS.md`/`CLAUDE.md`, `CONTRIBUTING.md`, this file
3. scoped `mvp-build/AGENTS.md`/`CLAUDE.md` and `mvp-build/CODEGRAPH.md`
4. ratified `mvp-build/STANDARD.md`
5. single active production program
6. newest indexed memory handoff
7. architecture index
8. relevant source, migrations, tests, workflows, proof, and diff

Authority order: deployed proof → applied durable state → executable source/config → exact-SHA tests → Standard/program → CODEGRAPH/architecture → memory → history.

## Product boundary

AMTECH installs persistent AI Employees. Manager is the labor control plane; Hermes is the reasoning/runtime substrate. The Web client is an employee operating environment: persistent workspaces, streaming conversation/activity, connected systems, approvals, contextual apps, artifacts, proof, and recovery.

The durable moat is assignment → work object → capability → approval → effect → receipt → recovery → commercial proof. MCP, MCP Apps, AG-UI, OAuth, providers, models, and SaaS systems are replaceable mechanisms.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment/current policy/current authority version
→ durable intent/work object
→ Hermes reasoning or deterministic Manager work
→ broad discovery + final current effective-capability execution check
→ approval when required
→ one idempotent effect reservation
→ accepted | failed | ambiguous receipt
→ replay/reconciliation/repair
→ role-safe streaming and durable projection
```

## Current evidence headline

- WS-01 remains accepted at **106 files / 613 tests**.
- WS-02 implementation head `16dc18e` passed Standard `29735429854`, Hermes review `29735429873`, and Main Integration `29735429859`.
- Broad regression: **110 files / 635 tests**, with source/type/lint/contracts, build, archaeology, and compiled Chromium green.
- Owner-visible progress is account/employee/assignment scoped; legacy unscoped progress fails closed to durable-only visibility.
- MCP credential verification is followed by final current assignment-policy and authority-version reads before dispatch.
- MCP Apps use content-bound `ui://` resources, opaque origin, enforceable document CSP, finite host methods, and protocol-action mediation.
- AG-UI is assignment/version-scoped ordered projection; client commands re-enter existing Manager approval/message boundaries.
- The 15-dimensional manifold contains 105 pairs + 357 meaningful triples = 462 candidates.
- `ISS-007`–`ISS-010` are source/CI resolved; `ISS-011` live connector/provider and external host lifecycle remains open.
- WS-03 P0 is prepared in active-program documents `17` and `18`; implementation waits for PR `#31` to merge or be formally superseded.
- Migration head remains `0072`; Hermes pin remains unchanged.
- Managed database, target host, fixture-free channels, commercial, recovery, deployment, pilot, and production acceptance remain open.

## Repository ownership boundary

- root authority files remain path-stable because governance and contributor tooling addresses them directly;
- `mvp-build/` owns executable product, Standard, current program, architecture, memory, tests, deployment, and proof;
- `wiki/` owns strategy/research/history, not current implementation authority;
- `.github/workflows/` owns exact-head merge/release verification.

## Core invariants

1. Manager owns authority; Hermes reasons within bound capabilities.
2. Discovery is broad; execution is re-derived from current evidence before dispatch.
3. Streaming presentation does not wait on effect authority, but commands/effects do.
4. Browser, MCP Apps, AG-UI, models, and connector payloads cannot mint credentials or select providers/scopes/hosts/authority versions.
5. Provider and connector secrets remain Manager-held.
6. Generated UI and shared state are presentation, not authority.
7. Stable retries do not duplicate effects; ambiguous outcomes reconcile first.
8. Applied migrations are immutable; WS-03 additions are forward-only.
9. Exact-candidate evidence controls release claims.
10. Production-ready requires every non-waivable gate on one signed deployed SHA.
