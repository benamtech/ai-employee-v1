# mvp-build durable memory — index and writing protocol

Status: active  
Updated: 2026-07-20

This folder is the versioned narrative handoff layer for the AMTECH AI Employee implementation. It records what changed, why, current status, unresolved risks, exact proof, and the next agent's starting point.

## Use the knowledge layers correctly

- `memory/` — session narrative, architectural decisions, incidents, unresolved risks, and next-agent handoff.
- `../CODEGRAPH.md` — implementation topology, source hubs, migration head, and evidence boundary; verify its point-in-time status against current source and the newest handoff.
- `../docs/architecture/` — cross-system structure, effects, risks, agent roles, trajectory analysis, and infrastructure/test audit.
- `../../wiki/MVP/implementation-records/` — older factual implementation/proof ledger.
- `../second-half-plan/` — active execution program, focused current companions, and historical plan family.
- source, migrations, tests, workflows, and proof — implementation and acceptance authority.

`MEMORY.md` is the sole index for this folder. Do not add a second competing handoff index.

## Current branch note

The active integration branch is `employee-production-tuesday`, based on `research`, with draft PR `#23`; `main` is not the integration shortcut. Migration head is `0072` at `../packages/db/migrations/0072_artifact_revision_scope_guards.sql`.

The primary capability-closure implementation anchor is `5b56e6a2249f4b5a650d81badbdd7b95cd6ea2bb`. Later plan/memory/document commits do not automatically inherit that anchor's complete workflow matrix. Exact final-head run IDs must be recorded after branch movement stops and every required workflow concludes.

The current pass closes the actual Web capability setup nullability failure, adds a regression contract, reconciles strict-read acceptance with capability enrichment, and makes migration-head acceptance follow the SQL ledger. It also records that canonical production Compose selection is now source-wired through `../infra/scripts/production-topology.mjs`; real target-host acceptance remains open.

Do not infer real Supabase, target-runtime/network, live identity/provider, provider-backed browser action/effect, fixture-free Web/SMS/Review, commercial reconciliation, capacity, crash/repair, rollback, deployment, or launch acceptance from the current source/CI state.

## Read order inside memory

1. Read root/scoped CODEGRAPH and architecture first, but verify stale point-in-time headers against current source.
2. Read the newest handoff relevant to the subsystem.
3. Read predecessor handoffs only when they explain an inherited decision, incident, or proof.
4. Verify every carried-forward claim against current source and exact-head proof.
5. Do not concatenate every historical handoff into one undifferentiated agent prompt.

The complete classification and document-family map is `../docs/architecture/12-document-control-memory-and-handoff-map.md`.

## Index — newest first

### Current architecture, UI/runtime, and production boundary

- [2026-07-20 — Capability surface CI closure and production next plan](2026-07-20-capability-surface-ci-closure-and-next-plan.md) — Current implementation handoff. Rejects the stale six-error premise, records the atomic connector setup action, regression contract, strict-read/migration acceptance repairs, migration head `0072`, canonical deploy source state, exact workflow boundaries, focused plan folder, and remaining live P0/P1 gates.
- [2026-07-19 — Final document authority, infra/test audit, and production handoff](2026-07-19-final-document-authority-infra-test-production-handoff.md) — Historical predecessor. Names the earlier green code/test anchor, document-authority bootstrap, then-current deploy fork finding, UI/browser evidence boundary, production blockers, and TDD sequence. Its `0069` and legacy-selector claims are superseded by current source and the 2026-07-20 handoff.
- [2026-07-19 — Repository archaeology, architecture, production trajectories, and agent orientation](2026-07-19-repository-archaeology-architecture-and-agent-orientation.md) — Documentation/code-review checkpoint. Maps the entire system, source-confirmed network/context/UI protocol defects, document families, and coding-agent roles.
- [2026-07-19 — Hermes/WebUI research and UI congruence pass](2026-07-19-hermes-webui-ui-congruence-pass.md) — Official Hermes programmatic surfaces, issue `#360`, MCP bridge patterns, protocol congruence, generated-view parity, production Next browser harness, and exact-SHA UI evidence predecessor.
- [2026-07-19 — UI, Hermes, roles, assignments, and production-readiness handoff](2026-07-19-ui-runtime-production-readiness-handoff.md) — UI/runtime/role/session/shared-employee/public/operator analysis and production sequence predecessor.
- [2026-07-18 — S2–S9 authority and runtime-boundary checkpoint](2026-07-18-s2-s9-authority-runtime-checkpoint.md) — Owner assignment, C3 owner-turn repair, connector custody, commercial attribution, approval, platform authority, revocation, signed-resource closure, generated Manager, and production-image predecessor.

### Standard remediation and integration history

- [2026-07-18 — CI-green production plan digest](2026-07-18-ci-green-plan-digest.md) — Earlier Lane 1/Lane 3/Lane 10 checkpoint and 16-step path.
- [2026-07-18 — Lane 1 scope inventory and Lane 10 evidence spine](2026-07-18-lane1-scope-lane10-evidence-spine.md) — Consequential-surface registry, migration `0042`, assignment tests, release-evidence schemas/generator, and integrated Lane 10 CI.
- [2026-07-18 — Lane 3 integration and repository-boundary cleanup](2026-07-18-lane3-integration-and-repository-boundary-cleanup.md) — Scheduler harness correction, durable command/effect integration, Hyper Site workspace removal, and control-document routing repair.
- [2026-07-18 — Standard remediation checkpoint: Lane 1 integrated, Lane 3 contract/red boundary](2026-07-18-standard-remediation-lane1-lane3-handoff.md) — Historical predecessor.
- [2026-07-18 — AMTECH Phase 2 Standard Enforcement Audit](2026-07-18-amtech-phase-2-standard-enforcement-audit.md) — Standard enforcement, GAPS/REMEDIATION, and missing authority/custody/commercial foundations.
- [2026-07-18 — AMTECH Standard v0.1 Draft 2](2026-07-18-amtech-standard-v0.1-draft-2.md) — Historical standard-development record; `../STANDARD.md` is current authority.

