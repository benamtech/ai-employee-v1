# Test Suite Disposition

Status: **active test-authority map; WS-01 normalized; hardened WS-02 source/CI accepted**  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Hardened WS-02 implementation evidence head: `16dc18e0535ac14f867875989dfe5aee596f89c0`

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
- In governance vocabulary, obsolete suites were removed atomically rather than skipped.
- Three reusable assertions were corrected.
- **106 test files passed** and **613 tests passed** on the WS-01 implementation head.
- No skip list or quarantine was introduced.
- Curated and broad results are independently reported.

## Hardened WS-02 regression boundary

On implementation head `16dc18e`:

- **110 test files / 635 tests passed**;
- Standard/governance `29735429854`, Hermes Review `29735429873`, and Main Integration `29735429859` passed;
- source/type/lint/contracts, production build, repository archaeology, and compiled Chromium passed;
- Remote MCP metadata/audience/PKCE/state/token-custody attacks were covered;
- owner-visible progress isolation was tested across two assignments sharing one employee;
- MCP Apps sandbox/hash/document-CSP/host-method/action projection was covered;
- MCP App intents were proven to route through the protocol-action and current Manager assignment/version checks;
- AG-UI ordering/scope/finite command, stable failure projection, and streaming source boundaries were covered;
- effective capability freshness/entitlement plus final current assignment-policy/authority-version revalidation was covered;
- the 15-dimensional generator produced exactly 105 pairs and 357 meaningful triples;
- no current assertion was weakened to achieve green.

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
- A started Hermes run may poll the same run after stream loss, never silently create another run.
- Unscoped progress producers may not broadcast owner-visible live state.
- Live release claims require exact external evidence beyond these suites.
