# CODEGRAPH.md — AI Employee executable topology

Status: active source candidate; exact acceptance is owned by workflows and retained release records  
Updated: 2026-07-21  
Candidate: PR #36, branch `agent/ws08-ws09-production`, stacked on PR #35  
Source migration head: `0082`

This is the sole contributor-facing file that carries current product/workstream structure. Root and compatibility documents route here rather than duplicating it. Exact transient SHA, run number, and conclusion remain in GitHub Actions or retained evidence.

## Evidence headline

- PR #36 contains production-level WS-08 source closure, WS-09 capacity groundwork, and the computed UI projection consolidation.
- Source migrations extend through `0082`; application to managed Supabase remains a separate evidence class.
- `0077` makes the shared minute rate window database-owned; `0078` qualifies the conflict target; `0079` qualifies the subsequent rate-window update predicate and expression; `0080` adds the provider-neutral connector lifecycle, guided setup intents, capability projections, fail-closed revocation, and exact conversational decision context; `0081` normalizes verified reconnects, resets stale revocation/discovery projections, and records connected lifecycle receipts; `0082` serializes one SMS decision focus per owner assignment and attaches it atomically to the delivered work object.
- Manager compiles and runs from committed typed `apps/manager/src/server.ts`; generated-template and string-patch assembly remains structurally forbidden.
- The owner UI has one projection controller, one semantic compiler, one layout planner, one renderer registry, one WorkResource renderer, and one embedded-view compiler. Talk, Workspace, Review, MCP Apps, and UI Lab are projections rather than authority.
- Connector setup now uses one owner experience: AMTECH-managed authorization for supported providers and guided assignment-bound setup intents for long-tail systems. SMS remains a normal verified owner session; Hermes interprets natural language while Manager binds decisions to the exact immutable approval and effect.
- WS-08 source binds five exact-SHA image identities, signed release metadata, topology validation, deterministic failure/recovery states, database/filesystem/secret-version backup continuity, proof refinding, and fail-closed rollback compatibility.
- The exact-candidate workflow must pass Trace008/009 verification, governance, focused and broad source tests, typecheck/lint, blank-ledger PostgreSQL integration, all-workspace build, five image builds, digest inspection, and independent manifest verification after every candidate change.
- Managed database, live provider, target host, representative 64 GiB capacity, restore rehearsal, rollback rehearsal, pilot, deployment, and production remain separate gates.
- The public estimator is outdated and non-canonical.

## Product authority

- **Hermes:** reasoning, runs, sessions, runtime-local memory, and tool execution.
- **Manager:** identity, assignments, authority, capability/tool contracts, connector/provider custody, approvals, durable effects, shared commercial admission/accounting, reconciliation, repair, and proof.
- **Web/SMS/signed Review/MCP Apps/AG-UI:** role-safe projections, not authority.
- **PostgreSQL/Supabase:** shared durable identity, rate, budget, effect, receipt, accounting, lineage, reconciliation, and retry permission.
- **Host Provisioner:** sole Docker and bounded target-host lifecycle authority.

## Canonical work/effect transaction

```text
owner, ambient, scheduled, or delegated intent
→ exact account + employee + assignment + current authority/entitlement
→ immutable request or work revision
→ Hermes reasoning or deterministic Manager work
→ current effective capability
→ exact approval when required
→ finite request economics
→ atomic PostgreSQL rate token + worst-case budget reservation
→ one durable command/effect + provider idempotency identity
→ accepted | failed | ambiguous receipt
→ accepted effect-bound accounting receipt
→ output/publication bound to the same revision and effect
→ owner/operator proof projection
→ original-effect reconciliation or replay-safe projection repair
```

## Canonical connector transaction

```text
owner names or selects a business system
→ AMTECH-managed provider authorization or guided setup intent
→ Manager credential custody + exact assignment binding
→ provider-neutral capability discovery
→ harmless read/health proof
→ verified event ingress or controlled polling when supported
→ Hermes uses broad effective capabilities in normal work
→ delivered approval opens one atomic conversation focus for the verified owner
→ natural owner decision across web/SMS/voice for held consequential work
→ Manager revalidates exact principal + assignment + approval snapshot + effect
→ lifecycle/effect receipt projected to owner
→ revoke binding + credential reference + grant + capability projection
→ verified reconnect resets stale terminal state and requires fresh discovery
→ later events and tool use fail closed when the binding is not current
```

