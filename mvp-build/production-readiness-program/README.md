# AMTECH Production Readiness Program

Status: **active and canonical**  
Updated: 2026-07-23  
Structural status: [`../CODEGRAPH.md`](../CODEGRAPH.md)  
Decision state: [`../decision/active.json`](../decision/active.json)

This is the single active production-readiness route. Exact candidate conclusions belong to the current branch, workflows, or retained release/proof records. Historical plans, audits, completed traces, and ancestor results remain provenance only.

## Authority

```text
P0 representation calculation
P1 verified formal-model property
P2 verified representation correspondence
P3 exact-candidate executable evidence
P4 external or production acceptance
```

No class silently promotes itself. Provider and connector adapters do not create authority. Manager remains the authority plane; Hermes is the reasoning/runtime substrate; all UI and protocol surfaces are bounded projections.

## Current position

The current source candidate is `task/new-task-20260723` at `c83c23be7d9bc5c36c164579ff47c16c45bb97a0`. It includes typed Manager authority, migrations through `0082`, connector and commercial substrates, release/recovery machinery, the production owner projection, historical employee UI adapters/UI Lab/variants, Trace013’s repository-native software experiment compiler, Trace014 session bootstrap enforcement, Trace015 strategy/frontier artifacts, and Trace016 production runtime repair commits.

Trace016 produced retained P3 local mirror evidence but is not claimed as a finished repoctl transaction because its actual repair scope exceeded the admitted impact envelope. Trace017 is the current documentation and memory reconciliation transaction.

## Current production mirror checkpoint

Retained proof files for exact candidate `c83c23be7d9bc5c36c164579ff47c16c45bb97a0`:

- `../infra/proofs/prod-like-normal-up-2026-07-23T20-52-56-118Z.json`
- `../infra/proofs/production-normal-up-local-tunnel-2026-07-23T20-52-56-150Z.json`
- `../infra/proofs/deploy-smoke-2026-07-23T20-53-29-125Z.json`
- `../infra/proofs/prod-env-proof-2026-07-23T20-53-34-573Z.json`

The local mirror stack is healthy for Manager, Model Gateway, Web, Host Provisioner, Caddy, and Cloudflare tunnel containers. `../infra/deploy/.env.production` is present and must be used for production builds/live tests without printing values. Production Supabase migration status is fully applied through `0082`.

Production preflight is 6/9 runnable: Supabase, Manager, Model Gateway, Host Provisioner, Twilio Employee, and Twilio Test are runnable; Gmail, Stripe Connect, and QBO are blocked by missing callback/webhook/client envvars. The proof tier is `local_mirror`; target host, managed DNS/tunnel, provider journeys, backup/restore, destructive recovery, trusted signing, manual accessibility, capacity, pilot, deployment, and production remain P4 gates.

UI Lab is not authoritative for the next UI effort. Redesign UI Lab on a fresh branch with a new repoctl transaction after the current branch is merged and the merge commit is verified.

## Program route

1. `04-dependency-ordered-production-plan.md` — dependency order and stack checkpoint.
2. `08-production-issue-vector.json` — issue baseline.
3. `13-resolution-ledger.json` — resolution/control state.
4. `09-workstream-execution-map.md` — completion and stop contracts.
5. `20-ws06-ws08-commercial-effect-transaction.md` — durable effect/recovery transaction.
6. `10-test-suite-disposition.md` — test/evidence authority.
7. `07-verification-and-handoff-matrix.md` — evidence and handoff boundary.
8. `../decision/active.json` — transaction router.
9. `../decision/README.md` — executable experiment protocol.
10. `../decision/engine/` — generators, representations, certificates, task capsules, and trusted verifiers.
11. `../decision/trace007/` through `../decision/trace017/` — scoped decision and reconciliation records, with Trace016’s finish caveat retained.
12. current source, immutable migrations, tests, workflows, proof, and newest indexed memory.

## Current integration checkpoint

```text
keep task/new-task-20260723 pushed and exact-green
→ review/merge into main
→ verify the exact main merge commit
→ create a fresh UI development branch
→ repoctl start opens Trace018 or the next available transaction
→ redesign UI Lab from current product authority, not historical fixtures
→ cross managed provider/runtime P4 gates
```

No ancestor workflow certifies a descendant merge commit.

## Open P4 gates

- managed platform migration security/advisors, backup, restore, and rollback;
- live OAuth/MCP/provider authorization, idempotency, response-loss, revoke, outage, and repair;
- target-host secrets, two-employee isolation, destructive recovery, managed DNS/tunnel, and trusted signing;
- fixture-free Web/SMS/Review convergence and provider-backed golden work;
- supported browsers, human visual/accessibility, representative capacity, and fairness;
- controlled pilot, deployment, and production.

## Stop rules

- Run `repoctl start` before non-mechanical source edits.
- Do not weaken tests for green.
- Do not hand-author representations or weights to justify an intended patch.
- Do not demote valid formal proof of its exact property.
- Do not promote P1/P2/P3 into P4 without the missing evidence.
- Unknown is not zero.
- Ambiguous effects reconcile original identity before retry.
- Repair cannot erase accepted work or invent completion.
- Fixtures cannot satisfy fixture-free acceptance.
