# mvp-build durable memory — index and writing protocol

Status: active  
Updated: 2026-07-20

This folder is the versioned narrative handoff layer. `MEMORY.md` is the sole index.

## Current branch note

- New work starts on reviewed branches from current `main` or an explicitly named stacked dependency.
- Merged baseline: current `main@48b917389ed85b9652eca43a8e4a8f60b52e917b`.
- PR `#31` merged on 2026-07-20. Final WS-02 exact evidence head: `e43f70a0e9a3afd4b87880b9d22089e6da2e94d0`.
- WS-01 evidence: `1460960f415fafc20582313b1dd2117b781a63f7`, broad 106/613.
- Final PR #31 workflows: Standard `29737033305`, Hermes `29737033258`, Main Integration `29737033205`.
- Broad final WS-02 aggregate: **110 files / 635 tests**. Migration head: `0072`. Standard: ratified v0.2.
- Source/CI accepted: WS-01, provider authority, assignment-scoped streaming Web, remote MCP auth/custody, MCP Apps CSP/host mediation, AG-UI, persisted effective capability, and final MCP policy/version execution revalidation.
- Remaining WS-02: live connector/provider lifecycle and external protocol-host evidence (`ISS-011`).
- WS-03 is not complete: PR `#32` contains DB-P0-01 ledger/hash preflight only; DB-P0-02 through DB-P0-07 remain open.
- WS-04 source hardening is stacked from PR #32 on `agent/ws04-target-host-lifecycle`: destructive Host Docker operations now classify failure/ambiguity, preserve partial-effect evidence, and force Manager lifecycle projection non-healthy. Exact-head repository CI and live target-host acceptance remain pending.
- Current source/CI must not be promoted into managed database, target host, fixture-free channel, commercial, recovery, deployment, pilot, or production acceptance.

## Read order

Read CODEGRAPH, Standard, active program, architecture, then the newest relevant handoff. Verify carried claims against current source and exact evidence. Do not concatenate all historical handoffs.

## Index — newest first

### Current production boundary

- [2026-07-20 — WS-04 destructive Host failure verification](2026-07-20-ws04-destructive-host-failure-verification.md) — Computed trace003 decision model, strict destructive Docker result classification, partial-effect evidence, Manager unhealthy projection guard, focused harness evidence, and explicit CI/live-host boundary.
- [2026-07-20 — WS-04 source hardening and decision pass](2026-07-20-ws04-source-hardening-decision-pass.md) — Public spectral/proxy decision model, exact WS-03 correction, Manager-only lifecycle CLI, secret custody/rotation contracts, immutable runtime digest evidence, focused tests, and explicit live-proof boundary.
- [2026-07-20 — WS-02 Mirror Cabinet hardening and WS-03 frontier](2026-07-20-ws02-mirror-cabinet-hardening-ws03-frontier.md) — Exact-head correction, assignment-scoped live projection, current authority revalidation, MCP App CSP/protocol mediation, AG-UI error hardening, 110/635 evidence, documentation ownership map, and guarded WS-03 P0 preparation.
- [2026-07-20 — WS-02 streaming and protocol source/CI closure](2026-07-20-ws02-streaming-protocol-source-ci-closure.md) — Original streaming employee OS, Remote MCP authorization/custody, MCP Apps, AG-UI, effective capability, manifold, and source/CI evidence record; superseded for hardening details by the entry above.
- [2026-07-20 — WS-01 green and WS-02 provider-authority lock](2026-07-20-ws01-green-ws02-provider-authority-lock.md) — Broad-suite normalization, CI de-bloat, and Model Gateway authority lock.
- [2026-07-20 — Post-merge roadmap CI closure](2026-07-20-post-merge-roadmap-ci-closure.md) — PR `#29` planning evidence.
- [2026-07-20 — Post-merge production roadmap reconciliation](2026-07-20-post-merge-production-roadmap-reconciliation.md) — 38-issue/nine-workstream roadmap baseline.
- [2026-07-20 — Standard v0.2 ratification and protocol reorientation](2026-07-20-standard-v0.2-ratification-and-protocol-reorientation.md) — Ratified protocol predecessor.
- [2026-07-20 — Capability surface CI closure](2026-07-20-capability-surface-ci-closure-and-next-plan.md) — migration `0072` predecessor.
- [2026-07-19 — Final document authority and production handoff](2026-07-19-final-document-authority-infra-test-production-handoff.md).
- [2026-07-19 — Repository archaeology and agent orientation](2026-07-19-repository-archaeology-architecture-and-agent-orientation.md).
- [2026-07-19 — Hermes/WebUI congruence](2026-07-19-hermes-webui-ui-congruence-pass.md).
- [2026-07-19 — UI/runtime production readiness](2026-07-19-ui-runtime-production-readiness-handoff.md).
- [2026-07-18 — S2–S9 authority/runtime checkpoint](2026-07-18-s2-s9-authority-runtime-checkpoint.md).

### Standard remediation and integration history

- [2026-07-18 — CI-green production plan digest](2026-07-18-ci-green-plan-digest.md)
- [2026-07-18 — Lane 1 scope and Lane 10 integrated CI](2026-07-18-lane1-scope-lane10-evidence-spine.md)
- [2026-07-18 — Lane 3 integration cleanup](2026-07-18-lane3-integration-and-repository-boundary-cleanup.md)
- [2026-07-18 — Standard remediation checkpoint](2026-07-18-standard-remediation-lane1-lane3-handoff.md)
- [2026-07-18 — Standard enforcement audit](2026-07-18-amtech-phase-2-standard-enforcement-audit.md)

### Runtime/deployment/event history

- [2026-07-17 — Employee-work reconciler](2026-07-17-employee-work-production-boundary-reconciler-pass.md)
- [2026-07-17 — Production sequence/generative UI](2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md)
- [2026-07-17 — WS1/WS2 documentation reconciliation](2026-07-17-ws1-ws2-documentation-reconciliation-and-website-frontier.md)
- [2026-07-16 — WS1/WS2 production boundary](2026-07-16-ws1-ws2-production-boundary-pass.md)
- [2026-07-16 — Production overlay](2026-07-16-2000-prod-env-overlay-system.md)
- [2026-07-16 — Web runtime recovery](2026-07-16-1323-web-message-runtime-recovery.md)
- [2026-07-16 — Full live production predecessor](2026-07-16-0538-provisioner-failure-live-production-handoff.md)

## Status vocabulary

`planned`, `research-specified`, `source-wired`, `locally-proven`, `ci-accepted`, `database-accepted`, `runtime-accepted`, `provider-accepted`, `browser/channel-accepted`, `commercial-accepted`, `live-accepted`, `production-ready`, `blocked`, `failed`, `pending`.

Never infer live acceptance from source, mocks, fixtures, manually injected events, old hosts, or historical counts.

## Writing protocol

A substantial handoff records coordinates, purpose/invariant, exact changes, before/after behavior, external effects, evidence state, exact tests/workflows, failed attempts, unresolved risks, next dependency move, and synchronized authority documents.
