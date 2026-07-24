# CODEGRAPH.md — AI Employee executable topology

Status: active cumulative source candidate with Trace019 repoctl engine differential-evaluation repair in progress; external acceptance remains open
Updated: 2026-07-23  
Candidate stack: `task/ui-lab-live-ae-phase-1-20260723` at `7fc40dc8dc7c60f3a8ec3e79dff59e6181566205` plus working-tree Trace018 candidate -> review/merge to `main` -> verify the merge commit
Source migration head: `0082`

This is the sole contributor-facing owner of current product and workstream structure. `authority-map.json` routes machine readers here. Exact transient SHA, run number, and conclusion remain in the current branch, workflows, or retained release evidence.

## Current state

- The current branch contains the post-main cumulative source candidate through Trace014, Trace015, Trace016 production-runtime repair commits, Trace017 authority reconciliation, Trace018 UI Lab Phase 1 live AE workbench source, and the Trace019 repoctl engine differential-evaluation repair candidate.
- Trace014 enforced the canonical session bootstrap. Trace015 generated the repair frontier and full-stack strategy map. Trace016 repaired the production Caddy/upstream/runtime test path and produced exact-candidate local mirror evidence, but its repoctl finish was blocked because the actual source repair exceeded the originally admitted patch envelope. Treat the source commits and proof files as P3 evidence; do not claim Trace016 lifecycle completion.
- Trace017 is the documentation and memory reconciliation transaction for the production-state candidate. Trace018 adds a live-first `/ui-lab` workbench for one Manager-authorized owner-visible AI Employee, using the existing owner session and owner projection stream, with fixtures only at `/ui-lab/fixtures`.
- Production envvars are present for deploy/prod tests in `infra/deploy/.env.production`; do not print values. The production database status check shows all migrations through `0082` applied.
- Production preflight with the production env loaded is 6/9 runnable. Gmail, Stripe Connect, and QBO remain blocked by missing provider callback/webhook/client envvars.
- Managed database acceptance, live provider acceptance, target-host destructive recovery, trusted signing/registry retention, fixture-free channels/golden work, manual accessibility, representative capacity, pilot, deployment, and production remain P4 gates.
- Fixture-era UI Lab artifacts remain historical. The current `/ui-lab` route is a bounded Web projection over Manager-owned authority and `ResourcePayload`; Trace018 evidence is P3 only and does not prove production or provider acceptance.
- The public estimator remains outdated and non-canonical.

## Exact production mirror evidence

Exact candidate: `c83c23be7d9bc5c36c164579ff47c16c45bb97a0`

Retained P3 proof files:

- `infra/proofs/prod-like-normal-up-2026-07-23T20-52-56-118Z.json`
- `infra/proofs/production-normal-up-local-tunnel-2026-07-23T20-52-56-150Z.json`
- `infra/proofs/deploy-smoke-2026-07-23T20-53-29-125Z.json`
- `infra/proofs/prod-env-proof-2026-07-23T20-53-34-573Z.json`

Current local mirror runtime observed healthy on 2026-07-23:

- `amtech-manager`
- `amtech-model-gateway`
- `amtech-web`
- `amtech-host-provisioner`
- `amtech-caddy`
- `amtech-tunnel`

The proof tier is `local_mirror`. The proof covers source/image/runtime wiring on the current host; it does not prove Caddy system activation, wildcard DNS-01, desired Cloudflare production state, backup/restore, red-health operations, egress policy, target host isolation, or external provider acceptance.

## Provider/runtime preflight boundary

Production preflight with `infra/deploy/.env.production` loaded reports 6/9 runnable:

- runnable: Supabase, Manager, Model Gateway, Host Provisioner, Twilio Employee, Twilio Test;
- blocked: Gmail missing OAuth/PubSub callback values; Stripe missing Connect client id; QBO missing OAuth/webhook verifier values.

Provider placeholders and skipped checks cannot be promoted to live acceptance.

## Product authority

- **Hermes:** reasoning, runs, sessions, runtime-local memory, and tool execution.
- **Manager:** identity, assignments, authority, capabilities, connector/provider custody, approvals, durable effects, commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI/UI Lab/UI variants:** bounded projections.
- **PostgreSQL/Supabase:** durable shared identity, rate, budget, effect, receipt, accounting, lineage, reconciliation, and retry permission.
- **Host Provisioner:** sole Docker and target-host lifecycle authority.

Provider and connector adapters do not create authority.

## Canonical work/effect transaction

```text
exact principal + assignment + current authority
→ immutable request/work revision
→ current capability and exact approval
→ database-owned rate and worst-case budget admission
→ one command/effect/provider idempotency identity
→ accepted | failed | ambiguous receipt
→ effect-bound accounting
→ output and owner/operator proof
→ original-effect reconciliation or projection repair
```

## Canonical experiment transaction

```text
exact Git SHA + task
→ content-addressed repository facts
→ authority DAG + dependency graph
→ genuine invariant hypergraph
→ P2 correspondence
→ P1 formal certificate when admitted
→ task diffusion + first-through-fourth-order effect frontier
→ task capsule + predictions + proof obligations
→ admitted plan before source edits
→ implementation
→ argv-based verification + P3 evidence ledger
→ prediction/outcome calibration
→ finished transaction
```

