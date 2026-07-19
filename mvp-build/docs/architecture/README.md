# AMTECH AI Employee — Canonical Source-Backed Architecture

Status: **[VERIFIED] source map; [INCOMPLETE] live deployment acceptance**

This directory is the current human-readable architecture index for the AMTECH AI Employee product. It describes behavior present in source on `employee-production-tuesday`, separates implemented behavior from intended behavior, and points to the files that establish each claim.

The architecture is not a single agent process. It is a governed distributed system in which:

- **Web** presents owner, review, onboarding, and operator experiences.
- **Manager** owns identity, assignments, authority, context resources, tools, approvals, event routing, work materialization, durable commands, receipts, metering, and repair.
- **Hermes** supplies the per-employee reasoning runtime, session continuity, runs, tool use, memory, and runtime-local execution.
- **Model Gateway** is the employee-scoped model and commercial boundary.
- **Host Provisioner** is the only service with Docker-host authority.
- **PostgreSQL/Supabase** is the durable authority, event, commercial, evidence, and reconciliation substrate.
- **Caddy** is the public network ingress and per-employee reverse-proxy surface.
- **Provider adapters and the ambient inbox** convert at-least-once external events into verified, deduplicated, ordered, retryable work.

## Reading order

1. [`01-product-business-and-system-context.md`](01-product-business-and-system-context.md) — product purpose, actors, authority, commercial model, and system planes.
2. [`02-network-container-and-runtime-topology.md`](02-network-container-and-runtime-topology.md) — Docker, Caddy, loopback bindings, Unix socket, employee networks, Manager/Hermes communication, and trust boundaries.
3. [`03-ingress-events-ambient-inbox-and-egress.md`](03-ingress-events-ambient-inbox-and-egress.md) — provider ingress, verification, normalization, event routing, ambient inbox, effect receipts, retries, dead letters, and outbound effects.
4. [`04-hermes-context-capabilities-and-power-user-operation.md`](04-hermes-context-capabilities-and-power-user-operation.md) — Hermes sessions/runs, Manager MCP, business brain, context engineering, capability discovery, and power-user boundaries.
5. [`05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md`](05-web-client-work-surfaces-and-tool-agnostic-ag-ui.md) — operating surface, SSE, stable intents, materialization, generated UI, sandboxed intent protocol, and action authority.
6. [`06-effect-graphs-failure-semantics-and-observability.md`](06-effect-graphs-failure-semantics-and-observability.md) — effect chains, idempotency, receipts, ambiguity, compensation/repair boundaries, and observability.
7. [`07-emergent-product-capability-and-use-case-manifold.md`](07-emergent-product-capability-and-use-case-manifold.md) — source-grounded feature interactions, product experiences, and commercial capabilities.
8. [`08-repository-archaeology-audit-and-cleanup.md`](08-repository-archaeology-audit-and-cleanup.md) — exhaustive tracked-file inventory, relationship/effect extraction, defect taxonomy, cleanup, and artifact reproduction.
9. [`09-current-bug-risk-and-production-gap-register.md`](09-current-bug-risk-and-production-gap-register.md) — source-confirmed defects, incomplete production boundaries, live-proof requirements, and non-findings.
10. [`trajectories/README.md`](trajectories/README.md) — Θ-state, gradients, hard walls, pair/triple/four-dimensional paths, attractor navigation, and production acceptance equation.
11. [`11-agent-orientation-and-role-map.md`](11-agent-orientation-and-role-map.md) — coding-agent boot sequence, repository structure, roles, validation, handoff, and trajectory usage rules.
12. [`12-document-control-memory-and-handoff-map.md`](12-document-control-memory-and-handoff-map.md) — root/scoped CODEGRAPH division, all handoff families, implementation records, plan routing, and Markdown organization policy.
13. [`13a-complete-memory-handoff-catalog.md`](13a-complete-memory-handoff-catalog.md) — complete retained memory/handoff catalog and historical routing.
14. [`14-infrastructure-deployment-and-test-coverage-audit.md`](14-infrastructure-deployment-and-test-coverage-audit.md) — canonical-versus-legacy deploy topology, live-proof scripts, UI/browser evidence limits, missing tests, and dependency-ordered TDD path.
15. [`15-artifact-workbench-runtime-capability-and-golden-employees.md`](15-artifact-workbench-runtime-capability-and-golden-employees.md) — exact-image Hermes runtime contract, effective-capability evidence, signed connector return, immutable artifact revisions, and Website/Contractor/Bookkeeping golden journeys.

## Source authority order

When artifacts disagree, use this order:

1. applied migration sequence and source implementation;
2. generated production source and build/deploy configuration;
3. exact-SHA tests, workflow artifacts, and live acceptance records;
4. `STANDARD.md` and the active execution program for release requirements/order;
5. current root/scoped CODEGRAPHs and this architecture directory;
6. newest relevant memory handoff;
7. historical implementation records, wiki, plans, and archived packets.

`mvp-build/CODEGRAPH.md` is the current implementation navigation and checkpoint map. `memory/MEMORY.md` is the sole handoff index. This directory is the cross-sectional runtime/product map. None substitutes for exact deployed evidence.

## Verification tags

