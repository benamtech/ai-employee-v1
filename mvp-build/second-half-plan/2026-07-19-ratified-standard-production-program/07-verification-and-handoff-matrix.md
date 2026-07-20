# Verification and Handoff Matrix

Status: **active evidence checklist; WS-01 normalized and provider-authority lock accepted for source/CI**  
Current integration baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`  
Implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Task families: `AMTECH-P0-WS01-001`, `AMTECH-P0-WS02-001`

## Gate matrix

| Gate | Required verification | Accepted evidence | Current state |
|---|---|---|---|
| Ratified Standard, plan, and governance | Standard/governance/type/lint workflow | `29725298168` on `1460960` | accepted for implementation source/document scope |
| Hermes gateway/profile review | path-aware pinned-baseline check | `29725298172` on `1460960` | accepted; pin unchanged |
| Ordered typecheck/lint/source hygiene | `npm run repo:verify:full` | Main Integration `29725298163` | accepted |
| Current authority/source contracts | onboarding, assignment, release, production, UI suites | Main Integration `29725298163` | accepted for named source/unit contracts |
| Broad unit regression | complete surviving Vitest aggregate after workspace builds | Main Integration `29725298163` | **accepted: 106 files / 613 tests** |
| Production build | workspace build | Main Integration `29725298163` | accepted for compilability |
| Repository archaeology | exact-head archaeology artifacts | Main Integration `29725298163` | accepted |
| Compiled browser regression | production-compiled Chromium fixture matrices | Main Integration `29725298163` | accepted as fixture regression, not fixture-free acceptance |
| Provider-authority lock | alias-only request, registered host-private route, forbidden routing fields, durable policy binding | `model-gateway-http-isolation.test.ts` in broad and production suites | accepted for source/CI boundary |
| Database platform release | full PostgreSQL matrix plus triggered disposable Supabase proof | migration/advisor/behavior packet | open |
| Target-host runtime | five-service and two-employee isolation/lifecycle harness | exact host/image/network packet | open |
| Remote MCP / MCP Apps / AG-UI | authorization profile, sandbox bridge, replay mapping, effective capability truth | protocol/provider/browser packet | open |
| Live connector lifecycle | authorization, health, revocation, staleness, outage, repair, deletion | provider/browser packet | open |
| Fixture-free owner/channels | real identity/assignment, Web/SMS/Review parity and failure matrix | exact session/work/proof IDs | open |
| Golden work | provider-backed approval/effect/receipt/parity/refinding/replay | provider/effect/accounting/proof IDs | open |
| Commercial controls | budget reservation, shared rate, ambiguity, payer/beneficiary/invoice reconciliation | concurrency/provider/billing packet | open |
| Recovery/rollback | crash injection, repair, backup/restore, exact rollback | recovery packet | open |
| Human surface | supported browsers, WCAG 2.2 AA, visual and recovery UX | exact candidate reports | open |
| Capacity/pilot | declared 1/10/100/250/500/700 envelopes and pilot packet | load, cost, fairness, incident evidence | open |
| Signed release/deployment | SBOM, in-toto/SLSA provenance, digests, migration/config hashes, verifier | signed exact-candidate manifest | open |

## WS-01 failure and repair evidence

Initial canonical run `29724969995` reached executable source and exposed:

- 63 loader failures from missing workspace dependency builds;
- 27 obsolete pre-assignment/account-owned/direct-provider test files;
- three reusable source-contract assertions requiring current names and topology.

Repairs:

- `test:unit` builds shared and database workspaces before Vitest;
- obsolete suites were deleted atomically, not excluded;
- reusable assertions were corrected;
- Main Integration owns the broad pull-request gate;
- the Standard workflow no longer duplicates broad/build execution or historical branch triggers.

The replacement head `1460960` passed all implementation gates in Main Integration run `29725298163`.

## Provider-authority lock evidence

- runtime requests may name only the stable AMTECH alias;
- Manager-owned `model-provider-registry.ts` resolves registered provider identity, endpoint, master API key, and upstream model;
- endpoint is HTTPS except explicit loopback development;
- provider and upstream model must be included in signed allowed policy;
- signed claims must match the current durable credential row;
- caller-supplied provider/profile/model/base URL/API key/headers/token/credential/endpoint/routing fields are rejected and audited before fetch;
- production legacy unbound routes remain absent.

This does not establish remote MCP authorization, MCP Apps, AG-UI, live connector, provider, or target-host acceptance.

## Test evidence rules

- Broad and curated suites are independently reported.
- Fixture browser proof is not fixture-free provider/channel proof.
- Local PostgreSQL proof is not managed-platform proof when a Standard trigger applies.
- Environment-gated checks state `skipped` or `blocked`; neither becomes pass.
- A documentation commit after an evidence run does not inherit exact-head acceptance; final PR-head checks rerun after this transaction.

## Completion rules

- WS-01 is complete for repository/test source-and-CI scope when the final documentation head remains green.
- The WS-02 provider-authority manufacture surface is locked for source/CI scope.
- Remote protocol, live connector, database, runtime, commercial, recovery, human-surface, capacity, deployment, and production gates remain open.
- Production-ready still requires every non-waivable gate on one exact signed deployed release.