Canonical engine: `decision/engine/repoctl.mjs`  
Dialect registry: `decision/engine/representation-registry.json`  
Completed compiler implementation record: `decision/trace013/`

## Proof taxonomy

- `P0`: representation calculation or hypothesis.
- `P1`: verified property of an explicit formal model.
- `P2`: verified representation-to-repository correspondence.
- `P3`: executable evidence on the exact candidate.
- `P4`: external or production acceptance.

A checked eigenpair may be decisive proof of its declared operator property. No class silently promotes itself.

## Active source hubs

```text
apps/manager/src/server.ts
  direct typed Manager composition and authority interception

apps/manager/src/provisioner-host.ts
apps/manager/src/lib/hermes-client.ts
infra/compose/production.yml
infra/compose/topology-test.yml
infra/caddy/Caddyfile
infra/deploy/prod-like-up.sh
  production runtime topology, host lifecycle, Hermes path, and Caddy upstream wiring

infra/scripts/deploy-smoke.mjs
infra/scripts/prod-env-proof.mjs
infra/scripts/acceptance/
  deploy smoke, env proof, and provider/runtime preflight checks

packages/db/migrations/0077..0082
  rate authority, connector lifecycle, reconnect normalization,
  and atomic SMS decision focus

packages/shared/src/adaptive-connector-runtime.ts
apps/manager/src/lib/connector-lifecycle.ts
apps/manager/src/lib/channel-decisions.ts
  provider-neutral lifecycle and exact decisions

apps/web/app/agent/[employeeId]/owner-projection-controller.ts
packages/shared/src/operating-projection.ts
packages/shared/src/operating-layout.ts
  scoped owner stream and deterministic production projection

apps/web/app/ui-lab/
apps/web/app/_components/live-employee/
  Trace018 live-first UI Lab workbench, one Web-local owner projection controller,
  explicit fixture route, and route-backed live variant evidence

packages/shared/src/employee-ui-presentation.ts
apps/web/app/_components/employee-ui/EmployeeUiPort.tsx
apps/web/ui-variants/
ui-lab/README.md
  presentation adapters and fixture/variant source; fixtures remain secondary evidence

decision/engine/
  facts, dialects, transformations, certificates, task capsules,
  experiment chronology, differential evaluation, check/edit-guard context,
  evidence-class gates, queries, and trusted verifiers

infra/scripts/release-manifest.mjs
infra/scripts/verify-release-manifest.mjs
infra/scripts/backup-restore.mjs
infra/scripts/restore-verify.mjs
infra/scripts/deploy-rollback.mjs
  release identity, verification, recovery, and rollback guards
```

## Trace chain

- Trace007 — commercial/effect authority and computation baseline.
- Trace008 — release, recovery, rollback, and capacity groundwork.
- Trace009 — UI projection architecture search and calibration.
- Trace010 — connector operating substrate.
- Trace011 — employee UI port and presentation adapters.
- Trace012 — UI Lab and folder-first UI variants; historical and non-authoritative for the next redesign.
- Trace013 — repository-native software experiment compiler; completed.
- Trace014 — canonical session bootstrap enforcement; completed on branch lineage.
- Trace015 — repair frontier and feature/use strategy map; completed on branch lineage.
- Trace016 — production Caddy/upstream/runtime repair and local mirror proof; source/proof evidence retained, transaction finish not claimed.
- Trace017 — production-state documentation, authority, ledger, and memory reconciliation.
- Trace018 — UI Lab Phase 1 live-first owner-visible AI Employee workbench; P3 local source, contract, typecheck, unit, browser, and build evidence only.
- Trace019 — repoctl engine repair for evaluation-time fact re-derivation, command-bound hard-edge evidence, modern evidence non-promotion, retained overrides, external acceptance dialect, and non-mutating check; P3 local negative-suite evidence only until reviewed and accepted externally.

## Open gates

| Boundary | Current exact candidate evidence | Still open |
|---|---|---|
| repository/agent truth | routers, typed Manager, structural governance, compiler, P1/P2/P3 verifiers, current branch pushed | exact-head evidence on the eventual `main` merge commit |
| protocol/capability | current authority, scoped streams, connector lifecycle and exact decisions | live MCP/OAuth/provider lifecycle |
| database | migrations through `0082`; production Supabase status observed fully applied | advisors, existing-row behavior, backup, restore, rollback |
| release identity | current-SHA app images in the local mirror and previous signed manifest machinery | trusted signing, registry retention, production release record |
| target host/runtime | six-service local mirror healthy with Caddy upstream wiring and deploy smoke | production host secrets, isolation, destructive recovery, managed tunnel/DNS |
| owner UI/golden work | production projection, Trace018 live-first UI Lab Phase 1, explicit fixture route, effect/proof contracts | generated runtime, fixture-free channels, all three provider journeys |
| human/capacity/pilot | responsive surfaces, automation, fairness/pilot-stop schema | manual accessibility, 64 GiB capacity, pilot packet |

## Dependency order

1. Keep `task/new-task-20260723` pushed and exact-green.
2. Review and merge the branch into `main`.
3. Verify the exact `main` merge commit; no ancestor branch proof certifies that descendant.
4. For the next UI Lab phase, create a fresh task branch from merged main and run `repoctl start` before non-mechanical work.
5. Use `infra/deploy/.env.production` for production builds/live tests without printing values.
6. Cross the remaining P4 gates in dependency order.
