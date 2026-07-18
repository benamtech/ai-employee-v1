# mvp-build durable memory — index + writing protocol

Status: active

This folder is the versioned narrative handoff layer for the AMTECH AI Employee MVP. It records what changed, why, current status, unresolved risks, and the next agent's starting point.

Use the three layers correctly:

- `memory/`: session narrative, decisions, risks, and pointers.
- `../../wiki/MVP/implementation-records/`: factual source/proof ledger.
- `../second-half-plan/`: active forward-plan family.

**Current branch note (2026-07-18):** the active integration branch is `employee-production-tuesday`, based on `research`, with draft PR `#23`; `main` is not the integration shortcut. Lane 1's relationship/authorization foundation is integrated at `b37d479a70983fcb3e88942b1f36481a07a97d17`, and the current PR source-wires the complete consequential-surface scope registry, migration `0042`, and Lane 1 scope tests. Lane 3's durable command/effect kernel is integrated at `c94be46137b8c87b610ba0c4b48302bb2e944564`. Lane 10 has a source-wired release-evidence contract, manifest generator, and integrated CI workflow. Current-head Actions on `54f926865a1d3f1fddcd7e4961defbfffb460b83` were green for Phase 2 plan integrity, Lane 1 relationships/authorization, Lane 10 integrated CI/release evidence, and Employee Work Production Boundary. The independent Hyper Site subtree and workflow were removed in merge `3ec7a5c541fd8d6e6ec074e94f178163c7ec9477`; Hyper Site now lives in `benamtech/hyper-site` and is not product authority here. No real-Supabase, runtime, provider, browser/SMS, commercial, capacity, deployment, or production acceptance is claimed.

## Index — newest first

