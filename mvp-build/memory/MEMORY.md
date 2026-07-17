# mvp-build durable memory — index + writing protocol

Status: active

This folder is the versioned narrative handoff layer for the AMTECH AI Employee MVP. It records what changed, why, current status, unresolved risks, and the next agent's starting point.

Use the three layers correctly:

- `memory/`: session narrative, decisions, risks, and pointers.
- `../../wiki/MVP/implementation-records/`: factual source/proof ledger.
- `../second-half-plan/`: active forward-plan family.

**Current branch note (2026-07-17):** the current production-boundary implementation pass is on `employee-work`, based on `research`, with draft PR `#18` targeting `research`. Do not edit `main` directly. The earlier `prod-ux` branch work has already been merged and is historical context, not the current branch instruction.

## Index — newest first

- [2026-07-17 — employee-work production boundary reconciler pass](2026-07-17-employee-work-production-boundary-reconciler-pass.md) — Bound the private Model Gateway to employee credentials/routes, made initial provisioning reconciler-owned, added leased provisioning/ambient workers with retries, compensation, drift repair, dead letters and replay, converged lifecycle/provider ingress, and added type/unit/image checks. Source-wired only: live Supabase still stops at migration `0031`, Actions did not report a run, and no runtime/provider/browser acceptance is claimed.
- [2026-07-17 — production next sequence and generative UI reconciliation](2026-07-17-production-next-sequence-and-generative-ui-reconciliation.md) — Fast-forwarded `research` to current `main`, confirmed canonical runtime/GTM docs are coherent, removed stale estimator-led UX roadmap language, recorded the current generated-template design mismatch, and defined the exact sequence from database/runtime P0 proof through normal-employee acceptance and one provider-backed generative work-object slice. Docs/static review only; no build, migration, runtime, or provider validation.
- [2026-07-17 — website framework Phase 1 closure](2026-07-17-website-framework-phase-1-closure.md) — Closed the adaptive experience compiler research/specification phase: scoped identity/instructions/codegraph, software category, distributed content/design/generative UI model, competitor and complexity synthesis, synthetic benchmark generator, and new compiler/autonomy validation gates. Implementation and runtime validation pending.
- [2026-07-17 — holographic website framework and v0.1 Request Mirror Lab](2026-07-17-holographic-website-framework-v0.1.md) — Established the research-grounded HRR/VSA + graph materialization framework, explicit feature/pass-fail vectors, privacy/SEO boundaries, and the plain noindex Cloudflare Request Mirror Lab as v0.1. No build/deploy run.
- [2026-07-17 — WS1/WS2 documentation reconciliation and website frontier](2026-07-17-ws1-ws2-doc-reconciliation-and-website-frontier.md) — Rebased `research` onto latest `main`, reconciled canonical docs to the source-wired production-boundary state, recorded static risks and validation not run, and staged the first-principles AMTECH website rewrite.
- [2026-07-16 — WS1/WS2 production boundary pass](2026-07-16-ws1-ws2-production-boundary-pass.md) — Model gateway credential custody, profile integrity, durable provisioning/reconciler foundations, credential rotation, drift operations, and WS3 ambient inbox schema groundwork. Source-wired only; no live acceptance.
- [2026-07-17 01:45 — leverage and method distilled](2026-07-17-0145-leverage-and-method-distilled.md) — Distilled the prod-UX implementation method and measured agent leverage.
- [2026-07-17 01:30 — final documentation sync](2026-07-17-0130-final-doc-sync-complete.md) — UX documentation and implementation handoff merged to `main`.
- [2026-07-17 00:30 — first-principles web surface redesign](2026-07-17-0030-prod-ux-branch-start.md) — Introduced the current Home/Talk/Proof/Connected owner-product direction and validation framework.
- [2026-07-16 20:00 — production overlay system](2026-07-16-2000-prod-env-overlay-system.md) — Added local production env overlay and named-tunnel helpers.
- [2026-07-16 16:45 — documentation freeze and reconciliation](2026-07-16-1645-documentation-freeze-reconciliation.md) — Declared `second-half-plan/` the active forward-plan family and tightened live-proof vocabulary.
- [2026-07-16 13:23 — web runtime recovery](2026-07-16-1323-web-message-runtime-recovery.md) — Recovered an exited employee runtime on the owner message path and recorded provider-backed web-turn proof for that point-in-time stack.
- [2026-07-16 08:12 — owner resource safety and xAI runtime proof](2026-07-16-0812-owner-resource-safety-and-xai-runtime-proof.md) — Hardened owner-safe projections and recorded a point-in-time provider-backed Manager web turn.
- [2026-07-16 07:19 — Twilio webhook and API tunnel fix](2026-07-16-0719-provisioner-twilio-webhook-and-api-tunnel-fix.md) — Corrected public Twilio webhook routing and added public API tunnel proof.
- [2026-07-16 05:38 — full live production run handoff](2026-07-16-0538-provisioner-failure-live-production-handoff.md) — Canonical normal-employee live-run goal, blocker IDs, and first repair targets.
- [2026-07-16 03:35 — production runbook default](2026-07-16-0335-production-normal-employee-runbook-default-handoff.md) — Made the normal-employee runbook the default and excluded fixture/public-estimator tooling from launch proof.

Older handoffs remain in this folder and are historical evidence. Read them only after the current CODEGRAPH, this index, and the newest relevant handoff.

## Status vocabulary

- `source-wired`: source or schema exists; state exactly what static/local checks, if any, actually ran.
- `provider-accepted`: real external provider proof IDs exist.
- `runtime-accepted`: real employee runtime/host proof artifacts exist.
- `planned`: designed but not implemented.
- `pending`: blocked, unattempted, or missing proof.

Never infer provider/runtime acceptance from code shape, mocks, fixtures, manually injected events, old containers, or the public estimator.

## Writing protocol

Create or update a dated handoff after substantial multi-file work, a phase completion, a production incident, or an architectural/product-direction decision. Every handoff must include:

1. branch and date;
2. exact files/systems changed;
3. status using the vocabulary above;
4. proof IDs or an explicit statement that validation did not run;
5. unresolved risks;
6. the next concrete move.

Keep this index newest-first. Do not duplicate implementation records; point to them.
