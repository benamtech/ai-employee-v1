# AMTECH AI Employee — Source-Backed Architecture

Status: current explanatory map; exact acceptance is tracked in [`../../CODEGRAPH.md`](../../CODEGRAPH.md)  
Updated: 2026-07-20

This directory explains executable architecture. It does not promote source, documentation, or decision computation into CI, managed database, provider, target-host, browser/channel, commercial, release, pilot, deployment, or production evidence.

## System boundary

- **Web:** employee operating environment—durable workspace, streaming conversation/activity, connected apps, approvals, artifacts, receipts, proof, and recovery.
- **Manager:** identity, assignment, authority, context, capability/tool contracts, connector/provider custody, approvals, effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- **Hermes:** per-employee reasoning, runs, sessions, memory, runtime-local tool use, and runtime recovery.
- **Model Gateway:** assignment-scoped model effect, rate, budget, provider identity/receipt, accounting, ambiguity, and proof boundary.
- **PostgreSQL/Supabase:** durable identity, authority, idempotency, rate, budget, effects, accounting, lineage, and reconciliation.
- **Host Provisioner:** bounded target-host lifecycle authority.
- **Protocols/channels:** replaceable projections and transports; never authority.

## Canonical work/effect topology

```text
owner, ambient, scheduled, or delegated intent
→ exact account + employee + assignment + authority/entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ atomic shared rate + worst-case budget reservation
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ accepted effect-bound accounting receipt
→ output/publication bound to the same revision and effect
→ owner/operator proof projection
→ original-effect reconciliation or replay-safe projection repair
```

## Architecture decision method

Architecture choices follow [`../../decision/README.md`](../../decision/README.md):

```text
authority/evidence/Unknown extraction
→ independent candidates
→ invariant/prerequisite filter
→ simple evidence-and-invariants baseline
→ candidate search topology when useful
→ software invariant topology when useful
→ equal-feasibility controls
→ search and weight sensitivity
→ separate implementation compression
→ complete behavioral proof plan
→ source change and exact verification
```

Candidate graph vertices are candidate trajectories. Software invariant hypergraph vertices are actual entities or obligations. Candidate-edge touch cannot establish software completion. Graph terms are descriptive; diversity is at most selection-influencing; causal improvement requires independent implementation outcomes.

COCONUT, continuous hidden-state reasoning, latent BFS, manifold, Hodge, Koopman, and phase-switching language is not an implemented architecture claim unless executable source and verification establish it.

## Hardened interception points

1. principal, account, employee, assignment, authority, and entitlement;
2. immutable request/work revision;
3. strict snapshot scope and cursor/version before deltas;
4. duplicate, stale, reordered, cross-account, and stale-assignment rejection;
5. connector custody, scope, health, revocation, and final effective-capability check;
6. generated/protocol actions re-enter Manager authority;
7. approval binds the exact revision;
8. shared database rate/budget admission precedes dispatch;
9. one durable effect and provider identity;
10. ambiguity reconciles before retry;
11. accepted effect binds accounting;
12. output/effect/proof identity remains continuous;
13. repair projects/refinds proof without replaying accepted effect;
14. evidence classes remain non-promoting.

## Current source topology

```text
Web / SMS / signed Review
  └─ Manager owner/session/assignment authority
      ├─ Hermes runs and runtime-local tools
      ├─ connector registry + effective capability
      ├─ artifact revision + approval + publication effect
      ├─ Model Gateway admission + provider effect + accounting
      ├─ reconciliation + repair + proof projection
      └─ Host Provisioner bounded lifecycle

PostgreSQL/Supabase
  ├─ identity and assignment
  ├─ requests, work revisions, commands, effects, receipts
  ├─ rate windows, reservations, settlements, adjustments
  ├─ accounting and lineage
  └─ ambiguity, reconciliation, repair, and proof projection
```

## Known architectural liabilities

- Production Manager assembly still uses generated server source and string-based patch transforms. Replace it with typed server composition before adding more semantic behavior there.
- Structural tests have historically carried transient document semantics; governance must stay structural and behavior must remain in Standard/source/migrations/tests.
- Decision trace payloads must use compact descriptors and regenerated derivatives rather than opaque duplicated matrices.
- Exact current status must remain in one place: `mvp-build/CODEGRAPH.md`.

## Reading route

1. `../../CODEGRAPH.md` — exact current topology and gates.
2. system/network/runtime documents.
3. ingress, events, egress, Hermes context, capabilities, and Web surfaces.
4. effects, failure, commercial state, reconciliation, and observability.
5. `09-current-bug-risk-and-production-gap-register.md`.
6. `11-agent-orientation-and-role-map.md`.
7. `12-document-control-memory-and-handoff-map.md`.
8. active production program and current transaction.

## Non-negotiable invariants

1. Manager owns authority, custody, commercial state, reconciliation, repair, and proof.
2. Hermes reasons within bound capabilities.
3. Unknown evidence remains Unknown.
4. Browser, channel, model, runtime, connector, or provider content cannot select authority, credentials, scopes, hosts, approvals, budgets, or effects.
5. Reconnect never resubmits accepted owner intent.
6. Shared rate and budget authority is database-backed, not process-local.
7. Consequential effects reserve once and end in accepted, failed, or ambiguous evidence.
8. Accepted success requires the receipts appropriate to the boundary.
9. Repair cannot erase accepted effects or invent completion.
10. Applied migrations are immutable and additions are forward-only.
11. Exact-candidate evidence controls every production claim.
