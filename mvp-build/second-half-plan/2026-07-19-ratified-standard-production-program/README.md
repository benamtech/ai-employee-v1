# Ratified Standard Production Program

Status: **active and canonical**  
Program state: **WS-01 source/CI closed; WS-02 exact-head repair in progress; WS-03 implementation blocked pending green**  
Gate 0: **resolved for declared source/document/CI scope**  
Updated: 2026-07-20  
Task families: `AMTECH-P0-GOV-001`, `AMTECH-P0-PLAN-003`, `AMTECH-P0-WS01-001`, `AMTECH-P0-WS02-001`, `AMTECH-P0-WS02-002`  
Current merged baseline: `main@1eb8ad82bd76116b6fa20aaf2bfc5647181db366`  
WS-01 evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`  
Last fully green WS-02 implementation ancestor: `6f792eabe44a9ca1e9635fd4fe5329fa7daca6c4`  
Current WS-02 review branch: `agent/ws02-runtime-ui-capability-boundary`

## Authority

This folder is the single active production program. Historical plans remain point-in-time evidence. New work starts on reviewed task branches from current `main`.

## Product target

AMTECH installs governed persistent AI Employees. The Web client behaves like an employee operating environment: durable workspaces, streaming conversation/activity, connected systems, approvals, contextual apps, artifacts, proof, and recovery. Manager remains the authority plane; Hermes remains the reasoning/runtime substrate.

Gmail, QuickBooks, and Stripe are shipped adapters. They are not the connector ontology.

## Current evidence state

- Standard v0.2 is ratified; migration head is `0072`.
- WS-01 broad unit is accepted at **106 files / 613 tests** on its implementation head with no exclusions.
- WS-02 ancestor `6f792ea` passed Standard `29731384034`, Hermes Upstream Review `29731384166`, and Main Integration `29731384039`, including **109 files / 630 tests**, build, archaeology, and compiled Chromium.
- The later documentation head `7736271` failed Standard `29732040184` and Main Integration `29732040197` because this file had deleted the canonical shipped-adapter sentence. Hermes review `29732040182` passed.
- The current branch is repairing that exact-head failure plus assignment-scoped streaming, final MCP authority revalidation, protocol-action version enforcement, and enforceable MCP App CSP. These repairs are unverified until the final exact head passes.
- Caller-supplied provider/profile/model/base URL/API key/header/token/credential/endpoint/routing fields remain denied before dispatch.
- Remote MCP authorization, MCP Apps, AG-UI, effective-capability execution, and streaming Web are source implementations. Their live provider, external-host, connector lifecycle, managed database, and target-runtime acceptance remain open.
- Remote MCP tokens use the current Manager-held encrypted-envelope backend. This is not managed KMS/secret-manager acceptance.
- Live connector authorization, health, staleness, revocation, scope change, outage, repair, and deletion remain `ISS-011`; Phase 1.2 is not release-complete.
- Target-host, managed-platform, fixture-free channels, commercial, recovery, rollback, accessibility, capacity, deployment, pilot, and production acceptance remain open. The product is not launch-cleared.

## Canonical execution route

1. `04-dependency-ordered-production-plan.md` — phased roadmap.
2. `08-production-issue-vector.json`/`.md` — immutable baseline.
3. `13-resolution-ledger.json` — current closure/control state.
4. `09-workstream-execution-map.md` — workstream completion contracts.
5. `10-test-suite-disposition.md` — test authority.
6. `07-verification-and-handoff-matrix.md` — evidence boundary.
7. `14-ws02-runtime-ui-capability-contract.json` — WS-02 task contract.
8. `15-ws02-capability-manifold/` — exhaustive interaction model.
9. `16-ws02-streaming-protocol-source-ci-closure.md` — bounded WS-02 evidence record.

## Current dependency order

1. Phase 1.1 is complete for repository/test source-and-CI scope.
2. Phase 1.2 must regain exact-head green, then complete live connector/protocol acceptance for `ISS-011`.
3. Phase 1.3 may be prepared, but implementation cannot launch until the Phase 1.2 source boundary is green and its database requirements are frozen.
4. Phase 1.4 secret/runtime custody.
5. Phase 1.5 fixture-free owner/channels.
6. Phase 1.6 golden governed work.
7. Phase 1.7 commercial/ambiguity controls.
8. Phase 1.8 recovery/signed release.
9. Phase 1.9 human surfaces/capacity/pilot preparation.
10. Frozen candidate, controlled pilot, measured expansion.

## Stop rules

- Tests are not weakened for green.
- Streaming projection never creates authority or crosses assignment boundaries.
- Browser/model/MCP Apps/AG-UI/connector content cannot mint credentials or choose providers/scopes/hosts/continuations.
- Projected protocol actions must match current Manager-owned assignment and authority version.
- Unknown, stale, revoked, mismatched, or unprobed evidence fails closed.
- Ambiguous consequential outcomes reconcile before retry.
- Source/fixture evidence cannot satisfy live release gates.
