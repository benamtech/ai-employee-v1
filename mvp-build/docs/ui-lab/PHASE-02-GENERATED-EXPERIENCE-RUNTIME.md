# Phase 02: Generated Experience Runtime

## Purpose
Turn approved UI variants into a generated experience runtime without replacing `ResourcePayload`.
## Prerequisite Merged-Main Evidence
Trace018 merged to main with exact-head typecheck, UI contracts, architecture verifier, and no P4 promotion.
## Authority Queries
`repoctl query authority --entity ui-lab`; `repoctl query impact --path apps/web/app/_components/ui-variant`.
## Invariants
Manager owns authority; Web renders bounded projections; generated runtime cannot gain connector custody.
## Source Entry Points
`apps/web/app/_components/ui-variant`, `apps/web/ui-variants`, `packages/shared/src/ui-variant.ts`.
## In-Scope Paths
Generated runtime host, variant manifest contract, static safety checks, focused tests.
## Out-of-Scope Paths
Manager endpoints, Hermes protocol, migrations, provider credentials, deployment.
## Candidates And Rejected Alternatives
Candidate: extend `EmployeeExperienceModelV1`. Rejected: second employee model, raw provider payload rendering.
## Maximum Patch Envelope
30 files across web variant host, shared variant contract, tests, and docs.
## Effect Frontier
Variant host, reference client slot, intent bridge, UI registry, browser acceptance.
## Predictions And Falsifiers
Prediction: live and generated models share identity. Falsifier: a variant needs non-`ResourcePayload` employee data.
## Contracts And Tests
Typecheck shared/web, `test:ui:contracts`, variant standard tests, architecture verifier.
## Browser Acceptance
Open approved variant for one live employee and verify no fixture fallback or credential exposure.
## Argv Verification
`npm run typecheck --workspace @amtech/web`; `npm run test:ui:contracts`; `node scripts/verify-ui-architecture.mjs`.
## Evidence Class
Maximum P3 unless provider/deployment acceptance is separately retained.
## Blockers
Unclear generated runtime isolation, missing variant safety policy, need for Manager mutation.
## Rollback
Disable generated runtime route and fall back to Phase 1 reference client.
## Stop Conditions
Any need for new authority endpoint, browser credential custody, or fixture promotion.
## Docs Reconciliation
Implemented by Trace020 (`decision/trace020/`, `TRACE020-UI-LAB-PHASE2-GENERATED-RUNTIME`) from merged main `e5e36c5`. Policy owner is `packages/shared/src/ui-variant-runtime.ts`; decision record is `docs/adr/ADR-012-ui-lab-phase-2-generated-experience-runtime.md`; CODEGRAPH, `authority-map.json`, `decision/active.json`, and `memory/MEMORY.md` are reconciled to the same evidence.

Outcome against this contract:

- Blockers cleared: variant safety policy now exists as tiered admission, and generated-runtime isolation is enforced by capability-scoped projection plus the closed host-method union.
- Prediction held: live and generated models share one identity. The falsifier did not fire — no variant required non-`ResourcePayload` employee data.
- Evidence: P3. Focused contract suite, `test:ui:contracts`, architecture verifier, UI system validator, variant doctor, web typecheck, and `repo:verify:full` pass on the exact candidate.
- Blocked, not passed: the live-employee browser acceptance line. The only running stack is the production compose mirror and minting an owner session against it is outside the transaction's authority. Fixture-surface admission and unauthenticated live-surface fail-closed were proven in a real browser (`decision/trace020/browser-acceptance.json`).
- Nothing promoted: no variant manifest, preset, or fixture changed eligibility to satisfy admission.

## Exact One-Line Future Prompt
Implement UI Lab Phase 3 channel/runtime access by adding members to the Trace020 `UiVariantHostMethod` union without reopening admission or projection.
