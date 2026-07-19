# 12 — Document Control, Memory, Handoff, and Plan Map

Status: **[VERIFIED] repository documentation-routing map**

This document accounts for the repository’s root/scoped control documents, durable memory, implementation records, execution plans, architecture/UX packets, deployment runbooks, and historical handoffs. It organizes them by authority and use without physically moving historical Markdown files or breaking inbound references.

## One cold-start chain

Every coding agent working on the AI Employee follows this chain:

```text
root identity.md
→ root AGENTS.md or CLAUDE.md
→ root CODEGRAPH.md
→ mvp-build/AGENTS.md or CLAUDE.md
→ mvp-build/CODEGRAPH.md
→ mvp-build/memory/MEMORY.md
→ newest relevant handoff
→ mvp-build/STANDARD.md
→ active second-half execution program
→ docs/architecture/README.md
→ role/subsystem docs and UX docs
→ current source, migrations, tests, workflows, proof, and branch diff
```

`docs/architecture/11-agent-orientation-and-role-map.md` explains the role-specific version of this sequence.

## Authority classes

### Class 1 — operating and release authority

| File/family | Purpose | Update trigger |
|---|---|---|
| `identity.md` | AMTECH operating/product identity | deliberate company/product posture change |
| root `AGENTS.md` / `CLAUDE.md` | repository-wide agent rules and scope routing | repository boundary, invariant, or boot-sequence change |
| root `CODEGRAPH.md` | repository-level current state and source-of-truth routing | branch/proof/current-state/repository-boundary change |
| `mvp-build/AGENTS.md` / `CLAUDE.md` | scoped implementation rules | implementation invariant, role, or validation change |
| `mvp-build/CODEGRAPH.md` | current implementation graph, source hubs, migration head, evidence boundary | substantial implementation, architecture, migration, or proof change |
| `mvp-build/STANDARD.md` | non-waivable production standard | approved standard revision only |
| `mvp-build/second-half-plan/phase-2-standard-remediation-execution.md` | active dependency-ordered execution program | explicit plan amendment/supersession |
| `mvp-build/validation/phase-2-remediation-vectors.json` | machine-readable finding/gate registry | plan/gate change with integrity tests |
| draft PR `#23` | integration diff/status/evidence boundary | exact-head implementation or CI state change |

These files must not disagree about branch, migration head, current proof boundary, or production-ready meaning.

### Class 2 — current explanatory authority

| File/family | Purpose |
|---|---|
| `mvp-build/docs/architecture/README.md` | cross-sectional live map |
| `mvp-build/docs/architecture/01–09` | product, network, events, Hermes/context, UI, effects, use cases, archaeology, and risk register |
| `mvp-build/docs/architecture/trajectories/` | dependency/bifurcation review aids grounded in source interactions |
| `mvp-build/docs/architecture/11-agent-orientation-and-role-map.md` | agent roles and required proof |
| this file | document family and handoff routing |
| `mvp-build/docs/ux/` | owner UX doctrine, system map, implementation coverage, validation, research disposition, Hermes/UI decisions |
| `mvp-build/docs/production-normal-employee-live-deploy-runbook.md` | canonical production-shaped live execution path |

Architecture and UX documents explain current source. They do not override source or turn source wiring into live acceptance.

### Class 3 — durable memory and point-in-time evidence

| Family | Purpose |
|---|---|
| `mvp-build/memory/` | newest-first session handoffs, decisions, unresolved risks, and next-agent start |
| `wiki/MVP/implementation-records/` | dated factual implementation/proof records |
| CI artifacts and release records | exact-SHA executable evidence |

Memory and implementation records are intentionally historical. Older entries remain readable, but their status does not automatically carry forward.

### Class 4 — plans and research history

| Family | Purpose |
|---|---|
| `mvp-build/second-half-plan/phase-00…phase-06` | historical subsystem plan family |
| `mvp-build/second-half-plan/context-engineering/` | historical context-engineering plan/research |
| `mvp-build/second-half-plan/surface-research-*` | Hermes/UI research history |
| `wiki/` | company/product strategy, evidence, historical plans, research |
| older `docs/` packets | historical design/operating context |

These files supply rationale and hypotheses. Current source, standard, active plan, architecture map, CODEGRAPH, and newest memory determine current state.

## Root and scoped CODEGRAPH division

### Root `CODEGRAPH.md`

Owns:

- repository boundary and purpose;
- canonical product/offer;
- root read order;
- current integration branch/PR/status;
- source-of-truth and document-family routing;
- repository-wide invariants;
- link to scoped implementation graph.

It should not duplicate every Manager migration, route, worker, or UI component.

### `mvp-build/CODEGRAPH.md`

Owns:

- current implementation topology and source hubs;
- active migration head;
- closed source-level P0/P1 findings;
- current exact implementation/CI proof anchor;
- current live evidence boundary;
- next production dependency gates;
- links to architecture, UX, memory, plan, validation, and runbook layers.

It should not carry every historical lane narrative inline after those records are preserved in memory/implementation records.

## Durable memory inventory

`mvp-build/memory/MEMORY.md` is the sole index for the handoff directory. The files below are retained and classified; none is physically moved.

### Current architecture/production handoffs

- `2026-07-19-repository-archaeology-architecture-and-agent-orientation.md` — current documentation/architecture/code-review pass and agent-navigation checkpoint.
- `2026-07-19-hermes-webui-ui-congruence-pass.md` — current Hermes/WebUI/UI congruence implementation and evidence predecessor.
- `2026-07-19-ui-runtime-production-readiness-handoff.md` — current UI/runtime/role/production-readiness predecessor.
- `2026-07-18-s2-s9-authority-runtime-checkpoint.md` — authority/runtime production-boundary predecessor.