- [2026-07-18 — CI-green production plan digest](2026-07-18-ci-green-plan-digest.md) — Records current-head green Actions, preserves the no-live-acceptance boundary, and defines the 16-step production path with detailed next four steps.
- [2026-07-18 — Lane 1 scope inventory and Lane 10 evidence spine](2026-07-18-lane1-scope-lane10-evidence-spine.md) — Source-wired the consequential-surface scope registry, migration `0042`, assignment-scope tests, release-evidence schemas, release-evidence generator, and integrated Lane 10 CI workflow. Superseded by the CI-green digest for observed current-head Actions; no live acceptance claimed.
- [2026-07-18 — Lane 3 integration and repository-boundary cleanup](2026-07-18-lane3-integration-and-repository-boundary-cleanup.md) — Corrected the scheduler-dependent concurrency harness, recaptured the required RED state, implemented and integrated the durable command/effect kernel, removed the independent Hyper Site workspace and workflow, repaired control-document routing, and defines complete Lane 1 scope plus Lane 10 CI as the next dependency gates.
- [2026-07-18 — Standard remediation checkpoint: Lane 1 integrated, Lane 3 contract/red boundary](2026-07-18-standard-remediation-lane1-lane3-handoff.md) — Historical predecessor to the current handoff; records the Lane 1 red→green sequence and Lane 3’s pre-implementation boundary.
- [2026-07-18 — AMTECH Phase 2 Standard Enforcement Audit](2026-07-18-amtech-phase-2-standard-enforcement-audit.md) — Enforced the approved standard, created `GAPS.md` and `REMEDIATION.md`, and identified the missing assignment, authority, custody, payer, beneficiary, and labor-attribution foundations. Evidence-only audit.
- [2026-07-18 — AMTECH Standard v0.1 Draft 2](2026-07-18-amtech-standard-v0.1-draft-2.md) — Extracted the proposed standard, relationship graph, shared-employee isolation, labor-native billing, and hard-gate research protocols. Historical standard-development record; `../STANDARD.md` is current authority.
- [2026-07-17 — employee-work production boundary reconciler pass](2026-07-17-employee-work-production-boundary-reconciler-pass.md) — Bound private Model Gateway credentials/routes, made provisioning reconciler-owned, converged lifecycle/provider ingress, added crash recovery and duplicate evidence, and created the release-bound live proof harness. Source/CI evidence only.
- [2026-07-17 — production next sequence and generative UI reconciliation](2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md) — Reconciled production runtime/GTM docs, removed estimator-led UX roadmap language, and defined the sequence from database/runtime P0 proof through normal-employee acceptance.
- [2026-07-17 — WS1/WS2 documentation reconciliation and website frontier](2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md) — Mixed historical product/documentation handoff. Any Hyper Site material in it moved to `benamtech/hyper-site` and is not current authority here.
- [2026-07-16 — WS1/WS2 production boundary pass](2026-07-16-ws1-ws2-production-boundary-pass.md) — Model Gateway credential custody, profile integrity, durable provisioning/reconciler foundations, credential rotation, drift operations, and ambient inbox groundwork. Source-wired only.
- [2026-07-17 01:45 — leverage and method distilled](2026-07-17-0145-leverage-and-method-distilled.md) — Distilled the prod-UX implementation method and measured agent leverage.
- [2026-07-17 01:30 — final documentation sync](2026-07-17-0130-final-doc-sync-complete.md) — Historical UX documentation and implementation handoff.
- [2026-07-17 00:30 — first-principles web surface redesign](2026-07-17-0030-prod-ux-branch-start.md) — Introduced the Home/Talk/Proof/Connected owner-product direction and validation framework.
- [2026-07-16 20:00 — production overlay system](2026-07-16-2000-prod-env-overlay-system.md) — Added local production environment overlay and named-tunnel helpers.
- [2026-07-16 16:45 — documentation freeze and reconciliation](2026-07-16-1645-documentation-freeze-reconciliation.md) — Declared `second-half-plan/` the active forward-plan family and tightened proof vocabulary.
- [2026-07-16 13:23 — web runtime recovery](2026-07-16-1323-web-message-runtime-recovery.md) — Recovered an exited employee runtime on the owner message path and recorded point-in-time provider-backed proof.
- [2026-07-16 08:12 — owner resource safety and xAI runtime proof](2026-07-16-0812-owner-resource-safety-and-xai-runtime-proof.md) — Hardened owner-safe projections and recorded a point-in-time provider-backed Manager web turn.
- [2026-07-16 07:19 — Twilio webhook and API tunnel fix](2026-07-16-0719-provisioner-twilio-webhook-and-api-tunnel-fix.md) — Corrected public Twilio webhook routing and added public API tunnel proof.
- [2026-07-16 05:38 — full live production run handoff](2026-07-16-0538-provisioner-failure-live-production-handoff.md) — Canonical normal-employee live-run goal, blocker IDs, and first repair targets.
- [2026-07-16 03:35 — production normal employee runbook default](2026-07-16-0335-production-normal-employee-runbook-default-handoff.md) — Made the normal-employee runbook the default and excluded fixture/public-estimator tooling from launch proof.

Older handoffs remain historical evidence. Read them only after the current CODEGRAPH, this index, and the newest relevant handoff. Dedicated historical website-framework handoffs are not indexed because that project moved to `benamtech/hyper-site`.

## Status vocabulary

- `source-wired`: source or schema exists; state exactly what checks actually ran.
- `ci-accepted`: the named CI gate passed on the named SHA and scope.
- `real-supabase-accepted`: the approved real database target passed migration and behavior checks.
- `provider-accepted`: real external-provider proof IDs exist.
- `runtime-accepted`: real employee runtime/host proof artifacts exist.
- `browser/channel-accepted`: fixture-free web/SMS proof exists.
- `commercial-accepted`: usage, payer/beneficiary, provider cost, and invoice reconciliation passed.
- `planned`: designed but not implemented.
- `pending`: blocked, unattempted, or missing proof.

Never infer live acceptance from code shape, mocks, fixtures, manually injected events, old containers, or the public estimator.

## Writing protocol

Create or update a dated handoff after substantial multi-file work, a phase completion, a production incident, or an architectural/product-direction decision. Every handoff must include:

1. branch and date;
2. exact files/systems changed;
3. status using the vocabulary above;
4. proof IDs or an explicit statement that validation did not run;
5. unresolved risks;
6. the next concrete move.

Keep this index newest-first. Do not duplicate implementation records; point to them.