# Phase 04: Recording Replay Launchers

## Purpose
Add recording, replay, and launcher workflows after live workbench contracts are stable.
## Prerequisite Merged-Main Evidence
Phase 3 merged with exact-head UI, authorization, and no-custody evidence.
## Authority Queries
`repoctl query authority --entity replay`; `repoctl query effects --depth 4`.
## Invariants
Replay is evidence, not authority; reconnect never replays owner intent; launchers cannot mint approvals.
## Source Entry Points
UI Lab provider, evidence ledger, browser scripts, variant collaborator launcher.
## In-Scope Paths
Recording schema, replay viewer, launcher wrappers, deterministic tests.
## Out-of-Scope Paths
Production replay storage, Manager mutation replay, provider effect replay.
## Candidates And Rejected Alternatives
Candidate: projection-only replay. Rejected: replaying POST `/message` or approval actions.
## Maximum Patch Envelope
35 files across UI Lab, scripts, tests, and docs.
## Effect Frontier
Provider event handling, browser evidence, fixtures, launcher scripts.
## Predictions And Falsifiers
Prediction: projection frames replay without owner-effect POSTs. Falsifier: replay needs a live action endpoint.
## Contracts And Tests
No replayed owner intents, ordered frames, scope-bound recordings, redaction checks.
## Browser Acceptance
Record and replay one authorized session projection; verify no network mutation during replay.
## Argv Verification
`npm run test:ui:contracts`; `npm run ui:lab:test`; `node scripts/verify-ui-architecture.mjs`.
## Evidence Class
Maximum P3; replay artifacts are not P4 live acceptance.
## Blockers
No durable replay store or redaction policy accepted.
## Rollback
Remove replay routes and keep live provider unaffected.
## Stop Conditions
Any replay writes to Manager, provider, database, or approval routes.
## Docs Reconciliation
Update ADR, UI Lab README, CODEGRAPH, and memory.
## Exact One-Line Future Prompt
Implement UI Lab Phase 4 projection recording, replay viewer, and launchers without replaying owner effects.
