# 2026-07-19 — Repository Archaeology, Architecture, Production Trajectories, and Agent Orientation

Status: **source-wired; final exact-head CI synchronization pending at initial write; not live-accepted; not launch-cleared**

## Repository state

- Repository: `benamtech/ai-employee-v1`
- Branch: `employee-production-tuesday`
- Base: `research`
- Draft integration PR: `#23`
- Migration head: `0069`
- `main` was not used or modified as an integration shortcut

## Primary agent role

Repository navigator / documentation archaeologist.

Interacting roles:

- runtime/network/provisioning;
- events/connectors/ambient inbox;
- Hermes/context/capabilities;
- owner UI/UX/generated view;
- reliability/evidence/commercial;
- deployment/release;
- research/product trajectory.

## Purpose

Create one source-backed live map for the complex Manager/Hermes/Web/PostgreSQL/Docker/event/UI product, close P0/P1 defects discovered through cross-file interaction review, replace stale duplicated current-state prose, account for every handoff/document family, and give future coding agents an explicit boot sequence, role map, proof vocabulary, and production trajectory.

## Source review performed

The pass began from the exact tracked-object archaeology bundle, then traced the highest-effect/highest-connectivity boundaries:

- production Compose, Dockerfiles, Caddy, employee launcher, Host Provisioner, profile renderer, runtime endpoints;
- Manager event registry/ingress, ambient inbox, employee events, provider adapters;
- Hermes client, Manager MCP, business brain, profile context, capability/toolset observation;
- strict employee snapshot/delta, operating-surface compiler, materialization, generated-view compiler, Web owner surface, iframe intent protocol;
- Model Gateway commercial/receipt path;
- root/scoped control docs, all memory handoff entries, implementation-record index, active/historical plan index, UX system map/coverage/research/Hermes findings.

The archaeology workflow reads every tracked Git object and emits exact-head file primitives, relationships, effects, defect candidates, and an exhaustion ledger.

## Code and configuration corrections

### Production network topology

Prior interaction defect:

- Caddy snippets targeted `localhost:<employee-port>` while production Caddy ran in a separate bridge namespace.
- production profiles targeted `amtech-model-gateway`, and Manager resolved `amtech-hermes-<employee_id>`, but Manager/Model Gateway were not attached to each employee bridge.

Corrections:

- production Caddy uses Linux host networking and host-loopback Web/Manager defaults;
- each employee receives one internal bridge;
- Manager and Model Gateway attach to that bridge with stable aliases;
- employee startup verifies Model Gateway and Hermes health from inside the runtime;
- local host-gateway mode remains separate;
- removal detaches shared control peers before removing the employee network;
- production-boundary and isolation tests encode the topology.

Files:

- `infra/deploy/docker-compose.production.yml`
- `infra/scripts/local/start-hermes-container.sh`
- `apps/manager/src/provisioner-host.ts`
- `tests/unit/production-boundary-source.test.ts`
- `tests/unit/model-profile-isolation.test.ts`

### Strict Manager context reads

Prior interaction defect:

- Manager MCP used the non-strict snapshot builder;
- business-brain employee/manifest/profile/fact/count reads discarded database errors;
- owner operating-surface auxiliary reads used the normal database client.

Corrections:

- Manager MCP builds strict employee snapshots;
- business-brain queries/counts/facts fail closed with labeled source boundaries;
- the operating-surface compiler receives the strict client;
- unit/source contracts require strict context entrypoints.

Files:

- `apps/manager/src/lib/mcp-server.ts`
- `apps/manager/src/lib/business-brain.ts`
- `apps/manager/src/lib/onboarding-identity-routes.ts`
- `tests/unit/employee-stream-strict.test.ts`

### Web operating-state protocol

Prior interaction defect:

- `AgentSurface` retains a compatibility fallback when `operating_state` is missing; useful for fixtures, but a successful production response without the field could become a plausible local interface.

Correction:

- the production resources proxy returns `503 operating_state_unavailable` when a successful Manager response lacks `operating_state`;
- fixture mode retains deterministic local state;
- the contract is included in UI and production-boundary gates.

Files:

- `apps/web/app/api/employee/[employeeId]/resources/route.ts`
- `tests/unit/web-operating-snapshot-contract.test.ts`
- `package.json`

### Repository cleanup

Removed:

- tracked Python bytecode cache;
- orphaned worktree Gitlink;
- superseded filesystem archaeology scanner.

Added ignores for:

- `__pycache__/` and Python bytecode;
- generated archaeology artifacts.

Files:

- `.gitignore`
- `.github/workflows/repository-archaeology.yml`
- `scripts/repository-archaeology-v2.mjs`

## Architecture/documentation overhaul

Created canonical architecture packet:

