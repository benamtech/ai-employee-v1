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
Update this doc, ADR, CODEGRAPH, and memory with exact evidence.
## Exact One-Line Future Prompt
Implement UI Lab Phase 2 generated experience runtime from merged Trace018, preserving ResourcePayload and Manager authority.
