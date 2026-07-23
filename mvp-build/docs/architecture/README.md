# AMTECH AI Employee — Source-Backed Architecture

Status: current explanatory map; exact acceptance is tracked in [`../../CODEGRAPH.md`](../../CODEGRAPH.md)  
Updated: 2026-07-20

This directory explains executable architecture. It does not promote source, documentation, or decision computation into CI, managed database, provider, target-host, browser/channel, commercial, release, pilot, deployment, or production evidence.

## System boundary

- **Web:** employee operating environment—durable workspace, streaming conversation/activity, connected apps, approvals, artifacts, receipts, proof, and recovery.
- **Manager:** committed typed route composition owning identity, assignment, authority, context, capability/tool contracts, connector/provider custody, approvals, effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- **Hermes:** per-employee reasoning, runs, sessions, memory, runtime-local tool use, and runtime recovery.
- **Model Gateway:** assignment-scoped model effect, finite request economics, rate, budget, provider identity/receipt, accounting, ambiguity, and proof boundary.
- **PostgreSQL/Supabase:** durable identity, authority, idempotency, rate, budget, effects, accounting, lineage, and reconciliation.
- **Host Provisioner:** bounded target-host lifecycle authority.
- **Protocols/channels:** replaceable projections and transports; never authority.

## Canonical work/effect topology

```text
owner, ambient, scheduled, or delegated intent
→ exact account + employee + assignment + current authority/entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ finite request economics
→ database-owned rate + worst-case budget reservation
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ accepted effect-bound accounting receipt
→ output/publication bound to the same revision and effect
→ owner/operator proof projection
→ original-effect reconciliation or replay-safe projection repair
```

## Direct Manager composition

```text
apps/manager/src/server.ts
→ all workspace typechecks
→ tsc build
→ apps/manager/dist/server.js
→ package and Docker entrypoints
```

The previous template, generated source, generation hooks, and string-patch transforms were removed. Structural governance rejects their reintroduction.

## Projected action and stream authority

Protocol and UI projections carry claims; they do not create authority.

```text
owner session
→ exact account + employee + assignment
→ current non-revoked assignment authority version
→ projected assignment/version comparison
→ command/tool dispatch or scoped stream projection
```

Owner stream frames bind account, employee, assignment, authority version, and cursor. Progress subscriptions use the same account/employee/assignment scope, preventing cross-assignment projection.

## Architecture decision method

Architecture choices follow [`../../decision/README.md`](../../decision/README.md):

```text
authority/evidence/Unknown extraction
→ independent candidates
→ invariant/prerequisite filter
→ explicit evidence-and-invariants baseline
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
4. current assignment authority version before projected action dispatch or stream projection;
5. duplicate, stale, reordered, cross-account, and stale-assignment rejection;
6. connector custody, scope, health, revocation, and final effective-capability check;
7. approval bound to the exact revision;
8. finite token, timeout, price, and usage envelope;
9. database-owned rate and budget authority before dispatch;
10. one durable effect and provider identity;
11. ambiguity reconciliation before retry;
12. accepted effect-bound accounting and conservation;
13. output/effect/proof identity continuity;
14. repair without replaying accepted effect;
15. non-promoting evidence classes.

## Current source topology

```text
Web / SMS / signed Review
  └─ typed Manager owner/session/assignment/current-authority boundary
      ├─ Hermes runs and runtime-local tools
      ├─ connector registry + effective capability
      ├─ artifact revision + approval + publication effect
      ├─ Model Gateway admission + provider effect + accounting
      ├─ reconciliation + repair + proof projection
      └─ Host Provisioner bounded lifecycle

PostgreSQL/Supabase
  ├─ identity, assignment, and authority versions
  ├─ requests, work revisions, commands, effects, receipts
  ├─ database-owned rate windows, reservations, settlements, adjustments
  ├─ accounting, conservation, and lineage
  └─ ambiguity, reconciliation, repair, and proof projection
```

## Remaining architectural risks

- Managed-platform, provider, target-host, browser/channel, billing, recovery, and release behavior still requires external acceptance.
- Structural tests must not regain semantic responsibility that belongs in typed source and behavioral tests.
- Decision trace payloads should use compact descriptors and regenerated derivatives rather than opaque duplicated matrices.
- Exact transient candidate status must remain in workflow or release evidence, not mirrored across documents.
