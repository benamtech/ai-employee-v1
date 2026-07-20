# Recent Change Reference Map

Status: **implementation and documentation traceability**

Every commit reference below uses the required 12-character SHA plus exact commit-message summary. Full SHAs remain available through Git history and PR `#23`.

## Production implementation chain

| Commit | Message | Exact repo artifacts | Production effect |
|---|---|---|---|
| `3b4918f3a1ca` | `fail closed when runtime capability evidence is stale` | `mvp-build/apps/manager/src/lib/tool-capability-catalog.ts` | Stale capability evidence cannot remain advertised as ready; age/staleness is projected into the owner catalog. |
| `21ad21c18a8e` | `fix capability connector action narrowing` | `mvp-build/apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx` | Replaces split nullable `setup`/`setupHref` state with one `CapabilitySetupAction { href, label } | null`. |
| `ff50b7d99b80` | `test capability connector action contract` | `mvp-build/tests/unit/capability-drawer-setup-contract.test.ts` | Locks the null-safe action invariant and excludes the prior broken render pattern. |
| `c6eb73f89878` | `advance production topology migration assertion through head 0072` | `mvp-build/tests/unit/production-topology-acceptance.test.ts` | Immediate correction after the production-boundary lane exposed a stale `0069` assertion. |
| `af5bc1cbf36f` | `assert strict reads cover capability enrichment and operating materialization` | `mvp-build/tests/unit/employee-stream-strict.test.ts` | Verifies strict database reads for capability catalog enrichment and enriched operating-state materialization. |
| `5b56e6a2249f` | `derive migration acceptance head from ledger` | `mvp-build/tests/unit/production-topology-acceptance.test.ts` | Removes the recurring hard-coded migration-test drift mechanism by deriving the expected head from `packages/db/migrations/`. |

## Schema and authority changes this plan depends on

| Migration | Exact SQL file | Contract introduced or hardened |
|---|---|---|
| `0070` | `mvp-build/packages/db/migrations/0070_effective_capabilities_and_artifact_revisions.sql` | Immutable artifact revisions/validations, artifact publication state, approval snapshot binding, artifact publish policy seed, and effective capability evidence. |
| `0071` | `mvp-build/packages/db/migrations/0071_artifact_policy_seed_and_contract_guards.sql` | Assignment-lifecycle artifact policy sync; role-specific owner surface actions; viewers remain read-only. |
| `0072` | `mvp-build/packages/db/migrations/0072_artifact_revision_scope_guards.sql` | Durable cross-row artifact/revision/validation/current-head scope guards and installation-time consistency checks. |

## Current code references

### Connector setup and owner UX

- `mvp-build/packages/shared/src/connector-setup.ts`
  - explicit Gmail and QuickBooks owner OAuth descriptors;
  - allowlisted OAuth hosts and scopes;
  - unresolved connector keys return no setup;
  - Stripe OAuth is intentionally absent.
- `mvp-build/apps/web/app/agent/[employeeId]/components/CapabilityDrawer.tsx`
  - `capabilitySetupAction` requires `availability === "needs_connection"`;
  - maps only communication/email to Gmail and accounting/QuickBooks to QuickBooks;
  - returns href and label together;
  - stages an editable employee instruction instead of executing a browser tool call.
- `mvp-build/apps/web/app/api/employee/[employeeId]/connect/[connector]/route.ts`
  - owner-safe connector resolution and redirect boundary.

### Capability truth and operating state

- `mvp-build/packages/shared/src/task-capabilities.ts`
  - tool-agnostic presentation contract across `manager_mcp`, `direct_mcp`, and `runtime_native`;
  - availability distinguishes ready, approval-gated, needs-connection, unverified, degraded, and unavailable;
  - evidence contains source references and staleness metadata;
  - matching does not create execution authority.
- `mvp-build/apps/manager/src/lib/tool-capability-catalog.ts`
  - compiles assignment-bound evidence into owner-safe capability descriptors;
  - stale evidence is fail-closed.
- `mvp-build/apps/manager/src/lib/onboarding-identity-routes.ts`
  - owner operating snapshot resolves assignment authority;
  - builds the snapshot, enriches it with a strict-read capability catalog, then materializes operating state through a strict client.

### Canonical deployment source

- `mvp-build/infra/scripts/production-topology.mjs`
  - compose authority: `infra/deploy/docker-compose.production.yml`;
  - services: Manager, Model Gateway, Host Provisioner, Web, Caddy;
  - control network: `amtech_control`.
- `mvp-build/infra/scripts/production-normal-up.mjs`
- `mvp-build/infra/scripts/prod-like-normal-employee-up.mjs`
- `mvp-build/infra/scripts/deploy-smoke.mjs`
- `mvp-build/infra/scripts/deploy-rollback.mjs`
- `mvp-build/tests/unit/production-boundary-source.test.ts`, describe `canonical production deployment topology`

These source references supersede the stale 2026-07-19 statement that production entrypoints still select legacy Compose. Source convergence is implemented; target-host proof remains open.

## Workflow references

### UI

- workflow file: `.github/workflows/ui-agent-operating-surface.yml`
- workflow name: `Agent Operating Surface Standard`
- job: `source-contracts`
- critical step: `Typecheck web`
- downstream job: `browser-fixture`
- critical step: `Run compiled adaptive fixture and product-shell browser matrices`

### Production boundary

- workflow file: `.github/workflows/employee-work-production-boundary.yml`
- workflow name: `Employee Work Production Boundary`
- job: `boundary`
- critical step: `Production boundary unit and source proofs`
- downstream step: `Production image inclusion`

## Historical evidence that must not be presented as current

- PR body head `289a1892918b` and migration head `0069` are stale.
- Handoff anchor `7492c52ba2db` is an earlier complete code/test matrix, not proof for later capability/artifact/migration changes.
- The old deploy-fork finding is closed in source but not yet target-host accepted.
- Fixture browser evidence does not prove real owner authentication, live SSE, OAuth provider completion, external effect receipts, or commercial reconciliation.

## Documentation commits in this packet

Documentation-only commits after the implementation anchor must be recorded separately from code/test proof. Do not imply that a plan-file commit inherits an ancestor workflow matrix. The final handoff must name both:

1. implementation anchor `5b56e6a2249f` and its applicable complete workflow matrix;
2. final documentation head and the workflows that actually ran on that documentation head.