## Canonical UI projection transaction

```text
Manager durable truth + exact assignment authority
→ one semantic compiler
→ one deterministic layout planner
→ one renderer registry
→ WorkResource renderer or Manager-compiled embedded view
→ thin Talk / Workspace / Review / MCP Apps / UI Lab projection
→ finite action intersection
→ fresh Manager authorization
→ durable receipt and proof refresh
```

Production semantic compilation fails closed when authoritative `operating_state` is absent or scope-mismatched. Fixture demonstrations reuse the same compiler and renderer path but remain explicitly non-authoritative.

## Canonical release and recovery transaction

```text
exact Git SHA
→ five distinct OCI image identities
→ compose/config/migration/secret-version hashes
→ Ed25519 manifest + independent fingerprint verification
→ topology-complete health
→ deterministic fault state
→ operator terminality and safe next action
→ complete backup bundle
→ restore + durable-truth conservation + proof refinding
→ exact prior SHA rollback inside executable schema/config compatibility
→ accepted-work conservation
```

A running container without a healthy state is not healthy. Rollback never retags a release to a floating alias and blocks when the signed prior migration or configuration envelope does not match.

## Active source graph

```text
apps/manager/src/server.ts
  ├─ direct typed Manager route composition
  ├─ owner assignment/current authority interception
  ├─ assignment/version-scoped streams
  └─ no generated source or production string patching

packages/shared/src/adaptive-connector-runtime.ts
  ├─ provider-neutral connector/setup manifests
  ├─ adaptive business/workflow activation plan
  └─ natural approval interaction grammar, not a parallel authority engine

apps/manager/src/lib/connector-lifecycle.ts
  ├─ capability discovery and lifecycle snapshot
  ├─ guided long-tail setup intents
  └─ atomic assignment-scoped revoke projection

packages/db/migrations/0080_connector_operating_substrate.sql
  ├─ connector capability, lifecycle, setup-intent and decision-context records
  ├─ atomic revoke transaction
  └─ exact SMS-message-to-approval resolution transaction

packages/db/migrations/0081_connector_reactivation_normalization.sql
  ├─ verified reconnect normalization
  ├─ stale terminal/discovery projection reset
  └─ connected lifecycle receipt and guided-intent completion

packages/db/migrations/0082_atomic_sms_decision_focus.sql
  ├─ one open SMS focus per assignment-bound human
  ├─ advisory-lock and partial-unique race closure
  └─ supersede, open/replay and message attachment in one transaction

apps/manager/src/lib/channel-decisions.ts + webhooks/twilio.ts
  ├─ verified SMS principal and assignment
  ├─ multiple legitimate roles for one human principal
  ├─ atomic exact pending-approval conversation focus
  ├─ natural-language interpretation by Hermes
  └─ immutable Manager approval resolution without repeated challenges

apps/web/app/agent/[employeeId]/owner-projection-controller.ts
  ├─ sole owner EventSource lifecycle
  ├─ snapshot-before-delta scope installation
  └─ reconnect without intent replay

packages/shared/src/operating-projection.ts
  ├─ authoritative production-state validation
  └─ bounded fixture semantic compilation

packages/shared/src/operating-layout.ts
  └─ sole deterministic adaptive planner

apps/web/.../operating-renderer-registry.ts
  └─ sole operating-region registry

apps/web/.../components/WorkObjectRenderer.tsx
  └─ sole native work-resource renderer

apps/manager/src/lib/ui-resources.ts
  └─ sole embedded-view compiler and bounded authority projection

infra/scripts/release-manifest.mjs
  ├─ exact SHA + five image IDs
  ├─ compose/config/migration/secret-version identity
  └─ signed payload

infra/scripts/verify-release-manifest.mjs
  └─ external-key fingerprint, signature, repository and image recomputation

infra/scripts/backup-restore.mjs + restore-verify.mjs
  └─ database + filesystem + secret version + accepted-work + proof-refinding continuity

infra/scripts/deploy-rollback.mjs
  └─ signed exact prior release + migration/config compatibility + accepted-work conservation
```

