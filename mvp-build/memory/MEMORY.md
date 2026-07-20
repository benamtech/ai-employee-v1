# mvp-build durable memory — index and writing protocol

Status: active  
Updated: 2026-07-20

This folder is the versioned narrative handoff layer for AMTECH AI Employee implementation. It records what changed, why, exact proof, unresolved risks, and the next agent's starting point.

## Knowledge layers

- `memory/` — dated narrative decisions, incidents, unresolved risks, and handoffs.
- `../CODEGRAPH.md` — current implementation topology, migration head, source hubs, and evidence boundary.
- `../STANDARD.md` — ratified normative product and engineering requirements.
- `../second-half-plan/` — one active production program plus historical plan families.
- `../docs/architecture/` — explanatory cross-system structure and research disposition.
- `../../wiki/MVP/implementation-records/` — historical factual implementation/proof ledger.
- source, migrations, tests, workflows, proof, merged PRs, and the current task PR — implementation and acceptance authority.

`MEMORY.md` is the sole index for this folder. Do not create another handoff index.

## Current branch note

- Current integration baseline: `main@816aae325401a8d8d4bc7ffe90e8f241eb977ba8`.
- PR `#29` merged the post-cutover roadmap transaction.
- WS-01/WS-02 implementation evidence head: `1460960f415fafc20582313b1dd2117b781a63f7`.
- New work starts on reviewed task branches from current `main`.
- Cutover and `research` branches are historical context.
- Migration head: `0072` at `../packages/db/migrations/0072_artifact_revision_scope_guards.sql`.
- Standard v0.2 is ratified and effective.
- Active program: `../second-half-plan/2026-07-19-ratified-standard-production-program/`.
- WS-01 is source/CI accepted: broad unit passes 106 files / 613 tests under the canonical merge gate.
- The WS-02 provider-authority manufacture surface is source/CI accepted: Manager alone resolves registered model provider routing and credentials.
- Remaining WS-02 remote MCP, MCP Apps, AG-UI, effective-capability, and live connector lifecycle gates are open.
- Implementation head passed Ratified Standard `29725298168`, Hermes Upstream Review `29725298172`, and Main Integration Gates `29725298163`.

Current source/CI must not be promoted into managed-database, target-runtime/network, live identity/provider/connector, MCP Apps/AG-UI conformance, fixture-free Web/SMS/Review, commercial, capacity, crash/repair, rollback, deployment, pilot, or production acceptance.

## Read order inside memory

1. Read root/scoped CODEGRAPH, ratified Standard, active program, and architecture first.
2. Read the newest handoff relevant to the subsystem.
3. Read predecessor handoffs only when they explain an inherited decision, incident, or proof.
4. Verify every carried-forward claim against current source and exact-head evidence.
5. Do not concatenate every historical handoff into one undifferentiated prompt.

The complete family map is `../docs/architecture/12-document-control-memory-and-handoff-map.md` and the active archive routing is `../second-half-plan/2026-07-19-ratified-standard-production-program/06-document-authority-and-archive-map.md`.

## Index — newest first

### Current WS-01/WS-02 and post-merge production boundary

- [2026-07-20 — WS-01 green and WS-02 provider-authority lock](2026-07-20-ws01-green-ws02-provider-authority-lock.md) — Current implementation handoff. Records broad-suite diagnosis, workspace-loader repair, atomic deletion of 27 obsolete suites, 106-file/613-test success, canonical CI de-bloat, Manager-only provider routing, caller-field denial, durable credential-policy binding, Hermes review, exact workflow evidence, and remaining protocol/live gates.
- [2026-07-20 — Post-merge roadmap CI closure](2026-07-20-post-merge-roadmap-ci-closure.md) — Historical planning evidence companion for PR `#29`. Retains the initial stable-status contract failure and the non-weakening fix.
- [2026-07-20 — Post-merge production roadmap reconciliation](2026-07-20-post-merge-production-roadmap-reconciliation.md) — Historical planning handoff. Records the baseline 38-issue vector, nine workstreams, initial test-suite disposition, Phases 1.1–1.9, and then-open broad suite.
- [2026-07-20 — Standard v0.2 ratification and protocol reorientation](2026-07-20-standard-v0.2-ratification-and-protocol-reorientation.md) — Ratification/cutover predecessor. Records human ratification, the 16-dimensional evolution vector, managed connector manifest, exact provider-tool ownership, direct-MCP default deny, MCP Apps/AG-UI disposition, database TDD boundary, and Gate 0 workflow matrix. Its branch/current-plan coordinates are superseded.
- [2026-07-20 — Capability surface CI closure and production next plan](2026-07-20-capability-surface-ci-closure-and-next-plan.md) — Historical immediate predecessor. Records capability nullability repair, strict-read/migration acceptance corrections, migration `0072`, and predecessor plan packet.
- [2026-07-19 — Final document authority, infra/test audit, and production handoff](2026-07-19-final-document-authority-infra-test-production-handoff.md) — Historical predecessor. Its `0069` and legacy-selector claims are superseded.
- [2026-07-19 — Repository archaeology, architecture, production trajectories, and agent orientation](2026-07-19-repository-archaeology-architecture-and-agent-orientation.md) — Repository-wide documentation/code-review checkpoint.
- [2026-07-19 — Hermes/WebUI research and UI congruence pass](2026-07-19-hermes-webui-ui-congruence-pass.md) — Historical Hermes/MCP/UI predecessor; official MCP Apps disposition is now in architecture document 16.
- [2026-07-19 — UI, Hermes, roles, assignments, and production-readiness handoff](2026-07-19-ui-runtime-production-readiness-handoff.md) — Historical UI/runtime/role/session analysis.
- [2026-07-18 — S2–S9 authority and runtime-boundary checkpoint](2026-07-18-s2-s9-authority-runtime-checkpoint.md) — Authority/runtime predecessor.