### Standard/remediation and integration handoffs

- `2026-07-18-ci-green-plan-digest.md`
- `2026-07-18-lane1-scope-lane10-evidence-spine.md`
- `2026-07-18-lane3-integration-and-repository-boundary-cleanup.md`
- `2026-07-18-standard-remediation-lane1-lane3-handoff.md`
- `2026-07-18-amtech-phase-2-standard-enforcement-audit.md`
- `2026-07-18-amtech-standard-v0.1-draft-2.md`

### Runtime, deployment, and production-boundary handoffs

- `2026-07-17-employee-work-production-boundary-reconciler-pass.md`
- `2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md`
- `2026-07-16-2000-prod-env-overlay-system.md`
- `2026-07-16-1645-documentation-freeze-reconciliation.md`
- `2026-07-16-1323-web-message-runtime-recovery.md`
- `2026-07-16-0812-owner-resource-safety-and-xai-runtime-proof.md`
- `2026-07-16-0719-provisioner-twilio-webhook-and-api-tunnel-fix.md`
- `2026-07-16-0538-provisioner-failure-live-production-handoff.md`
- `2026-07-16-0335-production-normal-employee-runbook-default-handoff.md`
- `2026-07-16-ws1-ws2-production-boundary-pass.md`

### UX, method, and historical product-direction handoffs

- `2026-07-17-ws1-ws2-documentation-reconciliation-and-website-frontier.md`
- `2026-07-17-0145-leverage-and-method-distilled.md`
- `2026-07-17-0130-final-doc-sync-complete.md`
- `2026-07-17-0030-prod-ux-branch-start.md`

The exact filename for the WS1/WS2 documentation handoff is verified by `memory/MEMORY.md`; historical titles may be longer than their filename slug. The memory index remains the filename authority.

## Handoff selection rules

Read only the subset needed after reading the current control chain:

| Work type | Required current handoffs | Optional predecessors |
|---|---|---|
| repository/docs/architecture | newest archaeology/orientation handoff + Hermes/UI congruence handoff | documentation freeze, final doc sync |
| UI/UX/generated UI | newest archaeology/orientation + Hermes/UI congruence + UI/runtime readiness | prod UX branch start, generative UI reconciliation |
| authority/assignments/C3 | newest archaeology/orientation + S2–S9 checkpoint | lane 1/lane 3 handoffs, standard audit |
| runtime/network/provisioning | newest archaeology/orientation + employee-work reconciler pass | WS1/WS2 boundary, production run handoffs |
| deployment/live proof | newest archaeology/orientation + production normal-employee runbook handoff | env overlay, tunnel/runtime proof incidents |
| plan/standard changes | newest archaeology/orientation + standard enforcement audit | standard draft, CI plan digest |

Do not read every historical handoff as an unordered prompt bundle. Read current control documents first, select predecessors by subsystem, and verify every carried-forward claim.

## Implementation-record inventory and routing

`wiki/MVP/implementation-records/README.md` is the index for older factual implementation records, including:

- 2026-07-17 WS1/WS2 production boundary;
- 2026-07-05 MCP/toolsets/tool activity;
- 2026-07-03 Phase 4 hardening/Phase 6;
- 2026-07-03 Phase 3/3A/4 core;
- 2026-06-30 Phase 2 runtime/scheduler;
- 2026-06-30 Phase 1 acceptance harness;
- earlier baseline, Gmail/Stripe, Work Surface, repair/security, and event-bus records.

These remain point-in-time factual records. The index must route readers to current CODEGRAPH, architecture, memory, and exact-head proof before historical records.

## Plan-family organization

`mvp-build/second-half-plan/README.md` remains the index for:

- active `phase-2-standard-remediation-execution.md`;
- historical Phase 0–6 files;
- context-engineering history;
- Hermes surface/materialization research.

The README must describe current integration state, not the older pre-Lane-3 checkpoint. Historical plan files are not renamed or moved.

## Markdown organization decision

[VERIFIED] No broad physical Markdown move is performed in this pass.

Reasons:

1. handoffs and implementation records are point-in-time evidence with many inbound links;
2. moving them would create stale references throughout memory, wiki, PRs, and external notes;
3. current confusion comes from missing routing/status, not from directory names;
4. virtual organization through canonical indexes preserves evidence and improves agent navigation.

Allowed future moves require:

- an exact inbound-reference rewrite;
- redirect/stub or explicit archive index;
- archaeology verification showing no stale path remains;
- CODEGRAPH/memory/PR synchronization.

## Update transaction after substantial work

A documentation/state update is complete only when all applicable layers are synchronized:

```text
source/migration/test/workflow
→ architecture or UX contract
→ mvp-build/CODEGRAPH.md
→ root CODEGRAPH.md when repository-level state changes
→ dated memory handoff
→ memory/MEMORY.md newest-first index
→ implementation record when durable factual proof warrants it
→ active plan/vector when dependency or gate changes
→ PR description and exact-head workflow evidence
```

A documentation-only follow-up SHA must not replace an earlier implementation proof anchor unless all required workflows rerun and pass on the new head.

## Staleness controls

- Every current index carries `Status` and `Updated`.
- Current-state files link to exact source/proof rather than copying old pass counts indefinitely.
- Historical files keep their original point-in-time statements and receive a clear historical/superseded banner only when needed.
- Memory remains newest-first.
- Architecture risk register owns current source-confirmed P0/P1 production gaps.
- Trajectory artifacts own dependency/bifurcation analysis, not current-state claims.
- Repository archaeology runs on the exact branch head and emits stale-reference/orphan candidates for source-level confirmation.
