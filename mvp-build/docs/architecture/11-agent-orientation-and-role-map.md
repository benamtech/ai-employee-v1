# 11 — Coding-Agent Orientation, Repository Roles, and Handoff Protocol

Status: **[VERIFIED] repository operating map**

This file is the operational entry point for coding agents working inside `mvp-build/`. It does not replace `AGENTS.md`, `CLAUDE.md`, `CODEGRAPH.md`, `STANDARD.md`, or durable memory. It explains how those layers fit together, how to select a role, and how to use the architecture and trajectory artifacts without turning them into a second source of truth.

## Mandatory cold-session boot sequence

Before planning or editing:

1. read `../../identity.md` for company/product operating identity;
2. read root `../../AGENTS.md` or `../../CLAUDE.md` and root `../../CODEGRAPH.md` for repository-wide boundaries;
3. read `../AGENTS.md` or `../CLAUDE.md` for implementation rules;
4. read `../CODEGRAPH.md` for the current implementation checkpoint and source hubs;
5. read `../memory/MEMORY.md`, then the newest relevant handoff;
6. read `../STANDARD.md` and the active execution plan;
7. read [`README.md`](README.md) in this architecture directory for the current cross-sectional runtime/product map;
8. read the applicable UX, deployment, subsystem, migration, test, and proof documents;
9. inspect the actual source, migrations, tests, generated-source inputs, workflow definitions, and current branch diff before making a claim.

Do not begin from an old memory file, screenshot, PR description, trajectory score, wiki plan, or test name without checking current source.

## Repository knowledge layers

| Layer | Purpose | Authority rule |
|---|---|---|
| source and migrations | executable behavior and durable schema | highest implementation authority |
| tests, workflows, proof artifacts | what was actually exercised on a named SHA | acceptance authority only for the named scope/SHA |
| `STANDARD.md` | non-waivable product/production requirements | release-policy authority |
| `CODEGRAPH.md` | current source hubs, dependencies, checkpoint history | navigation and state map; synchronize after major work |
| `docs/architecture/` | current cross-system structure, effects, risks, and interactions | source-backed explanatory layer |
| `docs/ux/` | owner experience doctrine, validation, research disposition | UX/product-decision layer; source still wins on implementation |
| `memory/` | dated handoffs, decisions, unresolved risks, next starting point | newest relevant session narrative |
| `wiki/MVP/implementation-records/` | durable factual implementation/proof history | historical evidence ledger |
| `second-half-plan/` | approved forward execution family | planning authority until superseded |
| `wiki/` and older docs | strategy, research, historical rationale | context only when current layers do not supersede it |
| trajectory artifacts | cross-dimensional dependency and bifurcation analysis | prioritization/review aid, never implementation or acceptance authority |

## Repository structure

### Root

- `identity.md` — AMTECH operating identity and product posture.
- `AGENTS.md` / `CLAUDE.md` — repository-wide working rules.
- `CODEGRAPH.md` — repository boundary, canonical product truth, integration status, and source-of-truth routing.
- `mvp-build/` — active AI Employee implementation.
- `wiki/` — strategy, historical rationale, research, and implementation records.
- `docs/` — supporting company/product/design documents outside the scoped build home.
- `local-prod/` and `scripts/local-prod/` — exact-SHA local-production orchestration/evidence.
- `.github/workflows/` — CI and release gates.

### `mvp-build/`

