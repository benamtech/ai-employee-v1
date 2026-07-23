# WS-01–07 Production Boundary Cleanup

Date: 2026-07-20  
Branch: `agent/ws06-ws07-production`  
Pull request: #35, stacked on PR #34  
Exact transient SHA and workflow conclusion: GitHub Actions record only

## Objective

Close locally provable WS-01 through WS-07 production-code loose ends without manufacturing managed, provider, host, browser, billing, pilot, deployment, or production evidence.

## Repository and build changes

- Replaced generated-and-patched Manager assembly with committed typed `apps/manager/src/server.ts`.
- Removed the server template, generated/promoted files, generator, stream patcher, admin patch block, generation hooks, generated package entrypoints, and generated Docker entrypoints.
- Added structural governance that fails if the mutation chain or `server.generated` entrypoints reappear.
- Made the focused workflow read-only, exact-branch-head scoped, and broad enough to trigger on all `mvp-build/**` changes.
- Preserved diagnostic artifacts without making artifact-service success the source of command truth.

## Protocol and owner boundary

- Restored current assignment-authority-version interception that had been silently lost when pretypecheck regeneration overwrote the historical patch output.
- Added typed `protocol-projection-authority.ts` and behavioral tests.
- Approval actions and owner-message actions reject incomplete, wrong-assignment, stale, revoked, or unavailable projected authority before effect dispatch.
- Owner streams load current assignment authority, emit cursor-bearing snapshots before deltas, and bind account, employee, assignment, and authority version to every projection.
- Progress subscriptions are account/employee/assignment scoped; unscoped or cross-assignment progress cannot reach the owner stream.

## Database and commercial boundary

- Advanced the immutable forward ledger through migration `0078`.
- Migration `0077` makes the shared minute rate window database-owned, so caller keys cannot shard rate authority.
- Replays ignore nonidentity rate-window, correlation, and reservation metadata while preserving the original reservation.
- Migration `0078` repairs the PL/pgSQL `RETURNS TABLE` conflict-target namespace collision forward-only using the named primary-key constraint.
- Commercial migration verification requires the forward repair and inspects the installed function definition.
- Staging migration proof and unit preflight derive the source head from the immutable ledger rather than hard-pinning a number.

## Model Gateway boundary

- Added validated request-envelope economics before admission:
  - bounded integer output tokens;
  - finite nonnegative price configuration;
  - bounded provider timeout;
  - safe finite reservation arithmetic.
- Invalid provider usage after apparent acceptance becomes durable ambiguity rather than false failure or `NaN` accounting.
- Accepted success still requires provider, effect, accounting, output, and proof continuity appropriate to the boundary.

## Decision and documentation correction

- Kept candidate topology separate from software-invariant topology.
- All controls use one feasible domain.
- Baseline membership, orientation, required/optional roles, exclusions, and semantic group weights are explicit.
- Trace007 uses 1,024 random feasible baselines, 32 search restarts, and 32 weight perturbations.
- Graph terms remain descriptive; diversity is at most selection-influencing; causal improvement remains unestablished.
- Active architecture, verification, test, transaction, resolution, and CODEGRAPH records were reconciled without duplicating transient SHAs or run conclusions.

## Exact locally available matrix

The focused candidate workflow runs:

```text
decision verifier
structural governance
all workspace typechecks
focused WS-01–07 production-boundary units
migration ledger and quick contracts
full repository verification
complete unit regression
all production workspace builds
blank-ledger migrations
commercial migration/security verifier
focused WS-07 PostgreSQL tests
complete PostgreSQL integration aggregate
```

Exact results belong to the workflow record for the branch head; this handoff does not carry them forward to later SHAs.

## Open evidence classes

- disposable managed Supabase migration, security, trigger, advisor, backup, and rollback proof;
- live remote MCP/OAuth and shipped connector lifecycle;
- live provider request identity, idempotency, timeout, accepted-response-loss, and original-effect reconciliation;
- payer, beneficiary, entitlement, invoice, refund, suspension, and reactivation lifecycle;
- fixture-free Website, Contractor Office, and Bookkeeping journeys with restart proof refinding;
- target-host secret custody, employee isolation, lifecycle replacement, fault injection, rollback, backup/restore, telemetry, and signed release;
- supported-browser/channel, accessibility, capacity/fairness, pilot, deployment, and production.

## Next safe action

Use the exact GitHub Actions result for the final branch head. If green, proceed to disposable managed-database and provider-backed reconciliation evidence. If red, stop downstream claims and fix the exact failing behavioral boundary without weakening assertions.
