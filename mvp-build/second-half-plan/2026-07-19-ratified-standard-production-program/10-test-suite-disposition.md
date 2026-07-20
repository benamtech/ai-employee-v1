# Test Suite Disposition

Status: **active test-authority map; WS-01 normalized; WS-02 protocol contracts integrated**  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
WS-02 implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`

A suite is evidence only for the boundary it exercises.

## Current authoritative suites

| Suite / harness | Authority |
|---|---|
| `test:standard` | Standard, connector registry/setup/binding contracts |
| `test:s10-onboarding` | identity/onboarding source contract |
| `test:lane1-scope` | assignment/authorization scope |
| `test:lane10-evidence` | release-evidence shape, not signed deployed proof |
| `test:production-boundary` | named source/unit authority, streaming, protocol, gateway, topology, workbench contracts |
| `test:ui:contracts` | typed/fixture UI, MCP Apps, AG-UI, operating snapshot contracts |
| `repo:verify:quick/full` | repository governance, typecheck, lint |
| `test:unit` | complete surviving broad regression after shared/database builds |
| `build` | production compilability |
| Main Integration | canonical merge gate: governance/source, broad, build, archaeology, compiled Chromium |

## WS-01 historical normalization

- 63 loader failures were repaired by building workspace dependencies first.
- 27 obsolete pre-ratification suites were removed atomically rather than skipped.
- Three reusable assertions were corrected.
- **106 test files passed** and **613 tests passed** on the WS-01 implementation head.
- No skip list or quarantine was introduced.
- Curated and broad results are independently reported.

## WS-02 current regression

On implementation head `6f792ea`:

- **109 test files / 630 tests passed**;
- Remote MCP metadata/audience/PKCE/state/token custody attacks are covered;
- MCP Apps sandbox/hash/host-method/action projection is covered;
- AG-UI ordering/scope/finite command and streaming source boundaries are covered;
- effective capability freshness/authority/entitlement and MCP pre-dispatch interception are covered;
- the 15-dimensional generator is required to produce exactly 105 pairs and 357 meaningful triples;
- production build, archaeology, and compiled Chromium also passed.

## Useful but incomplete / environment-gated

- integration/worker-migration/local-production harnesses;
- live production-boundary scripts;
- golden work journeys;
- provider, connector, recovery, deployment, and capacity harnesses;
- compiled fixture Web is deterministic regression, not fixture-free channel acceptance.

## Flakiness and blocked evidence

No suite is labeled proven flaky without repeatable exact-environment evidence. Missing provider/host/database/browser prerequisites are `blocked`, not pass. Fix product or harness invariants rather than adding blind retries.

## Preservation rules

- Discovery tests cannot substitute for execution tests.
- Source-order assertions must match invocation boundaries, not imports.
- Under-scoped generated UI remains display-only instead of manufacturing authority.
- A started Hermes run may fall back to polling the same run, never silently create another run.
- Live release claims require exact external evidence beyond these suites.