- **[VERIFIED]** — directly established by current source, migration, configuration, test, or named evidence.
- **[INFERRED]** — derived from at least two verified interacting dimensions and stated assumptions.
- **[HYPOTHESIS]** — testable outcome grounded in current source/loss structure.
- **[STALE]** — retained historical artifact or claim that no longer describes current source.
- **[INCOMPLETE]** — source-wired boundary lacking required implementation or live acceptance for its stated production use.
- **[UNVERIFIED]** — mechanical candidate or claim not yet confirmed by source-level intent and evidence.

## Canonical subsystem map

| Plane | Durable or executable authority | Primary source hubs | Current tag |
|---|---|---|---|
| Identity and assignment | users, principals, memberships, assignments, grants, policies | migrations `0039`, `0053`, `0064`–`0071`; `owner-assignment-authority.ts` | [VERIFIED] |
| Owner session | Supabase Auth → Manager-minted authority-versioned HttpOnly session | Web login route; `owner-session.ts`; `onboarding-identity-routes.ts` | [VERIFIED] |
| Command/effect | durable registration, claim, execution, terminal receipt | migration `0041`; `owner-turn-command.ts`; `owner-turn-repair.ts`; tool runtime | [VERIFIED] |
| Runtime provisioning | desired resource graph, reconciler, signed Unix-socket provisioner request | `provisioning-reconciler.ts`; `provisioner.ts`; `provisioner-host.ts`; `profile-renderer.ts` | [VERIFIED] source; [INCOMPLETE] deployed proof |
| Employee runtime | immutable rendered profile plus employee-scoped Hermes data/workspace | `profile-renderer.ts`; launcher; exact-image filesystem proof; `hermes-client.ts` | [VERIFIED] source; [INCOMPLETE] exact-image workflow result |
| Network ingress | public Caddy → host-loopback Web/Manager/employee gateways | production Compose; Caddyfile; `caddy-activation.ts` | [VERIFIED] source; [INCOMPLETE] target-host proof |
| Model/commercial | scoped token, assignment/payer/beneficiary/price, provider proxy, receipts | `model-gateway.ts`; `model-gateway-http.ts`; commercial migrations | [VERIFIED] core; [INCOMPLETE] cumulative budget/shared rate enforcement |
| Provider ingress | signature verification → ambient inbox or normalized event ingress | `webhooks/*`; `events/ingress.ts`; `ambient-inbox.ts` | [VERIFIED] source |
| Context | profile memory, business brain, live Manager resources, session recall | `profile-context.ts`; `business-brain.ts`; `mcp-server.ts`; `operating-surface.ts` | [VERIFIED] |
| Effective capabilities | runtime report ∩ dependency ∩ credential ∩ network ∩ policy ∩ connector ∩ live probe | `effective-capabilities.ts`; evidence table; live proof | [VERIFIED] decision contract; [INCOMPLETE] target-host reports |
| Artifact workbench | canonical artifact head, immutable revisions/validation, exact approval snapshot, effect/publication/verification receipts | migrations `0070`–`0071`; artifact services/tools; preview renderer | [VERIFIED] source; [INCOMPLETE] live golden proofs |
| Work materialization | snapshots → envelopes/resources/actions/capabilities/tasks/layout | strict stream; materialization; operating surface | [VERIFIED] |
| Generated UI | typed WorkView → Manager `ui://` resource → sandboxed host-routed intent | `ui-resources.ts`; generated-view contract; iframe/renderer | [VERIFIED] source; [INCOMPLETE] provider-backed live proof |
| Evidence and audit | hashes, audits, effect/provider/accounting receipts, work-run correlation | migrations; audit, metering, commercial attribution | [VERIFIED] source |
| Repository evidence | exact-head tracked-object inventory and graph bundle | archaeology script/workflow | [VERIFIED] |

## Non-negotiable invariants

1. **Manager owns authority.** Hermes can reason and call bound tools; it cannot choose account, employee, assignment, principal, payer, beneficiary, policy, or approval authority.
2. **Reads are not effects.** Owner-safe reads do not register durable commands. Authoritative read failures fail closed rather than becoming empty state.
3. **Consequential work uses command/effect and approval boundaries.** Customer-facing, monetary, destructive, credential, or broad external actions cannot be represented as successful without authority and a durable receipt.
4. **Provider master credentials stay outside employee profiles.** Employees receive scoped Manager MCP and Model Gateway credentials.
5. **Generated UI is presentation, not authority.** The host intersects iframe intents with bound `WorkResource.actions` and resolves the durable resource.
6. **External delivery is at least once; internal effects are idempotent and receipt-backed.** Dedupe, leases, retries, effect receipts, ambiguity, and dead letters are explicit.
7. **Documentation claims are exact-SHA claims.** CI success does not imply staging migration, provider acceptance, target-host network acceptance, or launch clearance.
8. **Trajectory artifacts are review aids.** They cannot override source, grant authority, or promote acceptance state.
9. **Historical handoffs remain historical.** Current state is routed through root/scoped CODEGRAPH, architecture, newest memory, and named proof.
10. **Artifacts are project context, not a second workflow engine.** The artifact row and revisions persist work product; assignment, approval, command/effect, connector, and provider systems retain authority.
11. **Capability advertisement is not capability truth.** A capability stays ineffective until its complete evidence intersection and live probe pass.
