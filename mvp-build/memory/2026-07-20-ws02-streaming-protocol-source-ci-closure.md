# 2026-07-20 — WS-02 streaming and protocol source/CI closure

Repository: `benamtech/ai-employee-v1`  
Branch: `agent/ws02-runtime-ui-capability-boundary`  
PR: `#31`  
Base: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
Implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`

## Purpose and invariant

Complete the source/CI part of WS-02 while making the Web experience streaming-first and more useful than terminal-only interaction. Manager remains non-bypassable authority; Hermes, Web, MCP Apps, AG-UI, and connectors remain reasoning/presentation/transport mechanisms.

## Before

Manager consumed Hermes SSE but buffered assistant text until completion. Web received activity verbs only. MCP Apps was compatibility iframe machinery without official host metadata/action binding. AG-UI was architecture-level analogy, not an HTTP transport. Effective capability omitted authority/freshness/entitlement at the execution boundary. Remote protected MCP authorization and sealed token custody were absent.

## After

- text deltas, safe activity, and run completion stream immediately;
- same-run polling prevents duplicate work after stream loss;
- stream frames carry assignment/current authority version;
- Web has a durable employee workspace plus live run console;
- Remote MCP metadata/audience/redirect/PKCE/state/token custody fail closed;
- MCP Apps are negotiated, hash-bound, opaque-origin, networkless, finite-intent resources;
- AG-UI has ordered mapping, first-party SSE, drift termination, finite action bridge;
- effective capability is persisted and gates MCP execution before tool dispatch;
- deterministic manifold enumerates 105 pairs and 357 meaningful triples.

## Exact verification

- Standard/governance `29731384034` — success.
- Hermes Upstream Review `29731384166` — success; production pin unchanged.
- Main Integration `29731384039` — success: broad 109 files / 630 tests, source contracts, build, archaeology, compiled Chromium.

## Evidence state

ISS-007, ISS-008, ISS-009, and ISS-010 are `source_ci_resolved`. ISS-011 remains open because no live connector/provider lifecycle packet was produced. No managed-database, target-host, fixture-free channel, commercial, recovery, deployment, pilot, or production claim is made.

## Material diagnostics

Type propagation, Bearer challenge parsing, obsolete source-order/MCP-UI assertions, and connector-native write limitations were repaired without weakening current authority. One accidental partial UI test rewrite was detected and the complete authoritative suite was restored before proceeding.

## Next move

Execute live generic remote MCP and shipped connector lifecycle matrices: authorization, health, staleness, revocation, scope change, outage, repair, deletion, receipt/reconciliation. Then enter WS-03 database authority.