### Standard remediation and integration history

- [2026-07-18 — CI-green production plan digest](2026-07-18-ci-green-plan-digest.md)
- [2026-07-18 — Lane 1 scope inventory and Lane 10 evidence spine](2026-07-18-lane1-scope-lane10-evidence-spine.md)
- [2026-07-18 — Lane 3 integration and repository-boundary cleanup](2026-07-18-lane3-integration-and-repository-boundary-cleanup.md)
- [2026-07-18 — Standard remediation checkpoint](2026-07-18-standard-remediation-lane1-lane3-handoff.md)
- [2026-07-18 — AMTECH Phase 2 Standard Enforcement Audit](2026-07-18-amtech-phase-2-standard-enforcement-audit.md)
- [2026-07-18 — AMTECH Standard v0.1 Draft 2](2026-07-18-amtech-standard-v0.1-draft-2.md) — Historical draft; ratified `../STANDARD.md` v0.2 is current.

### Runtime, deployment, event, and production-boundary history

- [2026-07-17 — Employee-work production-boundary reconciler pass](2026-07-17-employee-work-production-boundary-reconciler-pass.md)
- [2026-07-17 — Production next sequence and generative UI reconciliation](2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md)
- [2026-07-17 — WS1/WS2 documentation reconciliation and website frontier](2026-07-17-ws1-ws2-documentation-reconciliation-and-website-frontier.md)
- [2026-07-16 — WS1/WS2 production boundary pass](2026-07-16-ws1-ws2-production-boundary-pass.md)
- [2026-07-16 20:00 — Production overlay system](2026-07-16-2000-prod-env-overlay-system.md)
- [2026-07-16 16:45 — Documentation freeze and reconciliation](2026-07-16-1645-documentation-freeze-reconciliation.md)
- [2026-07-16 13:23 — Web runtime recovery](2026-07-16-1323-web-message-runtime-recovery.md)
- [2026-07-16 08:12 — Owner resource safety and xAI runtime proof](2026-07-16-0812-owner-resource-safety-and-xai-runtime-proof.md)
- [2026-07-16 07:19 — Twilio webhook and API tunnel fix](2026-07-16-0719-provisioner-twilio-webhook-and-api-tunnel-fix.md)
- [2026-07-16 05:38 — Full live production run handoff](2026-07-16-0538-provisioner-failure-live-production-handoff.md)
- [2026-07-16 03:35 — Production normal-employee runbook default](2026-07-16-0335-production-normal-employee-runbook-default-handoff.md)

### UX and engineering-method history

- [2026-07-17 01:45 — Leverage and method distilled](2026-07-17-0145-leverage-and-method-distilled.md)
- [2026-07-17 01:30 — Final documentation sync](2026-07-17-0130-final-doc-sync-complete.md)
- [2026-07-17 00:30 — First-principles Web surface redesign](2026-07-17-0030-prod-ux-branch-start.md)

Older handoffs remain historical evidence. Read them only after current source, ratified Standard, active plan, CODEGRAPH/architecture, this index, and the newest relevant handoff.

## Status vocabulary

- `planned` — designed, not implemented.
- `research-specified` — research and validation design exist.
- `source-wired` — source/schema/config exists; name checks run.
- `locally-proven` — deterministic local/fixture proof passed.
- `ci-accepted` — named exact-SHA CI gate passed.
- `database-accepted` — required disposable/staging database behavior proof passed.
- `runtime-accepted` — exact target-host runtime/network proof exists.
- `provider-accepted` — real provider proof IDs/receipts exist.
- `browser/channel-accepted` — fixture-free supported-channel proof exists.
- `commercial-accepted` — usage/cost/payer/beneficiary/invoice reconciliation passed.
- `live-accepted` — canonical deployed end-to-end behavior passed.
- `production-ready` — every non-waivable Standard gate passes on the exact signed deployed SHA.
- `blocked`, `failed`, `pending` — state exactly why.

Never infer live acceptance from source shape, mocks, fixtures, manually injected events, old containers, the estimator, trajectory scores, or historical pass counts.

## Writing protocol

After substantial work, each handoff records:

1. repository, branch/base/PR, date, and exact implementation/evidence SHA;
2. primary role and interacting systems;
3. purpose and invariant;
4. exact files/migrations/systems changed;
5. behavior before and after;
6. side effects and external boundaries;
7. status using the vocabulary above;
8. exact tests/workflows/proof or explicit validation not run;
9. failed attempts and diagnostics where material;
10. unresolved P0/P1/P2 risks;
11. next dependency-ordered move;
12. Standard/vector/CODEGRAPH/architecture/plan/memory/wiki/PR synchronization.

Keep this index newest-first. Do not duplicate implementation records; point to them. Distinguish implementation proof SHAs from later documentation-only commits unless the full required workflow matrix reruns on the newer head.