## Decision topology

Trace008 and Trace009 keep non-interchangeable structures:

```text
candidate_graph.json
  vertices: candidate trajectories
  use: similarity, lineage, redundancy and selection sensitivity

software_invariant_hypergraph.json
  vertices: software entities, states and proof obligations
  use: touch, fractional, complete and independently proved coverage
```

All controls use the same feasible domain. Mandatory invariants are constraints. Pareto and evidence/invariants baselines own primary comparison in Trace009; weighted aggregation is sensitivity only. Representation is never proof, and causal improvement remains unestablished without independent outcomes.

## Source hubs and open gates

| Boundary | Source candidate | Still open |
|---|---|---|
| repository/source truth | Trace008/009/010, structural governance, direct typed Manager, singleton UI projection architecture, exact-candidate workflow | final exact-head workflow record and later release evidence |
| protocol/capability | current assignment/version interception; scoped streams; connector manifests/discovery; exact conversational decisions; embedded actions | live remote MCP/OAuth/provider/client lifecycle |
| database | forward migrations through `0082`, immutable ledger, blank-ledger and direct PostgreSQL contracts | managed Supabase migration, advisors, backup and rollback proof |
| release identity | five exact-SHA image definitions, signed manifest and independent verifier | trusted production signing authority and registry retention |
| target host/runtime | Host Provisioner-only Docker authority and lifecycle contracts | target-host secrets, isolation, replacement and recovery evidence |
| owner UI | one controller/compiler/planner/registry/render path; unified native/guided connector setup; evidence-gated connected state; constrained presentation coverage | fixture-free browser, accessibility, reconnect and cross-account acceptance |
| connectors/events | assignment-bound discovery, lifecycle receipts, setup intents, verified ingress, durable effects, revoke and reactivation projection | live OAuth consent, credential refresh/expiry, provider webhook delivery, provider-side revoke confirmation |
| SMS decisions | verified assignment-bound owner session, multi-role principal resolution, atomic exact approval focus and resolution bridge | live Twilio delivery and fixture-free conversational approval journey |
| restore/rollback | complete source transaction and fail-closed compatibility/conservation guards | destructive local rehearsal and target-host rehearsal |
| Model Gateway | database admission, one provider identity, validated bounds, reconciliation | provider sandbox idempotency and accepted-response-loss proof |
| WS-09 groundwork | queue/connection/SSE/fairness descriptors, saturation and pilot-stop schema | representative 64 GiB measurement, capacity and pilot acceptance |

## Active authority map

- `STANDARD.md` plus ratified amendments — normative requirements.
- `decision/protocol-v1.json` and `decision/trace008/` — WS-08 computation and implementation compression.
- `decision/trace009/` — UI architecture search, Pareto comparison, ADR and calibration artifacts.
- `decision/trace010/` — connector substrate evidence matrix and implementation decision.
- `production-readiness-program/README.md` — sole active production route.
- `production-readiness-program/10-test-suite-disposition.md` — test/evidence classification.
- `production-readiness-program/07-verification-and-handoff-matrix.md` — evidence/handoff boundary.
- `docs/architecture/` — current source-backed explanation.
- `memory/MEMORY.md` — sole handoff index.
- `second-half-plan/`, `GAPS.md`, and `REMEDIATION.md` — historical provenance only.

## Dependency order

1. Use the exact current candidate workflow record; stop downstream claims on any red job.
2. Apply and prove migrations through `0082` on a disposable managed platform.
3. Run provider-backed connector setup, harmless-use, event-ingress, natural-decision, revoke, reconnect, and post-revoke failure evidence.
4. Run provider-backed idempotency, ambiguity, original-effect, accounting and proof-refinding evidence.
5. Rehearse destructive fault, restore and rollback transactions without accepted-work loss.
6. Run fixture-free golden journeys, target-host isolation, accessibility and representative 25–30-runtime capacity.
7. Complete pilot, signed production release, deployment and production gates separately.