- `apps/manager/` — Manager HTTP surface, authority, tools, runtime adapters, workers, events, providers, provisioning, Model Gateway, evidence, and generated production server.
- `apps/web/` — owner, review, onboarding, admin, public, fixture-lab, and server-side Manager proxy surfaces.
- `packages/shared/` — cross-service schemas, contracts, finite vocabularies, identifiers, and proof types.
- `packages/db/` — Supabase/PostgreSQL clients, migrations, generated types, migration tooling.
- `packages/agent-template/` and `packages/profiles/` — Hermes profile packages, doctrine, skills, plugins, and render inputs.
- `infra/deploy/` — production Dockerfiles, Compose topology, environment templates.
- `infra/caddy/` — public ingress configuration.
- `infra/scripts/` — local, production, acceptance, repair, lifecycle, backup, DNS, capacity, and release operations.
- `tests/unit/` — source, schema, deterministic behavior, and contract gates.
- `tests/integration/` — PostgreSQL/concurrency/authority/effect matrices.
- `docs/architecture/` — current live map and production trajectory packet.
- `docs/ux/` — UX doctrine, system map, research ledger, implementation audit, validation policy, Hermes/UI findings.
- `memory/` — newest-first durable handoffs.
- `validation/` — machine-readable standards and acceptance vectors.
- `second-half-plan/` — current remediation/production sequence.

## Select one primary role per change

An agent may inspect across roles, but each implementation change must name one primary role and its dependency interfaces. This prevents broad edits from becoming an unreviewable second architecture.

### Role A — repository navigator / documentation archaeologist

Use when mapping source, reconciling docs, locating stale references, or preparing a handoff.

Read first:

- architecture `README.md`, `08-repository-archaeology-audit-and-cleanup.md`, root/scoped CODEGRAPH, memory index;
- `scripts/repository-archaeology-v2.mjs` and its exact-head workflow artifact.

May change:

- control docs, architecture docs, indexes, handoffs, provably orphaned artifacts.

Must not:

- delete a zero-inbound candidate without checking dynamic imports, scripts, package commands, workflow invocation, generated-file conventions, and historical evidence purpose;
- convert trajectory inference into implemented status.

Required output:

- exact files reviewed;
- source-confirmed discrepancies;
- updated navigation/indexes;
- explicit proof boundary.

### Role B — contracts / shared vocabulary

Use when changing schemas, finite action/view/event vocabularies, IDs, evidence envelopes, or cross-service DTOs.

Read first:

- `packages/shared/`, all consumers, generated source inputs, schema migrations, contract tests;
- W1 one-authority and generated-view congruence rules.

Must preserve:

- one canonical schema/registry per effect or view class;
- exhaustive compiler/renderer/test parity;
- backward compatibility or an explicit migration path.

Required proof:

- all consumers typecheck/build;
- representative fixtures/tests for every declared finite kind;
- packed-consumer/compatibility gates where applicable.

### Role C — database / authority / relationship engineer

Use when changing principals, assignments, grants, policies, approvals, command/effect, commercial attribution, RLS, leases, or receipts.

Read first:

- current migration head and applied-ledger policy;
- `STANDARD.md`, relationship/authorization CODEGRAPH sections, integration tests.

Must preserve:

- account membership is not employee authority;
- current exact assignment and policy are re-resolved at effect time;
- forward-only migrations;
- durable ambiguity and receipt-gated success;
- browser roles cannot call worker/service RPCs.

Required proof:

- blank PostgreSQL application through current head;
- relevant assignment/RLS/concurrency/revocation matrices;
- migration advisor/live proof before production claims.

### Role D — runtime / networking / provisioning engineer

Use when changing Docker, Caddy, Manager↔Hermes, Model Gateway, profile rendering, worker topology, lifecycle, or host operations.

Read first:

- architecture `02-network-container-and-runtime-topology.md` and `06-effect-graphs-failure-semantics-and-observability.md`;
- Compose, Dockerfiles, launcher, provisioner client/host, profile renderer, reconciler, live runbooks.

Must preserve:

- Caddy as public ingress;
- host-loopback publication and declared namespace reachability;
- one internal employee bridge with only scoped control peers;
- Docker socket only on Host Provisioner;
- signed Unix-socket control;
- provider master secrets outside employee profiles;
- Hermes as runtime substrate.

Required proof:

- source contracts and image inclusion;
- target-host network/isolation/teardown/replacement evidence for runtime acceptance;
- no cross-employee reachability.

### Role E — events / connectors / ambient inbox engineer

Use when changing webhooks, provider verification, normalization, dedupe, ordering, inbox workers, retries, effects, or dead letters.

