# 2026-07-20 — Post-Merge Roadmap CI Closure

Status: **exact-head evidence handoff companion; final workflow IDs remain in PR `#29` after branch movement stops**

## Coordinates

- Repository: `benamtech/ai-employee-v1`
- Base: `main@5e5b8d7c7a5e20490d58855ffb4450b13b53cd03`
- Branch: `agent/amtech-p0-plan-003-production-roadmap`
- PR: draft `#29`
- Task: `AMTECH-P0-PLAN-003`
- Standard: ratified v0.2; unchanged
- Migration head: `0072`; unchanged
- Runtime/source behavior: unchanged

## Failed attempt retained

Initial PR head `a014ecffe0ffcbb22569c619a9d4325db8900038` failed Ratified Standard workflow `29720120765` in `standard-ratification-contract.test.ts`.

Root cause:

- the active-program status had been changed from the exact stable authority token `Status: **active and canonical**` to `Status: **active and canonical; post-cutover main baseline**`;
- the existing test correctly required the stable token.

Resolution:

- restored `Status: **active and canonical**` verbatim;
- moved post-cutover detail to a separate `Program state` line;
- did not weaken or broaden the test.

## Corrected evidence head

Corrected head `5ae30eb749dbd24337cf88c2b2e7846e6fee3979` passed:

- Ratified Standard and Production Plan Integrity — run `29720195169`;
  - Standard/connector contracts;
  - repository governance, including the new 38-issue/nine-workstream/post-merge assertions;
  - predecessor remediation parse;
  - evolution-vector parse;
  - full typecheck and lint.
- Main Integration Gates — run `29720195191`;
  - repository archaeology;
  - contributor/Standard/type/lint gates;
  - integrated authority/source contracts;
  - production build;
  - compiled Chromium adaptive/product-shell fixture matrices;
  - integration summary.

These runs establish CI acceptance only for the planning/document/governance and named source/fixture boundaries exercised. They do not make the broad historical `npm run test:unit` aggregate green and do not close database, target-host, provider, fixture-free channel, commercial, recovery, accessibility, capacity, pilot, deployment, or production gates.

## Final-head rule

This handoff/index update creates a later documentation-only head and therefore does not inherit `5ae30eb` workflow acceptance. The exact final branch-head workflow IDs and conclusions must be recorded in PR `#29` after branch movement stops. No additional repository commit should be created merely to copy those IDs back into Git.

## Hermes disposition

No ad hoc Hermes upstream check was required. The task did not touch watched Hermes runtime/image/profile/session/gateway/tool-discovery/UI boundaries, and final cutover head `d131dd09` already passed the scheduled/path-aware review. The production pin remains unchanged.

## Remaining next move

After final PR-head CI passes, keep PR `#29` in draft for human review. Phase 1.1 implementation remains next: recover broad-unit diagnostics, classify every failure, repair stale fixtures or real source defects, and make the aggregate trustworthy and green without weakening current contracts.
