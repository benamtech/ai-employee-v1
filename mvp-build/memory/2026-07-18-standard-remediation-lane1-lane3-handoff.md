# 2026-07-18 — Standard remediation checkpoint: Lane 1 integrated, Lane 3 contract/red boundary

## Branch and scope

- Integration branch: `employee-production-tuesday`
- Base: `research`
- Draft integration PR: `#23`
- Command board: issue `#25`
- `main` was not edited.
- Canonical normal-employee deployment path and free + $400 managed-workforce strategy remain unchanged.
- Public estimator remains outdated and non-canonical.

## Control layer completed

The approved Phase 2 remediation program is repository-native:

- `second-half-plan/phase-2-standard-remediation-execution.md`
- `validation/phase-2-remediation-vectors.json`
- `tests/unit/remediation-plan-integrity.test.ts`
- `.github/workflows/phase-2-remediation-plan.yml`

Plan-integrity Actions run `29638985374` passed. All 29 findings have one primary owner, explicit dependencies, measurable pass thresholds, and explicit failure conditions.

## Lane 1 checkpoint integrated

Lane branch/PR: `lane/relationships-auth`, PR `#24`.

Integrated commit: `b37d479a70983fcb3e88942b1f36481a07a97d17`.

Implemented:

- C1 labor/domain relationship schemas;
- C2 authorization request/decision schemas;
- organizations, human principals, employee principals, assignments;
- employment, management, supervision, custody, access, authority, payer, and beneficiary records;
- deterministic compatibility IDs and provenance;
- forward-only migrations `0039_labor_relationship_authorization_foundation.sql` and `0040_fix_assignment_authorization_policy_version.sql`;
- assignment-aware authorization helpers and initial `accounts`/`employees` RLS replacement;
- PostgreSQL integration matrix for account-membership denial, shared assignments, revocation/expiry, payer/beneficiary separation, cross-organization fail-closed policy, and resource grants.

Validation sequence:

- contract run `29639205042`: shared typecheck/build and contract invariants passed;
- required red run `29639386546`: failed because the canonical relationship tables were absent;
- first implementation run `29639524941`: 4/5 cases passed and exposed lifecycle-policy versus authorization-policy conflation;
- corrected green run `29639593725`: all five database behavior cases passed;
- integrated branch runs `29639654226` and `29639654276`: plan integrity and the existing production-boundary workflow passed, including migrations, builds, focused tests, and production Manager image build.

Status: `source-wired_ci-accepted_not-live-accepted` for this checkpoint.

Not closed:

- P0-001/P0-002 as a whole;
- assignment scoping for every active resource, route, SMS path, signed resource, connector, and admin path;
- real Supabase acceptance;
- browser/channel isolation;
- production migration/deployment;
- helper privilege-model review. The current helpers use narrowly scoped `SECURITY DEFINER` functions to avoid recursive RLS; this requires a non-recursive invoker-policy design or an explicit reviewed exception plus real Supabase proof.

## Lane 3 current state

Lane branch/PR: `lane/commands-effects`, draft PR `#26`.

Implemented so far:

- C3 shared contract distinguishing stable intent, immutable command, command claim, external effect attempt, accepted/failed/ambiguous receipt, reconciliation, and deterministic replay response;
- provider capability classes;
- contract invariant tests;
- PostgreSQL matrix covering stable-intent dedupe, payload conflict, 100 concurrent claims, effect reservation, receipt-before-success, deterministic replay, contradictory receipts, ambiguity, and lease reclaim.

Validation:

- contract portion of run `29639915565` passed shared typecheck/build and all six contract invariants;
- database portion failed before implementation because reusable kernel tables/functions are absent, with artifact `command-effect-matrix-29639915565`, digest `sha256:e686e08c62cf3cc4b2d5f8a924a5502c690c8792514afd736b791d04a43b2432`.

Important harness correction before SQL:

- the effect-reservation assertion currently assumes concurrent call index `0` wins;
- scheduler order is nondeterministic;
- the accepted invariant is one unique effect ID and exactly one `duplicate=false` reservation, regardless of which caller wins;
- correct this assertion and recapture the same missing-kernel red state before implementing migrations.

No durable command/effect kernel migration has been written or accepted.

## Current release truth

- Production Supabase still stops at `0031_public_estimator.sql`.
- No new runtime/provider/browser/SMS/voice/commercial/production acceptance was performed.
- Prior source/CI evidence remains at its recorded tier and is not promoted by this documentation update.
- The approved audit remains launch-blocking until every hard authority, isolation, durable-effect, protocol, migration, provider, and evidence gate closes.

## Next concrete move

On `lane/commands-effects`:

1. make the effect-reservation concurrency assertion scheduler-order-independent;
2. rerun and retain the exact missing-kernel red artifact;
3. only then implement the reusable intent/command/effect/receipt/replay ledger;
4. rerun the unchanged matrix until all cases are green;
5. do not weaken tests or claim consumer migration before approvals, onboarding, turns, provisioning, connectors, gateway, and delegation pass their own fault suites.