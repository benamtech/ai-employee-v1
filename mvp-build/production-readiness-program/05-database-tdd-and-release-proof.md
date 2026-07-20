# Database TDD and Release Proof

Status: active database engineering policy  
Primary Standard clauses: `DTEP-10.1` through `DTEP-10.5`

## Principle

Database programming is normally reasoned about and verified through production-shaped, reproducible PostgreSQL tests. A constantly available live Supabase project is neither necessary nor desirable for each schema/query edit.

The inner loop is:

```text
write failing contract/integration test
→ apply complete migration ledger to disposable PostgreSQL
→ exercise positive and negative behavior
→ inspect query/concurrency effects
→ implement smallest coherent change
→ rerun full affected matrices
```

## Local and CI requirements

Every database-affecting task uses the applicable subset of:

- blank migration ledger through current head;
- existing-row/backfill compatibility;
- constraints, foreign keys, checks, triggers, indexes, and function behavior;
- RLS, grants, security-definer and Data API exposure;
- cross-account, cross-assignment, and cross-employee denial;
- concurrent inserts/claims/reservations/compare-and-swap updates;
- transaction rollback and crash/retry semantics;
- explain/query-plan evidence for material hot paths;
- migration filename and SHA-256 ledger binding.

Normal commands:

```bash
npm run test:worker-migrations
npm run test:integration
npm run test:production-boundary
npm run db:verify:worker-migrations
```

Environment-gated commands may require a disposable local PostgreSQL service. A skipped environment must be reported as skipped, not passed.

## When a real disposable Supabase project is required

Run release-bound Supabase proof when one or more conditions apply:

1. first release using a new migration class or security-sensitive schema boundary;
2. Auth, Realtime, Storage, Edge Functions, platform-managed roles, advisors, or Data API behavior is material;
3. RLS/grant/security-definer changes affect browser- or provider-reachable data;
4. a local PostgreSQL result may differ from Supabase platform behavior;
5. a platform defect is suspected;
6. final release candidate before deployment.

Do not require live Supabase merely because a SQL file changed.

## Release evidence

Release database proof records:

- disposable project/database reference;
- exact git SHA;
- migration range and per-file hashes;
- PostgreSQL/Supabase versions where exposed;
- advisor/security findings and dispositions;
- behavior matrix results;
- timestamps;
- whether production was mutated;
- retained artifacts and operator identity.

The accepted predicate is:

```text
full ledger applied exactly once
AND no unexpected advisor blocker
AND assignment/role isolation passes
AND artifact/approval/capability invariants pass
AND proof is bound to the release candidate
AND production_mutated = false
```

## Stop rules

Stop and escalate on:

- partial migration ledger;
- non-forward rewrite of an applied migration;
- malformed existing data that violates a new invariant;
- privilege escalation or cross-assignment visibility;
- security-definer search-path or ownership ambiguity;
- concurrency behavior that cannot be reproduced deterministically;
- release proof generated against another SHA;
- advisor finding without explicit disposition.

## What live testing cannot replace

A successful manual run against a hosted database does not replace:

- a regression test;
- a blank-ledger test;
- negative authorization tests;
- concurrency/race tests;
- rollback semantics;
- deterministic proof capture.

The release gate complements the TDD suite; it does not become the suite.