Read first:

- architecture `03-ingress-events-ambient-inbox-and-egress.md`;
- event registry/ingress, ambient inbox, connector custody, provider adapters, effect receipts.

Must preserve:

- verify before durable insertion where provider authenticity is available;
- raw provider payloads/secrets do not enter owner/employee context;
- event dedupe is separate from effect idempotency;
- ambiguity is not success;
- ordering is scoped, not global.

Required proof:

- duplicate, out-of-order, binding-delay, worker-crash, retry, ambiguity, dead-letter, and replay matrices;
- live provider IDs before provider-accepted claims.

### Role F — Hermes / context / capability engineer

Use when changing sessions/runs, Manager MCP, profile memory, business brain, runtime capability/tool discovery, power-user behavior, or operator adapters.

Read first:

- architecture `04-hermes-context-capabilities-and-power-user-operation.md`;
- UX Hermes decision record;
- `hermes-client.ts`, `mcp-server.ts`, `profile-renderer.ts`, `business-brain.ts`, operating context source.

Must preserve:

- Manager authority over account/assignment/policy/effects;
- strict context reads;
- static profile identity separated from live Manager resources;
- observed capability is not authority;
- no direct browser-to-Hermes credentials;
- no process-local approval state as durable truth.

Required proof:

- exact runtime revision/capability observations;
- schema/registry/allowlist congruence;
- persisted effective-capability graph before broad operator adapters.

### Role G — owner UI / UX / generated-view engineer

Use when changing Web routes, operating layout, WorkResource rendering, approvals, signed Review, fixtures, accessibility, or generated UI.

Read first:

- `docs/ux/README.md`, current UX map, implementation coverage audit, research disposition;
- architecture `05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md`;
- design/interface/validation standards.

Must preserve:

- one stable owner operating point;
- typed work/risk state and explicit preferences only;
- stable landmarks, keyboard order, focus, 44px controls, reduced motion;
- host action intersection and exact durable resource IDs;
- fixtures visibly labeled and excluded from live acceptance;
- production protocol faults shown as faults, not synthesized plausible state.

Required proof:

- focused contracts;
- production Next build and standalone-server browser matrix;
- keyboard, target-size, overflow, responsive, reduced-motion, and accessibility evidence;
- provider-backed work-object proof for live generative UI claims.

### Role H — reliability / evidence / commercial engineer

Use when changing idempotency, receipts, budgets, rate limits, work runs, audits, recovery, proof indexes, or accounting reconciliation.

Read first:

- architecture `06-effect-graphs-failure-semantics-and-observability.md` and `09-current-bug-risk-and-production-gap-register.md`;
- command/effect, commercial, metering, audit, repair, and release-evidence code.

Must preserve:

- stable identity before effect;
- reserve/claim before dispatch;
- accepted receipt before success;
- payer/beneficiary/price attribution;
- ambiguity and compensation visibility.

Required proof:

- concurrency and crash-point matrices;
- provider/accounting reconciliation;
- cumulative budget and shared rate-limit proof where applicable;
- exact evidence IDs.

### Role I — deployment / release operator

Use when applying migrations, loading secrets, deploying images, configuring DNS/TLS, running live acceptance, rollback, or release attestation.

Read first:

- production runbook, architecture live map, risk register, trajectory attractor-navigation file, release evidence schema, current PR/head status.

Must preserve:

- one frozen exact SHA and image digest set;
- approved target coordinates;
- backup and rollback checkpoint;
- no fixture/manual-provider shortcuts;
- no production-ready claim from source/CI alone.

Required proof:

- migration ledger and advisors;
- secret manifest/rotation;
- target-host topology;
- identity/provider/runtime/browser/channel/commercial/crash/dead-letter/rollback evidence;
- signed deployment manifest.

### Role J — research / product trajectory analyst

Use when evaluating emergent capabilities, research concepts, or cross-feature dependencies.

Read first:

- architecture `07-emergent-product-capability-and-use-case-manifold.md`;
- `trajectories/` packet;
- UX research disposition;
- current source and risk register.