### Runtime, deployment, event, and production-boundary history

- [2026-07-17 — Employee-work production-boundary reconciler pass](2026-07-17-employee-work-production-boundary-reconciler-pass.md) — Model Gateway routes/credentials, reconciler ownership, lifecycle/provider convergence, crash/duplicate evidence, and live proof harness.
- [2026-07-17 — Production next sequence and generative UI reconciliation](2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md) — Runtime/GTM reconciliation and sequence from database/runtime P0 proof to normal-employee acceptance.
- [2026-07-17 — WS1/WS2 documentation reconciliation and website frontier](2026-07-17-ws1-ws2-documentation-reconciliation-and-website-frontier.md) — Historical product/documentation handoff; Hyper Site moved to its independent repository.
- [2026-07-16 — WS1/WS2 production boundary pass](2026-07-16-ws1-ws2-production-boundary-pass.md) — Model Gateway custody, profile integrity, provisioning/reconciler foundations, rotation, drift, and ambient-inbox groundwork.
- [2026-07-16 20:00 — Production overlay system](2026-07-16-2000-prod-env-overlay-system.md) — Local production environment overlay and named-tunnel helpers.
- [2026-07-16 16:45 — Documentation freeze and reconciliation](2026-07-16-1645-documentation-freeze-reconciliation.md) — Declared `second-half-plan/` the active plan family and tightened proof vocabulary.
- [2026-07-16 13:23 — Web runtime recovery](2026-07-16-1323-web-message-runtime-recovery.md) — Recovered an exited employee runtime on the owner message path and recorded point-in-time provider-backed proof.
- [2026-07-16 08:12 — Owner resource safety and xAI runtime proof](2026-07-16-0812-owner-resource-safety-and-xai-runtime-proof.md) — Hardened owner-safe projections and recorded point-in-time provider-backed Manager Web turn proof.
- [2026-07-16 07:19 — Twilio webhook and API tunnel fix](2026-07-16-0719-provisioner-twilio-webhook-and-api-tunnel-fix.md) — Corrected public Twilio webhook routing and added public API tunnel proof.
- [2026-07-16 05:38 — Full live production run handoff](2026-07-16-0538-provisioner-failure-live-production-handoff.md) — Normal-employee live-run goal, blocker IDs, and early repair targets.
- [2026-07-16 03:35 — Production normal-employee runbook default](2026-07-16-0335-production-normal-employee-runbook-default-handoff.md) — Made the normal-employee runbook default and excluded fixtures/public estimator from launch proof.

### UX and engineering-method history

- [2026-07-17 01:45 — Leverage and method distilled](2026-07-17-0145-leverage-and-method-distilled.md) — Distilled the production-UX implementation method and measured agent leverage.
- [2026-07-17 01:30 — Final documentation sync](2026-07-17-0130-final-doc-sync-complete.md) — Historical UX documentation/implementation handoff.
- [2026-07-17 00:30 — First-principles Web surface redesign](2026-07-17-0030-prod-ux-branch-start.md) — Historical Home/Talk/Proof/Connected direction; superseded by the adaptive operating surface.

Older handoffs remain historical evidence. Read them only after current source, Standard, active plan, CODEGRAPH/architecture, this index, and the newest relevant handoff. Dedicated historical website-framework handoffs are not indexed because that project moved to `benamtech/hyper-site`.

## Status vocabulary

- `source-wired`: source/schema/config exists; state exactly what checks ran.
- `ci-accepted`: named CI gate passed on named SHA and scope.
- `real-supabase-accepted`: approved real database target passed migration and behavior checks.
- `provider-accepted`: real external-provider proof IDs exist.
- `runtime-accepted`: real target host/runtime/network proof exists.
- `browser/channel-accepted`: fixture-free Web/SMS/Review proof exists.
- `commercial-accepted`: usage, payer/beneficiary, provider cost, and invoice reconciliation passed.
- `production-ready`: every non-waivable Standard gate passes on the exact deployed SHA.
- `planned`: designed but not implemented.
- `blocked`: must fail closed until the named prerequisite exists.
- `pending`: unattempted or missing proof.

Never infer live acceptance from code shape, mocks, fixtures, manually injected events, old containers, public estimator, trajectory scores, or historical pass counts.

## Writing protocol

Create or update a dated handoff after substantial multi-file work, a phase completion, production incident, architectural/product-direction decision, documentation/source-of-truth change, or new P0/P1 risk. Every handoff must include:

1. repository, branch, PR, date, and exact implementation SHA;
2. primary agent role and interacting roles;
3. purpose and invariant;
4. exact files/migrations/systems changed;
5. behavior before and after;
6. side effects and external boundaries affected;
7. status using the vocabulary above;
8. exact tests/workflows/proof IDs or explicit validation not run;
9. unresolved P0/P1 risks;
10. the next dependency-ordered move;
11. documentation/CODEGRAPH/memory/plan/PR synchronization performed.

Keep this index newest-first. Do not duplicate implementation records; point to them. Distinguish implementation proof SHAs from later documentation-only commits unless the full required workflow matrix reruns on the newer head.
