# Phase 03: Channels Runtime Access

## Purpose
Expose channel/runtime/access state in UI Lab without giving the browser provider custody.
## Prerequisite Merged-Main Evidence
Phase 2 merged with exact-head route, variant, and no-credential evidence.
## Authority Queries
`repoctl query authority --entity Manager`; `repoctl query impact --path apps/web/app/api/employee`.
## Invariants
Manager authorizes every channel view; browser receives owner-safe summaries only.
## Source Entry Points
Owner projection stream, resources route, capability drawer, connection surfaces.
## In-Scope Paths
Web channel inspectors, owner-safe access summaries, tests, docs.
## Out-of-Scope Paths
OAuth flows, provider token display, Hermes endpoint exposure, migrations.
## Candidates And Rejected Alternatives
Candidate: derive from existing connection surfaces. Rejected: direct provider dashboards in browser.
## Maximum Patch Envelope
28 files across web UI, shared summaries, and focused tests.
## Effect Frontier
Connection surfaces, capability drawer, resource outputs, UI Lab navigation.
## Predictions And Falsifiers
Prediction: existing projections suffice. Falsifier: UI requires secret-bearing provider fields.
## Contracts And Tests
No browser-to-provider credentials, scope mismatch fail-closed, route authorization tests.
## Browser Acceptance
View channels for authorized employee; verify unauthenticated redirect and unauthorized fail-closed.
## Argv Verification
`npm run test:ui:contracts`; `npm run ui:lab:test`; `npm run typecheck --workspace @amtech/web`.
## Evidence Class
Maximum P3 until live provider acceptance is retained.
## Blockers
Missing owner-safe channel summary in current snapshot.
## Rollback
Hide Phase 3 nav and leave Phase 1/2 routes intact.
## Stop Conditions
Any token, provider URL, raw webhook, or unrelated tenant data reaches browser code.
## Docs Reconciliation
Update UI Lab README, ADR, CODEGRAPH, memory, and resolution ledger.
## Exact One-Line Future Prompt
Implement UI Lab Phase 3 channel/runtime/access inspectors from owner-safe projections only.