Must preserve:

- every interaction names at least two source-backed dimensions and concrete files/systems;
- every claim is tagged `[VERIFIED]`, `[INFERRED]`, or `[HYPOTHESIS]`;
- smooth cross-partials, gates, walls, and assumptions are stated honestly;
- no score promotes implementation or acceptance state;
- no research engine enters the production dependency graph without an explicit approved transition.

Required output:

- source/file interaction surface;
- current and target coordinates or state predicates;
- control intervention and blocking evidence;
- testable acceptance condition;
- disposition into current, production-blocking, post-release, or rejected basin.

## How trajectory artifacts are used

Trajectory artifacts are useful only for questions such as:

- Which prerequisite must move before this feature can become production-active?
- Which two source systems create the failure or product capability together?
- What phase transition makes a previously safe local implementation unsafe under live traffic, replicas, concurrency, or multiple tenants?
- Which hard invariant would a proposed change approach or cross?
- What evidence would distinguish the target basin from a narrative claim?

They must not be used to answer:

- What code currently executes? Read source.
- What schema is applied? Read the migration ledger and target database proof.
- Did a workflow pass? Read the exact-head Actions run.
- Is the product production-ready? Apply `STANDARD.md` and exact deployed evidence.
- May a user or employee perform an action? Resolve current identity, assignment, grant, policy, approval, and command/effect state.

A trajectory entry is considered actionable only when it contains:

1. at least two interacting source dimensions;
2. concrete source files, migrations, routes, or workflows;
3. current state and target predicate;
4. loss/gradient or explicit gate reasoning;
5. bifurcation/failure warning;
6. control intervention;
7. blockers;
8. an executable or live acceptance condition.

## Session execution protocol

### Before editing

- confirm repository, branch, PR, and current head;
- inspect staged/uncommitted/committed diff when using a local worktree;
- choose one primary role and list interacting roles;
- identify the nearest scoped instructions;
- identify implementation authority and acceptance authority;
- identify required validation before touching code.

### During editing

- keep changes dependency-ordered;
- update source and tests before claiming documentation state;
- correct stale tests/docs when they encode superseded behavior;
- avoid parallel implementations and duplicate registries;
- record newly discovered P0/P1 defects in the current risk register or handoff;
- use short exact commits and never force-update the integration branch.

### Before finishing

- run targeted tests, then all required integrated gates for the changed boundary;
- inspect failures rather than repeating stale pass counts;
- update nearest CODEGRAPH sections when source hubs, migrations, effects, or release state changed;
- update architecture/UX docs when the cross-system contract changed;
- write a dated memory handoff for substantial multi-file or architectural work;
- update `memory/MEMORY.md` newest-first;
- update the PR description/status when exact-head evidence changes;
- distinguish implementation proof SHA from later documentation-only SHAs;
- state every unrun or live-only gate explicitly.

## Handoff minimum

Every substantial handoff must provide:

```text
Repository / branch / PR / exact head
Primary agent role and interacting roles
Purpose and invariant
Files and migrations changed
Behavior before and after
Side effects and external boundaries affected
Validation commands and exact run IDs
Acceptance vocabulary achieved
Known failures and unresolved P0/P1 risks
Required next move and prerequisite order
Documentation/CODEGRAPH/memory/PR synchronization performed
```

## Anti-drift rules

1. Do not create a new root plan when an active plan family exists; amend or explicitly supersede it.
2. Do not create a new runtime, renderer, planner, event ledger, approval authority, or effect path to avoid understanding the existing one.
3. Do not use memory as code authority or source code as live-deployment proof.
4. Do not preserve stale status text merely because it is widespread; update canonical control documents and leave historical handoffs historical.
5. Do not make agent roles implicit. State the role, boundary, dependent systems, and validation surface in the handoff or PR.
6. Do not let trajectory/research terminology leak into owner UI or operational authority.
7. Do not claim the repository is understood from a directory tree alone; trace entrypoints, effects, durable state, runtime topology, tests, and proof.
