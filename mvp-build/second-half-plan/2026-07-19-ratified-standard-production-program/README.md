# Ratified Standard Production Program

Status: **active and canonical**  
Program state: **WS-01 source/CI closed; WS-02 streaming/protocol source/CI accepted; live connector acceptance open**  
Gate 0: **resolved for declared source/document/CI scope**  
Updated: 2026-07-20  
Task families: `AMTECH-P0-GOV-001`, `AMTECH-P0-PLAN-003`, `AMTECH-P0-WS01-001`, `AMTECH-P0-WS02-001`, `AMTECH-P0-WS02-002`  
Planning integration baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`  
Current merged implementation baseline: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
WS-02 protocol implementation evidence head: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`

## Authority

This folder is the single active production program. Historical plans remain point-in-time evidence. New work starts on reviewed task branches from current `main`.

## Product target

AMTECH installs governed persistent AI Employees. The Web client behaves like an employee operating environment: durable workspaces, streaming conversation/activity, connected systems, approvals, contextual apps, artifacts, proof, and recovery. Manager remains the authority plane; Hermes remains the reasoning/runtime substrate.

## Current evidence state

- Standard v0.2 is ratified; migration head is `0072`.
- WS-01 broad unit: **106 files / 613 tests** on its implementation head; no exclusions.
- Current WS-02 implementation head passed **109 files / 630 tests**, governance/type/lint, named source/UI/protocol suites, build, archaeology, and compiled Chromium.
- Exact implementation workflows: Standard `29731384034`, Hermes Upstream Review `29731384166`, Main Integration `29731384039`.
- Caller-supplied provider/profile/model/base URL/API key/header/token/credential/endpoint/routing fields remain denied before dispatch.
- Hermes deltas and safe activity stream immediately. A dropped established event stream polls the same run rather than recreating work.
- Remote MCP authorization, MCP Apps host conformance, AG-UI replay mapping, and effective-capability execution custody are source/CI implemented. Their live provider/external-host acceptance is still open.
- Remote protected-resource and authorization-server metadata, exact audience, redirect, scopes, S256 PKCE, state, and sealed Manager token custody are enforced by deterministic contracts.
- MCP Apps use negotiated `ui://` resources, opaque-origin sandboxing, content hashes, no direct network, bounded JSON-RPC, and current authority projection. Under-scoped views remain useful but display-only.
- AG-UI projects assignment/version-bound RUN/TEXT/STATE/ACTIVITY events and accepts only finite commands that return through existing Manager approval/message boundaries.
- `tools/list` remains broad discovery. `tools/call` requires current credential, assignment, policy/version, entitlement, connector binding/probe freshness, and persisted effective-capability evidence.
- The WS-02 capability manifold contains **105 pairwise + 357 meaningful triple-wise = 462** complete candidates.
- Live connector authorization, health, staleness, revocation, scope change, outage, repair, and deletion remain `ISS-011`; Phase 1.2 is therefore not release-complete.
- Target-host, managed-platform, fixture-free channels, commercial, recovery, rollback, accessibility, capacity, deployment, pilot, and production acceptance remain open. The product is not launch-cleared.

## Canonical execution route

1. `04-dependency-ordered-production-plan.md` — phased roadmap.
2. `08-production-issue-vector.json`/`.md` — immutable baseline.
3. `13-resolution-ledger.json` — current closure/control state.
4. `09-workstream-execution-map.md` — workstream completion contracts.
5. `10-test-suite-disposition.md` — test authority.
6. `07-verification-and-handoff-matrix.md` — evidence boundary.
7. `14-ws02-runtime-ui-capability-contract.json` — task contract.
8. `15-ws02-capability-manifold/` — exhaustive interaction model.
9. `16-ws02-streaming-protocol-source-ci-closure.md` — implementation closure and remaining live gates.

## Current dependency order

1. Phase 1.1 complete for source/CI.
2. Phase 1.2 source/CI implementation accepted for ISS-007–ISS-010; execute ISS-011 live connector/protocol acceptance.
3. Phase 1.3 database authority.
4. Phase 1.4 secret/runtime custody.
5. Phase 1.5 fixture-free owner/channels.
6. Phase 1.6 golden governed work.
7. Phase 1.7 commercial/ambiguity controls.
8. Phase 1.8 recovery/signed release.
9. Phase 1.9 human surfaces/capacity/pilot preparation.
10. Frozen candidate, controlled pilot, measured expansion.

## Stop rules

- Tests are not weakened for green.
- Streaming projection never creates authority.
- Browser/model/MCP Apps/AG-UI/connector content cannot mint credentials or choose providers/scopes/hosts/continuations.
- Unknown, stale, revoked, mismatched, or unprobed evidence fails closed.
- Ambiguous consequential outcomes reconcile before retry.
- Source/fixture evidence cannot satisfy live release gates.