- `docs/architecture/README.md`
- `01-product-business-and-system-context.md`
- `02-network-container-and-runtime-topology.md`
- `03-ingress-events-ambient-inbox-and-egress.md`
- `04-hermes-context-capabilities-and-power-user-operation.md`
- `05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md`
- `06-effect-graphs-failure-semantics-and-observability.md`
- `07-emergent-product-capability-and-use-case-manifold.md`
- `08-repository-archaeology-audit-and-cleanup.md`
- `09-current-bug-risk-and-production-gap-register.md`
- `trajectories/` state/gradient/wall/pair/triple/four-dimensional/attractor packet
- `11-agent-orientation-and-role-map.md`
- `12-document-control-memory-and-handoff-map.md`

Updated:

- root `README.md`, `AGENTS.md`, `CLAUDE.md`, `CODEGRAPH.md`;
- scoped `README.md`, `AGENTS.md`, `CLAUDE.md`, `CODEGRAPH.md`;
- `docs/ux/04-implementation-coverage-audit.md`;
- `second-half-plan/README.md`;
- `wiki/MVP/implementation-records/README.md`;
- `memory/MEMORY.md` after this handoff.

## Document organization decision

No broad physical Markdown move was performed.

Reason:

- handoffs, implementation records, and plan documents are point-in-time evidence with many inbound links;
- directory names are not the primary source of confusion;
- stale status/routing and duplicated current-state prose were the defects;
- virtual organization through root/scoped CODEGRAPH, architecture, memory index, implementation-record index, and plan index preserves evidence while making cold starts deterministic.

Any future move requires complete inbound-reference rewrite, archive/index routing, and archaeology confirmation.

## Agent orientation outcome

Future agents now have:

- one mandatory cold-start chain;
- explicit repository/document authority classes;
- root/scoped CODEGRAPH division;
- one primary role requirement per substantial change;
- ten role definitions with source hubs, invariants, and required proof;
- an explicit trajectory-artifact usage contract;
- a handoff minimum and synchronization transaction;
- all durable handoffs classified and retained.

## Production trajectory outcome

The supplied Θ-current vector is preserved. The trajectory packet:

- states the normalized gradient convention and the fact that smooth cross-partials are zero for the supplied additive quadratic;
- models gates/walls/operational feedback separately rather than fabricating non-zero mathematical coupling;
- covers all ten requested pairs, six triples, and four four-dimensional trajectories;
- distinguishes `[VERIFIED]`, `[INFERRED]`, and `[HYPOTHESIS]`;
- binds every actionable trajectory to at least two source systems, a control intervention, blockers, bifurcation warning, and executable/live acceptance predicate;
- states the production acceptance equation and prevents trajectory scores from becoming implementation or release authority.

## Source-confirmed remaining P0 gates

1. Apply migrations `0032–0069` to the approved real Supabase target and run advisors/behavior matrices.
2. Establish managed production secret custody, least privilege, rotation, old-secret denial, and no-leak evidence.
3. Prove target-host Linux Caddy/Docker/employee-network topology, isolation, replacement, and teardown.
4. Capture live identity-provider verification/webhook and fixture-free canonical activation.
5. Capture one provider-backed typed generated work object through exact owner action, external effect, and complete proof.
6. Implement cumulative Model Gateway budget reservation/settlement.
7. Replace process-local rate limiting with shared atomic state.
8. Prevent blind provider retry after ambiguous timeout through provider idempotency or durable ambiguity/reconciliation.
9. Complete compensation/deterministic repair and crash-point fault acceptance.
10. Bind final release to exact SHA, image digests, migration ledger, secret manifest, runtime/profile versions, live proof IDs, and rollback attestation.

## P1/P2 product/UX/scale gates

- align public/create/claim/login/account/billing/customer/admin/artifact surfaces to the Avery owner system;
- improve context rationale, proof refinding, connector setup/repair, output parity, progress/interruption, and WCAG evidence;
- persist the complete effective-capability graph;
- define shared/fractional employee policy and broad role perspectives;
- prove fleet admission/capacity/fairness for 100–700 employees;
- design controlled connector-agnostic egress/MCP only behind custody, SSRF/DNS, assignment, rate/spend, revocation, and receipt controls.

## Validation

At initial handoff write:

- source contracts and branch workflows were running on the documentation head;
- no real Supabase, live provider, target-host, fixture-free channel, commercial, capacity, rollback, deployment, or launch proof was executed by this documentation session.

This handoff must be updated during final proof synchronization with:

- final exact branch SHA;
- exact workflow run IDs and conclusions;
- final archaeology object/file counts;
- any CI-discovered correction.

## Next concrete move

Complete exact-head CI. If green, synchronize final SHA/run IDs into this handoff, root/scoped CODEGRAPH, and PR `#23`. Then begin the production path at managed secrets + approved staging migrations + target-host topology, not another feature expansion.
