# CODEGRAPH.md — AMTECH AI Employee repository map

Status: active  
Updated: 2026-07-20  
Current merged baseline: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-02 protocol implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`

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

AMTECH installs persistent AI Employees. Manager is the labor control plane; Hermes is the reasoning/runtime substrate. The Web client is an employee operating environment: persistent workspaces, streaming conversation/activity, connected systems, approvals, artifacts, proof, and recovery—not a thin chat wrapper.

The durable moat is assignment → work object → capability → approval → effect → receipt → recovery → commercial proof. MCP, MCP Apps, AG-UI, OAuth, providers, models, and SaaS systems are replaceable mechanisms.

## Canonical execution boundary

```text
trigger
→ authenticated principal
→ exact assignment/current authority version
→ durable intent/work object
→ Hermes reasoning or deterministic Manager work
→ broad discovery + current effective-capability execution check
→ approval when required
→ one idempotent effect reservation
→ accepted | failed | ambiguous receipt
→ replay/reconciliation/repair
→ role-safe streaming and durable projection
```

## Current evidence headline

- WS-01 and Model Gateway authority merged through PR `#30`.
- WS-02 implementation head `6f792ea` passed Standard `29731384034`, Hermes review `29731384166`, and Main Integration `29731384039`.
- Broad regression on that head: **109 files / 630 tests**, no exclusions.
- Streaming-first Hermes text/activity, assignment/version-scoped Work Stream, first-party AG-UI SSE, finite protocol actions, Remote MCP discovery/PKCE/state/audience contracts, sealed token custody, MCP Apps sandbox/hash/bridge, and MCP execution effective-capability interception are source/CI accepted.
- The 15-dimensional manifold contains 105 pairs + 357 meaningful triples = 462 complete candidates.
- Migration head remains `0072`; Hermes pin remains unchanged.
- Live remote MCP/provider authorization, connector revocation/outage/repair/deletion, external host conformance, managed database, target host, fixture-free channels, commercial, recovery, deployment, pilot, and production acceptance remain open.

## Repository boundary

- `mvp-build/` — product implementation, contracts, migrations, Hermes/Manager/Web, connectors, tests, deployment, proof, Standard, active program.
- `wiki/` — historical research/records, not current implementation authority.
- `docs/` — supporting product/design documents.
- `.github/workflows/` — governance, integration, Hermes intelligence, and release gates.

## Core invariants

1. Manager owns authority; Hermes reasons within bound capabilities.
2. Capability discovery is broad; execution custody is conservative and evidence-backed.
3. Streaming presentation does not wait on effect authority, but commands/effects do.
4. Browser, MCP Apps, AG-UI, models, and connector payloads cannot mint credentials or select providers/scopes/hosts/authority versions.
5. Provider and connector secrets remain Manager-held.
6. Generated UI and shared state are presentation, not authority.
7. Stable retries do not duplicate effects; ambiguous outcomes reconcile first.
8. Exact-candidate evidence controls release claims.
9. Production-ready requires every non-waivable gate on one signed deployed SHA.